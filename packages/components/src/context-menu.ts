/**
 * Context Menu: a [Menu](./menu.ts) surface opened by a secondary click or from the keyboard.
 *
 * Everything inside the surface is the Menu contract, unchanged — roving focus, typeahead, submenu
 * keys, checkable items, Escape returning focus to whatever opened it. This element owns three
 * things Menu cannot: when the surface opens, where it opens, and the keyboard route in for people
 * who are not holding a mouse.
 *
 * Positioning writes two coordinates as custom properties and lets `context-menu.css` decide what
 * they mean. It does not generate an anchor element: a zero-size invisible shim would be a generated
 * element that is neither optional, documented, nor stylable, which is the one thing core JavaScript
 * may not create.
 *
 * There is no no-JavaScript fallback, and that is not an oversight — the platform has no declarative
 * way to open a surface at pointer coordinates. With scripting off the browser shows its own context
 * menu and the authored `ui-menu` stays hidden, so nothing here may be the only route to a command.
 */

import { createId, createUIElementClass, element } from '@timelessui/core'
import { supportsNativePopover } from './capabilities'
import { findMenuItems, firstEnabledMenuItemIndex } from './menu'
import { queryOwnedPart } from './parts'

export type ContextMenuElementLike = {
  id: string
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  setAttribute(name: string, value: string): void
}

export type ContextMenuOpenSource = 'api' | 'keyboard' | 'pointer'

export type ContextMenuToggleDetail = {
  readonly open: boolean
  readonly source: ContextMenuOpenSource
}

export type ContextMenuPoint = {
  readonly x: number
  readonly y: number
}

export type ContextMenuEnhancementParts = {
  readonly host: ContextMenuElementLike
  readonly target: ContextMenuElementLike | null
  readonly menu: ContextMenuElementLike | null
}

export type ContextMenuEnhancementOptions = {
  readonly generatedId: string
  readonly supportsPopover: boolean
}

export type ContextMenuEnhancementResult =
  | { readonly status: 'enhanced'; readonly menuId: string }
  | { readonly status: 'invalid'; readonly missing: readonly string[] }
  | { readonly status: 'unsupported'; readonly feature: 'popover' }

const TARGET_SELECTOR = "[data-ui-part~='target']"
const MENU_SELECTOR = "ui-menu[popover], [role='menu'][popover], [popover]"
const X_PROPERTY = '--ui-context-menu-x'
const Y_PROPERTY = '--ui-context-menu-y'

/** How far below the focused element the keyboard-opened surface starts. */
const KEYBOARD_OFFSET = 2

export type UIContextMenuElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement
}

export function createContextMenuElementClass(
  targetWindow?: Window,
): UIContextMenuElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-context-menu')
  class UIContextMenuElement extends UIElementBase {
    get target(): HTMLElement | null {
      return queryOwnedPart(this, TARGET_SELECTOR)
    }

    get menu(): HTMLElement | null {
      return queryOwnedPart(this, MENU_SELECTOR)
    }

    #source: ContextMenuOpenSource = 'api'

    protected override connected(): void {
      this.observeParts((signal) => this.enhance(signal))
    }

    private enhance(signal: AbortSignal): void {
      const target = this.target
      const menu = this.menu
      const result = enhanceContextMenuParts(
        { host: this, target, menu },
        {
          generatedId: nextAvailableContextMenuInstanceId(this.ownerDocument),
          supportsPopover: supportsNativePopover(this.ownerDocument.defaultView),
        },
      )

      if (result.status !== 'enhanced' || !target || !menu) {
        return
      }

      this.on(target, 'contextmenu', this.handleContextMenu, { signal })
      this.on(target, 'keydown', this.handleKeyDown, { signal })
      this.on(menu, 'toggle', this.handleToggle, { signal })
    }

    private handleContextMenu = (event: Event): void => {
      // The authored menu replaces the browser's, so the browser's has to stand down first.
      event.preventDefault()

      // Coordinates are read structurally rather than through `instanceof MouseEvent`, because some
      // engines also fire `contextmenu` for the Context Menu key — with no useful position. Those
      // land on the keyboard path, which is where a key-initiated menu belongs anyway.
      const point = contextMenuPointFromEvent(event as Partial<MouseEvent>)
      if (point) {
        this.openAt(point, 'pointer')
        return
      }
      this.openFromFocus()
    }

    private handleKeyDown = (event: Event): void => {
      const view = this.ownerDocument.defaultView
      const KeyboardEventConstructor = view?.KeyboardEvent
      if (!KeyboardEventConstructor || !(event instanceof KeyboardEventConstructor)) return
      if (!isContextMenuKey(event)) return

      event.preventDefault()
      this.openFromFocus()
    }

    /**
     * The keyboard route. There is no pointer, so the surface opens against whatever holds focus —
     * the target itself when nothing inside it does.
     */
    private openFromFocus(): void {
      const origin = this.focusedOrigin() ?? this.target
      if (!origin) return
      this.openAt(contextMenuPointFromRect(origin.getBoundingClientRect()), 'keyboard')
    }

    private handleToggle = (event: Event): void => {
      const menu = this.menu
      if (event.target !== menu || !menu) return

      const open = isContextMenuOpen(menu)
      this.target?.setAttribute('aria-expanded', String(open))

      if (open) {
        this.focusFirstItem(menu)
        this.emit<ContextMenuToggleDetail>('ui-open', { open, source: this.#source })
        return
      }

      menu.style.removeProperty(X_PROPERTY)
      menu.style.removeProperty(Y_PROPERTY)
      this.emit<ContextMenuToggleDetail>('ui-close', { open, source: this.#source })
      this.#source = 'api'
    }

    /** Opens the surface at a viewport point. Public so a consumer can drive it from a long press. */
    openAt(point: ContextMenuPoint, source: ContextMenuOpenSource = 'api'): void {
      const menu = this.menu
      if (!menu) return

      this.#source = source
      // Two measured values, and nothing else. `context-menu.css` owns the clamp and the insets.
      menu.style.setProperty(X_PROPERTY, `${point.x}px`)
      menu.style.setProperty(Y_PROPERTY, `${point.y}px`)

      if (isContextMenuOpen(menu)) {
        // Re-opening at a new point: the coordinates are already written, so nothing else to do.
        this.focusFirstItem(menu)
        return
      }
      menu.showPopover()
    }

    close(): void {
      const menu = this.menu
      if (menu && isContextMenuOpen(menu)) {
        menu.hidePopover()
      }
    }

    private focusFirstItem(menu: HTMLElement): void {
      const items = findMenuItems(menu)
      const index = firstEnabledMenuItemIndex(items)
      if (index === null) return
      items[index]?.focus()
    }

    private focusedOrigin(): HTMLElement | null {
      const active = this.ownerDocument.activeElement
      const HTMLElementConstructor = this.ownerDocument.defaultView?.HTMLElement
      if (!HTMLElementConstructor || !(active instanceof HTMLElementConstructor)) return null
      return this.contains(active) ? active : null
    }
  }

  return UIContextMenuElement as unknown as UIContextMenuElementConstructor
}

export const UIContextMenuElement = createContextMenuElementClass()
export type UIContextMenuElement = InstanceType<typeof UIContextMenuElement>

export function enhanceContextMenuParts(
  parts: ContextMenuEnhancementParts,
  options: ContextMenuEnhancementOptions,
): ContextMenuEnhancementResult {
  const missing: string[] = []
  if (!parts.target) missing.push('target')
  if (!parts.menu) missing.push('menu')
  if (missing.length > 0) {
    return { status: 'invalid', missing }
  }

  if (!options.supportsPopover) {
    return { status: 'unsupported', feature: 'popover' }
  }

  const target = parts.target!
  const menu = parts.menu!
  if (!menu.id) {
    menu.id = options.generatedId
  }
  if (!menu.hasAttribute('popover')) {
    // `auto` rather than `manual`, so light dismiss, Escape, and top-layer stacking all come from
    // the platform. A JavaScript dismissal layer here would reimplement what the browser does.
    menu.setAttribute('popover', 'auto')
  }
  if (!menu.hasAttribute('role')) {
    menu.setAttribute('role', 'menu')
  }

  // Without a tab stop there is no keyboard route in at all, and a context menu only a mouse can
  // open is not a context menu. The role and the accessible name stay the author's.
  if (!target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '0')
  }
  target.setAttribute('aria-haspopup', 'menu')
  target.setAttribute('aria-controls', menu.id)
  target.setAttribute('aria-expanded', 'false')

  return { status: 'enhanced', menuId: menu.id }
}

/** `Shift + F10` is the APG-era shortcut; the dedicated key is what most keyboards actually send. */
export function isContextMenuKey(event: {
  readonly key: string
  readonly shiftKey: boolean
}): boolean {
  return event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')
}

/**
 * The pointer position a `contextmenu` event carries, or `null` when it carries none worth using.
 *
 * The origin is treated as "no position" rather than as the top-left corner: that is what a
 * key-initiated `contextmenu` reports in several engines, and opening against the focused element
 * there is right, while a genuine right-click on the very first pixel loses nothing by it.
 */
export function contextMenuPointFromEvent(event: {
  readonly clientX?: number
  readonly clientY?: number
}): ContextMenuPoint | null {
  const { clientX, clientY } = event
  if (typeof clientX !== 'number' || typeof clientY !== 'number') return null
  if (clientX === 0 && clientY === 0) return null
  return { x: clientX, y: clientY }
}

/**
 * The keyboard equivalent of a pointer position: just below the start edge of the focused element,
 * which is where a menu opened from a row or a cell belongs.
 */
export function contextMenuPointFromRect(rect: {
  readonly left: number
  readonly bottom: number
}): ContextMenuPoint {
  return { x: rect.left, y: rect.bottom + KEYBOARD_OFFSET }
}

function isContextMenuOpen(menu: HTMLElement): boolean {
  try {
    return menu.matches(':popover-open')
  } catch {
    return false
  }
}

function nextAvailableContextMenuInstanceId(ownerDocument: Document): string {
  let id: string
  do {
    id = createId('ui-context-menu', ownerDocument)
  } while (ownerDocument.getElementById(id))
  return id
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-context-menu': UIContextMenuElement
  }
}
