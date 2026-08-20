import {
  attr,
  boolAttr,
  createId,
  createUIElementClass,
  element,
  listen,
  watch,
} from '@timelessui/core'
import { supportsAnchorPositioning, supportsNativePopover } from './capabilities'
import {
  applyFloatingPosition,
  clearFloatingPosition,
  resolveFloatingPlacement,
  syncFloatingAnchor,
  type FloatingPlacement,
} from './floating'
import { findMenuItems, firstEnabledMenuItemIndex } from './menu'
import { isPopoverOpen } from './popover'
import { queryOwnedPart } from './parts'

export type MenuButtonElementLike = {
  id: string
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type MenuButtonTriggerLike = MenuButtonElementLike & {
  readonly style: {
    removeProperty(name: string): void
    setProperty(name: string, value: string): void
  }
}

export type MenuButtonContentLike = MenuButtonElementLike & {
  readonly open?: boolean
  readonly style: {
    removeProperty(name: string): void
    setProperty(name: string, value: string): void
  }
}

export type MenuButtonEnhancementParts = {
  readonly host: MenuButtonElementLike
  readonly trigger: MenuButtonTriggerLike | null
  readonly content: MenuButtonContentLike | null
}

export type MenuButtonEnhancementOptions = {
  readonly anchorName: string
  readonly generatedId: string
  readonly supportsPopover: boolean
}

export type MenuButtonEnhancementResult =
  | { readonly status: 'enhanced'; readonly contentId: string }
  | { readonly status: 'invalid'; readonly missing: readonly string[] }
  | { readonly status: 'unsupported'; readonly feature: 'popover' }

export type MenuButtonToggleDetail = {
  readonly open: boolean
  readonly source: 'api' | 'trigger'
}

const TRIGGER_SELECTOR = "[data-ui-part~='trigger']"
const CONTENT_SELECTOR = 'ui-menu[popover], [popover]'

export type UIMenuButtonElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    open: boolean
    placement: FloatingPlacement
  }
}

export function createMenuButtonElementClass(
  targetWindow?: Window,
): UIMenuButtonElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-menu-button')
  class UIMenuButtonElement extends UIElementBase {
    @attr accessor placement: FloatingPlacement = 'bottom'
    @boolAttr accessor open = false
    get trigger(): HTMLElement | null {
      return queryOwnedPart(this, TRIGGER_SELECTOR)
    }

    get content(): HTMLElement | null {
      return queryOwnedPart(this, CONTENT_SELECTOR)
    }

    #syncingOpen = false
    #toggleSource: 'api' | 'trigger' = 'api'

    private handleFloatingEnvironmentChange = (): void => {
      this.updateFloatingPosition()
    }

    protected override connected(): void {
      this.observeParts((signal) => this.enhance(signal))
    }

    private enhance(signal: AbortSignal): void {
      const instanceId = nextAvailableMenuButtonInstanceId(this.ownerDocument)
      const result = enhanceMenuButtonParts(
        {
          host: this,
          trigger: this.trigger,
          content: this.content,
        },
        {
          anchorName: `--${instanceId}-anchor`,
          generatedId: instanceId,
          supportsPopover: supportsNativePopover(this.ownerDocument.defaultView),
        },
      )

      if (result.status !== 'enhanced' || !this.content) {
        return
      }

      this.on(this.content, 'toggle', this.handleToggle, { signal })
      this.on(this.ownerWindow, 'resize', this.handleFloatingEnvironmentChange, { signal })
      this.on(this.ownerWindow, 'scroll', this.handleFloatingEnvironmentChange, { signal })
      this.syncOpenState(isPopoverOpen(this.content))
    }

    @watch('open')
    syncOpen(): void {
      if (this.#syncingOpen) return
      if (this.open) {
        this.openMenu('api')
        return
      }
      this.closeMenu('api')
    }

    @watch('placement')
    updateFloatingPosition(): void {
      if (!this.trigger || !this.content || !isPopoverOpen(this.content)) return

      // The stylesheet positions the surface wherever anchor positioning exists; running the
      // coordinate fallback there would stamp a private hook and compute values the `@supports` rule
      // discards. This runs *because* support is missing, which is the only time it is the answer.
      if (supportsAnchorPositioning(this.ownerDocument.defaultView)) return

      applyFloatingPosition({
        content: this.content,
        placement: resolveFloatingPlacement(this.placement),
        trigger: this.trigger,
      })
    }

    @listen('click')
    handleClick(event: Event): void {
      const trigger = this.closestTarget<HTMLElement>(event, TRIGGER_SELECTOR)
      if (trigger !== this.trigger) return

      event.preventDefault()
      if (this.open) {
        this.closeMenu('trigger')
        return
      }
      this.openMenu('trigger')
    }

    private handleToggle = (event: Event): void => {
      if (event.target !== this.content || !this.content) return

      const open = isPopoverOpen(this.content)
      this.syncOpenState(open)

      if (open) {
        this.updateFloatingPosition()
        this.focusFirstMenuItem()
        this.emit<MenuButtonToggleDetail>('ui-open', { open, source: this.#toggleSource })
        return
      }

      clearFloatingPosition(this.content)
      this.emit<MenuButtonToggleDetail>('ui-close', { open, source: this.#toggleSource })
      this.#toggleSource = 'api'
    }

    private openMenu(source: 'api' | 'trigger'): void {
      if (!this.content || isPopoverOpen(this.content)) return
      this.#toggleSource = source
      this.content.showPopover()
      this.syncOpenState(true)
    }

    private closeMenu(source: 'api' | 'trigger'): void {
      if (!this.content) {
        this.syncOpenState(false)
        return
      }

      if (isPopoverOpen(this.content)) {
        this.#toggleSource = source
        this.content.hidePopover()
      }
      this.syncOpenState(false)
      clearFloatingPosition(this.content)
    }

    private focusFirstMenuItem(): void {
      const content = this.content
      if (!content) return
      const menu = content.localName === 'ui-menu' ? content : content.querySelector('ui-menu')
      const items = menu ? findMenuItems(menu) : findMenuItems(content)
      // A disabled first item is still reachable with the arrow keys; it is just not where opening
      // the menu should land, because focus would arrive on a command that cannot be run.
      const index = firstEnabledMenuItemIndex(items)
      if (index === null) return
      items[index]?.focus()
    }

    private syncOpenState(open: boolean): void {
      this.#syncingOpen = true
      try {
        this.open = open
      } finally {
        this.#syncingOpen = false
      }
      this.trigger?.setAttribute('aria-expanded', String(open))
    }

    private get ownerWindow(): Window {
      return this.ownerDocument.defaultView ?? window
    }
  }

  return UIMenuButtonElement as unknown as UIMenuButtonElementConstructor
}

export const UIMenuButtonElement = createMenuButtonElementClass()
export type UIMenuButtonElement = InstanceType<typeof UIMenuButtonElement>

export function enhanceMenuButtonParts(
  parts: MenuButtonEnhancementParts,
  options: MenuButtonEnhancementOptions,
): MenuButtonEnhancementResult {
  const missing = invalidMenuButtonParts(parts)
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
  content.setAttribute('role', content.getAttribute('role') ?? 'menu')
  trigger.setAttribute('aria-controls', content.id)
  trigger.setAttribute('aria-haspopup', 'menu')
  trigger.setAttribute('aria-expanded', 'false')

  return { status: 'enhanced', contentId: content.id }
}

function invalidMenuButtonParts(parts: MenuButtonEnhancementParts): readonly string[] {
  const missing: string[] = []
  if (!parts.trigger) missing.push('trigger')
  if (!parts.content) missing.push('content')
  return missing
}

function nextAvailableMenuButtonInstanceId(ownerDocument: Document): string {
  let id: string
  do {
    id = createId('ui-menu-button', ownerDocument)
  } while (ownerDocument.getElementById(id))
  return id
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-menu-button': UIMenuButtonElement
  }
}
