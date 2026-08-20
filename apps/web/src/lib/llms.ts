/**
 * The bodies of `/llms.txt` and `/llms-full.txt`.
 *
 * They live here rather than in the route files because three callers need them: the two endpoints,
 * and `AgentSurfaceSizes.astro`, which publishes their measured token counts on the AI agents
 * page. A hardcoded token count in that page would be exactly the kind of unvalidated claim
 * `validate-claims.mjs` exists to prevent, so the number is measured from the same string that ships.
 */
import { getCollection } from 'astro:content'
import { examples } from '@timelessui/examples'
import { GROUP_ORDER, SITE } from './agent-surfaces.ts'
import { componentMarkdown } from './component-markdown.ts'
import { grammarBody } from './grammar.ts'

/** The document title. Everything below it — the summary blockquote included — is the grammar. */
const TITLE = '# Timeless UI'

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

  const lines: string[] = [TITLE, '', await grammarBody(), '']

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
    `- [Using Timeless with AI agents](${SITE}/docs/getting-started/agents.md): the skill, the Markdown routes, and editor tooling.`,
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
    `${SITE}/docs/getting-started/agents/ for how these files are meant to be used.`,
    '',
    '---',
    '',
    /*
     * The grammar leads, exactly as it does in `/llms.txt`. An agent handed only this file would
     * otherwise reach the first component contract without knowing how either kind is configured,
     * which is the one thing it is most likely to get wrong.
     */
    await grammarBody(),
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
