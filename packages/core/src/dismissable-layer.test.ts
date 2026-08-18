import { describe, expect, it } from 'vitest'
import { isEscapeKey, isEventOutside } from './dismissable-layer'

describe('isEscapeKey', () => {
  it('matches only Escape key events', () => {
    expect(isEscapeKey({ key: 'Escape' } as KeyboardEvent)).toBe(true)
    expect(isEscapeKey({ key: 'Enter' } as KeyboardEvent)).toBe(false)
  })
})

describe('isEventOutside', () => {
  it('uses composed path membership for outside interaction checks', () => {
    const layer = {} as Element
    const child = {} as Element
    const insideEvent = eventWithPath([child, layer])
    const outsideEvent = eventWithPath([child])

    expect(isEventOutside(insideEvent, layer)).toBe(false)
    expect(isEventOutside(outsideEvent, layer)).toBe(true)
  })
})

function eventWithPath(path: readonly EventTarget[]): Event {
  return {
    composedPath: () => path,
  } as Event
}
