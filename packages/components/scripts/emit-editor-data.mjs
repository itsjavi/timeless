/**
 * Editor data for plain HTML and CSS, generated from the component registry.
 *
 * TypeScript reaches React, Preact, Solid, Vue, and Svelte. It does not reach a `.html` file, an
 * Astro template, or the markup half of a `.vue` or `.svelte` file, and those are the surfaces this
 * library is designed to be authored in. VS Code custom data and JetBrains web-types cover them.
 *
 * The asymmetry this cannot fix: a `ui-*` tag is a tag, so an editor can complete it and its
 * attributes precisely. A CSS-only component is a `class` plus `data-ui-*` on a native tag, and the
 * only hook available there is a global attribute that would apply to every element in the document
 * and merge the values of every component that shares the attribute name. Declaring
 * `data-ui-variant` globally would offer Card's `filled` inside a `<button class="ui-button">`, so
 * it is deliberately not declared. `@timelessui/components/attributes` is the typed answer for that
 * half of the library.
 */

import { valueSets } from './component-registry.mjs'

const REFERENCE = {
  name: 'Component reference',
  url: 'https://timeless.build/docs/components/',
}

/** One VS Code value set per registry value set, so an attribute references a list it never copies. */
function valueSetEntries() {
  return Object.entries(valueSets).map(([name, set]) => ({
    name,
    values: set.values.map((value) => ({ name: value })),
  }))
}

function attributeDescription(attribute) {
  const parts = [attribute.description]
  if (attribute.default !== undefined) parts.push(`Defaults to \`${attribute.default}\`.`)
  if (attribute.type === 'boolean') {
    parts.push('Presence-based: author the attribute with no value.')
  }
  if (attribute.set) parts.push(`Exported as \`${attribute.set}\`.`)
  return parts.filter(Boolean).join(' ')
}

function tagDescription(item) {
  const parts = [
    `Timeless \`${item.tag}\`. Enhances the Light DOM you author; the markup stays yours.`,
  ]
  if (item.accessibility) {
    parts.push(`Implements the ARIA ${item.accessibility.patternLabel} pattern.`)
  }
  if (item.events.length > 0) {
    parts.push(`Dispatches ${item.events.map((event) => `\`${event.name}\``).join(', ')}.`)
  }
  return parts.join(' ')
}

export function createHtmlCustomData(elements) {
  return {
    version: 1.1,
    tags: elements.map((item) => ({
      name: item.tag,
      description: tagDescription(item),
      references: [REFERENCE],
      attributes: item.attributes.map((attribute) => ({
        name: attribute.name,
        description: attributeDescription(attribute),
        ...(attribute.set ? { valueSet: attribute.set } : {}),
      })),
    })),
    globalAttributes: [
      {
        name: 'data-ui-part',
        description:
          "Whitespace-separated list of anatomy part names, selected with `[data-ui-part~='name']`. Each part belongs to its nearest component root.",
        references: [REFERENCE],
      },
    ],
    valueSets: valueSetEntries(),
  }
}

/**
 * Public custom properties and the custom states elements expose through `:state()`. Consumers write
 * both by hand, and neither is discoverable from the DOM.
 */
export function createCssCustomData(components, tokenGroups) {
  const properties = []
  for (const [group, tokens] of Object.entries(tokenGroups)) {
    for (const token of tokens) {
      properties.push({
        name: token,
        description: `Timeless Atmosphere token (${group}). Override it on \`:root\` or on any subtree.`,
        references: [{ name: 'Theming', url: 'https://timeless.build/docs/styling/theming/' }],
      })
    }
  }
  for (const component of components) {
    for (const variable of component.variables) {
      properties.push({
        name: variable.name,
        description: `${variable.description} Set on \`${component.root.name}\`.`,
        references: [REFERENCE],
      })
    }
  }

  const pseudoClasses = []
  const seen = new Set()
  for (const component of components) {
    for (const state of component.states) {
      if (state.source !== 'custom-state' || !state.public) continue
      const name = `:state(${state.name})`
      if (seen.has(name)) continue
      seen.add(name)
      pseudoClasses.push({
        name,
        description: `${state.description} Exposed by \`${component.root.name}\`.`,
        references: [REFERENCE],
      })
    }
  }

  // Every custom state Timeless defines today is internal, so the key stays absent until a
  // component exposes one publicly.
  return { version: 1.1, properties, ...(pseudoClasses.length > 0 ? { pseudoClasses } : {}) }
}

/** JetBrains reads the same grammar from its own schema, resolved through the `web-types` field. */
export function createWebTypes(elements, version) {
  return {
    $schema: 'https://json.schemastore.org/web-types',
    name: '@timelessui/components',
    version,
    'description-markup': 'markdown',
    contributions: {
      html: {
        elements: elements.map((item) => ({
          name: item.tag,
          description: tagDescription(item),
          'doc-url': REFERENCE.url,
          attributes: item.attributes.map((attribute) => ({
            name: attribute.name,
            description: attributeDescription(attribute),
            value: attribute.set
              ? {
                  kind: 'plain',
                  type: valueSets[attribute.set].values.map((value) => `'${value}'`),
                }
              : { kind: 'plain', type: attribute.type },
          })),
          events: item.events.map((event) => ({
            name: event.name,
            description: event.description,
          })),
        })),
      },
    },
  }
}
