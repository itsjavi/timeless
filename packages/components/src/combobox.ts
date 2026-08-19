import {
  attr,
  createId,
  createUIElementClass,
  element,
  listen,
  property,
  watch,
} from '@timelessui/core'
import { supportsNativePopover } from './capabilities'
import {
  collectionNavigationTarget,
  firstEnabledCollectionItemIndex,
  isCollectionItemDisabled,
  lastEnabledCollectionItemIndex,
} from './collection'
import { syncFloatingAnchor } from './floating'
import {
  enhanceListboxParts,
  filterListboxOptions,
  listboxOptionValue,
  syncListboxActiveDescendant,
} from './listbox'
import { isPopoverOpen } from './popover'
import { queryOwnedPart, queryOwnedParts } from './parts'
import { transitionSourceFromEvent, type UITransitionDetail } from './events'

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
  readonly options: readonly ComboboxOptionLike[]
}

export type ComboboxEnhancementOptions = {
  readonly anchorName: string
  readonly generatedIdPrefix: string
  readonly supportsPopover: boolean
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

export type ComboboxChangeDetail = UITransitionDetail<string, 'select'>

const INPUT_SELECTOR = 'input[role="combobox"]'
const LISTBOX_SELECTOR = '[role="listbox"]'
const OPTION_SELECTOR = '[role="option"]'

export type UIComboboxElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    defaultValue: string
    value: string
  }
}

export function createComboboxElementClass(targetWindow?: Window): UIComboboxElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-combobox')
  class UIComboboxElement extends UIElementBase {
    @attr({ attribute: 'value' }) accessor defaultValue = ''
    @property accessor value = ''
    get input(): HTMLInputElement | null {
      return queryOwnedPart(this, INPUT_SELECTOR)
    }

    get listbox(): HTMLElement | null {
      return queryOwnedPart(this, LISTBOX_SELECTOR)
    }

    #activeIndex: number | null = null
    #syncingDefaultValue = false
    #valueDirty = false

    protected override connected(): void {
      this.observeParts((signal) => this.enhance(signal))
    }

    private enhance(signal: AbortSignal): void {
      const instanceId = nextAvailableComboboxInstanceId(this.ownerDocument)
      const result = enhanceComboboxParts(
        {
          host: this,
          input: this.input,
          listbox: this.listbox,
          options: this.options,
        },
        {
          anchorName: `--${instanceId}-anchor`,
          generatedIdPrefix: instanceId,
          supportsPopover: supportsNativePopover(this.ownerDocument.defaultView),
        },
      )

      if (result.status !== 'enhanced' || !this.input || !this.listbox) return

      if (this.#valueDirty) {
        this.input.value = this.value
      } else {
        this.applyDefaultValue(this.defaultValue || this.input.defaultValue || this.input.value)
      }
      this.input.form?.addEventListener('reset', this.handleFormReset, { signal })
      filterComboboxOptions(this.options, this.value)
    }

    @watch('value')
    syncValue(): void {
      if (!this.#syncingDefaultValue) this.#valueDirty = true
      if (this.input && this.input.value !== this.value) this.input.value = this.value
      filterComboboxOptions(this.options, this.value)
    }

    @watch('defaultValue')
    syncDefaultValue(): void {
      if (!this.#valueDirty) this.applyDefaultValue(this.defaultValue)
    }

    @listen('focusin')
    handleFocus(): void {
      if (!this.input) return
      filterComboboxOptions(this.options, this.input.value)
    }

    @listen('input')
    handleInput(event: Event): void {
      if (event.target !== this.input || !this.input) return

      this.value = this.input.value
      filterComboboxOptions(this.options, this.input.value)
      this.#activeIndex = null
      syncComboboxActiveDescendant(this.input, this.options, null)
      this.visibleOptions.length > 0 ? this.openListbox() : this.closeListbox()
    }

    @listen('keydown')
    handleKeyDown(event: KeyboardEvent): void {
      if (event.target !== this.input || !this.input) return

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        filterComboboxOptions(this.options, this.input.value)
        this.openListbox()
        const visibleOptions = this.visibleOptions
        const targetIndex =
          this.#activeIndex === null && event.key === 'ArrowUp'
            ? lastEnabledCollectionItemIndex(visibleOptions)
            : collectionNavigationTarget(
                visibleOptions,
                this.visibleIndex(this.#activeIndex),
                event.key,
                'vertical',
              )
        this.moveToVisibleIndex(targetIndex)
        return
      }

      if (
        (event.key === 'Home' || event.key === 'End') &&
        this.listbox &&
        isPopoverOpen(this.listbox)
      ) {
        event.preventDefault()
        this.moveToVisibleIndex(
          event.key === 'Home'
            ? firstEnabledCollectionItemIndex(this.visibleOptions)
            : lastEnabledCollectionItemIndex(this.visibleOptions),
        )
        return
      }

      if (event.key === 'Enter' && this.#activeIndex !== null) {
        event.preventDefault()
        this.selectOption(this.options[this.#activeIndex]!, event)
        return
      }

      if (event.key === 'Escape' && this.listbox && isPopoverOpen(this.listbox)) {
        event.preventDefault()
        this.closeListbox()
      }
    }

    @listen('pointerdown')
    handlePointerDown(event: PointerEvent): void {
      if (this.eventOption(event)) {
        event.preventDefault()
      }
    }

    @listen('click')
    handleClick(event: MouseEvent): void {
      const option = this.eventOption(event)
      if (!option || isCollectionItemDisabled(option)) return
      this.selectOption(option, event)
    }

    private eventOption(event: Event): HTMLElement | null {
      const option = this.closestTarget<HTMLElement>(event, OPTION_SELECTOR)
      return option && this.options.includes(option) ? option : null
    }

    private openListbox(): void {
      if (!this.input || !this.listbox || this.visibleOptions.length === 0) return
      if (!isPopoverOpen(this.listbox)) {
        this.listbox.showPopover()
      }
      this.input.setAttribute('aria-expanded', 'true')
    }

    private closeListbox(): void {
      if (!this.input || !this.listbox) return
      if (isPopoverOpen(this.listbox)) {
        this.listbox.hidePopover()
      }
      this.input.setAttribute('aria-expanded', 'false')
      this.#activeIndex = null
      syncComboboxActiveDescendant(this.input, this.options, null)
    }

    private selectOption(option: HTMLElement, originalEvent: Event): void {
      if (!this.input || isCollectionItemDisabled(option)) return
      const value = comboboxOptionValue(option)
      const detail: ComboboxChangeDetail = {
        originalEvent,
        previousValue: this.input.value,
        reason: 'select',
        source: transitionSourceFromEvent(originalEvent),
        value,
      }
      if (
        value === this.input.value ||
        !this.emit('ui-before-change', detail, { cancelable: true })
      ) {
        return
      }
      this.value = value
      this.emit('ui-change', detail)
      this.closeListbox()
      this.input.focus()
    }

    private handleFormReset = (): void => {
      queueMicrotask(() => {
        this.#valueDirty = false
        this.applyDefaultValue(this.defaultValue || this.input?.defaultValue || '')
      })
    }

    private applyDefaultValue(value: string): void {
      this.#syncingDefaultValue = true
      try {
        this.value = value
      } finally {
        this.#syncingDefaultValue = false
      }
      if (this.input && this.input.value !== value) this.input.value = value
    }

    private visibleIndex(optionIndex: number | null): number {
      if (optionIndex === null) return -1
      return this.visibleOptions.indexOf(this.options[optionIndex]!)
    }

    private moveToVisibleIndex(visibleIndex: number | null): void {
      if (visibleIndex === null) return

      const option = this.visibleOptions[visibleIndex]
      if (!option) return

      this.#activeIndex = this.options.indexOf(option)
      syncComboboxActiveDescendant(this.input, this.options, this.#activeIndex)
      option.scrollIntoView({ block: 'nearest' })
    }

    private get visibleOptions(): HTMLElement[] {
      return this.options.filter((option) => !option.hidden)
    }

    private get options(): HTMLElement[] {
      return this.listbox ? queryOwnedParts<HTMLElement>(this.listbox, OPTION_SELECTOR) : []
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
  if (!options.supportsPopover) {
    listbox.hidden = true
    return { status: 'unsupported', feature: 'popover' }
  }

  if (!input.id) input.id = `${options.generatedIdPrefix}-input`
  if (!listbox.id) listbox.id = `${options.generatedIdPrefix}-listbox`

  syncFloatingAnchor(
    { host: parts.host, trigger: input, content: listbox },
    { anchorName: options.anchorName },
  )
  input.setAttribute('role', 'combobox')
  input.setAttribute('aria-autocomplete', input.getAttribute('aria-autocomplete') ?? 'list')
  input.setAttribute('aria-expanded', 'false')
  input.setAttribute('aria-controls', listbox.id)
  input.setAttribute('autocomplete', input.getAttribute('autocomplete') ?? 'off')

  if (!listbox.hasAttribute('popover')) {
    listbox.setAttribute('popover', 'manual')
  }
  listbox.hidden = false

  const listboxResult = enhanceListboxParts(
    { host: listbox, options: parts.options },
    { generatedIdPrefix: options.generatedIdPrefix, multiple: false },
  )
  const optionIds = listboxResult.status === 'enhanced' ? listboxResult.optionIds : []

  return {
    status: 'enhanced',
    inputId: input.id,
    listboxId: listbox.id,
    optionIds,
  }
}

export function syncComboboxActiveDescendant(
  input: ComboboxInputLike | null,
  options: readonly ComboboxOptionLike[],
  activeIndex: number | null,
): number | null {
  if (!input) return null
  return syncListboxActiveDescendant(input, { host: input, options }, activeIndex)
}

export function filterComboboxOptions(
  options: readonly ComboboxOptionLike[],
  value: string,
): readonly ComboboxOptionLike[] {
  return filterListboxOptions(options, value) as readonly ComboboxOptionLike[]
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
