import { access, readFile, readdir } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { examples } from '@timelessui/examples'
import { valueSets } from '../../../packages/components/scripts/component-registry.mjs'
import {
  incompleteTiers,
  readStylesheetNames,
} from '../../../packages/examples/scripts/css-tiers.mjs'

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
 * skipping precisely the files milestone 028 moved there. `core.css` and `themes/atmosphere.css` are
 * the two aggregates; no example lists an aggregate.
 */
const AGGREGATE_CSS = new Set(['core.css', 'themes/atmosphere.css'])
const shippedStylesheets = await readStylesheetNames()
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

  /*
   * Every CSS import snippet has to name a real file and a complete set of tiers, by the same rule the
   * catalog's `styles` arrays answer to. Ten pages named a component's theme stylesheet with no
   * `themes/atmosphere/tokens.css`, so every `--ui-*` in the snippet a reader copied resolved to
   * nothing — milestone 028 fallout that no check was looking for, in the pages a first-time consumer
   * reads first.
   */
  const imported = [
    ...new Set(
      [...source.matchAll(/@timelessui\/components\/css\/([a-z0-9/.-]+\.css)/g)].map(
        (match) => match[1],
      ),
    ),
  ]
  for (const name of imported) {
    if (!shippedStylesheets.has(name) && !AGGREGATE_CSS.has(name)) {
      throw new Error(`${file} imports @timelessui/components/css/${name}, which does not exist`)
    }
  }
  for (const problem of incompleteTiers(imported, shippedStylesheets)) {
    throw new Error(`${file} imports ${problem}`)
  }
}

/**
 * `reference/packages.mdx` names every exported value array by hand, and it had drifted to 37 of 39 —
 * `collectionAlignments` and `optionFilterModes` were added to the registry and never to the prose. The
 * list is worth keeping by hand, because the sentence reads better than a generated table, but not
 * worth trusting: this proves it in both directions.
 */
const packagesReference = await readFile(
  resolve(contentRoot, 'docs/reference/packages.mdx'),
  'utf8',
)
const listStart = packagesReference.indexOf('Permitted values are also exported individually')
if (listStart === -1) {
  throw new Error(
    'reference/packages.mdx no longer names the exported value arrays; update this check or restore the list',
  )
}
const listEnd = packagesReference.indexOf('\n\n', listStart)
const namedArrays = new Set(
  [...packagesReference.slice(listStart, listEnd).matchAll(/`([a-zA-Z]+)`/g)].map(
    (match) => match[1],
  ),
)
const declaredArrays = Object.keys(valueSets)
const unnamed = declaredArrays.filter((name) => !namedArrays.has(name))
if (unnamed.length > 0) {
  throw new Error(
    `reference/packages.mdx does not name the exported value arrays ${unnamed.join(', ')}`,
  )
}
const invented = [...namedArrays].filter((name) => !declaredArrays.includes(name))
if (invented.length > 0) {
  throw new Error(
    `reference/packages.mdx names value arrays the registry does not declare: ${invented.join(', ')}`,
  )
}

/**
 * No page may claim the CSS is optional. Milestone 028 existed because two styling pages said so while
 * `floating.css` was the anchor-positioning implementation, and the landing page said it a third time
 * in a region the claim validator did not read. The wording is gone; this keeps it gone.
 *
 * Deliberately narrow. It forbids the one claim the library cannot honour, and leaves the honest
 * neighbours sayable — the Atmosphere *theme* is optional, and pages should keep saying that.
 */
const OPTIONAL_CSS_CLAIMS = [
  /\bcss\b[^.]{0,40}\bis (?:fully |entirely |completely )?optional/i,
  /\boptional\b[^.]{0,20}\bcss\b/i,
  /\bstylesheets?\b[^.]{0,30}\b(?:are|is) (?:fully |entirely |completely )?optional/i,
  /\b(?:without|no) [Tt]imeless (?:CSS|stylesheets?)\b/,
  /\bno [Tt]imeless stylesheet at all\b/i,
]
for (const file of contentFiles) {
  const source = await readFile(file, 'utf8')
  for (const pattern of OPTIONAL_CSS_CLAIMS) {
    const match = source.match(pattern)
    if (!match) continue
    throw new Error(
      `${file} claims the CSS is optional ("${match[0]}"); core is required, and only the theme is optional`,
    )
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
