export const formControlSizes = ['sm', 'md', 'lg'] as const
export type FormControlSize = (typeof formControlSizes)[number]

export const fieldLayouts = ['stacked', 'inline'] as const
export type FieldLayout = (typeof fieldLayouts)[number]

export const formDensities = ['compact', 'normal', 'spacious'] as const
export type FormDensity = (typeof formDensities)[number]

export const choiceGroupOrientations = ['vertical', 'horizontal'] as const
export type ChoiceGroupOrientation = (typeof choiceGroupOrientations)[number]

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
