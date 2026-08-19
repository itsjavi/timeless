import { describe, expect, it } from 'vitest'
import { findFormErrorElement } from './form'

/**
 * A minimum stand-in for the DOM traversal `findFormErrorElement` performs, because the package's
 * unit tests run in `node`. Only `parentElement`, `contains`, and `querySelectorAll` for the two
 * selectors the function uses are modelled; anything else would be inventing behavior to assert.
 */
class FakeNode {
  parentElement: FakeNode | null = null
  readonly children: FakeNode[] = []

  constructor(
    readonly tag: string,
    readonly attributes: Record<string, string> = {},
  ) {}

  append(...children: FakeNode[]): this {
    for (const child of children) {
      child.parentElement = this
      this.children.push(child)
    }
    return this
  }

  contains(node: FakeNode | null): boolean {
    for (let scope = node; scope; scope = scope.parentElement) if (scope === this) return true
    return false
  }

  querySelectorAll(selector: string): FakeNode[] {
    const matches = (node: FakeNode) =>
      selector.includes('error')
        ? (node.attributes['data-ui-part'] ?? '').split(/\s+/).includes('error')
        : 'name' in node.attributes
    return this.descendants().filter(matches)
  }

  setCustomValidity(): void {}

  private descendants(): FakeNode[] {
    return this.children.flatMap((child) => [child, ...child.descendants()])
  }
}

const field = (name: string, extra: FakeNode[] = []) =>
  new FakeNode('div').append(new FakeNode('input', { name }), ...extra)

const errorNode = () => new FakeNode('p', { 'data-ui-part': 'error' })

function findIn(form: FakeNode, control: FakeNode) {
  return findFormErrorElement(control as unknown as Element, form as unknown as Element)
}

describe('findFormErrorElement', () => {
  it('finds the single error part inside the control’s own wrapper', () => {
    const error = errorNode()
    const wrapper = field('email', [error])
    const form = new FakeNode('form').append(wrapper)

    expect(findIn(form, wrapper.children[0]!)).toBe(error)
  })

  it('walks past a wrapper that holds no error at all', () => {
    const error = errorNode()
    const control = new FakeNode('input', { name: 'email' })
    const inner = new FakeNode('div').append(control)
    const outer = new FakeNode('div').append(inner, error)
    const form = new FakeNode('form').append(outer)

    expect(findIn(form, control)).toBe(error)
  })

  it('refuses a shared error rather than pinning it to whichever field it reached first', () => {
    const shared = errorNode()
    const first = new FakeNode('input', { name: 'email' })
    const second = new FakeNode('input', { name: 'password' })
    const form = new FakeNode('form').append(new FakeNode('div').append(first, second, shared))

    expect(findIn(form, first)).toBeNull()
    expect(findIn(form, second)).toBeNull()
  })

  it('refuses an ambiguous wrapper holding more than one error', () => {
    const control = new FakeNode('input', { name: 'email' })
    const form = new FakeNode('form').append(
      new FakeNode('div').append(control, errorNode(), errorNode()),
    )

    expect(findIn(form, control)).toBeNull()
  })

  it('returns nothing for an unwrapped control rather than the first error on the form', () => {
    const control = new FakeNode('input', { name: 'email' })
    const form = new FakeNode('form').append(control, field('password', [errorNode()]))

    expect(findIn(form, control)).toBeNull()
  })

  it('stops at the boundary instead of escaping the form', () => {
    const control = new FakeNode('input', { name: 'email' })
    const form = new FakeNode('form').append(control)
    new FakeNode('body').append(form, errorNode())

    expect(findIn(form, control)).toBeNull()
  })
})
