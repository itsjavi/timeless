import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export type AxeResults = Awaited<ReturnType<AxeBuilder['analyze']>>

export function makeAxeBuilder(page: Page): AxeBuilder {
  return new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
    'wcag22a',
    'wcag22aa',
  ])
}

export async function expectNoBlockingA11yViolations(
  page: Page,
  path: string,
  include?: string,
): Promise<void> {
  const builder = makeAxeBuilder(page)
  const results = await (include ? builder.include(include) : builder).analyze()
  const blocking = results.violations

  if (blocking.length > 0) {
    const summary = blocking
      .map((violation) =>
        [
          `[${violation.impact}] ${violation.id}: ${violation.help}`,
          ...violation.nodes.map((node) =>
            [`target: ${node.target.join(', ')}`, `html: ${node.html}`, node.failureSummary]
              .filter(Boolean)
              .join('\n'),
          ),
        ].join('\n'),
      )
      .join('\n\n')

    throw new Error(`Accessibility violations on ${path}:\n${summary}`)
  }

  expect(blocking).toHaveLength(0)
}
