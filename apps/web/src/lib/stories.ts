/**
 * StoryLite is a separate app. `pnpm build:site` mounts it under `/stories/`, but `astro dev` does
 * not, so in development every `/stories/` link would 404. Links resolve against the dev server
 * instead, and stay root-relative in production so `compose-static-site.mjs` keeps validating them.
 *
 * The two bases differ in shape, not just origin: the dev server is a single page that routes stories
 * through the `#/story/<id>` hash, while the composed site serves each story as its own directory.
 * A bare `#/<id>` falls back to the catalog root, so the prefix matters.
 *
 * Override the origin with `PUBLIC_STORIES_BASE_URL` when StoryLite runs elsewhere.
 */
const DEV_ORIGIN = 'http://localhost:1992'
const PRODUCTION_BASE = '/stories/'

const devOrigin = (import.meta.env.PUBLIC_STORIES_BASE_URL || DEV_ORIGIN).replace(/\/+$/, '')
const dev = import.meta.env.DEV

/** The catalog root. */
export function storiesUrl(): string {
  return dev ? `${devOrigin}/` : PRODUCTION_BASE
}

/** One story, matching the ids StoryLite derives from the example catalog. */
export function storyUrl(domain: string, id: string, story = 'default'): string {
  const storyId = `library-${domain}-${id}--${story}`
  return dev ? `${devOrigin}/#/story/${storyId}` : `${PRODUCTION_BASE}${storyId}/`
}
