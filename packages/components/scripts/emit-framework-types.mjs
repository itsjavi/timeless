/**
 * Framework typings, generated from the component registry.
 *
 * Every emitter here projects the same model: the plain attributes a `ui-*` host accepts, typed to
 * the value set the stylesheets prove; the DOM properties those attributes reflect, under the names
 * the element actually declares; and the element's own events, carrying the detail type it actually
 * dispatches. Only the surrounding declaration syntax and the event-prop convention differ.
 *
 * These are types-only modules. No emitter imports a framework at runtime, and no framework is a
 * dependency or a peer dependency of this package.
 */

import { valueSets } from './component-registry.mjs'

/** Global attributes every framework accepts on an intrinsic element. */
const GLOBAL_ATTRIBUTES = [
  ['children', 'unknown'],
  ['class', 'string'],
  ['dir', "'ltr' | 'rtl' | 'auto'"],
  ['hidden', "boolean | 'until-found'"],
  ['id', 'string'],
  ['inert', 'boolean'],
  ['lang', 'string'],
  ['part', 'string'],
  ['exportparts', 'string'],
  ['popover', "'auto' | 'manual' | 'hint'"],
  ['role', 'string'],
  ['slot', 'string'],
  ['title', 'string'],
]

function attributeType(attribute) {
  if (attribute.set) return valueSets[attribute.set].type
  if (attribute.type === 'boolean') return 'boolean'
  if (attribute.type === 'number') return 'number'
  return 'string'
}

/** `CustomEvent<TabsChangeDetail>` names a type the element's own module exports. */
function eventDetail(event) {
  const match = /^CustomEvent<(\w+)>$/.exec(event.type)
  return match ? match[1] : null
}

/**
 * The typed surface of one element: what an author writes, what the DOM reflects, and what it
 * dispatches. Property members are emitted only when the property name differs from the attribute
 * name, because an identical name is already covered by the attribute member.
 */
function elementModel(item) {
  // Keyed by member name so a reflecting property never redeclares its own attribute. `ui-tabs`
  // authors `value` and reads the live value back from the `value` property: one JSX member.
  const members = new Map()
  const add = (name, type, description) => {
    if (!members.has(name)) members.set(name, { name, type, description })
  }
  for (const attribute of item.attributes) {
    add(attribute.name, attributeType(attribute), attribute.description)
  }
  for (const attribute of item.attributes) {
    const property = attribute.property
    if (!property) continue
    const type = property.type ?? attributeType(attribute)
    add(
      property.name,
      type,
      property.live
        ? `Authored default and form-reset value, reflecting the \`${attribute.name}\` attribute.`
        : `DOM property reflecting the \`${attribute.name}\` attribute.`,
    )
    if (property.live) {
      add(
        property.live,
        type,
        'Live value. Assigning it does not rewrite the authored default and dispatches no transition event.',
      )
    }
  }
  return {
    tag: item.tag,
    interfaceName: `${item.classExport}Props`,
    module: item.module,
    members: [...members.values()],
    events: item.events.map((event) => ({
      name: event.name,
      detail: eventDetail(event),
      type: event.type,
      description: event.description,
    })),
  }
}

function docComment(text, indent = '  ') {
  if (!text) return ''
  const single = text.replaceAll('*/', '*\\/')
  return `${indent}/** ${single} */\n`
}

function memberLines(model, indent = '  ') {
  return model.members
    .map(
      (member) =>
        `${docComment(member.description, indent)}${indent}${propertyKey(member.name)}?: ${member.type}`,
    )
    .join('\n')
}

function propertyKey(name) {
  return /^[A-Za-z_$][\w$]*$/.test(name) ? name : `'${name}'`
}

/**
 * Event props, named the way the framework binds a custom event.
 *
 * `styles` lists every prop name to emit for one event, because Solid and Svelte changed their
 * binding syntax across major versions and both spellings must type-check.
 */
function eventLines(model, styles, indent = '  ') {
  return model.events
    .map((event) =>
      styles(event.name)
        .map(
          (prop) =>
            `${docComment(event.description, indent)}${indent}${propertyKey(prop)}?: (event: ${event.type}) => void`,
        )
        .join('\n'),
    )
    .join('\n')
}

const camel = (name) => name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
const pascal = (name) => {
  const value = camel(name)
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Type imports each generated module needs: the value-set unions and the event detail types. */
function imports(models, elements) {
  const byModule = new Map()
  const add = (module, name) => {
    const names = byModule.get(module) ?? new Set()
    names.add(name)
    byModule.set(module, names)
  }
  // Value-set unions live in the module that declares them, so the import path follows the set.
  for (const item of elements) {
    for (const attribute of item.attributes) {
      if (!attribute.set) continue
      const set = valueSets[attribute.set]
      add(`values/${set.module}`, set.type)
    }
  }
  for (const model of models) {
    for (const event of model.events) if (event.detail) add(model.module, event.detail)
  }
  return [...byModule]
    .map(([module, names]) => `import type { ${[...names].sort().join(', ')} } from './${module}'`)
    .join('\n')
}

function globalLines(extra = [], indent = '  ') {
  return [...GLOBAL_ATTRIBUTES, ...extra]
    .map(([name, type]) => `${indent}${propertyKey(name)}?: ${type}`)
    .join('\n')
}

const HEADER = (framework, note) =>
  `/**\n * ${framework} declarations for every Timeless custom element, generated from the component\n * registry. Types only: importing this module adds no runtime code and no ${framework} dependency.\n *\n * ${note}\n */`

/** JSX-family frameworks share one shape and differ only in the module they augment. */
function createJsxTypes({ framework, note, modules, namespace, extraGlobals, eventStyles }) {
  return (elements) => {
    const models = elements.map((item) => elementModel(item))
    const interfaces = models
      .map((model) => {
        const events = eventLines(model, eventStyles)
        return `export interface ${model.interfaceName} extends TimelessGlobalProps {\n${memberLines(model)}${events ? `\n${events}` : ''}\n}`
      })
      .join('\n\n')
    const entries = models.map((model) => `  '${model.tag}': ${model.interfaceName}`).join('\n')
    const augmentations = modules
      .map(
        (module) =>
          `// @ts-ignore ${framework} is an optional consumer dependency.\ndeclare module '${module}' {\n  namespace ${namespace} {\n    interface IntrinsicElements extends TimelessIntrinsicElements {}\n  }\n}`,
      )
      .join('\n\n')

    return `${HEADER(framework, note)}\n\n${imports(models, elements)}\n\n/**\n * Consumer-authored \`data-*\` and \`aria-*\` attributes stay open. The generated members above are\n * the escape hatch's opposite number: they are what completes and what type-checks.\n */\ntype OpenAttributes = {\n  [name: \`data-\${string}\`]: unknown\n  [name: \`aria-\${string}\`]: string | number | boolean | undefined\n}\n\nexport type TimelessGlobalProps = OpenAttributes & {\n${globalLines(extraGlobals)}\n}\n\n${interfaces}\n\nexport interface TimelessIntrinsicElements {\n${entries}\n}\n\n${augmentations}\n\nexport {}\n`
  }
}

export const createReactTypes = createJsxTypes({
  framework: 'React 19',
  note: 'React 19 is required: earlier versions stringify non-primitive props and never register `on*` listeners for custom elements.',
  modules: ['react', 'react/jsx-runtime'],
  namespace: 'JSX',
  extraGlobals: [
    ['className', 'string'],
    ['key', 'string | number'],
    ['ref', 'unknown'],
    ['style', 'Record<string, string | number>'],
    ['tabIndex', 'number'],
    ['dangerouslySetInnerHTML', '{ __html: string }'],
    ['suppressHydrationWarning', 'boolean'],
  ],
  eventStyles: (name) => [`on${name}`],
})

export const createPreactTypes = createJsxTypes({
  framework: 'Preact',
  note: 'Preact registers a listener for any `on*` prop, so `onui-change` binds the `ui-change` event with no wrapper.',
  modules: ['preact', 'preact/jsx-runtime'],
  namespace: 'JSX',
  extraGlobals: [
    ['className', 'string'],
    ['key', 'string | number'],
    ['ref', 'unknown'],
    ['style', 'string | Record<string, string | number>'],
    ['tabIndex', 'number'],
    ['dangerouslySetInnerHTML', '{ __html: string }'],
  ],
  eventStyles: (name) => [`on${name}`],
})

export const createSolidTypes = createJsxTypes({
  framework: 'Solid',
  note: 'Both spellings are emitted: `on:ui-change` is the namespaced form Solid recommends for custom events, and `onui-change` is the delegated form.',
  modules: ['solid-js'],
  namespace: 'JSX',
  extraGlobals: [
    ['classList', 'Record<string, boolean | undefined>'],
    ['ref', 'unknown'],
    ['style', 'string | Record<string, string | number>'],
    ['tabindex', 'number'],
    ['innerHTML', 'string'],
  ],
  eventStyles: (name) => [`on:${name}`, `on${name}`],
})

/** Vue camelizes a dashed event name, so `ui-change` is bound as `onUiChange`. */
export function createVueTypes(elements) {
  const models = elements.map((item) => elementModel(item))
  const interfaces = models
    .map((model) => {
      const events = eventLines(model, (name) => [`on${pascal(name)}`])
      return `export interface ${model.interfaceName} extends TimelessGlobalProps {\n${memberLines(model)}${events ? `\n${events}` : ''}\n}`
    })
    .join('\n\n')
  const components = models
    .map((model) => `    '${model.tag}': new () => { $props: ${model.interfaceName} }`)
    .join('\n')

  return `${HEADER('Vue', 'Vue resolves `ui-*` tags as components before falling back to elements, so the declarations register them on `GlobalComponents` rather than on the intrinsic-element list. Keep `compilerOptions.isCustomElement` configured as the framework guide describes.')}

${imports(models, elements)}

type OpenAttributes = {
  [name: \`data-\${string}\`]: unknown
  [name: \`aria-\${string}\`]: string | number | boolean | undefined
}

export type TimelessGlobalProps = OpenAttributes & {
${globalLines([
  ['key', 'string | number'],
  ['ref', 'unknown'],
  ['style', 'string | Record<string, string | number>'],
  ['tabindex', 'number'],
  ['innerHTML', 'string'],
])}
}

${interfaces}

// @ts-ignore Vue is an optional consumer dependency.
declare module '@vue/runtime-dom' {
  interface GlobalComponents {
${components}
  }
}

export {}
`
}

/** Svelte 5 binds custom events as `onui-change`; Svelte 4 used `on:ui-change`. Emit both. */
export function createSvelteTypes(elements) {
  const models = elements.map((item) => elementModel(item))
  const interfaces = models
    .map((model) => {
      const events = eventLines(model, (name) => [`on:${name}`, `on${name}`])
      return `export interface ${model.interfaceName} extends TimelessGlobalProps {\n${memberLines(model)}${events ? `\n${events}` : ''}\n}`
    })
    .join('\n\n')
  const entries = models.map((model) => `    '${model.tag}': ${model.interfaceName}`).join('\n')

  return `${HEADER('Svelte', 'Both event spellings are emitted so the declarations type-check under Svelte 4 `on:ui-change` and Svelte 5 `onui-change`.')}

${imports(models, elements)}

type OpenAttributes = {
  [name: \`data-\${string}\`]: unknown
  [name: \`aria-\${string}\`]: string | number | boolean | undefined
}

export type TimelessGlobalProps = OpenAttributes & {
${globalLines([
  ['style', 'string'],
  ['tabindex', 'number'],
])}
}

${interfaces}

declare global {
  namespace svelteHTML {
    interface IntrinsicElements {
${entries}
    }
  }
}

export {}
`
}
