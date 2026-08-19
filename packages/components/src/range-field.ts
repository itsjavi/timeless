import { createUIElementClass, element, listen } from '@timelessui/core'
import { transitionSourceFromEvent, type UITransitionDetail } from './events'

const FROM_SELECTOR = "[data-ui-part~='from']"
const TO_SELECTOR = "[data-ui-part~='to']"
const TRACK_SELECTOR = "[data-ui-part~='track']"
const OUTPUT_SELECTOR = "[data-ui-part~='output']"

/** Measured fill bounds. Written by JS, rendered by CSS, never declared as consumer configuration. */
const FILL_START_PROPERTY = '--ui-range-fill-start'
const FILL_END_PROPERTY = '--ui-range-fill-end'

export type RangePair = {
  readonly from: number
  readonly to: number
}

export type RangeFieldChangeDetail = UITransitionDetail<RangePair, 'from' | 'to'>

export type RangeFieldParts = {
  readonly from: HTMLInputElement | null
  readonly to: HTMLInputElement | null
  readonly track: HTMLElement | null
  readonly output: HTMLElement | null
}

/**
 * Keeps the pair ordered by blocking a crossing rather than swapping the thumbs.
 *
 * Swapping matches some native-feeling implementations, but it makes the keyboard case surprising:
 * the arrow key you are holding silently starts moving the other thumb. Blocking is predictable —
 * the thumb you grabbed stays the thumb you are moving, and it stops at its neighbour.
 */
export function clampRangePair(pair: RangePair, moved: 'from' | 'to'): RangePair {
  if (pair.from <= pair.to) return pair
  return moved === 'from' ? { from: pair.to, to: pair.to } : { from: pair.from, to: pair.from }
}

/** Where each end of the fill sits along the track, as a percentage of the shared min-max span. */
export function rangeFillBounds(
  pair: RangePair,
  bounds: { readonly min: number; readonly max: number },
): { readonly start: number; readonly end: number } {
  const span = bounds.max - bounds.min
  if (!Number.isFinite(span) || span <= 0) return { start: 0, end: 100 }

  const position = (value: number) =>
    Math.min(100, Math.max(0, ((value - bounds.min) / span) * 100))
  return { start: position(pair.from), end: position(pair.to) }
}

export type UIRangeFieldElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    from: number
    to: number
    values: RangePair
  }
}

export function createRangeFieldElementClass(
  targetWindow?: Window,
): UIRangeFieldElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-range-field')
  class UIRangeFieldElement extends UIElementBase {
    /**
     * Deliberately not form-associated. The two thumbs are native inputs carrying their own `name`,
     * so the pair submits and resets without JavaScript; owning the value here as well would submit
     * it twice.
     */
    get values(): RangePair {
      const parts = this.rangeParts
      return {
        from: parts.from?.valueAsNumber ?? Number.NaN,
        to: parts.to?.valueAsNumber ?? Number.NaN,
      }
    }

    set values(next: RangePair) {
      const parts = this.rangeParts
      if (!parts.from || !parts.to) return
      const clamped = clampRangePair(next, 'from')
      parts.from.valueAsNumber = clamped.from
      parts.to.valueAsNumber = clamped.to
      this.sync(null, 'from')
    }

    get from(): number {
      return this.values.from
    }

    set from(next: number) {
      this.values = { from: next, to: this.values.to }
    }

    get to(): number {
      return this.values.to
    }

    set to(next: number) {
      this.values = { from: this.values.from, to: next }
    }

    protected override connected(): void {
      this.observeParts((signal) => this.enhance(signal))
    }

    @listen('input')
    handleInput(event: Event): void {
      const moved = this.movedThumb(event)
      if (!moved) return
      this.sync(event, moved)
    }

    private enhance(signal: AbortSignal): void {
      const parts = this.rangeParts
      if (!parts.from || !parts.to) return

      this.setAttribute('role', 'group')
      for (const form of new Set([parts.from.form, parts.to.form].filter(Boolean))) {
        form?.addEventListener('reset', this.handleFormReset, { signal })
      }
      this.sync(null, 'from')
    }

    private handleFormReset = (): void => {
      // The natives restore themselves; the fill and the output are ours to catch up.
      queueMicrotask(() => this.sync(null, 'from'))
    }

    private sync(originalEvent: Event | null, moved: 'from' | 'to'): void {
      const parts = this.rangeParts
      if (!parts.from || !parts.to) return

      const previousValue = { from: parts.from.valueAsNumber, to: parts.to.valueAsNumber }
      const clamped = clampRangePair(previousValue, moved)
      if (clamped.from !== previousValue.from) parts.from.valueAsNumber = clamped.from
      if (clamped.to !== previousValue.to) parts.to.valueAsNumber = clamped.to

      this.writeFill(parts, clamped)
      this.writeOutput(parts, clamped)

      if (!originalEvent) return
      this.emit('ui-change', {
        originalEvent,
        previousValue,
        reason: moved,
        source: transitionSourceFromEvent(originalEvent),
        value: clamped,
      } satisfies RangeFieldChangeDetail)
    }

    private writeFill(parts: RangeFieldParts, pair: RangePair): void {
      const surface = parts.track ?? this
      const min = Number(parts.from?.min || 0)
      const max = Number(parts.from?.max || 100)
      const { start, end } = rangeFillBounds(pair, { min, max })
      surface.style.setProperty(FILL_START_PROPERTY, `${start}%`)
      surface.style.setProperty(FILL_END_PROPERTY, `${end}%`)
    }

    private writeOutput(parts: RangeFieldParts, pair: RangePair): void {
      if (!parts.output) return
      parts.output.textContent = `${pair.from} – ${pair.to}`
    }

    private movedThumb(event: Event): 'from' | 'to' | null {
      if (this.closestTarget<HTMLInputElement>(event, FROM_SELECTOR)) return 'from'
      if (this.closestTarget<HTMLInputElement>(event, TO_SELECTOR)) return 'to'
      return null
    }

    private get rangeParts(): RangeFieldParts {
      return findRangeFieldParts(this)
    }
  }

  return UIRangeFieldElement as unknown as UIRangeFieldElementConstructor
}

export function findRangeFieldParts(host: Element): RangeFieldParts {
  return {
    from: host.querySelector<HTMLInputElement>(FROM_SELECTOR),
    to: host.querySelector<HTMLInputElement>(TO_SELECTOR),
    track: host.querySelector<HTMLElement>(TRACK_SELECTOR),
    output: host.querySelector<HTMLElement>(OUTPUT_SELECTOR),
  }
}

export const UIRangeFieldElement = createRangeFieldElementClass()
export type UIRangeFieldElement = InstanceType<typeof UIRangeFieldElement>

declare global {
  interface HTMLElementTagNameMap {
    'ui-range-field': UIRangeFieldElement
  }
}
