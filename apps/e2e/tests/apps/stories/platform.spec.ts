import { expect, test } from '../../shared/fixtures'
import { settleAnimations } from '../../shared/animations'
import { expectRouteDocumentReady } from '../../shared/test-utils'

test.describe('platform-dependent custom element behavior', () => {
  test('native dialog returns focus after Escape', async ({ page }) => {
    await page.goto('/stories/library-overlays-dialog--default/')
    await expectRouteDocumentReady(page)
    const trigger = page.getByRole('button', { name: 'Review release' })
    const dialog = page.getByRole('dialog', { name: 'Release checklist' })

    await trigger.click()
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await settleAnimations(page)
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  /**
   * The authored `command` / `commandfor` markup has to behave the same on every engine, whether
   * the browser runs the invocation itself or the component's click fallback does. This is the only
   * spec Firefox and WebKit run, so it is where that gets proven.
   */
  test('authored dialog invoker opens, closes, and reports a value', async ({ page }) => {
    await page.goto('/stories/library-overlays-dialog--default/')
    await expectRouteDocumentReady(page)
    const trigger = page.getByRole('button', { name: 'Review release' })
    const dialog = page.locator('#release-dialog')

    await expect(trigger).toHaveAttribute('command', 'show-modal')
    await expect(trigger).toHaveAttribute('commandfor', 'release-dialog')

    await trigger.click()
    await expect(dialog).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await settleAnimations(page)
    await expect(dialog).toBeHidden()
    await expect(dialog).toHaveJSProperty('returnValue', 'cancel')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
  })

  test('native popover synchronizes open state', async ({ page }) => {
    await page.goto('/stories/library-overlays-popover--default/')
    await expectRouteDocumentReady(page)
    const trigger = page.getByRole('button', { name: 'Open status' })
    const popover = page.locator('#release-popover')

    await trigger.click()
    await expect(popover).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(popover).toBeHidden()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('dynamic Light DOM options are enhanced after replacement', async ({ page }) => {
    await page.goto('/stories/library-navigation-listbox--default/')
    await expectRouteDocumentReady(page)
    const host = page.locator('ui-listbox')
    await host.evaluate((element) => {
      const option = element.ownerDocument.createElement('div')
      option.setAttribute('role', 'option')
      option.dataset.uiValue = 'dynamic'
      option.textContent = 'Dynamic option'
      element.replaceChildren(option)
    })

    const option = page.getByRole('option', { name: 'Dynamic option' })
    await expect(option).toHaveAttribute('id', /ui-listbox-\d+-option-1/)
    await expect(option).toHaveAttribute('tabindex', '0')
  })

  test('custom host state renders through :state()', async ({ page }) => {
    await page.goto('/stories/library-feedback-toast--default/')
    await expectRouteDocumentReady(page)
    const toast = page.locator('ui-toast').first()

    await toast.getByRole('button', { name: 'Dismiss notification' }).click()

    await expect(toast).toBeHidden()
    await expect
      .poll(() => toast.evaluate((element) => element.matches(':state(--closed)')))
      .toBe(true)
    await expect(toast).not.toHaveAttribute('data-ui-state', /.*/)
  })

  /**
   * Submenu keys across engines. The surface is a nested popover, so opening one exercises both the
   * Popover API's top-layer stacking and whether a second `showPopover()` closes the first — which
   * is exactly the behavior that differed between engines while this was being written.
   */
  test('a submenu opens and closes two levels deep', async ({ page }) => {
    await page.goto('/stories/library-navigation-menu--menubar/')
    await expectRouteDocumentReady(page)

    const fileSubmenu = page.locator('#submenu-file')
    const exportSubmenu = page.locator('#submenu-export-as')
    const exportItem = page.getByRole('menuitem', { name: 'Export as' })

    await page.getByRole('menuitem', { exact: true, name: 'File' }).click()
    await expect(fileSubmenu).toBeVisible()

    await exportItem.focus()
    await page.keyboard.press('ArrowRight')
    await expect(exportSubmenu).toBeVisible()
    await expect(fileSubmenu).toBeVisible()

    await page.keyboard.press('ArrowLeft')
    await expect(exportSubmenu).toBeHidden()
    await expect(exportItem).toBeFocused()
  })

  /**
   * Pointer capture and `pointercancel` differ enough between engines that the sheet gesture cannot
   * be trusted from a Chromium run alone. The drag handle is the only mouse-startable origin, which
   * is also the only origin Playwright can drive.
   */
  test('a swipe on the drag handle dismisses the sheet and returns focus', async ({ page }) => {
    await page.goto('/stories/library-overlays-sheet--default/')
    await expectRouteDocumentReady(page)

    const trigger = page.getByRole('button', { name: 'Open release sheet' })
    const panel = page.locator('#release-sheet')
    await trigger.click()
    await expect(panel).toBeVisible()
    // The entry animation moves the panel, and with it the handle the gesture has to start on.
    await settleAnimations(page)

    const handle = panel.locator("[data-ui-part~='drag-handle']")
    const box = await handle.boundingBox()
    const startX = (box?.x ?? 0) + (box?.width ?? 0) / 2
    const startY = (box?.y ?? 0) + (box?.height ?? 0) / 2
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 160, startY, { steps: 4 })
    await page.mouse.move(startX + 320, startY, { steps: 4 })
    const offset = await panel.evaluate((element: HTMLElement) =>
      element.style.getPropertyValue('--ui-sheet-drag-offset'),
    )
    await page.mouse.up()

    expect(offset).toBe('320px')
    await expect(panel).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  /**
   * `value` is the authored default, not the live value: it seeds the selection, stops applying once
   * the user commits a change, and comes back on reset — which is how a native input behaves and what
   * keeps a re-rendering framework from clobbering user input.
   */
  test('a form reset restores the authored select value', async ({ page }) => {
    await page.goto('/stories/library-navigation-select--form-participation/')
    await expectRouteDocumentReady(page)
    const host = page.locator('ui-select').first()

    await expect(host).toHaveJSProperty('value', 'designer')
    await page.getByRole('combobox', { name: /Assignee/ }).click()
    await page.getByRole('option', { name: 'Manager' }).click()
    await expect(host).toHaveJSProperty('value', 'manager')

    await host.evaluate((element) => element.closest('form')?.reset())
    await expect(host).toHaveJSProperty('value', 'designer')
  })
})
