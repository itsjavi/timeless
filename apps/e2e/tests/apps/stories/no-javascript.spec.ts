import { expect, test } from '../../shared/fixtures'

test.use({ javaScriptEnabled: false })

test('large dataset fixture retains a usable native input without JavaScript', async ({ page }) => {
  await page.goto('/stories/recipes-performance-large-dataset--default/')
  const input = page.getByLabel('Search records')
  await expect(input).toBeVisible()
  await input.fill('Archive record 0100')
  await expect(input).toHaveValue('Archive record 0100')
  await expect(page.getByText('Records load when the selector receives focus.')).toBeVisible()
})
