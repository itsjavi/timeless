import { examples } from '@timelessui/examples'
import { expectNoBlockingA11yViolations } from '../../shared/a11y'
import { expect, test } from '../../shared/fixtures'
import { expectRouteDocumentReady } from '../../shared/test-utils'

const documented = examples.filter((example) => example.domain !== 'recipes')

/**
 * Accessibility was previously asserted on the Button page alone, whose one-line snippet never
 * overflows. That hid a serious `scrollable-region-focusable` violation on 28 of the other pages.
 * Every reference page is checked now, and every page is checked for console output.
 */
test.describe('component reference pages', () => {
  for (const example of documented) {
    test(`${example.id} renders a clean reference page @slow`, async ({ page }) => {
      const problems: string[] = []
      page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
      page.on('console', (message) => {
        if (message.type() === 'error') problems.push(`console.error: ${message.text()}`)
      })

      await page.goto(`/docs/components/${example.id}/`)
      await expectRouteDocumentReady(page)

      await expect(page.getByRole('heading', { level: 1, name: example.title })).toBeVisible()
      expect(problems).toEqual([])
      await expectNoBlockingA11yViolations(page, `/docs/components/${example.id}/`, 'main')
    })
  }
})

test('documents permitted values, defaults, and anatomy rather than bare tokens', async ({
  page,
}) => {
  await page.goto('/docs/components/button/')
  await expectRouteDocumentReady(page)

  const attributes = page
    .locator('table')
    .filter({ has: page.getByRole('columnheader', { name: 'Values' }) })
    .first()
  const variantRow = attributes.locator('tr').filter({
    has: page.locator('td:first-child', { hasText: /^data-ui-variant$/ }),
  })
  await expect(variantRow).toContainText('primary')
  await expect(variantRow).toContainText('danger-outline')

  await page.goto('/docs/components/select/')
  await expectRouteDocumentReady(page)

  const anatomy = page
    .locator('table')
    .filter({ has: page.getByRole('columnheader', { name: 'Required' }) })
    .first()
  // Match the part name cell, not any row whose description happens to mention the part.
  const triggerRow = anatomy.locator('tr').filter({
    has: page.locator('td:first-child', { hasText: /^trigger$/ }),
  })
  await expect(triggerRow).toContainText('Yes')

  // Contracts are looked up per component, so Hover Card's delays must not appear here.
  await expect(page.locator('main')).not.toContainText('open-delay')
  await expect(page.locator('main')).not.toContainText('close-delay')
})

test('keeps every placeholder description out of the reference', async ({ page }) => {
  for (const id of ['tabs', 'toast', 'popover', 'color-picker']) {
    await page.goto(`/docs/components/${id}/`)
    await expectRouteDocumentReady(page)
    const main = page.locator('main')
    await expect(main).not.toContainText('Public host state.')
    await expect(main).not.toContainText('Public live API.')
  }
})

test('links each interactive component to its APG pattern', async ({ page }) => {
  await page.goto('/docs/components/listbox/')
  await expectRouteDocumentReady(page)

  await expect(page.getByRole('link', { name: /Listbox pattern/ })).toHaveAttribute(
    'href',
    'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/',
  )
  await expect(page.getByRole('cell', { name: 'Home / End' })).toBeVisible()
})

test('lists every component on the index page', async ({ page }) => {
  await page.goto('/docs/components/')
  await expectRouteDocumentReady(page)

  for (const example of documented) {
    await expect(page.getByRole('link', { name: example.title, exact: true }).first()).toBeVisible()
  }
})
