/**
 * The agent-facing routes are only useful if they exist, resolve, and stay small enough to read.
 * Nothing else in the repository proves that, because none of it is a component contract:
 * `validate-docs.mjs` proves every element and stylesheet is documented, and `generate:check` proves
 * the skill's contract reference matches the registry, but neither knows whether `/llms.txt` shipped
 * or whether the link it advertises for a new component resolves.
 *
 * Reads `dist`, so it runs after a build. `pnpm test:full-qa` builds first.
 */
import { access, readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { examples } from '@timelessui/examples'
import { LLMS_TXT_TOKEN_BUDGET, estimateTokens, SITE } from '../src/lib/agent-surfaces.ts'

const app = resolve(import.meta.dirname, '..')
const dist = resolve(app, 'dist')
const root = resolve(app, '../..')

await access(dist).catch(() => {
  throw new Error('No dist directory. Run pnpm -F @apps/web run build first.')
})

const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  )

/** Enough to catch an endpoint that emitted a header and nothing else. */
const MINIMUM_MARKDOWN_BYTES = 200

const documented = examples.filter((example) => example.domain !== 'recipes')

for (const example of documented) {
  const path = resolve(dist, `docs/components/${example.id}.md`)
  if (!(await exists(path))) {
    throw new Error(
      `No Markdown route for ${example.id}. Every documented component needs /docs/components/${example.id}.md.`,
    )
  }
  const body = await readFile(path, 'utf8')
  if (body.length < MINIMUM_MARKDOWN_BYTES) {
    throw new Error(`${example.id}.md is ${body.length} bytes, which cannot be a full contract.`)
  }
  /* The markup block is the payload an agent copies. A page without one is not worth serving. */
  if (!body.includes('## Markup')) {
    throw new Error(`${example.id}.md has no Markup section.`)
  }
}

/* The guides come from starlight-dot-md, so this catches the plugin silently dropping a page. */
const guides = await collectMdx(resolve(app, 'src/content/docs/docs'))
for (const guide of guides) {
  const path = resolve(dist, `${guide}.md`)
  if (!(await exists(path))) {
    throw new Error(
      `No Markdown route for the guide at /${guide}. Check the starlight-dot-md plugin.`,
    )
  }
}

const llms = await readFile(resolve(dist, 'llms.txt'), 'utf8').catch(() => {
  throw new Error('No dist/llms.txt.')
})

const tokens = estimateTokens(llms)
if (tokens > LLMS_TXT_TOKEN_BUDGET) {
  throw new Error(
    `llms.txt is roughly ${tokens} tokens, over its ${LLMS_TXT_TOKEN_BUDGET} budget. It exists to be read in full alongside real work — move detail into llms-full.txt or a component page.`,
  )
}

/*
 * Every link llms.txt advertises has to resolve. This is the assertion that fails when a component is
 * added to the catalog and the route generation is not wired up, which is the whole failure mode.
 */
const links = [...llms.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((match) => match[1])
if (links.length === 0) throw new Error('llms.txt advertises no links.')

for (const link of links) {
  if (!link.startsWith(`${SITE}/`)) {
    throw new Error(
      `llms.txt links off-site to ${link}. Every entry must be a page this site emits.`,
    )
  }
  const route = link.slice(`${SITE}/`.length)
  /* A file route (`.md`, `.txt`) is emitted verbatim; a directory route is emitted as `index.html`. */
  const trimmed = route.replace(/\/$/, '')
  const candidate = /\.[a-z0-9]+$/i.test(trimmed) ? trimmed : `${trimmed}/index.html`
  if (!(await exists(resolve(dist, candidate)))) {
    throw new Error(
      `llms.txt links to ${link}, which was not emitted (looked for dist/${candidate}).`,
    )
  }
}

if (!(await exists(resolve(dist, 'llms-full.txt')))) throw new Error('No dist/llms-full.txt.')

/*
 * The authoring grammar is declared once in `packages/components/scripts/authoring-grammar.mjs` and
 * projected into the skill, `context7.json`, the agents page, and this file. `generate:check` proves
 * the projections are current; this proves the website actually serves one rather than a stale copy of
 * its own, which is the failure the single-sourcing exists to prevent.
 */
const grammarSource = await readFile(
  resolve(root, 'packages/components/skills/using-timeless-ui/reference/grammar.md'),
  'utf8',
)
const grammar = grammarSource
  .replace(/^<!--[\s\S]*?-->$/m, '')
  .replace(/^#\s.*$/m, '')
  .trim()

if (!llms.includes(grammar)) {
  throw new Error(
    'llms.txt does not carry the generated authoring grammar verbatim. It must serve reference/grammar.md, not its own copy.',
  )
}

const agentsPage = await readFile(resolve(dist, 'docs/reference/agents/index.html'), 'utf8').catch(
  () => {
    throw new Error('No dist/docs/reference/agents/index.html.')
  },
)
/* One rule, spot-checked in rendered form, proves the page renders the generated block. */
if (!agentsPage.includes('Never author')) {
  throw new Error('The agents page does not render the generated AGENTS.md block.')
}

/* The skill is a published artifact, so the manifest has to carry it or consumers never see it. */
const components = resolve(root, 'packages/components')
const manifest = JSON.parse(await readFile(resolve(components, 'package.json'), 'utf8'))

for (const path of [
  'skills/using-timeless-ui/SKILL.md',
  'skills/using-timeless-ui/reference/contracts.md',
]) {
  if (!(await exists(resolve(components, path)))) throw new Error(`Missing ${path}.`)
}
if (!manifest.files.includes('skills')) {
  throw new Error('packages/components/package.json does not ship "skills" in files.')
}
if (!manifest.aiAgentSkill) {
  throw new Error('packages/components/package.json declares no aiAgentSkill.')
}

console.log(
  `Validated ${documented.length} component and ${guides.length} guide Markdown routes, ${links.length} llms.txt links (~${tokens} tokens), and the published skill.`,
)

/** Collection ids, the way Starlight derives them: `docs/styling/css`, with `index` collapsed. */
async function collectMdx(directory, prefix = 'docs') {
  const found = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      found.push(...(await collectMdx(resolve(directory, entry.name), `${prefix}/${entry.name}`)))
      continue
    }
    if (!entry.name.endsWith('.mdx') && !entry.name.endsWith('.md')) continue
    const base = entry.name.replace(/\.mdx?$/, '')
    found.push(base === 'index' ? prefix : `${prefix}/${base}`)
  }
  return found
}
