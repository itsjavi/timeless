import { describe, expect, it } from 'vitest'
import {
  checkedChoiceValues,
  enhanceCheckboxGroupParts,
  enhanceRadioGroupParts,
  resolveChoiceGroupOrientation,
  syncRadioGroupValue,
  type ChoiceInputLike,
} from './choice-group'

class FakeChoiceInput implements ChoiceInputLike {
  checked = false
  readonly attributes = new Map<string, string>()

  constructor(readonly value: string) {}

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name)
  }

  matches(selector: string): boolean {
    return selector === ':disabled' && this.hasAttribute('disabled')
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name)
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }
}

describe('choice group helpers', () => {
  it('enhances radio groups with native checked state and roving focus', () => {
    const host = new FakeChoiceInput('')
    const inputs = [
      new FakeChoiceInput('daily'),
      new FakeChoiceInput('weekly'),
      new FakeChoiceInput('monthly'),
    ]

    const result = enhanceRadioGroupParts(
      { host, inputs },
      { orientation: 'horizontal', value: 'weekly' },
    )

    expect(result).toEqual({ status: 'enhanced', checkedIndex: 1, value: 'weekly' })
    expect(host.getAttribute('role')).toBe('radiogroup')
    expect(host.getAttribute('aria-orientation')).toBe('horizontal')
    expect(host.getAttribute('value')).toBeNull()
    expect(inputs.map((input) => input.checked)).toEqual([false, true, false])
    expect(inputs.map((input) => input.getAttribute('tabindex'))).toEqual(['-1', '0', '-1'])
  })

  it('skips disabled radios when syncing a missing value', () => {
    const host = new FakeChoiceInput('')
    const inputs = [new FakeChoiceInput('daily'), new FakeChoiceInput('weekly')]
    inputs[0]!.setAttribute('disabled', '')

    expect(syncRadioGroupValue({ host, inputs }, 'missing')).toBe(1)
    expect(inputs.map((input) => input.checked)).toEqual([false, true])
  })

  it('enhances checkbox groups without replacing native checkbox tab stops', () => {
    const host = new FakeChoiceInput('')
    const inputs = [
      new FakeChoiceInput('email'),
      new FakeChoiceInput('push'),
      new FakeChoiceInput('sms'),
    ]
    inputs[0]!.checked = true
    inputs[2]!.checked = true

    expect(enhanceCheckboxGroupParts({ host, inputs }, { orientation: 'vertical' })).toEqual({
      status: 'enhanced',
      values: ['email', 'sms'],
    })
    expect(host.getAttribute('role')).toBe('group')
    expect(inputs.map((input) => input.getAttribute('tabindex'))).toEqual([null, null, null])
  })

  it('returns checked values and resolves orientations', () => {
    const inputs = [new FakeChoiceInput('email'), new FakeChoiceInput('push')]
    inputs[0]!.checked = true
    inputs[1]!.checked = true
    inputs[1]!.setAttribute('disabled', '')

    expect(checkedChoiceValues(inputs)).toEqual(['email'])
    expect(resolveChoiceGroupOrientation(null)).toBe('vertical')
    expect(resolveChoiceGroupOrientation('horizontal')).toBe('horizontal')
    expect(resolveChoiceGroupOrientation('both')).toBe('vertical')
  })
})
