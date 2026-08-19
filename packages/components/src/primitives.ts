import {
  alertVariants,
  avatarShapes,
  avatarStatuses,
  badgeVariants,
  cardVariants,
  compactDensities,
  groupOrientations,
  linkVariants,
  listVariants,
  primitiveDensities,
  primitiveSizes,
  separatorOrientations,
  separatorVariants,
  skeletonShapes,
  skeletonWidths,
  spinnerVariants,
  tableAlignments,
} from './values/primitives'
import type {
  AlertVariant,
  AvatarShape,
  AvatarStatus,
  BadgeVariant,
  CardVariant,
  CompactDensity,
  GroupOrientation,
  LinkVariant,
  ListVariant,
  PrimitiveDensity,
  PrimitiveSize,
  SeparatorOrientation,
  SeparatorVariant,
  SkeletonShape,
  SkeletonWidth,
  SpinnerVariant,
  TableAlignment,
} from './values/primitives'

export {
  alertVariants,
  avatarShapes,
  avatarStatuses,
  badgeVariants,
  cardVariants,
  compactDensities,
  groupOrientations,
  linkVariants,
  listVariants,
  primitiveDensities,
  primitiveSizes,
  separatorOrientations,
  separatorVariants,
  skeletonShapes,
  skeletonWidths,
  spinnerVariants,
  tableAlignments,
  type AlertVariant,
  type AvatarShape,
  type AvatarStatus,
  type BadgeVariant,
  type CardVariant,
  type CompactDensity,
  type GroupOrientation,
  type LinkVariant,
  type ListVariant,
  type PrimitiveDensity,
  type PrimitiveSize,
  type SeparatorOrientation,
  type SeparatorVariant,
  type SkeletonShape,
  type SkeletonWidth,
  type SpinnerVariant,
  type TableAlignment,
}

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

export function isCompactDensity(value: string): value is CompactDensity {
  return compactDensities.includes(value as CompactDensity)
}

export function isTableAlignment(value: string): value is TableAlignment {
  return tableAlignments.includes(value as TableAlignment)
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
