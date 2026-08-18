import { describe, expect, it } from 'vitest'
import { isSheetPositionValue, isTabsActivation, isTabsOrientation } from './overlays'

describe('overlay contracts', () => {
  it('validates public overlay values', () => {
    expect(isTabsOrientation('vertical')).toBe(true)
    expect(isTabsOrientation('inline')).toBe(false)
    expect(isTabsActivation('manual')).toBe(true)
    expect(isTabsActivation('lazy')).toBe(false)
    expect(isSheetPositionValue('left')).toBe(true)
    expect(isSheetPositionValue('center')).toBe(false)
  })
})
