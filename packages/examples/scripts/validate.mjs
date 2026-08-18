import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { examples, renderExample } from '../src/catalog.ts'
import { components } from '../../components/scripts/component-registry.mjs'

const root = resolve(import.meta.dirname, '../../..')
const manifest = JSON.parse(
  await readFile(resolve(root, 'packages/components/custom-elements.json'), 'utf8'),
)
const packageJson = JSON.parse(
  await readFile(resolve(root, 'packages/components/package.json'), 'utf8'),
)
const exportKeys = Object.keys(packageJson.exports)
const publicTags = new Set(
  manifest.modules.flatMap((module) =>
    (module.declarations ?? []).flatMap((declaration) =>
      declaration.tagName ? [declaration.tagName] : [],
    ),
  ),
)
const cssDirectory = resolve(root, 'packages/components/src/css')
const cssFiles = new Set((await readdir(cssDirectory)).filter((name) => name.endsWith('.css')))
const publicConfiguration = new Set(
  components.flatMap((component) =>
    component.attributes.flatMap((attribute) =>
      attribute.name.startsWith('data-ui-') ? [attribute.name] : [],
    ),
  ),
)
const contractsByName = new Map(components.map((component) => [component.name, component]))
const publicParts = new Set(
  components.flatMap((component) => component.parts.map((part) => part.name)),
)
const publicClassRoots = new Set(
  components.flatMap((component) => (component.root.kind === 'class' ? [component.root.name] : [])),
)
const demoOnlyClasses = new Set(['ui-form-demo-actions', 'ui-form-demo-stack', 'ui-primitive-copy'])
const ids = new Set()

for (const example of examples) {
  if (ids.has(example.id)) throw new Error(`Duplicate example id: ${example.id}`)
  ids.add(example.id)
  for (const tag of example.definitions) {
    if (!publicTags.has(tag)) throw new Error(`${example.id} uses unknown definition ${tag}`)
    if (!isExported(`./define/${tag}`)) {
      throw new Error(`${example.id} uses unexported definition ${tag}`)
    }
  }
  for (const style of example.styles) {
    if (!cssFiles.has(style)) throw new Error(`${example.id} uses unknown style ${style}`)
    if (!isExported(`./css/${style}`))
      throw new Error(`${example.id} uses unexported style ${style}`)
  }
  // Every documented component needs a sidebar group; recipes are composed examples, not entries.
  if (example.domain === 'recipes') {
    if (example.group) throw new Error(`${example.id} is a recipe and must not declare a group`)
  } else if (!example.group) {
    throw new Error(`${example.id} has no documentation group`)
  }
  // Documentation renders the API of exactly these contracts, so each one must exist and the
  // example must import the stylesheet that implements it.
  if (example.contracts.length === 0) {
    throw new Error(`${example.id} documents no component contract`)
  }
  for (const name of example.contracts) {
    const contract = contractsByName.get(name)
    if (!contract) throw new Error(`${example.id} references unknown contract ${name}`)
    for (const stylesheet of contract.css) {
      if (!example.styles.includes(stylesheet)) {
        throw new Error(
          `${example.id} documents ${name} but does not import its stylesheet ${stylesheet}`,
        )
      }
    }
  }
  const html = renderExample(example)
  if (!html.trim()) throw new Error(`${example.id} rendered an empty example`)
  const renderedTags = new Set([...html.matchAll(/<\s*(ui-[a-z0-9-]+)/g)].map((match) => match[1]))
  for (const tag of renderedTags) {
    if (!publicTags.has(tag)) throw new Error(`${example.id} renders unregistered element ${tag}`)
    if (publicTags.has(tag) && !example.definitions.includes(tag)) {
      throw new Error(`${example.id} renders ${tag} without declaring its definition`)
    }
  }
  for (const match of html.matchAll(/\b(data-ui-[a-z0-9-]+)(?:="([^"]*)")?/g)) {
    const [, name, value = ''] = match
    if (name.startsWith('data-ui-internal-')) {
      throw new Error(`${example.id} authors private runtime hook ${name}`)
    }
    if (name === 'data-ui-part') {
      for (const token of value.split(/\s+/).filter(Boolean)) {
        if (!publicParts.has(token)) throw new Error(`${example.id} uses unknown part ${token}`)
      }
      continue
    }
    if (name === 'data-ui-value' || publicConfiguration.has(name)) continue
    throw new Error(`${example.id} uses unknown public attribute ${name}`)
  }
  for (const match of html.matchAll(/\bclass="([^"]*)"/g)) {
    for (const name of match[1].split(/\s+/).filter((token) => token.startsWith('ui-'))) {
      if (!publicClassRoots.has(name) && !demoOnlyClasses.has(name)) {
        throw new Error(`${example.id} uses uncatalogued public class ${name}`)
      }
    }
  }
}

console.log(`Validated ${examples.length} canonical examples.`)

function isExported(subpath) {
  return exportKeys.some((key) => {
    if (!key.includes('*')) return key === subpath
    const [prefix, suffix] = key.split('*')
    return subpath.startsWith(prefix) && subpath.endsWith(suffix)
  })
}
