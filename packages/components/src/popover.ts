import { attr, createId, createUIElementClass, element, watch } from '@timelessui/core'
import { supportsAnchorPositioning, supportsNativePopover } from './capabilities'
import {
  applyFloatingPosition,
  clearFloatingPosition,
  resolveFloatingPlacement,
  syncFloatingAnchor,
  type FloatingElementLike,
} from './floating'
import { queryOwnedPart } from './parts'
import { popoverRoles } from './values/popover'
import type { PopoverRole } from './values/popover'

export { popoverRoles, type PopoverRole }

export type PopoverElementLike = {
  id: string
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type PopoverContentLike = PopoverElementLike & FloatingElementLike
export type PopoverTriggerLike = PopoverElementLike & FloatingElementLike

export type PopoverEnhancementParts = {
  readonly host: PopoverElementLike
  readonly trigger: PopoverTriggerLike | null
  readonly content: PopoverContentLike | null
}

export type PopoverEnhancementOptions = {
  readonly generatedId: string
  readonly anchorName: string
  readonly supportsPopover: boolean
  readonly role?: PopoverRole
}

export type PopoverEnhancementResult =
  | { readonly status: 'enhanced'; readonly anchorName: string; readonly contentId: string }
  | { readonly status: 'invalid'; readonly missing: readonly string[] }
  | { readonly status: 'unsupported'; readonly feature: 'popover' }

const TRIGGER_SELECTOR = "[data-ui-part~='trigger']"
const CONTENT_SELECTOR = '[popover]'

export type UIPopoverElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    placement: string
    roleValue: string
  }
}

export function createPopoverElementClass(targetWindow?: Window): UIPopoverElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-popover')
  class UIPopoverElement extends UIElementBase {
    @attr accessor placement = ''
    @attr({ attribute: 'role' }) accessor roleValue = ''
    get trigger(): HTMLElement | null {
      return queryOwnedPart(this, TRIGGER_SELECTOR)
    }

    get content(): HTMLElement | null {
      return queryOwnedPart(this, CONTENT_SELECTOR)
    }

    private handleFloatingEnvironmentChange = (): void => {
      this.updateFloatingPosition()
    }

    protected override connected(): void {
      this.observeParts((signal) => this.enhance(signal))
    }

    private enhance(signal: AbortSignal): void {
      const trigger = this.trigger
      const content = this.content
      const instanceId = nextAvailablePopoverInstanceId(this.ownerDocument)
      const result = enhancePopoverParts(
        {
          host: this,
          trigger,
          content,
        },
        {
          generatedId: instanceId,
          anchorName: `--${instanceId}-anchor`,
          supportsPopover: supportsNativePopover(this.ownerDocument.defaultView),
          role: resolvePopoverRole(this.roleValue || content?.getAttribute('role') || null),
        },
      )

      if (result.status !== 'enhanced' || !content) {
        return
      }

      this.on(content, 'toggle', this.handleToggle, { signal })
      this.on(this.ownerWindow, 'resize', this.handleFloatingEnvironmentChange, { signal })
      this.on(this.ownerWindow, 'scroll', this.handleFloatingEnvironmentChange, { signal })
    }

    @watch('roleValue')
    syncRole(): void {
      const role = resolvePopoverRole(this.roleValue)
      if (this.content && role) {
        this.content.setAttribute('role', role)
      }
      syncPopoverHasPopup(this.trigger, role)
    }

    @watch('placement')
    updateFloatingPosition(): void {
      if (!this.trigger || !this.content || !isPopoverOpen(this.content)) return

      // The stylesheet positions the surface wherever anchor positioning exists; running the
      // coordinate fallback there would stamp a private hook and compute values the `@supports` rule
      // discards. This runs *because* support is missing, which is the only time it is the answer.
      if (supportsAnchorPositioning(this.ownerDocument.defaultView)) return

      applyFloatingPosition({
        trigger: this.trigger,
        content: this.content,
        placement: resolveFloatingPlacement(this.placement),
      })
    }

    private handleToggle = (event: Event): void => {
      const content = this.content
      if (!content || event.target !== content) return
      const open = isPopoverOpen(content)
      syncPopoverExpanded(this.trigger, open)

      if (open) {
        this.updateFloatingPosition()
        return
      }

      clearFloatingPosition(content)
    }

    private get ownerWindow(): Window {
      return this.ownerDocument.defaultView ?? window
    }
  }

  return UIPopoverElement as unknown as UIPopoverElementConstructor
}

export const UIPopoverElement = createPopoverElementClass()
export type UIPopoverElement = InstanceType<typeof UIPopoverElement>

export function enhancePopoverParts(
  parts: PopoverEnhancementParts,
  options: PopoverEnhancementOptions,
): PopoverEnhancementResult {
  const missing = invalidPopoverParts(parts)

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
  if (!content.hasAttribute('popover')) {
    content.setAttribute('popover', 'auto')
  }
  const role = options.role
  if (role && !content.hasAttribute('role')) {
    content.setAttribute('role', role)
  }

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
  trigger.setAttribute('popovertarget', content.id)
  trigger.setAttribute('aria-controls', content.id)
  syncPopoverHasPopup(trigger, role)
  syncPopoverExpanded(trigger, false)

  return {
    status: 'enhanced',
    anchorName: options.anchorName,
    contentId: content.id,
  }
}

export function resolvePopoverRole(value: string | null): PopoverEnhancementOptions['role'] {
  if (value === 'dialog' || value === 'menu' || value === 'listbox' || value === 'tooltip') {
    return value
  }
  return 'dialog'
}

export function syncPopoverExpanded(trigger: PopoverTriggerLike | null, open: boolean): void {
  trigger?.setAttribute('aria-expanded', String(open))
}

export function syncPopoverHasPopup(
  trigger: PopoverTriggerLike | null,
  role: PopoverEnhancementOptions['role'],
): void {
  if (!trigger) return

  if (role && role !== 'tooltip') {
    trigger.setAttribute('aria-haspopup', role)
    return
  }

  trigger.removeAttribute('aria-haspopup')
}

export function isPopoverOpen(content: HTMLElement | null): boolean {
  if (!content) return false

  try {
    return content.matches(':popover-open')
  } catch {
    return false
  }
}

function invalidPopoverParts(parts: PopoverEnhancementParts): readonly string[] {
  const missing: string[] = []
  if (!parts.trigger) missing.push('trigger')
  if (!parts.content) missing.push('content')
  return missing
}

function nextAvailablePopoverInstanceId(ownerDocument: Document): string {
  let id: string
  do {
    id = createId('ui-popover', ownerDocument)
  } while (ownerDocument.getElementById(id))
  return id
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-popover': UIPopoverElement
  }
}
