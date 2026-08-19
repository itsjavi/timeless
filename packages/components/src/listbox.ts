/**
 * The option-collection core.
 *
 * `ui-listbox` is the inline listbox a consumer can use on its own, and it is also the shared core
 * Select and Combobox compose. Everything about options — discovery through groups, selection,
 * the active highlight, typeahead, filtering, paging, the empty and status regions, and the pager —
 * is implemented once here and exported, so the two popover surfaces add a trigger and nothing else.
 *
 * Two invariants run through the whole file:
 *
 * - `aria-selected` is selection. It is written by the selection path and by nothing else. The
 *   *active* option — the one arrow keys are sitting on — is marked with `data-ui-internal-active`
 *   and named by `aria-activedescendant`. Conflating the two used to announce every option you
 *   arrowed past as selected and wipe the real selection, which also made `multiple` unimplementable.
 * - Visibility is the `hidden` attribute, whether it was set by the built-in filter, by the pager, or
 *   by a consumer under `filter="off"`. Everything downstream reads `hidden`, which is why
 *   consumer-owned filtering needs no adapter.
 */

import {
  attr,
  boolAttr,
  createId,
  createUIElementClass,
  element,
  listen,
  property,
  watch,
} from '@timelessui/core'
import {
  collectionNavigationTarget,
  isCollectionItemDisabled,
  syncRovingTabIndex,
} from './collection'
import {
  applyOptionWindow,
  findOptionByPrefix,
  findOptionGroups,
  findOptions,
  matchOption,
  optionLabel,
  optionPageWindow,
  OPTION_SELECTOR,
  OPTION_TYPEAHEAD_RESET_MS,
  visibleOptions,
  type OptionFilterMode,
  type OptionWindow,
} from './options'
import { queryOwnedPart } from './parts'
import { applyCollectionValidity, collectionFormValue } from './value-state'
import { transitionSourceFromEvent, type UITransitionDetail } from './events'

export type ListboxOptionLike = {
  id: string
  hidden?: boolean | 'until-found'
  readonly textContent?: string | null
  focus?(): void
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  matches?(selector: string): boolean
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type ListboxHostLike = {
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type ListboxControllerLike = {
  getAttribute(name: string): string | null
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type ListboxRegionLike = {
  id: string
  hidden?: boolean | 'until-found'
  textContent?: string | null
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  setAttribute(name: string, value: string): void
}

export type ListboxGroupLike = ListboxRegionLike & {
  querySelector?(selector: string): { id: string } | null
}

export type ListboxPagerParts = {
  readonly pager: ListboxRegionLike | null
  readonly previous: ListboxRegionLike | null
  readonly next: ListboxRegionLike | null
  readonly status: ListboxRegionLike | null
}

export type ListboxEnhancementParts = {
  readonly host: ListboxHostLike
  readonly options: readonly ListboxOptionLike[]
  readonly groups?: readonly ListboxGroupLike[]
  readonly empty?: ListboxRegionLike | null
  readonly status?: ListboxRegionLike | null
  readonly pager?: ListboxPagerParts | null
}

export type ListboxEnhancementOptions = {
  readonly generatedIdPrefix: string
  readonly multiple: boolean
  readonly roving?: boolean
  readonly value?: string
}

export type ListboxEnhancementResult =
  | {
      readonly status: 'enhanced'
      readonly activeIndex: number | null
      readonly optionIds: readonly string[]
      readonly selectedIndex: number | null
      readonly value: string
    }
  | { readonly status: 'invalid'; readonly missing: readonly string[] }

export type ListboxChangeReason = 'select' | 'toggle' | 'clear'

export type ListboxChangeDetail = UITransitionDetail<string, ListboxChangeReason> & {
  readonly values: readonly string[]
}

export type ListboxPageDetail = {
  readonly page: number
  readonly totalPages: number
}

const LISTBOX_SELECTOR = "[data-ui-part~='listbox']"
const CHIP_SELECTOR = "[data-ui-part~='chip']"
const CHIP_LABEL_SELECTOR = "[data-ui-part~='chip-label']"
const CHIP_REMOVE_SELECTOR = "[data-ui-part~='chip-remove']"
const GROUP_LABEL_SELECTOR = "[data-ui-part~='group-label']"
const EMPTY_SELECTOR = "[data-ui-part~='empty']"
const STATUS_SELECTOR = "[data-ui-part~='status']"
const PAGER_SELECTOR = "[data-ui-part~='pager']"
const PAGE_PREVIOUS_SELECTOR = "[data-ui-part~='page-previous']"
const PAGE_NEXT_SELECTOR = "[data-ui-part~='page-next']"
const PAGE_STATUS_SELECTOR = "[data-ui-part~='page-status']"

/** A listbox nested inside one of these already has an owner for its form value. */
const OWNING_COLLECTION_SELECTOR = 'ui-select, ui-combobox'

let typeaheadTimerFallback = 0

export type UIListboxElementConstructor = CustomElementConstructor & {
  elementName?: string
  formAssociated?: boolean
  new (): HTMLElement & {
    disabled: boolean
    multiple: boolean
    name: string
    pageSize: string
    required: boolean
    value: string
    values: readonly string[]
    readonly form: HTMLFormElement | null
    readonly labels: NodeList | null
    readonly validationMessage: string
    readonly validity: ValidityState | undefined
    readonly willValidate: boolean
    checkValidity(): boolean
    reportValidity(): boolean
  }
}

export function createListboxElementClass(targetWindow?: Window): UIListboxElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-listbox')
  class UIListboxElement extends UIElementBase {
    static formAssociated = true

    @boolAttr accessor multiple = false
    @boolAttr accessor required = false
    @boolAttr accessor disabled = false
    @attr accessor name = ''
    @attr({ attribute: 'page-size' }) accessor pageSize = ''
    @attr({ attribute: 'value' }) accessor defaultValue = ''
    @property accessor value = ''

    #fieldsetDisabled = false
    #page = 0
    #syncingDefaultValue = false
    #typeahead = ''
    #typeaheadTimer = 0
    #valueDirty = false

    /** Every selected value, in DOM order. Assign it to replace the whole selection. */
    get values(): readonly string[] {
      return selectedListboxValues(this.options)
    }

    set values(next: readonly string[]) {
      syncListboxSelection(this.parts, next)
      this.#valueDirty = true
      this.commitFormValue()
    }

    /** The resolved page size. Zero means unpaged. */
    get pageCount(): number {
      const parsed = Number.parseInt(this.pageSize, 10)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
    }

    protected override connected(): void {
      this.observeParts(() => this.enhance())
    }

    /**
     * The standard form-control surface, forwarded from `ElementInternals`.
     *
     * `setFormValue` alone makes an element submit; these are what make it a control a consumer can
     * treat like any other — `form.elements` reachability, `checkValidity()`, and a label list.
     */
    get form(): HTMLFormElement | null {
      return this.internals?.form ?? null
    }

    get labels(): NodeList | null {
      return this.internals?.labels ?? null
    }

    get validity(): ValidityState | undefined {
      return this.internals?.validity
    }

    get validationMessage(): string {
      return this.internals?.validationMessage ?? ''
    }

    get willValidate(): boolean {
      return this.internals?.willValidate ?? false
    }

    checkValidity(): boolean {
      return this.internals?.checkValidity() ?? true
    }

    reportValidity(): boolean {
      return this.internals?.reportValidity() ?? true
    }

    protected override disconnected(): void {
      this.clearTypeahead()
    }

    /** Called by the browser when an ancestor `<fieldset>` is disabled, which has no attribute here. */
    formDisabledCallback(disabled: boolean): void {
      this.#fieldsetDisabled = disabled
      this.syncFormState()
    }

    formResetCallback(): void {
      this.reset()
    }

    formStateRestoreCallback(state: File | string | FormData | null): void {
      const restored =
        typeof state === 'string'
          ? [state]
          : state instanceof FormData
            ? state.getAll(this.name).map(String)
            : []
      syncListboxSelection(this.parts, restored)
      this.#valueDirty = true
      this.commitFormValue()
    }

    private enhance(): void {
      const parts = this.parts
      const result = enhanceListboxParts(parts, {
        generatedIdPrefix: nextAvailableListboxInstanceId(this.ownerDocument),
        multiple: this.multiple,
        value: this.value,
      })
      if (result.status !== 'enhanced') return

      this.refreshWindow(parts)
      if (!this.multiple && !this.#valueDirty && result.value !== this.value) {
        this.applyInitialValue(this.defaultValue || result.value)
      }
      this.commitFormValue()
    }

    @watch('multiple')
    syncMultiple(): void {
      const listbox = this.listbox
      this.multiple
        ? listbox.setAttribute('aria-multiselectable', 'true')
        : listbox.removeAttribute('aria-multiselectable')
    }

    @watch('value')
    syncValue(): void {
      if (!this.#syncingDefaultValue) this.#valueDirty = true
      if (!this.multiple) syncListboxValue(this.parts, this.value)
      this.commitFormValue()
    }

    @watch('defaultValue')
    syncDefaultValue(): void {
      if (!this.#valueDirty) this.applyInitialValue(this.defaultValue)
    }

    @watch('name')
    @watch('required')
    @watch('disabled')
    syncFormState(): void {
      const listbox = this.listbox
      this.isDisabled
        ? listbox.setAttribute('aria-disabled', 'true')
        : listbox.removeAttribute('aria-disabled')
      this.commitFormValue()
    }

    @watch('pageSize')
    syncPageSize(): void {
      this.#page = 0
      this.refreshWindow()
    }

    reset(): void {
      this.#valueDirty = false
      this.#page = 0
      this.applyInitialValue(this.defaultValue)
      this.refreshWindow()
      this.commitFormValue()
    }

    @listen('click')
    handleClick(event: Event): void {
      if (this.isDisabled) return

      const pageStep = this.pagerStepFromEvent(event)
      if (pageStep !== null) {
        event.preventDefault()
        this.goToPage(this.#page + pageStep)
        return
      }

      const option = this.eventOption(event)
      if (!option || isCollectionItemDisabled(option)) return
      this.selectOption(option, event)
    }

    @listen('keydown')
    handleKeyDown(event: KeyboardEvent): void {
      if (this.isDisabled) return

      const option = this.eventOption(event)
      if (!option) return

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        if (!isCollectionItemDisabled(option)) this.selectOption(option, event)
        return
      }

      const navigable = this.navigableOptions
      const targetIndex = collectionNavigationTarget(
        navigable,
        navigable.indexOf(option),
        event.key,
        'vertical',
      )
      if (targetIndex !== null) {
        event.preventDefault()
        this.moveTo(navigable[targetIndex])
        return
      }

      if (isTypeaheadEvent(event)) {
        this.#typeahead += event.key
        const typeaheadIndex = findOptionByPrefix(
          navigable,
          this.#typeahead,
          navigable.indexOf(option),
        )
        this.scheduleTypeaheadReset()
        if (typeaheadIndex !== null) {
          event.preventDefault()
          this.moveTo(navigable[typeaheadIndex])
        }
      }
    }

    private moveTo(option: HTMLElement | undefined): void {
      if (!option) return
      const parts = this.parts
      const resolvedIndex = syncListboxActiveOption(parts, parts.options.indexOf(option))
      if (resolvedIndex !== null)
        (parts.options[resolvedIndex] as HTMLElement | undefined)?.focus?.()
    }

    private goToPage(page: number): void {
      const previous = this.#page
      this.#page = page
      const applied = this.refreshWindow()
      if (applied.page === previous) return
      this.emit('ui-page', { page: applied.page, totalPages: applied.totalPages })
    }

    /**
     * Re-applies the page window and re-wires everything that reads from the visible set.
     *
     * `filter: 'off'` is not a fallback: an inline listbox has no search field, so the only thing
     * allowed to write `hidden` here is the pager. A consumer that hides options itself keeps them
     * hidden across every re-page.
     */
    private refreshWindow(parts: ListboxEnhancementParts = this.parts): OptionWindow<HTMLElement> {
      const applied = applyOptionWindow(parts.options as readonly HTMLElement[], {
        filter: 'off',
        page: this.#page,
        pageSize: this.pageCount,
      })
      this.#page = applied.page
      syncListboxRegions(parts, applied)
      syncListboxActiveOption(parts, activeListboxIndex(parts.options))
      return applied
    }

    private selectOption(option: HTMLElement, originalEvent: Event): void {
      const previousValues = selectedListboxValues(this.options)
      const previousValue = previousValues[0] ?? ''
      const optionValue = listboxOptionValue(option)
      const wasSelected = option.getAttribute('aria-selected') === 'true'
      const nextValues = this.multiple
        ? wasSelected
          ? previousValues.filter((value) => value !== optionValue)
          : [...previousValues, optionValue]
        : [optionValue]
      const detail: ListboxChangeDetail = {
        originalEvent,
        previousValue: this.multiple ? previousValue : this.value,
        reason: this.multiple ? 'toggle' : 'select',
        source: transitionSourceFromEvent(originalEvent),
        value: nextValues[0] ?? '',
        values: nextValues,
      }
      if (!this.emit('ui-before-change', detail, { cancelable: true })) return

      if (this.multiple) {
        this.#valueDirty = true
        const parts = this.parts
        syncListboxSelection(parts, nextValues)
        syncListboxActiveOption(parts, parts.options.indexOf(option))
        this.commitFormValue()
        this.emit('ui-change', detail)
        return
      }

      this.value = detail.value
      syncListboxValue(this.parts, detail.value)
      this.emit('ui-change', detail)
    }

    private commitFormValue(): void {
      const internals = this.internals
      if (!internals || this.isOwnedByCollection) return

      const values = this.isDisabled ? [] : this.values
      internals.setFormValue?.(
        collectionFormValue(this.name, values, this.ownerDocument.defaultView),
      )
      applyCollectionValidity(internals, {
        anchor: this.listbox,
        disabled: this.isDisabled,
        required: this.required,
        values,
      })
    }

    private applyInitialValue(value: string): void {
      this.#syncingDefaultValue = true
      try {
        this.value = value
      } finally {
        this.#syncingDefaultValue = false
      }
      if (!this.multiple) syncListboxValue(this.parts, value)
    }

    private eventOption(event: Event): HTMLElement | null {
      const option = this.closestTarget<HTMLElement>(event, OPTION_SELECTOR)
      return option && this.options.includes(option) ? option : null
    }

    private pagerStepFromEvent(event: Event): number | null {
      if (this.closestTarget<HTMLElement>(event, PAGE_PREVIOUS_SELECTOR)) return -1
      if (this.closestTarget<HTMLElement>(event, PAGE_NEXT_SELECTOR)) return 1
      return null
    }

    private scheduleTypeaheadReset(): void {
      this.clearTypeaheadTimer()
      const ownerWindow = this.ownerDocument.defaultView
      this.#typeaheadTimer = ownerWindow
        ? ownerWindow.setTimeout(() => this.clearTypeahead(), OPTION_TYPEAHEAD_RESET_MS)
        : ++typeaheadTimerFallback
    }

    private clearTypeahead(): void {
      this.clearTypeaheadTimer()
      this.#typeahead = ''
    }

    private clearTypeaheadTimer(): void {
      if (!this.#typeaheadTimer) return
      this.ownerDocument.defaultView?.clearTimeout(this.#typeaheadTimer)
      this.#typeaheadTimer = 0
    }

    /**
     * A listbox inside a Select or Combobox is that element's surface, not a control of its own.
     * Registering a second form value under the same `name` would submit every value twice.
     */
    private get isOwnedByCollection(): boolean {
      return this.parentElement?.closest?.(OWNING_COLLECTION_SELECTOR) != null
    }

    private get isDisabled(): boolean {
      return this.disabled || this.#fieldsetDisabled
    }

    /**
     * The element that carries `role="listbox"`.
     *
     * The host itself in the simple shape. When the author puts an inner `listbox` part inside —
     * which is what makes room for an `empty` region, a `status` region, or a pager — that inner
     * element is the listbox instead, because a listbox may own only options and groups.
     */
    get listbox(): HTMLElement {
      return queryOwnedPart<HTMLElement>(this, LISTBOX_SELECTOR) ?? this
    }

    private get parts(): ListboxEnhancementParts {
      return {
        host: this.listbox,
        options: this.options,
        groups: findOptionGroups(this.listbox),
        empty: queryOwnedPart(this, EMPTY_SELECTOR),
        status: queryOwnedPart(this, STATUS_SELECTOR),
        pager: {
          pager: queryOwnedPart(this, PAGER_SELECTOR),
          previous: queryOwnedPart(this, PAGE_PREVIOUS_SELECTOR),
          next: queryOwnedPart(this, PAGE_NEXT_SELECTOR),
          status: queryOwnedPart(this, PAGE_STATUS_SELECTOR),
        },
      }
    }

    /** Arrow keys and typeahead run over the visible set, flattened across groups. */
    private get navigableOptions(): HTMLElement[] {
      return [...visibleOptions(this.options)]
    }

    private get options(): HTMLElement[] {
      return findListboxOptions(this.listbox)
    }
  }

  return UIListboxElement as unknown as UIListboxElementConstructor
}

export const UIListboxElement = createListboxElementClass()
export type UIListboxElement = InstanceType<typeof UIListboxElement>

export function enhanceListboxParts(
  parts: ListboxEnhancementParts,
  options: ListboxEnhancementOptions,
): ListboxEnhancementResult {
  if (parts.options.length === 0) {
    return { status: 'invalid', missing: ['options'] }
  }
  parts.host.setAttribute('role', 'listbox')
  if (options.multiple) {
    parts.host.setAttribute('aria-multiselectable', 'true')
  } else {
    parts.host.removeAttribute('aria-multiselectable')
  }

  const optionIds = parts.options.map((option, index) => {
    if (!option.id) option.id = `${options.generatedIdPrefix}-option-${index + 1}`
    setAttributeIfChanged(option, 'role', 'option')
    setAttributeIfChanged(option, 'tabindex', '-1')
    if (!option.hasAttribute('aria-selected')) {
      option.setAttribute('aria-selected', 'false')
    }
    return option.id
  })

  enhanceListboxGroups(parts.groups ?? [], options.generatedIdPrefix)
  enhanceListboxLiveRegion(parts.status)
  enhanceListboxLiveRegion(parts.pager?.status)

  const selectedIndex = options.multiple
    ? firstSelectedListboxIndex(parts.options)
    : syncListboxValue(parts, options.value ?? '', options.roving ?? true)
  const activeIndex = syncListboxActiveOption(parts, selectedIndex, options.roving ?? true)
  const value = activeIndex === null ? '' : listboxOptionValue(parts.options[activeIndex]!)

  return { status: 'enhanced', activeIndex, optionIds, selectedIndex, value }
}

/** Single selection: exactly one option carries `aria-selected="true"`. */
export function syncListboxValue(
  parts: ListboxEnhancementParts,
  value: string,
  roving = true,
): number | null {
  const selectedIndex = parts.options.findIndex((option) => listboxOptionValue(option) === value)

  parts.options.forEach((option, index) => {
    setAttributeIfChanged(option, 'aria-selected', String(index === selectedIndex))
  })

  syncListboxActiveOption(parts, selectedIndex, roving)
  return selectedIndex >= 0 ? selectedIndex : null
}

/**
 * Multiple selection. Kept separate from `syncListboxValue` because the two answer different
 * questions, and because this is the only other place allowed to write `aria-selected`.
 */
export function syncListboxSelection(
  parts: ListboxEnhancementParts,
  values: readonly string[],
): readonly string[] {
  const wanted = new Set(values)
  const selected: string[] = []

  parts.options.forEach((option) => {
    const value = listboxOptionValue(option)
    const isSelected = wanted.has(value)
    setAttributeIfChanged(option, 'aria-selected', String(isSelected))
    if (isSelected) selected.push(value)
  })

  return selected
}

/**
 * Moves the active option, which is a highlight and a tab stop — never a selection.
 *
 * `roving` is how the two focus models differ. An inline listbox holds real DOM focus, so one
 * visible option carries `tabindex="0"`. A Select or Combobox keeps focus in its trigger or search
 * field and names the active option with `aria-activedescendant`, so every option stays at `-1` and
 * the surface never becomes an extra tab stop.
 */
export function syncListboxActiveOption(
  parts: ListboxEnhancementParts,
  activeIndex: number | null,
  roving = true,
): number | null {
  const visible = visibleListboxOptions(parts.options)
  const activeOption =
    activeIndex === null || activeIndex < 0 || activeIndex >= parts.options.length
      ? null
      : parts.options[activeIndex]
  const visibleIndex = activeOption ? visible.indexOf(activeOption) : -1
  const resolvedVisibleIndex = roving
    ? syncRovingTabIndex(visible, visibleIndex >= 0 ? visibleIndex : null)
    : visibleIndex >= 0
      ? visibleIndex
      : null
  const resolvedOption =
    resolvedVisibleIndex === null ? null : (visible[resolvedVisibleIndex] ?? null)

  parts.options.forEach((option) => {
    if (!roving || !visible.includes(option)) setAttributeIfChanged(option, 'tabindex', '-1')
    if (option === resolvedOption) {
      if (!option.hasAttribute('data-ui-internal-active')) {
        option.setAttribute('data-ui-internal-active', '')
      }
    } else if (option.hasAttribute('data-ui-internal-active')) {
      option.removeAttribute('data-ui-internal-active')
    }
  })

  return resolvedOption ? parts.options.indexOf(resolvedOption) : null
}

/**
 * Points a controlling field's `aria-activedescendant` at the active option.
 *
 * This used to also write `aria-selected` from the active index, which meant arrowing through a
 * combobox announced every option it passed as selected and erased the real selection. It writes
 * the highlight and the relationship, and nothing about selection.
 */
export function syncListboxActiveDescendant(
  controller: ListboxControllerLike | null,
  parts: ListboxEnhancementParts,
  activeIndex: number | null,
): number | null {
  if (!controller) return null

  if (!isValidActiveListboxIndex(parts.options, activeIndex)) {
    clearListboxActiveOption(parts.options)
    controller.removeAttribute('aria-activedescendant')
    return null
  }

  const resolvedIndex = syncListboxActiveOption(parts, activeIndex, false)
  if (resolvedIndex === null) {
    controller.removeAttribute('aria-activedescendant')
    return null
  }

  controller.setAttribute('aria-activedescendant', parts.options[resolvedIndex]!.id)
  return resolvedIndex
}

/**
 * Shows the empty region when nothing is visible, and updates the pager.
 *
 * Both are pure attribute writes over the window the caller already computed, so a component never
 * has to decide what an empty list or a boundary button looks like — that is `options.css`.
 */
export function syncListboxRegions(
  parts: ListboxEnhancementParts,
  window: OptionWindow<unknown>,
): void {
  setHiddenIfChanged(parts.empty, window.visible.length > 0)

  const pager = parts.pager
  if (!pager) return

  setHiddenIfChanged(pager.pager, window.totalPages <= 1)
  setPagerBoundary(pager.previous, window.page <= 0)
  setPagerBoundary(pager.next, window.page >= window.totalPages - 1)
  if (pager.status) {
    const label = `Page ${window.page + 1} of ${window.totalPages}`
    const status = pager.status as ListboxRegionLike & { textContent?: string | null }
    // Writing an unchanged text node re-triggers the parts MutationObserver forever.
    if (status.textContent !== label) status.textContent = label
  }
}

/**
 * Renders one chip per selected value by cloning the author's `chip-template`.
 *
 * Nothing here invents markup: every element and class in a chip is authored, and this fills in the
 * label, the value, and the accessible name. Without a template the container gets a plain
 * comma-separated summary, so `multiple` is still legible with no extra anatomy to author.
 */
export function syncListboxChips(
  chips: HTMLElement | null,
  template: HTMLTemplateElement | null,
  selected: readonly HTMLElement[],
): void {
  if (!chips) return

  if (!template) {
    const summary = selected.map(listboxOptionLabel).join(', ')
    if (chips.textContent !== summary) chips.textContent = summary
    return
  }

  // Rewriting identical chips would re-trigger the parts MutationObserver forever.
  const values = selected.map(listboxOptionValue)
  const rendered = Array.from(chips.children).map(
    (chip) => chip.getAttribute('data-ui-value') ?? '',
  )
  if (values.length === rendered.length && values.every((v, i) => v === rendered[i])) return

  chips.replaceChildren(...selected.map((option) => renderListboxChip(template, option)))
}

function renderListboxChip(template: HTMLTemplateElement, option: HTMLElement): DocumentFragment {
  const fragment = template.content.cloneNode(true) as DocumentFragment
  const chip = fragment.querySelector<HTMLElement>(CHIP_SELECTOR) ?? fragment.firstElementChild
  if (!chip) return fragment

  const value = listboxOptionValue(option)
  const label = listboxOptionLabel(option)
  chip.setAttribute('data-ui-value', value)

  const labelNode = chip.querySelector<HTMLElement>(CHIP_LABEL_SELECTOR)
  if (labelNode) {
    labelNode.textContent = label
  } else if (chip.childElementCount === 0) {
    chip.textContent = label
  }

  const remove = chip.querySelector<HTMLElement>(CHIP_REMOVE_SELECTOR)
  if (remove) {
    remove.setAttribute('data-ui-value', value)
    // A shared template cannot name the value it removes, and "×" for every chip is not a name.
    // An `aria-label` authored in the template still wins.
    if (!remove.hasAttribute('aria-label')) {
      remove.setAttribute('aria-label', `Remove ${label}`)
    }
  }

  return fragment
}

/**
 * The public filtering entry point. Kept as the name and module it has always had; the matching
 * itself now lives in `options.ts` so filtering and typeahead cannot disagree.
 */
export function filterListboxOptions(
  options: readonly ListboxOptionLike[],
  value: string,
  mode: OptionFilterMode = 'contains',
): readonly ListboxOptionLike[] {
  if (mode === 'off') return visibleListboxOptions(options)

  const visible: ListboxOptionLike[] = []
  options.forEach((option) => {
    const matches = matchOption(option, value, mode)
    option.hidden = !matches
    if (matches) visible.push(option)
  })
  return visible
}

export function selectedListboxValues(options: readonly ListboxOptionLike[]): readonly string[] {
  return options
    .filter((option) => option.getAttribute('aria-selected') === 'true')
    .map(listboxOptionValue)
}

export function listboxOptionValue(option: ListboxOptionLike): string {
  return (
    option.getAttribute('value') ??
    option.getAttribute('data-ui-value') ??
    option.textContent?.trim() ??
    ''
  )
}

/** The label a chip or a trigger shows for an option. */
export function listboxOptionLabel(option: ListboxOptionLike): string {
  return optionLabel(option)
}

export function findListboxOptions(host: Element): HTMLElement[] {
  return findOptions(host)
}

/** The page window over a listbox's visible options, without writing anything. */
export function listboxPageWindow(
  options: readonly ListboxOptionLike[],
  pageSize: number,
  page = 0,
): OptionWindow<ListboxOptionLike> {
  return optionPageWindow(visibleListboxOptions(options), pageSize, page)
}

function enhanceListboxGroups(
  groups: readonly ListboxGroupLike[],
  generatedIdPrefix: string,
): void {
  groups.forEach((group, index) => {
    if (!group.hasAttribute('role')) group.setAttribute('role', 'group')
    const label = group.querySelector?.(GROUP_LABEL_SELECTOR)
    if (!label) return
    if (!label.id) label.id = `${generatedIdPrefix}-group-${index + 1}-label`
    if (!group.hasAttribute('aria-labelledby')) {
      group.setAttribute('aria-labelledby', label.id)
    }
  })
}

function enhanceListboxLiveRegion(region: ListboxRegionLike | null | undefined): void {
  if (!region) return
  if (!region.hasAttribute('role')) region.setAttribute('role', 'status')
  if (!region.hasAttribute('aria-live')) region.setAttribute('aria-live', 'polite')
}

/**
 * A boundary control stays focusable and takes `aria-disabled` rather than `disabled`, so a screen
 * reader user finds the boundary instead of finding the control gone.
 */
function setPagerBoundary(control: ListboxRegionLike | null, atBoundary: boolean): void {
  if (control) setAttributeIfChanged(control, 'aria-disabled', String(atBoundary))
}

/**
 * Writes an attribute only when it would change.
 *
 * Every one of these helpers runs inside a subtree a `MutationObserver` is watching, and a write of
 * an unchanged value still produces a record — which re-triggers enhancement, which writes again.
 * Comparing first is what keeps a 1,600-option surface from paying for a no-op sync.
 */
function setHiddenIfChanged(
  element: { hidden?: boolean | 'until-found' } | null | undefined,
  hidden: boolean,
): void {
  if (element && element.hidden !== hidden) element.hidden = hidden
}

function setAttributeIfChanged(
  element: {
    getAttribute(name: string): string | null
    setAttribute(name: string, value: string): void
  },
  name: string,
  value: string,
): void {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value)
}

function visibleListboxOptions(
  options: readonly ListboxOptionLike[],
): readonly ListboxOptionLike[] {
  return options.filter((option) => !option.hidden)
}

/** Where the highlight currently sits, so re-paging can put it back on a visible option. */
function activeListboxIndex(options: readonly ListboxOptionLike[]): number | null {
  const index = options.findIndex((option) => option.hasAttribute('data-ui-internal-active'))
  return index >= 0 ? index : firstSelectedListboxIndex(options)
}

function firstSelectedListboxIndex(options: readonly ListboxOptionLike[]): number | null {
  const index = options.findIndex((option) => option.getAttribute('aria-selected') === 'true')
  return index >= 0 ? index : null
}

function clearListboxActiveOption(options: readonly ListboxOptionLike[]): void {
  options.forEach((option) => {
    option.removeAttribute('data-ui-internal-active')
    option.setAttribute('tabindex', '-1')
  })
}

function isValidActiveListboxIndex(
  options: readonly ListboxOptionLike[],
  activeIndex: number | null,
): activeIndex is number {
  return (
    activeIndex !== null &&
    activeIndex >= 0 &&
    activeIndex < options.length &&
    !options[activeIndex]!.hidden &&
    !isCollectionItemDisabled(options[activeIndex]!)
  )
}

function isTypeaheadEvent(event: KeyboardEvent): boolean {
  return (
    event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
  )
}

function nextAvailableListboxInstanceId(ownerDocument: Document): string {
  let id: string
  do {
    id = createId('ui-listbox', ownerDocument)
  } while (ownerDocument.getElementById(id))
  return id
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-listbox': UIListboxElement
  }
}
