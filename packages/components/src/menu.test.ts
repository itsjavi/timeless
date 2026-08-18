import { describe, expect, it, vi } from 'vitest'
import {
  enhanceMenuParts,
  menuNavigationTarget,
  menuTypeaheadTarget,
  resolveMenuOrientation,
  resolveMenuRole,
  type MenuItemLike,
} from './menu'

class FakeMenuItem implements MenuItemLike {
  textContent: string | null
  focused = false
  readonly click = vi.fn()
  readonly attributes = new Map<string, string>()

  constructor(textContent: string, attributes: Record<string, string> = {}) {
    this.textContent = textContent
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

describe('enhanceMenuParts', () => {
  it('sets menu semantics, item roles, orientation, and roving focus state', () => {
    const host = new FakeMenuItem('')
    const items = [
      new FakeMenuItem('Open'),
      new FakeMenuItem('Duplicate'),
      new FakeMenuItem('Delete'),
    ]

    const result = enhanceMenuParts({ host, items }, { orientation: 'vertical' })

    expect(result).toEqual({ status: 'enhanced', activeIndex: 0, role: 'menu' })
    expect(host.getAttribute('role')).toBe('menu')
    expect(host.getAttribute('orientation')).toBe('vertical')
    expect(host.getAttribute('aria-orientation')).toBe('vertical')
    expect(items.map((item) => item.getAttribute('role'))).toEqual([
      'menuitem',
      'menuitem',
      'menuitem',
    ])
    expect(items.map((item) => item.getAttribute('tabindex'))).toEqual(['0', '-1', '-1'])
  })

  it('preserves checkbox/radio roles and keeps disabled menu items focusable', () => {
    const host = new FakeMenuItem('', { role: 'menubar' })
    const items = [
      new FakeMenuItem('Preview', { disabled: '' }),
      new FakeMenuItem('Grid overlay', { role: 'menuitemcheckbox', 'aria-checked': 'true' }),
      new FakeMenuItem('Compact density'),
    ]

    const result = enhanceMenuParts({ host, items }, { orientation: 'horizontal' })

    expect(result).toEqual({ status: 'enhanced', activeIndex: 0, role: 'menubar' })
    expect(host.getAttribute('role')).toBe('menubar')
    expect(items[0]!.hasAttribute('disabled')).toBe(false)
    expect(items[0]!.getAttribute('aria-disabled')).toBe('true')
    expect(items[0]!.getAttribute('tabindex')).toBe('0')
    expect(items[1]!.getAttribute('role')).toBe('menuitemcheckbox')
  })

  it('marks empty menus invalid', () => {
    const host = new FakeMenuItem('')

    expect(enhanceMenuParts({ host, items: [] }, { orientation: 'vertical' })).toEqual({
      status: 'invalid',
      missing: ['items'],
    })
    expect(host.getAttribute('data-ui-invalid')).toBeNull()
  })
})

describe('menu navigation helpers', () => {
  it('uses orientation-aware movement and includes disabled menu items', () => {
    const items = [
      new FakeMenuItem('Open'),
      new FakeMenuItem('Duplicate', { disabled: '' }),
      new FakeMenuItem('Rename'),
    ]

    expect(menuNavigationTarget(items, 0, 'ArrowDown', 'vertical')).toBe(1)
    expect(menuNavigationTarget(items, 0, 'ArrowRight', 'vertical')).toBeNull()
    expect(menuNavigationTarget(items, 0, 'ArrowRight', 'horizontal')).toBe(1)
    expect(menuNavigationTarget(items, 2, 'Home', 'vertical')).toBe(0)
    expect(menuNavigationTarget(items, 0, 'End', 'vertical')).toBe(2)
  })

  it('finds menu items by text prefix, including disabled items', () => {
    const items = [
      new FakeMenuItem('Open'),
      new FakeMenuItem('Delete', { disabled: '' }),
      new FakeMenuItem('Duplicate'),
      new FakeMenuItem('Rename'),
    ]

    expect(menuTypeaheadTarget(items, 0, 'd')).toBe(1)
    expect(menuTypeaheadTarget(items, 0, 're')).toBe(3)
    expect(menuTypeaheadTarget(items, 0, 'x')).toBeNull()
  })

  it('resolves menu role and orientation defaults from APG semantics', () => {
    expect(resolveMenuRole(null)).toBe('menu')
    expect(resolveMenuRole('menubar')).toBe('menubar')
    expect(resolveMenuOrientation(null)).toBe('vertical')
    expect(resolveMenuOrientation(null, 'menubar')).toBe('horizontal')
    expect(resolveMenuOrientation('horizontal')).toBe('horizontal')
    expect(resolveMenuOrientation('both')).toBe('vertical')
  })
})
