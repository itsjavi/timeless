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
import { components } from './component-registry.mjs'

/**
 * What a finding can be:
 *
 * - `unknown-element` — a `ui-*` tag no custom element registers, usually a CSS component written as
 *   an element.
 * - `configuration-on-host` — `data-ui-*` on a custom-element host, which configures with plain
 *   attributes.
 * - `missing-data-ui-prefix` — a bare attribute on a class root whose contract spells it `data-ui-*`.
 * - `undeclared-attribute` — a `data-ui-*` attribute the root's contract does not declare.
 * - `unpermitted-value` — a value the stylesheets do not implement.
 * - `boolean-with-value` — a presence-based attribute written with a value.
 * - `internal-attribute` — a private runtime hook written by hand.
 *
 * @typedef {'unknown-element' | 'configuration-on-host' | 'missing-data-ui-prefix'
 *   | 'undeclared-attribute' | 'unpermitted-value' | 'boolean-with-value' | 'internal-attribute'
 * } MarkupFindingKind
 *
 * @typedef {{ kind: MarkupFindingKind, tag: string, attribute?: string, message: string }} MarkupFinding
 */

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
            if (!ownedElsewhere) {
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
  }

  return findings
}
