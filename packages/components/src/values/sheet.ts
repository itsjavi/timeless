/** Permitted values for `ui-sheet` `position`. */
export const sheetPositions = ['top', 'right', 'bottom', 'left'] as const
export type SheetPosition = (typeof sheetPositions)[number]
