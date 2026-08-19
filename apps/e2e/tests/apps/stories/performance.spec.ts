import { readFileSync } from 'node:fs'
import { expect, test } from '../../shared/fixtures'
import { settleAnimations } from '../../shared/animations'
import { expectRouteDocumentReady } from '../../shared/test-utils'

type Metrics = {
  readonly elements: number
  readonly layoutReads: number
  readonly layoutShift: number
  readonly mutationRecords: number
  readonly renderedOptions: number
}

const baseline = JSON.parse(
  readFileSync(new URL('./performance-baselines.json', import.meta.url), 'utf8'),
) as { readonly largeDataset: Metrics }

test('large dataset fixture stays inside checked-in DOM and interaction budgets', async ({
  page,
}) => {
  await page.goto('/stories/recipes-performance-large-dataset--default/')
  await expectRouteDocumentReady(page)
  await page.evaluate(() => {
    const state = { layoutReads: 0, layoutShift: 0, mutationRecords: 0 }
    Object.assign(window, { __timelessMetrics: state })
    const originalRect = Element.prototype.getBoundingClientRect
    Element.prototype.getBoundingClientRect = function (...args) {
      state.layoutReads += 1
      return originalRect.apply(this, args)
    }
    new MutationObserver((records) => {
      state.mutationRecords += records.length
    }).observe(document.querySelector('#ss-canvas')!, {
      attributes: true,
      childList: true,
      subtree: true,
    })
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
        if (!shift.hadRecentInput) state.layoutShift += shift.value ?? 0
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })

  const input = page.getByRole('combobox', { name: 'Search records' })
  const options = page.locator('#large-dataset-options > [role="option"]')
  await input.focus()
  await expect(options).toHaveCount(48)
  await input.fill('Archive record 01')
  await expect(options).toHaveCount(48)
  // The surface is the width of its input and as tall as the space below it, so it covers the demo
  // controls while open. Dismiss it first, the way a user reaching for them would.
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(page.locator('[data-dataset-page]')).toContainText('Page 2')
  await settleAnimations(page)

  const metrics = await page.evaluate(() => {
    const state = (
      window as typeof window & {
        __timelessMetrics: Pick<Metrics, 'layoutReads' | 'layoutShift' | 'mutationRecords'>
      }
    ).__timelessMetrics
    const options = document.querySelectorAll('#large-dataset-options > [role="option"]')
    return {
      ...state,
      elements: document.querySelectorAll('#ss-canvas *').length,
      renderedOptions: options.length,
    }
  })
  await test.info().attach('performance-metrics.json', {
    body: Buffer.from(JSON.stringify(metrics, null, 2)),
    contentType: 'application/json',
  })

  expect(metrics.renderedOptions).toBe(baseline.largeDataset.renderedOptions)
  expect(metrics.elements, JSON.stringify(metrics)).toBeLessThanOrEqual(
    withAllowance(baseline.largeDataset.elements),
  )
  expect(metrics.mutationRecords).toBeLessThanOrEqual(
    withAllowance(baseline.largeDataset.mutationRecords),
  )
  expect(metrics.layoutReads).toBeLessThanOrEqual(withAllowance(baseline.largeDataset.layoutReads))
  expect(metrics.layoutShift).toBeLessThanOrEqual(baseline.largeDataset.layoutShift)
  await expect(page.locator('#large-dataset-options > :not([role="option"])')).toHaveCount(0)
  await expect(page.locator('#large-dataset-options img:not([width][height])')).toHaveCount(0)
})

test('large dataset fixture loads lazily and selects enabled domain records', async ({ page }) => {
  await page.goto('/stories/recipes-performance-large-dataset--default/')
  await expectRouteDocumentReady(page)
  const input = page.getByRole('combobox', { name: 'Search records' })
  await expect(page.locator('#large-dataset-options > [role="option"]')).toHaveCount(0)
  await input.fill('Archive record 01')
  await expect(page.locator('#large-dataset-options > [role="option"]')).toHaveCount(48)
  await expect(page.locator('#large-dataset-options > [aria-disabled="true"]')).toHaveCount(1)
  await page.getByRole('option', { name: /Archive record 0100/ }).click()
  await expect(page.locator('[data-dataset-status]')).toHaveText('Selected Archive record 0100.')
})

function withAllowance(value: number): number {
  return Math.ceil(value * 1.1)
}
