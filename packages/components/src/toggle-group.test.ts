import { describe, expect, it, vi } from 'vitest'
import {
  activateToggleButton,
  pressedToggleValues,
  syncToggleGroupSelection,
  type ToggleButtonLike,
} from './toggle-group'

function button(value: string, pressed = false, disabled = false): ToggleButtonLike {
  const attributes = new Map<string, string>([
    ['value', value],
    ['aria-pressed', String(pressed)],
  ])
  if (disabled) attributes.set('disabled', '')
  return {
    focus: vi.fn(),
    getAttribute: (name) => attributes.get(name) ?? null,
    hasAttribute: (name) => attributes.has(name),
    matches: () => false,
    removeAttribute: (name) => attributes.delete(name),
    setAttribute: (name, next) => attributes.set(name, next),
  }
}

describe('toggle group selection', () => {
  it('normalizes conflicting single selections to the first pressed item', () => {
    const buttons = [button('left', true), button('center', true), button('right')]

    expect(syncToggleGroupSelection(buttons, 'single')).toBe(0)
    expect(pressedToggleValues(buttons)).toEqual(['left'])
    expect(buttons.map((item) => item.getAttribute('tabindex'))).toEqual(['0', '-1', '-1'])
  })

  it('allows an empty initial single selection and selects exactly one item after activation', () => {
    const buttons = [button('left'), button('center'), button('right')]
    syncToggleGroupSelection(buttons, 'single')
    activateToggleButton(buttons, 1, 'single')

    expect(pressedToggleValues(buttons)).toEqual(['center'])
  })

  it('toggles multiple selection independently and ignores disabled items', () => {
    const buttons = [button('bold'), button('italic', false, true), button('underline')]
    activateToggleButton(buttons, 0, 'multiple')
    activateToggleButton(buttons, 1, 'multiple')
    activateToggleButton(buttons, 2, 'multiple')

    expect(pressedToggleValues(buttons)).toEqual(['bold', 'underline'])
  })
})
