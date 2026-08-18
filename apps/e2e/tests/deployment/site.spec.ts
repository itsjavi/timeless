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

test('shares a preview card from the landing page', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /timeless\.build/)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:/)
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  )
})
