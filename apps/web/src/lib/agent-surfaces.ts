/**
 * Shared constants for the agent-facing routes — `/llms.txt`, `/llms-full.txt`, and the `.md` twins.
 *
 * `GROUP_ORDER` lives here rather than in `astro.config.mjs` because the sidebar and `/llms.txt`
 * present the same components in the same order, and two copies of that order would drift.
 */
import type { ExampleGroup } from '@timelessui/examples'

/** Absolute, because these files are read outside the site and relative links would not resolve. */
export const SITE = 'https://timeless.build'

/**
 * Documentation grouping, in presentation order. Every documented example must land in one of these:
 * `astro.config.mjs` throws when an example carries a group this list does not name.
 */
export const GROUP_ORDER: readonly ExampleGroup[] = [
  'Foundations',
  'Actions',
  'Forms',
  'Navigation',
  'Content',
  'Feedback',
  'Overlays',
  'Color',
]

/**
 * Ceiling for `/llms.txt`, asserted by `validate-agent-surfaces.mjs`.
 *
 * The file exists to be read in full inside a context window alongside real work, which is the whole
 * reason it is separate from `llms-full.txt`. Nuxt UI's equivalent sits around 5K tokens and its own
 * documentation tells readers to prefer it over the full file. Estimated at four characters per
 * token, which is deliberately pessimistic for prose so the gate trips before a real context does.
 */
export const LLMS_TXT_TOKEN_BUDGET = 5_000

/** The estimator the budget is expressed in. Not exact; consistent, which is what a gate needs. */
export const estimateTokens = (text: string): number => Math.ceil(text.length / 4)
