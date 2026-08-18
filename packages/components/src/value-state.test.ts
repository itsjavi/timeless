import { describe, expect, it } from 'vitest'
import { ValueState } from './value-state'

describe('ValueState', () => {
  it('keeps default and live state separate after a live assignment', () => {
    const state = new ValueState('initial')

    expect(state.setDefault('authored')).toBe(true)
    expect(state.value).toBe('authored')
    expect(state.setValue('live')).toBe(true)
    expect(state.setDefault('new-default')).toBe(false)
    expect(state.snapshot()).toEqual({
      defaultValue: 'new-default',
      dirty: true,
      value: 'live',
    })
    expect(state.reset()).toBe(true)
    expect(state.value).toBe('new-default')
    expect(state.dirty).toBe(false)
  })
})
