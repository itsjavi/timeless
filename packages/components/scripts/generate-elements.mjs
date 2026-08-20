import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { format } from 'oxfmt'
import { components, elements, valueSets } from './component-registry.mjs'
import {
  createAgentsBlockMarkdown,
  createContext7Config,
  createGrammarMarkdown,
  createSkillContracts,
  createSkillMarkdown,
} from './emit-agent-skill.mjs'
import { createCssCustomData, createHtmlCustomData, createWebTypes } from './emit-editor-data.mjs'
import {
  createPreactTypes,
  createReactTypes,
  createSolidTypes,
  createSvelteTypes,
  createVueTypes,
} from './emit-framework-types.mjs'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const check = process.argv.includes('--check')

const formatOptions = {
  arrowParens: 'always',
  printWidth: 100,
  proseWrap: 'always',
  quoteProps: 'as-needed',
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
}

async function formattedJson(name, data) {
  return formatted(name, `${JSON.stringify(data, null, 2)}\n`)
}

async function formatted(name, source) {
  const result = await format(name, source, formatOptions)
  if (result.errors.length > 0) {
    throw new Error(`Could not format generated ${name}: ${result.errors[0].message}`)
  }
  return result.code
}

const outputs = new Map()
for (const item of elements) {
  const signature = `export function ${item.defineExport}(targetWindow: Window = window): CustomElementConstructor`
  const declaration =
    signature.length >= 99
      ? `export function ${item.defineExport}(\n  targetWindow: Window = window,\n): CustomElementConstructor`
      : signature
  outputs.set(
    resolve(packageRoot, `src/define/${item.tag}.ts`),
    `import { ${item.factory} } from '../${item.module}'\nimport { defineRegisteredElement } from './registry'\n\n${declaration} {\n  return defineRegisteredElement('${item.tag}', ${item.factory}, targetWindow)\n}\n`,
  )
}
outputs.set(resolve(packageRoot, 'src/define.ts'), createAggregateDefine())
for (const [module, source] of createValues()) {
  outputs.set(
    resolve(packageRoot, `src/values/${module}.ts`),
    await formatted(`${module}.ts`, source),
  )
}
outputs.set(
  resolve(packageRoot, 'src/contracts.ts'),
  await formatted('contracts.ts', createComponentContracts()),
)
outputs.set(
  resolve(packageRoot, 'src/attributes.ts'),
  await formatted('attributes.ts', createAttributeHelper()),
)

outputs.set(
  resolve(packageRoot, 'custom-elements.json'),
  await formattedJson('custom-elements.json', createManifest()),
)
for (const [path, source] of [
  ['src/react.ts', createReactTypes(elements)],
  ['src/preact.ts', createPreactTypes(elements)],
  ['src/solid.ts', createSolidTypes(elements)],
  ['src/vue.ts', createVueTypes(elements)],
  ['src/svelte.ts', createSvelteTypes(elements)],
]) {
  outputs.set(resolve(packageRoot, path), await formatted(path.split('/').at(-1), source))
}

outputs.set(
  resolve(packageRoot, 'skills/using-timeless-ui/reference/contracts.md'),
  await formatted('contracts.md', createSkillContracts(components)),
)
outputs.set(
  resolve(packageRoot, 'skills/using-timeless-ui/reference/grammar.md'),
  await formatted('grammar.md', createGrammarMarkdown()),
)
outputs.set(
  resolve(packageRoot, 'skills/using-timeless-ui/reference/agents-block.md'),
  await formatted('agents-block.md', createAgentsBlockMarkdown()),
)
outputs.set(
  resolve(packageRoot, 'skills/using-timeless-ui/SKILL.md'),
  await formatted('SKILL.md', createSkillMarkdown()),
)

/*
 * The only generated file outside this package. `context7.json` must sit at the repository root for
 * Context7 to find it, and its `rules` array is the authoring grammar in imperative form — the fourth
 * place that grammar used to be hand-written.
 */
outputs.set(
  resolve(packageRoot, '../../context7.json'),
  await formattedJson('context7.json', createContext7Config()),
)

for (const [path, data] of [
  ['vscode.html-custom-data.json', createHtmlCustomData(elements)],
  ['vscode.css-custom-data.json', createCssCustomData(components, await readTokenGroups())],
  ['web-types.json', createWebTypes(elements, await readPackageVersion())],
]) {
  outputs.set(resolve(packageRoot, path), await formattedJson(path, data))
}

let stale = false
for (const [path, content] of outputs) {
  const current = await readFile(path, 'utf8').catch(() => '')
  if (current === content) continue
  stale = true
  if (!check) {
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, content)
  }
}

if (check && stale) {
  throw new Error('Generated element contracts are stale. Run pnpm generate.')
}

/**
 * `uiTokenGroups` is authored TypeScript, so it is read as text rather than imported. The
 * same list is already proven against `tokens.css` by `validate-contracts.mjs` in both directions.
 */
async function readTokenGroups() {
  const source = await readFile(resolve(packageRoot, 'src/tokens.ts'), 'utf8')
  const body = /uiTokenGroups = \{([\s\S]*?)\n\} as const/.exec(source)?.[1]
  if (!body) throw new Error('Could not read uiTokenGroups from src/tokens.ts')
  const groups = {}
  for (const match of body.matchAll(/(\w+): \[([^\]]*)\]/g)) {
    groups[match[1]] = [...match[2].matchAll(/'(--ui-[a-z0-9-]+)'/g)].map((token) => token[1])
  }
  if (Object.keys(groups).length === 0) throw new Error('uiTokenGroups parsed as empty')
  return groups
}

async function readPackageVersion() {
  const source = await readFile(resolve(packageRoot, 'package.json'), 'utf8')
  return JSON.parse(source).version
}

function createManifest() {
  return {
    schemaVersion: '2.1.0',
    readme: 'README.md',
    modules: elements.map((item) => ({
      kind: 'javascript-module',
      path: `dist/${item.module}.js`,
      declarations: [
        {
          kind: 'class',
          name: item.classExport,
          customElement: true,
          tagName: item.tag,
          attributes: item.attributes.map((attribute) => manifestAttribute(attribute)),
          members: item.attributes.flatMap((attribute) => manifestMembers(attribute)),
          events: item.events.map((event) => ({
            name: event.name,
            description: event.description,
            type: { text: event.type },
          })),
          ...(item.variables.length > 0
            ? {
                cssProperties: item.variables.map((variable) => ({
                  name: variable.name,
                  description: variable.description,
                })),
              }
            : {}),
          ...(item.states.some((state) => state.source === 'custom-state')
            ? {
                cssStates: item.states.flatMap((state) =>
                  state.source === 'custom-state'
                    ? [{ name: state.name, description: state.description }]
                    : [],
                ),
              }
            : {}),
          // Not `cssParts`: Timeless anatomy is authored Light DOM, so `::part()` never applies to
          // it. The manifest reports the real selector under a namespaced key rather than claiming
          // a shadow contract this library does not have.
          ...(item.parts.length > 0
            ? {
                'timeless:parts': item.parts.map((part) => ({
                  name: part.name,
                  selector: part.selector,
                  required: part.required,
                  description: part.description,
                })),
              }
            : {}),
        },
      ],
      exports: [
        {
          kind: 'js',
          name: item.classExport,
          declaration: { name: item.classExport, module: `dist/${item.module}.js` },
        },
      ],
    })),
  }
}

/**
 * Every public value set, as an `as const` array plus its union type.
 *
 * Split one file per declaring module rather than one file for all of them, and kept out of
 * `src/contracts.ts` entirely, because the per-element entrypoints re-export these. Importing
 * `@timelessui/components/popover` must pull in Popover's four roles, not all thirty-seven arrays and
 * certainly not the whole `componentContracts` object. `check-performance.mjs` measures the real
 * import closure, so a shared barrel would show up there as growth on every entrypoint.
 */
function createValues() {
  const usage = new Map()
  for (const component of components) {
    for (const attribute of component.attributes) {
      if (!attribute.set) continue
      const users = usage.get(attribute.set) ?? []
      users.push(`\`${component.root.name}\` \`${attribute.name}\``)
      usage.set(attribute.set, users)
    }
  }

  const byModule = new Map()
  for (const [name, set] of Object.entries(valueSets)) {
    const users = usage.get(name) ?? []
    const values = set.values.map((value) => `'${value}'`).join(', ')
    const declaration = `/** Permitted values for ${listSentence(users)}. */\nexport const ${name} = [${values}] as const\nexport type ${set.type} = (typeof ${name})[number]`
    byModule.set(set.module, [...(byModule.get(set.module) ?? []), declaration])
  }
  return [...byModule].map(([module, declarations]) => [module, `${declarations.join('\n\n')}\n`])
}

/** Type-only imports of value-set unions, grouped by the module that declares each set. */
function valueImports(setNames, prefix) {
  const byModule = new Map()
  for (const name of setNames) {
    const set = valueSets[name]
    byModule.set(set.module, [...(byModule.get(set.module) ?? []), set.type])
  }
  return [...byModule]
    .map(
      ([module, types]) =>
        `import type { ${[...new Set(types)].sort().join(', ')} } from '${prefix}${module}'`,
    )
    .join('\n')
}

/**
 * The typed answer to the one gap no editor closes.
 *
 * A `ui-*` tag is a tag, so every framework typing and the editor data complete it. A CSS-only
 * component is `class="ui-button"` plus `data-ui-*` on a native tag, and the only editor hook there
 * is a global attribute that would offer Card's values inside a Button. This helper moves that
 * surface into the type system instead: the keys are the component's attributes, the values are the
 * sets the stylesheets prove, and the output is the markup a consumer would have written by hand.
 *
 * Opt-in through `@timelessui/components/attributes`. Nothing in the default entrypoint imports it.
 */
function createAttributeHelper() {
  const classComponents = components.filter((component) => component.root.kind === 'class')
  const used = new Set()
  const configs = classComponents
    .map((component) => {
      const members = component.attributes
        .map((attribute) => {
          const key = attribute.name.slice('data-ui-'.length)
          if (attribute.set) used.add(attribute.set)
          const type = attribute.set
            ? valueSets[attribute.set].type
            : attribute.type === 'boolean'
              ? 'boolean'
              : 'string'
          return `    /** ${attribute.description} */\n    ${key}?: ${type}`
        })
        .join('\n')
      return `  ${component.name}: {\n${members}${members ? '\n' : ''}  }`
    })
    .join('\n')
  const imports = used.size > 0 ? `${valueImports([...used].sort(), './values/')}\n\n` : ''
  const roots = classComponents
    .map((component) => {
      const defaults = component.attributes
        .filter((attribute) => attribute.default !== undefined)
        .map((attribute) => `'${attribute.name}': '${attribute.default}'`)
        .join(', ')
      return `  ${component.name}: { class: '${component.root.name}', defaults: {${
        defaults ? ` ${defaults} ` : ''
      }} },`
    })
    .join('\n')

  return `${imports}/** Configuration accepted by each CSS-only component root, keyed by contract name. */
export type UIAttributeConfig = {
${configs}
}

export type UIAttributeComponent = keyof UIAttributeConfig

/** Attributes ready to spread onto a native element, in any framework or template language. */
export type UIAttributeResult = { class: string } & Record<\`data-ui-\${string}\`, string>

/**
 * The root class and the declared attribute defaults, inlined at generation time. Reading the two
 * out of \`componentContracts\` pulled the whole contract registry into the browser for a helper that
 * emits strings, which made the typed convenience API the most expensive import in the package.
 * \`componentContracts\` stays where it belongs: \`validate.ts\` and genuine introspection.
 */
const roots: Readonly<
  Record<UIAttributeComponent, { readonly class: string; readonly defaults: Readonly<Record<string, string>> }>
> = {
${roots}
}

/**
 * Builds the root class and \`data-ui-*\` attributes for a CSS-only component.
 *
 * \`\`\`ts
 * uiAttributes('button', { variant: 'primary', size: 'lg' })
 * // { class: 'ui-button', 'data-ui-variant': 'primary', 'data-ui-size': 'lg' }
 * \`\`\`
 *
 * Boolean attributes are presence-based, so \`true\` emits an empty value and \`false\` omits the
 * attribute entirely. Extra classes are appended after the root class, never in place of it.
 */
export function uiAttributes<TComponent extends UIAttributeComponent>(
  component: TComponent,
  config: UIAttributeConfig[TComponent] & { class?: string } = {} as UIAttributeConfig[TComponent],
): UIAttributeResult {
  const { class: extraClass, ...values } = config as Record<string, unknown>
  const result: UIAttributeResult = {
    class: [roots[component].class, extraClass].filter(Boolean).join(' '),
  }
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === false) continue
    result[\`data-ui-\${key}\`] = value === true ? '' : String(value)
  }
  return result
}

export type UIAttributeStringOptions = {
  /**
   * Omit any value that equals the contract default, because the default is the stylesheet's base
   * rule and needs no attribute. Keeps generated markup as short as hand-authored markup. Defaults
   * to \`true\`.
   */
  readonly omitDefaults?: boolean
}

/**
 * The same attributes, serialized for a template literal.
 *
 * \`\`\`ts
 * \`<button \${uiAttributeString('button', { variant: 'danger' })} type="button">Delete</button>\`
 * // <button class="ui-button" data-ui-variant="danger" type="button">Delete</button>
 * \`\`\`
 *
 * Defaults are dropped by default, so the contract owns which values are worth writing down and a
 * template never restates them.
 */
export function uiAttributeString<TComponent extends UIAttributeComponent>(
  component: TComponent,
  config: UIAttributeConfig[TComponent] & { class?: string } = {} as UIAttributeConfig[TComponent],
  options: UIAttributeStringOptions = {},
): string {
  const defaults = roots[component].defaults
  const entries = Object.entries(uiAttributes(component, config)).filter(
    ([name, value]) => options.omitDefaults === false || defaults[name] !== value,
  )
  return entries.map(([name, value]) => \`\${name}="\${escapeAttribute(value)}"\`).join(' ')
}

function escapeAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}
`
}

function listSentence(items) {
  if (items.length <= 1) return items[0] ?? 'no attribute'
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

function createAggregateDefine() {
  const imports = elements
    .map((item) => `import { ${item.defineExport} } from './define/${item.tag}'`)
    .join('\n')
  const exports = elements.map((item) => `  ${item.defineExport},`).join('\n')
  const calls = elements.map((item) => `  ${item.defineExport}(targetWindow)`).join('\n')
  return `${imports}\n\nexport {\n${exports}\n}\n\nexport function defineTimelessElements(targetWindow: Window = window): void {\n${calls}\n}\n`
}

function createComponentContracts() {
  const names = components.map((component) => `'${component.name}'`).join(' | ')
  const contracts = components
    .map((component) => {
      const contract = {
        kind: component.kind,
        root: component.root,
        css: component.css,
        // `property` describes the JS surface and belongs to the manifest, not the authoring contract.
        attributes: component.attributes.map(({ property, ...attribute }) => {
          void property
          return attribute
        }),
        parts: component.parts,
        states: component.states,
        variables: component.variables,
        events: component.events,
        ...(component.accessibility ? { accessibility: component.accessibility } : {}),
      }
      return `  ${component.name}: ${JSON.stringify(contract, null, 2).replaceAll('\n', '\n  ')},`
    })
    .join('\n')

  return `${contractTypes()}\n\nexport type ComponentName = ${names}\n\nexport const componentContracts = {\n${contracts}\n} as const satisfies Readonly<Record<ComponentName, ComponentContract>>\n\nexport const componentNames: readonly ComponentName[] = Object.keys(\n  componentContracts,\n) as ComponentName[]\n\nexport function isComponentName(value: string): value is ComponentName {\n  return Object.hasOwn(componentContracts, value)\n}\n`
}

function contractTypes() {
  return `export type ComponentKind = 'css' | 'custom-element'

export type ComponentRoot =
  | { readonly kind: 'class'; readonly name: \`ui-\${string}\` }
  | { readonly kind: 'element'; readonly name: \`ui-\${string}\` }
  /** A configuration of another component's element, named by the selector that selects it. */
  | { readonly kind: 'selector'; readonly name: \`ui-\${string}\` }

/** One public configuration attribute, with the values the stylesheets actually implement. */
export type ComponentAttributeContract = {
  readonly name: string
  /** \`boolean\` attributes are presence-based: author the attribute, never a value. */
  readonly type: string
  /**
   * Name of the exported \`as const\` array holding these values, for example \`buttonVariants\`.
   * Import it from the package root to drive a control, a validator, or a test.
   */
  readonly set?: string
  /** Absent when the attribute takes free-form input such as an element id or a CSS color. */
  readonly values?: readonly string[]
  /** The value that applies when the attribute is absent. Absent when omitting it means "off". */
  readonly default?: string
  readonly description: string
}

export type ComponentPartContract = {
  readonly name: string
  readonly required: boolean
  readonly selector: string
  readonly description: string
}

export type ComponentStateContract = {
  readonly name: string
  readonly source: 'native' | 'aria' | 'custom-state' | 'internal-data'
  readonly public: boolean
  readonly description: string
}

/**
 * A CSS custom property a consumer may set to restyle the component. The global Atmosphere tokens a
 * component reads are documented once in the theming guide instead of per component.
 */
export type ComponentVariableContract = {
  readonly name: string
  readonly description: string
}

export type ComponentEventContract = {
  readonly name: string
  readonly type: string
  readonly description: string
  readonly cancelable: boolean
}

/** Keyboard and focus behavior the component implements itself. */
export type ComponentAccessibilityContract = {
  /**
   * ARIA Authoring Practices pattern slug, e.g. \`tabs\`. Null when the APG has no pattern for
   * this composition, in which case \`patternLabel\` names the contract the component documents
   * instead. Never a slug invented to fill the gap.
   */
  readonly pattern: string | null
  readonly patternLabel: string
  readonly keys: readonly { readonly key: string; readonly action: string }[]
  /** What the platform handles, and what the author still owns. */
  readonly notes: string
}

export type ComponentContract = {
  readonly kind: ComponentKind
  readonly root: ComponentRoot
  readonly css: readonly string[]
  readonly attributes: readonly ComponentAttributeContract[]
  readonly parts: readonly ComponentPartContract[]
  readonly states: readonly ComponentStateContract[]
  readonly variables: readonly ComponentVariableContract[]
  readonly events: readonly ComponentEventContract[]
  /** Present for components that implement keyboard behavior of their own. */
  readonly accessibility?: ComponentAccessibilityContract
}`
}

function manifestType(attribute) {
  if (attribute.values) return attribute.values.map((value) => `'${value}'`).join(' | ')
  return attribute.type
}

function manifestAttribute(attribute) {
  return {
    name: attribute.name,
    description: attribute.description,
    type: { text: manifestType(attribute) },
    ...(attribute.default === undefined ? {} : { default: attribute.default }),
  }
}

/**
 * Reflecting properties, named as the element actually declares them. An attribute with
 * `property: false` is resolved from the DOM or the stylesheet and reflects nothing.
 */
function manifestMembers(attribute) {
  const property = attribute.property
  if (!property) return []
  const type = property.type ?? manifestType(attribute)
  const member = {
    kind: 'field',
    name: property.name,
    attribute: attribute.name,
    type: { text: type },
    description: property.live
      ? `Authored default and form-reset value. Reflects the \`${attribute.name}\` attribute.`
      : attribute.description,
  }
  if (!property.live) return [member]
  return [
    member,
    {
      kind: 'field',
      name: property.live,
      type: { text: type },
      description:
        'Live value. Assigning it does not rewrite the authored default and does not dispatch transition events.',
    },
  ]
}
