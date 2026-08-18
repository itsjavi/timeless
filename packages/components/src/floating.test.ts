import { describe, expect, it } from 'vitest'
import {
  applyFloatingPosition,
  clearFloatingPosition,
  isFloatingPlacement,
  resolveFloatingPlacement,
  syncFloatingAnchor,
  type FloatingRuntimeElement,
} from './floating'

class FakeFloatingElement {
  readonly attributes = new Map<string, string>()
  readonly ownerDocument = {
    defaultView: {
      innerHeight: 720,
      innerWidth: 1280,
    },
  }
  readonly style = {
    values: new Map<string, string>(),
    removeProperty: (name: string) => {
      this.style.values.delete(name)
    },
    setProperty: (name: string, value: string) => {
      this.style.values.set(name, value)
    },
  }

  constructor(
    private readonly rect = {
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
    },
  ) {}

  getBoundingClientRect(): DOMRect {
    return this.rect as DOMRect
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name)
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }
}

describe('floating placement contracts', () => {
  it('accepts supported placement values and defaults to bottom', () => {
    expect(isFloatingPlacement('bottom')).toBe(true)
    expect(isFloatingPlacement('top')).toBe(true)
    expect(isFloatingPlacement('center')).toBe(false)
    expect(resolveFloatingPlacement('right')).toBe('right')
    expect(resolveFloatingPlacement('center')).toBe('bottom')
    expect(resolveFloatingPlacement(null)).toBe('bottom')
  })
})

describe('applyFloatingPosition', () => {
  it('uses the preferred placement when it fits', () => {
    const trigger = new FakeFloatingElement({
      bottom: 142,
      height: 42,
      left: 600,
      right: 680,
      top: 100,
      width: 80,
    })
    const content = new FakeFloatingElement({
      bottom: 0,
      height: 100,
      left: 0,
      right: 0,
      top: 0,
      width: 240,
    })

    const placement = applyFloatingPosition({
      trigger: trigger as unknown as FloatingRuntimeElement,
      content: content as unknown as FloatingRuntimeElement,
      placement: 'bottom',
    })

    expect(placement).toBe('bottom')
    expect(content.style.values.get('--ui-floating-left')).toBe('520px')
    expect(content.style.values.get('--ui-floating-top')).toBe('148px')
    expect(content.attributes.get('data-ui-internal-floating')).toBe('fallback')
    expect(content.attributes.get('data-ui-internal-placement')).toBe('bottom')
  })

  it('tries other placements before clamping when the preferred side is constrained', () => {
    const trigger = new FakeFloatingElement({
      bottom: 342,
      height: 42,
      left: 1160,
      right: 1230,
      top: 300,
      width: 70,
    })
    const content = new FakeFloatingElement({
      bottom: 0,
      height: 100,
      left: 0,
      right: 0,
      top: 0,
      width: 240,
    })

    const placement = applyFloatingPosition({
      trigger: trigger as unknown as FloatingRuntimeElement,
      content: content as unknown as FloatingRuntimeElement,
      placement: 'right',
    })

    expect(placement).toBe('left')
    expect(content.style.values.get('--ui-floating-left')).toBe('914px')
    expect(content.style.values.get('--ui-floating-top')).toBe('271px')
    expect(content.attributes.get('data-ui-internal-placement')).toBe('left')

    clearFloatingPosition(content as unknown as FloatingRuntimeElement)

    expect(content.style.values.has('--ui-floating-left')).toBe(false)
    expect(content.style.values.has('--ui-floating-top')).toBe(false)
    expect(content.attributes.has('data-ui-internal-floating')).toBe(false)
    expect(content.attributes.has('data-ui-internal-placement')).toBe(false)
  })
})

describe('syncFloatingAnchor', () => {
  it('writes stable anchor hooks for trigger, content, and host diagnostics', () => {
    const host = new FakeFloatingElement()
    const trigger = new FakeFloatingElement()
    const content = new FakeFloatingElement()

    syncFloatingAnchor(
      {
        host,
        trigger,
        content,
      },
      {
        anchorName: '--ui-floating-anchor-1',
      },
    )

    expect(trigger.style.values.get('--ui-floating-anchor')).toBe('--ui-floating-anchor-1')
    expect(trigger.attributes.get('data-ui-internal-floating-anchor')).toBe('')
    expect(content.style.values.get('--ui-floating-anchor')).toBe('--ui-floating-anchor-1')
    expect(content.attributes.get('data-ui-internal-floating-content')).toBe('')
    expect(host.attributes.has('data-ui-anchor')).toBe(false)
  })
})
