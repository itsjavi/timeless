/**
 * Checks authored markup against the component contracts.
 *
 * This exists because the library's authoring grammar is unusual enough that a coding agent's React
 * and Tailwind priors actively mislead it: it reaches for `<ui-button variant="primary">` when the
 * contract wants `<button class="ui-button" data-ui-variant="primary">`. Prose in a skill reduces
 * that; a check catches what prose misses.
 *
 * Lives in `scripts/` and reads `component-registry.mjs` directly, so it is plain JavaScript that any
 * node script can import and it ships in no package — `files` does not include `scripts`. That keeps it
 * out of the public API while three callers use it: the unit tests beside it, the canonical-example
 * sweep in `packages/examples/scripts/validate.mjs`, and the advisory agent eval. Whether it becomes a
 * published export, for the `validate_markup` tool of a future MCP server, is milestone 027's recorded
 * open decision.
 *
 * Not an HTML parser. It tokenises start tags and their attributes, which is all these rules need and
 * keeps the module dependency-free and runnable anywhere. Malformed markup is out of its remit;
 * `pnpm test:e2e` and the browser are authoritative for that.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { components } from './component-registry.mjs'

/**
 * What a finding can be:
 *
 * - `unknown-element` — a `ui-*` tag no custom element registers, usually a CSS component written as
 *   an element.
 * - `configuration-on-host` — `data-ui-*` on a custom-element host, which configures with plain
 *   attributes.
 * - `missing-data-ui-prefix` — a bare attribute on a class root whose contract spells it `data-ui-*`.
 * - `undeclared-attribute` — a `data-ui-*` attribute neither the root's nor the part's contract
 *   declares.
 * - `unpermitted-value` — a value the stylesheets do not implement.
 * - `boolean-with-value` — a presence-based attribute written with a value.
 * - `internal-attribute` — a private runtime hook written by hand.
 * - `missing-accessible-name` — a root whose exposed role cannot take its name from its content.
 * - `role-forbids-relationship` — an authored role that cannot carry an ARIA relationship the
 *   component needs to wire, so the component correctly declines to write it.
 *
 * @typedef {'unknown-element' | 'configuration-on-host' | 'missing-data-ui-prefix'
 *   | 'undeclared-attribute' | 'unpermitted-value' | 'boolean-with-value' | 'internal-attribute'
 *   | 'missing-accessible-name' | 'role-forbids-relationship'
 * } MarkupFindingKind
 *
 * @typedef {{ kind: MarkupFindingKind, tag: string, attribute?: string, message: string }} MarkupFinding
 */

/**
 * The roles that can carry `aria-activedescendant`, read out of `src/listbox.ts` rather than copied,
 * so the checker and the runtime cannot disagree about which roles work. Reading authored TypeScript
 * as text is the same approach `generate-elements.mjs` and `check-core-boundary.mjs` take to
 * `src/tokens.ts`, and like them this throws rather than silently checking against an empty set.
 */
const activeDescendantRoles = readActiveDescendantRoles()

function readActiveDescendantRoles() {
  const source = readFileSync(resolve(import.meta.dirname, '../src/listbox.ts'), 'utf8')
  const body = /const ACTIVE_DESCENDANT_ROLES = new Set\(\[([\s\S]*?)\]\)/.exec(source)?.[1]
  const roles = new Set([...(body ?? '').matchAll(/'([a-z]+)'/g)].map((match) => match[1]))
  if (roles.size === 0) {
    throw new Error('Could not read ACTIVE_DESCENDANT_ROLES from src/listbox.ts')
  }
  return roles
}

const contracts = components

/** Root name to contract, looked up with tag and class names tokenised out of authored markup. */
const classRoots = new Map(
  contracts
    .filter((contract) => contract.root.kind !== 'element')
    .map((contract) => [contract.root.name, contract]),
)

const elementTags = new Map(
  contracts
    .filter((contract) => contract.root.kind === 'element')
    .map((contract) => [contract.root.name, contract]),
)

/**
 * Attributes declared on a part, keyed by part name. Two components declaring the same part name
 * declare the same attributes on it — `option` is shared by all three collections through one
 * registry helper — so a flat map is enough and a part token does not need its owning component
 * resolved from the markup, which this tokeniser could not do anyway.
 */
const partAttributes = new Map()
for (const contract of contracts) {
  for (const part of contract.parts) {
    if (part.attributes.length === 0) continue
    const declared = partAttributes.get(part.name) ?? new Map()
    for (const attribute of part.attributes) declared.set(attribute.name, attribute)
    partAttributes.set(part.name, declared)
  }
}

/** Every attribute name any part declares, for telling a misplaced one from an unknown one. */
const allPartAttributeNames = new Set(
  [...partAttributes.values()].flatMap((declared) => [...declared.keys()]),
)

const START_TAG = /<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)\/?>/g
const ATTRIBUTE = /([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g

/** @typedef {{ name: string, value: string | null }} Attribute */

/** @returns {Attribute[]} */
const parseAttributes = (source) => {
  const found = []
  for (const match of source.matchAll(ATTRIBUTE)) {
    const [, name, doubled, singled, bare] = match
    if (!name) continue
    const value = doubled ?? singled ?? bare ?? null
    found.push({ name: name.toLowerCase(), value })
  }
  return found
}

/** The `ui-*` root classes on an element, in author order. */
const rootClasses = (attributes) => {
  const classAttribute = attributes.find((attribute) => attribute.name === 'class')
  if (!classAttribute?.value) return []
  return classAttribute.value.split(/\s+/).filter((token) => classRoots.has(token))
}

/** The `data-ui-part` tokens on an element, in author order. */
const partTokens = (attributes) => {
  const part = attributes.find((attribute) => attribute.name === 'data-ui-part')
  if (!part?.value) return []
  return part.value.split(/\s+/).filter(Boolean)
}

/**
 * Value and presence rules for one declared attribute. Shared by both kinds of root, because a
 * boolean is presence-based and a value set is closed wherever the attribute is authored.
 */
function checkDeclaredValue(tag, attribute, declared) {
  if (declared.type === 'boolean') {
    /* `attr` and `attr=""` are both presence. Anything else contradicts the contract. */
    return attribute.value === null || attribute.value === ''
      ? []
      : [
          {
            kind: 'boolean-with-value',
            tag,
            attribute: attribute.name,
            message: `${attribute.name} is presence-based: author it with no value, or omit it. Remove ="${attribute.value}".`,
          },
        ]
  }

  if (!declared.values || attribute.value === null) return []
  return declared.values.includes(attribute.value)
    ? []
    : [
        {
          kind: 'unpermitted-value',
          tag,
          attribute: attribute.name,
          message: `${attribute.name}="${attribute.value}" is not implemented. Permitted: ${declared.values.join(', ')}.`,
        },
      ]
}

/**
 * Every finding in a markup string, in document order. An empty array means the rules all pass.
 *
 * @param {string} markup
 * @returns {MarkupFinding[]}
 */
export function checkMarkup(markup) {
  /** @type {MarkupFinding[]} */
  const findings = []

  for (const tagMatch of markup.matchAll(START_TAG)) {
    const tag = (tagMatch[1] ?? '').toLowerCase()
    const attributes = parseAttributes(tagMatch[2] ?? '')

    for (const attribute of attributes) {
      if (attribute.name.startsWith('data-ui-internal-')) {
        findings.push({
          kind: 'internal-attribute',
          tag,
          attribute: attribute.name,
          message: `${attribute.name} is a private runtime hook. Never author it and never style it.`,
        })
      }
    }

    /*
     * Resolved before either loop below, because an element can be a part and a root at once —
     * `<div class="ui-card" data-ui-part="option">` — and then each loop has to know what the other
     * one owns, or a valid part attribute reads as undeclared configuration on the root.
     */
    const tokens = partTokens(attributes)
    const declaredByPart = new Map(
      tokens.flatMap((token) => [...(partAttributes.get(token) ?? [])]),
    )

    const hostContract = elementTags.get(tag)

    if (tag.startsWith('ui-') && !hostContract) {
      const asClass = classRoots.has(tag)
      findings.push({
        kind: 'unknown-element',
        tag,
        message: asClass
          ? `${tag} is a CSS component, not a custom element. Author a native element with class="${tag}" and configure it with data-ui-* attributes.`
          : `No Timeless custom element is registered as ${tag}.`,
      })
    }

    if (hostContract) {
      const declared = new Map(hostContract.attributes.map((entry) => [entry.name, entry]))
      for (const attribute of attributes) {
        /* `data-ui-part` is legitimate anywhere: a host can be a part of its parent component. */
        if (attribute.name.startsWith('data-ui-') && attribute.name !== 'data-ui-part') {
          const plain = attribute.name.slice('data-ui-'.length)
          findings.push({
            kind: 'configuration-on-host',
            tag,
            attribute: attribute.name,
            message: declared.has(plain)
              ? `Configure <${tag}> with the plain attribute ${plain}, not ${attribute.name}.`
              : `<${tag}> is configured with plain attributes. data-ui-* is for CSS components.`,
          })
          continue
        }
        const match = declared.get(attribute.name)
        if (match) findings.push(...checkDeclaredValue(tag, attribute, match))
      }
    }

    for (const rootClass of rootClasses(attributes)) {
      const contract = classRoots.get(rootClass)
      if (!contract) continue
      const declared = new Map(contract.attributes.map((entry) => [entry.name, entry]))

      for (const attribute of attributes) {
        if (attribute.name === 'data-ui-part') continue

        if (attribute.name.startsWith('data-ui-')) {
          const match = declared.get(attribute.name)
          if (!match) {
            /* Another root on the same element may own it — a Field can carry a Group's attribute. */
            const ownedElsewhere = rootClasses(attributes).some((other) =>
              classRoots.get(other)?.attributes.some((entry) => entry.name === attribute.name),
            )
            if (!ownedElsewhere && !declaredByPart.has(attribute.name)) {
              findings.push({
                kind: 'undeclared-attribute',
                tag,
                attribute: attribute.name,
                message: `${rootClass} does not declare ${attribute.name}.`,
              })
            }
            continue
          }
          findings.push(...checkDeclaredValue(tag, attribute, match))
          continue
        }

        /* A bare `variant` where the contract spells it `data-ui-variant` is the React prior showing. */
        if (declared.has(`data-ui-${attribute.name}`)) {
          findings.push({
            kind: 'missing-data-ui-prefix',
            tag,
            attribute: attribute.name,
            message: `${rootClass} is configured with data-ui-${attribute.name}, not ${attribute.name}.`,
          })
        }
      }
    }

    /*
     * Per-item attributes are declared on the part, so neither loop above can reach them: an option
     * carries no root class and is no host. Without this, `data-ui-valeu` on an option is silent
     * while `data-ui-varaint` on a root is caught — and a silent one costs a submitted form value.
     */
    if (tokens.length > 0 && !hostContract) {
      /* With a root class present, the loop above already reports whatever nothing declares. */
      const rootReports = rootClasses(attributes).length > 0

      for (const attribute of attributes) {
        if (attribute.name === 'data-ui-part') continue
        if (!attribute.name.startsWith('data-ui-')) continue
        /* Already reported once, for every element, by the internal-hook sweep at the top. */
        if (attribute.name.startsWith('data-ui-internal-')) continue

        const match = declaredByPart.get(attribute.name)
        if (match) {
          findings.push(...checkDeclaredValue(tag, attribute, match))
          continue
        }
        if (rootReports) continue

        findings.push({
          kind: 'undeclared-attribute',
          tag,
          attribute: attribute.name,
          message: allPartAttributeNames.has(attribute.name)
            ? `${attribute.name} is not declared on ${tokens.map((token) => `\`${token}\``).join(' or ')}.`
            : `${attribute.name} is declared by no part or root on this element, so nothing reads it.`,
        })
      }
    }
  }

  /*
   * A Select trigger is the combobox, per the APG Select-Only Combobox pattern the component declares,
   * and Timeless writes `role="combobox"` onto it. That role does not take its accessible name from
   * its content — measured in Chromium, the same button computes "Ready" as a button and "" as a
   * combobox — so a trigger carrying only text is a nameless control. Timeless wires relationships and
   * never content, so it cannot supply the name; the author has to.
   */
  const TRIGGER_TAG = /<[a-z][a-z0-9-]*\b[^>]*\bdata-ui-part\s*=\s*"[^"]*\btrigger\b[^"]*"[^>]*>/i
  for (const hostMatch of markup.matchAll(/<ui-select\b[\s\S]*?(?:<\/ui-select>|$)/gi)) {
    const triggerTag = hostMatch[0].match(TRIGGER_TAG)?.[0]
    if (!triggerTag) continue

    /*
     * An authored `role` wins over the `combobox` the enhancement would apply, and
     * `syncListboxActiveDescendant` then declines to write `aria-activedescendant` onto a role that
     * forbids it — writing an invalid attribute would be worse than writing none. That leaves the
     * author with a Select whose active option is never announced and nothing saying why, which is
     * this finding's whole job.
     */
    const authoredRole = triggerTag.match(/\srole\s*=\s*"([^"]*)"/i)?.[1]
    if (
      authoredRole !== undefined &&
      !authoredRole
        .trim()
        .split(/\s+/)
        .some((token) => activeDescendantRoles.has(token))
    ) {
      findings.push({
        kind: 'role-forbids-relationship',
        tag: 'ui-select',
        attribute: 'role',
        message: `The Select trigger has role="${authoredRole}", which cannot carry aria-activedescendant, so the active option is never announced. Use one of ${[...activeDescendantRoles].sort().join(', ')}, or drop the role and let Timeless apply combobox.`,
      })
    }

    if (/\saria-labelledby\s*=/i.test(triggerTag)) continue
    if (/\saria-label\s*=/i.test(triggerTag)) continue
    findings.push({
      kind: 'missing-accessible-name',
      tag: 'ui-select',
      message:
        'The Select trigger needs aria-labelledby or aria-label. Timeless gives it role="combobox" for the Select-Only Combobox pattern, and that role does not take its name from its content.',
    })
  }

  return findings
}
