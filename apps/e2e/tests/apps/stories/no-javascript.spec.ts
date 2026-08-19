import { expect, test } from '../../shared/fixtures'

test.use({ javaScriptEnabled: false })

/**
 * The reason `ui-dialog` reads `command` and `commandfor` instead of writing them. With scripting
 * off the custom element never upgrades, so everything here is the platform acting on the authored
 * markup alone.
 */
test('authored invoker commands open and close the dialog without JavaScript', async ({ page }) => {
  await page.goto('/stories/library-overlays-dialog--default/')
  const trigger = page.getByRole('button', { name: 'Review release' })
  const dialog = page.locator('#release-dialog')

  await expect(dialog).toBeHidden()
  await trigger.click()
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Release checklist' })).toBeVisible()

  await dialog.getByRole('button', { name: 'Confirm' }).click()
  await expect(dialog).toBeHidden()
  // `command="close"` carries the button's `value` through to `returnValue`, which is the work the
  // click listener does by hand on the fallback path.
  await expect
    .poll(() => dialog.evaluate((element: HTMLDialogElement) => element.returnValue))
    .toBe('confirm')
})

test('large dataset fixture retains a usable native input without JavaScript', async ({ page }) => {
  await page.goto('/stories/recipes-performance-large-dataset--default/')
  const input = page.getByLabel('Search records')
  await expect(input).toBeVisible()
  await input.fill('Archive record 0100')
  await expect(input).toHaveValue('Archive record 0100')
  await expect(page.getByText('Records load when the selector receives focus.')).toBeVisible()
})
