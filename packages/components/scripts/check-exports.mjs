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
