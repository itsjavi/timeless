import { describe, expect, it } from 'vitest'
import {
  contextMenuPointFromEvent,
  contextMenuPointFromRect,
  enhanceContextMenuParts,
  isContextMenuKey,
  type ContextMenuElementLike,
} from './context-menu'

class FakeContextMenuElement implements ContextMenuElementLike {
  id = ''
  readonly attributes = new Map<string, string>()

  getAttribute(name: string): string | null {
    if (name === 'id') return this.id || null
    return this.attributes.get(name) ?? null
  }

  hasAttribute(name: string): boolean {
    if (name === 'id') return this.id.length > 0
    return this.attributes.has(name)
  }

  setAttribute(name: string, value: string): void {
    if (name === 'id') this.id = value
    this.attributes.set(name, value)
  }
}

const options = { generatedId: 'ui-context-menu-1', supportsPopover: true }

describe('enhanceContextMenuParts', () => {
  it('gives the surface popover semantics and the target a keyboard route in', () => {
    const host = new FakeContextMenuElement()
    const target = new FakeContextMenuElement()
    const menu = new FakeContextMenuElement()

    const result = enhanceContextMenuParts({ host, target, menu }, options)

    expect(result).toEqual({ status: 'enhanced', menuId: 'ui-context-menu-1' })
    expect(menu.getAttribute('popover')).toBe('auto')
    expect(menu.getAttribute('role')).toBe('menu')
    expect(target.getAttribute('tabindex')).toBe('0')
    expect(target.getAttribute('aria-haspopup')).toBe('menu')
    expect(target.getAttribute('aria-controls')).toBe('ui-context-menu-1')
    expect(target.getAttribute('aria-expanded')).toBe('false')
  })

  it('leaves an authored id, popover mode, role, and tab stop alone', () => {
    const host = new FakeContextMenuElement()
    const target = new FakeContextMenuElement()
    target.setAttribute('tabindex', '-1')
    const menu = new FakeContextMenuElement()
    menu.setAttribute('id', 'row-actions')
    menu.setAttribute('popover', 'manual')
    menu.setAttribute('role', 'menubar')

    const result = enhanceContextMenuParts({ host, target, menu }, options)

    expect(result).toEqual({ status: 'enhanced', menuId: 'row-actions' })
    expect(menu.getAttribute('popover')).toBe('manual')
    expect(menu.getAttribute('role')).toBe('menubar')
    expect(target.getAttribute('tabindex')).toBe('-1')
  })

  it('reports missing anatomy and missing platform support without marking the host', () => {
    const host = new FakeContextMenuElement()

    expect(enhanceContextMenuParts({ host, target: null, menu: null }, options)).toEqual({
      status: 'invalid',
      missing: ['target', 'menu'],
    })
    expect(
      enhanceContextMenuParts(
        {
          host,
          target: new FakeContextMenuElement(),
          menu: new FakeContextMenuElement(),
        },
        { ...options, supportsPopover: false },
      ),
    ).toEqual({ status: 'unsupported', feature: 'popover' })
    expect(host.getAttribute('data-ui-invalid')).toBeNull()
  })
})

describe('context menu opening', () => {
  it('recognises both keyboard routes and nothing else', () => {
    expect(isContextMenuKey({ key: 'ContextMenu', shiftKey: false })).toBe(true)
    expect(isContextMenuKey({ key: 'F10', shiftKey: true })).toBe(true)
    expect(isContextMenuKey({ key: 'F10', shiftKey: false })).toBe(false)
    expect(isContextMenuKey({ key: 'Enter', shiftKey: true })).toBe(false)
  })

  it('takes the pointer position from a pointer and the focused edge from a key', () => {
    expect(contextMenuPointFromEvent({ clientX: 412, clientY: 96 })).toEqual({ x: 412, y: 96 })
    expect(contextMenuPointFromRect({ left: 40, bottom: 120 })).toEqual({ x: 40, y: 122 })
  })

  it('reports no position for a key-initiated contextmenu event', () => {
    // Several engines fire `contextmenu` for the Context Menu key with the origin, or with nothing.
    expect(contextMenuPointFromEvent({ clientX: 0, clientY: 0 })).toBeNull()
    expect(contextMenuPointFromEvent({})).toBeNull()
  })
})
