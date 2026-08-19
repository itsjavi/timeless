/** Permitted values for `ui-hover-card` `variant`. */
export const hoverCardVariants = ['tooltip'] as const
export type HoverCardVariant = (typeof hoverCardVariants)[number]
