/** Permitted values for `ui-menu` `orientation`. */
export const menuOrientations = ['horizontal', 'vertical'] as const
export type MenuOrientation = (typeof menuOrientations)[number]
