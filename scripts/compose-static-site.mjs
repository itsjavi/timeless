import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const web = resolve(root, 'apps/web/dist')
const stories = resolve(root, 'apps/stories/dist-storylite')
const output = resolve(root, 'dist-site')

await requireFile(resolve(web, 'index.html'))
await requireFile(resolve(web, 'docs/index.html'))
await requireFile(resolve(web, '404.html'))
await requireFile(resolve(stories, 'index.html'))

const storyIndex = await readFile(resolve(stories, 'index.html'), 'utf8')
if (!storyIndex.includes('/stories/')) {
  throw new Error('StoryLite was not built with STORYLITE_BASE=/stories/.')
}

await rm(output, { force: true, recursive: true })
await mkdir(output, { recursive: true })
await cp(web, output, { recursive: true })
await composeStories(stories, resolve(output, 'stories'))

for (const entry of ['index.html', 'docs/index.html', 'stories/index.html', '404.html']) {
  await requireFile(resolve(output, entry))
}

await validateLinks(output)
console.log('Composed dist-site with Astro, Starlight, and StoryLite.')

async function composeStories(source, destination) {
  await mkdir(destination, { recursive: true })
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name === 'stories') {
      for (const story of await readdir(resolve(source, entry.name), { withFileTypes: true })) {
        await cp(resolve(source, entry.name, story.name), resolve(destination, story.name), {
          recursive: story.isDirectory(),
          errorOnExist: true,
        })
      }
      continue
    }
    await cp(resolve(source, entry.name), resolve(destination, entry.name), {
      recursive: entry.isDirectory(),
      errorOnExist: true,
    })
  }

  for (const filename of ['index.html', 'project.js']) {
    const path = resolve(destination, filename)
    const content = await readFile(path, 'utf8')
    await writeFile(path, content.replaceAll('./stories/', './'))
  }
}

async function requireFile(path) {
  const info = await stat(path).catch(() => undefined)
  if (!info?.isFile()) throw new Error(`Missing required site entry: ${path}`)
}

async function validateLinks(directory) {
  const htmlFiles = await walk(directory)
  const missing = []
  for (const file of htmlFiles.filter((path) => extname(path) === '.html')) {
    const html = await readFile(file, 'utf8')
    for (const match of html.matchAll(/(?:href|src)=["'](\/[^"]+?)["']/g)) {
      const pathname = match[1].split(/[?#]/)[0]
      if (!pathname || pathname.startsWith('//')) continue
      const target = resolve(directory, `.${pathname}`)
      if (await existsAsRoute(target)) continue
      missing.push(`${file.slice(directory.length + 1)} -> ${pathname}`)
    }
  }
  if (missing.length > 0) throw new Error(`Missing internal site targets:\n${missing.join('\n')}`)
}

async function existsAsRoute(path) {
  for (const candidate of [path, resolve(path, 'index.html'), `${path}.html`]) {
    if (await stat(candidate).catch(() => undefined)) return true
  }
  return false
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
