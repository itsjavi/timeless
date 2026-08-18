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
import { isCollectionItemDisabled, collectionNavigationTarget } from './collection'
import {
  applyFloatingPosition,
  clearFloatingPosition,
  resolveFloatingPlacement,
  syncFloatingAnchor,
  type FloatingPlacement,
} from './floating'
import { isPopoverOpen } from './popover'
import { transitionSourceFromEvent, type UITransitionDetail } from './events'
import { queryOwnedPart, queryOwnedParts } from './parts'
import {
  enhanceListboxParts,
  listboxOptionValue,
  syncListboxActiveOption,
  syncListboxValue as syncBaseListboxValue,
} from './listbox'

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
  readonly options: readonly SelectOptionLike[]
}

export type SelectEnhancementOptions = {
  readonly anchorName: string
  readonly generatedIdPrefix: string
  readonly supportsPopover: boolean
  readonly value?: string
}

export type SelectEnhancementResult =
  | {
      readonly status: 'enhanced'
      readonly listboxId: string
      readonly optionIds: readonly string[]
      readonly selectedIndex: number | null
    }
  | { readonly status: 'invalid'; readonly missing: readonly string[] }
  | { readonly status: 'unsupported'; readonly feature: 'popover' }

export type SelectChangeDetail = UITransitionDetail<string, 'select'>

const TRIGGER_SELECTOR = "[data-ui-part~='trigger']"
const INPUT_SELECTOR = 'input[type="hidden"]'
const LISTBOX_SELECTOR = '[role="listbox"]'
const OPTION_SELECTOR = '[role="option"]'

export type UISelectElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    open: boolean
    placement: FloatingPlacement
    value: string
  }
}

export function createSelectElementClass(targetWindow?: Window): UISelectElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-select')
  class UISelectElement extends UIElementBase {
    @attr({ attribute: 'value' }) accessor defaultValue = ''
    @property accessor value = ''
    @attr accessor placement: FloatingPlacement = 'bottom'
    @boolAttr accessor open = false
    get input(): HTMLInputElement | null {
      return queryOwnedPart(this, INPUT_SELECTOR)
    }

    get trigger(): HTMLElement | null {
      return queryOwnedPart(this, TRIGGER_SELECTOR)
    }

    get listbox(): HTMLElement | null {
      return queryOwnedPart(this, LISTBOX_SELECTOR)
    }

    #syncingOpen = false
    #syncingDefaultValue = false
    #valueDirty = false

    private handleFloatingEnvironmentChange = (): void => {
      this.updateFloatingPosition()
    }

    protected override connected(): void {
      this.observeParts((signal) => this.enhance(signal))
    }

    private enhance(signal: AbortSignal): void {
      const instanceId = nextAvailableSelectInstanceId(this.ownerDocument)
      const result = enhanceSelectParts(
        {
          host: this,
          input: this.input,
          trigger: this.trigger,
          listbox: this.listbox,
          options: this.options,
        },
        {
          anchorName: `--${instanceId}-anchor`,
          generatedIdPrefix: instanceId,
          supportsPopover: supportsNativePopover(this.ownerDocument.defaultView),
          value: this.value || this.input?.value,
        },
      )

      if (result.status !== 'enhanced' || !this.listbox) return

      const selectedOption =
        result.selectedIndex === null ? null : this.options[result.selectedIndex]
      this.initializeValue(selectedOption ? selectOptionValue(selectedOption) : '')
      this.on(this.listbox, 'toggle', this.handleToggle, { signal })
      this.on(this.ownerWindow, 'resize', this.handleFloatingEnvironmentChange, { signal })
      this.on(this.ownerWindow, 'scroll', this.handleFloatingEnvironmentChange, { signal })
      this.input?.form?.addEventListener('reset', this.handleFormReset, { signal })
      this.syncOpenState(isPopoverOpen(this.listbox))
    }

    @watch('open')
    syncOpen(): void {
      if (this.#syncingOpen) return
      if (this.open) {
        this.openListbox()
      } else {
        this.closeListbox()
      }
    }

    @watch('value')
    syncValue(): void {
      if (!this.#syncingDefaultValue) this.#valueDirty = true
      syncSelectValue(this.parts, this.value)
      this.syncTriggerLabel()
    }

    @watch('defaultValue')
    syncDefaultValue(): void {
      if (!this.#valueDirty) this.applyDefaultValue(this.defaultValue)
    }

    @watch('placement')
    updateFloatingPosition(): void {
      if (!this.trigger || !this.listbox || !isPopoverOpen(this.listbox)) return

      applyFloatingPosition({
        content: this.listbox,
        placement: resolveFloatingPlacement(this.placement),
        trigger: this.trigger,
      })
    }

    @listen('click')
    handleClick(event: Event): void {
      const trigger = this.closestTarget<HTMLElement>(event, TRIGGER_SELECTOR)
      if (trigger === this.trigger) {
        event.preventDefault()
        this.open ? this.closeListbox() : this.openListbox()
        return
      }

      const option = this.closestTarget<HTMLElement>(event, OPTION_SELECTOR)
      if (option && this.options.includes(option) && !isCollectionItemDisabled(option)) {
        this.selectOption(option, event)
      }
    }

    @listen('keydown')
    handleKeyDown(event: KeyboardEvent): void {
      if (
        !this.trigger?.contains(event.target as Node) &&
        !this.listbox?.contains(event.target as Node)
      ) {
        return
      }

      if (event.key === 'Escape') {
        if (this.open) {
          event.preventDefault()
          this.closeListbox()
        }
        return
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        if (!this.open) {
          this.openListbox()
          return
        }
        const active = this.options.find((option) => option.getAttribute('tabindex') === '0')
        if (active) this.selectOption(active, event)
        return
      }

      const targetIndex = collectionNavigationTarget(
        this.options,
        this.activeOptionIndex,
        event.key,
        'vertical',
      )
      if (targetIndex !== null) {
        event.preventDefault()
        this.openListbox()
        const resolvedIndex = syncListboxActiveOption(this.parts, targetIndex)
        if (resolvedIndex !== null) {
          this.options[resolvedIndex]?.focus?.()
        }
      }
    }

    private handleToggle = (event: Event): void => {
      if (event.target !== this.listbox || !this.listbox) return

      const open = isPopoverOpen(this.listbox)
      this.syncOpenState(open)
      if (open) {
        this.updateFloatingPosition()
        return
      }
      clearFloatingPosition(this.listbox)
    }

    private handleFormReset = (): void => {
      queueMicrotask(() => {
        this.#valueDirty = false
        this.applyDefaultValue(this.defaultValue || this.input?.defaultValue || '')
      })
    }

    private openListbox(): void {
      if (!this.listbox || isPopoverOpen(this.listbox)) return
      this.listbox.showPopover()
      this.syncOpenState(true)
    }

    private closeListbox(): void {
      if (!this.listbox) {
        this.syncOpenState(false)
        return
      }
      if (isPopoverOpen(this.listbox)) {
        this.listbox.hidePopover()
      }
      clearFloatingPosition(this.listbox)
      this.syncOpenState(false)
    }

    private selectOption(option: HTMLElement, originalEvent: Event): void {
      const value = selectOptionValue(option)
      const detail: SelectChangeDetail = {
        originalEvent,
        previousValue: this.value,
        reason: 'select',
        source: transitionSourceFromEvent(originalEvent),
        value,
      }
      if (value === this.value || !this.emit('ui-before-change', detail, { cancelable: true })) {
        return
      }
      this.syncValueState(value)
      this.closeListbox()
      this.trigger?.focus()
      this.emit('ui-change', detail)
    }

    private syncValueState(value: string): void {
      this.value = value
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
      syncSelectValue(this.parts, value)
      this.syncTriggerLabel()
    }

    private syncTriggerLabel(): void {
      const label = this.trigger?.querySelector<HTMLElement>("[data-ui-part~='label']")
      if (!label) return

      const selectedOption = this.options.find(
        (option) => option.getAttribute('aria-selected') === 'true',
      )
      if (selectedOption) {
        const nextLabel = selectedOption.textContent?.trim() ?? ''
        if (label.textContent !== nextLabel) label.textContent = nextLabel
      }
    }

    private syncOpenState(open: boolean): void {
      this.#syncingOpen = true
      try {
        this.open = open
      } finally {
        this.#syncingOpen = false
      }
      this.trigger?.setAttribute('aria-expanded', String(open))
    }

    private get parts(): SelectEnhancementParts {
      return {
        host: this,
        input: this.input,
        trigger: this.trigger,
        listbox: this.listbox,
        options: this.options,
      }
    }

    private get activeOptionIndex(): number {
      return Math.max(
        0,
        this.options.findIndex((option) => option.getAttribute('aria-selected') === 'true'),
      )
    }

    private get options(): HTMLElement[] {
      return this.listbox ? queryOwnedParts<HTMLElement>(this.listbox, OPTION_SELECTOR) : []
    }

    private get ownerWindow(): Window {
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
  if (!listbox.id) {
    listbox.id = `${options.generatedIdPrefix}-listbox`
  }

  syncFloatingAnchor(
    { host: parts.host, trigger, content: listbox },
    { anchorName: options.anchorName },
  )
  trigger.setAttribute('aria-controls', listbox.id)
  trigger.setAttribute('aria-haspopup', 'listbox')
  trigger.setAttribute('aria-expanded', 'false')
  if (!listbox.hasAttribute('popover')) {
    listbox.setAttribute('popover', 'auto')
  }

  const listboxResult = enhanceListboxParts(
    { host: listbox, options: parts.options },
    {
      generatedIdPrefix: options.generatedIdPrefix,
      multiple: false,
      value: options.value ?? parts.input?.value ?? '',
    },
  )
  const selectedIndex = listboxResult.status === 'enhanced' ? listboxResult.selectedIndex : null
  const optionIds = listboxResult.status === 'enhanced' ? listboxResult.optionIds : []
  syncSelectValue(parts, options.value ?? parts.input?.value ?? '')

  return { status: 'enhanced', listboxId: listbox.id, optionIds, selectedIndex }
}

export function syncSelectValue(parts: SelectEnhancementParts, value: string): number | null {
  parts.input!.value = value
  const selectedIndex = syncBaseListboxValue(
    { host: parts.listbox ?? parts.host, options: parts.options },
    value,
  )
  return selectedIndex
}

export function selectOptionValue(option: SelectOptionLike): string {
  return listboxOptionValue(option)
}

function invalidSelectParts(parts: SelectEnhancementParts): readonly string[] {
  const missing: string[] = []
  if (!parts.input) missing.push('input')
  if (!parts.trigger) missing.push('trigger')
  if (!parts.listbox) missing.push('listbox')
  if (parts.options.length === 0) missing.push('options')
  return missing
}

function supportsNativePopover(targetWindow: Window | null | undefined): boolean {
  const timelessWindow = targetWindow as (Window & typeof globalThis) | null | undefined
  return Boolean(
    timelessWindow?.HTMLElement && 'showPopover' in timelessWindow.HTMLElement.prototype,
  )
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
