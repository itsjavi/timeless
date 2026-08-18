import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { format } from 'oxfmt'
import { components, elements } from './component-registry.mjs'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const check = process.argv.includes('--check')

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
const formattedContracts = await format('contracts.ts', createComponentContracts(), {
  arrowParens: 'always',
  printWidth: 100,
  proseWrap: 'always',
  quoteProps: 'as-needed',
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
})
if (formattedContracts.errors.length > 0) {
  throw new Error(
    `Could not format generated component contracts: ${formattedContracts.errors[0].message}`,
  )
}
outputs.set(resolve(packageRoot, 'src/contracts.ts'), formattedContracts.code)

outputs.set(
  resolve(packageRoot, 'custom-elements.json'),
  `${JSON.stringify(createManifest(), null, 2)}\n`,
)
outputs.set(resolve(packageRoot, 'src/jsx/react.ts'), createReactTypes())

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

/** One public configuration attribute, with the values the stylesheets actually implement. */
export type ComponentAttributeContract = {
  readonly name: string
  /** \`boolean\` attributes are presence-based: author the attribute, never a value. */
  readonly type: string
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
  /** ARIA Authoring Practices pattern slug, e.g. \`tabs\`. */
  readonly pattern: string
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

function createReactTypes() {
  const imports = [
    ...new Set(
      elements.map((item) => `import type { ${item.classExport} } from '../${item.module}'`),
    ),
  ].join('\n')
  const entries = elements
    .map((item) => `  '${item.tag}': TimelessElementProps<${item.classExport}>`)
    .join('\n')
  return `${imports}\nimport type { UITransitionDetail } from '../events'\n\ntype DataAttributes = { [name: \`data-\${string}\`]: unknown }\ntype AriaAttributes = { [name: \`aria-\${string}\`]: string | number | boolean | undefined }\n\nexport type TimelessElementProps<TElement extends HTMLElement> = Partial<\n  Omit<TElement, keyof HTMLElement>\n> &\n  DataAttributes &\n  AriaAttributes & {\n    children?: unknown\n    class?: string\n    className?: string\n    id?: string\n    ref?: unknown\n    role?: string\n    slot?: string\n    style?: Record<string, string | number>\n    title?: string\n    'onui-before-change'?: (event: CustomEvent<UITransitionDetail<unknown>>) => void\n    'onui-change'?: (event: CustomEvent<UITransitionDetail<unknown>>) => void\n  }\n\nexport interface TimelessIntrinsicElements {\n${entries}\n}\n\n// @ts-ignore React is an optional consumer dependency.\ndeclare module 'react' {\n  namespace JSX {\n    interface IntrinsicElements extends TimelessIntrinsicElements {}\n  }\n}\n\n// @ts-ignore React is an optional consumer dependency.\ndeclare module 'react/jsx-runtime' {\n  namespace JSX {\n    interface IntrinsicElements extends TimelessIntrinsicElements {}\n  }\n}\n\nexport {}\n`
}
