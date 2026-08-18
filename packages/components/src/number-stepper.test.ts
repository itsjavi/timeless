import { describe, expect, it, vi } from 'vitest'
import { stepNumberInput } from './number-stepper'

describe('number stepper', () => {
  it('uses native number input stepping and emits native input and change events', () => {
    const dispatched: string[] = []
    const input = {
      disabled: false,
      readOnly: false,
      stepUp: vi.fn(),
      stepDown: vi.fn(),
      dispatchEvent: (event: Event) => {
        dispatched.push(event.type)
        return true
      },
    } as unknown as HTMLInputElement

    stepNumberInput(input, 1)
    stepNumberInput(input, -1)

    expect(input.stepUp).toHaveBeenCalledOnce()
    expect(input.stepDown).toHaveBeenCalledOnce()
    expect(dispatched).toEqual(['input', 'change', 'input', 'change'])
  })

  it('does not change disabled or readonly inputs', () => {
    const input = {
      disabled: true,
      readOnly: false,
      stepUp: vi.fn(),
      stepDown: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as HTMLInputElement

    stepNumberInput(input, 1)
    expect(input.stepUp).not.toHaveBeenCalled()
  })

  it('does not emit changes when native stepping rejects the configuration', () => {
    const input = {
      disabled: false,
      readOnly: false,
      stepUp: vi.fn(() => {
        throw new DOMException('Invalid step', 'InvalidStateError')
      }),
      stepDown: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as HTMLInputElement

    stepNumberInput(input, 1)
    expect(input.dispatchEvent).not.toHaveBeenCalled()
  })
})
