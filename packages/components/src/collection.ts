export type CollectionOrientation = 'horizontal' | 'vertical' | 'both'
export type CollectionDirection = 1 | -1
export type CollectionMatchMode = 'contains' | 'prefix'

export type CollectionMatcherOptions = {
  readonly locale?: string | readonly string[]
  readonly mode?: CollectionMatchMode
}

export type GridNavigationResult = {
  readonly column: number
  readonly index: number
}

export type CollectionItemLike = {
  readonly textContent?: string | null
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  matches?(selector: string): boolean
  setAttribute(name: string, value: string): void
}

export function collectionNavigationTarget(
  items: readonly CollectionItemLike[],
  currentIndex: number,
  key: string,
  orientation: CollectionOrientation,
): number | null {
  if (key === 'Home') return firstEnabledCollectionItemIndex(items)
  if (key === 'End') return lastEnabledCollectionItemIndex(items)

  if ((orientation === 'vertical' || orientation === 'both') && key === 'ArrowDown') {
    return adjacentEnabledCollectionItemIndex(items, currentIndex, 1)
  }
  if ((orientation === 'vertical' || orientation === 'both') && key === 'ArrowUp') {
    return adjacentEnabledCollectionItemIndex(items, currentIndex, -1)
  }
  if ((orientation === 'horizontal' || orientation === 'both') && key === 'ArrowRight') {
    return adjacentEnabledCollectionItemIndex(items, currentIndex, 1)
  }
  if ((orientation === 'horizontal' || orientation === 'both') && key === 'ArrowLeft') {
    return adjacentEnabledCollectionItemIndex(items, currentIndex, -1)
  }

  return null
}

export function syncRovingTabIndex(
  items: readonly CollectionItemLike[],
  activeIndex: number | null,
): number | null {
  const resolvedIndex =
    activeIndex !== null &&
    activeIndex >= 0 &&
    activeIndex < items.length &&
    !isCollectionItemDisabled(items[activeIndex]!)
      ? activeIndex
      : firstEnabledCollectionItemIndex(items)

  items.forEach((item, index) => {
    item.setAttribute('tabindex', index === resolvedIndex ? '0' : '-1')
  })

  return resolvedIndex
}

export function firstEnabledCollectionItemIndex(
  items: readonly CollectionItemLike[],
): number | null {
  const index = items.findIndex((item) => !isCollectionItemDisabled(item))
  return index >= 0 ? index : null
}

export function lastEnabledCollectionItemIndex(
  items: readonly CollectionItemLike[],
): number | null {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (!isCollectionItemDisabled(items[index]!)) {
      return index
    }
  }
  return null
}

export function adjacentEnabledCollectionItemIndex(
  items: readonly CollectionItemLike[],
  currentIndex: number,
  direction: CollectionDirection,
): number | null {
  if (items.length === 0 || firstEnabledCollectionItemIndex(items) === null) {
    return null
  }

  let index = currentIndex
  for (let offset = 0; offset < items.length; offset += 1) {
    index = (index + direction + items.length) % items.length
    if (!isCollectionItemDisabled(items[index]!)) {
      return index
    }
  }

  return null
}

export function findCollectionItemByTextPrefix(
  items: readonly CollectionItemLike[],
  search: string,
  currentIndex = -1,
): number | null {
  const normalizedSearch = normalizeCollectionText(search)
  if (!normalizedSearch || items.length === 0) {
    return null
  }

  for (let offset = 1; offset <= items.length; offset += 1) {
    const index = (currentIndex + offset + items.length) % items.length
    const item = items[index]!
    if (
      !isCollectionItemDisabled(item) &&
      collectionTextMatches(collectionItemText(item), normalizedSearch, { mode: 'prefix' })
    ) {
      return index
    }
  }

  return null
}

export function collectionItemText(item: CollectionItemLike): string {
  return normalizeCollectionText(item.getAttribute('aria-label') ?? item.textContent ?? '')
}

/**
 * The idle window after which a typeahead buffer empties.
 *
 * Listbox, Select, and Menu had each settled on 700ms independently. A debounce window is exactly
 * the value that drifts unnoticed once there is more than one of it, so there is one.
 */
export const COLLECTION_TYPEAHEAD_RESET_MS = 700

export type CollectionTypeaheadEventLike = {
  readonly key: string
  readonly altKey: boolean
  readonly ctrlKey: boolean
  readonly metaKey: boolean
}

/**
 * Whether a key event is the printable character the APG's typeahead behavior consumes.
 *
 * Shift is deliberately not a disqualifier: `Shift+A` produces a printable `A`, and an option named
 * "Apple" is what the user is reaching for. Every other modifier means the key belongs to a
 * shortcut, not to a search.
 */
export function isCollectionTypeaheadEvent(event: CollectionTypeaheadEventLike): boolean {
  return event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey
}

/** The `setTimeout`/`clearTimeout` pair a window provides, as a structural type. */
export type CollectionTypeaheadTimers = {
  setTimeout(handler: () => void, timeout: number): number
  clearTimeout(handle: number): void
}

export type CollectionTypeahead = {
  /** Appends the typed character, restarts the idle window, and returns the buffer. */
  push(key: string): string
  /** Empties the buffer and cancels the idle window. */
  clear(): void
  readonly value: string
}

/**
 * A distinct non-zero handle for a collection with no window to schedule against, so `clear()`
 * still behaves as it would with a real timer.
 */
let typeaheadTimerFallback = 0

/**
 * The typeahead buffer and its clock, shared by every surface that types to navigate.
 *
 * What a surface does with the buffer is policy and stays at the call site: Listbox moves the roving
 * focus, a closed Select selects the match without opening, Menu resolves against menu-item text.
 * What had been copied three times is this — the string that accumulates and the timer that empties
 * it — and three copies is how the predicate came to disagree about Shift.
 *
 * `resolveTimers` is called per operation rather than captured, because an element can be adopted
 * into another document between one keystroke and the next.
 */
export function createCollectionTypeahead(
  resolveTimers: () => CollectionTypeaheadTimers | null | undefined,
): CollectionTypeahead {
  let buffer = ''
  let timer = 0

  const cancel = (): void => {
    if (!timer) return
    resolveTimers()?.clearTimeout(timer)
    timer = 0
  }

  const clear = (): void => {
    cancel()
    buffer = ''
  }

  return {
    push(key) {
      buffer += key
      cancel()
      const timers = resolveTimers()
      timer = timers
        ? timers.setTimeout(clear, COLLECTION_TYPEAHEAD_RESET_MS)
        : ++typeaheadTimerFallback
      return buffer
    },
    clear,
    get value() {
      return buffer
    },
  }
}

export function collectionTextMatches(
  candidate: string,
  search: string,
  options: CollectionMatcherOptions = {},
): boolean {
  const normalizedCandidate = normalizeCollectionText(candidate, options.locale)
  const normalizedSearch = normalizeCollectionText(search, options.locale)
  if (!normalizedSearch) return true

  const collator = collectionCollator(options.locale)
  const candidatePoints = Array.from(normalizedCandidate)
  const searchPoints = Array.from(normalizedSearch)
  const mode = options.mode ?? 'contains'
  const lastStart = mode === 'prefix' ? 0 : candidatePoints.length - searchPoints.length

  for (let start = 0; start <= lastStart; start += 1) {
    const segment = candidatePoints.slice(start, start + searchPoints.length).join('')
    if (collator.compare(segment, normalizedSearch) === 0) return true
  }
  return false
}

export function gridCollectionNavigationTarget(
  items: readonly CollectionItemLike[],
  currentIndex: number,
  key: string,
  columns: number,
  retainedColumn = Math.max(0, currentIndex % Math.max(1, columns)),
): GridNavigationResult | null {
  if (items.length === 0 || columns < 1) return null

  const row = Math.max(0, Math.floor(currentIndex / columns))
  const rowStart = row * columns
  const rowEnd = Math.min(items.length - 1, rowStart + columns - 1)
  let candidate: number | null = null
  let direction: CollectionDirection = 1

  if (key === 'ArrowLeft') {
    candidate = currentIndex - 1
    direction = -1
  } else if (key === 'ArrowRight') {
    candidate = currentIndex + 1
  } else if (key === 'ArrowUp') {
    candidate = currentIndex - columns
    direction = -1
  } else if (key === 'ArrowDown') {
    const nextRowStart = (row + 1) * columns
    candidate = Math.min(nextRowStart + retainedColumn, items.length - 1)
  } else if (key === 'Home') {
    candidate = rowStart
  } else if (key === 'End') {
    candidate = rowEnd
    direction = -1
  } else if (key === 'PageUp') {
    candidate = Math.min(retainedColumn, items.length - 1)
    direction = -1
  } else if (key === 'PageDown') {
    const lastRowStart = Math.floor((items.length - 1) / columns) * columns
    candidate = Math.min(lastRowStart + retainedColumn, items.length - 1)
    direction = -1
  }

  if (candidate === null || candidate < 0 || candidate >= items.length) return null
  while (
    candidate >= 0 &&
    candidate < items.length &&
    isCollectionItemDisabled(items[candidate]!)
  ) {
    candidate += direction
  }
  if (candidate < 0 || candidate >= items.length) return null

  return { index: candidate, column: retainedColumn }
}

export function isCollectionItemDisabled(item: CollectionItemLike): boolean {
  return (
    item.hasAttribute('disabled') ||
    item.getAttribute('aria-disabled') === 'true' ||
    item.hasAttribute('data-disabled') ||
    itemMatches(item, ':disabled')
  )
}

export function resolveCollectionOrientation(
  value: string | null,
  fallback: CollectionOrientation = 'vertical',
): CollectionOrientation {
  if (value === 'horizontal' || value === 'vertical' || value === 'both') {
    return value
  }
  return fallback
}

const collators = new Map<string, Intl.Collator>()

function collectionCollator(locale?: string | readonly string[]): Intl.Collator {
  const locales = locale === undefined ? [] : typeof locale === 'string' ? [locale] : [...locale]
  const key = locales.join('\u0000') || 'default'
  let collator = collators.get(key)
  if (!collator) {
    collator = new Intl.Collator(locales.length > 0 ? locales : undefined, {
      sensitivity: 'base',
      usage: 'search',
    })
    collators.set(key, collator)
  }
  return collator
}

function normalizeCollectionText(value: string, locale?: string | readonly string[]): string {
  const locales =
    locale === undefined ? undefined : typeof locale === 'string' ? locale : [...locale]
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase(locales).normalize('NFC')
}

function itemMatches(item: CollectionItemLike, selector: string): boolean {
  try {
    return item.matches?.(selector) === true
  } catch {
    return false
  }
}
