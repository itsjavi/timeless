import type { Page } from '@playwright/test'
import { examples } from '@timelessui/examples'
import { expect, test } from '../../shared/fixtures'

const behavioral = examples.filter((example) => example.definitions.length > 0)

async function whenDefined(page: Page, tags: readonly string[]): Promise<void> {
  await page.waitForFunction(
    (names) => names.every((name) => Boolean(customElements.get(name))),
    [...tags],
  )
}

test('registers every declared custom element in each isolated preview', async ({ page }) => {
  const unregistered: string[] = []

  for (const example of behavioral) {
    await page.goto(`/docs/_preview/${example.id}/`)
    await whenDefined(page, example.definitions).catch(() => {})

    const missing = await page.evaluate(
      (tags) => tags.filter((tag) => !customElements.get(tag)),
      [...example.definitions],
    )
    if (missing.length > 0) unregistered.push(`${example.id}: ${missing.join(', ')}`)
  }

  expect(unregistered).toEqual([])
})

test('opens the dialog preview as a modal and returns focus on Escape', async ({ page }) => {
  await page.goto('/docs/_preview/dialog/')
  await whenDefined(page, ['ui-dialog'])

  const trigger = page.getByRole('button', { name: 'Open dialog' })
  const dialog = page.locator('dialog')
  await trigger.click()
  await expect(dialog).toHaveJSProperty('open', true)
  expect(await dialog.evaluate((node: HTMLDialogElement) => node.matches(':modal'))).toBe(true)

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveJSProperty('open', false)
  await expect(trigger).toBeFocused()
})

test('filters the combobox preview from typed input', async ({ page }) => {
  await page.goto('/docs/_preview/combobox/')
  await whenDefined(page, ['ui-combobox'])

  const input = page.getByRole('combobox')
  const listbox = page.getByRole('listbox')

  await input.fill('re')
  await expect(listbox).toBeVisible()
  await expect(page.getByRole('option', { name: 'Ready' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Draft' })).toBeHidden()

  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(input).toHaveValue('ready')
  await expect(listbox).toBeHidden()
})

test('keeps radio preview checked state and roving tabindex in sync', async ({ page }) => {
  await page.goto('/docs/_preview/radio-group/')
  await whenDefined(page, ['ui-radio-group'])

  const radios = page.getByRole('radio')
  await radios.nth(1).click()

  await expect(radios.nth(0)).not.toBeChecked()
  await expect(radios.nth(1)).toBeChecked()
  await expect(page.locator('ui-radio-group')).toHaveJSProperty('value', 'light')
  await expect(radios.nth(1)).toHaveAttribute('tabindex', '0')
  await expect(radios.nth(0)).toHaveAttribute('tabindex', '-1')
})
