import { readdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const output = resolve(import.meta.dirname, '../dist-storylite')
const storiesDirectory = resolve(output, 'stories')
const entries = await readdir(storiesDirectory, { withFileTypes: true })
const routes = entries
  .filter((entry) => entry.isDirectory())
  .map((entry) => `/stories/${entry.name}/`)
  .sort()

if (!routes.some((route) => route.startsWith('/stories/library-'))) {
  throw new Error('The StoryLite catalog has no Library routes.')
}
if (!routes.some((route) => route.startsWith('/stories/recipes-'))) {
  throw new Error('The StoryLite catalog has no Recipes routes.')
}
const implementationPrefixes = [
  '/stories/css-primitives-',
  '/stories/form-primitives-',
  '/stories/collection-navigation-',
  '/stories/progressive-overlays-',
  '/stories/color-controls-',
]
const staleRoutes = routes.filter((route) =>
  implementationPrefixes.some((prefix) => route.startsWith(prefix)),
)
if (staleRoutes.length > 0) {
  throw new Error(`Implementation-oriented StoryLite routes remain:\n${staleRoutes.join('\n')}`)
}

const content = `${JSON.stringify(routes, null, 2)}\n`
await writeFile(resolve(output, 'story-routes.json'), content)
await writeFile(resolve(import.meta.dirname, '../story-routes.json'), content)
