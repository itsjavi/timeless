export const alertVariants = ['neutral', 'accent', 'success', 'warning', 'danger'] as const
export type AlertVariant = (typeof alertVariants)[number]

export const avatarShapes = ['circle', 'rounded', 'square'] as const
export type AvatarShape = (typeof avatarShapes)[number]

export const avatarStatuses = ['online', 'away', 'busy', 'offline'] as const
export type AvatarStatus = (typeof avatarStatuses)[number]

export const badgeVariants = [
  'neutral',
  'accent',
  'success',
  'warning',
  'danger',
  'outline',
] as const
export type BadgeVariant = (typeof badgeVariants)[number]

export const primitiveSizes = ['sm', 'md', 'lg'] as const
export type PrimitiveSize = (typeof primitiveSizes)[number]

export const separatorOrientations = ['horizontal', 'vertical'] as const
export type SeparatorOrientation = (typeof separatorOrientations)[number]

export const separatorVariants = ['default', 'strong', 'centered'] as const
export type SeparatorVariant = (typeof separatorVariants)[number]

export const cardVariants = ['surface', 'filled', 'ghost'] as const
export type CardVariant = (typeof cardVariants)[number]

export const skeletonShapes = ['text', 'circle', 'media'] as const
export type SkeletonShape = (typeof skeletonShapes)[number]

export const skeletonWidths = ['full', 'medium', 'short'] as const
export type SkeletonWidth = (typeof skeletonWidths)[number]

export const groupOrientations = ['horizontal', 'vertical'] as const
export type GroupOrientation = (typeof groupOrientations)[number]

export const primitiveDensities = ['compact', 'normal', 'spacious'] as const
export type PrimitiveDensity = (typeof primitiveDensities)[number]

export const listVariants = ['plain', 'divided', 'inset', 'ordered'] as const
export type ListVariant = (typeof listVariants)[number]

export const linkVariants = ['default', 'muted', 'danger'] as const
export type LinkVariant = (typeof linkVariants)[number]

export const spinnerVariants = ['neutral', 'accent', 'success', 'warning', 'danger'] as const
export type SpinnerVariant = (typeof spinnerVariants)[number]

export function isAlertVariant(value: string): value is AlertVariant {
  return alertVariants.includes(value as AlertVariant)
}

export function isAvatarShape(value: string): value is AvatarShape {
  return avatarShapes.includes(value as AvatarShape)
}

export function isAvatarStatus(value: string): value is AvatarStatus {
  return avatarStatuses.includes(value as AvatarStatus)
}

export function isBadgeVariant(value: string): value is BadgeVariant {
  return badgeVariants.includes(value as BadgeVariant)
}

export function isPrimitiveSize(value: string): value is PrimitiveSize {
  return primitiveSizes.includes(value as PrimitiveSize)
}

export function isSeparatorOrientation(value: string): value is SeparatorOrientation {
  return separatorOrientations.includes(value as SeparatorOrientation)
}

export function isSeparatorVariant(value: string): value is SeparatorVariant {
  return separatorVariants.includes(value as SeparatorVariant)
}

export function isCardVariant(value: string): value is CardVariant {
  return cardVariants.includes(value as CardVariant)
}

export function isSkeletonShape(value: string): value is SkeletonShape {
  return skeletonShapes.includes(value as SkeletonShape)
}

export function isSkeletonWidth(value: string): value is SkeletonWidth {
  return skeletonWidths.includes(value as SkeletonWidth)
}

export function isGroupOrientation(value: string): value is GroupOrientation {
  return groupOrientations.includes(value as GroupOrientation)
}

export function isPrimitiveDensity(value: string): value is PrimitiveDensity {
  return primitiveDensities.includes(value as PrimitiveDensity)
}

export function isListVariant(value: string): value is ListVariant {
  return listVariants.includes(value as ListVariant)
}

export function isLinkVariant(value: string): value is LinkVariant {
  return linkVariants.includes(value as LinkVariant)
}

export function isSpinnerVariant(value: string): value is SpinnerVariant {
  return spinnerVariants.includes(value as SpinnerVariant)
}
