/**
 * The option layer shared by Listbox, Select, and Combobox.
 *
 * `collection.ts` already owns keyboard navigation, roving tabindex, the cached locale-aware
 * `Intl.Collator`, NFC normalisation, and the sliding-window contains/prefix compare. This module
 * builds the option-specific layer on top of it: how an option's filterable label is resolved, how
 * a filter mode maps onto the collection matcher, how options are discovered through group
 * wrappers, and how a page window is projected onto a long list.
 *
 * It deliberately adds no second collator and no second normalisation path. Filtering and typeahead
 * have to agree, and they only agree while they share one matcher.
 *
 * Every function takes structural `…Like` types rather than `HTMLElement`, the way `collection.ts`
 * and `toolbar.ts` do, so the whole module is unit-testable without a DOM.
 */

import {
  COLLECTION_TYPEAHEAD_RESET_MS,
  collectionTextMatches,
  isCollectionItemDisabled,
  type CollectionItemLike,
} from './collection'
import { queryOwnedParts } from './parts'
import { collectionAlignments, optionFilterModes } from './values/options'
import type { CollectionAlignment, OptionFilterMode } from './values/options'

export { collectionAlignments, optionFilterModes }
export type { CollectionAlignment, OptionFilterMode }

/**
 * Shared typeahead idle window, kept under its own name because it is a public export.
 * `collection.ts` owns the value now that Menu shares the same buffer.
 */
export const OPTION_TYPEAHEAD_RESET_MS = COLLECTION_TYPEAHEAD_RESET_MS

export const OPTION_SELECTOR = "[role='option']"
export const OPTION_GROUP_SELECTOR = "[data-ui-part~='group']"

/** Marks an option the pager hid, so a later page can un-hide it without clobbering the filter. */
const PAGED_ATTRIBUTE = 'data-ui-internal-paged'

export type OptionLike = CollectionItemLike & {
  hidden?: boolean | 'until-found'
  removeAttribute(name: string): void
}

export type OptionWindowOptions = {
  /** `off` hands visibility to the consumer: nothing is filtered and nothing is un-hidden. */
  readonly filter?: OptionFilterMode
  readonly locale?: string | readonly string[]
  readonly page?: number
  /** Absent or non-positive means unpaged. */
  readonly pageSize?: number
  readonly query?: string
}

export type OptionWindow<TOption> = {
  readonly page: number
  readonly totalPages: number
  readonly visible: readonly TOption[]
}

/**
 * The label an option is filtered and typed against.
 *
 * `label` and `data-ui-label` are author-supplied hooks for an option whose visible content is not
 * its searchable text — an avatar over two lines, say. Neither touches the accessible name, which
 * is what makes them usable: overriding `aria-label` to get a short filter key would rename the
 * option for assistive technology as a side effect.
 */
export function optionLabel(option: OptionLike): string {
  return (
    authoredLabel(option.getAttribute('label')) ??
    authoredLabel(option.getAttribute('data-ui-label')) ??
    authoredLabel(option.getAttribute('aria-label')) ??
    option.textContent?.trim() ??
    ''
  )
}

/**
 * The single matching entry point for both filtering and typeahead.
 *
 * `off` matches everything, because in that mode visibility belongs to the consumer and the
 * built-in matcher must not have an opinion.
 */
export function matchOption(
  option: OptionLike,
  query: string,
  mode: OptionFilterMode = 'contains',
  locale?: string | readonly string[],
): boolean {
  if (mode === 'off') return true
  return collectionTextMatches(optionLabel(option), query, {
    locale,
    mode: mode === 'starts-with' ? 'prefix' : 'contains',
  })
}

/**
 * Typeahead: the next enabled, visible option whose label starts with what was typed.
 *
 * This is `findCollectionItemByTextPrefix` re-expressed over `optionLabel`, so an option with an
 * authored `label` is typed against the label an author chose rather than its rendered text. It
 * wraps around, and it starts from the option after the current one so repeated presses advance.
 */
export function findOptionByPrefix<TOption extends OptionLike>(
  options: readonly TOption[],
  search: string,
  currentIndex = -1,
  locale?: string | readonly string[],
): number | null {
  if (!search.trim() || options.length === 0) return null

  for (let offset = 1; offset <= options.length; offset += 1) {
    const index = (currentIndex + offset + options.length) % options.length
    const option = options[index]!
    if (option.hidden || isCollectionItemDisabled(option)) continue
    if (matchOption(option, search, 'starts-with', locale)) return index
  }
  return null
}

/**
 * Every option the root owns, descending through group wrappers.
 *
 * `queryOwnedParts` walks the whole subtree and stops only at a nested component root, so an option
 * inside a `role="group"` is found while an option inside a nested `ui-listbox` is not.
 */
export function findOptions<TElement extends Element = HTMLElement>(root: Element): TElement[] {
  return queryOwnedParts<TElement>(root, OPTION_SELECTOR)
}

/** Every authored option group the root owns. */
export function findOptionGroups<TElement extends Element = HTMLElement>(
  root: Element,
): TElement[] {
  return queryOwnedParts<TElement>(root, OPTION_GROUP_SELECTOR)
}

export function visibleOptions<TOption extends OptionLike>(
  options: readonly TOption[],
): readonly TOption[] {
  return options.filter((option) => !option.hidden)
}

export function enabledOptions<TOption extends OptionLike>(
  options: readonly TOption[],
): readonly TOption[] {
  return options.filter((option) => !isCollectionItemDisabled(option))
}

/** Writes `hidden` from the query and returns what survived. */
export function applyOptionFilter<TOption extends OptionLike>(
  options: readonly TOption[],
  query: string,
  mode: OptionFilterMode = 'contains',
  locale?: string | readonly string[],
): readonly TOption[] {
  if (mode === 'off') return visibleOptions(options)

  const visible: TOption[] = []
  options.forEach((option) => {
    const matches = matchOption(option, query, mode, locale)
    // Assigning `hidden` an unchanged value still mutates the attribute, and every collection host
    // watches its own subtree for mutations. Comparing first is what stops the loop from feeding
    // itself on a long list.
    if (option.hidden !== !matches) option.hidden = !matches
    if (matches) visible.push(option)
  })
  return visible
}

/**
 * The page of options to render, computed over whatever set is handed in. Pure: it writes nothing.
 *
 * A non-positive `pageSize` means unpaged, which is one page holding everything. `page` is clamped
 * rather than rejected, so a stale page index after a filter narrows the list lands on the last
 * page instead of an empty surface.
 */
export function optionPageWindow<TOption>(
  options: readonly TOption[],
  pageSize: number,
  page = 0,
): OptionWindow<TOption> {
  if (!Number.isFinite(pageSize) || pageSize <= 0) {
    return { page: 0, totalPages: 1, visible: options }
  }

  const size = Math.floor(pageSize)
  const totalPages = Math.max(1, Math.ceil(options.length / size))
  const resolvedPage = Math.min(Math.max(0, Math.floor(page)), totalPages - 1)
  const start = resolvedPage * size

  return {
    page: resolvedPage,
    totalPages,
    visible: options.slice(start, start + size),
  }
}

/**
 * Filtering and paging in one pass, because both express themselves through `hidden` and a
 * two-pass version would have each clobber the other.
 *
 * Under `filter="off"` the consumer owns `hidden`, so nothing is un-hidden except what the pager
 * itself hid — which is what `data-ui-internal-paged` records. That is what lets consumer-owned
 * filtering keep navigation, the empty state, group collapse, and paging working unchanged.
 */
export function applyOptionWindow<TOption extends OptionLike>(
  options: readonly TOption[],
  windowOptions: OptionWindowOptions = {},
): OptionWindow<TOption> {
  const mode = windowOptions.filter ?? 'contains'
  // Under `off`, an option the pager hid is still part of the consumer's visible set.
  const matched =
    mode === 'off'
      ? options.filter((option) => !option.hidden || option.hasAttribute(PAGED_ATTRIBUTE))
      : applyOptionFilter(options, windowOptions.query ?? '', mode, windowOptions.locale)
  const paged = optionPageWindow(matched, windowOptions.pageSize ?? 0, windowOptions.page ?? 0)
  const inWindow = new Set<TOption>(paged.visible)

  matched.forEach((option) => {
    if (inWindow.has(option)) {
      if (option.hasAttribute(PAGED_ATTRIBUTE)) {
        option.removeAttribute(PAGED_ATTRIBUTE)
        option.hidden = false
      }
      return
    }
    if (option.hidden !== true) option.hidden = true
    if (!option.hasAttribute(PAGED_ATTRIBUTE)) option.setAttribute(PAGED_ATTRIBUTE, '')
  })

  return paged
}

function authoredLabel(value: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}
