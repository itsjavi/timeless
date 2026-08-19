import { describe, expect, it } from 'vitest'
import { applyCollectionValidity, ValueState } from './value-state'

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

describe('applyCollectionValidity', () => {
  function recorder() {
    const calls: { flags: ValidityStateFlags; message?: string }[] = []
    return {
      calls,
      internals: {
        setValidity(flags: ValidityStateFlags, message?: string) {
          calls.push({ flags, message })
        },
      } as unknown as ElementInternals,
    }
  }

  it('reports a required control with nothing selected as missing', () => {
    const { calls, internals } = recorder()

    applyCollectionValidity(internals, { disabled: false, required: true, values: [] })

    expect(calls).toEqual([{ flags: { valueMissing: true }, message: 'Please select an option.' }])
  })

  it('clears validity once the control carries a value', () => {
    const { calls, internals } = recorder()

    applyCollectionValidity(internals, { disabled: false, required: true, values: ['draft'] })

    expect(calls[0]?.flags).toEqual({})
  })

  it('lets a custom error outrank the constraint the element would report itself', () => {
    const { calls, internals } = recorder()

    applyCollectionValidity(internals, {
      customError: 'That workspace is taken.',
      disabled: false,
      required: true,
      values: [],
    })

    expect(calls).toEqual([{ flags: { customError: true }, message: 'That workspace is taken.' }])
  })

  it('applies a custom error to a control that is otherwise perfectly valid', () => {
    const { calls, internals } = recorder()

    applyCollectionValidity(internals, {
      customError: 'That workspace is taken.',
      disabled: false,
      required: false,
      values: ['acme'],
    })

    expect(calls[0]?.flags).toEqual({ customError: true })
  })

  it('reports nothing for a disabled control, which submits nothing either way', () => {
    const { calls, internals } = recorder()

    applyCollectionValidity(internals, { disabled: true, required: true, values: [] })

    expect(calls[0]?.flags).toEqual({})
  })
})
