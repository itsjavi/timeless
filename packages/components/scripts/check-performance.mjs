import { gzipSync } from 'node:zlib'
import { readFile, stat } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { components } from './component-registry.mjs'

const packageRoot = resolve(import.meta.dirname, '..')
const distRoot = resolve(packageRoot, 'dist')
const baselines = JSON.parse(
  await readFile(resolve(import.meta.dirname, 'performance-baselines.json'), 'utf8'),
)
/**
 * `gzipBytes` sums each module gzipped on its own, so it reflects how the bundler splits chunks as
 * well as how much code an entrypoint pulls in. Splitting the same bytes into one more chunk raises
 * it. Read `rawBytes` first when a figure moves, and re-baseline rather than shrinking real code to
 * satisfy an artifact.
 *
 * The CSS figures cover every stylesheet the entry's contract declares, not just the one named after
 * it. Measuring a single file would let a component look cheaper simply by moving rules into a
 * shared stylesheet a consumer still has to load.
 */
const entryNames = ['popover', 'listbox', 'select', 'combobox']
const stylesheetsByEntry = new Map(components.map((component) => [component.name, component.css]))
const measurements = {}

for (const entryName of entryNames) {
  const files = await dependencyClosure(resolve(distRoot, `${entryName}.js`))
  const contents = await Promise.all(files.map((path) => readFile(path)))
  const stylesheets = stylesheetsByEntry.get(entryName) ?? [`${entryName}.css`]
  const css = await Promise.all(
    stylesheets.map((stylesheet) => readFile(resolve(distRoot, `css/${stylesheet}`))),
  )
  measurements[entryName] = {
    cssGzipBytes: css.reduce((total, content) => total + gzipSync(content).byteLength, 0),
    cssRawBytes: css.reduce((total, content) => total + content.byteLength, 0),
    gzipBytes: contents.reduce((total, content) => total + gzipSync(content).byteLength, 0),
    modules: files.map((path) => basename(path)).sort(),
    rawBytes: contents.reduce((total, content) => total + content.byteLength, 0),
    stylesheets: [...stylesheets].sort(),
  }
}

if (process.argv.includes('--measure')) {
  console.log(JSON.stringify({ entries: measurements }, null, 2))
  process.exit(0)
}

for (const entryName of entryNames) {
  const current = measurements[entryName]
  const baseline = baselines.entries[entryName]
  assert(baseline, `Missing performance baseline for ${entryName}`)
  for (const metric of ['cssGzipBytes', 'cssRawBytes', 'gzipBytes', 'rawBytes']) {
    assert(
      current[metric] <= Math.ceil(baseline[metric] * 1.1),
      `${entryName} ${metric} grew from ${baseline[metric]} to ${current[metric]}`,
    )
  }
}

for (const forbidden of ['color-picker.js', 'dialog.js', 'sheet.js', 'toast.js']) {
  assert(
    !measurements.combobox.modules.includes(forbidden),
    `The combobox entrypoint unexpectedly loads ${forbidden}`,
  )
}

async function dependencyClosure(entryPath) {
  const pending = [entryPath]
  const visited = new Set()
  while (pending.length > 0) {
    const path = pending.pop()
    if (!path || visited.has(path)) continue
    await stat(path)
    visited.add(path)
    const source = await readFile(path, 'utf8')
    for (const match of source.matchAll(/(?:from\s+|import\s*)["'](\.\/.+?\.js)["']/g)) {
      pending.push(resolve(dirname(path), match[1]))
    }
  }
  return [...visited].sort()
}

function assert(condition, message) {
  if (!condition) throw new Error(`Performance boundary failed: ${message}`)
}
