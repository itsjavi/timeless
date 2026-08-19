/**
 * The bodies of `/llms.txt` and `/llms-full.txt`.
 *
 * They live here rather than in the route files because three callers need them: the two endpoints,
 * and `AgentSurfaceSizes.astro`, which publishes their measured token counts on the agents reference
 * page. A hardcoded token count in that page would be exactly the kind of unvalidated claim
 * `validate-claims.mjs` exists to prevent, so the number is measured from the same string that ships.
 */
import { getCollection } from 'astro:content'
import { examples } from '@timelessui/examples'
import { GROUP_ORDER, SITE } from './agent-surfaces.ts'
import { componentMarkdown } from './component-markdown.ts'

/**
 * The authoring grammar, stated once. Every line is about shape, never about a value — the values
 * live in the per-component `.md` files, which are generated from the contracts and proven against
 * the stylesheets. So nothing here can contradict the CSS, because nothing here names a value.
 *
 * This preamble is the highest-leverage text in the milestone. An agent arrives with a React and
 * Tailwind prior and no prior for this API; without these lines it writes
 * `<ui-button variant="primary">` and every fact downstream of that is wrong.
 */
const PREAMBLE = `# Timeless UI

> Framework-agnostic UI components built on modern web standards. Most components are plain CSS over
> native HTML and need no JavaScript; the rest are Light-DOM custom elements, used only where keyboard
> coordination, focus management, or state synchronisation cannot be expressed accessibly in CSS.
> Targets Baseline 2025 browsers. Usable from plain HTML, React, Preact, Vue, Svelte, Solid, or Astro.

## How to author Timeless markup

Read this before writing any Timeless markup. The API is not prop-based, and guessing from React or
Tailwind conventions produces markup that does not work.

There are two kinds of component, and they are configured differently:

- **CSS components** are a native element with a \`ui-*\` class. Configure them with \`data-ui-*\`
  attributes: \`<button class="ui-button" data-ui-variant="primary">\`. There is nothing to register
  and nothing to import beyond the stylesheet.
- **Custom elements** are a registered \`ui-*\` tag wrapping your own markup. Configure them with
  plain attributes, never \`data-ui-*\`: \`<ui-tabs orientation="vertical">\`. Register each one you
  use.

Mixing the two is the most common mistake. \`<ui-button variant="primary">\` is not a component;
\`data-ui-variant\` on a custom-element host is not configuration.

Further rules that apply to both kinds:

- Boolean attributes are presence-based. Author \`invalid\`, never \`invalid="true"\` or
  \`data-ui-invalid="true"\`.
- Anatomy inside a component is marked with a whitespace-separated \`data-ui-part\` token list, and
  selected with \`[data-ui-part~='name']\`. Required parts must be present for the component to work.
- \`data-ui-internal-*\` attributes are written by the runtime. Never author them, never style them.
- Native HTML semantics, ARIA, and platform pseudo-classes are authoritative for state. Do not add
  your own state classes.
- Timeless wires relationships, never content. Accessible names are always yours to supply.
- Import stylesheets from \`@timelessui/components/css/<file>\` and register elements from
  \`@timelessui/components/define/<tag>\`. Registration is per-element and explicit.
- Every component page below has a \`.md\` twin carrying its full contract — permitted attributes and
  values, authored parts, public state, custom properties, the element API, and canonical markup.
  Fetch that file rather than guessing.`

/** Sidebar sections, in the order the site presents them. */
const SECTION_ORDER = [
  ['docs/getting-started', 'Getting started'],
  ['docs/styling', 'Styling'],
  ['docs/frameworks', 'Frameworks'],
  ['docs/concepts', 'Concepts'],
  ['docs/reference', 'Reference'],
] as const

const documentedExamples = () => examples.filter((example) => example.domain !== 'recipes')

const bySidebarOrder = (
  left: { data: { sidebar?: { order?: number }; title: string } },
  right: { data: { sidebar?: { order?: number }; title: string } },
) =>
  (left.data.sidebar?.order ?? Number.MAX_SAFE_INTEGER) -
    (right.data.sidebar?.order ?? Number.MAX_SAFE_INTEGER) ||
  left.data.title.localeCompare(right.data.title)

export async function buildLlmsTxt(): Promise<string> {
  const docs = await getCollection('docs')
  const entry = (id: string, title: string, description?: string) =>
    `- [${title}](${SITE}/${id}.md)${description ? `: ${description}` : ''}`

  const lines: string[] = [PREAMBLE, '']

  const overview = docs.find((doc) => doc.id === 'docs')
  if (overview) {
    lines.push('## Overview', '')
    lines.push(entry(overview.id, overview.data.title, overview.data.description))
    lines.push('')
  }

  for (const [prefix, label] of SECTION_ORDER) {
    const section = docs.filter((doc) => doc.id.startsWith(`${prefix}/`)).sort(bySidebarOrder)
    if (section.length === 0) continue
    lines.push(`## ${label}`, '')
    for (const doc of section) lines.push(entry(doc.id, doc.data.title, doc.data.description))
    lines.push('')
  }

  const documented = documentedExamples()
  lines.push('## Components', '')
  lines.push(
    `${documented.length} components. Each link is the component's full contract as Markdown.`,
    '',
  )
  for (const group of GROUP_ORDER) {
    const members = documented
      .filter((example) => example.group === group)
      .sort((left, right) => left.title.localeCompare(right.title))
    if (members.length === 0) continue
    lines.push(`### ${group}`, '')
    for (const example of members) {
      lines.push(
        `- [${example.title}](${SITE}/docs/components/${example.id}.md): ${example.description}`,
      )
    }
    lines.push('')
  }

  lines.push('## Optional', '')
  lines.push(
    `- [Full documentation](${SITE}/llms-full.txt): every guide and every contract in one file.`,
    `- [Using Timeless with AI agents](${SITE}/docs/reference/agents.md): the skill, the Markdown routes, and editor tooling.`,
    '',
  )

  return `${lines.join('\n').trim()}\n`
}

/** Starlight's own frontmatter defaults are noise in a concatenation; the title is not. */
const stripFrontmatter = (body: string): string => body.replace(/^---\n[\s\S]*?\n---\n/, '').trim()

export async function buildLlmsFullTxt(): Promise<string> {
  const docs = await getCollection('docs')

  const guides = docs
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((doc) =>
      [
        `# ${doc.data.title}`,
        '',
        `Source: ${SITE}/${doc.id}.md`,
        '',
        doc.data.description ?? '',
        '',
        stripFrontmatter(doc.body ?? ''),
      ]
        .join('\n')
        .trim(),
    )

  const components = await Promise.all(
    documentedExamples()
      .slice()
      .sort((left, right) => left.title.localeCompare(right.title))
      .map((example) => componentMarkdown(example)),
  )

  return `${[
    '# Timeless UI — full documentation',
    '',
    `Every guide and every component contract. See ${SITE}/llms.txt for the curated index, and`,
    `${SITE}/docs/reference/agents/ for how these files are meant to be used.`,
    '',
    '---',
    '',
    ...guides.flatMap((guide) => [guide, '', '---', '']),
    ...components.flatMap((component) => [component.trim(), '', '---', '']),
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n---\s*$/, '')
    .trim()}\n`
}
