import {
  choiceGroupOrientations,
  fieldLayouts,
  formControlSizes,
  formDensities,
} from './values/forms'
import type {
  ChoiceGroupOrientation,
  FieldLayout,
  FormControlSize,
  FormDensity,
} from './values/forms'

export {
  choiceGroupOrientations,
  fieldLayouts,
  formControlSizes,
  formDensities,
  type ChoiceGroupOrientation,
  type FieldLayout,
  type FormControlSize,
  type FormDensity,
}

export function isFormControlSize(value: string): value is FormControlSize {
  return formControlSizes.includes(value as FormControlSize)
}

export function isFieldLayout(value: string): value is FieldLayout {
  return fieldLayouts.includes(value as FieldLayout)
}

export function isFormDensity(value: string): value is FormDensity {
  return formDensities.includes(value as FormDensity)
}

export function isChoiceGroupOrientation(value: string): value is ChoiceGroupOrientation {
  return choiceGroupOrientations.includes(value as ChoiceGroupOrientation)
}
