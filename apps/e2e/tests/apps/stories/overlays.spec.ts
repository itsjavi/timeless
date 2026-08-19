import type { Locator, Page } from '@playwright/test'
import { expect, test } from '../../shared/fixtures'
import { expectNoPageOverflow, expectRouteDocumentReady } from '../../shared/test-utils'

type Rect = {
  readonly bottom: number
  readonly height: number
  readonly left: number
  readonly right: number
  readonly top: number
  readonly width: number
}

test.describe('stories progressive overlays', () => {
  test('opens, positions, styles, and closes a popover', async ({ page }) => {
    await page.goto('/stories/library-overlays-popover--default/')
    await expectRouteDocumentReady(page)

    const trigger = page.getByRole('button', { name: 'Open status' })
    const popover = page.locator('#release-popover')

    await expect(popover).toBeHidden()
    await trigger.click()

    await expect(popover).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Release status' })).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    await expectFloatingBelow(trigger, popover)
    await expectReadableSurface(popover)

    await page.keyboard.press('Escape')
    await expect(popover).toBeHidden()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expectNoPageOverflow(page)
  })

  test('keeps tooltip hidden until trigger intent and renders readable anchored content', async ({
    page,
  }) => {
    await page.goto('/stories/library-overlays-tooltip--default/')
    await expectRouteDocumentReady(page)

    const trigger = page.locator('#copy-tooltip-anchor')
    const tooltip = page.locator('#copy-tooltip')

    await expect(tooltip).toBeHidden()
    await trigger.focus()

    await expect(tooltip).toBeVisible()
    await expect(tooltip).toHaveAttribute('anchor', 'copy-tooltip-anchor')
    await expect(tooltip).toHaveAttribute('role', 'tooltip')
    await expect(tooltip).toHaveAttribute('popover', 'manual')
    await expect(trigger).toHaveAttribute('aria-describedby', 'copy-tooltip')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expectFloatingBelow(trigger, tooltip)
    await expectReadableSurface(tooltip, 4.5)

    await page.keyboard.press('Escape')
    await expect(tooltip).toBeHidden()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expectNoPageOverflow(page)
  })

  /**
   * A tooltip is one short label, so its box must not be the popover panel's. Computed values are
   * the only way to hold this: the previous tooltip inherited `overflow: auto`, a viewport-tall
   * `max-block-size`, and the panel's leading, and nothing failed when it did.
   */
  test('gives the tooltip a label box, not the popover panel box', async ({ page }) => {
    await page.goto('/stories/library-overlays-tooltip--against-hover-card/')
    await expectRouteDocumentReady(page)

    const tooltip = page.locator('#compare-tooltip')
    const panel = page.locator('#compare-hover-card')

    await page.locator('#compare-tooltip-anchor').focus()
    await expect(tooltip).toBeVisible()

    // The UA stylesheet gives every `[popover]` `overflow: auto`, so this has to be declared away.
    await expect(tooltip).toHaveCSS('overflow', 'visible')
    await expect(tooltip).toHaveCSS('max-block-size', 'none')
    await expect(tooltip).toHaveCSS('line-height', /^17\./)
    await expect(tooltip).toHaveCSS('padding', '6px 8px')

    const tooltipMax = await maxInlineSizeOf(tooltip)
    const tooltipHeight = (await rectOf(tooltip)).height
    await page.keyboard.press('Escape')
    await expect(tooltip).toBeHidden()

    await page.getByRole('button', { name: 'Hover card' }).focus()
    await expect(panel).toBeVisible()
    await expect(panel).toHaveCSS('overflow', 'auto')
    expect(await maxInlineSizeOf(panel)).toBeGreaterThan(tooltipMax)
    expect((await rectOf(panel)).height).toBeGreaterThan(tooltipHeight)
  })

  test('opens and closes hover card content from focus and click', async ({ page }) => {
    await page.goto('/stories/library-overlays-hover-card--default/')
    await expectRouteDocumentReady(page)

    const trigger = page.getByRole('button', { name: 'Button' })
    const card = page.locator('#component-hover-card')

    await expect(card).toBeHidden()
    await trigger.focus()

    await expect(card).toBeVisible()
    await expect(page.getByRole('group', { name: 'Button' })).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-controls', 'component-hover-card')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expectFloatingBelow(trigger, card)
    await expectReadableSurface(card)

    await page.keyboard.press('Escape')
    await expect(card).toBeHidden()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('opens and closes native dialog with focus return', async ({ page }) => {
    await page.goto('/stories/library-overlays-dialog--default/')
    await expectRouteDocumentReady(page)

    const trigger = page.getByRole('button', { name: 'Review release' })
    const dialog = page.locator('#release-dialog')

    await expect(dialog).toBeHidden()
    await trigger.click()

    await expect(dialog).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Release checklist' })).toBeVisible()
    await expect(dialog).toHaveAttribute('role', 'dialog')
    await expect(dialog).toHaveAttribute('aria-labelledby', 'release-dialog-title')
    // A dialog invoker gets no implicit expanded state from the platform, so this proves the
    // authored-command path still mirrors it.
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expectCenteredInViewport(page, dialog)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
  })

  test('closes the dialog from an authored close control and reports its value', async ({
    page,
  }) => {
    await page.goto('/stories/library-overlays-dialog--default/')
    await expectRouteDocumentReady(page)

    const trigger = page.getByRole('button', { name: 'Review release' })
    const dialog = page.locator('#release-dialog')

    await trigger.click()
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Confirm' }).click()

    await expect(dialog).toBeHidden()
    // `command="close"` propagates the button's value natively, matching what the click fallback
    // does by reading `value` and passing it to `close()`.
    await expect(dialog).toHaveJSProperty('returnValue', 'confirm')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
  })

  test('opens the dialog from the click listener when the markup authors no command', async ({
    page,
  }) => {
    await page.goto('/stories/library-overlays-dialog--default/')
    await expectRouteDocumentReady(page)

    const trigger = page.getByRole('button', { name: 'Review release' })
    const dialog = page.locator('#release-dialog')

    // What a consumer who does not write the invoker attributes gets, and what every browser
    // without Invoker Commands gets: the component's own click path, unchanged.
    await trigger.evaluate((element) => {
      element.removeAttribute('command')
      element.removeAttribute('commandfor')
    })

    await trigger.click()
    await expect(dialog).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await dialog.getByRole('button', { name: 'Confirm' }).click()
    await expect(dialog).toBeHidden()
    await expect(dialog).toHaveJSProperty('returnValue', 'confirm')
    await expect(trigger).toBeFocused()
  })

  test('refuses an authored command from an aria-disabled trigger', async ({ page }) => {
    await page.goto('/stories/library-overlays-dialog--default/')
    await expectRouteDocumentReady(page)

    const trigger = page.getByRole('button', { name: 'Review release' })
    const dialog = page.locator('#release-dialog')

    // The platform stops at `disabled` on its own but not at `aria-disabled`, which the click path
    // has always treated as inert.
    await trigger.evaluate((element) => element.setAttribute('aria-disabled', 'true'))
    // `force` because Playwright refuses to act on an aria-disabled control, while the browser
    // itself does not — which is exactly the gap being closed here.
    await trigger.click({ force: true })

    await expect(dialog).toBeHidden()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('emits unchanged sheet events when the panel is opened by command', async ({ page }) => {
    await page.goto('/stories/library-overlays-sheet--default/')
    await expectRouteDocumentReady(page)

    const host = page.locator('ui-sheet').first()
    const trigger = page.getByRole('button', { name: 'Open release sheet' })
    const sheet = page.locator('#release-sheet')

    await host.evaluate((element) => {
      const record = (event: Event) => {
        const detail = (event as CustomEvent<{ source: string }>).detail
        ;((globalThis as Record<string, unknown>).sheetEvents as string[]).push(
          `${event.type}:${detail.source}`,
        )
      }
      ;(globalThis as Record<string, unknown>).sheetEvents = []
      for (const type of ['ui-open', 'ui-dismiss', 'ui-close']) {
        element.addEventListener(type, record)
      }
    })

    await trigger.click()
    await expect(sheet).toBeVisible()
    await sheet.getByRole('button', { name: 'Done' }).click()
    await expect(sheet).toBeHidden()

    await expect
      .poll(() => page.evaluate(() => (globalThis as Record<string, unknown>).sheetEvents))
      .toEqual(['ui-open:trigger', 'ui-dismiss:close', 'ui-close:close'])
    await expect(sheet).toHaveJSProperty('returnValue', 'done')
  })

  test('opens and closes modal sheet with focus return', async ({ page }) => {
    await page.goto('/stories/library-overlays-sheet--default/')
    await expectRouteDocumentReady(page)

    const host = page.locator('ui-sheet').first()
    const trigger = page.getByRole('button', { name: 'Open release sheet' })
    const sheet = page.locator('#release-sheet')

    await expect(sheet).toBeHidden()
    await trigger.click()

    await expect(sheet).toBeVisible()
    await expect(host).toHaveAttribute('open', '')
    await expect(sheet).toHaveAttribute('role', 'dialog')
    await expect(sheet).toHaveAttribute('aria-modal', 'true')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expectRightAlignedInViewport(page, sheet)
    await expectReadableSurface(sheet)

    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await expect(host).not.toHaveAttribute('open', /.*/)
    await expect(trigger).toBeFocused()
  })

  test('keeps the page interactive while non-modal sheet is open', async ({ page }) => {
    await page.goto('/stories/library-overlays-sheet--non-modal/')
    await expectRouteDocumentReady(page)

    const trigger = page.getByRole('button', { name: 'Open inspector' })
    const sheet = page.locator('#inspector-sheet')
    const backgroundControl = page.getByRole('button', { name: 'Still interactive' })

    await trigger.click()

    await expect(sheet).toBeVisible()
    await expect(sheet).not.toHaveAttribute('aria-modal', /.*/)

    await backgroundControl.click()
    await expect(backgroundControl).toBeFocused()

    await sheet.getByRole('button', { name: 'Close sheet' }).click()
    await expect(sheet).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('switches tabs and hides inactive panels', async ({ page }) => {
    await page.goto('/stories/library-overlays-tabs--default/')
    await expectRouteDocumentReady(page)

    const overview = page.getByRole('tab', { name: 'Overview' })
    const usage = page.getByRole('tab', { name: 'Usage' })
    const overviewPanel = page.getByRole('tabpanel').filter({
      hasText: 'Review the current release status',
    })
    const usagePanel = page.getByRole('tabpanel').filter({
      hasText: 'Track adoption signals',
    })

    await expect(overview).toHaveAttribute('aria-selected', 'true')
    await expect(usage).toHaveAttribute('aria-selected', 'false')
    await expect(overviewPanel).toBeVisible()
    await expect(usagePanel).toBeHidden()

    await usage.click()

    await expect(overview).toHaveAttribute('aria-selected', 'false')
    await expect(usage).toHaveAttribute('aria-selected', 'true')
    await expect(overviewPanel).toBeHidden()
    await expect(usagePanel).toBeVisible()
  })

  /**
   * Milestone 021 merged Disclosure into Collapsible. `.ui-disclosure` set its trigger custom
   * properties on the root and then re-declared them on `> summary`, where the summary's own
   * declaration shadowed the inherited value, so `data-ui-density="compact"` changed nothing. The
   * merged stylesheet declares on the root, so the compact trigger is measurably shorter.
   */
  test('renders a shorter collapsible trigger at compact density', async ({ page }) => {
    await page.goto('/stories/library-overlays-collapsible--default/')
    await expectRouteDocumentReady(page)

    const summary = page.locator('.ui-collapsible > summary').first()
    const normalHeight = (await rectOf(summary)).height

    await page
      .locator('.ui-collapsible')
      .first()
      .evaluate((element) => {
        for (const details of element.parentElement?.querySelectorAll('.ui-collapsible') ?? []) {
          details.setAttribute('data-ui-density', 'compact')
        }
      })

    const compactHeight = (await rectOf(summary)).height
    expect(compactHeight).toBeLessThan(normalHeight)
    await expect(summary).toHaveCSS('cursor', 'default')
  })

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false })

    /**
     * The whole point of `<details name>`: exclusivity is the browser's, not a script's. This runs
     * with scripting off so nothing can be crediting a custom element for it.
     */
    test('closes the open panel when a shared-name sibling opens, with no script', async ({
      page,
    }) => {
      await page.goto('/stories/library-overlays-collapsible--exclusive-and-independent/')
      await expectRouteDocumentReady(page)

      const exclusive = page.locator('[aria-label="Exclusive accordion"] .ui-collapsible')
      await expect(exclusive).toHaveCount(3)
      await expect(exclusive.nth(0)).toHaveAttribute('open', '')
      await expect(exclusive.nth(1)).not.toHaveAttribute('open', '')

      await exclusive.nth(1).locator('summary').click()
      await expect(exclusive.nth(1)).toHaveAttribute('open', '')
      await expect(exclusive.nth(0)).not.toHaveAttribute('open', '')

      const independent = page.locator('[aria-label="Independent stack"] .ui-collapsible')
      await independent.nth(1).locator('summary').click()
      await expect(independent.nth(0)).toHaveAttribute('open', '')
      await expect(independent.nth(1)).toHaveAttribute('open', '')
      await expectNoPageOverflow(page)
    })

    test('keeps popover content hidden before custom element enhancement', async ({ page }) => {
      await page.goto('/stories/library-overlays-popover--default/')
      await expectRouteDocumentReady(page)

      await expect(page.locator('#release-popover')).toBeHidden()
      await expectNoPageOverflow(page)
    })

    test('keeps placement popovers hidden before custom element enhancement', async ({ page }) => {
      await page.goto('/stories/library-overlays-popover--placements/')
      await expectRouteDocumentReady(page)

      const popovers = page.locator('ui-popover > [popover]')

      await expect(popovers).toHaveCount(4)
      for (const index of [0, 1, 2, 3]) {
        await expect(popovers.nth(index)).toBeHidden()
      }
      await expectNoPageOverflow(page)
    })

    test('keeps hover card content hidden before custom element enhancement', async ({ page }) => {
      await page.goto('/stories/library-overlays-hover-card--default/')
      await expectRouteDocumentReady(page)

      await expect(page.locator('#component-hover-card')).toBeHidden()
      await expectNoPageOverflow(page)
    })

    test('keeps tooltip content hidden before custom element enhancement', async ({ page }) => {
      await page.goto('/stories/library-overlays-tooltip--default/')
      await expectRouteDocumentReady(page)

      await expect(page.locator('#copy-tooltip')).toBeHidden()
      await expectNoPageOverflow(page)
    })

    test('keeps inactive tabs hidden before custom element enhancement', async ({ page }) => {
      await page.goto('/stories/library-overlays-tabs--default/')
      await expectRouteDocumentReady(page)

      const panels = page.locator('[role="tabpanel"]')

      await expect(panels).toHaveCount(3)
      await expect(panels.nth(0)).toBeVisible()
      await expect(panels.nth(1)).toBeHidden()
      await expect(panels.nth(2)).toBeHidden()
      await expectNoPageOverflow(page)
    })

    test('keeps closed sheet panel hidden before custom element enhancement', async ({ page }) => {
      await page.goto('/stories/library-overlays-sheet--default/')
      await expectRouteDocumentReady(page)

      await expect(page.locator('#release-sheet')).toBeHidden()
      await expectNoPageOverflow(page)
    })
  })

  test('creates fixed viewport toasts without anchoring to the trigger panel', async ({ page }) => {
    await page.goto('/#/canvas/library-feedback-toast--toast-api')
    await expectRouteDocumentReady(page)

    const trigger = page.locator('[data-demo-toast]')
    const panel = page.locator('.ui-overlay-demo-panel')
    const toaster = page.locator('ui-toaster')

    await expect(toaster).toHaveAttribute('placement', 'bottom-end')
    await expect(toaster).toHaveAttribute('stack', 'overlap')
    await expect(
      toaster.locator('xpath=ancestor::*[contains(@class, "ui-overlay-demo-panel")]'),
    ).toHaveCount(0)
    await expectFixedBottomEndToaster(toaster)

    await trigger.click()
    await trigger.click()
    await trigger.click()

    const toasts = page.locator('ui-toast')
    await expect(toasts).toHaveCount(3)
    await expectFixedBottomEndToaster(toaster)
    await expectOverlappingStack(toasts)
    await expectToasterAwayFromTriggerPanel(panel, toaster)

    await toasts.nth(2).getByRole('button', { name: 'Dismiss notification' }).click()
    await expect(toasts.nth(2)).toBeHidden()
  })
})

async function expectFloatingBelow(trigger: Locator, content: Locator): Promise<void> {
  const triggerRect = await rectOf(trigger)
  const contentRect = await rectOf(content)

  expect(contentRect.top).toBeGreaterThanOrEqual(triggerRect.bottom)
  expect(center(contentRect)).toBeGreaterThanOrEqual(center(triggerRect) - 8)
  expect(center(contentRect)).toBeLessThanOrEqual(center(triggerRect) + 8)
}

async function expectCenteredInViewport(page: Page, locator: Locator): Promise<void> {
  const rect = await rectOf(locator)
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('Expected viewport size')

  expect(center(rect)).toBeGreaterThanOrEqual(viewport.width / 2 - 96)
  expect(center(rect)).toBeLessThanOrEqual(viewport.width / 2 + 96)
  expect(rect.top + rect.height / 2).toBeGreaterThanOrEqual(viewport.height / 2 - 96)
  expect(rect.top + rect.height / 2).toBeLessThanOrEqual(viewport.height / 2 + 96)
}

async function expectRightAlignedInViewport(page: Page, locator: Locator): Promise<void> {
  const rect = await rectOf(locator)
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('Expected viewport size')

  expect(rect.right).toBeGreaterThanOrEqual(viewport.width - 2)
  expect(rect.left).toBeGreaterThanOrEqual(viewport.width - rect.width - 2)
}

async function expectFixedBottomEndToaster(toaster: Locator): Promise<void> {
  const state = await toaster.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const styles = window.getComputedStyle(element)
    return {
      bottom: rect.bottom,
      position: styles.position,
      right: rect.right,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
    }
  })

  expect(state.position).toBe('fixed')
  expect(state.right).toBeGreaterThanOrEqual(state.viewportWidth - 24)
  expect(state.bottom).toBeGreaterThanOrEqual(state.viewportHeight - 24)
}

async function expectOverlappingStack(toasts: Locator): Promise<void> {
  const first = await rectOf(toasts.nth(0))
  const second = await rectOf(toasts.nth(1))
  const third = await rectOf(toasts.nth(2))

  expect(second.top).toBeLessThan(first.bottom)
  expect(third.top).toBeLessThan(second.bottom)
  expect(third.top).toBeGreaterThan(second.top)
}

async function expectToasterAwayFromTriggerPanel(panel: Locator, toaster: Locator): Promise<void> {
  const panelRect = await rectOf(panel)
  const toasterRect = await rectOf(toaster)

  expect(toasterRect.top).toBeGreaterThan(panelRect.bottom)
}

async function expectReadableSurface(locator: Locator, minimumContrast = 3): Promise<void> {
  const styles = await locator.evaluate((element) => {
    const container = window.getComputedStyle(element)
    const text = window.getComputedStyle(element.querySelector('p') ?? element)
    return {
      background: container.backgroundColor,
      boxShadow: container.boxShadow,
      color: text.color,
    }
  })

  expect(contrastRatio(styles.color, styles.background)).toBeGreaterThanOrEqual(minimumContrast)
  expect(styles.boxShadow).not.toBe('none')
}

async function maxInlineSizeOf(locator: Locator): Promise<number> {
  return locator.evaluate((element) =>
    Number.parseFloat(window.getComputedStyle(element).maxInlineSize),
  )
}

async function rectOf(locator: Locator): Promise<Rect> {
  return locator.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      bottom: rect.bottom,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      width: rect.width,
    }
  })
}

function center(rect: Rect): number {
  return rect.left + rect.width / 2
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminosity = relativeLuminosity(rgbChannels(foreground))
  const backgroundLuminosity = relativeLuminosity(rgbChannels(background))
  const lighter = Math.max(foregroundLuminosity, backgroundLuminosity)
  const darker = Math.min(foregroundLuminosity, backgroundLuminosity)

  return (lighter + 0.05) / (darker + 0.05)
}

function relativeLuminosity(channels: readonly [number, number, number]): number {
  const [red, green, blue] = channels.map((channel) => {
    const normalized = channel / 255
    return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!
}

function rgbChannels(value: string): [number, number, number] {
  const match = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(value)
  if (!match) {
    throw new Error(`Expected rgb() color, received ${value}`)
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])]
}
