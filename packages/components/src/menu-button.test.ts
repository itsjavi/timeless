import { describe, expect, it } from 'vitest'
import { enhanceMenuButtonParts } from './menu-button'

class FakeMenuButtonElement {
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

describe('enhanceMenuButtonParts', () => {
  it('wires menu trigger, popover content, and floating anchor hooks', () => {
    const host = new FakeMenuButtonElement()
    const trigger = new FakeMenuButtonElement()
    const content = new FakeMenuButtonElement()

    const result = enhanceMenuButtonParts(
      { host, trigger, content },
      {
        anchorName: '--ui-menu-button-anchor-1',
        generatedId: 'ui-menu-button-1',
        supportsPopover: true,
      },
    )

    expect(result).toEqual({ status: 'enhanced', contentId: 'ui-menu-button-1' })
    expect(content.id).toBe('ui-menu-button-1')
    expect(content.getAttribute('popover')).toBe('auto')
    expect(content.getAttribute('role')).toBe('menu')
    expect(host.getAttribute('data-ui-anchor')).toBeNull()
    expect(trigger.style.values.get('--ui-floating-anchor')).toBe('--ui-menu-button-anchor-1')
    expect(content.style.values.get('--ui-floating-anchor')).toBe('--ui-menu-button-anchor-1')
    expect(trigger.getAttribute('aria-controls')).toBe('ui-menu-button-1')
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('reports missing or unsupported platform requirements', () => {
    const host = new FakeMenuButtonElement()

    expect(
      enhanceMenuButtonParts(
        { host, trigger: null, content: null },
        {
          anchorName: '--ui-menu-button-anchor-2',
          generatedId: 'ui-menu-button-2',
          supportsPopover: true,
        },
      ),
    ).toEqual({ status: 'invalid', missing: ['trigger', 'content'] })
    expect(host.getAttribute('data-ui-invalid')).toBeNull()

    const trigger = new FakeMenuButtonElement()
    const content = new FakeMenuButtonElement()
    expect(
      enhanceMenuButtonParts(
        { host, trigger, content },
        {
          anchorName: '--ui-menu-button-anchor-3',
          generatedId: 'ui-menu-button-3',
          supportsPopover: false,
        },
      ),
    ).toEqual({ status: 'unsupported', feature: 'popover' })
    expect(host.getAttribute('data-ui-unsupported')).toBeNull()
  })
})
