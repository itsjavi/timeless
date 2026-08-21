import { createUIElementClass, element, listen } from '@timelessui/core'

const INPUT_SELECTOR = ':scope > input[type="number"]'
const DECREMENT_SELECTOR = ":scope > button[data-ui-part~='decrement']"
const INCREMENT_SELECTOR = ":scope > button[data-ui-part~='increment']"

export type NumberStepperParts = {
  readonly host: HTMLElement
  readonly input: HTMLInputElement | null
  readonly decrement: HTMLButtonElement | null
  readonly increment: HTMLButtonElement | null
}

export function findNumberStepperParts(host: HTMLElement): NumberStepperParts {
  return {
    host,
    input: host.querySelector<HTMLInputElement>(INPUT_SELECTOR),
    decrement: host.querySelector<HTMLButtonElement>(DECREMENT_SELECTOR),
    increment: host.querySelector<HTMLButtonElement>(INCREMENT_SELECTOR),
  }
}

/**
 * At a bound it is `aria-disabled`, because the button goes inert while being pressed and a real
 * `disabled` on the focused element sends focus to `<body>`. A disabled or read-only control is
 * native `disabled`: that state comes from the author, not from under the user's finger, and two
 * inert buttons should leave the tab order.
 */
function markUnavailable(
  button: HTMLButtonElement,
  reason: 'available' | 'at-bound' | 'control-disabled',
): void {
  button.disabled = reason === 'control-disabled'
  if (reason === 'at-bound') button.setAttribute('aria-disabled', 'true')
  else button.removeAttribute('aria-disabled')
}

export function isNumberStepperButtonUnavailable(button: HTMLButtonElement): boolean {
  return button.disabled || button.getAttribute('aria-disabled') === 'true'
}

export function syncNumberStepper(parts: NumberStepperParts): boolean {
  const { host, input, decrement, increment } = parts
  if (!input || !decrement || !increment) {
    return false
  }
  host.setAttribute('role', 'group')
  const controlDisabled = input.disabled || input.readOnly
  const value = input.valueAsNumber
  const parsedMin = Number(input.min)
  const parsedMax = Number(input.max)
  const min = input.min === '' || Number.isNaN(parsedMin) ? -Infinity : parsedMin
  const max = input.max === '' || Number.isNaN(parsedMax) ? Infinity : parsedMax
  const reason = (atBound: boolean): 'available' | 'at-bound' | 'control-disabled' =>
    controlDisabled ? 'control-disabled' : atBound ? 'at-bound' : 'available'
  markUnavailable(decrement, reason(Number.isNaN(value) || value <= min))
  markUnavailable(increment, reason(Number.isNaN(value) || value >= max))
  return true
}

export function stepNumberInput(input: HTMLInputElement, direction: -1 | 1): void {
  if (input.disabled || input.readOnly) return
  try {
    if (direction === 1) input.stepUp()
    else input.stepDown()
  } catch {
    return
  }
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

export type UINumberStepperElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement
}

export function createNumberStepperElementClass(
  targetWindow?: Window,
): UINumberStepperElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-number-stepper')
  class UINumberStepperElement extends UIElementBase {
    protected override connected(): void {
      this.observeParts(() => syncNumberStepper(findNumberStepperParts(this)))
    }

    @listen('click')
    handleClick(event: Event): void {
      const parts = findNumberStepperParts(this)
      if (!parts.input) return
      const target = event.target
      if (!(target instanceof Element)) return

      const decrement = target.closest<HTMLButtonElement>("button[data-ui-part~='decrement']")
      const increment = target.closest<HTMLButtonElement>("button[data-ui-part~='increment']")
      // An `aria-disabled` button still activates, so the no-op has to live here.
      if (decrement?.parentElement === this) {
        if (isNumberStepperButtonUnavailable(decrement)) return
        stepNumberInput(parts.input, -1)
      } else if (increment?.parentElement === this) {
        if (isNumberStepperButtonUnavailable(increment)) return
        stepNumberInput(parts.input, 1)
      } else return

      syncNumberStepper(parts)
    }

    @listen('input')
    handleInput(): void {
      syncNumberStepper(findNumberStepperParts(this))
    }

    @listen('change')
    handleChange(): void {
      syncNumberStepper(findNumberStepperParts(this))
    }
  }

  return UINumberStepperElement as unknown as UINumberStepperElementConstructor
}

export const UINumberStepperElement = createNumberStepperElementClass()
export type UINumberStepperElement = InstanceType<typeof UINumberStepperElement>

declare global {
  interface HTMLElementTagNameMap {
    'ui-number-stepper': UINumberStepperElement
  }
}
