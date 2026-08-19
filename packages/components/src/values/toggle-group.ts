/** Permitted values for `ui-toggle-group` `orientation`. */
export const toggleGroupOrientations = ['horizontal', 'vertical'] as const
export type ToggleGroupOrientation = (typeof toggleGroupOrientations)[number]

/** Permitted values for `ui-toggle-group` `selection`. */
export const toggleGroupSelections = ['single', 'multiple'] as const
export type ToggleGroupSelection = (typeof toggleGroupSelections)[number]
