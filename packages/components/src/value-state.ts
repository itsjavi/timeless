export type CollectionValidityOptions = {
  readonly anchor?: HTMLElement | null
  readonly disabled: boolean
  readonly message?: string
  readonly required: boolean
  readonly values: readonly string[]
}

export type FormValueWindow = {
  readonly FormData?: typeof FormData
}

/**
 * The value a collection submits, matching what `<select multiple>` does: one entry per selected
 * value, all under the same `name`.
 *
 * Returns `null` — which clears the entry rather than submitting an empty string — for an unnamed,
 * disabled, or empty control. `FormData` is taken from the element's own window rather than the
 * global, because a component inside an iframe must build one its form will accept.
 */
export function collectionFormValue(
  name: string,
  values: readonly string[],
  ownerWindow?: FormValueWindow | null,
): string | FormData | null {
  if (!name || values.length === 0) return null
  if (values.length === 1) return values[0]!

  const FormDataConstructor = ownerWindow?.FormData ?? FormData
  const data = new FormDataConstructor()
  for (const value of values) data.append(name, value)
  return data
}

/**
 * Applies `valueMissing` to a collection's internals.
 *
 * The anchor is the visible trigger, never the custom-element host: the browser positions its native
 * validation bubble against whatever element it is handed, and an `inline-grid` host with no layout
 * of its own puts the bubble in the wrong place.
 */
export function applyCollectionValidity(
  internals: ElementInternals | undefined,
  options: CollectionValidityOptions,
): void {
  if (!internals?.setValidity) return

  const missing = options.required && !options.disabled && options.values.length === 0
  if (!missing) {
    internals.setValidity({})
    return
  }
  internals.setValidity(
    { valueMissing: true },
    options.message ?? 'Please select an option.',
    options.anchor ?? undefined,
  )
}

export type ValueStateSnapshot<TValue> = {
  readonly defaultValue: TValue
  readonly dirty: boolean
  readonly value: TValue
}

export class ValueState<TValue> {
  #defaultValue: TValue
  #dirty = false
  #value: TValue

  constructor(defaultValue: TValue) {
    this.#defaultValue = defaultValue
    this.#value = defaultValue
  }

  get defaultValue(): TValue {
    return this.#defaultValue
  }

  get dirty(): boolean {
    return this.#dirty
  }

  get value(): TValue {
    return this.#value
  }

  setDefault(value: TValue): boolean {
    this.#defaultValue = value
    if (this.#dirty || Object.is(this.#value, value)) return false
    this.#value = value
    return true
  }

  setValue(value: TValue): boolean {
    this.#dirty = true
    if (Object.is(this.#value, value)) return false
    this.#value = value
    return true
  }

  initialize(value: TValue): boolean {
    if (this.#dirty || Object.is(this.#value, value)) return false
    this.#defaultValue = value
    this.#value = value
    return true
  }

  reset(): boolean {
    const changed = !Object.is(this.#value, this.#defaultValue) || this.#dirty
    this.#dirty = false
    this.#value = this.#defaultValue
    return changed
  }

  snapshot(): ValueStateSnapshot<TValue> {
    return {
      defaultValue: this.#defaultValue,
      dirty: this.#dirty,
      value: this.#value,
    }
  }
}
