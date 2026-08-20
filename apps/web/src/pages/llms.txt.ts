/**
 * `/llms.txt` — the curated entry point for coding agents, and for anyone pasting a URL into a chat.
 *
 * The body is built in `lib/llms.ts`, which the AI agents page also measures.
 * `validate-agent-surfaces.mjs` asserts every link here resolves and that the whole file stays under
 * `LLMS_TXT_TOKEN_BUDGET`.
 */
import type { APIRoute } from 'astro'
import { buildLlmsTxt } from '../lib/llms.ts'

export const GET: APIRoute = async () =>
  new Response(await buildLlmsTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
