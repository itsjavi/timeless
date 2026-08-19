/** Permitted values for `ui-alert` `data-ui-variant`. */
export const alertVariants = ['neutral', 'accent', 'success', 'warning', 'danger'] as const
export type AlertVariant = (typeof alertVariants)[number]

/** Permitted values for `ui-spinner` `data-ui-variant`. */
export const spinnerVariants = ['neutral', 'accent', 'success', 'warning', 'danger'] as const
export type SpinnerVariant = (typeof spinnerVariants)[number]

/** Permitted values for `ui-badge` `data-ui-variant`. */
export const badgeVariants = [
  'neutral',
  'accent',
  'success',
  'warning',
  'danger',
  'outline',
] as const
export type BadgeVariant = (typeof badgeVariants)[number]

/** Permitted values for `ui-avatar` `data-ui-shape`. */
export const avatarShapes = ['circle', 'rounded', 'square'] as const
export type AvatarShape = (typeof avatarShapes)[number]

/** Permitted values for `ui-avatar` `data-ui-status`. */
export const avatarStatuses = ['online', 'away', 'busy', 'offline'] as const
export type AvatarStatus = (typeof avatarStatuses)[number]

/** Permitted values for `ui-card` `data-ui-variant`. */
export const cardVariants = ['surface', 'filled', 'ghost'] as const
export type CardVariant = (typeof cardVariants)[number]

/** Permitted values for `ui-link` `data-ui-variant`. */
export const linkVariants = ['default', 'muted', 'danger'] as const
export type LinkVariant = (typeof linkVariants)[number]

/** Permitted values for `ui-list` `data-ui-variant`. */
export const listVariants = ['plain', 'divided', 'inset', 'ordered'] as const
export type ListVariant = (typeof listVariants)[number]

/** Permitted values for `ui-separator` `data-ui-variant`. */
export const separatorVariants = ['default', 'strong', 'centered'] as const
export type SeparatorVariant = (typeof separatorVariants)[number]

/** Permitted values for `ui-separator` `data-ui-orientation`. */
export const separatorOrientations = ['horizontal', 'vertical'] as const
export type SeparatorOrientation = (typeof separatorOrientations)[number]

/** Permitted values for `ui-skeleton` `data-ui-shape`. */
export const skeletonShapes = ['text', 'circle', 'media'] as const
export type SkeletonShape = (typeof skeletonShapes)[number]

/** Permitted values for `ui-skeleton` `data-ui-width`. */
export const skeletonWidths = ['full', 'medium', 'short'] as const
export type SkeletonWidth = (typeof skeletonWidths)[number]

/** Permitted values for `ui-group` `data-ui-orientation`. */
export const groupOrientations = ['horizontal', 'vertical'] as const
export type GroupOrientation = (typeof groupOrientations)[number]

/** Permitted values for `ui-avatar` `data-ui-size`, `ui-badge` `data-ui-size`, `ui-skeleton` `data-ui-size`, `ui-progress` `data-ui-size` and `ui-spinner` `data-ui-size`. */
export const primitiveSizes = ['sm', 'md', 'lg'] as const
export type PrimitiveSize = (typeof primitiveSizes)[number]

/** Permitted values for `ui-group` `data-ui-density` and `ui-empty` `data-ui-density`. */
export const primitiveDensities = ['compact', 'normal', 'spacious'] as const
export type PrimitiveDensity = (typeof primitiveDensities)[number]

/** Permitted values for `ui-alert` `data-ui-density`, `ui-card` `data-ui-density`, `ui-progress` `data-ui-density`, `ui-list` `data-ui-density`, `ui-table` `data-ui-density`, `ui-disclosure` `data-ui-density` and `ui-collapsible` `data-ui-density`. */
export const compactDensities = ['compact', 'normal'] as const
export type CompactDensity = (typeof compactDensities)[number]

/** Permitted values for `ui-table` `data-ui-align`. */
export const tableAlignments = ['start', 'end'] as const
export type TableAlignment = (typeof tableAlignments)[number]
