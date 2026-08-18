export type FocusTarget = {
  readonly isConnected?: boolean
  focus(options?: FocusOptions): void
}

export type FocusReturnOptions = {
  readonly fallback?: FocusTarget | null
  readonly preventScroll?: boolean
}

export const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function focusReturnTarget(target: unknown): FocusTarget | null {
  return isFocusTarget(target) ? target : null
}

export function canReturnFocus(target: FocusTarget | null | undefined): target is FocusTarget {
  return target !== null && target !== undefined && target.isConnected !== false
}

export function returnFocus(
  target: FocusTarget | null | undefined,
  options: FocusReturnOptions = {},
): boolean {
  const candidate = canReturnFocus(target)
    ? target
    : canReturnFocus(options.fallback)
      ? options.fallback
      : null

  if (!candidate) {
    return false
  }

  candidate.focus({ preventScroll: options.preventScroll ?? true })
  return true
}

export function focusFirst(
  root: ParentNode,
  options: FocusOptions = { preventScroll: true },
): boolean {
  const target = root.querySelector<HTMLElement>(focusableSelector)

  if (!target) {
    return false
  }

  target.focus(options)
  return true
}

function isFocusTarget(value: unknown): value is FocusTarget {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
    return false
  }

  return 'focus' in value && typeof value.focus === 'function'
}
