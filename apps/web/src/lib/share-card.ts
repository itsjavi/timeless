/**
 * The share card, declared once for both metadata surfaces.
 *
 * `SiteLayout.astro` writes its own `<head>`, so the landing page and the 404 read these values
 * directly. The documentation pages are Starlight's, which emits `twitter:card` as
 * `summary_large_image` but no image of its own — so `astro.config.mjs` projects `SHARE_CARD_HEAD`
 * into the Starlight `head` config, and every page under `/docs/` carries the same card instead of a
 * large card with an empty image well.
 */
import { SITE } from './agent-surfaces.ts'

/** Every scraper crops to 1200×630, and both files are authored at exactly that. */
export const SHARE_CARD_WIDTH = '1200'
export const SHARE_CARD_HEIGHT = '630'

/** Cards carry the wordmark and the tagline, so the alt text is the sentence a reader would hear. */
export const SHARE_CARD_ALT =
  'Timeless — components baked on the modern web platform, for a post-framework era.'

export type ShareImage = { path: string; type: string }

/**
 * Candidates in preference order. WebP is the one to declare first, and Facebook, X, Slack, and
 * Discord all render it — but LinkedIn and WhatsApp cannot decode it, and they fall through to the
 * next `og:image` rather than to nothing. The PNG is the same artwork, so whichever a scraper picks
 * the card looks identical.
 *
 * `og-image-2.*` is the alternate cut of the same card and is deliberately unreferenced.
 */
export const SHARE_CARD_IMAGES: readonly ShareImage[] = [
  { path: '/og-image/og-image.webp', type: 'image/webp' },
  { path: '/og-image/og-image.png', type: 'image/png' },
]

const MIME_BY_EXTENSION: Record<string, string> = {
  avif: 'image/avif',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

/** Falls back to PNG, the safest guess for a scraper that needs a type it can act on. */
export const shareImageType = (path: string): string =>
  MIME_BY_EXTENSION[path.split('.').pop()?.toLowerCase() ?? ''] ?? 'image/png'

/**
 * Absolute against the canonical origin. A relative `og:image` is invalid, and the pages a scraper
 * reads are the deployed ones, so the deploy origin is the right one even in a local preview.
 */
export const shareImageUrl = (path: string): string => new URL(path, SITE).href

/**
 * Structured `og:image:*` properties attach to the `og:image` they follow, so each candidate's
 * dimensions and type sit directly beneath it rather than being hoisted into one block.
 */
const openGraphTags = (images: readonly ShareImage[], alt: string) =>
  images.flatMap((image) => [
    { tag: 'meta' as const, attrs: { property: 'og:image', content: shareImageUrl(image.path) } },
    { tag: 'meta' as const, attrs: { property: 'og:image:type', content: image.type } },
    { tag: 'meta' as const, attrs: { property: 'og:image:width', content: SHARE_CARD_WIDTH } },
    { tag: 'meta' as const, attrs: { property: 'og:image:height', content: SHARE_CARD_HEIGHT } },
    { tag: 'meta' as const, attrs: { property: 'og:image:alt', content: alt } },
  ])

/**
 * Starlight `head` entries for the shared card. Twitter reads a single `twitter:image` and does
 * support WebP, so the first candidate is the one it gets.
 */
export const SHARE_CARD_HEAD = [
  ...openGraphTags(SHARE_CARD_IMAGES, SHARE_CARD_ALT),
  {
    tag: 'meta' as const,
    attrs: { name: 'twitter:image', content: shareImageUrl(SHARE_CARD_IMAGES[0]!.path) },
  },
  { tag: 'meta' as const, attrs: { name: 'twitter:image:alt', content: SHARE_CARD_ALT } },
]
