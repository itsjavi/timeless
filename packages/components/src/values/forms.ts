/** Permitted values for `ui-input` `data-ui-size`, `ui-textarea` `data-ui-size`, `ui-select` `data-ui-size` and `ui-range` `data-ui-size`. */
export const formControlSizes = ['sm', 'md', 'lg'] as const
export type FormControlSize = (typeof formControlSizes)[number]

/** Permitted values for `ui-field` `data-ui-layout`. */
export const fieldLayouts = ['stacked', 'inline'] as const
export type FieldLayout = (typeof fieldLayouts)[number]

/** Permitted values for `ui-field` `data-ui-density`, `ui-fieldset` `data-ui-density`, `ui-choice` `data-ui-density` and `ui-choice-group` `data-ui-density`. */
export const formDensities = ['compact', 'normal', 'spacious'] as const
export type FormDensity = (typeof formDensities)[number]

/** Permitted values for `ui-choice-group` `data-ui-orientation`, `ui-radio-group` `orientation` and `ui-checkbox-group` `orientation`. */
export const choiceGroupOrientations = ['vertical', 'horizontal'] as const
export type ChoiceGroupOrientation = (typeof choiceGroupOrientations)[number]
