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

/**
 * The whole point of `ui-copy`: a copy that fails is distinguishable from one that never ran. The
 * clipboard itself is only reachable with granted permissions, which Playwright supports in Chromium
 * only — and this file runs under `stories-chromium` alone, so that is not a restriction here.
 */
test.describe('copy button', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

  test('copies from the page, announces once, and keeps the trigger named', async ({ page }) => {
    await page.goto('/stories/library-actions-copy-button--default/')
    await expectRouteDocumentReady(page)

    const host = page.locator('ui-copy-button')
    const trigger = host.getByRole('button', { name: 'Copy the install command' })
    const status = host.locator("[data-ui-part~='status']")
    await recordCopyEvents(host)

    await trigger.click()

    // Read back from the real clipboard: the value came off the page, not out of an attribute.
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('pnpm add @timelessui/components')
    await expect
      .poll(() => copyEvents(page))
      .toEqual([{ reason: null, status: 'copied', value: 'pnpm add @timelessui/components' }])

    // The confirmation reaches the authored region, and the button is not renamed to deliver it.
    await expect(status).toHaveText('Install command copied')
    await expect(trigger).toHaveAccessibleName('Copy the install command')
    expect(await host.evaluate((element) => element.matches(':state(--copied)'))).toBe(true)
    await expect(host.locator("[data-ui-part~='copied']")).toBeVisible()
    await expect(host.locator("[data-ui-part~='idle']")).toBeHidden()

    // Both clear together, so copying the same value twice is announced twice.
    await expect(status).toHaveText('', { timeout: 4_000 })
    await expect(host.locator("[data-ui-part~='idle']")).toBeVisible()
  })

  /**
   * Two things at once, because they share a cause: `status` is a token Avatar, Listbox, Select, and
   * Combobox also declare, so an unscoped lookup finds a nested root's part first and writes the
   * confirmation into a decorative dot. And the platform has no element that *is* a live region, so an
   * author who writes the part and forgets `role` gets silence with nothing saying why.
   */
  test('writes the confirmation into its own region, and completes it', async ({ page }) => {
    await page.goto('/stories/library-actions-copy-button--default/')
    await expectRouteDocumentReady(page)

    const wired = await page.evaluate(async () => {
      const host = document.createElement('ui-copy-button')
      host.setAttribute('value', 'nested-source')
      host.setAttribute('copied-message', 'Value copied')
      // The avatar declares `status` too, and its dot comes first in document order.
      host.innerHTML = `
        <button data-ui-part="trigger" type="button" aria-label="Copy the value">
          <span class="ui-avatar"><span data-ui-part="status"></span></span>
          <span data-ui-part="idle" aria-hidden="true">Copy</span>
          <span data-ui-part="copied" aria-hidden="true">Copied</span>
        </button>
        <span data-ui-part="status"></span>`
      document.body.append(host)
      await new Promise((resolve) => requestAnimationFrame(resolve))

      const dot = host.querySelector<HTMLElement>(".ui-avatar [data-ui-part~='status']")
      const region = host.querySelector<HTMLElement>(":scope > [data-ui-part~='status']")
      // The role and `aria-live` the author left off, on the region this component owns and no other.
      const wiring = {
        regionRole: region?.getAttribute('role') ?? null,
        regionLive: region?.getAttribute('aria-live') ?? null,
        dotRole: dot?.getAttribute('role') ?? null,
      }

      host.querySelector<HTMLElement>("[data-ui-part~='trigger']")?.click()
      await new Promise((resolve) => setTimeout(resolve, 200))
      return {
        ...wiring,
        regionText: region?.textContent ?? null,
        dotText: dot?.textContent ?? null,
      }
    })

    expect(wired).toEqual({
      dotRole: null,
      dotText: '',
      regionLive: 'polite',
      regionRole: 'status',
      regionText: 'Value copied',
    })
  })

  /**
   * The two halves of `ui-before-copy`. Cancelling suppresses the committed event, the way cancelling
   * `ui-before-change` does everywhere else in this library. Answering it with `respondWith` hands the
   * write over — which is the only way to copy something `writeText` cannot carry — and the element
   * still owns the confirmation, so `--copied` and the announcement follow the promise rather than a
   * guess.
   */
  test('a cancelled proposal writes nothing and commits nothing', async ({ page }) => {
    await page.goto('/stories/library-actions-copy-button--default/')
    await expectRouteDocumentReady(page)

    const host = page.locator('ui-copy-button')
    await page.evaluate(() => navigator.clipboard.writeText('untouched'))
    await host.evaluate((element) => {
      Object.assign(window, { __copyEvents: [], __proposals: [] })
      element.addEventListener('ui-before-copy', (event) => {
        ;(window as typeof window & { __proposals: unknown[] }).__proposals.push(
          (event as CustomEvent).detail.value,
        )
        event.preventDefault()
      })
      element.addEventListener('ui-copy', (event) => {
        ;(window as typeof window & { __copyEvents: unknown[] }).__copyEvents.push(
          (event as CustomEvent).detail,
        )
      })
    })

    await host.getByRole('button', { name: 'Copy the install command' }).click()

    expect(
      await page.evaluate(() => (window as typeof window & { __proposals: unknown[] }).__proposals),
    ).toEqual(['pnpm add @timelessui/components'])
    expect(await copyEvents(page)).toEqual([])
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('untouched')
    expect(await host.evaluate((element) => element.matches(':state(--copied)'))).toBe(false)
  })

  test('respondWith copies an image and still drives the confirmation', async ({ page }) => {
    await page.goto('/stories/library-actions-copy-button--default/')
    await expectRouteDocumentReady(page)

    const host = page.locator('ui-copy-button')
    const status = host.locator("[data-ui-part~='status']")
    await recordCopyEvents(host)
    await host.evaluate((element) => {
      element.addEventListener('ui-before-copy', (event) => {
        // A real 1x1 PNG, and handed to `ClipboardItem` as a promise so `write` starts synchronously.
        const png =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mO4o2ACAAMMATH9sBa8AAAAAElFTkSuQmCC'
        ;(event as CustomEvent).detail.respondWith(
          navigator.clipboard.write([
            new ClipboardItem({ 'image/png': fetch(png).then((response) => response.blob()) }),
          ]),
        )
      })
    })

    await host.getByRole('button', { name: 'Copy the install command' }).click()

    // The image really is on the clipboard, not the snippet text the element resolved.
    await expect
      .poll(() =>
        page.evaluate(async () => (await navigator.clipboard.read()).flatMap((item) => item.types)),
      )
      .toContain('image/png')
    await expect
      .poll(() => copyEvents(page))
      .toEqual([{ reason: null, status: 'copied', value: 'pnpm add @timelessui/components' }])
    // The element kept the confirmation, because it awaited the promise rather than assuming.
    expect(await host.evaluate((element) => element.matches(':state(--copied)'))).toBe(true)
    await expect(status).toHaveText('Install command copied')
  })

  /** The same interception as the story ships it, so the copyable example is the tested one. */
  test('the intercepted-copy story really writes an image', async ({ page }) => {
    await page.goto('/stories/library-actions-copy-button--intercepted-copy/')
    await expectRouteDocumentReady(page)
    await page.waitForFunction(() => Boolean(customElements.get('story-copy-blob')))

    const host = page.locator('ui-copy-button')
    await recordCopyEvents(host)
    await host.getByRole('button', { name: 'Copy the swatch as an image' }).click()

    await expect
      .poll(() =>
        page.evaluate(async () => (await navigator.clipboard.read()).flatMap((item) => item.types)),
      )
      .toContain('image/png')
    // The detail still carries what the element resolved; the listener replaced only the write.
    await expect
      .poll(() => copyEvents(page))
      .toEqual([{ reason: null, status: 'copied', value: 'oklch(62% 0.18 32)' }])
    await expect(host.locator("[data-ui-part~='status']")).toHaveText('Swatch image copied')
  })

  test('a failed respondWith reports rejected rather than denied', async ({ page }) => {
    await page.goto('/stories/library-actions-copy-button--default/')
    await expectRouteDocumentReady(page)

    const host = page.locator('ui-copy-button')
    await recordCopyEvents(host)
    await host.evaluate((element) => {
      element.addEventListener('ui-before-copy', (event) => {
        // An undecodable image, which is the first thing a real integration gets wrong.
        ;(event as CustomEvent).detail.respondWith(
          navigator.clipboard.write([
            new ClipboardItem({ 'image/png': new Blob(['not an image'], { type: 'image/png' }) }),
          ]),
        )
      })
    })

    await host.getByRole('button', { name: 'Copy the install command' }).click()

    await expect
      .poll(() => copyEvents(page))
      .toEqual([{ reason: 'rejected', status: 'failed', value: 'pnpm add @timelessui/components' }])
    expect(await host.evaluate((element) => element.matches(':state(--copied)'))).toBe(false)
  })

  test('reports an empty source rather than copying nothing quietly', async ({ page }) => {
    await page.goto('/stories/library-actions-copy-button--default/')
    await expectRouteDocumentReady(page)

    const host = page.locator('ui-copy-button')
    await recordCopyEvents(host)
    // `from` is read at activation, so emptying the snippet is enough.
    await page.locator('#install-command').evaluate((element) => {
      element.textContent = ''
    })

    await host.getByRole('button', { name: 'Copy the install command' }).click()

    expect(await copyEvents(page)).toEqual([{ reason: 'empty', status: 'failed', value: '' }])
    expect(await host.evaluate((element) => element.matches(':state(--copied)'))).toBe(false)
  })
})

/**
 * With no Clipboard API there is nothing to enhance, so the authored `hidden` stays put. This is the
 * case the reveal exists for and the one a secure origin can never produce on its own.
 */
test('a hidden trigger is revealed only when the Clipboard API is there', async ({ page }) => {
  await page.goto('/stories/library-actions-copy-button--hidden-until-supported/')
  await expectRouteDocumentReady(page)
  await expect(page.locator("ui-copy-button [data-ui-part~='trigger']")).toBeVisible()

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
  })
  await page.goto('/stories/library-actions-copy-button--hidden-until-supported/')
  await expectRouteDocumentReady(page)

  const trigger = page.locator("ui-copy-button [data-ui-part~='trigger']")
  await expect(page.locator('ui-copy-button')).toBeAttached()
  await expect(trigger).toBeHidden()
})

async function recordCopyEvents(host: import('@playwright/test').Locator): Promise<void> {
  await host.evaluate((element) => {
    Object.assign(window, { __copyEvents: [] })
    element.addEventListener('ui-copy', (event) => {
      ;(window as typeof window & { __copyEvents: unknown[] }).__copyEvents.push(
        (event as CustomEvent).detail,
      )
    })
  })
}

async function copyEvents(page: import('@playwright/test').Page): Promise<unknown[]> {
  return page.evaluate(() => (window as typeof window & { __copyEvents: unknown[] }).__copyEvents)
}

async function recordedEvents(page: import('@playwright/test').Page): Promise<unknown[]> {
  return page.evaluate(
    () => (window as typeof window & { __timelessEvents: unknown[] }).__timelessEvents,
  )
}
