import { describe, expect, it } from 'vitest'
import { enhanceToolbarParts, resolveToolbarOrientation, type ToolbarItemLike } from './toolbar'

class FakeToolbarItem implements ToolbarItemLike {
  focused = false
  readonly attributes = new Map<string, string>()

  constructor(attributes: Record<string, string> = {}) {
    for (const [name, value] of Object.entries(attributes)) {
      this.setAttribute(name, value)
    }
  }

  focus(): void {
    this.focused = true
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name)
  }

  matches(selector: string): boolean {
    return selector === ':disabled' && this.hasAttribute('disabled')
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name)
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }
}

describe('enhanceToolbarParts', () => {
  it('sets toolbar semantics and roving focus state', () => {
    const host = new FakeToolbarItem()
    const items = [
      new FakeToolbarItem(),
      new FakeToolbarItem({ disabled: '' }),
      new FakeToolbarItem(),
    ]

    const result = enhanceToolbarParts({ host, items }, { orientation: 'horizontal' })

    expect(result).toEqual({ status: 'enhanced', activeIndex: 0 })
    expect(host.getAttribute('role')).toBe('toolbar')
    expect(host.getAttribute('orientation')).toBe('horizontal')
    expect(host.getAttribute('aria-orientation')).toBe('horizontal')
    expect(items.map((item) => item.getAttribute('tabindex'))).toEqual(['0', '-1', '-1'])
  })

  it('marks empty toolbars invalid', () => {
    const host = new FakeToolbarItem()

    expect(enhanceToolbarParts({ host, items: [] }, { orientation: 'horizontal' })).toEqual({
      status: 'invalid',
      missing: ['items'],
    })
    expect(host.getAttribute('data-ui-invalid')).toBeNull()
  })
})

describe('resolveToolbarOrientation', () => {
  it('defaults to horizontal and accepts vertical', () => {
    expect(resolveToolbarOrientation(null)).toBe('horizontal')
    expect(resolveToolbarOrientation('horizontal')).toBe('horizontal')
    expect(resolveToolbarOrientation('vertical')).toBe('vertical')
    expect(resolveToolbarOrientation('both')).toBe('horizontal')
  })
})
