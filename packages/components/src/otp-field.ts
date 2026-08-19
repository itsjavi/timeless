import {
  attr,
  boolAttr,
  createUIElementClass,
  element,
  listen,
  property,
  watch,
} from '@timelessui/core'
import { transitionSourceFromEvent, type UITransitionDetail } from './events'
import { applyCollectionValidity, collectionFormValue } from './value-state'

const CELL_SELECTOR = "[data-ui-part~='cell']"

/** Everything a pasted code may carry as decoration rather than content. */
const IGNORED_PASTE_CHARACTERS = /[^0-9A-Za-z]+/g

export type OtpFieldChangeDetail = UITransitionDetail<string, 'input' | 'paste' | 'reset'>

export type OtpFieldCompleteDetail = {
  readonly originalEvent: Event | null
  readonly value: string
}

export type OtpDistribution = {
  /** The full cell contents after the text was applied, one entry per cell. */
  readonly cells: readonly string[]
  /** The cell that should hold focus once the distribution is applied. */
  readonly focusIndex: number
}

export type OtpDistributionOptions = {
  /** Cell contents to write over. Missing entries are treated as empty. */
  readonly cells?: readonly string[]
  /** The cell the text lands in first. Defaults to the first cell. */
  readonly startIndex?: number
}

/**
 * Spreads pasted or typed text across one cell each, and says where focus belongs afterwards.
 *
 * Pure, so the awkward cases are decided in one testable place rather than inside an event handler:
 * a code pasted with the spaces or hyphens people copy along with it, a code longer than the field,
 * and a code dropped into the middle of a partly filled field.
 *
 * Anything that is not a digit or a letter is decoration, not content, so it is dropped before the
 * split. A code shorter than the remaining cells leaves the rest untouched, which is what makes
 * typing a single character reuse this same function.
 */
export function distributeOtpValue(
  cellCount: number,
  text: string,
  options: OtpDistributionOptions = {},
): OtpDistribution {
  const count = Math.max(0, Math.trunc(cellCount))
  const cells = Array.from({ length: count }, (_, index) => options.cells?.[index] ?? '')
  const startIndex = Math.min(
    Math.max(0, Math.trunc(options.startIndex ?? 0)),
    Math.max(0, count - 1),
  )
  const characters = [...text.replace(IGNORED_PASTE_CHARACTERS, '')]

  if (count === 0 || characters.length === 0) {
    return { cells, focusIndex: startIndex }
  }

  const written = Math.min(characters.length, count - startIndex)
  for (let offset = 0; offset < written; offset += 1) {
    cells[startIndex + offset] = characters[offset]!
  }

  return { cells, focusIndex: Math.min(startIndex + written, count - 1) }
}

/** The code a set of cells currently spells, with empty cells collapsing the string. */
export function otpCellsValue(cells: readonly string[]): string {
  return cells.join('')
}

export type UIOtpFieldElementConstructor = CustomElementConstructor & {
  elementName?: string
  formAssociated?: boolean
  new (): HTMLElement & {
    defaultValue: string
    disabled: boolean
    length: string
    name: string
    required: boolean
    value: string
    readonly cells: readonly HTMLInputElement[]
    readonly complete: boolean
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

export function createOtpFieldElementClass(targetWindow?: Window): UIOtpFieldElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-otp-field')
  class UIOtpFieldElement extends UIElementBase {
    static formAssociated = true

    @boolAttr accessor required = false
    @boolAttr accessor disabled = false
    @attr accessor name = ''
    @attr accessor length = ''
    @attr({ attribute: 'value' }) accessor defaultValue = ''
    @property accessor value = ''

    #customValidity = ''
    #fieldsetDisabled = false
    #syncingDefaultValue = false
    #valueDirty = false

    /** The authored cells, in DOM order. */
    get cells(): HTMLInputElement[] {
      return this.querySelectorAllArray<HTMLInputElement>(CELL_SELECTOR)
    }

    /** Whether every character the field expects has been entered. */
    get complete(): boolean {
      const expected = this.expectedLength
      return expected > 0 && this.value.length === expected
    }

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
     * The native `setCustomValidity` contract, forwarded so an outside caller — `ui-form` mapping a
     * server error onto a named field — can reach a validity that otherwise lives entirely inside
     * `ElementInternals`. An empty message restores the field's own constraints.
     */
    setCustomValidity(message: string): void {
      this.#customValidity = message
      this.commitFormValue()
    }

    protected override connected(): void {
      this.observeParts(() => this.enhance())
    }

    formDisabledCallback(disabled: boolean): void {
      this.#fieldsetDisabled = disabled
      this.commitFormValue()
    }

    formResetCallback(): void {
      this.reset()
    }

    formStateRestoreCallback(state: File | string | FormData | null): void {
      const restored =
        typeof state === 'string'
          ? state
          : state instanceof FormData
            ? String(state.get(this.name) ?? '')
            : ''
      this.#valueDirty = true
      this.value = restored
    }

    /** Restores the authored default, the way a native input's `value` attribute survives a reset. */
    reset(): void {
      this.#valueDirty = false
      this.applyValue(this.defaultValue, null, 'reset')
    }

    @watch('name')
    @watch('required')
    @watch('disabled')
    syncFormState(): void {
      this.commitFormValue()
    }

    @watch('value')
    syncValue(): void {
      if (!this.#syncingDefaultValue) this.#valueDirty = true
      this.writeCells(this.value)
      this.commitFormValue()
    }

    @watch('defaultValue')
    syncDefaultValue(): void {
      if (!this.#valueDirty) this.applyValue(this.defaultValue, null, 'reset')
    }

    @listen('input')
    handleInput(event: Event): void {
      const index = this.cellIndexFromEvent(event)
      if (index === null) return

      const cells = this.cells
      const typed = cells[index]?.value ?? ''
      // One keystroke into a full cell, or a browser autofilling the whole code into the first
      // cell, both arrive as `input` with more characters than the cell can hold.
      const distribution = distributeOtpValue(cells.length, typed, {
        cells: cells.map((cell, position) => (position === index ? '' : cell.value)),
        startIndex: index,
      })
      this.applyDistribution(distribution, event, 'input')
    }

    @listen('paste')
    handlePaste(event: ClipboardEvent): void {
      const index = this.cellIndexFromEvent(event)
      if (index === null) return

      const text = event.clipboardData?.getData('text') ?? ''
      if (!text) return

      event.preventDefault()
      const cells = this.cells
      this.applyDistribution(
        distributeOtpValue(cells.length, text, {
          cells: cells.map((cell) => cell.value),
          startIndex: index,
        }),
        event,
        'paste',
      )
    }

    /**
     * Traversal is local rather than `collectionNavigationTarget`, which assumes roving `tabindex`
     * over a single tab stop. Every cell here is independently tabbable, so there is no roving
     * index to move and no `tabindex` to write.
     */
    @listen('keydown')
    handleKeyDown(event: KeyboardEvent): void {
      const index = this.cellIndexFromEvent(event)
      if (index === null) return

      const cells = this.cells
      if (event.key === 'Backspace') {
        if (cells[index]?.value) return
        event.preventDefault()
        const previous = cells[index - 1]
        if (!previous) return
        previous.value = ''
        this.focusCell(index - 1)
        this.commitCells(event, 'input')
        return
      }

      const target = otpTraversalTarget(cells.length, index, event.key)
      if (target === null) return
      event.preventDefault()
      this.focusCell(target)
    }

    private enhance(): void {
      this.setAttribute('role', 'group')
      const cells = this.cells
      if (cells.length === 0) return

      if (!this.#valueDirty) {
        const authored = otpCellsValue(cells.map((cell) => cell.value))
        this.applyValue(this.defaultValue || authored, null, 'reset')
        return
      }
      this.writeCells(this.value)
      this.commitFormValue()
    }

    private applyDistribution(
      distribution: OtpDistribution,
      originalEvent: Event | null,
      reason: 'input' | 'paste',
    ): void {
      const cells = this.cells
      distribution.cells.forEach((next, position) => {
        const cell = cells[position]
        if (cell && cell.value !== next) cell.value = next
      })
      this.focusCell(distribution.focusIndex)
      this.commitCells(originalEvent, reason)
    }

    private commitCells(originalEvent: Event | null, reason: 'input' | 'paste'): void {
      const next = otpCellsValue(this.cells.map((cell) => cell.value))
      this.#valueDirty = true
      this.applyValue(next, originalEvent, reason)
    }

    private applyValue(
      next: string,
      originalEvent: Event | null,
      reason: 'input' | 'paste' | 'reset',
    ): void {
      const previousValue = this.value
      if (previousValue === next) {
        this.writeCells(next)
        this.commitFormValue()
        return
      }

      const detail: OtpFieldChangeDetail = {
        originalEvent,
        previousValue,
        reason,
        source: reason === 'reset' ? 'reset' : transitionSourceFromEvent(originalEvent),
        value: next,
      }
      if (originalEvent && !this.emit('ui-before-change', detail, { cancelable: true })) {
        this.writeCells(previousValue)
        return
      }

      this.#syncingDefaultValue = reason === 'reset'
      try {
        this.value = next
      } finally {
        this.#syncingDefaultValue = false
      }

      if (originalEvent) this.emit('ui-change', detail)
      if (this.complete) this.emit('ui-complete', { originalEvent, value: next })
    }

    private writeCells(value: string): void {
      const cells = this.cells
      if (cells.length === 0) return

      const { cells: next } = distributeOtpValue(cells.length, value)
      cells.forEach((cell, index) => {
        const wanted = next[index] ?? ''
        if (cell.value !== wanted) cell.value = wanted
      })
    }

    private commitFormValue(): void {
      const internals = this.internals
      if (!internals) return

      const value = this.isDisabled ? '' : this.value
      internals.setFormValue?.(
        collectionFormValue(this.name, value ? [value] : [], this.ownerDocument.defaultView),
      )
      applyCollectionValidity(internals, {
        anchor: this.cells[0] ?? null,
        customError: this.#customValidity || this.incompleteMessage(value),
        disabled: this.isDisabled,
        message: 'Please enter the code.',
        required: this.required,
        values: value ? [value] : [],
      })
    }

    /**
     * A half-typed code is not a missing one, so it reports its own message rather than
     * `valueMissing`, which would read as "you left this blank" over a field the user is filling.
     */
    private incompleteMessage(value: string): string {
      const expected = this.expectedLength
      if (this.isDisabled || value.length === 0 || expected === 0 || value.length >= expected)
        return ''
      return `Please enter all ${expected} characters of the code.`
    }

    private get expectedLength(): number {
      const declared = Number.parseInt(this.length, 10)
      if (Number.isFinite(declared) && declared > 0) return declared
      return this.cells.length
    }

    private get isDisabled(): boolean {
      return this.disabled || this.#fieldsetDisabled
    }

    private focusCell(index: number): void {
      const cell = this.cells[index]
      if (!cell || cell.disabled) return
      cell.focus?.()
      cell.select?.()
    }

    private cellIndexFromEvent(event: Event): number | null {
      const cell = this.closestTarget<HTMLInputElement>(event, CELL_SELECTOR)
      if (!cell) return null
      const index = this.cells.indexOf(cell)
      return index >= 0 ? index : null
    }
  }

  return UIOtpFieldElement as unknown as UIOtpFieldElementConstructor
}

/** Arrow, Home, and End movement between independently tabbable cells. */
export function otpTraversalTarget(
  cellCount: number,
  currentIndex: number,
  key: string,
): number | null {
  if (cellCount === 0) return null
  const last = cellCount - 1

  switch (key) {
    case 'ArrowLeft':
      return currentIndex > 0 ? currentIndex - 1 : null
    case 'ArrowRight':
      return currentIndex < last ? currentIndex + 1 : null
    case 'Home':
      return currentIndex === 0 ? null : 0
    case 'End':
      return currentIndex === last ? null : last
    default:
      return null
  }
}

export const UIOtpFieldElement = createOtpFieldElementClass()
export type UIOtpFieldElement = InstanceType<typeof UIOtpFieldElement>

declare global {
  interface HTMLElementTagNameMap {
    'ui-otp-field': UIOtpFieldElement
  }
}
