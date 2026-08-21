import type { Locator, Page } from '@playwright/test'
import type { SheetProps } from '@timelessui/examples'
import { settleAnimations } from '../../shared/animations'
import { expect, test } from '../../shared/fixtures'
import { expectNoPageOverflow, expectRouteDocumentReady } from '../../shared/test-utils'

type SheetPosition = NonNullable<SheetProps['position']>

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

  /*
   * `activation="manual"` is the only reason the `Enter / Space` row exists on Tabs, and nothing
   * pressed either key until `check-keyboard-contracts.mjs` said so.
   */
  test('moves focus without selecting until Enter or Space under manual activation', async ({
    page,
  }) => {
    await page.goto('/stories/library-overlays-tabs--product-settings/')
    await expectRouteDocumentReady(page)

    // The story opens on Usage, vertical, with a disabled Billing tab after the set.
    const overview = page.getByRole('tab', { name: 'Overview' })
    const usage = page.getByRole('tab', { name: 'Usage' })

    await usage.focus()
    await expect(usage).toHaveAttribute('aria-selected', 'true')

    // Arrow moves focus and leaves selection where it was: that is what manual means.
    await page.keyboard.press('ArrowUp')
    await expect(overview).toBeFocused()
    await expect(overview).toHaveAttribute('aria-selected', 'false')
    await expect(usage).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press('Enter')
    await expect(overview).toHaveAttribute('aria-selected', 'true')
    await expect(usage).toHaveAttribute('aria-selected', 'false')

    await page.keyboard.press('ArrowDown')
    await expect(usage).toBeFocused()
    await expect(usage).toHaveAttribute('aria-selected', 'false')

    await page.keyboard.press(' ')
    await expect(usage).toHaveAttribute('aria-selected', 'true')
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

  /*
   * SC 2.2.1. The default limit is 5000 ms and the timer has to stop while someone is reading the
   * toast or reaching for its dismiss control — otherwise the control disappears mid-reach, which is
   * also how focus ended up on `<body>`.
   */
  test('suspends the dismiss timer while a toast is hovered or holds focus @slow', async ({
    page,
  }) => {
    await page.goto('/#/canvas/library-feedback-toast--toast-api')
    await expectRouteDocumentReady(page)

    const trigger = page.locator('[data-demo-toast]')
    await trigger.click()
    const toast = page.locator('ui-toast').first()
    const dismiss = toast.getByRole('button', { name: 'Dismiss notification' })
    await expect(toast).toBeVisible()

    await toast.hover()
    await page.waitForTimeout(6000)
    await expect(toast).toBeVisible()

    await dismiss.focus()
    await page.mouse.move(0, 0)
    await page.waitForTimeout(6000)
    await expect(toast).toBeVisible()
    await expect(dismiss).toBeFocused()
  })

  test('keeps focus somewhere deliberate when a focused toast is dismissed', async ({ page }) => {
    await page.goto('/#/canvas/library-feedback-toast--toast-api')
    await expectRouteDocumentReady(page)

    const trigger = page.locator('[data-demo-toast]')
    await trigger.click()
    await trigger.click()
    const toasts = page.locator('ui-toast')
    await expect(toasts).toHaveCount(2)

    // Dismissing a toast that holds focus hands focus to a surviving toast, not to `<body>`.
    await toasts.nth(0).getByRole('button', { name: 'Dismiss notification' }).click()
    await expect(toasts.nth(0)).toBeHidden()
    await expect(toasts.nth(1).getByRole('button', { name: 'Dismiss notification' })).toBeFocused()

    // Dismissing the last one returns focus to whatever the user came from.
    await toasts.nth(1).getByRole('button', { name: 'Dismiss notification' }).click()
    await expect(toasts.nth(1)).toBeHidden()
    await expect(page.locator('body')).not.toBeFocused()
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

/**
 * Milestone 024: the two things a sheet gained, and one thing every overlay panel gained.
 *
 * The gesture is driven with the mouse on the `drag-handle` part, which is exactly the path the
 * component allows for a mouse — a mouse-down in the panel body stays a text selection. Playwright
 * cannot synthesise a touch drag, so the handle is also what makes the behavior testable at all.
 */
test.describe('stories sheet gestures and overlay naming', () => {
  const dragBy = async (
    page: Page,
    panelSelector: string,
    delta: { readonly x: number; readonly y: number },
  ) => {
    // The panel slides in on open. Grabbing a handle that is still moving lands the press where the
    // handle was rather than where it is, and the gesture never starts.
    await settleAnimations(page)
    const handle = page.locator(`${panelSelector} [data-ui-part~='drag-handle']`)
    const box = await handle.boundingBox()
    expect(box, `no drag handle for ${panelSelector}`).not.toBeNull()
    const startX = box!.x + box!.width / 2
    const startY = box!.y + box!.height / 2

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + delta.x / 2, startY + delta.y / 2, { steps: 4 })
    await page.mouse.move(startX + delta.x, startY + delta.y, { steps: 4 })
    const midDrag = await page.locator(panelSelector).evaluate((panel) => ({
      dragging: panel.closest('ui-sheet')?.matches(':state(--dragging)') ?? false,
      offset: (panel as HTMLElement).style.getPropertyValue('--ui-sheet-drag-offset'),
      translate: getComputedStyle(panel).translate,
    }))
    await page.mouse.up()
    return midDrag
  }

  /**
   * One gesture per position, and typed as a total record so a new `sheetPositions` value fails to
   * compile here rather than quietly going untested.
   */
  const swipes: Record<SheetPosition, { readonly x: number; readonly y: number }> = {
    top: { x: 0, y: -320 },
    right: { x: 320, y: 0 },
    bottom: { x: 0, y: 320 },
    left: { x: -320, y: 0 },
  }

  for (const [position, delta] of Object.entries(swipes)) {
    test(`dismisses a ${position} sheet with a swipe toward its own edge`, async ({ page }) => {
      await page.goto('/stories/library-overlays-sheet--positions/')
      await expectRouteDocumentReady(page)

      const panel = page.locator(`#sheet-${position}`)
      const trigger = page.locator(`ui-sheet:has(#sheet-${position}) [data-ui-part~='trigger']`)
      await trigger.click()
      await expect(panel).toBeVisible()

      const midDrag = await dragBy(page, `#sheet-${position}`, delta)
      // JavaScript writes one length; the stylesheet decides which axis it moves.
      expect(midDrag.dragging).toBe(true)
      expect(midDrag.offset).toBe(`${delta.x || delta.y}px`)
      expect(midDrag.translate).not.toBe('none')

      await expect(panel).toBeHidden()
      await expect(trigger).toBeFocused()
      await expect(panel).toHaveJSProperty('style.cssText', '')
    })
  }

  test('reports a swipe as its own dismissal source', async ({ page }) => {
    await page.goto('/stories/library-overlays-sheet--default/')
    await expectRouteDocumentReady(page)

    const host = page.locator('ui-sheet')
    await host.evaluate((element) => {
      element.addEventListener('ui-dismiss', (event) => {
        element.setAttribute('data-test-dismiss', (event as CustomEvent).detail.source)
      })
    })

    await page.getByRole('button', { name: 'Open release sheet' }).click()
    await expect(page.locator('#release-sheet')).toBeVisible()
    await dragBy(page, '#release-sheet', { x: 320, y: 0 })

    await expect(page.locator('#release-sheet')).toBeHidden()
    await expect(host).toHaveAttribute('data-test-dismiss', 'swipe')
  })

  test('springs a short swipe back instead of dismissing', async ({ page }) => {
    await page.goto('/stories/library-overlays-sheet--default/')
    await expectRouteDocumentReady(page)

    const panel = page.locator('#release-sheet')
    await page.getByRole('button', { name: 'Open release sheet' }).click()
    await expect(panel).toBeVisible()

    const midDrag = await dragBy(page, '#release-sheet', { x: 40, y: 0 })
    expect(midDrag.offset).toBe('40px')

    await expect(panel).toBeVisible()
    // The offset is cleared on release, and the stylesheet animates the panel home from there.
    await expect
      .poll(() =>
        panel.evaluate((element: HTMLElement) =>
          element.style.getPropertyValue('--ui-sheet-drag-offset'),
        ),
      )
      .toBe('')
    await expect
      .poll(() =>
        panel.evaluate((element) => element.closest('ui-sheet')?.matches(':state(--dragging)')),
      )
      .toBe(false)
  })

  test('absorbs a swipe away from the closing edge', async ({ page }) => {
    await page.goto('/stories/library-overlays-sheet--default/')
    await expectRouteDocumentReady(page)

    const panel = page.locator('#release-sheet')
    await page.getByRole('button', { name: 'Open release sheet' }).click()
    await expect(panel).toBeVisible()

    const midDrag = await dragBy(page, '#release-sheet', { x: -240, y: 0 })
    // A right-edge sheet dragged left would tear away from the edge it is anchored to.
    expect(midDrag.offset).toBe('0px')
    await expect(panel).toBeVisible()
  })

  /**
   * The gesture belongs to whatever can scroll. Without this a bottom sheet over a scrolling body is
   * unusable on touch, and it is also what keeps a drag inside the panel from closing it.
   */
  test('lets a scrollable region keep the gesture', async ({ page }) => {
    await page.goto('/stories/library-overlays-sheet--default/')
    await expectRouteDocumentReady(page)

    const panel = page.locator('#release-sheet')
    await page.getByRole('button', { name: 'Open release sheet' }).click()
    await expect(panel).toBeVisible()

    await settleAnimations(page)
    const body = panel.locator('section')
    const box = await body.boundingBox()
    const startX = (box?.x ?? 0) + (box?.width ?? 0) / 2
    const startY = (box?.y ?? 0) + (box?.height ?? 0) / 2
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 320, startY, { steps: 6 })
    const offset = await panel.evaluate((element: HTMLElement) =>
      element.style.getPropertyValue('--ui-sheet-drag-offset'),
    )
    await page.mouse.up()

    expect(offset).toBe('')
    await expect(panel).toBeVisible()
  })

  test('names a dialog and a sheet from their authored title and description parts', async ({
    page,
  }) => {
    await page.goto('/stories/library-overlays-dialog--default/')
    await expectRouteDocumentReady(page)
    await page.getByRole('button', { name: 'Review release' }).click()

    const dialog = page.locator('#release-dialog')
    await expect(dialog).toHaveAttribute(
      'aria-labelledby',
      await idOf(dialog.locator("[data-ui-part~='title']")),
    )
    await expect(dialog).toHaveAttribute(
      'aria-describedby',
      await idOf(dialog.locator("[data-ui-part~='description']")),
    )
    await expect(page.getByRole('dialog', { name: 'Release checklist' })).toBeVisible()
    await page.keyboard.press('Escape')

    await page.goto('/stories/library-overlays-sheet--default/')
    await expectRouteDocumentReady(page)
    await page.getByRole('button', { name: 'Open release sheet' }).click()

    const sheet = page.locator('#release-sheet')
    await expect(sheet).toHaveAttribute(
      'aria-labelledby',
      await idOf(sheet.locator("[data-ui-part~='title']")),
    )
    await expect(page.getByRole('dialog', { name: 'Release checklist' })).toBeVisible()
  })

  test('never overwrites an authored aria-labelledby', async ({ page }) => {
    await page.goto('/stories/library-overlays-sheet--default/')
    await expectRouteDocumentReady(page)

    // Rewriting the panel's name and then forcing re-enhancement: an author who pointed the panel
    // somewhere else meant it, so the parts must not win it back.
    await page.locator('#release-sheet').evaluate((panel) => {
      const heading = panel.ownerDocument.createElement('h2')
      heading.id = 'authored-name'
      heading.textContent = 'Authored name'
      panel.prepend(heading)
      panel.setAttribute('aria-labelledby', 'authored-name')
    })

    await page.getByRole('button', { name: 'Open release sheet' }).click()
    await expect(page.locator('#release-sheet')).toHaveAttribute('aria-labelledby', 'authored-name')
  })

  /**
   * The behavioral half of the tooltip pattern. A tooltip that toggles on click is a disclosure, and
   * a trigger that is also a button loses its own activation to it.
   *
   * Hoverability is the other half, and it goes the other way: WCAG 2.2 SC 1.4.13 requires
   * hover-triggered content to survive the pointer moving onto it, so the label stays put.
   */
  test('keeps a tooltip out of the click path but hoverable', async ({ page }) => {
    await page.goto('/stories/library-overlays-tooltip--default/')
    await expectRouteDocumentReady(page)

    const trigger = page.locator('#copy-tooltip-anchor')
    const tooltip = page.locator('#copy-tooltip')

    await expect(tooltip).toBeHidden()
    await trigger.hover()
    await expect(tooltip).toBeVisible()

    // The distinguishing assertion: a click leaves the label alone. Under the old shared behavior it
    // toggled, which meant a trigger that was also a button lost its own activation to the tooltip.
    await trigger.click()
    await expect(tooltip).toBeVisible()

    await tooltip.hover()
    await expect(tooltip).toBeVisible()

    // It closes when the pointer leaves both, which is the "persistent" half of the same criterion.
    await page.mouse.move(4, 4)
    await expect(tooltip).toBeHidden()
  })

  test('keeps a hover card click-toggleable and pointer-reachable', async ({ page }) => {
    await page.goto('/stories/library-overlays-hover-card--default/')
    await expectRouteDocumentReady(page)

    const trigger = page.locator("ui-hover-card [data-ui-part~='trigger']").first()
    const card = page.locator('ui-hover-card [popover]').first()

    await trigger.click()
    await expect(card).toBeVisible()
    await trigger.click()
    await expect(card).toBeHidden()
  })

  /**
   * The keyboard half of SC 1.4.13, and the half that was missing until milestone 025 composed a
   * navigation menu out of Hover Card and found it. Tabbing from the trigger into the surface fires
   * `focusout` on the trigger, which used to schedule the close with nothing to cancel it: the
   * surface shut and focus fell to the document, so its content was pointer-reachable and
   * keyboard-unreachable. Focus entering the surface now cancels the close, and focus leaving it
   * schedules one, mirroring the pointer exactly.
   */
  test('keeps a hover card open while focus is inside it', async ({ page }) => {
    await page.goto('/stories/library-overlays-hover-card--default/')
    await expectRouteDocumentReady(page)

    const trigger = page.locator("ui-hover-card [data-ui-part~='trigger']").first()
    const card = page.locator('ui-hover-card [popover]').first()

    await trigger.focus()
    await expect(card).toBeVisible()
    // Focus moved off the trigger and into the surface. The close delay is 100ms by default, so a
    // dwell longer than that is what makes this an assertion rather than a race.
    await card.evaluate((element) => {
      const focusable = element.querySelector<HTMLElement>('a[href], button, [tabindex="0"]')
      ;(focusable ?? element).setAttribute('tabindex', '0')
      ;(focusable ?? element).focus()
    })
    await page.waitForTimeout(400)
    await expect(card).toBeVisible()

    // And leaving it for good still closes it.
    await page.locator('h1').first().click()
    await expect(card).toBeHidden()
  })
})

async function idOf(locator: Locator): Promise<string> {
  const id = await locator.getAttribute('id')
  expect(id, 'the part should carry an id after enhancement').toBeTruthy()
  return id!
}

/**
 * Direct manipulation is not decorative motion: the panel has to follow the pointer under
 * `prefers-reduced-motion: reduce`. What that setting removes is the animation the *component*
 * plays on its own — the spring back on release, and the slide on open.
 */
test.describe('stories sheet motion preferences', () => {
  test('tracks the pointer with no transition when motion is reduced', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/stories/library-overlays-sheet--default/')
    await expectRouteDocumentReady(page)

    const panel = page.locator('#release-sheet')
    await page.getByRole('button', { name: 'Open release sheet' }).click()
    await expect(panel).toBeVisible()

    await settleAnimations(page)
    const handle = panel.locator("[data-ui-part~='drag-handle']")
    const box = await handle.boundingBox()
    const startX = (box?.x ?? 0) + (box?.width ?? 0) / 2
    const startY = (box?.y ?? 0) + (box?.height ?? 0) / 2
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 60, startY, { steps: 4 })

    const midDrag = await panel.evaluate((element) => ({
      offset: (element as HTMLElement).style.getPropertyValue('--ui-sheet-drag-offset'),
      transitionDuration: getComputedStyle(element).transitionDuration,
      animationName: getComputedStyle(element).animationName,
    }))
    await page.mouse.up()

    expect(midDrag.offset).toBe('60px')
    expect(midDrag.transitionDuration).toBe('0s')
    expect(midDrag.animationName).toBe('none')
    await expect(panel).toBeVisible()
  })
})
