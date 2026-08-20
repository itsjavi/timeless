import { readFileSync } from 'node:fs'
import { expect, test } from '../../shared/fixtures'
import { makeAxeBuilder, type AxeResults } from '../../shared/a11y'
import { expectNoPageOverflow, expectRouteDocumentReady } from '../../shared/test-utils'

type RecordedViolation = {
  readonly failureSummary: string | undefined
  readonly html: string
  readonly impact: string | null | undefined
  readonly route: string
  readonly rule: string
  readonly state: string
  readonly target: readonly string[]
}

const routeCatalogUrl = new URL('../../../../stories/story-routes.json', import.meta.url)
const routes = JSON.parse(readFileSync(routeCatalogUrl, 'utf8')) as string[]

test.describe('StoryLite WCAG 2.2 A and AA automation', () => {
  for (const route of routes) {
    test(`${route} passes axe in applicable states`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'stories-chromium')
      const violations: RecordedViolation[] = []

      await page.goto(route)
      await expectRouteDocumentReady(page)
      recordViolations(
        violations,
        route,
        'default',
        await makeAxeBuilder(page).include('#ss-canvas').analyze(),
      )

      if (route.endsWith('library-navigation-listbox--default/')) {
        await page.getByRole('option', { name: 'Ready for review' }).click()
        recordViolations(
          violations,
          route,
          'selected',
          await makeAxeBuilder(page).include('#ss-canvas').analyze(),
        )
      }
      if (route.endsWith('library-overlays-dialog--default/')) {
        await page.getByRole('button', { name: 'Review release' }).click()
        recordViolations(
          violations,
          route,
          'open',
          await makeAxeBuilder(page).include('#ss-canvas').analyze(),
        )
        await page.keyboard.press('Escape')
      }
      if (route.endsWith('library-navigation-combobox--default/')) {
        await page.getByRole('combobox').fill('result with no match')
        recordViolations(
          violations,
          route,
          'empty',
          await makeAxeBuilder(page).include('#ss-canvas').analyze(),
        )
      }
      if (route.endsWith('library-navigation-context-menu--default/')) {
        await page.locator("[data-ui-part~='target']").first().focus()
        await page.keyboard.press('Shift+F10')
        await expect(page.locator('#asset-context-menu')).toBeVisible()
        recordViolations(
          violations,
          route,
          'open',
          await makeAxeBuilder(page).include('#ss-canvas').analyze(),
        )
        await page.keyboard.press('Escape')
      }
      if (route.endsWith('library-overlays-sheet--default/')) {
        await page.getByRole('button', { name: 'Open release sheet' }).click()
        await expect(page.locator('#release-sheet')).toBeVisible()
        recordViolations(
          violations,
          route,
          'open',
          await makeAxeBuilder(page).include('#ss-canvas').analyze(),
        )
        await page.keyboard.press('Escape')
      }
      if (route.endsWith('recipes-performance-large-dataset--default/')) {
        const input = page.getByRole('combobox', { name: 'Search records' })
        await input.focus()
        await expect(page.locator('#large-dataset-options > [role="option"]')).toHaveCount(48)
        recordViolations(
          violations,
          route,
          'loaded',
          await makeAxeBuilder(page).include('#ss-canvas').analyze(),
        )
        await input.fill('no matching synthetic record')
        recordViolations(
          violations,
          route,
          'empty',
          await makeAxeBuilder(page).include('#ss-canvas').analyze(),
        )
      }

      await testInfo.attach('axe-wcag-22-results.json', {
        body: Buffer.from(JSON.stringify(violations, null, 2)),
        contentType: 'application/json',
      })
      expect(violations, formatViolations(violations)).toEqual([])
    })
  }
})

test.describe('StoryLite reflow and text spacing', () => {
  for (const route of routes) {
    test(`${route} reflows at 320 CSS pixels`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'stories-chromium')
      await page.setViewportSize({ width: 320, height: 900 })
      await page.goto(route)
      await expectRouteDocumentReady(page)
      await page.addStyleTag({
        content: `* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-block-end: 2em !important; }`,
      })
      await expectNoPageOverflow(page)
    })
  }
})

function recordViolations(
  target: RecordedViolation[],
  route: string,
  state: string,
  results: AxeResults,
): void {
  for (const violation of results.violations) {
    for (const node of violation.nodes) {
      target.push({
        failureSummary: node.failureSummary,
        html: node.html,
        impact: violation.impact,
        route,
        rule: violation.id,
        state,
        target: node.target.map(String),
      })
    }
  }
}

function formatViolations(violations: readonly RecordedViolation[]): string {
  return violations
    .map(
      (violation) =>
        `${violation.route} [${violation.state}] ${violation.rule}: ${violation.target.join(', ')}`,
    )
    .join('\n')
}
