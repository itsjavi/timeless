/** Permitted values for `ui-select` `align` and `ui-combobox` `align`. */
export const collectionAlignments = ['start', 'end'] as const
export type CollectionAlignment = (typeof collectionAlignments)[number]

/** Permitted values for `ui-select` `filter` and `ui-combobox` `filter`. */
export const optionFilterModes = ['contains', 'starts-with', 'off'] as const
export type OptionFilterMode = (typeof optionFilterModes)[number]
