import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const sourceRoot = resolve(import.meta.dirname, '../src')
const violations = []
for (const entry of await readdir(sourceRoot, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.ts') || entry.name.endsWith('.test.ts')) continue
  if (entry.name === 'toast.ts') continue
  const source = await readFile(resolve(sourceRoot, entry.name), 'utf8')
  if (/\.createElement\s*\(|\.insertAdjacentHTML\s*\(|\.innerHTML\s*=/.test(source)) {
    violations.push(entry.name)
  }
}

if (violations.length > 0) {
  throw new Error(
    `Generated visual DOM is reserved for the documented Toast helper: ${violations.join(', ')}`,
  )
}
