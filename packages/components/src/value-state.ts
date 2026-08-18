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
