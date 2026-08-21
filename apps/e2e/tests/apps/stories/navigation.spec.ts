import { expect, test } from '../../shared/fixtures'
import { expectNoPageOverflow, expectRouteDocumentReady } from '../../shared/test-utils'

/**
 * Milestone 025. Breadcrumb and Pagination are CSS over native markup, so what there is to test is
 * the accessibility tree rather than any behavior — the whole point is that nothing runs.
 *
 * The `no-javascript.spec.ts` cases are the primary proof that they work at all; these are the
 * assertions about *what they say*, which need the accessibility tree and therefore a real browser.
 */
test.describe('breadcrumb', () => {
  test('is a named landmark whose final crumb is not a link', async ({ page }) => {
    await page.goto('/stories/library-navigation-breadcrumb--default/')
    await expectRouteDocumentReady(page)

    const trail = page.getByRole('navigation', { name: 'Breadcrumb' })
    await expect(trail).toBeVisible()
    await expect(trail.getByRole('listitem')).toHaveCount(3)
    await expect(trail.getByRole('link')).toHaveCount(2)

    const current = trail.locator("[aria-current='page']")
    await expect(current).toHaveText('Breadcrumb')
    // A link to the page you are already on goes nowhere, so the last crumb is a `<span>`.
    expect(await current.evaluate((element) => element.tagName)).toBe('SPAN')
  })

  /**
   * The separator is a `::before` pseudo-element with `content: "›" / ""`, so the glyph is painted and
   * the empty alternative text keeps it out of the accessibility tree. That is the whole reason there
   * is no separator part to author and no `aria-hidden` for a consumer to remember, so it is worth an
   * assertion rather than a comment: if the alt text ever regresses, every crumb gains a spoken "›".
   */
  test('draws a separator that the accessibility tree does not carry', async ({ page }) => {
    await page.goto('/stories/library-navigation-breadcrumb--default/')
    await expectRouteDocumentReady(page)
    const trail = page.getByRole('navigation', { name: 'Breadcrumb' })

    const painted = await trail
      .locator("[data-ui-part~='item']")
      .nth(1)
      .evaluate((element) => window.getComputedStyle(element, '::before').content)
    expect(painted).toContain('›')

    expect(await trail.ariaSnapshot()).not.toContain('›')
  })

  test('elides its middle crumbs at 320 pixels instead of scrolling the page', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await page.goto('/stories/library-navigation-breadcrumb--truncation/')
    await expectRouteDocumentReady(page)
    await expectNoPageOverflow(page)

    const crumbs = page
      .getByRole('navigation', { name: 'Breadcrumb at 48rem' })
      .locator("[data-ui-part~='item']")
    const widths = await crumbs.evaluateAll((elements) =>
      elements.map((element) => Math.round(element.getBoundingClientRect().width)),
    )

    // The ends keep their full text; everything between them is what gives way.
    expect(widths.at(0)).toBeGreaterThan(0)
    expect(widths.at(-1)).toBeGreaterThan(0)
    const middle = widths.slice(1, -1)
    expect(Math.max(...middle)).toBeLessThan(Math.min(widths.at(0)!, widths.at(-1)!))
  })
})

test.describe('pagination', () => {
  test('names its landmark, its pages, and its directions', async ({ page }) => {
    await page.goto('/stories/library-navigation-pagination--default/')
    await expectRouteDocumentReady(page)

    const pager = page.getByRole('navigation', { name: 'Pagination' })
    await expect(pager).toBeVisible()
    // "Previous" and "Next", not "‹" and "›": a glyph names nothing.
    await expect(pager.getByRole('link', { name: 'Previous' })).toBeVisible()
    await expect(pager.getByRole('link', { name: 'Next' })).toBeVisible()
    await expect(pager.getByRole('link', { name: 'Page 5' })).toHaveAttribute('href', '?page=5')

    const current = pager.locator("[aria-current='page']")
    await expect(current).toHaveText('4')
    expect(await current.evaluate((element) => element.tagName)).toBe('SPAN')

    // The gap between page 5 and page 12 is not a page, so it is not in the tree.
    const ellipsis = pager.locator("[data-ui-part~='ellipsis']").first()
    await expect(ellipsis).toBeVisible()
    await expect(ellipsis).toHaveAttribute('aria-hidden', 'true')
    expect(await pager.ariaSnapshot()).not.toContain('…')
  })

  /**
   * A disabled link is a contradiction: `aria-disabled` announces "dimmed" and the link still
   * navigates. At a boundary the control is a `<span>` instead, so there is nothing to activate.
   */
  test('renders a boundary as a non-link rather than a disabled link', async ({ page }) => {
    await page.goto('/stories/library-navigation-pagination--boundaries/')
    await expectRouteDocumentReady(page)

    const firstPage = page.getByRole('navigation', {
      name: 'Pagination, First page — Previous is a span',
    })
    await expect(firstPage.getByRole('link', { name: 'Previous' })).toHaveCount(0)
    await expect(firstPage.getByRole('link', { name: 'Next' })).toBeVisible()
    const previous = firstPage.locator("[data-ui-part~='previous']")
    expect(await previous.evaluate((element) => element.tagName)).toBe('SPAN')
    await expect(previous).not.toHaveAttribute('aria-disabled', 'true')

    const lastPage = page.getByRole('navigation', {
      name: 'Pagination, Last page — Next is a span',
    })
    await expect(lastPage.getByRole('link', { name: 'Next' })).toHaveCount(0)
    expect(
      await lastPage.locator("[data-ui-part~='next']").evaluate((element) => element.tagName),
    ).toBe('SPAN')
  })
})

/**
 * The recipe that replaced `ui-nav-menu`. Milestone 025 set the bar for adding an element at the
 * shared-panel behavior; composition met every accessibility and interaction requirement, so this
 * spec is what stands in for the element's own tests.
 */
test.describe('navigation menu recipe', () => {
  const route = '/stories/recipes-composition-navigation-menu--default/'

  test('opens on pointer intent and hands off between triggers', async ({ page }) => {
    await page.goto(route)
    await expectRouteDocumentReady(page)

    const products = page.getByRole('button', { name: 'Products' })
    const resources = page.getByRole('button', { name: 'Resources' })
    const productsPanel = page.locator('#nav-products')
    const resourcesPanel = page.locator('#nav-resources')

    await expect(productsPanel).toBeHidden()
    await products.hover()
    await expect(productsPanel).toBeVisible()
    await expect(products).toHaveAttribute('aria-expanded', 'true')

    // Moving along the bar: `close-delay` is shorter than `open-delay`, so the old panel is gone
    // before the new one arrives and the two are never in the top layer together.
    await resources.hover()
    await expect(resourcesPanel).toBeVisible()
    await expect(productsPanel).toBeHidden()
    await expect(products).toHaveAttribute('aria-expanded', 'false')
  })

  test('opens on focus and closes on Escape', async ({ page }) => {
    await page.goto(route)
    await expectRouteDocumentReady(page)
    const panel = page.locator('#nav-products')

    await page.getByRole('button', { name: 'Products' }).focus()
    await expect(panel).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
  })

  /**
   * The rule the recipe exists for. `role="menu"` means commands with roving focus, where the whole
   * set is one Tab stop; these are links, so they are individually tabbable and `Tab` is the traversal.
   */
  test('is links in regions, not commands in a menu', async ({ page }) => {
    await page.goto(route)
    await expectRouteDocumentReady(page)
    const nav = page.getByRole('navigation', { name: 'Main' })

    await expect(nav.locator("[role='menu'], [role='menuitem']")).toHaveCount(0)
    await expect(nav.locator("[popover][role='group']")).toHaveCount(2)

    const products = page.getByRole('button', { name: 'Products' })
    await products.focus()
    await expect(page.locator('#nav-products')).toBeVisible()

    // Tab reaches each link in turn, which is what an arrow-key roving focus would have taken away.
    // The dwell matters: the panel closes 100ms after focus leaves it, so asserting immediately
    // would pass against a panel that shuts under the user — which is what it used to do.
    await page.keyboard.press('Tab')
    await page.waitForTimeout(400)
    await expect(page.getByRole('link', { name: 'Components' })).toBeFocused()
    await expect(page.locator('#nav-products')).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Themes' })).toBeFocused()
    await expect(page.locator('#nav-products')).toBeVisible()
  })
})
