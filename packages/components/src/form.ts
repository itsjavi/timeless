import { createUIElementClass, element, ensureElementId, listen } from '@timelessui/core'

const FORM_SELECTOR = 'form'
const ERROR_SELECTOR = "[data-ui-part~='error']"

export type FormErrors = Readonly<Record<string, string>>

export type FormInvalidDetail = {
  /** Every field that carries a message, keyed by `name`. */
  readonly errors: FormErrors
  /** The names actually matched to a control, in the order they were applied. */
  readonly fields: readonly string[]
}

/**
 * A control `ui-form` can put a message on: a native input, or a form-associated custom element
 * that forwards the same `setCustomValidity` contract from its `ElementInternals`.
 */
type ValidatableControl = HTMLElement & {
  name?: string
  setCustomValidity(message: string): void
}

/**
 * Duck-typed rather than an `instanceof` check. The element class is created per window realm, so a
 * host built for an iframe handles nodes whose `Element` is not this module's `Element`, and
 * `instanceof` would silently reject every one of them.
 */
function isValidatableControl(node: unknown): node is ValidatableControl {
  return typeof (node as { setCustomValidity?: unknown } | null)?.setCustomValidity === 'function'
}

/**
 * Resolves the error element that belongs to one control.
 *
 * Walks up from the control until an ancestor inside the form holds exactly one `error` part and no
 * other named control, which is what `.ui-field`, `.ui-choice-group`, and `.ui-fieldset` all
 * produce without anyone authoring a pairing attribute. An unwrapped control gets nothing rather
 * than the first error on the page.
 */
export function findFormErrorElement(control: Element, boundary: Element): HTMLElement | null {
  let scope = control.parentElement
  while (scope && boundary.contains(scope)) {
    const errors = scope.querySelectorAll<HTMLElement>(ERROR_SELECTOR)
    if (errors.length === 1) {
      const named = Array.from(scope.querySelectorAll('[name]')).filter(
        (node) => node !== control && isValidatableControl(node),
      )
      if (named.length === 0) return errors[0]!
      return null
    }
    if (errors.length > 1) return null
    scope = scope.parentElement
  }
  return null
}

export type UIFormElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    errors: FormErrors
    readonly form: HTMLFormElement | null
    clearErrors(): void
    setErrors(errors: FormErrors): void
  }
}

export function createFormElementClass(targetWindow?: Window): UIFormElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  /**
   * Maps a name-keyed error object — a server response, typically — back onto the fields it came
   * from, and gets out of the way. Native `<form>` and constraint validation keep doing everything
   * else: this element adds no submission behavior, no client-side rules, and no markup.
   */
  @element('ui-form')
  class UIFormElement extends UIElementBase {
    #errors: FormErrors = {}

    get form(): HTMLFormElement | null {
      return this.querySelector<HTMLFormElement>(FORM_SELECTOR)
    }

    get errors(): FormErrors {
      return this.#errors
    }

    set errors(next: FormErrors) {
      this.setErrors(next)
    }

    /**
     * Applies one message per field name, focuses the first field that took one, and reports which
     * names matched a control. Names with no control are kept in `errors` but never announced as
     * applied, so a caller can tell a typo from a field that is simply not rendered yet.
     */
    setErrors(next: FormErrors): void {
      this.#errors = { ...next }
      const applied: string[] = []
      let firstInvalid: ValidatableControl | null = null

      for (const control of this.controls) {
        const message = control.name ? (this.#errors[control.name] ?? '') : ''
        this.applyMessage(control, message)
        if (!message) continue
        applied.push(control.name!)
        firstInvalid ??= control
      }

      firstInvalid?.focus()
      if (applied.length > 0) {
        this.emit('ui-invalid', {
          errors: this.#errors,
          fields: applied,
        } satisfies FormInvalidDetail)
      }
    }

    /** Drops every mapped message and restores each control's own constraint validation. */
    clearErrors(): void {
      this.#errors = {}
      for (const control of this.controls) this.applyMessage(control, '')
    }

    /**
     * A server error survives exactly as long as the value that caused it. Without this a corrected
     * field stays blocked, because a custom validity never clears itself.
     */
    @listen('input')
    handleInput(event: Event): void {
      const target = event.target
      if (!isValidatableControl(target)) return
      if (!target.name || !(target.name in this.#errors)) return

      const { [target.name]: _cleared, ...rest } = this.#errors
      this.#errors = rest
      this.applyMessage(target, '')
    }

    private applyMessage(control: ValidatableControl, message: string): void {
      control.setCustomValidity(message)

      const boundary = this.form ?? this
      const errorElement = findFormErrorElement(control, boundary)
      if (message) {
        control.setAttribute('aria-invalid', 'true')
      } else {
        control.removeAttribute('aria-invalid')
      }
      if (!errorElement) return

      errorElement.textContent = message
      if (!message) {
        this.unlink(control, errorElement)
        return
      }
      const id = ensureElementId(errorElement, `${control.name || 'field'}-error`)
      const described = (control.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter(Boolean)
      if (!described.includes(id)) {
        control.setAttribute('aria-describedby', [...described, id].join(' '))
      }
    }

    private unlink(control: ValidatableControl, errorElement: HTMLElement): void {
      const id = errorElement.id
      if (!id) return
      const described = (control.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter((token) => token && token !== id)
      if (described.length > 0) control.setAttribute('aria-describedby', described.join(' '))
      else control.removeAttribute('aria-describedby')
    }

    private get controls(): ValidatableControl[] {
      return this.querySelectorAllArray<Element>('[name]').filter(isValidatableControl)
    }
  }

  return UIFormElement as unknown as UIFormElementConstructor
}

export const UIFormElement = createFormElementClass()
export type UIFormElement = InstanceType<typeof UIFormElement>

declare global {
  interface HTMLElementTagNameMap {
    'ui-form': UIFormElement
  }
}
