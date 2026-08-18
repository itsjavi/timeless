import { describe, expect, it } from 'vitest'
import { isOwnedBy } from './parts'

type PartNode = {
  classList: string[]
  localName: string
  parentElement: PartNode | null
}

function node(
  localName: string,
  parentElement: PartNode | null = null,
  classes: string[] = [],
): PartNode {
  return { classList: classes, localName, parentElement }
}

describe('Light DOM part ownership', () => {
  it('accepts parts through neutral wrappers', () => {
    const root = node('ui-dialog')
    const wrapper = node('div', root)
    const part = node('button', wrapper)
    expect(isOwnedBy(root as unknown as Element, part as unknown as Element)).toBe(true)
  })

  it('does not claim parts below nested custom element or class roots', () => {
    const root = node('ui-popover')
    const nestedElement = node('ui-dialog', root)
    const elementPart = node('button', nestedElement)
    const nestedClass = node('article', root, ['ui-card'])
    const classPart = node('h2', nestedClass)

    expect(isOwnedBy(root as unknown as Element, elementPart as unknown as Element)).toBe(false)
    expect(isOwnedBy(root as unknown as Element, classPart as unknown as Element)).toBe(false)
  })
})
