import { readFile, readdir } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
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
 * collection surfaces share `options.css`, and everything anchored shares `core/floating.css` — has files
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
const layeredCount = await validateEverythingIsLayered()
const importCount = await validateImportsResolve()

console.log(
  `Validated ${components.length} component contracts, ${elements.length} elements, ${countDocumentedValues()} documented attribute values, ${tokenCount} public tokens, ${layeredCount} fully layered stylesheets, and ${importCount} resolvable @import targets.`,
)

/**
 * Every `@import` in the package must name a file that exists. A dangling one fails only when a
 * browser loads the stylesheet, which no test does for an aggregate — so milestone 028 deleted
 * `form.css`, left `components.css` importing it, and shipped that in a green build. The whole point of
 * the aggregates is that a consumer can import one file instead of forty; an aggregate with a hole in
 * it is worse than no aggregate.
 */
async function validateImportsResolve() {
  const cssRoot = resolve(packageRoot, 'src/css')
  const stylesheets = (await readdir(cssRoot, { recursive: true }))
    .map((name) => name.split(sep).join('/'))
    .filter((name) => name.endsWith('.css'))

  let total = 0
  for (const name of stylesheets) {
    // Comments are stripped first: a file may legitimately quote an `@import` while explaining one.
    const source = (await readFile(resolve(cssRoot, name), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '')
    const directory = resolve(cssRoot, name, '..')
    for (const match of source.matchAll(/@import\s+['"]([^'"]+)['"]/g)) {
      total += 1
      const target = resolve(directory, match[1])
      try {
        await readFile(target, 'utf8')
      } catch {
        throw new Error(`${name} imports ${match[1]}, which does not exist`)
      }
    }
  }
  return total
}

/**
 * Every declaration the package ships must sit inside a cascade layer. Unlayered CSS beats *all*
 * layered CSS at any specificity, so a single unlayered rule silently opts itself out of the override
 * story the whole library is built on: consumer CSS stops winning, and `@layer ui.utilities` — which
 * `theming.mdx` tells consumers to use — stops working against it.
 *
 * This was not hypothetical. Four stylesheets carried an `@media (forced-colors: active)` block after
 * their `@layer ui.components` block closed, so in forced-colors mode a consumer could not restyle a
 * pressed Toggle by either documented route. Measured under Chromium's forced-colors emulation: asking
 * for `ButtonText` from `ui.utilities` or from a plain class both computed `Highlight` anyway. Moving
 * the blocks inside the layer changed the library's own rendering not at all and made both overrides
 * work. Milestone 028's baseline had recorded zero unlayered rules, which was wrong; this makes the
 * claim true and keeps it true.
 *
 * The two aggregates are excluded because they hold nothing but `@import` statements.
 */
async function validateEverythingIsLayered() {
  const aggregates = new Set(['components.css', 'core.css'])
  const cssRoot = resolve(packageRoot, 'src/css')
  const stylesheetNames = (await readdir(cssRoot, { recursive: true }))
    .map((name) => name.split(sep).join('/'))
    .filter((name) => name.endsWith('.css') && !aggregates.has(name))

  for (const name of stylesheetNames) {
    const source = (await readFile(resolve(cssRoot, name), 'utf8')).replace(
      /\/\*[\s\S]*?\*\//g,
      (comment) => comment.replace(/[^\n]/g, ' '),
    )
    const unlayered = declarationsOutsideAnyLayer(source)
    if (unlayered.length > 0) {
      throw new Error(
        `${name} declares ${[...new Set(unlayered)].join(', ')} outside any @layer block; ` +
          'unlayered CSS beats every layered rule, so consumer overrides stop working',
      )
    }
  }
  return stylesheetNames.length
}

/**
 * Only the block form `@layer name { ... }` opens a layer; the bare `@layer a, b, c;` statement in
 * `tokens.css` declares an order and contains nothing.
 */
function declarationsOutsideAnyLayer(source) {
  const found = []
  let depth = -1
  let outside = ''
  for (let index = 0; index < source.length; index += 1) {
    if (depth < 0 && /^@layer[^;{]*\{/.test(source.slice(index))) depth = 0
    const character = source[index]
    if (character === '{') {
      if (depth >= 0) depth += 1
    } else if (character === '}') {
      if (depth >= 0) {
        depth -= 1
        if (depth === 0) {
          depth = -1
          continue
        }
      }
    }
    if (depth < 0) outside += character
  }
  for (const match of outside.matchAll(/(?:^|[{;])\s*((?:--)?[a-z][a-z0-9-]*)\s*:/gi)) {
    found.push(match[1].toLowerCase())
  }
  return found
}

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
 * custom properties `themes/atmosphere/tokens.css` declares on `:root`. A token in the stylesheet
 * the list is undocumented; a token in the list but not the stylesheet does not exist.
 *
 * The same function proves the other half of the split: `tokens.css` carries the layer statement and
 * `color-scheme` and no token value at all. Without that assertion a value drifts back into the one
 * file a consumer cannot opt out of, and the theme stops being optional again.
 */
async function validatePublicTokens() {
  const stylesheet = await readFile(
    resolve(packageRoot, 'src/css/themes/atmosphere/tokens.css'),
    'utf8',
  )
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
      `themes/atmosphere/tokens.css declares undocumented public tokens: ${undocumented.join(', ')}`,
    )
  }
  const missing = [...listed].filter((token) => !declared.has(token))
  if (missing.length > 0) {
    throw new Error(
      `atmosphereTokenGroups lists tokens themes/atmosphere/tokens.css never declares: ${missing.join(', ')}`,
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
