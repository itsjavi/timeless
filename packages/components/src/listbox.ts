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
  collectionItemText,
  collectionTextMatches,
  collectionNavigationTarget,
  findCollectionItemByTextPrefix,
  isCollectionItemDisabled,
  syncRovingTabIndex,
} from './collection'
import { queryOwnedParts } from './parts'
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

export type ListboxEnhancementParts = {
  readonly host: ListboxHostLike
  readonly options: readonly ListboxOptionLike[]
}

export type ListboxEnhancementOptions = {
  readonly generatedIdPrefix: string
  readonly multiple: boolean
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

export type ListboxChangeReason = 'select' | 'toggle'

export type ListboxChangeDetail = UITransitionDetail<string, ListboxChangeReason> & {
  readonly values: readonly string[]
}

const OPTION_SELECTOR = '[role="option"]'
const TYPEAHEAD_RESET_MS = 700

let typeaheadTimerFallback = 0

export type UIListboxElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    multiple: boolean
    value: string
  }
}

export function createListboxElementClass(targetWindow?: Window): UIListboxElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-listbox')
  class UIListboxElement extends UIElementBase {
    @boolAttr accessor multiple = false
    @attr({ attribute: 'value' }) accessor defaultValue = ''
    @property accessor value = ''

    #syncingDefaultValue = false
    #typeahead = ''
    #typeaheadTimer = 0
    #valueDirty = false

    protected override connected(): void {
      this.observeParts(() => this.enhance())
    }

    protected override disconnected(): void {
      this.clearTypeahead()
    }

    private enhance(): void {
      const result = enhanceListboxParts(
        { host: this, options: this.options },
        {
          generatedIdPrefix: nextAvailableListboxInstanceId(this.ownerDocument),
          multiple: this.multiple,
          value: this.value,
        },
      )
      if (
        result.status === 'enhanced' &&
        !this.multiple &&
        !this.#valueDirty &&
        result.value !== this.value
      ) {
        this.applyInitialValue(this.defaultValue || result.value)
      }
    }

    @watch('multiple')
    syncMultiple(): void {
      this.multiple
        ? this.setAttribute('aria-multiselectable', 'true')
        : this.removeAttribute('aria-multiselectable')
    }

    @watch('value')
    syncValue(): void {
      if (!this.#syncingDefaultValue) this.#valueDirty = true
      if (this.multiple) return
      syncListboxValue({ host: this, options: this.options }, this.value)
    }

    @watch('defaultValue')
    syncDefaultValue(): void {
      if (!this.#valueDirty) this.applyInitialValue(this.defaultValue)
    }

    reset(): void {
      this.#valueDirty = false
      this.applyInitialValue(this.defaultValue)
    }

    @listen('click')
    handleClick(event: Event): void {
      const option = this.eventOption(event)
      if (!option || isCollectionItemDisabled(option)) return

      this.selectOption(option, event)
    }

    @listen('keydown')
    handleKeyDown(event: KeyboardEvent): void {
      const option = this.eventOption(event)
      if (!option) return

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        if (!isCollectionItemDisabled(option)) {
          this.selectOption(option, event)
        }
        return
      }

      const targetIndex = collectionNavigationTarget(
        this.options,
        this.options.indexOf(option),
        event.key,
        'vertical',
      )
      if (targetIndex !== null) {
        event.preventDefault()
        this.moveTo(targetIndex)
        return
      }

      if (isTypeaheadEvent(event)) {
        this.#typeahead += event.key
        const typeaheadIndex = findCollectionItemByTextPrefix(
          this.options,
          this.#typeahead,
          this.options.indexOf(option),
        )
        this.scheduleTypeaheadReset()
        if (typeaheadIndex !== null) {
          event.preventDefault()
          this.moveTo(typeaheadIndex)
        }
      }
    }

    private moveTo(index: number): void {
      const resolvedIndex = syncListboxActiveOption({ host: this, options: this.options }, index)
      if (resolvedIndex !== null) {
        this.options[resolvedIndex]?.focus?.()
      }
    }

    private selectOption(option: HTMLElement, originalEvent: Event): void {
      const previousValues = selectedListboxValues(this.options)
      const previousValue = this.multiple ? (previousValues[0] ?? '') : this.value
      const optionValue = listboxOptionValue(option)
      const nextValues = this.multiple
        ? option.getAttribute('aria-selected') === 'true'
          ? previousValues.filter((value) => value !== optionValue)
          : [...previousValues, optionValue]
        : [optionValue]
      const value = nextValues[0] ?? ''
      const reason: ListboxChangeReason = this.multiple ? 'toggle' : 'select'
      const detail: ListboxChangeDetail = {
        originalEvent,
        previousValue,
        reason,
        source: transitionSourceFromEvent(originalEvent),
        value,
        values: nextValues,
      }
      if (!this.emit('ui-before-change', detail, { cancelable: true })) return

      if (this.multiple) {
        const selected = option.getAttribute('aria-selected') === 'true'
        option.setAttribute('aria-selected', String(!selected))
        syncListboxActiveOption({ host: this, options: this.options }, this.options.indexOf(option))
        this.emit('ui-change', detail)
        return
      }

      this.value = value
      syncListboxValue({ host: this, options: this.options }, value)
      this.emit('ui-change', detail)
    }

    private eventOption(event: Event): HTMLElement | null {
      const option = this.closestTarget<HTMLElement>(event, OPTION_SELECTOR)
      return option && this.options.includes(option) ? option : null
    }

    private scheduleTypeaheadReset(): void {
      this.clearTypeaheadTimer()
      const ownerWindow = this.ownerDocument.defaultView
      this.#typeaheadTimer = ownerWindow
        ? ownerWindow.setTimeout(() => this.clearTypeahead(), TYPEAHEAD_RESET_MS)
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

    private applyInitialValue(value: string): void {
      this.#syncingDefaultValue = true
      try {
        this.value = value
      } finally {
        this.#syncingDefaultValue = false
      }
      if (!this.multiple) syncListboxValue({ host: this, options: this.options }, value)
    }

    private get options(): HTMLElement[] {
      return findListboxOptions(this)
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
    option.setAttribute('role', 'option')
    option.setAttribute('tabindex', '-1')
    if (!option.hasAttribute('aria-selected')) {
      option.setAttribute('aria-selected', 'false')
    }
    return option.id
  })

  const selectedIndex = options.multiple
    ? firstSelectedListboxIndex(parts.options)
    : syncListboxValue(parts, options.value ?? '')
  const activeIndex = syncListboxActiveOption(parts, selectedIndex)
  const value = activeIndex === null ? '' : listboxOptionValue(parts.options[activeIndex]!)

  return { status: 'enhanced', activeIndex, optionIds, selectedIndex, value }
}

export function syncListboxValue(parts: ListboxEnhancementParts, value: string): number | null {
  const selectedIndex = parts.options.findIndex((option) => listboxOptionValue(option) === value)

  parts.options.forEach((option, index) => {
    option.setAttribute('aria-selected', String(index === selectedIndex))
  })

  syncListboxActiveOption(parts, selectedIndex)
  return selectedIndex >= 0 ? selectedIndex : null
}

export function syncListboxActiveOption(
  parts: ListboxEnhancementParts,
  activeIndex: number | null,
): number | null {
  const visibleOptions = visibleListboxOptions(parts.options)
  const activeOption =
    activeIndex === null || activeIndex < 0 || activeIndex >= parts.options.length
      ? null
      : parts.options[activeIndex]
  const visibleIndex = activeOption ? visibleOptions.indexOf(activeOption) : -1
  const resolvedVisibleIndex = syncRovingTabIndex(
    visibleOptions,
    visibleIndex >= 0 ? visibleIndex : null,
  )
  const resolvedOption =
    resolvedVisibleIndex === null ? null : (visibleOptions[resolvedVisibleIndex] ?? null)

  parts.options.forEach((option) => {
    if (option === resolvedOption) {
      option.setAttribute('data-ui-internal-active', '')
    } else {
      option.removeAttribute('data-ui-internal-active')
      if (!visibleOptions.includes(option)) {
        option.setAttribute('tabindex', '-1')
      }
    }
  })

  return resolvedOption ? parts.options.indexOf(resolvedOption) : null
}

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

  const resolvedIndex = syncListboxActiveOption(parts, activeIndex)
  parts.options.forEach((option, index) => {
    option.setAttribute('aria-selected', String(index === resolvedIndex))
  })

  if (resolvedIndex === null) {
    controller.removeAttribute('aria-activedescendant')
    return null
  }

  controller.setAttribute('aria-activedescendant', parts.options[resolvedIndex]!.id)
  return resolvedIndex
}

export function filterListboxOptions(
  options: readonly ListboxOptionLike[],
  value: string,
): readonly ListboxOptionLike[] {
  const query = normalizeListboxText(value)
  const visible: ListboxOptionLike[] = []

  options.forEach((option) => {
    const matches = collectionTextMatches(collectionItemText(option), query)
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

export function findListboxOptions(host: Element): HTMLElement[] {
  return queryOwnedParts(host, OPTION_SELECTOR)
}

function visibleListboxOptions(
  options: readonly ListboxOptionLike[],
): readonly ListboxOptionLike[] {
  return options.filter((option) => !option.hidden)
}

function firstSelectedListboxIndex(options: readonly ListboxOptionLike[]): number | null {
  const index = options.findIndex((option) => option.getAttribute('aria-selected') === 'true')
  return index >= 0 ? index : null
}

function clearListboxActiveOption(options: readonly ListboxOptionLike[]): void {
  options.forEach((option) => {
    option.removeAttribute('data-ui-internal-active')
    option.setAttribute('tabindex', '-1')
    option.setAttribute('aria-selected', 'false')
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

function normalizeListboxText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase()
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
