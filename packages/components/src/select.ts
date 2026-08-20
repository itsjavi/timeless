/**
 * Select: a button trigger over the listbox core.
 *
 * Everything about options lives in `listbox.ts`. What is here is the trigger, the popover surface,
 * the value display, the optional in-surface search field, chips for a multiple selection, and form
 * participation. `selectOptionValue` and `syncSelectValue` survive as the names they always were,
 * but their bodies now route through the listbox rather than reimplementing it.
 *
 * Three things are deliberate:
 *
 * - **The surface opens declaratively.** A native button trigger is given `popovertarget`, so a
 *   Select opens, light-dismisses, and closes on Escape before any script loads. A trigger authored
 *   as something other than a button cannot carry `popovertarget`, so it keeps a click listener;
 *   which of the two is live is reported out of the enhancement result as `triggerWiring`.
 * - **One focus model.** Focus stays on the trigger, or in the `search` field under `searchable`,
 *   and the active option travels through `aria-activedescendant`. The roving-focus path that used
 *   to move real focus into the options is gone; two focus models in one component meant the
 *   stylesheet and the contract each documented a different one.
 * - **Anchor positioning is the supported path.** The coordinate-computing fallback runs only where
 *   `CSS.supports('anchor-name')` is false, so a supporting browser is never stamped with a private
 *   hook whose values the `@supports` rule then discards.
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
import { supportsAnchorPositioning, supportsNativePopover } from './capabilities'
import {
  collectionNavigationTarget,
  createCollectionTypeahead,
  isCollectionItemDisabled,
  isCollectionTypeaheadEvent,
} from './collection'
import {
  applyFloatingPosition,
  clearFloatingPosition,
  resolveFloatingPlacement,
  syncFloatingAnchor,
  type FloatingPlacement,
} from './floating'
import { isPopoverOpen } from './popover'
import { transitionSourceFromEvent, type UITransitionDetail } from './events'
import { queryOwnedPart } from './parts'
import {
  enhanceListboxParts,
  findListboxOptions,
  listboxOptionLabel,
  listboxOptionValue,
  selectedListboxValues,
  syncListboxActiveDescendant,
  syncListboxChips,
  syncListboxRegions,
  syncListboxSelection,
  syncListboxValue as syncBaseListboxValue,
  type ListboxEnhancementParts,
} from './listbox'
import {
  applyOptionWindow,
  findOptionByPrefix,
  findOptionGroups,
  OPTION_SELECTOR,
  visibleOptions,
  type OptionFilterMode,
  type OptionWindow,
} from './options'
import type { CollectionAlignment } from './values/options'
import { applyCollectionValidity, collectionFormValue } from './value-state'

export type SelectElementLike = {
  id: string
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type SelectTriggerLike = SelectElementLike & {
  readonly style: {
    removeProperty(name: string): void
    setProperty(name: string, value: string): void
  }
}

export type SelectListboxLike = SelectTriggerLike & {
  open?: boolean
  hidden?: boolean | 'until-found'
}

export type SelectOptionLike = SelectElementLike & {
  readonly textContent?: string | null
  focus?(): void
  matches?(selector: string): boolean
  setAttribute(name: string, value: string): void
}

export type SelectInputLike = {
  value: string
  getAttribute(name: string): string | null
  setAttribute(name: string, value: string): void
}

export type SelectEnhancementParts = {
  readonly host: SelectElementLike
  readonly input: SelectInputLike | null
  readonly trigger: SelectTriggerLike | null
  readonly listbox: SelectListboxLike | null
  /** The popover. Defaults to the listbox, which is its own surface in the simple shape. */
  readonly surface?: SelectListboxLike | null
  readonly options: readonly SelectOptionLike[]
}

export type SelectEnhancementOptions = {
  readonly anchorName: string
  readonly generatedIdPrefix: string
  readonly multiple?: boolean
  readonly supportsPopover: boolean
  /** The live selection, which under `multiple` is what re-enhancement must preserve. */
  readonly values?: readonly string[]
  readonly value?: string
}

/**
 * Which mechanism opens the surface.
 *
 * `authored` means the trigger is a native button carrying `popovertarget`, so the browser opens the
 * surface before any script runs. `popovertarget` is only honoured on a button, so a trigger authored
 * as anything else falls back to `listener`, where this element toggles the popover on click. The two
 * are indistinguishable to a user; the distinction is reported so a test can prove which one ran, and
 * so `no-javascript.spec.ts` has something to assert against.
 */
export type SelectTriggerWiring = 'authored' | 'listener'

export type SelectEnhancementResult =
  | {
      readonly status: 'enhanced'
      readonly listboxId: string
      readonly optionIds: readonly string[]
      readonly selectedIndex: number | null
      readonly triggerWiring: SelectTriggerWiring
    }
  | { readonly status: 'invalid'; readonly missing: readonly string[] }
  | { readonly status: 'unsupported'; readonly feature: 'popover' }

export type SelectChangeReason = 'select' | 'toggle' | 'clear' | 'remove'

export type SelectChangeDetail = UITransitionDetail<string, SelectChangeReason> & {
  readonly values: readonly string[]
}

export type SelectToggleDetail = {
  readonly open: boolean
  readonly originalEvent: Event | null
}

export type SelectInputDetail = {
  readonly filter: OptionFilterMode
  readonly originalEvent: Event | null
  readonly query: string
}

export type SelectPageDetail = {
  readonly page: number
  readonly totalPages: number
}

const TRIGGER_SELECTOR = "[data-ui-part~='trigger']"
const VALUE_SELECTOR = "[data-ui-part~='value']"
const SEARCH_SELECTOR = "[data-ui-part~='search']"
const CHIPS_SELECTOR = "[data-ui-part~='chips']"
const CHIP_REMOVE_SELECTOR = "[data-ui-part~='chip-remove']"
const CHIP_TEMPLATE_SELECTOR = "template[data-ui-part~='chip-template']"
const CLEAR_SELECTOR = "[data-ui-part~='clear']"
const EMPTY_SELECTOR = "[data-ui-part~='empty']"
const STATUS_SELECTOR = "[data-ui-part~='status']"
const PAGER_SELECTOR = "[data-ui-part~='pager']"
const PAGE_PREVIOUS_SELECTOR = "[data-ui-part~='page-previous']"
const PAGE_NEXT_SELECTOR = "[data-ui-part~='page-next']"
const PAGE_STATUS_SELECTOR = "[data-ui-part~='page-status']"
const INPUT_SELECTOR = 'input[type="hidden"]'
const LISTBOX_SELECTOR = '[role="listbox"]'
const SURFACE_SELECTOR = "[data-ui-part~='surface']"

export type UISelectElementConstructor = CustomElementConstructor & {
  elementName?: string
  formAssociated?: boolean
  new (): HTMLElement & {
    align: CollectionAlignment
    disabled: boolean
    filter: OptionFilterMode
    multiple: boolean
    name: string
    open: boolean
    pageSize: string
    placement: FloatingPlacement
    required: boolean
    searchable: boolean
    value: string
    values: readonly string[]
    readonly form: HTMLFormElement | null
    readonly labels: NodeList | null
    readonly validationMessage: string
    readonly validity: ValidityState | undefined
    readonly willValidate: boolean
    checkValidity(): boolean
    reportValidity(): boolean
    setCustomValidity(message: string): void
  }
}

export function createSelectElementClass(targetWindow?: Window): UISelectElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-select')
  class UISelectElement extends UIElementBase {
    static formAssociated = true

    @attr({ attribute: 'value' }) accessor defaultValue = ''
    @property accessor value = ''
    @attr accessor placement: FloatingPlacement = 'bottom'
    @attr accessor align: CollectionAlignment = 'start'
    @attr accessor filter: OptionFilterMode = 'contains'
    @attr accessor name = ''
    @attr({ attribute: 'page-size' }) accessor pageSize = ''
    @boolAttr accessor open = false
    @boolAttr accessor multiple = false
    @boolAttr accessor searchable = false
    @boolAttr accessor required = false
    @boolAttr accessor disabled = false

    get input(): HTMLInputElement | null {
      return queryOwnedPart(this, INPUT_SELECTOR)
    }

    get trigger(): HTMLElement | null {
      return queryOwnedPart(this, TRIGGER_SELECTOR)
    }

    get listbox(): HTMLElement | null {
      return queryOwnedPart(this, LISTBOX_SELECTOR)
    }

    /**
     * The popover. It is the listbox itself in the simple shape, and its authored wrapper whenever
     * the surface also holds a search field, a header, a footer, or a pager — a `role="listbox"` may
     * own only options and groups, so those siblings live beside it rather than inside it.
     */
    get surface(): HTMLElement | null {
      return queryOwnedPart<HTMLElement>(this, SURFACE_SELECTOR) ?? this.listbox
    }

    get search(): HTMLInputElement | null {
      return queryOwnedPart(this, SEARCH_SELECTOR)
    }

    #activeIndex: number | null = null
    #customValidity = ''
    #fieldsetDisabled = false
    #page = 0
    #syncingOpen = false
    #syncingDefaultValue = false
    #triggerWiring: SelectTriggerWiring = 'authored'
    #typeahead = createCollectionTypeahead(() => this.ownerDocument.defaultView)
    #valueDirty = false

    /** Every selected value, in DOM order. Assign it to replace the whole selection. */
    get values(): readonly string[] {
      return selectedListboxValues(this.options)
    }

    set values(next: readonly string[]) {
      this.#valueDirty = true
      syncListboxSelection(this.listboxParts, next)
      this.afterSelectionChanged()
    }

    /** The resolved page size. Zero means unpaged. */
    get pageCount(): number {
      const parsed = Number.parseInt(this.pageSize, 10)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
    }

    private handleFloatingEnvironmentChange = (): void => {
      this.updateFloatingPosition()
    }

    protected override connected(): void {
      this.observeParts((signal) => this.enhance(signal))
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

    /**
     * The native `setCustomValidity` contract, which a form-associated custom element does not get
     * for free: its validity lives in `ElementInternals`, so an outside caller — `ui-form` mapping a
     * server error onto a named field, say — has nothing to reach for unless the element forwards
     * it. An empty message clears the error and restores the element's own constraints.
     */
    setCustomValidity(message: string): void {
      this.#customValidity = message
      this.commitFormValue()
    }

    protected override disconnected(): void {
      this.#typeahead.clear()
    }

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
      this.#valueDirty = true
      syncListboxSelection(this.listboxParts, restored)
      this.afterSelectionChanged()
    }

    private enhance(signal: AbortSignal): void {
      const instanceId = nextAvailableSelectInstanceId(this.ownerDocument)
      const result = enhanceSelectParts(this.parts, {
        anchorName: `--${instanceId}-anchor`,
        generatedIdPrefix: instanceId,
        multiple: this.multiple,
        supportsPopover: supportsNativePopover(this.ownerDocument.defaultView),
        value: this.value || this.input?.value,
        values: this.values,
      })

      const surface = this.surface
      if (result.status !== 'enhanced' || !surface) return

      this.#triggerWiring = result.triggerWiring
      if (!this.multiple) {
        const selectedOption =
          result.selectedIndex === null ? null : this.options[result.selectedIndex]
        this.initializeValue(selectedOption ? selectOptionValue(selectedOption) : '')
      }
      this.refreshWindow()
      this.on(surface, 'toggle', this.handleToggle, { signal })
      this.on(this.ownerWindow, 'resize', this.handleFloatingEnvironmentChange, { signal })
      this.on(this.ownerWindow, 'scroll', this.handleFloatingEnvironmentChange, { signal })
      this.input?.form?.addEventListener('reset', this.handleFormReset, { signal })
      this.syncOpenState(isPopoverOpen(surface), null)
      // Runs for both modes: under `multiple` nothing above seeds a value, and the chips, the clear
      // control, and the form value all still have to reflect the authored selection.
      this.afterSelectionChanged()
      this.syncFormState()
    }

    @watch('open')
    syncOpen(): void {
      if (this.#syncingOpen) return
      this.open ? this.openListbox() : this.closeListbox()
    }

    @watch('value')
    syncValue(): void {
      if (!this.#syncingDefaultValue) this.#valueDirty = true
      if (!this.multiple) syncSelectValue(this.parts, this.value)
      this.afterSelectionChanged()
    }

    @watch('defaultValue')
    syncDefaultValue(): void {
      if (!this.#valueDirty) this.applyDefaultValue(this.defaultValue)
    }

    @watch('name')
    @watch('required')
    @watch('disabled')
    syncFormState(): void {
      // Disabling the native trigger is what stops `popovertarget` opening the surface.
      this.trigger?.toggleAttribute('disabled', this.isDisabled)
      this.commitFormValue()
    }

    @watch('pageSize')
    @watch('filter')
    syncWindowConfiguration(): void {
      this.#page = 0
      this.refreshWindow()
    }

    @watch('placement')
    updateFloatingPosition(): void {
      const surface = this.surface
      if (!this.trigger || !surface || !isPopoverOpen(surface)) return
      if (supportsAnchorPositioning(this.ownerDocument.defaultView)) return

      applyFloatingPosition({
        align: this.align === 'end' ? 'end' : 'start',
        content: surface,
        placement: resolveFloatingPlacement(this.placement),
        trigger: this.trigger,
      })
    }

    reset(): void {
      this.#valueDirty = false
      this.#page = 0
      this.applyDefaultValue(this.defaultValue || this.input?.defaultValue || '')
      this.refreshWindow()
    }

    @listen('click')
    handleClick(event: Event): void {
      if (this.isDisabled) return

      if (this.closestTarget<HTMLElement>(event, CLEAR_SELECTOR)) {
        event.preventDefault()
        this.commitSelection([], 'clear', event)
        return
      }

      const chipRemove = this.closestTarget<HTMLElement>(event, CHIP_REMOVE_SELECTOR)
      if (chipRemove) {
        event.preventDefault()
        const removed = chipRemove.getAttribute('data-ui-value') ?? ''
        this.commitSelection(
          this.values.filter((value) => value !== removed),
          'remove',
          event,
        )
        return
      }

      const pageStep = this.pagerStepFromEvent(event)
      if (pageStep !== null) {
        event.preventDefault()
        this.goToPage(this.#page + pageStep)
        return
      }

      const trigger = this.closestTarget<HTMLElement>(event, TRIGGER_SELECTOR)
      if (trigger === this.trigger) {
        // Under `authored` wiring the browser has already toggled it; `handleToggle` syncs the state.
        if (this.#triggerWiring === 'authored') return
        event.preventDefault()
        this.open ? this.closeListbox(event) : this.openListbox(event)
        return
      }

      const option = this.closestTarget<HTMLElement>(event, OPTION_SELECTOR)
      if (option && this.options.includes(option) && !isCollectionItemDisabled(option)) {
        this.selectOption(option, event)
      }
    }

    @listen('input')
    handleSearchInput(event: Event): void {
      if (event.target !== this.search) return
      this.#page = 0
      this.emit('ui-input', {
        filter: this.filter,
        originalEvent: event,
        query: this.search?.value ?? '',
      })
      this.refreshWindow()
      this.moveActiveTo(null)
    }

    @listen('keydown')
    handleKeyDown(event: KeyboardEvent): void {
      if (this.isDisabled) return
      if (
        !this.trigger?.contains(event.target as Node) &&
        !this.surface?.contains(event.target as Node)
      ) {
        return
      }

      if (event.key === 'Escape') {
        if (this.open) {
          event.preventDefault()
          this.closeListbox(event)
        }
        return
      }

      if (this.handleChipBackspace(event)) return

      const typingInSearch = event.target === this.search
      if (typingInSearch && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        // Horizontal arrows are caret movement inside a text field, never option navigation.
        return
      }

      if (event.key === 'Enter' || (event.key === ' ' && !typingInSearch)) {
        if (!this.open) {
          event.preventDefault()
          this.openListbox(event)
          return
        }
        const active = this.activeOption
        if (active) {
          event.preventDefault()
          this.selectOption(active, event)
        }
        return
      }

      const navigable = this.navigableOptions
      const targetIndex = collectionNavigationTarget(
        navigable,
        this.#activeIndex === null ? -1 : navigable.indexOf(this.options[this.#activeIndex]!),
        event.key,
        'vertical',
      )
      if (targetIndex !== null) {
        event.preventDefault()
        if (!this.open) this.openListbox(event)
        this.moveActiveTo(navigable[targetIndex] ?? null)
        return
      }

      if (!typingInSearch && isCollectionTypeaheadEvent(event)) {
        event.preventDefault()
        this.handleTypeahead(event)
      }
    }

    /**
     * Typeahead. On a closed Select a printable character selects the match without opening, which
     * is what the native control does; with the surface open it only moves the highlight.
     */
    private handleTypeahead(event: KeyboardEvent): void {
      const search = this.#typeahead.push(event.key)
      const navigable = this.navigableOptions
      const from =
        this.#activeIndex === null ? -1 : navigable.indexOf(this.options[this.#activeIndex]!)
      const index = findOptionByPrefix(navigable, search, from)
      const match = index === null ? null : navigable[index]
      if (!match) return

      if (this.open) {
        this.moveActiveTo(match)
        return
      }
      this.selectOption(match, event)
    }

    /** Backspace in an empty search field removes the last chip, as a token field does. */
    private handleChipBackspace(event: KeyboardEvent): boolean {
      if (event.key !== 'Backspace' || !this.multiple) return false
      if (event.target !== this.search || this.search?.value) return false

      const values = this.values
      if (values.length === 0) return false

      event.preventDefault()
      this.commitSelection(values.slice(0, -1), 'remove', event)
      return true
    }

    private handleToggle = (event: Event): void => {
      const surface = this.surface
      if (event.target !== surface || !surface) return

      const open = isPopoverOpen(surface)
      this.syncOpenState(open, event)
      if (!open) {
        clearFloatingPosition(surface)
        this.moveActiveTo(null)
        this.clearSearch()
        return
      }
      this.updateFloatingPosition()
      this.refreshWindow()
      this.focusInitialTarget()
      // APG: opening puts the visual focus on the selected option, or the first one when none is.
      this.moveActiveTo(this.selectedOption ?? this.navigableOptions[0] ?? null)
    }

    private handleFormReset = (): void => {
      queueMicrotask(() => this.reset())
    }

    private openListbox(originalEvent: Event | null = null): void {
      const surface = this.surface
      if (!surface || isPopoverOpen(surface)) return
      surface.showPopover?.()
      this.syncOpenState(true, originalEvent)
    }

    private closeListbox(originalEvent: Event | null = null): void {
      const surface = this.surface
      if (!surface) {
        this.syncOpenState(false, originalEvent)
        return
      }
      if (isPopoverOpen(surface)) surface.hidePopover()
      clearFloatingPosition(surface)
      this.syncOpenState(false, originalEvent)
    }

    /** Focus goes to the search field when there is one, and otherwise stays on the trigger. */
    private focusInitialTarget(): void {
      const search = this.search
      if (this.searchable && search) {
        search.focus()
        return
      }
      this.trigger?.focus()
    }

    private selectOption(option: HTMLElement, originalEvent: Event): void {
      const value = selectOptionValue(option)
      if (!this.multiple) {
        this.commitSelection([value], 'select', originalEvent)
        return
      }
      const values = this.values
      this.commitSelection(
        values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value],
        'toggle',
        originalEvent,
      )
    }

    private commitSelection(
      nextValues: readonly string[],
      reason: SelectChangeReason,
      originalEvent: Event | null,
    ): void {
      const previousValues = this.values
      const detail: SelectChangeDetail = {
        originalEvent,
        previousValue: previousValues[0] ?? '',
        reason,
        source: transitionSourceFromEvent(originalEvent),
        value: nextValues[0] ?? '',
        values: nextValues,
      }
      if (sameValues(previousValues, nextValues)) return
      if (!this.emit('ui-before-change', detail, { cancelable: true })) return

      this.#valueDirty = true
      if (this.multiple) {
        syncListboxSelection(this.listboxParts, nextValues)
        this.afterSelectionChanged()
      } else {
        this.value = detail.value
        this.closeListbox(originalEvent)
        this.trigger?.focus()
      }
      this.emit('ui-change', detail)
    }

    /** Everything that reads from the selection: the label, the chips, the clear control, the form. */
    private afterSelectionChanged(): void {
      this.syncTriggerLabel()
      this.syncChips()
      this.syncClearControl()
      this.commitFormValue()
    }

    private moveActiveTo(option: HTMLElement | null): void {
      const options = this.options
      this.#activeIndex = option ? options.indexOf(option) : null
      syncListboxActiveDescendant(
        this.activeDescendantController,
        { host: this.listbox ?? this, options },
        this.#activeIndex,
      )
      option?.scrollIntoView?.({ block: 'nearest' })
    }

    private goToPage(page: number): void {
      const previous = this.#page
      this.#page = page
      const applied = this.refreshWindow()
      if (applied.page === previous) return
      this.emit('ui-page', { page: applied.page, totalPages: applied.totalPages })
    }

    private refreshWindow(): OptionWindow<HTMLElement> {
      const parts = this.listboxParts
      const applied = applyOptionWindow(parts.options as readonly HTMLElement[], {
        filter: this.searchable ? this.filter : 'off',
        page: this.#page,
        pageSize: this.pageCount,
        query: this.search?.value ?? '',
      })
      this.#page = applied.page
      syncListboxRegions(parts, applied)
      return applied
    }

    private initializeValue(value: string): void {
      if (this.#valueDirty) return
      this.applyDefaultValue(this.defaultValue || value)
    }

    private applyDefaultValue(value: string): void {
      this.#syncingDefaultValue = true
      try {
        this.value = value
      } finally {
        this.#syncingDefaultValue = false
      }
      if (this.multiple) {
        syncListboxSelection(this.listboxParts, value ? [value] : [])
      } else {
        syncSelectValue(this.parts, value)
      }
      this.afterSelectionChanged()
    }

    /**
     * Writes the selected label into the `value` part.
     *
     * The inequality check is load-bearing: writing an unchanged text node inside an element the
     * parts `MutationObserver` watches re-triggers enhancement forever.
     */
    private syncTriggerLabel(): void {
      // Scoped to the trigger: the `value` part sits inside it, and a `.ui-button` trigger is itself
      // a component root, so an ownership query from the host would never reach through it.
      const label = this.trigger?.querySelector<HTMLElement>(VALUE_SELECTOR)
      if (!label || this.multiple) return

      const selected = this.options.find(
        (option) => option.getAttribute('aria-selected') === 'true',
      )
      if (!selected) return
      const next = listboxOptionLabel(selected)
      if (label.textContent !== next) label.textContent = next
    }

    private get navigableOptions(): HTMLElement[] {
      return [...visibleOptions(this.options)]
    }

    private syncChips(): void {
      syncListboxChips(
        queryOwnedPart<HTMLElement>(this, CHIPS_SELECTOR),
        queryOwnedPart<HTMLTemplateElement>(this, CHIP_TEMPLATE_SELECTOR),
        this.options.filter((option) => option.getAttribute('aria-selected') === 'true'),
      )
    }

    /** The clear control is disabled while there is nothing to clear, and named only if unnamed. */
    private syncClearControl(): void {
      const clear = queryOwnedPart<HTMLElement>(this, CLEAR_SELECTOR)
      if (!clear) return

      const empty = this.values.length === 0
      if (clear instanceof this.ownerWindow.HTMLButtonElement) {
        clear.disabled = empty
      } else {
        clear.setAttribute('aria-disabled', String(empty))
      }
      if (!clear.hasAttribute('aria-label') && !clear.textContent?.trim()) {
        clear.setAttribute('aria-label', 'Clear selection')
      }
    }

    private commitFormValue(): void {
      const internals = this.internals
      if (!internals) return

      const values = this.isDisabled ? [] : this.values
      internals.setFormValue?.(
        collectionFormValue(this.name, values, this.ownerDocument.defaultView),
      )
      applyCollectionValidity(internals, {
        customError: this.#customValidity,
        anchor: this.trigger,
        disabled: this.isDisabled,
        required: this.required,
        values,
      })
      // The authored hidden input stays supported, so existing markup keeps submitting.
      const input = this.input
      if (input) input.value = values[0] ?? ''
    }

    private syncOpenState(open: boolean, originalEvent: Event | null): void {
      const changed = this.open !== open
      this.#syncingOpen = true
      try {
        this.open = open
      } finally {
        this.#syncingOpen = false
      }
      this.trigger?.setAttribute('aria-expanded', String(open))
      if (changed) this.emit(open ? 'ui-open' : 'ui-close', { open, originalEvent })
    }

    private clearSearch(): void {
      const search = this.search
      if (!search?.value) return
      search.value = ''
      this.#page = 0
      this.refreshWindow()
    }

    private pagerStepFromEvent(event: Event): number | null {
      if (this.closestTarget<HTMLElement>(event, PAGE_PREVIOUS_SELECTOR)) return -1
      if (this.closestTarget<HTMLElement>(event, PAGE_NEXT_SELECTOR)) return 1
      return null
    }

    /** Whichever field holds DOM focus is the one that names the active option. */
    private get activeDescendantController(): HTMLElement | null {
      return (this.searchable && this.search) || this.trigger
    }

    private get activeOption(): HTMLElement | null {
      return this.#activeIndex === null ? null : (this.options[this.#activeIndex] ?? null)
    }

    private get selectedOption(): HTMLElement | null {
      return (
        this.options.find(
          (option) => option.getAttribute('aria-selected') === 'true' && !option.hidden,
        ) ?? null
      )
    }

    private get isDisabled(): boolean {
      return this.disabled || this.#fieldsetDisabled
    }

    private get parts(): SelectEnhancementParts {
      return {
        host: this,
        input: this.input,
        trigger: this.trigger,
        listbox: this.listbox,
        surface: this.surface,
        options: this.options,
      }
    }

    /**
     * The empty, status, and pager regions are siblings of the listbox rather than children of it,
     * so they are resolved from the host. `queryOwnedPart` still stops at a nested component root.
     */
    private get listboxParts(): ListboxEnhancementParts {
      const listbox = this.listbox
      return {
        host: listbox ?? this,
        options: this.options,
        groups: listbox ? findOptionGroups(listbox) : [],
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

    private get options(): HTMLElement[] {
      return this.listbox ? findListboxOptions(this.listbox) : []
    }

    private get ownerWindow(): Window & typeof globalThis {
      return this.ownerDocument.defaultView ?? window
    }
  }

  return UISelectElement as unknown as UISelectElementConstructor
}

export const UISelectElement = createSelectElementClass()
export type UISelectElement = InstanceType<typeof UISelectElement>

export function enhanceSelectParts(
  parts: SelectEnhancementParts,
  options: SelectEnhancementOptions,
): SelectEnhancementResult {
  const missing = invalidSelectParts(parts)
  if (missing.length > 0) {
    return { status: 'invalid', missing }
  }
  if (!options.supportsPopover) {
    return { status: 'unsupported', feature: 'popover' }
  }

  const trigger = parts.trigger!
  const listbox = parts.listbox!
  const surface = parts.surface ?? listbox
  if (!listbox.id) {
    listbox.id = `${options.generatedIdPrefix}-listbox`
  }
  if (!surface.id) {
    surface.id = `${options.generatedIdPrefix}-surface`
  }

  syncFloatingAnchor(
    { host: parts.host, trigger, content: surface },
    { anchorName: options.anchorName },
  )
  trigger.setAttribute('aria-controls', listbox.id)
  trigger.setAttribute('aria-haspopup', 'listbox')
  /*
   * The trigger is the combobox, which is what the APG Select-Only Combobox pattern this component
   * declares actually says. Without the role it was a `button` carrying `aria-activedescendant`, and
   * no button role permits that attribute — axe called it critical, and a screen reader had no
   * relationship to follow to the active option.
   *
   * The cost is that `role="combobox"` does not take its name from its content, measured rather than
   * assumed: the same button computes "Ready" as a button and "" as a combobox. So the trigger needs
   * an author-supplied `aria-labelledby` or `aria-label`, which `checkMarkup` reports when it is
   * missing. Timeless wires relationships, never content, so it cannot invent the name here.
   *
   * An author-set `role` wins: a consumer who has deliberately chosen different semantics keeps them.
   */
  if (!trigger.hasAttribute('role')) {
    trigger.setAttribute('role', 'combobox')
  }
  if (!trigger.hasAttribute('aria-expanded')) {
    trigger.setAttribute('aria-expanded', 'false')
  }
  if (!surface.hasAttribute('popover')) {
    surface.setAttribute('popover', 'auto')
  }
  const triggerWiring = selectTriggerWiring(trigger)
  if (triggerWiring === 'authored') {
    // The browser opens the surface from this attribute alone, before any of this code runs.
    trigger.setAttribute('popovertarget', surface.id)
  }

  const listboxResult = enhanceListboxParts(
    { host: listbox, options: parts.options },
    {
      generatedIdPrefix: options.generatedIdPrefix,
      multiple: options.multiple ?? false,
      roving: false,
      value: options.value ?? parts.input?.value ?? '',
    },
  )
  const selectedIndex = listboxResult.status === 'enhanced' ? listboxResult.selectedIndex : null
  const optionIds = listboxResult.status === 'enhanced' ? listboxResult.optionIds : []
  // Enhancement runs again on every subtree mutation — including the chips this element writes —
  // so it has to restore the live selection rather than reset it from a single `value`.
  if (options.multiple) {
    syncListboxSelection({ host: listbox, options: parts.options }, options.values ?? [])
  } else {
    syncSelectValue(parts, options.value ?? parts.input?.value ?? '')
  }

  return {
    status: 'enhanced',
    listboxId: listbox.id,
    optionIds,
    selectedIndex,
    triggerWiring,
  }
}

/**
 * `popovertarget` is only honoured on a `<button>` or a button-typed `<input>`. Anything else has to
 * be toggled from a click listener, which is the one thing that stops working without JavaScript.
 */
function selectTriggerWiring(trigger: SelectElementLike): SelectTriggerWiring {
  const localName = (trigger as { localName?: string }).localName
  if (localName === 'button') return 'authored'
  if (localName !== 'input') return 'listener'
  const type = trigger.getAttribute('type')
  return type === 'button' || type === 'reset' ? 'authored' : 'listener'
}

/** Single-selection value sync. The listbox owns the option state; this keeps the input in step. */
export function syncSelectValue(parts: SelectEnhancementParts, value: string): number | null {
  if (parts.input) parts.input.value = value
  return syncBaseListboxValue(
    { host: parts.listbox ?? parts.host, options: parts.options },
    value,
    false,
  )
}

export function selectOptionValue(option: SelectOptionLike): string {
  return listboxOptionValue(option)
}

function sameValues(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function invalidSelectParts(parts: SelectEnhancementParts): readonly string[] {
  const missing: string[] = []
  if (!parts.trigger) missing.push('trigger')
  if (!parts.listbox) missing.push('listbox')
  if (parts.options.length === 0) missing.push('options')
  return missing
}

function nextAvailableSelectInstanceId(ownerDocument: Document): string {
  let id: string
  do {
    id = createId('ui-select', ownerDocument)
  } while (ownerDocument.getElementById(id))
  return id
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-select': UISelectElement
  }
}
