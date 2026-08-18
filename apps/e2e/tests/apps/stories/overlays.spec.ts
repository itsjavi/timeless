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
    await expectCenteredInViewport(page, dialog)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
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

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false })

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
