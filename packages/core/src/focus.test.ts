import { describe, expect, it } from 'vitest'
import { canReturnFocus, focusReturnTarget, returnFocus } from './focus'

class FakeFocusTarget {
  readonly calls: FocusOptions[] = []

  constructor(readonly isConnected = true) {}

  focus(options?: FocusOptions): void {
    this.calls.push(options ?? {})
  }
}

describe('focus return helpers', () => {
  it('captures only focus targets', () => {
    const target = new FakeFocusTarget()

    expect(focusReturnTarget(target)).toBe(target)
    expect(focusReturnTarget({})).toBeNull()
    expect(focusReturnTarget(null)).toBeNull()
  })

  it('checks whether a remembered target can receive focus again', () => {
    expect(canReturnFocus(new FakeFocusTarget())).toBe(true)
    expect(canReturnFocus(new FakeFocusTarget(false))).toBe(false)
    expect(canReturnFocus(null)).toBe(false)
  })

  it('returns focus with preventScroll by default', () => {
    const target = new FakeFocusTarget()

    expect(returnFocus(target)).toBe(true)
    expect(target.calls).toEqual([{ preventScroll: true }])
  })

  it('uses a fallback when the original target is gone', () => {
    const target = new FakeFocusTarget(false)
    const fallback = new FakeFocusTarget()

    expect(returnFocus(target, { fallback, preventScroll: false })).toBe(true)
    expect(target.calls).toEqual([])
    expect(fallback.calls).toEqual([{ preventScroll: false }])
  })

  it('reports when no focus target is available', () => {
    expect(returnFocus(new FakeFocusTarget(false))).toBe(false)
  })
})
