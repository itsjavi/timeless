/** Permitted values for `ui-dialog` `kind`. */
export const dialogKinds = ['dialog', 'alert'] as const
export type DialogKind = (typeof dialogKinds)[number]
