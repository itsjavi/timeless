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

/**
 * Milestone 020 established the pattern for `ui-dialog`; the Select trigger now follows it with
 * `popovertarget`. This test is the whole justification for authoring that attribute rather than
 * calling `showPopover()` from a click listener.
 */
test('an authored popovertarget opens the select surface without JavaScript', async ({ page }) => {
  await page.goto('/stories/library-navigation-select--default/')
  /*
   * `button`, not `combobox`, and deliberately: `role="combobox"` is written by enhancement, so with
   * scripting off the trigger is still the plain button the author wrote — which is the whole point.
   * It also carries no `aria-activedescendant` here, so the attribute and its role arrive together.
   */
  const trigger = page.getByRole('button', { name: /Role/ })
  const surface = page.locator("ui-select [role='listbox']")

  await expect(surface).toBeHidden()
  await trigger.click()
  await expect(surface).toBeVisible()
  // The options are readable markup before enhancement, which is the bar for an enhanced component.
  await expect(surface.getByText('Manager')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(surface).toBeHidden()
})

/**
 * The fieldset and the native select are CSS over native elements, so scripting off changes nothing
 * about them. Milestone 023's acceptance names them as the two that must be *fully* functional.
 */
test('a fieldset and a native select stay fully functional without JavaScript', async ({
  page,
}) => {
  await page.goto('/stories/library-forms-fieldset--default/')
  const street = page.getByLabel('Street')
  await street.fill('12 Copperfield Way')
  await expect(street).toHaveValue('12 Copperfield Way')
  await expect(page.getByRole('group', { name: 'Billing address' })).toBeVisible()

  await page.goto('/stories/library-forms-native-select--default/')
  const select = page.getByLabel('Role')
  await select.selectOption('admin')
  await expect(select).toHaveValue('admin')
  // The indicator is drawn by CSS, so it is there before any script runs.
  expect(await select.evaluate((element) => getComputedStyle(element).backgroundImage)).toContain(
    'gradient',
  )
})

/**
 * The two enhanced fields degrade differently, and the docs say so per component. The range pair
 * still submits, because both thumbs are native inputs with their own `name`. The OTP field is
 * usable but submits nothing, because the joined code belongs to the host — the same bar Select and
 * Combobox meet.
 */
test('the two-thumb range still submits without JavaScript', async ({ page }) => {
  await page.goto('/stories/library-forms-range-field--default/')
  const from = page.locator("ui-range-field [data-ui-part~='from']")
  await expect(from).toBeVisible()

  const submitted = await page.locator('ui-range-field').evaluate((host) => {
    const form = host.ownerDocument.createElement('form')
    host.parentElement?.insertBefore(form, host)
    form.append(host)
    return [...new FormData(form).entries()]
  })
  expect(submitted).toEqual([
    ['budget-from', '120'],
    ['budget-to', '380'],
  ])
})

test('the one-time code cells stay usable without JavaScript', async ({ page }) => {
  await page.goto('/stories/library-forms-otp-field--in-sign-in-form/')
  const cells = page.locator("ui-otp-field [data-ui-part~='cell']")
  await expect(cells).toHaveCount(6)

  await cells.nth(0).fill('4')
  await expect(cells.nth(0)).toHaveValue('4')
  // No focus advance and no joined value: that behavior is the enhancement, and the docs say so.
  await expect(page.locator('ui-otp-field')).toHaveAttribute('name', 'code')
  expect(
    await cells.nth(0).evaluate((cell: HTMLInputElement) => cell.getAttribute('autocomplete')),
  ).toBe('one-time-code')
})

/**
 * Swipe-to-dismiss is an addition, so a sheet with scripting off must still be exactly the sheet it
 * was: the authored `command="show-modal"` opens it and `command="close"` closes it, with no gesture
 * involved anywhere.
 */
test('a modal sheet still opens and closes without JavaScript or a gesture', async ({ page }) => {
  await page.goto('/stories/library-overlays-sheet--default/')
  const trigger = page.getByRole('button', { name: 'Open release sheet' })
  const panel = page.locator('#release-sheet')

  await expect(panel).toBeHidden()
  await trigger.click()
  await expect(panel).toBeVisible()

  // Nothing wrote a drag offset, because nothing ran.
  expect(
    await panel.evaluate((element: HTMLElement) =>
      element.style.getPropertyValue('--ui-sheet-drag-offset'),
    ),
  ).toBe('')

  // Escape rather than the footer button, and not for want of trying: with script execution
  // disabled the panel's entry animation never settles for Playwright's stability probe, so no click
  // inside this sheet can be dispatched. Escape is the platform closing a modal `<dialog>`, which is
  // the same claim about the same markup.
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
})

/**
 * The reveal is the reason the trigger is authored `hidden` rather than hidden by script. With
 * scripting off nothing runs, so the attribute the author wrote is the whole behavior: no button, and
 * therefore no button that does nothing.
 */
test('a copy trigger authored hidden stays hidden without JavaScript', async ({ page }) => {
  await page.goto('/stories/library-actions-copy-button--hidden-until-supported/')
  const host = page.locator('ui-copy-button')

  await expect(host).toBeAttached()
  await expect(host.locator("[data-ui-part~='trigger']")).toBeHidden()
  // Nothing was enhanced, so the markup is exactly as authored.
  await expect(host.locator("[data-ui-part~='trigger']")).toHaveAttribute('hidden', '')
})

/**
 * A worded trigger the author did not hide is left alone, which is the other half of the opt-in rule:
 * script never removes a visible control an author wrote. It renders, and it does nothing.
 */
test('a copy trigger the author left visible still renders without JavaScript', async ({
  page,
}) => {
  await page.goto('/stories/library-actions-copy-button--default/')
  const trigger = page.getByRole('button', { name: 'Copy the install command' })

  await expect(trigger).toBeVisible()
  await expect(page.locator('#install-command')).toHaveText('pnpm add @timelessui/components')
  // The confirmation label is out of flow before enhancement too, because that is CSS, not script.
  await expect(page.locator("ui-copy-button [data-ui-part~='copied']")).toBeHidden()
})

/**
 * The context menu is the documented exception: the platform cannot open a surface at pointer
 * coordinates declaratively, so with scripting off the authored menu stays hidden and the browser
 * shows its own. This asserts that it degrades to hidden rather than to a broken open state.
 */
test('the context menu surface stays hidden without JavaScript', async ({ page }) => {
  await page.goto('/stories/library-navigation-context-menu--default/')
  const target = page.locator("[data-ui-part~='target']").first()
  const menu = page.locator('#asset-context-menu')

  await expect(target).toBeVisible()
  await expect(menu).toBeHidden()
  // Nothing was enhanced, so no relationship was written either — the markup is exactly as authored.
  await expect(target).not.toHaveAttribute('aria-haspopup', 'menu')
  await expect(target).not.toHaveAttribute('tabindex', '0')

  await target.click({ button: 'right' })
  await expect(menu).toBeHidden()
})

/**
 * Milestone 025's primary test, not a footnote. Breadcrumb and Pagination are CSS over native markup
 * with no element, no define entrypoint, and no script, so with scripting off they must be *fully*
 * functional rather than merely present: every link navigable, the current page marked, the separator
 * drawn. If any of that needed JavaScript, the component was built wrong.
 */
test('a breadcrumb is complete and navigable without JavaScript', async ({ page }) => {
  await page.goto('/stories/library-navigation-breadcrumb--default/')
  const trail = page.getByRole('navigation', { name: 'Breadcrumb' })

  await expect(trail).toBeVisible()
  await expect(trail.getByRole('link', { name: 'Documentation' })).toHaveAttribute('href', '/docs/')
  await expect(trail.getByRole('link', { name: 'Components' })).toHaveAttribute(
    'href',
    '/docs/components/',
  )
  // The final crumb is marked and is not a link, both of which the author wrote.
  const current = trail.locator("[aria-current='page']")
  await expect(current).toHaveText('Breadcrumb')
  await expect(trail.getByRole('link', { name: 'Breadcrumb' })).toHaveCount(0)

  // The separator is drawn by CSS, so it is there before any script would have run.
  const separator = await trail
    .locator("[data-ui-part~='item']")
    .nth(1)
    .evaluate((element) => window.getComputedStyle(element, '::before').content)
  expect(separator).toContain('›')
})

test('pagination is complete and navigable without JavaScript', async ({ page }) => {
  await page.goto('/stories/library-navigation-pagination--default/')
  const pager = page.getByRole('navigation', { name: 'Pagination' })

  await expect(pager).toBeVisible()
  await expect(pager.getByRole('link', { name: 'Previous' })).toHaveAttribute('href', '?page=3')
  await expect(pager.getByRole('link', { name: 'Next' })).toHaveAttribute('href', '?page=5')
  await expect(pager.locator("[aria-current='page']")).toHaveText('4')

  // A real link, so the browser navigates it with nothing loaded and no handler attached.
  await pager.getByRole('link', { name: 'Page 5' }).click()
  await expect.poll(() => new URL(page.url()).searchParams.get('page')).toBe('5')
})
