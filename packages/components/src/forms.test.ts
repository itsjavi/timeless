import { describe, expect, it } from 'vitest'
import {
  choiceGroupOrientations,
  fieldLayouts,
  formControlSizes,
  formDensities,
  isChoiceGroupOrientation,
  isFieldLayout,
  isFormControlSize,
  isFormDensity,
} from './forms'

describe('form primitive contracts', () => {
  it('validates public form token values', () => {
    expect(formControlSizes).toContain('lg')
    expect(fieldLayouts).toContain('inline')
    expect(formDensities).toContain('spacious')
    expect(choiceGroupOrientations).toContain('horizontal')
    expect(isFormControlSize('sm')).toBe(true)
    expect(isFormControlSize('xl')).toBe(false)
    expect(isFieldLayout('stacked')).toBe(true)
    expect(isFieldLayout('grid')).toBe(false)
    expect(isFormDensity('compact')).toBe(true)
    expect(isFormDensity('dense')).toBe(false)
    expect(isChoiceGroupOrientation('vertical')).toBe(true)
    expect(isChoiceGroupOrientation('inline')).toBe(false)
  })
})
