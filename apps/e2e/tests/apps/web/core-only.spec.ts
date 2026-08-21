/**
 * The acceptance criteria of milestone 028, as a test.
 *
 * The milestone's claim is that `tokens.css` plus `core.css` and no theme CSS at all leaves every
 * component positioned, structurally intact, and operable — plain-looking and correct. That is not a
 * property any unit test can see and not one a human will re-check by hand, so it is asserted here
 * against the real preview pages.
 *
 * The stylesheets are read from disk in Node rather than fetched, because the `web-chromium` project
 * runs against a production build where the sources are not served as files.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'
import { examples } from '@timelessui/examples'
import { expect, test } from '../../shared/fixtures'
import { makeAxeBuilder } from '../../shared/a11y'
import { settleAnimations } from '../../shared/animations'

const cssRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../../packages/components/src/css',
)

/** `tokens.css` plus every core stylesheet: the two required tiers, and nothing else. */
const CORE_ONLY = [
  readFileSync(resolve(cssRoot, 'tokens.css'), 'utf8'),
  ...readdirSync(resolve(cssRoot, 'core'))
    .filter((name) => name.endsWith('.css'))
    .sort()
    .map((name) => readFileSync(resolve(cssRoot, 'core', name), 'utf8')),
].join('\n')

/** `tokens.css` alone: the "dropped core as well" case, which must degrade rather than break. */
const TOKENS_ONLY = readFileSync(resolve(cssRoot, 'tokens.css'), 'utf8')

async function loadPreview(page: Page, id: string, css: string): Promise<void> {
  await page.goto(`/docs/_preview/${id}/`)
  const definitions = examples.find((example) => example.id === id)?.definitions ?? []
  if (definitions.length > 0) {
    await page
      .waitForFunction(
        (tags) => tags.every((tag) => Boolean(customElements.get(tag))),
        [...definitions],
      )
      .catch(() => {})
  }
  // Registration is unaffected by stylesheets, so the swap happens after the elements are defined.
  await page.evaluate((sheet) => {
    for (const element of document.querySelectorAll('style, link[rel="stylesheet"]')) {
      element.remove()
    }
    const style = document.createElement('style')
    style.textContent = sheet
    document.head.append(style)
  }, css)
}

test('no custom-element host collapses to display: inline in any preview', async ({ page }) => {
  const collapsed: string[] = []

  for (const example of examples) {
    await loadPreview(page, example.id, CORE_ONLY)
    const inline = await page.evaluate(() =>
      [...document.querySelectorAll('*')]
        .filter((element) => element.tagName.toLowerCase().startsWith('ui-'))
        .filter((element) => getComputedStyle(element).display === 'inline')
        .map((element) => element.tagName.toLowerCase()),
    )
    for (const tag of inline) collapsed.push(`${example.id}: ${tag}`)
  }

  expect(collapsed, 'hosts left at the initial inline display').toEqual([])
})

test('anchored surfaces still position against their trigger', async ({ page }) => {
  // One per anchoring shape: centred on the anchor, edge-aligned to it, and a menu surface.
  for (const id of ['popover', 'hover-card', 'select', 'combobox', 'menu-button']) {
    await loadPreview(page, id, CORE_ONLY)
    const placement = await page.evaluate(async () => {
      const trigger = document.querySelector<HTMLElement>('[data-ui-part~="trigger"]')
      const input = document.querySelector<HTMLInputElement>('input[role="combobox"]')
      // A combobox surface opens on input, not on a click.
      if (trigger) trigger.click()
      else if (input) {
        input.focus()
        input.value = 'a'
        input.dispatchEvent(new InputEvent('input', { bubbles: true }))
      }
      await new Promise((resolve) => setTimeout(resolve, 350))
      const surface = document.querySelector<HTMLElement>('[popover]:popover-open')
      const opener = trigger ?? input
      if (!opener || !surface) return null
      const anchor = opener.getBoundingClientRect()
      const box = surface.getBoundingClientRect()
      return {
        // Anchored means adjacent to the trigger, not parked at a viewport default.
        overlapsHorizontally: box.right > anchor.left && box.left < anchor.right,
        near: Math.min(Math.abs(box.top - anchor.bottom), Math.abs(box.bottom - anchor.top)) < 40,
        usedJsFallback: surface.getAttribute('data-ui-internal-floating'),
      }
    })

    expect(placement, `${id} surface never opened`).not.toBeNull()
    expect(placement?.overlapsHorizontally, `${id} is not beside its trigger`).toBe(true)
    expect(placement?.near, `${id} is not adjacent to its trigger`).toBe(true)
  }
})

test('anchored surfaces still flip on collision and still light-dismiss', async ({ page }) => {
  await loadPreview(page, 'select', CORE_ONLY)

  const flipped = await page.evaluate(async () => {
    const trigger = document.querySelector<HTMLElement>('[data-ui-part~="trigger"]')
    if (!trigger) return null
    // Push the trigger to the bottom of the viewport so the surface cannot open below it.
    const host = trigger.closest('ui-select') as HTMLElement | null
    if (host) {
      host.style.position = 'fixed'
      host.style.insetBlockEnd = '4px'
      host.style.insetInlineStart = '40px'
    }
    trigger.click()
    await new Promise((resolve) => setTimeout(resolve, 400))
    const surface = document.querySelector<HTMLElement>('[popover]:popover-open')
    if (!surface) return null
    const anchorBox = trigger.getBoundingClientRect()
    const box = surface.getBoundingClientRect()
    return { above: box.bottom <= anchorBox.top + 1, onScreen: box.top >= -1 }
  })

  expect(flipped, 'the select surface never opened').not.toBeNull()
  expect(flipped?.above, 'the surface did not flip above its trigger').toBe(true)
  expect(flipped?.onScreen, 'the surface flipped off screen').toBe(true)

  // Light dismiss is the Popover API's, but it has to survive the theme being gone.
  await page.mouse.click(5, 5)
  await expect(page.locator('[popover]:popover-open')).toHaveCount(0)
})

test('scroll containers still scroll and still contain their overscroll', async ({ page }) => {
  for (const id of ['listbox', 'select', 'menu-button']) {
    await loadPreview(page, id, CORE_ONLY)
    const scrollers = await page.evaluate(async () => {
      document.querySelector<HTMLElement>('[data-ui-part~="trigger"]')?.click()
      await new Promise((resolve) => setTimeout(resolve, 300))
      return [...document.querySelectorAll('ui-listbox, [role="listbox"], ui-menu[popover]')]
        .map((element) => getComputedStyle(element))
        .filter((style) => style.overflow === 'auto')
        .map((style) => style.overscrollBehavior)
    })

    expect(scrollers.length, `${id} has no scroll container`).toBeGreaterThan(0)
    expect(
      scrollers.every((value) => value === 'contain'),
      `${id} overscroll leaks`,
    ).toBe(true)
  }
})

test('filtered options stay hidden in every collection', async ({ page }) => {
  for (const id of ['listbox', 'select', 'combobox']) {
    await loadPreview(page, id, CORE_ONLY)
    const hidden = await page.evaluate(async () => {
      const trigger = document.querySelector<HTMLElement>('[data-ui-part~="trigger"]')
      const input = document.querySelector<HTMLInputElement>('input[role="combobox"]')
      // A combobox surface opens on input, not on a click.
      if (trigger) trigger.click()
      else if (input) {
        input.focus()
        input.value = 'a'
        input.dispatchEvent(new InputEvent('input', { bubbles: true }))
      }
      await new Promise((resolve) => setTimeout(resolve, 300))
      const options = [...document.querySelectorAll<HTMLElement>('[role="option"]')]
      if (options.length < 2) return null
      options[1]!.hidden = true
      const display = getComputedStyle(options[1]!).display
      options[1]!.hidden = false
      return display
    })

    expect(hidden, `${id} exposed no options`).not.toBeNull()
    expect(hidden, `a filtered option is visible in ${id}`).toBe('none')
  }
})

test('dialog and sheet still reach the top layer, hold focus, and close on Escape', async ({
  page,
}) => {
  for (const id of ['dialog', 'sheet']) {
    await loadPreview(page, id, CORE_ONLY)
    const opened = await page.evaluate(async () => {
      document.querySelector<HTMLElement>('[data-ui-part~="trigger"]')?.click()
      await new Promise((resolve) => setTimeout(resolve, 400))
      const panel = document.querySelector('dialog[open]')
      return panel
        ? {
            inTopLayer: panel.matches(':modal'),
            focusInside: panel.contains(document.activeElement),
          }
        : null
    })

    expect(opened, `${id} never opened`).not.toBeNull()
    expect(opened?.inTopLayer, `${id} is not in the top layer`).toBe(true)
    expect(opened?.focusInside, `${id} did not take focus`).toBe(true)

    await page.keyboard.press('Escape')
    await settleAnimations(page)
    await expect(page.locator('dialog[open]')).toHaveCount(0)
  }
})

test('the toaster still places itself and stays clickable through', async ({ page }) => {
  await loadPreview(page, 'toast', CORE_ONLY)
  const stack = await page.evaluate(async () => {
    document.querySelector<HTMLElement>('[data-ui-part~="trigger"]')?.click()
    document.querySelector<HTMLElement>('[data-ui-part~="trigger"]')?.click()
    await new Promise((resolve) => setTimeout(resolve, 400))
    const toaster = document.querySelector('ui-toaster')
    if (!toaster) return null
    const style = getComputedStyle(toaster)
    const toasts = [...document.querySelectorAll('ui-toast')]
    return {
      position: style.position,
      // `pointer-events: none` on the region with `auto` back on each toast is what keeps a 24rem
      // column down the side of the viewport from swallowing every click on the page behind it.
      regionIgnoresPointer: style.pointerEvents === 'none',
      toastsTakePointer: toasts.every((toast) => getComputedStyle(toast).pointerEvents === 'auto'),
      pinnedToAnEdge: style.insetBlockEnd !== 'auto' || style.insetBlockStart !== 'auto',
      count: toasts.length,
    }
  })

  expect(stack, 'no toaster rendered').not.toBeNull()
  expect(stack?.position).toBe('fixed')
  expect(stack?.regionIgnoresPointer, 'the toast region blocks the page').toBe(true)
  expect(stack?.toastsTakePointer, 'a toast cannot be clicked').toBe(true)
  expect(stack?.pinnedToAnEdge, 'the toaster is not pinned to a viewport edge').toBe(true)
})

/**
 * The two CSS-only components milestone 025 added put the whole tier split in one place: core lays the
 * trail out and clips it, the theme draws the separator and the cell chrome. Core-only therefore has
 * to leave both laid out and legible with no separator and no borders, which is exactly the
 * "positioned, structurally intact, plain-looking" claim — and for a component with no JavaScript at
 * all, the stylesheets are the only thing that could deliver it.
 */
test('the CSS-only navigation components stay laid out with no theme', async ({ page }) => {
  await loadPreview(page, 'breadcrumb', CORE_ONLY)
  const trail = await page.evaluate(() => {
    const list = document.querySelector<HTMLElement>('.ui-breadcrumb ol')
    const crumb = document.querySelector<HTMLElement>("[data-ui-part~='link']")
    if (!list || !crumb) return null
    return {
      listDisplay: getComputedStyle(list).display,
      listOverflow: getComputedStyle(list).overflow,
      crumbEllipsis: getComputedStyle(crumb).textOverflow,
      // The theme draws the separator, so with no theme there is none. That is the point.
      separator: getComputedStyle(document.querySelector('li:nth-child(2)')!, '::before').content,
    }
  })
  expect(trail, 'the breadcrumb preview never rendered').not.toBeNull()
  expect(trail?.listDisplay).toBe('flex')
  expect(trail?.listOverflow).toBe('hidden')
  expect(trail?.crumbEllipsis).toBe('ellipsis')
  expect(trail?.separator).toBe('none')

  await loadPreview(page, 'pagination', CORE_ONLY)
  const pager = await page.evaluate(() => {
    const cells = [...document.querySelectorAll<HTMLElement>("[data-ui-part~='link']")]
    const list = document.querySelector<HTMLElement>('.ui-pagination ul')
    if (!list || cells.length === 0) return null
    return {
      listDisplay: getComputedStyle(list).display,
      cellDisplays: [...new Set(cells.map((cell) => getComputedStyle(cell).display))],
    }
  })
  expect(pager, 'the pagination preview never rendered').not.toBeNull()
  expect(pager?.listDisplay).toBe('flex')
  // `inline-flex`, blockified: a flex item's `display` computes to its block equivalent, so a cell
  // inside the `<li>` flex container reports `flex`. Either way it is a centring box, which is what
  // core owes a digit sitting in a square.
  expect(pager?.cellDisplays).toEqual(['flex'])
})

test('dropping core as well degrades without erroring or hanging', async ({ page }) => {
  const failures: string[] = []
  page.on('pageerror', (error) => failures.push(String(error)))
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(message.text())
  })

  for (const id of ['select', 'menu-button', 'dialog']) {
    await loadPreview(page, id, TOKENS_ONLY)
    // Operability has to survive the loss of core; only placement is allowed to.
    const operable = await page.evaluate(async () => {
      const trigger = document.querySelector<HTMLElement>('[data-ui-part~="trigger"]')
      const input = document.querySelector<HTMLInputElement>('input[role="combobox"]')
      // A combobox surface opens on input, not on a click.
      if (trigger) trigger.click()
      else if (input) {
        input.focus()
        input.value = 'a'
        input.dispatchEvent(new InputEvent('input', { bubbles: true }))
      }
      await new Promise((resolve) => setTimeout(resolve, 350))
      return {
        opened: Boolean(
          document.querySelector('[popover]:popover-open') ??
          document.querySelector('dialog[open]'),
        ),
        expanded: trigger?.getAttribute('aria-expanded'),
      }
    })

    expect(operable.opened, `${id} could not be opened without core`).toBe(true)
  }

  expect(failures, 'console errors with no core stylesheet').toEqual([])
})

/**
 * Target size is the one thing dropping the theme does cost, and it is a consequence of the boundary
 * rather than a bug.
 *
 * `check-core-boundary.mjs` rule 2 keeps every size in the theme, so a theme-free control is as large
 * as its content and no larger — and for these seven that lands under the 24×24 CSS pixels SC 2.5.8
 * asks for. Putting a floor in core would fix the number and impose a layout decision on exactly the
 * consumer core exists to serve: a dense tool that deliberately uses small targets and satisfies
 * 2.5.8 through the spacing exemption instead. So the set is recorded rather than emptied, and this
 * assertion is about the *eighth* component — a new one falling below the floor is a regression, and
 * one of these climbing above it should delete a line here.
 */
const UNDERSIZED_WITHOUT_THEME: Readonly<Record<string, readonly string[]>> = {
  'account-form': ['target-size'],
  'color-picker': ['target-size'],
  'command-palette': ['target-size'],
  'navigation-menu': ['target-size'],
  'number-stepper': ['target-size'],
  pagination: ['target-size'],
  'popover-color-picker': ['target-size'],
}
const UNDERSIZED_WITHOUT_THEME_REASON =
  'core-only introduced an accessibility violation outside the recorded target-size set. A new entry means a component became unusable without the theme; a missing one means a component improved and this list should shrink.'

/**
 * The claim is that dropping the theme costs nothing in accessibility, so the assertion is relative:
 * core-only must introduce no violation the themed rendering does not already have. An absolute
 * assertion would fail on pre-existing issues and say nothing about this milestone — and it did: the
 * Select trigger carries `aria-activedescendant`, which no button role permits, with or without the
 * theme. That is filed separately rather than masked here.
 */
test('core-only introduces no accessibility violation the theme does not have @slow', async ({
  page,
}) => {
  test.slow()

  const violationsFor = async (id: string, css: string | null) => {
    await page.goto(`/docs/_preview/${id}/`)
    if (css !== null) {
      await page.evaluate((sheet) => {
        for (const element of document.querySelectorAll('style, link[rel="stylesheet"]')) {
          element.remove()
        }
        const style = document.createElement('style')
        style.textContent = sheet
        document.head.append(style)
      }, css)
    }
    await page.evaluate(async () => {
      document.querySelector<HTMLElement>('[data-ui-part~="trigger"]')?.click()
      await new Promise((resolve) => setTimeout(resolve, 300))
    })
    const results = await makeAxeBuilder(page).analyze()
    return new Set(results.violations.map((violation) => violation.id))
  }

  /*
   * Every documented example, not a hand-picked four.
   *
   * It was `['select', 'listbox', 'menu-button', 'dialog']`, and the two components where dropping
   * the theme actually introduces a violation were not among them: Colour Picker and Number Stepper
   * both fall under 24px without the theme's sizing, which axe reports as `target-size`. A list of
   * four chosen while writing the milestone cannot know where the next one will be.
   */
  const introducedBy = new Map<string, string[]>()
  for (const example of examples) {
    const themed = await violationsFor(example.id, null)
    const core = await violationsFor(example.id, CORE_ONLY)
    const introduced = [...core].filter((violation) => !themed.has(violation))
    if (introduced.length > 0) introducedBy.set(example.id, introduced)
  }

  expect(Object.fromEntries(introducedBy), UNDERSIZED_WITHOUT_THEME_REASON).toEqual(
    UNDERSIZED_WITHOUT_THEME,
  )
})
