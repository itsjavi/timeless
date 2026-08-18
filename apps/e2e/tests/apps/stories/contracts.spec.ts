import { expect, test } from '../../shared/fixtures'
import { expectRouteDocumentReady } from '../../shared/test-utils'

test('selection events are cancelable before commit and direct properties stay silent', async ({
  page,
}) => {
  await page.goto('/stories/library-navigation-listbox--default/')
  await expectRouteDocumentReady(page)
  const host = page.locator('ui-listbox')
  const initial = page.getByRole('option', { name: 'In progress' })
  const proposed = page.getByRole('option', { name: 'Ready for review' })

  await host.evaluate((element) => {
    Object.assign(window, { __timelessEvents: [] })
    element.addEventListener(
      'ui-before-change',
      (event) => {
        const transition = event as CustomEvent<{
          originalEvent: Event | null
          previousValue: string
          reason: string
          source: string
          value: string
        }>
        ;(window as typeof window & { __timelessEvents: unknown[] }).__timelessEvents.push({
          cancelable: transition.cancelable,
          originalEvent: transition.detail.originalEvent?.type ?? null,
          previousValue: transition.detail.previousValue,
          reason: transition.detail.reason,
          source: transition.detail.source,
          type: transition.type,
          value: transition.detail.value,
        })
        transition.preventDefault()
      },
      { once: true },
    )
    element.addEventListener('ui-change', (event) => {
      ;(window as typeof window & { __timelessEvents: unknown[] }).__timelessEvents.push({
        type: event.type,
      })
    })
  })

  await proposed.click()
  await expect(initial).toHaveAttribute('aria-selected', 'true')
  await expect(proposed).toHaveAttribute('aria-selected', 'false')
  expect(await recordedEvents(page)).toEqual([
    {
      cancelable: true,
      originalEvent: 'click',
      previousValue: 'in-progress',
      reason: 'select',
      source: 'pointer',
      type: 'ui-before-change',
      value: 'ready-for-review',
    },
  ])

  await host.evaluate((element) => {
    ;(element as HTMLElement & { value: string }).value = 'shipped'
  })
  await expect(host).toHaveAttribute('value', 'in-progress')
  await expect(page.getByRole('option', { name: 'Shipped' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(await recordedEvents(page)).toHaveLength(1)
})

async function recordedEvents(page: import('@playwright/test').Page): Promise<unknown[]> {
  return page.evaluate(
    () => (window as typeof window & { __timelessEvents: unknown[] }).__timelessEvents,
  )
}
