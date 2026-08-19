/**
 * `/llms-full.txt` — every documentation page and every component contract in one file.
 *
 * `/llms.txt` is the default; this is for models with the context to hold it, and the agents
 * reference page publishes both measured token counts so the choice is informed. Astro removed its
 * own `llms.txt` partly over a 44-second CI cost, so this route leans on the memo in
 * `component-markdown.ts`: the 45 component renders are shared with `[slug].md.ts` and happen once
 * per build rather than twice.
 */
import type { APIRoute } from 'astro'
import { buildLlmsFullTxt } from '../lib/llms.ts'

export const GET: APIRoute = async () =>
  new Response(await buildLlmsFullTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
