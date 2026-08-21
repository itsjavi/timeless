import {
  attr,
  createId,
  createUIElementClass,
  createDismissableLayerController,
  element,
  watch,
  type DismissableLayerController,
} from '@timelessui/core'
import { supportsAnchorPositioning, supportsNativePopover } from './capabilities'
import {
  applyFloatingPosition,
  clearFloatingPosition,
  resolveFloatingPlacement,
  syncFloatingAnchor,
  type FloatingElementLike,
} from './floating'
import { isPopoverOpen } from './popover'
import { queryOwnedPart } from './parts'
import { hoverCardVariants } from './values/hover-card'
import type { HoverCardVariant } from './values/hover-card'

export { hoverCardVariants, type HoverCardVariant }

export type HoverCardElementLike = {
  id: string
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type HoverCardFloatingElementLike = HoverCardElementLike & FloatingElementLike

export type HoverCardEnhancementParts = {
  readonly host: HoverCardElementLike
  readonly trigger: HoverCardFloatingElementLike | null
  readonly content: HoverCardFloatingElementLike | null
}

export type HoverCardEnhancementOptions = {
  readonly generatedId: string
  readonly anchorName: string
  readonly supportsPopover: boolean
  readonly role?: 'group' | 'tooltip'
}

export type HoverCardEnhancementResult =
  | {
      readonly status: 'enhanced'
      readonly anchorName: string
      readonly contentId: string
      readonly role: 'group' | 'tooltip'
    }
  | { readonly status: 'invalid'; readonly missing: readonly string[] }
  | { readonly status: 'unsupported'; readonly feature: 'popover' }

const TRIGGER_SELECTOR = "[data-ui-part~='trigger']"
const CONTENT_SELECTOR = '[popover]'
const DEFAULT_OPEN_DELAY = 180
const DEFAULT_CLOSE_DELAY = 100

export type UIHoverCardElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    closeDelayValue: string
    anchor: string
    openDelayValue: string
    placement: string
    variant: string
  }
}

export function createHoverCardElementClass(targetWindow?: Window): UIHoverCardElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-hover-card')
  class UIHoverCardElement extends UIElementBase {
    @attr({ attribute: 'open-delay' }) accessor openDelayValue = String(DEFAULT_OPEN_DELAY)
    @attr({ attribute: 'close-delay' }) accessor closeDelayValue = String(DEFAULT_CLOSE_DELAY)
    @attr accessor anchor = ''
    @attr accessor placement = ''
    @attr accessor variant = ''
    get trigger(): HTMLElement | null {
      return queryOwnedPart(this, TRIGGER_SELECTOR)
    }

    get content(): HTMLElement | null {
      return queryOwnedPart(this, CONTENT_SELECTOR)
    }

    #openTimer: number | null = null
    #closeTimer: number | null = null
    #dismissableLayer: DismissableLayerController | null = null

    private handleFloatingEnvironmentChange = (): void => {
      this.updateFloatingPosition()
    }

    protected override connected(): void {
      this.observeParts((signal) => this.enhance(signal))
    }

    protected override disconnected(): void {
      this.clearTimers()
      this.destroyDismissableLayer()
    }

    get openDelay(): number {
      return readDelay(this.openDelayValue, DEFAULT_OPEN_DELAY)
    }

    get closeDelay(): number {
      return readDelay(this.closeDelayValue, DEFAULT_CLOSE_DELAY)
    }

    private enhance(signal: AbortSignal): void {
      const trigger = this.triggerElement
      const content = this.contentElement
      const instanceId = nextAvailableHoverCardInstanceId(this.ownerDocument)
      const result = enhanceHoverCardParts(
        {
          host: this,
          trigger,
          content,
        },
        {
          generatedId: instanceId,
          anchorName: `--${instanceId}-anchor`,
          supportsPopover: supportsNativePopover(this.ownerDocument.defaultView),
          role: this.hoverCardRole,
        },
      )

      if (result.status !== 'enhanced' || !trigger || !content) {
        return
      }

      this.on(trigger, 'pointerenter', this.scheduleOpen, { signal })
      this.on(trigger, 'focusin', this.scheduleOpen, { signal })
      this.on(trigger, 'pointerleave', this.scheduleClose, { signal })
      this.on(trigger, 'focusout', this.scheduleClose, { signal })
      this.on(content, 'toggle', this.handleToggle, { signal })
      this.on(this.ownerWindow, 'resize', this.handleFloatingEnvironmentChange, { signal })
      this.on(this.ownerWindow, 'scroll', this.handleFloatingEnvironmentChange, { signal })
      // WCAG 2.2 SC 1.4.13 "Hoverable": content triggered by pointer hover must survive the pointer
      // being moved onto it. That applies to a tooltip as much as to a hover card — reading a label
      // is not interacting with it — so both variants keep the surface pointer-safe.
      this.on(content, 'pointerenter', this.cancelClose, { signal })
      this.on(content, 'pointerleave', this.scheduleClose, { signal })
      /*
       * And the keyboard half of the same rule, which is the one that was missing. Tabbing from the
       * trigger into the surface fires `focusout` on the trigger, so the surface closed under the
       * user and focus fell to the document — the content was pointer-reachable and keyboard-
       * unreachable, which is WCAG 2.1.1 rather than a rough edge. `focusout` on the trigger still
       * schedules the close; the `focusin` here arrives after it and cancels it, exactly as
       * `pointerenter` does. Focus moving *within* the surface cancels itself the same way.
       */
      this.on(content, 'focusin', this.cancelClose, { signal })
      this.on(content, 'focusout', this.scheduleClose, { signal })

      // The click toggle is the part a tooltip must not have. A tooltip describes its trigger, and a
      // trigger that is also a button has its own job on click; toggling a label instead makes it a
      // disclosure with `role="tooltip"` on the surface, which is the APG pattern this claims to be.
      if (result.role === 'tooltip') return

      this.on(trigger, 'click', this.handleTriggerClick, { signal })
    }

    @watch('variant', { immediate: true })
    syncRole(): void {
      const content = this.contentElement
      const trigger = this.triggerElement
      if (!content || !trigger) return

      const role = this.hoverCardRole
      content.setAttribute('role', role)
      if (role === 'tooltip') {
        trigger.removeAttribute('aria-controls')
        trigger.setAttribute('aria-describedby', content.id)
        return
      }

      trigger.removeAttribute('aria-describedby')
      trigger.setAttribute('aria-controls', content.id)
    }

    private get hoverCardRole(): 'group' | 'tooltip' {
      return this.variant === 'tooltip' ? 'tooltip' : 'group'
    }

    @watch('placement')
    updateFloatingPosition(): void {
      const trigger = this.triggerElement
      const content = this.contentElement
      if (!trigger || !content || !isPopoverOpen(content)) return

      // The stylesheet positions the surface wherever anchor positioning exists; running the
      // coordinate fallback there would stamp a private hook and compute values the `@supports` rule
      // discards. This runs *because* support is missing, which is the only time it is the answer.
      if (supportsAnchorPositioning(this.ownerDocument.defaultView)) return

      applyFloatingPosition({
        trigger,
        content,
        placement: resolveFloatingPlacement(this.placement),
      })
    }

    private scheduleOpen = (): void => {
      this.cancelClose()
      this.clearOpenTimer()
      this.#openTimer = this.ownerWindow.setTimeout(() => this.open(), this.openDelay)
    }

    private scheduleClose = (): void => {
      this.clearOpenTimer()
      this.clearCloseTimer()
      this.#closeTimer = this.ownerWindow.setTimeout(() => this.close(), this.closeDelay)
    }

    private cancelClose = (): void => {
      this.clearCloseTimer()
    }

    private handleTriggerClick = (event: Event): void => {
      if (this.triggerElement?.tagName === 'BUTTON') {
        event.preventDefault()
      }

      this.clearTimers()
      if (isPopoverOpen(this.contentElement)) {
        this.close()
        return
      }

      this.open()
    }

    private handleToggle = (event: Event): void => {
      const trigger = this.triggerElement
      const content = this.contentElement
      if (event.target !== content || !trigger || !content) return
      const open = isPopoverOpen(content)
      trigger.setAttribute('aria-expanded', String(open))

      if (open) {
        this.updateFloatingPosition()
        this.#dismissableLayer = createDismissableLayerController({
          layer: content,
          onDismiss: () => this.close(),
          outsidePointer: false,
          outsideFocus: false,
        })
        return
      }

      this.destroyDismissableLayer()
      clearFloatingPosition(content)
    }

    private open(): void {
      const content = this.contentElement
      if (!content || isPopoverOpen(content)) return
      content.showPopover()
    }

    private close(): void {
      const content = this.contentElement
      if (!content || !isPopoverOpen(content)) return
      content.hidePopover()
    }

    private clearTimers(): void {
      this.clearOpenTimer()
      this.clearCloseTimer()
    }

    private clearOpenTimer(): void {
      if (this.#openTimer === null) return
      this.ownerWindow.clearTimeout(this.#openTimer)
      this.#openTimer = null
    }

    private clearCloseTimer(): void {
      if (this.#closeTimer === null) return
      this.ownerWindow.clearTimeout(this.#closeTimer)
      this.#closeTimer = null
    }

    private destroyDismissableLayer(): void {
      this.#dismissableLayer?.destroy()
      this.#dismissableLayer = null
    }

    private get ownerWindow(): Window {
      return this.ownerDocument.defaultView ?? window
    }

    private get contentElement(): HTMLElement | null {
      if (this.anchor.trim()) {
        return this
      }

      return this.content
    }

    private get triggerElement(): HTMLElement | null {
      return resolveHoverCardAnchor(this.ownerDocument, this.anchor) ?? this.trigger
    }
  }

  return UIHoverCardElement as unknown as UIHoverCardElementConstructor
}

export const UIHoverCardElement = createHoverCardElementClass()
export type UIHoverCardElement = InstanceType<typeof UIHoverCardElement>

export function enhanceHoverCardParts(
  parts: HoverCardEnhancementParts,
  options: HoverCardEnhancementOptions,
): HoverCardEnhancementResult {
  const missing = invalidHoverCardParts(parts)

  if (missing.length > 0) {
    return { status: 'invalid', missing }
  }

  if (!options.supportsPopover) {
    return { status: 'unsupported', feature: 'popover' }
  }

  const trigger = parts.trigger!
  const content = parts.content!
  if (!content.id) {
    content.id = options.generatedId
  }
  content.setAttribute('popover', 'manual')

  const role = options.role ?? 'group'
  if (!content.hasAttribute('role')) {
    content.setAttribute('role', role)
  }
  trigger.setAttribute(role === 'tooltip' ? 'aria-describedby' : 'aria-controls', content.id)
  trigger.setAttribute('aria-expanded', 'false')
  syncFloatingAnchor(
    {
      host: parts.host,
      trigger,
      content,
    },
    {
      anchorName: options.anchorName,
    },
  )

  return { status: 'enhanced', anchorName: options.anchorName, contentId: content.id, role }
}

export function readDelay(value: string | null, fallback: number): number {
  if (value === null || value.trim() === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export function resolveHoverCardAnchor(
  ownerDocument: Document,
  value: string | null,
): HTMLElement | null {
  const anchor = value?.trim()
  if (!anchor) {
    return null
  }

  return ownerDocument.getElementById(anchor.startsWith('#') ? anchor.slice(1) : anchor)
}

function invalidHoverCardParts(parts: HoverCardEnhancementParts): readonly string[] {
  const missing: string[] = []
  if (!parts.trigger) missing.push('trigger')
  if (!parts.content) missing.push('content')
  return missing
}

function nextAvailableHoverCardInstanceId(ownerDocument: Document): string {
  let id: string
  do {
    id = createId('ui-hover-card', ownerDocument)
  } while (ownerDocument.getElementById(id))
  return id
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-hover-card': UIHoverCardElement
  }
}
