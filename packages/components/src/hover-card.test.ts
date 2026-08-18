import { describe, expect, it } from 'vitest'
import { enhanceHoverCardParts, readDelay, resolveHoverCardAnchor } from './hover-card'

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

describe('enhanceHoverCardParts', () => {
  it('prepares manual popover content for hover-card and tooltip recipes', () => {
    const host = new FakeOverlayElement()
    const trigger = new FakeOverlayElement()
    const content = new FakeOverlayElement()

    const result = enhanceHoverCardParts(
      { host, trigger, content },
      {
        generatedId: 'ui-hover-card-1',
        anchorName: '--ui-hover-card-anchor-1',
        supportsPopover: true,
        role: 'tooltip',
      },
    )

    expect(result).toEqual({
      status: 'enhanced',
      anchorName: '--ui-hover-card-anchor-1',
      contentId: 'ui-hover-card-1',
      role: 'tooltip',
    })
    expect(content.getAttribute('popover')).toBe('manual')
    expect(content.getAttribute('role')).toBe('tooltip')
    expect(host.getAttribute('data-ui-anchor')).toBeNull()
    expect(trigger.style.values.get('--ui-floating-anchor')).toBe('--ui-hover-card-anchor-1')
    expect(trigger.getAttribute('data-ui-internal-floating-anchor')).toBe('')
    expect(content.style.values.get('--ui-floating-anchor')).toBe('--ui-hover-card-anchor-1')
    expect(content.getAttribute('data-ui-internal-floating-content')).toBe('')
    expect(trigger.getAttribute('aria-describedby')).toBe('ui-hover-card-1')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('supports host-anchored tooltip content', () => {
    const host = new FakeOverlayElement()
    const trigger = new FakeOverlayElement()
    host.id = 'copy-tooltip'

    const result = enhanceHoverCardParts(
      { host, trigger, content: host },
      {
        generatedId: 'ui-hover-card-1',
        anchorName: '--ui-hover-card-anchor-1',
        supportsPopover: true,
        role: 'tooltip',
      },
    )

    expect(result).toEqual({
      status: 'enhanced',
      anchorName: '--ui-hover-card-anchor-1',
      contentId: 'copy-tooltip',
      role: 'tooltip',
    })
    expect(host.getAttribute('popover')).toBe('manual')
    expect(host.getAttribute('role')).toBe('tooltip')
    expect(host.getAttribute('data-ui-anchor')).toBeNull()
    expect(host.style.values.get('--ui-floating-anchor')).toBe('--ui-hover-card-anchor-1')
    expect(host.getAttribute('data-ui-internal-floating-content')).toBe('')
    expect(trigger.style.values.get('--ui-floating-anchor')).toBe('--ui-hover-card-anchor-1')
    expect(trigger.getAttribute('data-ui-internal-floating-anchor')).toBe('')
    expect(trigger.getAttribute('aria-describedby')).toBe('copy-tooltip')
  })

  it('reports invalid anatomy', () => {
    const host = new FakeOverlayElement()

    expect(
      enhanceHoverCardParts(
        { host, trigger: null, content: null },
        {
          generatedId: 'ui-hover-card-2',
          anchorName: '--ui-hover-card-anchor-2',
          supportsPopover: true,
        },
      ),
    ).toEqual({ status: 'invalid', missing: ['trigger', 'content'] })
  })
})

describe('resolveHoverCardAnchor', () => {
  it('resolves plain and hash-prefixed anchor ids', () => {
    const anchor = new FakeOverlayElement()
    const document = {
      getElementById: (id: string) => (id === 'copy-button' ? anchor : null),
    } as unknown as Document

    expect(resolveHoverCardAnchor(document, 'copy-button')).toBe(anchor)
    expect(resolveHoverCardAnchor(document, '#copy-button')).toBe(anchor)
    expect(resolveHoverCardAnchor(document, '')).toBeNull()
    expect(resolveHoverCardAnchor(document, 'missing')).toBeNull()
  })
})

describe('readDelay', () => {
  it('keeps delay attributes numeric and non-negative', () => {
    expect(readDelay('250', 100)).toBe(250)
    expect(readDelay('-1', 100)).toBe(100)
    expect(readDelay('slow', 100)).toBe(100)
    expect(readDelay(null, 100)).toBe(100)
  })
})
