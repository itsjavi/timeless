import { attr, createUIElementClass, element, listen, property, watch } from '@timelessui/core'
import {
  collectionNavigationTarget,
  firstEnabledCollectionItemIndex,
  isCollectionItemDisabled,
  resolveCollectionOrientation,
  syncRovingTabIndex,
  type CollectionOrientation,
} from './collection'
import { transitionSourceFromEvent, type UITransitionDetail } from './events'

export type SelectionGroupOrientation = 'horizontal' | 'vertical'

export type ChoiceInputLike = {
  checked: boolean
  disabled?: boolean
  readonly value: string
  focus?(): void
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  matches?(selector: string): boolean
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type ChoiceGroupHostLike = {
  getAttribute(name: string): string | null
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type RadioGroupEnhancementParts = {
  readonly host: ChoiceGroupHostLike
  readonly inputs: readonly ChoiceInputLike[]
}

export type CheckboxGroupEnhancementParts = RadioGroupEnhancementParts

export type ChoiceGroupEnhancementOptions = {
  readonly orientation: SelectionGroupOrientation
  readonly value?: string
}

export type RadioGroupEnhancementResult =
  | { readonly status: 'enhanced'; readonly checkedIndex: number | null; readonly value: string }
  | { readonly status: 'invalid'; readonly missing: readonly string[] }

export type CheckboxGroupEnhancementResult =
  | { readonly status: 'enhanced'; readonly values: readonly string[] }
  | { readonly status: 'invalid'; readonly missing: readonly string[] }

export type RadioGroupChangeDetail = UITransitionDetail<string, 'select'>

export type CheckboxGroupChangeDetail = UITransitionDetail<readonly string[], 'toggle'> & {
  readonly values: readonly string[]
}

const RADIO_SELECTOR = 'input[type="radio"]'
const CHECKBOX_SELECTOR = 'input[type="checkbox"]'

export type UIRadioGroupElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    orientation: SelectionGroupOrientation | ''
    value: string
  }
}

export type UICheckboxGroupElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    orientation: SelectionGroupOrientation | ''
  }
}

export function createRadioGroupElementClass(
  targetWindow?: Window,
): UIRadioGroupElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-radio-group')
  class UIRadioGroupElement extends UIElementBase {
    @attr accessor orientation: SelectionGroupOrientation | '' = ''
    @attr({ attribute: 'value' }) accessor defaultValue = ''
    @property accessor value = ''

    #syncingDefaultValue = false
    #valueDirty = false

    protected override connected(): void {
      this.observeParts((signal) => this.enhance(signal))
    }

    private enhance(signal: AbortSignal): void {
      const result = enhanceRadioGroupParts(
        { host: this, inputs: this.inputs },
        { orientation: resolveChoiceGroupOrientation(this.orientation), value: this.value },
      )
      if (result.status === 'enhanced' && !this.#valueDirty && result.value !== this.value) {
        this.applyDefaultValue(this.defaultValue || result.value)
      }
      for (const form of new Set(this.inputs.map((input) => input.form).filter(Boolean))) {
        form?.addEventListener('reset', this.handleFormReset, { signal })
      }
    }

    @watch('orientation')
    syncOrientation(): void {
      syncChoiceGroupHost(this, 'radiogroup', resolveChoiceGroupOrientation(this.orientation))
    }

    @watch('value')
    syncValue(): void {
      if (!this.#syncingDefaultValue) this.#valueDirty = true
      syncRadioGroupValue({ host: this, inputs: this.inputs }, this.value)
    }

    @watch('defaultValue')
    syncDefaultValue(): void {
      if (!this.#valueDirty) this.applyDefaultValue(this.defaultValue)
    }

    @listen('click', { capture: true })
    handleClick(event: Event): void {
      const input = this.eventInput(event)
      if (!input || isCollectionItemDisabled(input)) return

      this.setValue(input.value, event)
    }

    @listen('keydown')
    handleKeyDown(event: KeyboardEvent): void {
      const input = this.eventInput(event)
      if (!input) return

      const targetIndex = collectionNavigationTarget(
        this.inputs,
        this.inputs.indexOf(input),
        event.key,
        resolveChoiceCollectionOrientation(this.orientation),
      )
      if (targetIndex === null) return

      event.preventDefault()
      const target = this.inputs[targetIndex]
      if (!target) return

      this.setValue(target.value, event)
      target.focus?.()
    }

    private setValue(value: string, originalEvent: Event | null): void {
      const previousValue = this.value
      if (value === previousValue) return
      const detail: RadioGroupChangeDetail = {
        originalEvent,
        previousValue,
        reason: 'select',
        source: transitionSourceFromEvent(originalEvent),
        value,
      }
      if (originalEvent && !this.emit('ui-before-change', detail, { cancelable: true })) {
        originalEvent.preventDefault()
        return
      }
      this.value = value
      syncRadioGroupValue({ host: this, inputs: this.inputs }, value)
      if (originalEvent) this.emit('ui-change', detail)
    }

    private handleFormReset = (): void => {
      queueMicrotask(() => {
        this.#valueDirty = false
        const value =
          this.defaultValue || this.inputs.find((input) => input.defaultChecked)?.value || ''
        this.applyDefaultValue(value)
      })
    }

    private applyDefaultValue(value: string): void {
      this.#syncingDefaultValue = true
      try {
        this.value = value
      } finally {
        this.#syncingDefaultValue = false
      }
      syncRadioGroupValue({ host: this, inputs: this.inputs }, value)
    }

    private eventInput(event: Event): HTMLInputElement | null {
      const input = this.closestTarget<HTMLInputElement>(event, RADIO_SELECTOR)
      return input && this.inputs.includes(input) ? input : null
    }

    private get inputs(): HTMLInputElement[] {
      return Array.from(this.querySelectorAll<HTMLInputElement>(RADIO_SELECTOR))
    }
  }

  return UIRadioGroupElement as unknown as UIRadioGroupElementConstructor
}

export function createCheckboxGroupElementClass(
  targetWindow?: Window,
): UICheckboxGroupElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-checkbox-group')
  class UICheckboxGroupElement extends UIElementBase {
    @attr accessor orientation: SelectionGroupOrientation | '' = ''

    protected override connected(): void {
      this.observeParts(() => this.enhance())
    }

    private enhance(): void {
      enhanceCheckboxGroupParts(
        { host: this, inputs: this.inputs },
        { orientation: resolveChoiceGroupOrientation(this.orientation) },
      )
    }

    @watch('orientation')
    syncOrientation(): void {
      syncChoiceGroupHost(this, 'group', resolveChoiceGroupOrientation(this.orientation))
    }

    @listen('change')
    handleChange(event: Event): void {
      const input = this.eventInput(event)
      if (!input || isCollectionItemDisabled(input)) return

      const values = checkedChoiceValues(this.inputs)
      const previousValues = input.checked
        ? values.filter((value) => value !== input.value)
        : [...values, input.value]
      const detail: CheckboxGroupChangeDetail = {
        originalEvent: event,
        previousValue: previousValues,
        reason: 'toggle',
        source: transitionSourceFromEvent(event),
        value: values,
        values,
      }
      if (!this.emit('ui-before-change', detail, { cancelable: true })) {
        input.checked = !input.checked
        return
      }
      this.emit('ui-change', detail)
    }

    private eventInput(event: Event): HTMLInputElement | null {
      const input = this.closestTarget<HTMLInputElement>(event, CHECKBOX_SELECTOR)
      return input && this.inputs.includes(input) ? input : null
    }

    private get inputs(): HTMLInputElement[] {
      return Array.from(this.querySelectorAll<HTMLInputElement>(CHECKBOX_SELECTOR))
    }
  }

  return UICheckboxGroupElement as unknown as UICheckboxGroupElementConstructor
}

export const UIRadioGroupElement = createRadioGroupElementClass()
export type UIRadioGroupElement = InstanceType<typeof UIRadioGroupElement>

export const UICheckboxGroupElement = createCheckboxGroupElementClass()
export type UICheckboxGroupElement = InstanceType<typeof UICheckboxGroupElement>

export function enhanceRadioGroupParts(
  parts: RadioGroupEnhancementParts,
  options: ChoiceGroupEnhancementOptions,
): RadioGroupEnhancementResult {
  if (parts.inputs.length === 0) {
    return { status: 'invalid', missing: ['inputs'] }
  }
  syncChoiceGroupHost(parts.host, 'radiogroup', options.orientation)

  const requestedValue = options.value ?? ''
  const currentValue = requestedValue || parts.inputs.find((input) => input.checked)?.value || ''
  const checkedIndex = syncRadioGroupValue(parts, currentValue)

  return {
    status: 'enhanced',
    checkedIndex,
    value: checkedIndex === null ? '' : parts.inputs[checkedIndex]!.value,
  }
}

export function enhanceCheckboxGroupParts(
  parts: CheckboxGroupEnhancementParts,
  options: ChoiceGroupEnhancementOptions,
): CheckboxGroupEnhancementResult {
  if (parts.inputs.length === 0) {
    return { status: 'invalid', missing: ['inputs'] }
  }
  syncChoiceGroupHost(parts.host, 'group', options.orientation)

  return { status: 'enhanced', values: checkedChoiceValues(parts.inputs) }
}

export function syncRadioGroupValue(
  parts: RadioGroupEnhancementParts,
  value: string,
): number | null {
  const requestedIndex = parts.inputs.findIndex((input) => input.value === value)
  const checkedIndex =
    requestedIndex >= 0 && !isCollectionItemDisabled(parts.inputs[requestedIndex]!)
      ? requestedIndex
      : firstEnabledCollectionItemIndex(parts.inputs)

  parts.inputs.forEach((input, index) => {
    input.checked = index === checkedIndex
  })
  syncRovingTabIndex(parts.inputs, checkedIndex)

  if (checkedIndex === null) {
    return null
  }

  return checkedIndex
}

export function checkedChoiceValues(inputs: readonly ChoiceInputLike[]): readonly string[] {
  return inputs
    .filter((input) => input.checked && !isCollectionItemDisabled(input))
    .map((input) => input.value)
}

export function resolveChoiceGroupOrientation(value: string | null): SelectionGroupOrientation {
  const orientation = resolveCollectionOrientation(value, 'vertical')
  return orientation === 'horizontal' ? 'horizontal' : 'vertical'
}

function resolveChoiceCollectionOrientation(value: string | null): CollectionOrientation {
  return resolveChoiceGroupOrientation(value) === 'horizontal' ? 'horizontal' : 'vertical'
}

function syncChoiceGroupHost(
  host: ChoiceGroupHostLike,
  role: 'group' | 'radiogroup',
  orientation: SelectionGroupOrientation,
): void {
  host.setAttribute('role', role)
  host.setAttribute('orientation', orientation)
  if (role === 'radiogroup') {
    host.setAttribute('aria-orientation', orientation)
  } else {
    host.removeAttribute('aria-orientation')
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-checkbox-group': UICheckboxGroupElement
    'ui-radio-group': UIRadioGroupElement
  }
}
