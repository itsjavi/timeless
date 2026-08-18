import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export function expectPathname(page: Page) {
  return expect.poll(() => new URL(page.url()).pathname)
}

export function expectHash(page: Page) {
  return expect.poll(() => new URL(page.url()).hash)
}

export function expectSearchParam(page: Page, name: string) {
  return expect.poll(() => new URL(page.url()).searchParams.get(name))
}

export async function expectNoPageOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    offenders: Array.from(document.querySelectorAll<HTMLElement>('body *'))
      .map((element) => ({
        selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.className && typeof element.className === 'string' ? `.${element.className.trim().replace(/\s+/g, '.')}` : ''}`,
        right: Math.round(element.getBoundingClientRect().right),
        scrollWidth: element.scrollWidth,
      }))
      .filter((element) => element.right > document.documentElement.clientWidth + 1)
      .sort((left, right) => right.right - left.right)
      .slice(0, 5),
  }))

  expect(
    dimensions.scrollWidth,
    `Horizontal overflow from ${JSON.stringify(dimensions.offenders)}`,
  ).toBeLessThanOrEqual(dimensions.clientWidth + 1)
}

export async function expectRouteDocumentReady(page: Page): Promise<void> {
  await expect(page.locator('main').first()).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/Application Error|Internal Server Error/i)
}

export async function expectVisibleFocusChange(page: Page, selector: string): Promise<void> {
  const locator = page.locator(selector)
  await locator.waitFor({ state: 'visible' })
  await page.locator('body').click()

  const unfocused = await locator.evaluate(readFocusStyles)
  await locator.focus()
  await expect(locator).toBeFocused()
  const focused = await locator.evaluate(readFocusStyles)

  expect(focused).not.toEqual(unfocused)
}

function readFocusStyles(element: Element) {
  const styles = window.getComputedStyle(element)
  return {
    boxShadow: styles.boxShadow,
    outlineColor: styles.outlineColor,
    outlineStyle: styles.outlineStyle,
    outlineWidth: styles.outlineWidth,
  }
}
