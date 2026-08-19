import { expect, test } from '../../shared/fixtures'
import { expectNoBlockingA11yViolations } from '../../shared/a11y'
import { expectNoPageOverflow, expectRouteDocumentReady } from '../../shared/test-utils'

test('renders the main Timeless website', async ({ page }) => {
  await page.goto('/')
  await expectRouteDocumentReady(page)

  await expect(page.getByRole('heading', { level: 1, name: 'Timeless' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Page sections' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Timeless GitHub repository' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Docs', exact: true })).toHaveAttribute(
    'href',
    '/docs/',
  )
  await expect(page.getByRole('link', { name: 'AI', exact: true })).toHaveAttribute(
    'href',
    '/docs/reference/agents/',
  )
  await expect(page.getByRole('link', { name: 'Stories', exact: true })).toHaveAttribute(
    'href',
    '/stories/',
  )
  await expect(page.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/docs/')
  await expect(page.locator('#hero-artwork')).toHaveAttribute('aria-label', /1950s-style/)

  await expectNoPageOverflow(page)
  await expectNoBlockingA11yViolations(page, '/', '#main')
})

test('exposes a keyboard skip link', async ({ page }) => {
  await page.goto('/')
  await expectRouteDocumentReady(page)

  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: 'Skip to content' })
  await expect(skipLink).toBeFocused()
  await skipLink.press('Enter')
  await expect(page).toHaveURL(/#main$/)
})

test('renders the Starlight documentation and isolated component preview', async ({ page }) => {
  const fontRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().startsWith('https://fonts.googleapis.com/')) fontRequests.push(request.url())
  })

  await page.goto('/docs/components/button/')
  await expectRouteDocumentReady(page)

  await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible()
  const shellFonts = await page
    .locator('body')
    .evaluate((element) => getComputedStyle(element).fontFamily)
  const headingFonts = await page
    .getByRole('heading', { level: 1, name: 'Button' })
    .evaluate((element) => getComputedStyle(element).fontFamily)
  const siteTitleFonts = await page
    .locator('.site-title')
    .evaluate((element) => getComputedStyle(element).fontFamily)
  expect(shellFonts).not.toMatch(/Avenir|Montserrat|Corbel|Cooper|Yellowtail/)
  expect(headingFonts).not.toMatch(/Cooper|Yellowtail/)
  expect(siteTitleFonts).toMatch(/^Yellowtail/)
  await expect(page.locator('.site-title')).toHaveCSS('font-size', '32px')
  expect(fontRequests).toEqual(['https://fonts.googleapis.com/css2?family=Yellowtail&display=swap'])

  const preview = page.locator('iframe[title="Button live preview"]')
  await expect(preview).toBeVisible()
  await expect(preview).toHaveAttribute('src', '/docs/_preview/button/')
  await expect(preview).toHaveAttribute('loading', 'eager')
  await expect(preview).toHaveCSS('margin-top', '0px')
  await expect(preview).toHaveCSS('border-top-width', '1px')
  await expect(
    preview.contentFrame().getByRole('button', { name: 'Publish component' }),
  ).toBeVisible()
  await expect(preview.contentFrame().locator('html')).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  )
  await expect(page.getByRole('link', { name: /Open Button in StoryLite/ })).toHaveAttribute(
    'href',
    '/stories/library-actions-button--default/',
  )

  const theme = page.locator('[data-preview-theme]')
  await expect(theme).toHaveAccessibleName('Dark canvas')
  const reload = page.locator('[data-preview-reload]')
  await expect(reload).toHaveAccessibleName('Reload preview')
  const controlSizes = await Promise.all(
    [theme, reload].map((control) =>
      control.evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        return { width: bounds.width, height: bounds.height, top: bounds.top }
      }),
    ),
  )
  expect(controlSizes[0]).toEqual(controlSizes[1])
  await theme.click()
  await expect(theme).toHaveAttribute('aria-pressed', 'true')
  await expect(preview.contentFrame().locator('html')).toHaveAttribute('data-theme', 'dark')

  await expectNoPageOverflow(page)
  const backgrounds: string[] = []
  for (const docsTheme of ['light', 'dark']) {
    await page.locator('html').evaluate((element, value) => {
      element.dataset.theme = value
    }, docsTheme)
    backgrounds.push(
      await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor),
    )
    await expectNoBlockingA11yViolations(page, `/docs/components/button/ (${docsTheme})`, 'main')
  }
  expect(backgrounds[0]).not.toBe(backgrounds[1])
})

test('keeps useful destinations on the custom 404 page', async ({ page }) => {
  await page.goto('/404.html')
  await expectRouteDocumentReady(page)

  await expect(page.getByRole('heading', { level: 1, name: /not found$/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Docs', exact: true })).toHaveAttribute(
    'href',
    '/docs/',
  )
  await expect(page.getByRole('link', { name: 'Stories', exact: true })).toHaveAttribute(
    'href',
    '/stories/',
  )
  await expectNoPageOverflow(page)
  await expectNoBlockingA11yViolations(page, '/404.html', '#main')
})

test('reaches the page sections through the disclosure on narrow viewports', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expectRouteDocumentReady(page)

  const toggle = page.getByRole('button', { name: 'Page sections' })
  await expect(toggle).toBeVisible()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('navigation', { name: 'Page sections' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'AI', exact: true })).toHaveAttribute(
    'href',
    '/docs/reference/agents/',
  )
  await expectNoPageOverflow(page)

  await page.keyboard.press('Escape')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
})
