import { expect, test } from '../../shared/fixtures'
import { expectNoBlockingA11yViolations } from '../../shared/a11y'
import { expectRouteDocumentReady } from '../../shared/test-utils'

test('selects one toggle and moves focus with arrow keys', async ({ page }) => {
  await page.goto('/stories/library-actions-toggle-group--default/')
  await expectRouteDocumentReady(page)
  const left = page.getByRole('button', { name: 'Left' })
  const center = page.getByRole('button', { name: 'Center' })
  await expect(left).toHaveAttribute('aria-pressed', 'true')
  await center.click()
  await expect(left).toHaveAttribute('aria-pressed', 'false')
  await expect(center).toHaveAttribute('aria-pressed', 'true')
  await center.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('button', { name: 'Right' })).toBeFocused()

  // Home and End are declared on Toggle Group and were pressed by nothing until this line.
  await page.keyboard.press('Home')
  await expect(left).toBeFocused()
  await page.keyboard.press('End')
  await expect(page.getByRole('button', { name: 'Right' })).toBeFocused()
  await expectNoBlockingA11yViolations(
    page,
    '/stories/library-actions-toggle-group--default/',
    '#ss-canvas',
  )
})

test('steps a native number input and respects its maximum', async ({ page }) => {
  await page.goto('/stories/library-forms-number-stepper--default/')
  await expectRouteDocumentReady(page)
  const input = page.getByRole('spinbutton', { name: 'Quantity' })
  const increase = page.getByRole('button', { name: 'Increase Quantity' })
  await increase.click()
  await expect(input).toHaveValue('3')
  await input.fill('10')
  await expect(increase).toHaveAttribute('aria-disabled', 'true')
  await expectNoBlockingA11yViolations(
    page,
    '/stories/library-forms-number-stepper--default/',
    '#ss-canvas',
  )
})

/*
 * SC 2.4.3. A step button reaches its bound while it is being pressed, so marking it `disabled` there
 * removes the element holding focus and Chromium answers with `<body>`. `aria-disabled` keeps it
 * focusable and inert, and this is the assertion that says so.
 */
test('keeps focus on a step button that reaches its bound', async ({ page }) => {
  await page.goto('/stories/library-forms-number-stepper--default/')
  await expectRouteDocumentReady(page)
  const decrease = page.getByRole('button', { name: 'Decrease Quantity' })
  const input = page.getByRole('spinbutton', { name: 'Quantity' })

  // The story starts at 2 with a minimum of 0, so two presses land exactly on the bound.
  await decrease.focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')

  await expect(input).toHaveValue('0')
  await expect(decrease).toHaveAttribute('aria-disabled', 'true')
  await expect(decrease).toBeFocused()

  // Inert, not merely styled: pressing it again neither steps below the minimum nor moves focus.
  await page.keyboard.press('Enter')
  await expect(input).toHaveValue('0')
  await expect(decrease).toBeFocused()
})

test('edits color formats and preserves an invalid raw draft', async ({ page }) => {
  await page.goto('/stories/library-color-color-picker--default/')
  await expectRouteDocumentReady(page)
  const picker = page.locator('ui-color-picker')
  const raw = page.getByRole('textbox', { name: 'Raw color value' })
  const originalValue = await picker.getAttribute('value')
  await raw.fill('not-a-color')
  await expect(raw).toHaveAttribute('aria-invalid', 'true')
  await expect(picker).toHaveAttribute('value', originalValue ?? '')
  await expect(picker.locator("[data-ui-part~='warning']")).toContainText('supported CSS color')
  await raw.fill('rgb(255 0 0)')
  await expect(raw).not.toHaveAttribute('aria-invalid')
  await page.getByRole('combobox', { name: 'Color format' }).selectOption('rgb')
  await expect(picker).toHaveAttribute('format', 'rgb')
  await expect(picker).toHaveAttribute('value', /rgb\(/)
  const red = page.getByRole('spinbutton', { name: 'Red value' })
  await expect(red).toHaveValue('255')
  await red.fill('120')
  await expect(page.getByRole('slider', { name: 'Red' })).toHaveValue('120')
  await expect(picker).toHaveAttribute('value', 'rgb(120 0 0)')
  await expectNoBlockingA11yViolations(
    page,
    '/stories/library-color-color-picker--default/',
    '#ss-canvas',
  )
})

test('copies the color value and confirms with the tick icon', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/stories/library-color-color-picker--default/')
  await expectRouteDocumentReady(page)
  const picker = page.locator('ui-color-picker')
  await page.getByRole('button', { name: 'Copy color value' }).click()
  await expect(picker.locator("[data-ui-part~='copied-icon']")).toBeVisible()
  await expect(picker.locator("[data-ui-part~='copy-icon']")).toBeHidden()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    await picker.getAttribute('value'),
  )
  await expect(picker.locator("[data-ui-part~='copy-icon']")).toBeVisible()
})

test('edits the newly supported CSS color formats', async ({ page }) => {
  await page.goto('/stories/library-color-color-picker--default/')
  await expectRouteDocumentReady(page)
  const picker = page.locator('ui-color-picker')
  const format = page.getByRole('combobox', { name: 'Color format' })

  await format.selectOption('hwb')
  await expect(picker).toHaveAttribute('value', /^hwb\(/)
  await page.getByRole('spinbutton', { name: 'Whiteness value' }).fill('40')
  await expect(picker).toHaveAttribute('value', /hwb\([\d.]+ 40%/)

  await format.selectOption('lch')
  await expect(picker).toHaveAttribute('value', /^lch\(/)
  await expect(page.getByRole('slider', { name: 'Chroma' })).toHaveAttribute('max', '150')

  await format.selectOption('hex')
  await expect(picker).toHaveAttribute('value', /^#[0-9a-f]{6}$/)

  await format.selectOption('rec2020')
  await expect(picker).toHaveAttribute('value', /^color\(rec2020 /)
})

test('opens direct color-picker popover content and restores focus', async ({ page }) => {
  await page.goto('/stories/recipes-color-popover-color-picker--default/')
  await expectRouteDocumentReady(page)
  const trigger = page.getByRole('button', { name: 'Edit Brand color' })
  await trigger.click()
  await expect(page.getByRole('dialog', { name: 'Brand color' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Brand color' })).toBeHidden()
  await expect(trigger).toBeFocused()
})

for (const path of [
  '/stories/library-actions-toggle--default/',
  '/stories/library-feedback-empty--default/',
  '/stories/library-feedback-meter--default/',
  '/stories/library-color-color-swatch--default/',
] as const) {
  test(`has no blocking accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path)
    await expectRouteDocumentReady(page)
    await expectNoBlockingA11yViolations(page, path, '#ss-canvas')
  })
}

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('keeps CSS-only primitives semantic and visible', async ({ page }) => {
    await page.goto('/stories/library-actions-toggle--default/')
    await expectRouteDocumentReady(page)
    await expect(page.getByRole('button', { name: 'Bold' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    await page.goto('/stories/library-feedback-meter--default/')
    await expectRouteDocumentReady(page)
    await expect(page.getByRole('meter', { name: 'Storage' })).toHaveAttribute('value', '42')
  })

  test('keeps authored color-picker inputs available before enhancement', async ({ page }) => {
    await page.goto('/stories/library-color-color-picker--default/')
    await expectRouteDocumentReady(page)
    await expect(page.getByRole('textbox', { name: 'Raw color value' })).toBeVisible()
    await expect(page.getByRole('slider')).toHaveCount(4)
  })
})
