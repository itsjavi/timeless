/**
 * Combobox: a text input over the listbox core.
 *
 * Select and Combobox are the same ARIA pattern over the same option core, and this file is
 * deliberately Select's twin. The only real difference is where typing happens: a Combobox types in
 * its trigger, a `searchable` Select types in a field inside its surface. Everything else — groups,
 * chips, the clear control, the empty and status regions, paging, form participation — is the same
 * anatomy, the same attributes, and the same events.
 *
 * The three pass-through aliases this module used to carry — `syncComboboxActiveDescendant`,
 * `filterComboboxOptions`, and `comboboxOptionValue`, each a single call into a listbox function —
 * are now re-exports rather than wrappers. The names survive because they are public; the bodies do
 * not, because they were duplication wearing a different name.
 *
 * `filter="off"` is the extension point. Built-in filtering is skipped, `ui-input` fires with the
 * query, and whatever the consumer hides stays hidden — navigation, the empty state, group collapse,
 * and paging all keep working, because every one of them reads `hidden` and nothing else.
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
  firstEnabledCollectionItemIndex,
  isCollectionItemDisabled,
  lastEnabledCollectionItemIndex,
} from './collection'
import { applyFloatingPosition, clearFloatingPosition, syncFloatingAnchor } from './floating'
import {
  enhanceListboxParts,
  filterListboxOptions,
  findListboxOptions,
  listboxOptionValue,
  selectedListboxValues,
  syncListboxActiveDescendant,
  syncListboxChips,
  syncListboxRegions,
  syncListboxSelection,
  type ListboxEnhancementParts,
} from './listbox'
import {
  applyOptionWindow,
  findOptionGroups,
  OPTION_SELECTOR,
  visibleOptions,
  type OptionFilterMode,
  type OptionWindow,
} from './options'
import { isPopoverOpen } from './popover'
import { queryOwnedPart } from './parts'
import { transitionSourceFromEvent, type UITransitionDetail } from './events'
import type { CollectionAlignment } from './values/options'
import { applyCollectionValidity, collectionFormValue } from './value-state'

export type ComboboxInputLike = {
  id: string
  value: string
  readonly style: {
    removeProperty(name: string): void
    setProperty(name: string, value: string): void
  }
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type ComboboxHostLike = {
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type ComboboxOptionLike = {
  id: string
  hidden: boolean | 'until-found'
  readonly textContent?: string | null
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  matches?(selector: string): boolean
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type ComboboxListboxLike = {
  id: string
  hidden: boolean | 'until-found'
  readonly style: {
    removeProperty(name: string): void
    setProperty(name: string, value: string): void
  }
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type ComboboxEnhancementParts = {
  readonly host: ComboboxHostLike
  readonly input: ComboboxInputLike | null
  readonly listbox: ComboboxListboxLike | null
  /** The popover. Defaults to the listbox, which is its own surface in the simple shape. */
  readonly surface?: ComboboxListboxLike | null
  readonly options: readonly ComboboxOptionLike[]
}

export type ComboboxEnhancementOptions = {
  readonly anchorName: string
  readonly generatedIdPrefix: string
  readonly multiple?: boolean
  readonly supportsPopover: boolean
  /** The live selection, which re-enhancement must preserve rather than reset. */
  readonly values?: readonly string[]
}

export type ComboboxEnhancementResult =
  | {
      readonly status: 'enhanced'
      readonly inputId: string
      readonly listboxId: string
      readonly optionIds: readonly string[]
    }
  | { readonly status: 'invalid'; readonly missing: readonly string[] }
  | { readonly status: 'unsupported'; readonly feature: 'popover' }

export type ComboboxChangeReason = 'select' | 'toggle' | 'clear' | 'remove'

export type ComboboxChangeDetail = UITransitionDetail<string, ComboboxChangeReason> & {
  readonly values: readonly string[]
}

export type ComboboxToggleDetail = {
  readonly open: boolean
  readonly originalEvent: Event | null
}

export type ComboboxInputDetail = {
  readonly filter: OptionFilterMode
  readonly originalEvent: Event | null
  readonly query: string
}

export type ComboboxPageDetail = {
  readonly page: number
  readonly totalPages: number
}

const INPUT_SELECTOR = 'input[role="combobox"]'
const LISTBOX_SELECTOR = '[role="listbox"]'
const SURFACE_SELECTOR = "[data-ui-part~='surface']"
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

export type UIComboboxElementConstructor = CustomElementConstructor & {
  elementName?: string
  formAssociated?: boolean
  new (): HTMLElement & {
    align: CollectionAlignment
    defaultValue: string
    disabled: boolean
    filter: OptionFilterMode
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
    setCustomValidity(message: string): void
  }
}

export function createComboboxElementClass(targetWindow?: Window): UIComboboxElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-combobox')
  class UIComboboxElement extends UIElementBase {
    static formAssociated = true

    @attr({ attribute: 'value' }) accessor defaultValue = ''
    @property accessor value = ''
    @attr accessor align: CollectionAlignment = 'start'
    @attr accessor filter: OptionFilterMode = 'contains'
    @attr accessor name = ''
    @attr({ attribute: 'page-size' }) accessor pageSize = ''
    @boolAttr accessor multiple = false
    @boolAttr accessor required = false
    @boolAttr accessor disabled = false

    get input(): HTMLInputElement | null {
      return queryOwnedPart(this, INPUT_SELECTOR)
    }

    get listbox(): HTMLElement | null {
      return queryOwnedPart(this, LISTBOX_SELECTOR)
    }

    /**
     * The popover. It is the listbox itself in the simple shape, and its authored wrapper whenever
     * the surface also holds a header, a footer, or a pager — a `role="listbox"` may own only
     * options and groups, so those siblings live beside it rather than inside it.
     */
    get surface(): HTMLElement | null {
      return queryOwnedPart<HTMLElement>(this, SURFACE_SELECTOR) ?? this.listbox
    }

    #activeIndex: number | null = null
    #customValidity = ''
    #fieldsetDisabled = false
    #open = false
    #page = 0
    #syncingDefaultValue = false
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
      const instanceId = nextAvailableComboboxInstanceId(this.ownerDocument)
      const result = enhanceComboboxParts(
        {
          host: this,
          input: this.input,
          listbox: this.listbox,
          surface: this.surface,
          options: this.options,
        },
        {
          anchorName: `--${instanceId}-anchor`,
          generatedIdPrefix: instanceId,
          multiple: this.multiple,
          supportsPopover: supportsNativePopover(this.ownerDocument.defaultView),
          values: this.values,
        },
      )

      const surface = this.surface
      if (result.status !== 'enhanced' || !this.input || !surface) return

      if (this.#valueDirty) {
        this.input.value = this.value
      } else {
        this.applyDefaultValue(this.defaultValue || this.input.defaultValue || this.input.value)
      }
      this.on(surface, 'toggle', this.handleToggle, { signal })
      this.on(this.ownerWindow, 'resize', this.handleFloatingEnvironmentChange, { signal })
      this.on(this.ownerWindow, 'scroll', this.handleFloatingEnvironmentChange, { signal })
      this.input.form?.addEventListener('reset', this.handleFormReset, { signal })
      this.refreshWindow()
      this.afterSelectionChanged()
      this.syncFormState()
    }

    @watch('value')
    syncValue(): void {
      if (!this.#syncingDefaultValue) this.#valueDirty = true
      if (this.input && this.input.value !== this.value) this.input.value = this.value
      this.refreshWindow()
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
      if (this.input) this.input.disabled = this.isDisabled
      this.commitFormValue()
    }

    @watch('pageSize')
    @watch('filter')
    syncWindowConfiguration(): void {
      this.#page = 0
      this.refreshWindow()
    }

    updateFloatingPosition(): void {
      const surface = this.surface
      if (!this.input || !surface || !isPopoverOpen(surface)) return
      if (supportsAnchorPositioning(this.ownerDocument.defaultView)) return

      applyFloatingPosition({
        align: this.align === 'end' ? 'end' : 'start',
        content: surface,
        placement: 'bottom',
        trigger: this.input,
      })
    }

    reset(): void {
      this.#valueDirty = false
      this.#page = 0
      this.applyDefaultValue(this.defaultValue || this.input?.defaultValue || '')
      this.refreshWindow()
    }

    @listen('focusin')
    handleFocus(): void {
      if (this.isDisabled) return
      this.refreshWindow()
    }

    @listen('input')
    handleInput(event: Event): void {
      if (event.target !== this.input || !this.input) return

      this.value = this.input.value
      this.#page = 0
      this.emit('ui-input', {
        filter: this.filter,
        originalEvent: event,
        query: this.input.value,
      })
      this.refreshWindow()
      this.moveActiveTo(null)
      this.hasSurfaceContent ? this.openListbox(event) : this.closeListbox(event)
    }

    @listen('keydown')
    handleKeyDown(event: KeyboardEvent): void {
      if (event.target !== this.input || !this.input || this.isDisabled) return

      // Horizontal arrows are caret movement. Only a grid-layout surface navigates with them.
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') return

      if (this.handleChipBackspace(event)) return

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        this.refreshWindow()
        this.openListbox(event)
        const navigable = this.navigableOptions
        const targetIndex =
          this.#activeIndex === null && event.key === 'ArrowUp'
            ? lastEnabledCollectionItemIndex(navigable)
            : collectionNavigationTarget(
                navigable,
                this.navigableIndex(this.#activeIndex),
                event.key,
                'vertical',
              )
        this.moveActiveTo(targetIndex === null ? null : (navigable[targetIndex] ?? null))
        return
      }

      if ((event.key === 'Home' || event.key === 'End') && this.#open) {
        event.preventDefault()
        const navigable = this.navigableOptions
        const targetIndex =
          event.key === 'Home'
            ? firstEnabledCollectionItemIndex(navigable)
            : lastEnabledCollectionItemIndex(navigable)
        this.moveActiveTo(targetIndex === null ? null : (navigable[targetIndex] ?? null))
        return
      }

      if (event.key === 'Enter' && this.#activeIndex !== null) {
        event.preventDefault()
        this.selectOption(this.options[this.#activeIndex]!, event)
        return
      }

      if (event.key === 'Escape' && this.#open) {
        event.preventDefault()
        this.closeListbox(event)
      }
    }

    @listen('pointerdown')
    handlePointerDown(event: PointerEvent): void {
      // Keep DOM focus in the input; clicking an option must not blur it.
      if (this.eventOption(event)) event.preventDefault()
    }

    @listen('click')
    handleClick(event: MouseEvent): void {
      if (this.isDisabled) return

      const clearControl = this.closestTarget<HTMLElement>(event, CLEAR_SELECTOR)
      if (clearControl) {
        event.preventDefault()
        // An `aria-disabled` control still activates, so the no-op lives here.
        if (clearControl.getAttribute('aria-disabled') === 'true') return
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

      const option = this.eventOption(event)
      if (!option || isCollectionItemDisabled(option)) return
      this.selectOption(option, event)
    }

    /** Backspace in an empty input removes the last chip, as a token field does. */
    private handleChipBackspace(event: KeyboardEvent): boolean {
      if (event.key !== 'Backspace' || !this.multiple || this.input?.value) return false

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
        return
      }
      this.updateFloatingPosition()
    }

    private handleFormReset = (): void => {
      queueMicrotask(() => this.reset())
    }

    private eventOption(event: Event): HTMLElement | null {
      const option = this.closestTarget<HTMLElement>(event, OPTION_SELECTOR)
      return option && this.options.includes(option) ? option : null
    }

    private openListbox(originalEvent: Event | null = null): void {
      const surface = this.surface
      if (!this.input || !surface || !this.hasSurfaceContent) return
      if (!isPopoverOpen(surface)) surface.showPopover?.()
      this.syncOpenState(true, originalEvent)
    }

    /**
     * Whether the surface has anything to show. An authored `empty` region counts: closing on zero
     * matches would mean the empty state could never be read.
     */
    private get hasSurfaceContent(): boolean {
      return this.navigableOptions.length > 0 || queryOwnedPart(this, EMPTY_SELECTOR) !== null
    }

    private closeListbox(originalEvent: Event | null = null): void {
      const surface = this.surface
      if (!this.input || !surface) return
      if (isPopoverOpen(surface)) surface.hidePopover()
      this.syncOpenState(false, originalEvent)
      this.moveActiveTo(null)
    }

    private selectOption(option: HTMLElement, originalEvent: Event): void {
      const value = comboboxOptionValue(option)
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
      reason: ComboboxChangeReason,
      originalEvent: Event | null,
    ): void {
      const previousValues = this.values
      const detail: ComboboxChangeDetail = {
        originalEvent,
        previousValue: previousValues[0] ?? this.input?.value ?? '',
        reason,
        source: transitionSourceFromEvent(originalEvent),
        value: nextValues[0] ?? '',
        values: nextValues,
      }
      if (!this.emit('ui-before-change', detail, { cancelable: true })) return

      this.#valueDirty = true
      syncListboxSelection(this.listboxParts, nextValues)
      if (this.multiple) {
        // The input is the search field under `multiple`; the selection lives in the chips.
        if (this.input) this.input.value = ''
        this.refreshWindow()
      } else {
        this.value = detail.value
        this.closeListbox(originalEvent)
      }
      this.afterSelectionChanged()
      this.emit('ui-change', detail)
      this.input?.focus()
    }

    private afterSelectionChanged(): void {
      this.syncChips()
      this.syncClearControl()
      this.commitFormValue()
    }

    private moveActiveTo(option: HTMLElement | null): void {
      const options = this.options
      this.#activeIndex = option ? options.indexOf(option) : null
      syncComboboxActiveDescendant(this.input, options, this.#activeIndex)
      option?.scrollIntoView?.({ block: 'nearest' })
    }

    private goToPage(page: number): void {
      const previous = this.#page
      this.#page = page
      const applied = this.refreshWindow()
      if (applied.page === previous) return
      this.emit('ui-page', { page: applied.page, totalPages: applied.totalPages })
    }

    /**
     * Under `filter="off"` this writes no visibility of its own: the consumer already set `hidden`
     * from the `ui-input` event, and the pager narrows what is left.
     */
    private refreshWindow(): OptionWindow<HTMLElement> {
      const parts = this.listboxParts
      const applied = applyOptionWindow(parts.options as readonly HTMLElement[], {
        filter: this.filter,
        page: this.#page,
        pageSize: this.pageCount,
        query: this.input?.value ?? '',
      })
      this.#page = applied.page
      syncListboxRegions(parts, applied)
      return applied
    }

    private applyDefaultValue(value: string): void {
      this.#syncingDefaultValue = true
      try {
        this.value = value
      } finally {
        this.#syncingDefaultValue = false
      }
      if (this.input && this.input.value !== value) this.input.value = value
      syncListboxSelection(this.listboxParts, value ? [value] : [])
      this.afterSelectionChanged()
    }

    private syncChips(): void {
      syncListboxChips(
        queryOwnedPart<HTMLElement>(this, CHIPS_SELECTOR),
        queryOwnedPart<HTMLTemplateElement>(this, CHIP_TEMPLATE_SELECTOR),
        this.options.filter((option) => option.getAttribute('aria-selected') === 'true'),
      )
    }

    private syncClearControl(): void {
      const clear = queryOwnedPart<HTMLElement>(this, CLEAR_SELECTOR)
      if (!clear) return

      const empty = this.values.length === 0 && !this.input?.value
      /*
       * `aria-disabled`, never `disabled`: clearing the selection is what empties it, so the control
       * would be disabled at the instant it was activated — and a disabled element that holds focus
       * sends focus to `<body>`. Marked and inert keeps the user where they are.
       */
      if (empty) clear.setAttribute('aria-disabled', 'true')
      else clear.removeAttribute('aria-disabled')
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
        anchor: this.input,
        disabled: this.isDisabled,
        required: this.required,
        values,
      })
    }

    private syncOpenState(open: boolean, originalEvent: Event | null): void {
      const changed = this.#open !== open
      this.#open = open
      this.input?.setAttribute('aria-expanded', String(open))
      if (changed) this.emit(open ? 'ui-open' : 'ui-close', { open, originalEvent })
    }

    private pagerStepFromEvent(event: Event): number | null {
      if (this.closestTarget<HTMLElement>(event, PAGE_PREVIOUS_SELECTOR)) return -1
      if (this.closestTarget<HTMLElement>(event, PAGE_NEXT_SELECTOR)) return 1
      return null
    }

    private navigableIndex(optionIndex: number | null): number {
      if (optionIndex === null) return -1
      return this.navigableOptions.indexOf(this.options[optionIndex]!)
    }

    private get isDisabled(): boolean {
      return this.disabled || this.#fieldsetDisabled
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

    private get navigableOptions(): HTMLElement[] {
      return [...visibleOptions(this.options)]
    }

    private get options(): HTMLElement[] {
      return this.listbox ? findListboxOptions(this.listbox) : []
    }

    private get ownerWindow(): Window & typeof globalThis {
      return this.ownerDocument.defaultView ?? window
    }
  }

  return UIComboboxElement as unknown as UIComboboxElementConstructor
}

export const UIComboboxElement = createComboboxElementClass()
export type UIComboboxElement = InstanceType<typeof UIComboboxElement>

export function enhanceComboboxParts(
  parts: ComboboxEnhancementParts,
  options: ComboboxEnhancementOptions,
): ComboboxEnhancementResult {
  const missing = invalidComboboxParts(parts)
  if (missing.length > 0) {
    return { status: 'invalid', missing }
  }

  const input = parts.input!
  const listbox = parts.listbox!
  const surface = parts.surface ?? listbox
  if (!options.supportsPopover) {
    surface.hidden = true
    return { status: 'unsupported', feature: 'popover' }
  }

  if (!input.id) input.id = `${options.generatedIdPrefix}-input`
  if (!listbox.id) listbox.id = `${options.generatedIdPrefix}-listbox`
  if (!surface.id) surface.id = `${options.generatedIdPrefix}-surface`

  syncFloatingAnchor(
    { host: parts.host, trigger: input, content: surface },
    { anchorName: options.anchorName },
  )
  input.setAttribute('role', 'combobox')
  input.setAttribute('aria-autocomplete', input.getAttribute('aria-autocomplete') ?? 'list')
  if (!input.hasAttribute('aria-expanded')) input.setAttribute('aria-expanded', 'false')
  input.setAttribute('aria-controls', listbox.id)
  input.setAttribute('autocomplete', input.getAttribute('autocomplete') ?? 'off')

  if (!surface.hasAttribute('popover')) {
    surface.setAttribute('popover', 'manual')
  }
  surface.hidden = false

  const listboxResult = enhanceListboxParts(
    { host: listbox, options: parts.options },
    {
      generatedIdPrefix: options.generatedIdPrefix,
      multiple: options.multiple ?? false,
      roving: false,
    },
  )
  const optionIds = listboxResult.status === 'enhanced' ? listboxResult.optionIds : []
  // Enhancement runs again on every subtree mutation — the chips this element writes included.
  if (options.values) {
    syncListboxSelection({ host: listbox, options: parts.options }, options.values)
  }

  return { status: 'enhanced', inputId: input.id, listboxId: listbox.id, optionIds }
}

/**
 * Points the input's `aria-activedescendant` at the active option.
 *
 * A re-export in all but name: the implementation is the listbox's, because a combobox and a listbox
 * agree on what an active option is.
 */
export function syncComboboxActiveDescendant(
  input: ComboboxInputLike | null,
  options: readonly ComboboxOptionLike[],
  activeIndex: number | null,
): number | null {
  return syncListboxActiveDescendant(input, { host: input!, options }, activeIndex)
}

export function filterComboboxOptions(
  options: readonly ComboboxOptionLike[],
  value: string,
  mode: OptionFilterMode = 'contains',
): readonly ComboboxOptionLike[] {
  return filterListboxOptions(options, value, mode) as readonly ComboboxOptionLike[]
}

export function comboboxOptionValue(option: ComboboxOptionLike): string {
  return listboxOptionValue(option)
}

function invalidComboboxParts(parts: ComboboxEnhancementParts): readonly string[] {
  const missing: string[] = []
  if (!parts.input) missing.push('input')
  if (!parts.listbox) missing.push('listbox')
  return missing
}

function nextAvailableComboboxInstanceId(ownerDocument: Document): string {
  let id: string
  do {
    id = createId('ui-combobox', ownerDocument)
  } while (ownerDocument.getElementById(id))
  return id
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-combobox': UIComboboxElement
  }
}
