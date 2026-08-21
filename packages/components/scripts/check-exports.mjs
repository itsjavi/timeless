import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { elements } from './element-registry.mjs'

const packageRoot = resolve(import.meta.dirname, '..')
const packageJson = JSON.parse(await readFile(resolve(packageRoot, 'package.json'), 'utf8'))
const explicitExports = Object.keys(packageJson.exports)

for (const item of elements) {
  const subpath = `./${item.tag.slice(3)}`
  if (item.tag === 'ui-radio-group' || item.tag === 'ui-checkbox-group') continue
  if (item.tag === 'ui-toaster') continue
  assert(explicitExports.includes(subpath), `Missing class entrypoint ${subpath}`)
  await import(resolve(packageRoot, `dist/${item.module}.js`))
  await import(resolve(packageRoot, `dist/define/${item.tag}.js`))
}

/*
 * The `register/*` tier is the only entry point whose whole contract is a side effect, so "the
 * specifier resolves" proves nothing about it. Milestone 030 found the documented registration
 * instruction registering nothing precisely because no gate ever imported the thing the docs told a
 * consumer to import — so this one does, under a fabricated window, and asserts the tag arrives.
 *
 * A `define/*` import must stay inert here for the same reason: that is what makes it safe to import
 * while server rendering, and the two halves of the pair are only meaningful against each other.
 */
assert(explicitExports.includes('./register'), 'Missing aggregate register entrypoint ./register')
assert(explicitExports.includes('./register/*'), 'Missing per-element register entrypoint pattern')
for (const pattern of ['./dist/register.js', './dist/register/*.js']) {
  assert(
    packageJson.sideEffects.includes(pattern),
    `sideEffects must list ${pattern}, or a bundler drops the registration`,
  )
}

for (const item of elements) {
  const inert = await withFabricatedWindow(
    () => import(`${resolve(packageRoot, `dist/define/${item.tag}.js`)}?probe=define`),
  )
  assert(
    inert.length === 0,
    `define/${item.tag} registered ${inert.join(', ')} on import; it must only export a function`,
  )

  const registered = await withFabricatedWindow(
    () => import(resolve(packageRoot, `dist/register/${item.tag}.js`)),
  )
  assert(
    registered.includes(item.tag),
    `register/${item.tag} registered ${registered.length === 0 ? 'nothing' : registered.join(', ')}`,
  )
}

const all = await withFabricatedWindow(() => import(resolve(packageRoot, 'dist/register.js')))
for (const item of elements) {
  assert(all.includes(item.tag), `register aggregate did not define ${item.tag}`)
}

/**
 * Runs one import against a throwaway `window` and returns the tags it defined. Node has no
 * `customElements`, and the element classes read `HTMLElement` off the realm rather than the module
 * global, so a bare object is enough for registration to be observable.
 */
async function withFabricatedWindow(load) {
  const defined = []
  const previous = {
    window: globalThis.window,
    customElements: globalThis.customElements,
    HTMLElement: globalThis.HTMLElement,
  }
  const registry = new Map()
  globalThis.HTMLElement = class {}
  globalThis.customElements = {
    define: (name, constructor) => {
      defined.push(name)
      registry.set(name, constructor)
    },
    get: (name) => registry.get(name),
  }
  globalThis.window = globalThis
  try {
    await load()
  } finally {
    globalThis.window = previous.window
    globalThis.customElements = previous.customElements
    globalThis.HTMLElement = previous.HTMLElement
  }
  return defined
}

await import(resolve(packageRoot, 'dist/index.js'))
await import(resolve(packageRoot, 'dist/define.js'))
await import(resolve(packageRoot, 'dist/collection.js'))
await import(resolve(packageRoot, 'dist/events.js'))
await import(resolve(packageRoot, 'dist/value-state.js'))
await import(resolve(packageRoot, 'dist/attributes.js'))
await import(resolve(packageRoot, 'dist/validate.js'))

// Every framework typing must resolve and must stay types-only. A declaration file that augments a
// framework module still compiles to an empty JavaScript module.
for (const framework of ['react', 'preact', 'solid', 'vue', 'svelte']) {
  const module = await import(resolve(packageRoot, `dist/${framework}.js`))
  assert(
    Object.keys(module).length === 0,
    `${framework} typings emitted runtime exports; they must be types only`,
  )
}

// The editor data files ship in the package, so a consumer can register them by path.
for (const file of [
  'custom-elements.json',
  'vscode.html-custom-data.json',
  'vscode.css-custom-data.json',
  'web-types.json',
]) {
  assert(packageJson.files.includes(file), `${file} is missing from the package files array`)
  await readFile(resolve(packageRoot, file), 'utf8')
}
assert(
  packageJson['web-types'] === './web-types.json',
  'the web-types field must point at the file',
)

for (const item of elements) {
  const cssExport = `./css/${item.css}`
  assert(packageJson.exports['./css/*.css'], `Missing CSS export pattern for ${cssExport}`)
}

function assert(condition, message) {
  if (!condition) throw new Error(`Export validation failed: ${message}`)
}
