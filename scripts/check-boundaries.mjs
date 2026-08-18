import { readFile, readdir } from 'node:fs/promises'
import { extname, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const violations = []
for (const directory of ['apps', 'packages']) await scan(resolve(root, directory))

if (violations.length > 0) {
  throw new Error(`Dependency boundary failed:\n${violations.join('\n')}`)
}

async function scan(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (entry.name === 'dist' || entry.name === 'dist-storylite' || entry.name === 'node_modules')
      continue
    const target = resolve(path, entry.name)
    if (entry.isDirectory()) {
      await scan(target)
      continue
    }
    if (!['.js', '.mjs', '.ts', '.tsx'].includes(extname(entry.name))) continue
    const source = await readFile(target, 'utf8')
    const relative = target.slice(root.length + 1)
    if (/(?:from\s+|import\s*\(|require\s*\()["'][^"']*\.local\//.test(source)) {
      violations.push(`${relative}: source cannot import from the ignored .local directory`)
    }
    if (
      (relative.startsWith('packages/core/') || relative.startsWith('packages/components/')) &&
      /["']@timelessui\/examples(?:["'/])/.test(source)
    ) {
      violations.push(`${relative}: published packages cannot depend on @timelessui/examples`)
    }
  }
}
