import { expect, test } from '@playwright/test'

const routes = [
  '/',
  '/docs/',
  '/docs/components/',
  '/docs/components/button/',
  '/docs/styling/theming/',
  '/docs/reference/packages/',
  '/docs/_preview/button/',
  '/stories/',
  '/stories/library-actions-button--default/',
  '/404.html',
]

for (const route of routes) {
  test(`${route} is present in the composed artifact`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))

    const response = await page.goto(route)
    expect(response?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('keeps iframe-only preview documents out of search engines', async ({ page }) => {
  await page.goto('/docs/_preview/button/')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex')

  const sitemap = await page.request.get('/sitemap-0.xml')
  expect(sitemap.status()).toBe(200)
  expect(await sitemap.text()).not.toContain('/docs/_preview/')

  const robots = await page.request.get('/robots.txt')
  expect(robots.status()).toBe(200)
  expect(await robots.text()).toContain('Disallow: /docs/_preview/')
})

test('resolves story links inside the composed site', async ({ page }) => {
  await page.goto('/docs/components/button/')
  const storyLink = page.getByRole('link', { name: /Open Button in StoryLite/ })
  await expect(storyLink).toHaveAttribute('href', '/stories/library-actions-button--default/')

  await storyLink.click()
  await expect(page).toHaveURL(/\/stories\/library-actions-button--default\//)
})

/**
 * Both metadata surfaces, because they are written in different places and regress independently:
 * `/` and `/404.html` come from `SiteLayout.astro`, the `/docs/` routes from Starlight's `head`
 * config. Starlight emits `twitter:card` but no image of its own, so a docs page that lost the card
 * would still claim a large one and share an empty image well.
 *
 * `/docs/_preview/` is exempt by design — those documents are `noindex` frames, asserted above.
 */
const cardRoutes = [
  '/',
  '/404.html',
  '/docs/',
  '/docs/components/',
  '/docs/components/button/',
  '/docs/styling/theming/',
]

for (const route of cardRoutes) {
  test(`${route} shares a large preview card`, async ({ page }) => {
    await page.goto(route)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /timeless\.build/)
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    )

    /*
     * WebP first, since it is what a scraper that can decode it should pick, and the PNG behind it
     * for LinkedIn and WhatsApp, which cannot. Order is the contract: the `og:image:*` properties
     * that follow each entry describe it.
     */
    const shareImages = await page
      .locator('meta[property="og:image"]')
      .evaluateAll((tags) => tags.map((tag) => tag.getAttribute('content')))
    expect(shareImages).toEqual([
      'https://timeless.build/og-image/og-image.webp',
      'https://timeless.build/og-image/og-image.png',
    ])
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
      'content',
      'https://timeless.build/og-image/og-image.webp',
    )
  })
}

/** A card that 404s is the failure no metadata assertion can see. */
test('serves both share card files', async ({ page }) => {
  for (const file of ['/og-image/og-image.webp', '/og-image/og-image.png']) {
    const response = await page.request.get(file)
    expect(response.status(), file).toBe(200)
  }
})
