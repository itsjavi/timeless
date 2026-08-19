/** Permitted values for `ui-popover` `placement`, `ui-hover-card` `placement`, `ui-menu-button` `placement` and `ui-select` `placement`. */
export const floatingPlacements = ['bottom', 'top', 'right', 'left'] as const
export type FloatingPlacement = (typeof floatingPlacements)[number]
