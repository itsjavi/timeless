import { describe, expect, it } from 'vitest'
import { isButtonSize, isButtonVariant } from './button'

describe('button contract', () => {
  it('validates public variant and size tokens', () => {
    expect(isButtonVariant('primary')).toBe(true)
    expect(isButtonVariant('outline')).toBe(true)
    expect(isButtonVariant('danger-outline')).toBe(true)
    expect(isButtonVariant('link')).toBe(true)
    expect(isButtonVariant('destructive')).toBe(false)
    expect(isButtonSize('md')).toBe(true)
    expect(isButtonSize('xl')).toBe(false)
  })
})
