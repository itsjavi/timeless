import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { components, elements } from './component-registry.mjs'

const packageRoot = resolve(import.meta.dirname, '..')
const publicConfiguration = new Set(
  components.flatMap((component) =>
    component.attributes.flatMap((attribute) =>
      attribute.name.startsWith('data-ui-') ? [attribute.name] : [],
    ),
  ),
)
const publicParts = new Set(
  components.flatMap((component) => component.parts.map((part) => part.name)),
)
const publicClassRoots = new Set(
  components.flatMap((component) => (component.root.kind === 'class' ? [component.root.name] : [])),
)

/** Marker for `[attr]` presence selectors, which carry no value. */
const PRESENCE = Symbol.for('presence')

/** Native and ARIA attributes are authoritative state, not documented configuration. */
const IGNORED_SELECTOR_ATTRIBUTES = new Set([
  'accept',
  'checked',
  'disabled',
  'hidden',
  'id',
  'inert',
  'multiple',
  'name',
  'open',
  'popover',
  'role',
  'type',
  'value',
])

/**
 * A contract's root must be selected by the CSS it claims. The check is across the contract's
 * stylesheets collectively rather than each one individually: a component whose CSS is split — the
 * collection surfaces share `options.css`, and everything anchored shares `floating.css` — has files
 * that legitimately select a private runtime hook rather than any one root. What the check is
 * actually for is catching a contract pointed at the wrong stylesheet, and that still holds.
 */
for (const component of components) {
  const sources = await Promise.all(
    component.css.map((stylesheet) =>
      readFile(resolve(packageRoot, 'src/css', stylesheet), 'utf8'),
    ),
  )
  if (!sources.some((source) => source.includes(component.root.name))) {
    throw new Error(
      `${component.name} root ${component.root.name} is absent from ${component.css.join(', ')}`,
    )
  }
}

const stylesheets = [...new Set(components.flatMap((component) => component.css))]
for (const stylesheet of stylesheets) {
  const source = await readFile(resolve(packageRoot, 'src/css', stylesheet), 'utf8')
  for (const match of source.matchAll(/\.(ui-[a-z0-9-]+)/g)) {
    const root = match[1]
    if (!publicClassRoots.has(root)) {
      throw new Error(`${stylesheet} selects uncatalogued public class ${root}`)
    }
  }
  for (const match of source.matchAll(/\[(data-ui-[a-z0-9-]+)(?:[~|^$*]?=['"]([^'"]*)['"])?\]/g)) {
    const [, name, value = ''] = match
    if (name.startsWith('data-ui-internal-')) continue
    if (name === 'data-ui-part') {
      if (value && !publicParts.has(value)) {
        throw new Error(`${stylesheet} selects unknown part ${value}`)
      }
      continue
    }
    if (name === 'data-ui-value' || publicConfiguration.has(name)) continue
    throw new Error(`${stylesheet} selects uncatalogued public attribute ${name}`)
  }
  if (/(^|[\s,>+~:(])ui-separator(?=[\s,>+~.:[#])/m.test(source)) {
    throw new Error(`${stylesheet} selects the retired unregistered ui-separator tag`)
  }
}

validateContractShape()
await validateAttributeValues()
const tokenCount = await validatePublicTokens()

console.log(
  `Validated ${components.length} component contracts, ${elements.length} elements, ${countDocumentedValues()} documented attribute values, and ${tokenCount} public tokens.`,
)

/**
 * The registry factories take positional arguments, so a new trailing field is easy to pass into the
 * wrong slot. Assert the shape once rather than discovering it in the rendered documentation.
 */
function validateContractShape() {
  for (const component of components) {
    for (const [field, isValid] of [
      ['attributes', Array.isArray(component.attributes)],
      ['parts', Array.isArray(component.parts)],
      ['states', Array.isArray(component.states)],
      ['variables', Array.isArray(component.variables)],
      ['events', Array.isArray(component.events)],
      [
        'accessibility',
        component.accessibility === null || typeof component.accessibility === 'object',
      ],
    ]) {
      if (!isValid) throw new Error(`${component.name} passed a bad value into ${field}`)
    }
    for (const attribute of component.attributes) {
      if (typeof attribute?.name !== 'string') {
        throw new Error(`${component.name} has an attribute with no name`)
      }
    }
    for (const part of component.parts) {
      if (typeof part?.name !== 'string' || typeof part?.required !== 'boolean') {
        throw new Error(`${component.name} has a malformed part`)
      }
    }
  }
}

/**
 * `atmosphereTokenGroups` is documented as the public token contract, so it must name exactly the
 * custom properties `theme-atmosphere.css` declares on `:root`. A token in the stylesheet but not
 * the list is undocumented; a token in the list but not the stylesheet does not exist.
 *
 * The same function proves the other half of the split: `tokens.css` carries the layer statement and
 * `color-scheme` and no token value at all. Without that assertion a value drifts back into the one
 * file a consumer cannot opt out of, and the theme stops being optional again.
 */
async function validatePublicTokens() {
  const stylesheet = await readFile(resolve(packageRoot, 'src/css/theme-atmosphere.css'), 'utf8')
  const listed = new Set(
    [
      ...(await readFile(resolve(packageRoot, 'src/tokens.ts'), 'utf8')).matchAll(
        /'(--ui-[a-z0-9-]+)'/g,
      ),
    ].map((match) => match[1]),
  )
  const declared = new Set(
    [...stylesheet.matchAll(/^\s*(--ui-[a-z0-9-]+)\s*:/gm)].map((match) => match[1]),
  )

  const undocumented = [...declared].filter((token) => !listed.has(token))
  if (undocumented.length > 0) {
    throw new Error(
      `theme-atmosphere.css declares undocumented public tokens: ${undocumented.join(', ')}`,
    )
  }
  const missing = [...listed].filter((token) => !declared.has(token))
  if (missing.length > 0) {
    throw new Error(
      `atmosphereTokenGroups lists tokens theme-atmosphere.css never declares: ${missing.join(', ')}`,
    )
  }

  const base = await readFile(resolve(packageRoot, 'src/css/tokens.css'), 'utf8')
  const stripped = base.replace(/\/\*[\s\S]*?\*\//g, '')
  const leaked = [...stripped.matchAll(/(--ui-[a-z0-9-]+)\s*:/g)].map((match) => match[1])
  if (leaked.length > 0) {
    throw new Error(
      `tokens.css must hold no theme value, but declares ${[...new Set(leaked)].join(', ')}`,
    )
  }
  if (!stripped.includes('@layer ui.tokens, ui.components, ui.utilities;')) {
    throw new Error(
      'tokens.css no longer declares the ui.tokens, ui.components, ui.utilities order',
    )
  }
  return declared.size
}

/**
 * Proves the documented value sets against the stylesheets in both directions, so the reference
 * tables can never drift from the CSS:
 *
 * - Every value a component's stylesheets select must be declared.
 * - Every declared value must be selected, unless it is the default, which is the base rule and so
 *   has no selector of its own. This check only runs when the stylesheets select the attribute at
 *   all, because behavioral attributes such as `ui-menu[orientation]` have no CSS to prove.
 * - Every declared `data-ui-*` attribute must be selected by some stylesheet in the package, which
 *   catches attributes documented as configuration that nothing implements.
 */
async function validateAttributeValues() {
  const sources = new Map()
  for (const stylesheet of stylesheets) {
    sources.set(stylesheet, await readFile(resolve(packageRoot, 'src/css', stylesheet), 'utf8'))
  }
  const selectedAnywhere = new Map()
  for (const [stylesheet, source] of sources) {
    for (const [attributeName, values] of selectedValues(source)) {
      const total = selectedAnywhere.get(attributeName) ?? new Set()
      for (const value of values) total.add(value)
      selectedAnywhere.set(attributeName, total)
      void stylesheet
    }
  }

  for (const component of components) {
    const componentSelected = new Map()
    for (const stylesheet of component.css) {
      for (const [attributeName, values] of selectedValues(sources.get(stylesheet) ?? '')) {
        const total = componentSelected.get(attributeName) ?? new Set()
        for (const value of values) total.add(value)
        componentSelected.set(attributeName, total)
      }
    }

    for (const attribute of component.attributes) {
      const label = `${component.name} ${attribute.name}`
      if (attribute.name.startsWith('data-ui-') && !selectedAnywhere.has(attribute.name)) {
        throw new Error(`${label} is documented as configuration but no stylesheet implements it`)
      }
      if (attribute.default !== undefined && attribute.values) {
        if (!attribute.values.includes(attribute.default)) {
          throw new Error(`${label} default '${attribute.default}' is not one of its values`)
        }
      }
      const selected = componentSelected.get(attribute.name)
      if (!selected) continue
      const declared = new Set(attribute.values ?? [])
      for (const value of selected) {
        // A presence selector carries no value, and is a legitimate base rule for valued attributes.
        if (value === PRESENCE) continue
        if (attribute.type === 'boolean') {
          throw new Error(`${label} is documented as boolean but CSS selects the value '${value}'`)
        }
        if (!declared.has(value)) {
          throw new Error(`${label} value '${value}' is selected by CSS but not documented`)
        }
      }
      for (const value of declared) {
        if (selected.has(value) || value === attribute.default) continue
        throw new Error(
          `${label} documents value '${value}', which is neither selected by CSS nor the default`,
        )
      }
    }
  }
}

function selectedValues(source) {
  const found = new Map()
  const patterns = [
    /\[(data-ui-[a-z0-9-]+)(?:[~|^$*]?=['"]([^'"]*)['"])?\]/g,
    /(?<![-a-z])\[([a-z][a-z-]*)(?:[~|^$*]?=['"]([^'"]*)['"])?\]/g,
  ]
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const [, name, value] = match
      if (name === 'data-ui-part' || name.startsWith('data-ui-internal-')) continue
      if (IGNORED_SELECTOR_ATTRIBUTES.has(name)) continue
      const values = found.get(name) ?? new Set()
      values.add(value ? value : PRESENCE)
      found.set(name, values)
    }
  }
  return found
}

function countDocumentedValues() {
  return components.reduce(
    (total, component) =>
      total +
      component.attributes.reduce((count, attribute) => count + (attribute.values?.length ?? 0), 0),
    0,
  )
}
