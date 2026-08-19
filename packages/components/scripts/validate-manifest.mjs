import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { elements } from './element-registry.mjs'

const packageRoot = resolve(import.meta.dirname, '..')
const manifest = JSON.parse(await readFile(resolve(packageRoot, 'custom-elements.json'), 'utf8'))

assert(manifest.schemaVersion === '2.1.0', 'schemaVersion must be 2.1.0')
assert(Array.isArray(manifest.modules), 'modules must be an array')
assert(manifest.modules.length === elements.length, 'every registered element must have one module')

const tags = new Set()
for (const module of manifest.modules) {
  assert(module.kind === 'javascript-module', 'module kind must be javascript-module')
  assert(typeof module.path === 'string' && module.path.length > 0, 'module path is required')
  assert(Array.isArray(module.declarations), 'module declarations must be an array')
  assert(Array.isArray(module.exports), 'module exports must be an array')
  for (const declaration of module.declarations) {
    assert(declaration.kind === 'class', 'custom element declarations must be classes')
    assert(declaration.customElement === true, 'custom element flag is required')
    assert(/^ui-[a-z0-9-]+$/.test(declaration.tagName), 'tag names must use the ui prefix')
    assert(!tags.has(declaration.tagName), `duplicate manifest tag ${declaration.tagName}`)
    tags.add(declaration.tagName)
    assert(
      !JSON.stringify(declaration).includes('data-ui-invalid'),
      'internal attributes must not be public',
    )
  }
}

for (const item of elements) assert(tags.has(item.tag), `manifest is missing ${item.tag}`)

await validateDeclaredEvents()
await validateEventDetailTypes()
validateAuthoredParts()

console.log(`Validated the Custom Elements Manifest for ${elements.length} elements.`)

/**
 * Every namespaced event a module dispatches must be declared by the elements that module defines.
 * Without this, an element can dispatch `ui-open` for months while its documentation says it has no
 * events at all.
 */
async function validateDeclaredEvents() {
  const modules = new Map()
  for (const item of elements) {
    const entry = modules.get(item.module) ?? { declared: new Set(), tags: [] }
    for (const event of item.events) entry.declared.add(event.name)
    entry.tags.push(item.tag)
    modules.set(item.module, entry)
  }

  for (const [module, { declared, tags }] of modules) {
    const source = await readFile(resolve(packageRoot, `src/${module}.ts`), 'utf8')
    const dispatched = new Set()
    for (const pattern of [
      /(?:emit|dispatchUITransitionEvent)[^(\n]*\(\s*'(ui-[a-z-]+)'/g,
      /new \w*Event\w*[^(\n]*\(\s*'(ui-[a-z-]+)'/g,
    ]) {
      for (const match of source.matchAll(pattern)) dispatched.add(match[1])
    }
    for (const name of dispatched) {
      assert(
        declared.has(name),
        `src/${module}.ts dispatches ${name}, which ${tags.join(' / ')} does not declare`,
      )
    }
  }
}

/**
 * A `CustomEvent<TabsChangeDetail>` declaration is only useful if a consumer can import
 * `TabsChangeDetail`. Prove every named detail type is exported by the module that dispatches it,
 * so the manifest and the generated framework typings can never name a type that does not exist.
 */
async function validateEventDetailTypes() {
  for (const item of elements) {
    if (item.events.length === 0) continue
    const source = await readFile(resolve(packageRoot, `src/${item.module}.ts`), 'utf8')
    for (const event of item.events) {
      const detail = /^CustomEvent<(\w+)>$/.exec(event.type)?.[1]
      if (!detail) continue
      assert(
        new RegExp(`export type ${detail}\\b|\\b${detail},`).test(source),
        `${item.tag} declares ${event.name} as ${event.type}, but src/${item.module}.ts does not export ${detail}`,
      )
    }
  }
}

/**
 * Timeless anatomy is authored Light DOM, so parts are reported under `timeless:parts` with the
 * selector an author actually writes. `cssParts` would claim a `::part()` contract this library does
 * not have, and a private runtime hook must never reach the published manifest.
 */
function validateAuthoredParts() {
  for (const module of manifest.modules) {
    for (const declaration of module.declarations) {
      assert(
        declaration.cssParts === undefined,
        `${declaration.tagName} declares cssParts, but Timeless parts are Light DOM`,
      )
      for (const part of declaration['timeless:parts'] ?? []) {
        assert(
          typeof part.selector === 'string' && part.selector.length > 0,
          `${declaration.tagName} part ${part.name} has no selector`,
        )
        assert(
          !part.selector.includes('data-ui-internal-'),
          `${declaration.tagName} part ${part.name} exposes a private runtime hook`,
        )
      }
    }
  }
  assert(
    !JSON.stringify(manifest).includes('data-ui-internal-'),
    'private runtime hooks must not appear anywhere in the manifest',
  )
}

function assert(condition, message) {
  if (!condition) throw new Error(`Invalid Custom Elements Manifest: ${message}`)
}
