import { describe, expect, it } from 'vitest'
import { enhancePopoverParts, resolvePopoverRole } from './popover'

class FakeOverlayElement {
  id = ''
  readonly attributes = new Map<string, string>()
  readonly style = {
    values: new Map<string, string>(),
    removeProperty: (name: string) => {
      this.style.values.delete(name)
    },
    setProperty: (name: string, value: string) => {
      this.style.values.set(name, value)
    },
  }

  getAttribute(name: string): string | null {
    if (name === 'id') return this.id || null
    return this.attributes.get(name) ?? null
  }

  hasAttribute(name: string): boolean {
    if (name === 'id') return this.id.length > 0
    return this.attributes.has(name)
  }

  removeAttribute(name: string): void {
    if (name === 'id') {
      this.id = ''
      return
    }
    this.attributes.delete(name)
  }

  setAttribute(name: string, value: string): void {
    if (name === 'id') {
      this.id = value
    }
    this.attributes.set(name, value)
  }
}

describe('enhancePopoverParts', () => {
  it('uses native popover attributes and trigger wiring', () => {
    const host = new FakeOverlayElement()
    const trigger = new FakeOverlayElement()
    const content = new FakeOverlayElement()

    const result = enhancePopoverParts(
      { host, trigger, content },
      {
        generatedId: 'ui-popover-1',
        anchorName: '--ui-popover-anchor-1',
        supportsPopover: true,
        role: 'menu',
      },
    )

    expect(result).toEqual({
      status: 'enhanced',
      anchorName: '--ui-popover-anchor-1',
      contentId: 'ui-popover-1',
    })
    expect(content.id).toBe('ui-popover-1')
    expect(content.getAttribute('popover')).toBe('auto')
    expect(content.getAttribute('role')).toBe('menu')
    expect(host.getAttribute('data-ui-anchor')).toBeNull()
    expect(trigger.style.values.get('--ui-floating-anchor')).toBe('--ui-popover-anchor-1')
    expect(trigger.getAttribute('data-ui-internal-floating-anchor')).toBe('')
    expect(content.style.values.get('--ui-floating-anchor')).toBe('--ui-popover-anchor-1')
    expect(content.getAttribute('data-ui-internal-floating-content')).toBe('')
    expect(trigger.getAttribute('popovertarget')).toBe('ui-popover-1')
    expect(trigger.getAttribute('aria-controls')).toBe('ui-popover-1')
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('reports missing or unsupported platform requirements', () => {
    const host = new FakeOverlayElement()

    expect(
      enhancePopoverParts(
        { host, trigger: null, content: null },
        { generatedId: 'ui-popover-2', anchorName: '--ui-popover-anchor-2', supportsPopover: true },
      ),
    ).toEqual({ status: 'invalid', missing: ['trigger', 'content'] })
    expect(host.getAttribute('data-ui-invalid')).toBeNull()

    const trigger = new FakeOverlayElement()
    const content = new FakeOverlayElement()
    expect(
      enhancePopoverParts(
        { host, trigger, content },
        {
          generatedId: 'ui-popover-3',
          anchorName: '--ui-popover-anchor-3',
          supportsPopover: false,
        },
      ),
    ).toEqual({ status: 'unsupported', feature: 'popover' })
    expect(host.getAttribute('data-ui-unsupported')).toBeNull()
  })
})

describe('resolvePopoverRole', () => {
  it('accepts supported popup roles and defaults to dialog', () => {
    expect(resolvePopoverRole('menu')).toBe('menu')
    expect(resolvePopoverRole('tooltip')).toBe('tooltip')
    expect(resolvePopoverRole('tree')).toBe('dialog')
  })
})
