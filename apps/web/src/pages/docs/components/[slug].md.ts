/**
 * The Markdown twin of `[slug].astro`, at `/docs/components/<id>.md`.
 *
 * `getStaticPaths` mirrors the page's, including the `recipes` filter, so the two route sets cannot
 * diverge — `validate-agent-surfaces.mjs` fails the build if they do.
 */
import type { APIRoute, GetStaticPaths } from 'astro'
import { examples } from '@timelessui/examples'
import { componentMarkdown } from '../../../lib/component-markdown.ts'

export const getStaticPaths: GetStaticPaths = () =>
  examples
    .filter((example) => example.domain !== 'recipes')
    .map((example) => ({ params: { slug: example.id }, props: { example } }))

export const GET: APIRoute = async ({ props }) => {
  const markdown = await componentMarkdown(props.example)
  return new Response(markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
