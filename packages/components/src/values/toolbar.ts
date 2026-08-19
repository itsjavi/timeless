/** Permitted values for `ui-toolbar` `orientation`. */
export const toolbarOrientations = ['horizontal', 'vertical'] as const
export type ToolbarOrientation = (typeof toolbarOrientations)[number]
