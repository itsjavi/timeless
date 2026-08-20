import { access, readFile, readdir } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { examples } from '@timelessui/examples'

const root = resolve(import.meta.dirname, '../../..')
const manifest = JSON.parse(
  await readFile(resolve(root, 'packages/components/custom-elements.json'), 'utf8'),
)
const packageJson = JSON.parse(
  await readFile(resolve(root, 'packages/components/package.json'), 'utf8'),
)
const exportKeys = Object.keys(packageJson.exports)
const manifestTags = new Set(
  manifest.modules.flatMap((module) =>
    (module.declarations ?? []).flatMap((declaration) =>
      declaration.tagName ? [declaration.tagName] : [],
    ),
  ),
)
const documentedTags = new Set(examples.flatMap((example) => example.definitions))
const missingTags = [...manifestTags].filter((tag) => !documentedTags.has(tag))
if (missingTags.length > 0)
  throw new Error(`Undocumented custom elements: ${missingTags.join(', ')}`)

/**
 * Recursive, and relative to `src/css`, so `core/<component>.css` and
 * `themes/atmosphere/<component>.css` are each required to appear in some example's `styles`. A
 * non-recursive listing would have gone quiet on both directories at once — the completeness gate
 * skipping precisely the files milestone 028 moved there. `components.css` and `core.css` are the two
 * aggregates; no example lists an aggregate.
 */
const AGGREGATE_CSS = new Set(['components.css', 'core.css', 'themes/atmosphere.css'])
const cssRoot = resolve(root, 'packages/components/src/css')
const availableCss = (await readdir(cssRoot, { recursive: true }))
  .map((name) => name.split(sep).join('/'))
  .filter((name) => name.endsWith('.css') && !AGGREGATE_CSS.has(name))
const documentedCss = new Set(examples.flatMap((example) => example.styles))
const missingCss = availableCss.filter((name) => !documentedCss.has(name))
if (missingCss.length > 0) throw new Error(`Undocumented CSS exports: ${missingCss.join(', ')}`)

for (const framework of ['vanilla', 'react', 'astro', 'svelte', 'vue', 'solid']) {
  await access(resolve(root, `apps/web/src/content/docs/docs/frameworks/${framework}.mdx`))
}

const contentRoot = resolve(root, 'apps/web/src/content/docs')
const contentFiles = (await walk(contentRoot)).filter((path) => extname(path) === '.mdx')
const contentRoutes = new Set()
for (const file of contentFiles) {
  const route = file.slice(contentRoot.length + 1).replace(/(?:\/index)?\.mdx$/, '')
  if (contentRoutes.has(route)) throw new Error(`Duplicate documentation route: ${route}`)
  contentRoutes.add(route)

  const source = await readFile(file, 'utf8')
  for (const match of source.matchAll(
    /([`'"])(@timelessui\/components(?:\/[a-z0-9_./*-]+)?)\1/gi,
  )) {
    const documentedImport = match[2]
    const suffix = documentedImport.slice('@timelessui/components'.length)
    const subpath = suffix ? `.${suffix}` : '.'
    if (!isExported(subpath))
      throw new Error(`${file} documents unknown import ${documentedImport}`)
  }
  for (const match of source.matchAll(/<ComponentPreview\s+id=["']([^"']+)["']/g)) {
    if (!examples.some((example) => example.id === match[1])) {
      throw new Error(`${file} references missing example ${match[1]}`)
    }
  }
}

console.log(
  `Validated documentation for ${examples.length} examples, ${manifestTags.size} elements, and ${availableCss.length} CSS exports.`,
)

function isExported(subpath) {
  if (subpath === packageJson.customElements) return true
  return exportKeys.some((key) => {
    if (!key.includes('*')) return key === subpath
    const [prefix, suffix] = key.split('*')
    return subpath.startsWith(prefix) && subpath.endsWith(suffix)
  })
}

async function walk(directory) {
  const paths = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) paths.push(...(await walk(path)))
    else paths.push(path)
  }
  return paths
}
