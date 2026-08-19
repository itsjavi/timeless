/** Permitted values for `ui-color-picker` `format`. */
export const colorPickerFormats = [
  'oklch',
  'oklab',
  'lch',
  'lab',
  'hex',
  'rgb',
  'hsl',
  'hwb',
  'p3',
  'rec2020',
] as const
export type ColorPickerFormat = (typeof colorPickerFormats)[number]
