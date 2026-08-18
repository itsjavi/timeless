import { describe, expect, it } from 'vitest'
import {
  alertVariants,
  avatarShapes,
  avatarStatuses,
  badgeVariants,
  isAlertVariant,
  isAvatarShape,
  isAvatarStatus,
  isBadgeVariant,
  isCardVariant,
  isGroupOrientation,
  isLinkVariant,
  isListVariant,
  isPrimitiveDensity,
  isPrimitiveSize,
  isSeparatorOrientation,
  isSeparatorVariant,
  isSkeletonShape,
  isSkeletonWidth,
  isSpinnerVariant,
  separatorVariants,
  spinnerVariants,
} from './primitives'

describe('primitive contracts', () => {
  it('validates public primitive token values', () => {
    expect(alertVariants).toContain('danger')
    expect(avatarShapes).toContain('rounded')
    expect(avatarStatuses).toContain('online')
    expect(badgeVariants).toContain('accent')
    expect(spinnerVariants).toContain('accent')
    expect(separatorVariants).toContain('centered')
    expect(isAlertVariant('warning')).toBe(true)
    expect(isAlertVariant('info')).toBe(false)
    expect(isAvatarShape('square')).toBe(true)
    expect(isAvatarShape('pill')).toBe(false)
    expect(isAvatarStatus('busy')).toBe(true)
    expect(isAvatarStatus('active')).toBe(false)
    expect(isBadgeVariant('success')).toBe(true)
    expect(isBadgeVariant('info')).toBe(false)
    expect(isPrimitiveSize('lg')).toBe(true)
    expect(isPrimitiveSize('xl')).toBe(false)
    expect(isSeparatorOrientation('vertical')).toBe(true)
    expect(isSeparatorVariant('centered')).toBe(true)
    expect(isSeparatorVariant('inline')).toBe(false)
    expect(isCardVariant('filled')).toBe(true)
    expect(isSkeletonShape('media')).toBe(true)
    expect(isSkeletonWidth('short')).toBe(true)
    expect(isGroupOrientation('vertical')).toBe(true)
    expect(isPrimitiveDensity('spacious')).toBe(true)
    expect(isListVariant('ordered')).toBe(true)
    expect(isLinkVariant('muted')).toBe(true)
    expect(isSpinnerVariant('danger')).toBe(true)
    expect(isSpinnerVariant('loading')).toBe(false)
  })
})
