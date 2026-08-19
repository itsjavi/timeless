/** Permitted values for `ui-toaster` `placement`. */
export const toasterPlacements = [
  'top-start',
  'top-center',
  'top-end',
  'bottom-start',
  'bottom-center',
  'bottom-end',
] as const
export type ToasterPlacement = (typeof toasterPlacements)[number]

/** Permitted values for `ui-toaster` `stack`. */
export const toasterStacks = ['overlap', 'list'] as const
export type ToasterStack = (typeof toasterStacks)[number]
