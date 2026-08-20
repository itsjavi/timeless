import type { Locator, Page } from '@playwright/test'
import { expect, test } from '../../shared/fixtures'
import { expectNoPageOverflow, expectRouteDocumentReady } from '../../shared/test-utils'

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

  test('select submits its own value and writes the trigger label', async ({ page }) => {
    await page.goto('/stories/library-navigation-select--default/')
    await expectRouteDocumentReady(page)

    const host = page.locator('ui-select')
    const trigger = page.getByRole('combobox', { name: /Role/ })
    const value = trigger.locator("[data-ui-part~='value']")

    await expect(value).toHaveText('Engineer')
    await expect(host).toHaveJSProperty('value', 'engineer')

    await trigger.click()
    await page.getByRole('option', { name: 'Manager' }).click()

    await expect(value).toHaveText('Manager')
    await expect(host).toHaveJSProperty('value', 'manager')

    await trigger.click()
    const viewer = page.getByRole('option', { name: 'Viewer' })
    await expect(viewer).toHaveCSS('opacity', '0.56')
    await viewer.hover()
    await expect(viewer).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(viewer).toBeDisabled()
    await expect(host).toHaveJSProperty('value', 'manager')
  })

  /**
   * Select's typeahead policy, which differs from every other collection surface: on a closed
   * trigger a printable character selects the match outright, the way the native control does, and
   * only moves the highlight once the surface is open. Listbox, Select, and Menu now share one
   * buffer and one idle window, so the policy that stays per-component is worth holding down.
   */
  test('select types to select while closed and to highlight while open', async ({ page }) => {
    await page.goto('/stories/library-navigation-select--default/')
    await expectRouteDocumentReady(page)

    const host = page.locator('ui-select')
    const trigger = page.getByRole('combobox', { name: /Role/ })
    const surface = host.locator("[role='listbox']")
    // The shared idle window is 700ms. Waiting past it between phases is the debounce under test,
    // not a hack around a race: each phase has to start from an empty buffer, and a buffer that
    // empties on its own is the whole reason there is one implementation of it.
    const idle = () => page.waitForTimeout(900)

    // A shifted character is a printable character, so it types. Closed, the match is selected
    // outright rather than opening the surface, which is what the native control does.
    await trigger.focus()
    await page.keyboard.press('Shift+M')
    await expect(surface).toBeHidden()
    await expect(host).toHaveJSProperty('value', 'manager')

    await idle()
    await page.keyboard.press('d')
    await expect(surface).toBeHidden()
    await expect(host).toHaveJSProperty('value', 'designer')

    // Open, the same keystroke only moves the highlight.
    await idle()
    await trigger.click()
    await expect(surface).toBeVisible()
    await page.keyboard.press('e')
    await expect(page.getByRole('option', { name: 'Engineer' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
    await expect(host).toHaveJSProperty('value', 'designer')
  })

  /**
   * The defect this milestone was opened for. `position-area: bottom center` centred the surface on
   * its trigger and `inline-size: max-content` let it be narrower; both assertions fail on `main`.
   */
  test('anchors the select surface to its trigger edge and never narrower', async ({ page }) => {
    await page.goto('/stories/library-navigation-select--alignment/')
    await expectRouteDocumentReady(page)

    const startHost = page.locator('ui-select').first()
    const startTrigger = startHost.getByRole('combobox')
    await startTrigger.click()
    const startSurface = startHost.locator("[role='listbox']")
    await expect(startSurface).toBeVisible()

    const startTriggerBox = await boundingBox(startTrigger)
    const startSurfaceBox = await boundingBox(startSurface)
    expect(Math.abs(startSurfaceBox.x - startTriggerBox.x)).toBeLessThan(2)
    expect(startSurfaceBox.width).toBeGreaterThanOrEqual(startTriggerBox.width - 1)
    await page.keyboard.press('Escape')

    const endHost = page.locator('ui-select').nth(1)
    const endTrigger = endHost.getByRole('combobox')
    await endTrigger.click()
    const endSurface = endHost.locator("[role='listbox']")
    await expect(endSurface).toBeVisible()

    const endTriggerBox = await boundingBox(endTrigger)
    const endSurfaceBox = await boundingBox(endSurface)
    expect(
      Math.abs(endSurfaceBox.x + endSurfaceBox.width - (endTriggerBox.x + endTriggerBox.width)),
    ).toBeLessThan(2)
    expect(endSurfaceBox.width).toBeGreaterThanOrEqual(endTriggerBox.width - 1)
  })

  /**
   * The fallback used to run in every browser, stamping a private hook and coordinates the
   * `@supports` rule then discarded. Where anchor positioning exists, none of it should appear.
   */
  test('leaves no floating fallback hooks where anchor positioning is supported', async ({
    page,
  }) => {
    await page.goto('/stories/library-navigation-select--default/')
    await expectRouteDocumentReady(page)

    const supported = await page.evaluate(() => CSS.supports('anchor-name: --ui-anchor'))
    test.skip(!supported, 'this browser has no anchor positioning')

    const surface = page.locator("ui-select [role='listbox']")
    await page.getByRole('combobox', { name: /Role/ }).click()
    await expect(surface).toBeVisible()

    await expect(surface).not.toHaveAttribute('data-ui-internal-floating', /.*/)
    await expect
      .poll(() =>
        surface.evaluate((element: HTMLElement) =>
          element.style.getPropertyValue('--ui-floating-left'),
        ),
      )
      .toBe('')
  })

  test('searchable select keeps focus in the search field and collapses empty groups', async ({
    page,
  }) => {
    await page.goto('/stories/library-navigation-select--grouped-and-searchable/')
    await expectRouteDocumentReady(page)

    const trigger = page.getByRole('combobox', { name: /Team/ })
    const search = page.locator("[data-ui-part~='search']")
    await trigger.click()
    await expect(search).toBeFocused()

    // Every group is labelled, and options inside one stay in a single navigation order.
    for (const group of await page.getByRole('group').all()) {
      await expect(group).toHaveAttribute('aria-labelledby', /.+/)
    }

    await page.keyboard.press('ArrowDown')
    await expect(search).toBeFocused()
    await expect(search).toHaveAttribute('aria-activedescendant', /option/)

    // Horizontal arrows are caret movement, so the highlight must not move.
    const active = await search.getAttribute('aria-activedescendant')
    await page.keyboard.press('ArrowRight')
    await expect(search).toHaveAttribute('aria-activedescendant', String(active))

    await search.fill('fro')
    await expect(page.getByRole('option', { name: 'Frontend' })).toBeVisible()
    await expect(page.getByRole('group', { name: 'Product' })).toBeHidden()

    await search.fill('zzz')
    await expect(page.locator("[data-ui-part~='empty']")).toBeVisible()
  })

  test('multiple select renders removable chips and submits one entry per value', async ({
    page,
  }) => {
    await page.goto('/stories/library-navigation-select--multiple-with-chips/')
    await expectRouteDocumentReady(page)

    const host = page.locator('ui-select')
    const chips = page.locator("[data-ui-part~='chips']")
    const clear = page.getByRole('button', { name: 'Clear' })

    await expect(clear).toBeDisabled()
    await page.getByRole('combobox', { name: /Reviewers/ }).click()
    await page.getByRole('option', { name: 'Designer' }).click()
    await page.getByRole('option', { name: 'Manager' }).click()

    await expect(chips.locator("[data-ui-part~='chip']")).toHaveCount(2)
    await expect(page.getByRole('button', { name: 'Remove Designer' })).toBeVisible()
    await expect(clear).toBeEnabled()
    await expect
      .poll(() => host.evaluate((element: HTMLElement & { values: string[] }) => element.values))
      .toEqual(['designer', 'manager'])

    // Backspace in the empty search field removes the last chip.
    await page.locator("[data-ui-part~='search']").focus()
    await page.keyboard.press('Backspace')
    await expect(chips.locator("[data-ui-part~='chip']")).toHaveCount(1)

    await page.getByRole('button', { name: 'Remove Designer' }).click()
    await expect(chips.locator("[data-ui-part~='chip']")).toHaveCount(0)
    await expect(clear).toBeDisabled()
  })

  test('pages a long option list and keeps the boundary discoverable', async ({ page }) => {
    await page.goto('/stories/library-navigation-select--paged-long-list/')
    await expectRouteDocumentReady(page)

    await page.getByRole('combobox', { name: /City/ }).click()
    const pageStatus = page.locator("[data-ui-part~='page-status']")
    const previous = page.getByRole('button', { name: 'Previous' })
    const next = page.getByRole('button', { name: 'Next' })

    await expect(pageStatus).toHaveText('Page 1 of 3')
    await expect(page.getByRole('option', { name: 'Amsterdam' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Dublin' })).toBeHidden()
    // `aria-disabled` rather than `disabled`, so the boundary is announced instead of unreachable.
    await expect(previous).toHaveAttribute('aria-disabled', 'true')
    await expect(previous).not.toHaveAttribute('disabled', /.*/)
    await previous.focus()
    await expect(previous).toBeFocused()

    await next.click()
    await expect(pageStatus).toHaveText('Page 2 of 3')
    await expect(page.getByRole('option', { name: 'Dublin' })).toBeVisible()
    await expect(previous).toHaveAttribute('aria-disabled', 'false')
  })

  test('select in a form blocks on required, submits, and restores on reset', async ({ page }) => {
    await page.goto('/stories/library-navigation-select--form-participation/')
    await expectRouteDocumentReady(page)

    const reviewer = page.locator('ui-select').nth(1)
    await expect
      .poll(() =>
        reviewer.evaluate((element: HTMLElement & { checkValidity(): boolean }) =>
          element.checkValidity(),
        ),
      )
      .toBe(false)

    await page.getByRole('combobox', { name: /Reviewer/ }).click()
    await page.getByRole('option', { name: 'Manager' }).click()

    await expect
      .poll(() =>
        page.evaluate(() => [
          ...new FormData(document.querySelector('form') as HTMLFormElement).entries(),
        ]),
      )
      .toEqual([
        ['assignee', 'designer'],
        ['reviewer', 'manager'],
      ])

    await page.evaluate(() => (document.querySelector('form') as HTMLFormElement).reset())
    await expect(reviewer).toHaveJSProperty('value', '')
  })

  test('combobox filters options and selects the active option with Enter', async ({ page }) => {
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

  /** Consumer-owned filtering runs through `hidden`, so everything downstream follows unchanged. */
  test('honours consumer-owned filtering under filter="off"', async ({ page }) => {
    await page.goto('/stories/library-navigation-combobox--consumer-owned-filtering/')
    await expectRouteDocumentReady(page)

    const input = page.getByRole('combobox', { name: 'Command' })

    // The demo matches the end of each label, which no built-in mode does.
    await input.fill('production')
    await expect(page.getByRole('option', { name: 'Deploy to production' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Deploy to staging' })).toBeHidden()

    await input.fill('nothing')
    await expect(page.locator("[data-ui-part~='empty']")).toBeVisible()
  })
})

async function boundingBox(locator: Locator): Promise<{
  height: number
  width: number
  x: number
  y: number
}> {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  return box!
}

async function expectMenuAlignedToTrigger(trigger: Locator, menu: Locator): Promise<void> {
  const triggerBox = await trigger.boundingBox()
  const menuBox = await menu.boundingBox()

  expect(triggerBox).not.toBeNull()
  expect(menuBox).not.toBeNull()
  expect(Math.abs((menuBox?.x ?? 0) - (triggerBox?.x ?? 0))).toBeLessThan(2)
}

/**
 * Milestone 024: menu anatomy that used to be invisible to the JavaScript.
 *
 * Discovery walked direct children only, so wrapping items in a `group` lost every one of them, and
 * the stylesheet drew `aria-checked` while nothing wrote it. Both are contract-level, so both are
 * asserted through the public anatomy rather than through internals.
 */
test.describe('stories menu groups, checkable items, and submenus', () => {
  test('navigates and types through grouped items and skips separators', async ({ page }) => {
    await page.goto('/stories/library-navigation-menu--grouped-and-checkable/')
    await expectRouteDocumentReady(page)

    const menu = page.locator('ui-menu')
    await expect(menu.getByRole('group', { name: 'View' })).toBeVisible()
    await expect(menu.getByRole('group', { name: 'Density' })).toBeVisible()

    // Three loose items, then four grouped ones. Discovery reaching the grouped four is the fix.
    const items = menu.locator("[role^='menuitem']")
    await expect(items).toHaveCount(7)

    await page.getByRole('menuitem', { name: 'Duplicate' }).focus()
    await page.keyboard.press('End')
    await expect(page.getByRole('menuitemradio', { name: 'Compact' })).toBeFocused()

    // Typeahead reaches a grouped item too, which it could not while discovery stopped at the
    // wrapper. The separators between the groups are skipped by both routes, because a separator
    // carries no menu-item role and so is not an item at all.
    await page.keyboard.press('Home')
    await page.keyboard.press('s')
    await expect(page.getByRole('menuitemcheckbox', { name: 'Show grid' })).toBeFocused()
  })

  test('toggles a checkbox item and switches radios only inside their own group', async ({
    page,
  }) => {
    await page.goto('/stories/library-navigation-menu--grouped-and-checkable/')
    await expectRouteDocumentReady(page)

    const grid = page.getByRole('menuitemcheckbox', { name: 'Show grid' })
    const rulers = page.getByRole('menuitemcheckbox', { name: 'Show rulers' })
    const comfortable = page.getByRole('menuitemradio', { name: 'Comfortable' })
    const compact = page.getByRole('menuitemradio', { name: 'Compact' })

    await rulers.click()
    await expect(rulers).toHaveAttribute('aria-checked', 'true')
    await expect(grid).toHaveAttribute('aria-checked', 'true')

    // Enter goes through the same activation path as a click, so it must toggle the same way.
    await rulers.press('Enter')
    await expect(rulers).toHaveAttribute('aria-checked', 'false')

    await compact.click()
    await expect(compact).toHaveAttribute('aria-checked', 'true')
    await expect(comfortable).toHaveAttribute('aria-checked', 'false')
    // The checkboxes are a different group, and radios must not reach across.
    await expect(grid).toHaveAttribute('aria-checked', 'true')
  })

  test('lets a consumer keep owning aria-checked by cancelling the proposal', async ({ page }) => {
    await page.goto('/stories/library-navigation-menu--grouped-and-checkable/')
    await expectRouteDocumentReady(page)

    await page
      .locator('ui-menu')
      .evaluate((menu) =>
        menu.addEventListener('ui-before-change', (event) => event.preventDefault()),
      )

    const rulers = page.getByRole('menuitemcheckbox', { name: 'Show rulers' })
    await rulers.click()
    await expect(rulers).toHaveAttribute('aria-checked', 'false')
  })

  test('opens and closes a submenu two levels deep with the inline arrows', async ({ page }) => {
    await page.goto('/stories/library-navigation-menu--menubar/')
    await expectRouteDocumentReady(page)

    const fileSubmenu = page.locator('#submenu-file')
    const exportSubmenu = page.locator('#submenu-export-as')
    const exportItem = page.getByRole('menuitem', { name: 'Export as' })

    await page.getByRole('menuitem', { exact: true, name: 'File' }).click()
    await expect(fileSubmenu).toBeVisible()
    await expect(exportItem).toHaveAttribute('aria-haspopup', 'menu')
    await expect(exportItem).toHaveAttribute('aria-expanded', 'false')

    await exportItem.focus()
    await page.keyboard.press('ArrowRight')
    await expect(exportSubmenu).toBeVisible()
    await expect(exportItem).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('menuitem', { name: 'PNG' })).toBeFocused()

    // Inward from depth two returns to the trigger rather than moving along the bar.
    await page.keyboard.press('ArrowLeft')
    await expect(exportSubmenu).toBeHidden()
    await expect(exportItem).toBeFocused()
    await expect(exportItem).toHaveAttribute('aria-expanded', 'false')
    await expect(fileSubmenu).toBeVisible()
  })

  /**
   * A submenu opens toward the inline end, so under `dir="rtl"` the two keys trade places. Asserted
   * at depth two, where the only thing the inline arrows can do is open and close: at depth one they
   * also travel along the menubar, which is a different — and equally direction-aware — behavior.
   */
  test('swaps the submenu arrows under a right-to-left writing direction', async ({ page }) => {
    await page.goto('/stories/library-navigation-menu--menubar/')
    await expectRouteDocumentReady(page)
    await page.locator('html').evaluate((html) => html.setAttribute('dir', 'rtl'))

    const exportSubmenu = page.locator('#submenu-export-as')
    const exportItem = page.getByRole('menuitem', { name: 'Export as' })

    await page.getByRole('menuitem', { exact: true, name: 'File' }).click()
    await exportItem.focus()

    // Arrow Left is now the outward key.
    await page.keyboard.press('ArrowLeft')
    await expect(exportSubmenu).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'PNG' })).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(exportSubmenu).toBeHidden()
    await expect(exportItem).toBeFocused()
  })

  test('opens a menu-button menu on its first enabled item', async ({ page }) => {
    await page.goto('/stories/library-navigation-menu-button--default/')
    await expectRouteDocumentReady(page)

    const menu = page.locator('ui-menu-button ui-menu')
    await menu.evaluate((element) => {
      element.querySelector("[role^='menuitem']")?.setAttribute('aria-disabled', 'true')
    })

    await page.getByRole('button', { name: 'Actions' }).click()
    const items = menu.locator("[role^='menuitem']")
    await expect(items.first()).toHaveAttribute('aria-disabled', 'true')
    await expect(items.nth(1)).toBeFocused()
  })
})

/**
 * Milestone 024: the context menu, which is the only overlay with no markup-only path.
 *
 * The pointer cases dispatch a real `MouseEvent` rather than using `page.mouse`, because headless
 * Chromium does not raise `contextmenu` for a synthesised right button — the coordinates are the
 * whole subject of these assertions, so they have to be the ones the component sees.
 */
test.describe('stories context menu', () => {
  const openAt = async (page: Page, x: number, y: number) => {
    await page
      .locator("[data-ui-part~='target']")
      .first()
      .evaluate(
        (target, point) => {
          target.dispatchEvent(
            new MouseEvent('contextmenu', {
              bubbles: true,
              cancelable: true,
              clientX: point.x,
              clientY: point.y,
            }),
          )
        },
        { x, y },
      )
  }

  test('opens at the pointer, wires the target, and returns focus on Escape', async ({ page }) => {
    await page.goto('/stories/library-navigation-context-menu--default/')
    await expectRouteDocumentReady(page)

    const target = page.locator("[data-ui-part~='target']").first()
    const menu = page.locator('#asset-context-menu')

    await expect(target).toHaveAttribute('tabindex', '0')
    await expect(target).toHaveAttribute('aria-haspopup', 'menu')
    await expect(target).toHaveAttribute('aria-controls', 'asset-context-menu')
    await expect(menu).toBeHidden()

    await openAt(page, 420, 260)
    await expect(menu).toBeVisible()
    await expect(target).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('menuitem', { name: 'Open' })).toBeFocused()

    const box = await menu.boundingBox()
    expect(Math.round(box?.x ?? 0)).toBe(420)
    expect(Math.round(box?.y ?? 0)).toBe(260)

    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(target).toBeFocused()
    await expect(target).toHaveAttribute('aria-expanded', 'false')
  })

  test('opens from the keyboard against the focused target', async ({ page }) => {
    await page.goto('/stories/library-navigation-context-menu--default/')
    await expectRouteDocumentReady(page)

    const target = page.locator("[data-ui-part~='target']").first()
    const menu = page.locator('#asset-context-menu')

    await target.focus()
    await page.keyboard.press('Shift+F10')
    await expect(menu).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Open' })).toBeFocused()
    const targetBox = await target.boundingBox()
    const menuBox = await menu.boundingBox()
    expect(Math.round(menuBox?.y ?? 0)).toBeGreaterThanOrEqual(
      Math.round((targetBox?.y ?? 0) + (targetBox?.height ?? 0)),
    )

    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()

    // The dedicated key is the other half of the same route.
    await target.focus()
    await page.keyboard.press('ContextMenu')
    await expect(menu).toBeVisible()
  })

  test('stays inside the viewport at every corner', async ({ page }) => {
    await page.goto('/stories/library-navigation-context-menu--default/')
    await expectRouteDocumentReady(page)

    const menu = page.locator('#asset-context-menu')
    const viewport = page.viewportSize() ?? { width: 1280, height: 720 }
    const corners = [
      { x: 2, y: 2 },
      { x: viewport.width - 2, y: 2 },
      { x: 2, y: viewport.height - 2 },
      { x: viewport.width - 2, y: viewport.height - 2 },
    ]

    for (const corner of corners) {
      await openAt(page, corner.x, corner.y)
      await expect(menu).toBeVisible()
      const box = await menu.boundingBox()
      expect(box, `no box at ${corner.x},${corner.y}`).not.toBeNull()
      expect(box!.x, `left at ${corner.x},${corner.y}`).toBeGreaterThanOrEqual(0)
      expect(box!.y, `top at ${corner.x},${corner.y}`).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width, `right at ${corner.x},${corner.y}`).toBeLessThanOrEqual(
        viewport.width + 1,
      )
      expect(box!.y + box!.height, `bottom at ${corner.x},${corner.y}`).toBeLessThanOrEqual(
        viewport.height + 1,
      )
      await page.keyboard.press('Escape')
      await expect(menu).toBeHidden()
    }
    await expectNoPageOverflow(page)
  })

  test('gives each region its own commands', async ({ page }) => {
    await page.goto('/stories/library-navigation-context-menu--per-region/')
    await expectRouteDocumentReady(page)

    const rowTarget = page.locator("[data-ui-part~='target']").nth(1)
    await rowTarget.focus()
    await page.keyboard.press('Shift+F10')

    await expect(page.locator('#row-context-menu')).toBeVisible()
    await expect(page.locator('#asset-context-menu')).toBeHidden()
    await expect(page.getByRole('menuitemcheckbox', { name: 'Pinned' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })
})
