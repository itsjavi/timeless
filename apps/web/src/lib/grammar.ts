/**
 * The authoring grammar, read from the files `pnpm generate` writes from
 * `packages/components/scripts/authoring-grammar.mjs`.
 *
 * Milestone 027 first shipped this prose in four hand-written places. It is now declared once and
 * projected, and the website reads the projections rather than keeping its own copy — the same way
 * `component-docs.ts` reads the Custom Elements Manifest instead of restating it.
 *
 * Read as files rather than imported, because these are generated artifacts in a sibling package and
 * Vite would have to be told to serve outside the app root to import them.
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const reference = (name: string) =>
  resolve(process.cwd(), '../../packages/components/skills/using-timeless-ui/reference', name)

/** Each generated file opens with its own title and a do-not-edit notice; neither belongs downstream. */
const body = (source: string) =>
  source
    .replace(/^<!--[\s\S]*?-->$/m, '')
    .replace(/^#\s.*$/m, '')
    .trim()

/** The grammar in prose, summary blockquote included. Used verbatim by `/llms.txt`. */
export async function grammarBody(): Promise<string> {
  return body(await readFile(reference('grammar.md'), 'utf8'))
}

/** The imperative one-liners, for a consumer's own `AGENTS.md`. */
export async function agentsBlock(): Promise<string> {
  return body(await readFile(reference('agents-block.md'), 'utf8'))
}
