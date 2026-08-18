import type { Locator } from '@playwright/test'
import { expect, test } from '../../shared/fixtures'
import { expectRouteDocumentReady } from '../../shared/test-utils'

test.describe('stories collection navigation', () => {
  test('opens menu button and supports menu keyboard navigation', async ({ page }) => {
    await page.goto('/stories/library-navigation-menu-button--default/')
    await expectRouteDocumentReady(page)

    const trigger = page.getByRole('button', { name: 'Release actions' })
    const menu = page.locator('#release-menu')

    await expect(menu).toBeHidden()
    await trigger.click()

    await expect(menu).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('menuitem', { name: 'Preview release' })).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('menuitem', { name: 'Copy changelog' })).toBeFocused()

    await page.keyboard.press('a')
    await expect(page.getByRole('menuitem', { name: 'Archive release' })).toBeFocused()
  })

  test('moves focus inside toolbar with arrow keys', async ({ page }) => {
    await page.goto('/stories/library-navigation-toolbar--default/')
    await expectRouteDocumentReady(page)

    const bold = page.getByRole('button', { name: 'Bold' })
    const italic = page.getByRole('button', { name: 'Italic' })

    await bold.focus()
    await page.keyboard.press('ArrowRight')

    await expect(italic).toBeFocused()
  })

  test('moves and checks radio group options with arrow keys', async ({ page }) => {
    await page.goto('/stories/library-navigation-radio-group--default/')
    await expectRouteDocumentReady(page)

    const weekly = page.getByLabel('Weekly')
    const monthly = page.getByLabel('Monthly')

    await weekly.focus()
    await page.keyboard.press('ArrowDown')

    await expect(monthly).toBeFocused()
    await expect(monthly).toBeChecked()

    await expect(page.locator('label').filter({ hasText: 'Paused' })).toHaveCSS('opacity', '0.56')
  })

  test('keeps checkbox group inputs native and checkable', async ({ page }) => {
    await page.goto('/stories/library-navigation-checkbox-group--default/')
    await expectRouteDocumentReady(page)

    const sms = page.getByLabel('SMS')

    await expect(sms).not.toBeChecked()
    await sms.check()
    await expect(sms).toBeChecked()

    await expect(page.locator('label').filter({ hasText: 'Phone' })).toHaveCSS('opacity', '0.56')
  })

  test('selects listbox options with roving focus and keyboard activation', async ({ page }) => {
    await page.goto('/stories/library-navigation-listbox--default/')
    await expectRouteDocumentReady(page)

    const inProgress = page.getByRole('option', { name: 'In progress' })
    const review = page.getByRole('option', { name: 'Ready for review' })
    const shipped = page.getByRole('option', { name: 'Shipped' })
    const archived = page.getByRole('option', { name: 'Archived' })

    await expect(page.locator('ui-listbox')).toHaveCSS('display', 'grid')
    await expect(inProgress).toHaveCSS('min-block-size', '32px')
    await expect(archived).toHaveCSS('opacity', '0.56')
    await expect(archived).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')

    await inProgress.focus()
    await page.keyboard.press('ArrowDown')
    await expect(review).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(review).toHaveAttribute('aria-selected', 'true')

    await shipped.click()
    await expect(shipped).toHaveAttribute('aria-selected', 'true')

    await archived.hover()
    await expect(archived).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(archived).toBeDisabled()
    await expect(archived).toHaveAttribute('aria-selected', 'false')
  })

  test('renders multiple listbox selected and disabled states', async ({ page }) => {
    await page.goto('/stories/library-navigation-listbox--multiple/')
    await expectRouteDocumentReady(page)

    const listbox = page.locator('ui-listbox')
    const design = page.getByRole('option', { name: 'Design' })
    const engineering = page.getByRole('option', { name: 'Engineering' })
    const legal = page.getByRole('option', { name: 'Legal' })
    const finance = page.getByRole('option', { name: 'Finance' })

    await expect(listbox).toHaveAttribute('aria-multiselectable', 'true')
    await expect(design).toHaveAttribute('aria-selected', 'true')
    await expect(engineering).toHaveAttribute('aria-selected', 'true')
    await expect(finance).toHaveCSS('opacity', '0.56')

    await legal.click()
    await expect(legal).toHaveAttribute('aria-selected', 'true')
    await expect(design).toHaveAttribute('aria-selected', 'true')
  })

  test('opens menubar submenus with APG keyboard behavior', async ({ page }) => {
    await page.goto('/stories/library-navigation-menu--menubar/')
    await expectRouteDocumentReady(page)

    const file = page.getByRole('menuitem', { exact: true, name: 'File' })
    const edit = page.getByRole('menuitem', { exact: true, name: 'Edit' })
    const fileSubmenu = page.locator('#submenu-file')
    const editSubmenu = page.locator('#submenu-edit')

    await file.click()
    await expect(fileSubmenu).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'New file' })).toBeFocused()
    await expectMenuAlignedToTrigger(file, fileSubmenu)
    await page.keyboard.press('ArrowRight')
    await expect(fileSubmenu).toBeHidden()
    await expect(editSubmenu).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Undo' })).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(editSubmenu).toBeHidden()
    await expect(fileSubmenu).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'New file' })).toBeFocused()
    await page.keyboard.press('Escape')

    await file.focus()
    await page.keyboard.press('ArrowDown')

    await expect(fileSubmenu).toBeVisible()
    await expect(file).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('menuitem', { name: 'New file' })).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(fileSubmenu).toBeHidden()
    await expect(file).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(edit).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('menuitem', { name: 'Undo' })).toBeFocused()
  })

  test('opens menubar submenus inside the StoryLite workbench iframe', async ({ page }) => {
    await page.goto('/#/story/library-navigation-menu--menubar')

    const preview = page.frameLocator('iframe')
    const file = preview.getByRole('menuitem', { exact: true, name: 'File' })
    const fileSubmenu = preview.locator('#submenu-file')

    await file.click()
    await expect(file).toHaveAttribute('aria-expanded', 'true')
    await expect(fileSubmenu).toBeVisible()
    await expect(preview.getByRole('menuitem', { name: 'New file' })).toBeFocused()
    await expectMenuAlignedToTrigger(file, fileSubmenu)

    await page.keyboard.press('ArrowRight')
    await expect(fileSubmenu).toBeHidden()
    await expect(preview.locator('#submenu-edit')).toBeVisible()
    await expect(preview.getByRole('menuitem', { name: 'Undo' })).toBeFocused()
  })

  test('styles and selects listbox options inside the StoryLite workbench iframe', async ({
    page,
  }) => {
    await page.goto('/#/story/library-navigation-listbox--default')

    const preview = page.frameLocator('iframe')
    const listbox = preview.locator('ui-listbox')
    const shipped = preview.getByRole('option', { name: 'Shipped' })

    await expect(listbox).toHaveCSS('display', 'grid')
    await shipped.click()
    await expect(shipped).toHaveAttribute('aria-selected', 'true')
  })

  test('select updates hidden submitted value and trigger label', async ({ page }) => {
    await page.goto('/stories/library-navigation-select--default/')
    await expectRouteDocumentReady(page)

    const trigger = page.getByRole('button', { name: 'Role' })
    const hiddenInput = page.locator('input[name="role"]')

    await expect(hiddenInput).toHaveValue('engineer')
    await trigger.click()
    await page.getByRole('option', { name: 'Manager' }).click()

    await expect(hiddenInput).toHaveValue('manager')
    await expect(trigger.locator("[data-ui-part~='label']")).toHaveText('Manager')

    await trigger.click()
    const viewer = page.getByRole('option', { name: 'Viewer' })
    await expect(viewer).toHaveCSS('opacity', '0.56')
    await viewer.hover()
    await expect(viewer).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(viewer).toBeDisabled()
    await expect(hiddenInput).toHaveValue('manager')
  })

  test('combobox filters options and selects active option with Enter', async ({ page }) => {
    await page.goto('/stories/library-navigation-combobox--default/')
    await expectRouteDocumentReady(page)

    const input = page.getByRole('combobox', { name: 'Fruit' })
    const listbox = page.getByRole('listbox')

    await input.fill('ap')
    await expect(listbox).toBeVisible()
    await expect(page.getByRole('option', { name: 'Apple' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Banana' })).toBeHidden()

    await page.keyboard.press('ArrowDown')
    await expect(input).toHaveAttribute('aria-activedescendant', /option/)
    await page.keyboard.press('Enter')

    await expect(input).toHaveValue('apple')
    await expect(listbox).toBeHidden()
  })
})

async function expectMenuAlignedToTrigger(trigger: Locator, menu: Locator): Promise<void> {
  const triggerBox = await trigger.boundingBox()
  const menuBox = await menu.boundingBox()

  expect(triggerBox).not.toBeNull()
  expect(menuBox).not.toBeNull()
  expect(Math.abs((menuBox?.x ?? 0) - (triggerBox?.x ?? 0))).toBeLessThan(2)
}
