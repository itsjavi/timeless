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
await import(resolve(packageRoot, 'dist/jsx/react.js'))
await import(resolve(packageRoot, 'dist/collection.js'))
await import(resolve(packageRoot, 'dist/events.js'))
await import(resolve(packageRoot, 'dist/value-state.js'))

for (const item of elements) {
  const cssExport = `./css/${item.css}`
  assert(packageJson.exports['./css/*.css'], `Missing CSS export pattern for ${cssExport}`)
}

function assert(condition, message) {
  if (!condition) throw new Error(`Export validation failed: ${message}`)
}
