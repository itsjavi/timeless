import { attr, createUIElementClass, element, listen } from '@timelessui/core'
import { isOwnedBy, queryOwnedPart } from './parts'

const TRIGGER_SELECTOR = "[data-ui-part~='trigger']"
const COPIED_SELECTOR = "[data-ui-part~='copied']"
const STATUS_SELECTOR = "[data-ui-part~='status']"
const DEFAULT_FEEDBACK_DURATION = 1800

/**
 * The three elements whose text is not their value. Everything else — a `<code>` block, a `<pre>`, a
 * `<span>` — is read as text, which is what makes `from` useful for copying what is on the page rather
 * than a string duplicated into an attribute.
 */
const VALUE_SOURCE_ELEMENTS = new Set(['input', 'select', 'textarea'])

export type CopyFailureReason = 'unsupported' | 'denied' | 'empty'

/**
 * One event with a discriminator rather than two events, because a consumer that cares about copying
 * cares about both outcomes and would otherwise subscribe twice to learn one thing.
 *
 * `reason` is `null` exactly when `status` is `copied`.
 */
export type CopyDetail = {
  readonly status: 'copied' | 'failed'
  readonly value: string
  readonly reason: CopyFailureReason | null
}

/** The one method this component needs from `navigator.clipboard`. */
export type CopyClipboardLike = {
  writeText(text: string): Promise<void>
}

/** Structural stand-in for the element `from` names. */
export type CopySourceLike = {
  readonly localName?: string
  readonly textContent?: string | null
  readonly value?: unknown
}

/** Structural stand-in for the host, so value resolution is testable without a document. */
export type CopyButtonHostLike = {
  getAttribute(name: string): string | null
  readonly ownerDocument?: { getElementById(id: string): CopySourceLike | null } | null
}

/**
 * What `from` reads off the element it names.
 *
 * The tag list is deliberate rather than a `typeof source.value === 'string'` test: `<button value>`,
 * `<option value>`, and `<output>` all carry a string `value` that is not what an author pointing at
 * one of them means to copy.
 */
export function copySourceText(source: CopySourceLike | null): string {
  if (!source) return ''
  if (VALUE_SOURCE_ELEMENTS.has(source.localName ?? '') && typeof source.value === 'string') {
    return source.value
  }
  return source.textContent ?? ''
}

/**
 * `value`, then `from`, then nothing.
 *
 * An authored `value` wins on presence rather than on content, matching `listboxOptionValue`: an
 * explicit `value=""` means the author said what to copy, and what they said was nothing.
 */
export function resolveCopyValue(host: CopyButtonHostLike): string {
  const literal = host.getAttribute('value')
  if (literal !== null) return literal

  const id = host.getAttribute('from')
  if (id === null || id === '') return ''
  return copySourceText(host.ownerDocument?.getElementById(id) ?? null)
}

/** Milliseconds the `--copied` state and the announcement survive. Follows `readToastDuration`. */
export function readCopyFeedbackDuration(value: string | null): number {
  if (value === null || value.trim() === '') return DEFAULT_FEEDBACK_DURATION
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_FEEDBACK_DURATION
}

/**
 * The whole outcome table, in one place and returning exactly one detail per call — which is what makes
 * "one `ui-copy` per activation, on every path" structural rather than something the element remembers
 * to do.
 *
 * Nothing is awaited before `writeText`, so the click's transient user activation is still live when the
 * write happens; some engines reject it otherwise. The empty check comes first because an empty value is
 * an authoring mistake the author can fix, and reporting the environment instead would send them
 * looking in the wrong place.
 *
 * There is no fallback path. `document.execCommand('copy')` is deprecated and reviving it would need
 * generated DOM this package forbids, so an absent Clipboard API is reported and left alone.
 */
export async function performCopy(
  value: string,
  clipboard: CopyClipboardLike | null | undefined,
): Promise<CopyDetail> {
  if (value === '') return { status: 'failed', value, reason: 'empty' }
  if (!clipboard) return { status: 'failed', value, reason: 'unsupported' }

  try {
    await clipboard.writeText(value)
  } catch {
    return { status: 'failed', value, reason: 'denied' }
  }
  return { status: 'copied', value, reason: null }
}

export type UICopyButtonElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    copiedMessage: string
    feedbackDuration: string
    from: string
    value: string
  }
}

export function createCopyButtonElementClass(
  targetWindow?: Window,
): UICopyButtonElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-copy-button')
  class UICopyButtonElement extends UIElementBase {
    @attr accessor value = ''
    @attr accessor from = ''
    @attr accessor feedbackDuration = ''
    @attr accessor copiedMessage = ''

    #feedbackTimer: number | null = null

    protected override connected(): void {
      this.observeParts(() => {
        this.nameStatusRegion()
        this.revealTrigger()
      })
    }

    protected override disconnected(): void {
      this.clearFeedbackTimer()
    }

    @listen('click')
    handleClick(event: Event): void {
      const trigger = this.closestTarget(event, TRIGGER_SELECTOR)
      // `trigger` is a token nine other contracts declare, so a nested root's trigger is not ours.
      if (!trigger || !isOwnedBy(this, trigger)) return
      void this.copy()
    }

    private async copy(): Promise<void> {
      const detail = await performCopy(
        resolveCopyValue(this),
        this.ownerWindow?.navigator.clipboard,
      )
      if (detail.status === 'copied') this.confirm()
      this.emit<CopyDetail>('ui-copy', detail)
    }

    /** The state and the announcement, both lasting `feedback-duration`. */
    private confirm(): void {
      this.setCustomState('--copied', true)
      /*
       * Unscoped on purpose, unlike the two shared tokens: `copied` is declared by this contract
       * alone, so the only thing it can match is ours, and the search then covers exactly what
       * `ui-copy-button [data-ui-part~='copied']` styles — including a label nested inside a
       * `.ui-button` trigger, which an ownership walk would exclude.
       */
      this.announce(this.copiedMessage || this.$(COPIED_SELECTOR)?.textContent?.trim() || '')

      this.clearFeedbackTimer()
      const view = this.ownerWindow
      if (!view) return
      this.#feedbackTimer = view.setTimeout(() => {
        this.setCustomState('--copied', false)
        /*
         * Cleared rather than left in place: a polite live region announces a change, so the same text
         * sitting there would silence the confirmation the second time the same value is copied.
         */
        this.announce('')
      }, readCopyFeedbackDuration(this.feedbackDuration))
    }

    /** Writes into the authored region. An absent region is a choice, not an error. */
    private announce(message: string): void {
      const status = queryOwnedPart<HTMLElement>(this, STATUS_SELECTOR)
      if (status) status.textContent = message
    }

    /**
     * The opt-in reveal. A trigger the author marked `hidden` is shown once registration has happened —
     * it is running — and the Clipboard API is there to make it work. A trigger that was not authored
     * `hidden` is left alone: script does not remove an author's visible control, so an author who
     * skips this keeps an inert button, which is their call to make.
     */
    private revealTrigger(): void {
      if (!this.ownerWindow?.navigator.clipboard) return
      const trigger = queryOwnedPart<HTMLElement>(this, TRIGGER_SELECTOR)
      if (trigger?.hidden) trigger.hidden = false
    }

    /**
     * The platform has no element that is a live region, so the role and `aria-live` are the one piece
     * of ARIA here that completes a contract rather than replacing behavior — the same two guards
     * `enhanceListboxLiveRegion` applies to the collection surfaces. An authored value always wins.
     * Without this, an author who writes the part and forgets the role gets a silent copy button and
     * nothing saying why: no validator walks parts.
     */
    private nameStatusRegion(): void {
      const status = queryOwnedPart<HTMLElement>(this, STATUS_SELECTOR)
      if (!status) return
      if (!status.hasAttribute('role')) status.setAttribute('role', 'status')
      if (!status.hasAttribute('aria-live')) status.setAttribute('aria-live', 'polite')
    }

    private clearFeedbackTimer(): void {
      if (this.#feedbackTimer === null) return
      this.ownerWindow?.clearTimeout(this.#feedbackTimer)
      this.#feedbackTimer = null
    }

    private get ownerWindow(): (Window & typeof globalThis) | null {
      return (
        (this.ownerDocument.defaultView as (Window & typeof globalThis) | null) ??
        (targetWindow as (Window & typeof globalThis) | undefined) ??
        null
      )
    }
  }

  return UICopyButtonElement as unknown as UICopyButtonElementConstructor
}

export const UICopyButtonElement = createCopyButtonElementClass()
export type UICopyButtonElement = InstanceType<typeof UICopyButtonElement>

declare global {
  interface HTMLElementTagNameMap {
    'ui-copy-button': UICopyButtonElement
  }
}
