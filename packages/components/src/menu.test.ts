import { describe, expect, it, vi } from 'vitest'
import {
  applyMenuItemChecked,
  enhanceMenuParts,
  findMenuGroups,
  findMenuItems,
  menuCheckableRole,
  menuInlineDirection,
  menuNavigationTarget,
  menuTypeaheadTarget,
  mirrorInlineKey,
  resolveMenuOrientation,
  resolveMenuRole,
  type MenuGroupLike,
  type MenuItemLike,
} from './menu'

class FakeMenuItem implements MenuItemLike {
  textContent: string | null
  focused = false
  /** The nearest `group` or `role="group"` wrapper, standing in for `closest()` without a DOM. */
  group: object | null = null
  readonly click = vi.fn()
  readonly attributes = new Map<string, string>()

  constructor(textContent: string, attributes: Record<string, string> = {}) {
    this.textContent = textContent
    for (const [name, value] of Object.entries(attributes)) {
      this.setAttribute(name, value)
    }
  }

  closest(): unknown {
    return this.group
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

class FakeMenuGroup implements MenuGroupLike {
  readonly attributes = new Map<string, string>()

  constructor(readonly label: { id: string } | null = null) {}

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name)
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }

  querySelector(): { id: string } | null {
    return this.label
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

  it('preserves checkbox/radio roles and keeps the resting tab stop off a disabled item', () => {
    const host = new FakeMenuItem('', { role: 'menubar' })
    const items = [
      new FakeMenuItem('Preview', { disabled: '' }),
      new FakeMenuItem('Grid overlay', { role: 'menuitemcheckbox', 'aria-checked': 'true' }),
      new FakeMenuItem('Compact density'),
    ]

    const result = enhanceMenuParts({ host, items }, { orientation: 'horizontal' })

    expect(result).toEqual({ status: 'enhanced', activeIndex: 1, role: 'menubar' })
    expect(host.getAttribute('role')).toBe('menubar')
    expect(items[0]!.hasAttribute('disabled')).toBe(false)
    expect(items[0]!.getAttribute('aria-disabled')).toBe('true')
    // Disabled items stay arrow-reachable, so the item keeps a tabindex — just not the tab stop.
    expect(items[0]!.getAttribute('tabindex')).toBe('-1')
    expect(items[1]!.getAttribute('tabindex')).toBe('0')
    expect(items[1]!.getAttribute('role')).toBe('menuitemcheckbox')
  })

  it('names a group from its label part without overwriting an authored relationship', () => {
    const host = new FakeMenuItem('')
    const items = [new FakeMenuItem('Show grid')]
    const generated = new FakeMenuGroup({ id: '' })
    const authored = new FakeMenuGroup({ id: 'authored-label' })
    authored.setAttribute('aria-labelledby', 'somewhere-else')

    enhanceMenuParts(
      { host, items, groups: [generated, authored] },
      { orientation: 'vertical', generatedIdPrefix: 'view-menu' },
    )

    expect(generated.getAttribute('role')).toBe('group')
    expect(generated.getAttribute('aria-labelledby')).toBe('view-menu-group-1-label')
    expect(authored.getAttribute('aria-labelledby')).toBe('somewhere-else')
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

describe('checkable menu items', () => {
  it('reads the checkable role and ignores a plain command', () => {
    expect(menuCheckableRole(new FakeMenuItem('Copy'))).toBeNull()
    expect(menuCheckableRole(new FakeMenuItem('Grid', { role: 'menuitemcheckbox' }))).toBe(
      'menuitemcheckbox',
    )
    expect(menuCheckableRole(new FakeMenuItem('Compact', { role: 'menuitemradio' }))).toBe(
      'menuitemradio',
    )
  })

  it('toggles a checkbox without touching its neighbours', () => {
    const items = [
      new FakeMenuItem('Grid', { role: 'menuitemcheckbox', 'aria-checked': 'false' }),
      new FakeMenuItem('Rulers', { role: 'menuitemcheckbox', 'aria-checked': 'true' }),
    ]

    applyMenuItemChecked(items[0]!, items, true)

    expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual(['true', 'true'])
  })

  it('clears radio siblings only inside the owning group', () => {
    const density = {}
    const theme = {}
    const compact = new FakeMenuItem('Compact', { role: 'menuitemradio', 'aria-checked': 'true' })
    const comfortable = new FakeMenuItem('Comfortable', { role: 'menuitemradio' })
    const light = new FakeMenuItem('Light', { role: 'menuitemradio', 'aria-checked': 'true' })
    const checkbox = new FakeMenuItem('Rulers', {
      role: 'menuitemcheckbox',
      'aria-checked': 'true',
    })
    compact.group = density
    comfortable.group = density
    light.group = theme
    checkbox.group = density
    const items = [compact, comfortable, light, checkbox]

    applyMenuItemChecked(comfortable, items, true)

    expect(compact.getAttribute('aria-checked')).toBe('false')
    expect(comfortable.getAttribute('aria-checked')).toBe('true')
    // A different group, and a checkbox that happens to share one, are both left alone.
    expect(light.getAttribute('aria-checked')).toBe('true')
    expect(checkbox.getAttribute('aria-checked')).toBe('true')
  })

  it('treats ungrouped radios as one group', () => {
    const items = [
      new FakeMenuItem('Small', { role: 'menuitemradio', 'aria-checked': 'true' }),
      new FakeMenuItem('Large', { role: 'menuitemradio' }),
    ]

    applyMenuItemChecked(items[1]!, items, true)

    expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual(['false', 'true'])
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

  it('resolves the submenu direction from writing direction', () => {
    expect(menuInlineDirection('ArrowRight', false)).toBe('forward')
    expect(menuInlineDirection('ArrowLeft', false)).toBe('backward')
    expect(menuInlineDirection('ArrowRight', true)).toBe('backward')
    expect(menuInlineDirection('ArrowLeft', true)).toBe('forward')
    expect(menuInlineDirection('ArrowDown', false)).toBeNull()
  })

  it('mirrors only the inline arrows', () => {
    expect(mirrorInlineKey('ArrowRight')).toBe('ArrowLeft')
    expect(mirrorInlineKey('ArrowLeft')).toBe('ArrowRight')
    expect(mirrorInlineKey('Home')).toBe('Home')
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

/**
 * A minimal stand-in for the selector engine, supporting only the two forms `menu.ts` asks for.
 * `packages/components` tests run without a DOM, and what these cases are actually about is which
 * selector discovery uses and which ancestors stop the walk.
 */
type FakeNode = {
  readonly attributes: Record<string, string>
  readonly children: FakeNode[]
  readonly classList: readonly string[]
  readonly localName: string
  parentElement: FakeNode | null
}

function element(
  localName: string,
  attributes: Record<string, string> = {},
  children: FakeNode[] = [],
  classList: readonly string[] = [],
): FakeNode {
  const node: FakeNode = { attributes, children, classList, localName, parentElement: null }
  for (const child of children) child.parentElement = node
  return node
}

function matchesFakeSelector(node: FakeNode, selector: string): boolean {
  if (selector === "[role^='menuitem']") {
    return (node.attributes.role ?? '').startsWith('menuitem')
  }
  if (selector === "[data-ui-part~='group']") {
    return (node.attributes['data-ui-part'] ?? '').split(/\s+/).includes('group')
  }
  throw new Error(`Unexpected selector: ${selector}`)
}

/** Adds a selector engine to the node itself: `isOwnedBy` walks real `parentElement` identity. */
function asRoot(node: FakeNode): Element {
  return Object.assign(node, {
    querySelectorAll(selector: string) {
      const found: FakeNode[] = []
      const visit = (candidate: FakeNode): void => {
        for (const child of candidate.children) {
          if (matchesFakeSelector(child, selector)) found.push(child)
          visit(child)
        }
      }
      visit(node)
      return found
    },
  }) as unknown as Element
}

describe('menu item discovery', () => {
  it('descends through group wrappers, skips separators, and stops at a nested menu', () => {
    const grouped = element('button', { role: 'menuitem', 'data-name': 'grouped' })
    const separator = element('hr', { role: 'separator' })
    const loose = element('button', { role: 'menuitemcheckbox', 'data-name': 'loose' })
    const nested = element('button', { role: 'menuitem', 'data-name': 'nested' })
    const group = element('div', { 'data-ui-part': 'group', role: 'group' }, [grouped, separator])
    const submenu = element('ui-menu', { popover: 'auto' }, [nested])
    const host = element('ui-menu', {}, [group, loose, submenu])

    const items = findMenuItems(asRoot(host)) as unknown as FakeNode[]
    const groups = findMenuGroups(asRoot(host)) as unknown as FakeNode[]

    expect(items.map((item) => item.attributes['data-name'])).toEqual(['grouped', 'loose'])
    expect(items).not.toContain(separator)
    expect(groups).toEqual([group])
  })
})
