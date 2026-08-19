import { describe, expect, it } from 'vitest'
import { validateTimelessMarkup, type ValidatableElement, type ValidatableRoot } from './validate'

/**
 * The package has no DOM environment, so markup is described the way every other spec here describes
 * it: a plain object satisfying the structural type the code accepts.
 */
function element(
  tagName: string,
  className: string,
  attributes: Record<string, string> = {},
): ValidatableElement {
  const entries = Object.entries(attributes).map(([name, value]) => ({ name, value }))
  return {
    tagName: tagName.toUpperCase(),
    className,
    attributes: { length: entries.length, item: (index) => entries[index] ?? null },
  }
}

function root(...elements: ValidatableElement[]): ValidatableRoot {
  return {
    querySelectorAll: () => ({ length: elements.length, item: (index) => elements[index] ?? null }),
  }
}

function messages(...elements: ValidatableElement[]): string[] {
  return validateTimelessMarkup({ root: root(...elements), log: false }).map(
    (problem) => problem.message,
  )
}

describe('validateTimelessMarkup', () => {
  it('accepts markup that matches the contract', () => {
    expect(
      messages(
        element('button', 'ui-button', {
          'data-ui-variant': 'danger-outline',
          'data-ui-size': 'sm',
        }),
      ),
    ).toEqual([])
  })

  it('reports a value outside the permitted set', () => {
    expect(messages(element('button', 'ui-button', { 'data-ui-variant': 'primry' }))).toEqual([
      expect.stringContaining('data-ui-variant="primry" is not permitted on ui-button'),
    ])
  })

  it('names the permitted values in the report', () => {
    const [message] = messages(element('div', 'ui-card', { 'data-ui-variant': 'raised' }))
    expect(message).toContain('`surface`, `filled`, `ghost`')
  })

  it('reports an attribute the component does not declare', () => {
    expect(messages(element('div', 'ui-card', { 'data-ui-varaint': 'surface' }))).toEqual([
      expect.stringContaining('ui-card has no data-ui-varaint attribute'),
    ])
  })

  it('reports a value on a presence-based boolean attribute', () => {
    expect(messages(element('div', 'ui-group', { 'data-ui-wrap': 'true' }))).toEqual([
      expect.stringContaining('data-ui-wrap is presence-based on ui-group'),
    ])
  })

  it('accepts a boolean attribute authored with no value', () => {
    expect(messages(element('div', 'ui-group', { 'data-ui-wrap': '' }))).toEqual([])
  })

  it('reports data-ui-* configuration on a custom-element host', () => {
    expect(messages(element('ui-tabs', '', { 'data-ui-orientation': 'vertical' }))).toEqual([
      expect.stringContaining('ui-tabs has no data-ui-orientation attribute'),
    ])
  })

  it('resolves the class root and the element tag separately when they share a name', () => {
    // `.ui-select` is the styled native control; `<ui-select>` is the enhanced element.
    expect(messages(element('select', 'ui-select', { 'data-ui-size': 'lg' }))).toEqual([])
    expect(messages(element('ui-select', '', { 'data-ui-size': 'lg' }))).toEqual([
      expect.stringContaining('ui-select has no data-ui-size attribute'),
    ])
  })

  it('resolves the most specific class when a root composes another', () => {
    expect(
      messages(element('button', 'ui-button ui-toggle', { 'data-ui-variant': 'ghost' })),
    ).toEqual([])
  })

  it('ignores authored parts and private runtime hooks', () => {
    expect(
      messages(
        element('div', 'ui-card', {
          'data-ui-part': 'header',
          'data-ui-internal-measured': '12',
        }),
      ),
    ).toEqual([])
  })

  it('ignores elements that are not component roots', () => {
    expect(messages(element('div', 'my-wrapper', { 'data-ui-variant': 'anything' }))).toEqual([])
  })

  it('returns the offending element so a report can point at it', () => {
    const target = element('button', 'ui-button', { 'data-ui-size': 'xl' })
    const [problem] = validateTimelessMarkup({ root: root(target), log: false })
    expect(problem?.element).toBe(target)
    expect(problem?.component).toBe('button')
    expect(problem?.value).toBe('xl')
  })
})
