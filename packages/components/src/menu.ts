import { attr, createUIElementClass, element, listen, watch } from '@timelessui/core'
import { collectionItemText } from './collection'
import { syncFloatingAnchor } from './floating'

export type MenuRole = 'menu' | 'menubar'
export type MenuOrientation = 'horizontal' | 'vertical'

export type MenuItemLike = {
  readonly textContent?: string | null
  click?(): void
  focus(): void
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  matches?(selector: string): boolean
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type MenuHostLike = MenuItemLike

export type MenuEnhancementParts = {
  readonly host: MenuHostLike
  readonly items: readonly MenuItemLike[]
}

export type MenuEnhancementOptions = {
  readonly orientation: MenuOrientation
  readonly role?: MenuRole
}

export type MenuEnhancementResult =
  | { readonly status: 'enhanced'; readonly activeIndex: number | null; readonly role: MenuRole }
  | { readonly status: 'invalid'; readonly missing: readonly string[] }

const MENU_ITEM_SELECTOR =
  '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], button, a[href]'
const TYPEAHEAD_RESET_MS = 700

let typeaheadTimerFallback = 0
let nextMenuSubmenuAnchorId = 0

export type UIMenuElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    orientation: string
  }
}

export function createMenuElementClass(targetWindow?: Window): UIMenuElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-menu')
  class UIMenuElement extends UIElementBase {
    @attr accessor orientation = ''

    #typeahead = ''
    #typeaheadTimer = 0

    protected override connected(): void {
      this.observeParts(() => this.enhance())
    }

    protected override disconnected(): void {
      this.clearTypeahead()
    }

    private enhance(): void {
      enhanceMenuParts(
        {
          host: this,
          items: this.items,
        },
        {
          orientation: resolveMenuOrientation(this.orientation, this.getAttribute('role')),
          role: resolveMenuRole(this.getAttribute('role')),
        },
      )
      this.syncSubmenuAnchors()
    }

    @watch('orientation')
    syncOrientation(): void {
      const orientation = resolveMenuOrientation(this.orientation, this.getAttribute('role'))
      this.setAttribute('aria-orientation', orientation)
    }

    @listen('click')
    handleClick(event: Event): void {
      const item = this.eventItem(event)
      if (!item) return

      if (isMenuItemDisabled(item)) {
        event.preventDefault()
        return
      }

      if (resolveMenuRole(this.getAttribute('role')) === 'menubar' && submenuForItem(item)) {
        event.preventDefault()
        this.openSubmenu(item, 'first')
        return
      }

      syncMenuRovingTabIndex(this.items, this.items.indexOf(item))
    }

    @listen('keydown')
    handleKeyDown(event: KeyboardEvent): void {
      const item = this.eventItem(event)
      if (!item) return

      const items = this.items
      const currentIndex = items.indexOf(item)
      const role = resolveMenuRole(this.getAttribute('role'))
      const orientation = resolveMenuOrientation(this.orientation, this.getAttribute('role'))
      const hadOpenSubmenu = role === 'menubar' && hasOpenSubmenu(items)

      if (role === 'menubar' && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        if (this.openSubmenu(item, event.key === 'ArrowUp' ? 'last' : 'first')) {
          event.preventDefault()
        }
        return
      }

      if (
        role === 'menu' &&
        (event.key === 'ArrowRight' || event.key === 'ArrowLeft') &&
        this.moveBetweenMenubarSubmenus(event.key === 'ArrowRight' ? 1 : -1)
      ) {
        event.preventDefault()
        return
      }

      if (role === 'menu' && event.key === 'Escape' && this.closeContainingSubmenu()) {
        event.preventDefault()
        return
      }

      const targetIndex = menuNavigationTarget(items, currentIndex, event.key, orientation)

      if (targetIndex !== null) {
        event.preventDefault()
        this.moveTo(targetIndex)
        if (hadOpenSubmenu) {
          this.syncOpenMenubarSubmenu(this.items[targetIndex]!)
        }
        return
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        if (!isMenuItemDisabled(item)) {
          if (this.openSubmenu(item, 'first')) {
            return
          }
          item.click?.()
        }
        return
      }

      if (isTypeaheadEvent(event)) {
        this.#typeahead += event.key
        const typeaheadIndex = menuTypeaheadTarget(items, currentIndex, this.#typeahead)
        this.scheduleTypeaheadReset()
        if (typeaheadIndex !== null) {
          event.preventDefault()
          this.moveTo(typeaheadIndex)
        }
      }
    }

    private moveTo(index: number): void {
      const resolvedIndex = syncMenuRovingTabIndex(this.items, index)
      if (resolvedIndex !== null) {
        this.items[resolvedIndex]?.focus()
      }
    }

    private openSubmenu(item: HTMLElement, focusTarget: 'first' | 'last'): boolean {
      const submenu = submenuForItem(item)
      if (!submenu || isMenuItemDisabled(item)) {
        return false
      }

      closeSiblingSubmenus(this.items, submenu)
      if (!isSubmenuOpen(submenu)) {
        submenu.showPopover()
      }
      item.setAttribute('aria-expanded', 'true')
      focusSubmenuItem(submenu, focusTarget)
      return true
    }

    private moveBetweenMenubarSubmenus(direction: 1 | -1): boolean {
      const submenu = this.closest<HTMLElement>('[popover]')
      if (!submenu) {
        return false
      }

      const trigger = submenuTriggerForContent(submenu)
      const menubar = trigger?.closest<HTMLElement>('ui-menu[role="menubar"]')
      if (!trigger || !menubar || menubar === this) {
        return false
      }

      const menubarItems = findMenuItems(menubar)
      const triggerIndex = menubarItems.indexOf(trigger)
      if (triggerIndex < 0 || menubarItems.length === 0) {
        return false
      }

      const nextIndex = (triggerIndex + direction + menubarItems.length) % menubarItems.length
      const nextItem = menubarItems[nextIndex]!
      const nextSubmenu = submenuForItem(nextItem)
      syncMenuRovingTabIndex(menubarItems, nextIndex)

      if (nextSubmenu && !isMenuItemDisabled(nextItem)) {
        closeSiblingSubmenus(menubarItems, nextSubmenu)
        if (!isSubmenuOpen(nextSubmenu)) {
          nextSubmenu.showPopover()
        }
        nextItem.setAttribute('aria-expanded', 'true')
        focusSubmenuItem(nextSubmenu, 'first')
      } else {
        closeSiblingSubmenus(menubarItems, null)
        nextItem.focus()
      }

      return true
    }

    private syncOpenMenubarSubmenu(item: HTMLElement): void {
      const submenu = submenuForItem(item)
      closeSiblingSubmenus(this.items, submenu)
      if (submenu) {
        if (!isSubmenuOpen(submenu)) {
          submenu.showPopover()
        }
        item.setAttribute('aria-expanded', 'true')
      }
    }

    private closeContainingSubmenu(): boolean {
      const submenu = this.closest<HTMLElement>('[popover]')
      if (!submenu || !isSubmenuOpen(submenu)) {
        return false
      }

      const trigger = submenuTriggerForContent(submenu)
      submenu.hidePopover()
      trigger?.setAttribute('aria-expanded', 'false')
      trigger?.focus()
      return true
    }

    private syncSubmenuAnchors(): void {
      for (const item of this.items) {
        const submenu = submenuForItem(item)
        if (!submenu) continue

        const anchorName = `--ui-menu-submenu-anchor-${++nextMenuSubmenuAnchorId}`
        syncFloatingAnchor({ host: this, trigger: item, content: submenu }, { anchorName })
      }
    }

    private eventItem(event: Event): HTMLElement | null {
      const item = this.closestTarget<HTMLElement>(event, MENU_ITEM_SELECTOR)
      return item && this.items.includes(item) ? item : null
    }

    private scheduleTypeaheadReset(): void {
      this.clearTypeaheadTimer()
      const ownerWindow = this.ownerDocument.defaultView
      this.#typeaheadTimer = ownerWindow
        ? ownerWindow.setTimeout(() => this.clearTypeahead(), TYPEAHEAD_RESET_MS)
        : ++typeaheadTimerFallback
    }

    private clearTypeahead(): void {
      this.clearTypeaheadTimer()
      this.#typeahead = ''
    }

    private clearTypeaheadTimer(): void {
      if (!this.#typeaheadTimer) return
      this.ownerDocument.defaultView?.clearTimeout(this.#typeaheadTimer)
      this.#typeaheadTimer = 0
    }

    private get items(): HTMLElement[] {
      return findMenuItems(this)
    }
  }

  return UIMenuElement as unknown as UIMenuElementConstructor
}

export const UIMenuElement = createMenuElementClass()
export type UIMenuElement = InstanceType<typeof UIMenuElement>

export function enhanceMenuParts(
  parts: MenuEnhancementParts,
  options: MenuEnhancementOptions,
): MenuEnhancementResult {
  if (parts.items.length === 0) {
    return { status: 'invalid', missing: ['items'] }
  }

  const role = options.role ?? resolveMenuRole(parts.host.getAttribute('role'))
  parts.host.setAttribute('role', role)
  parts.host.setAttribute('orientation', options.orientation)
  parts.host.setAttribute('aria-orientation', options.orientation)

  for (const item of parts.items) {
    syncMenuItemSemantics(item)
    syncMenuItemSubmenuSemantics(item)
  }

  const activeIndex = syncMenuRovingTabIndex(parts.items, initialMenuActiveIndex(parts.items))
  return { status: 'enhanced', activeIndex, role }
}

export function resolveMenuRole(value: string | null): MenuRole {
  return value === 'menubar' ? 'menubar' : 'menu'
}

export function resolveMenuOrientation(
  value: string | null,
  role: string | null = null,
): MenuOrientation {
  if (value === 'horizontal' || value === 'vertical') {
    return value
  }
  return resolveMenuRole(role) === 'menubar' ? 'horizontal' : 'vertical'
}

export function menuNavigationTarget(
  items: readonly MenuItemLike[],
  currentIndex: number,
  key: string,
  orientation: MenuOrientation,
): number | null {
  if (items.length === 0) return null
  if (key === 'Home') return 0
  if (key === 'End') return items.length - 1
  if (orientation === 'vertical' && key === 'ArrowDown')
    return adjacentMenuItemIndex(items, currentIndex, 1)
  if (orientation === 'vertical' && key === 'ArrowUp')
    return adjacentMenuItemIndex(items, currentIndex, -1)
  if (orientation === 'horizontal' && key === 'ArrowRight') {
    return adjacentMenuItemIndex(items, currentIndex, 1)
  }
  if (orientation === 'horizontal' && key === 'ArrowLeft') {
    return adjacentMenuItemIndex(items, currentIndex, -1)
  }
  return null
}

export function menuTypeaheadTarget(
  items: readonly MenuItemLike[],
  currentIndex: number,
  search: string,
): number | null {
  const normalizedSearch = search.replace(/\s+/g, ' ').trim().toLocaleLowerCase()
  if (!normalizedSearch || items.length === 0) return null

  for (let offset = 1; offset <= items.length; offset += 1) {
    const index = (currentIndex + offset + items.length) % items.length
    if (collectionItemText(items[index]!).startsWith(normalizedSearch)) {
      return index
    }
  }
  return null
}

export function syncMenuRovingTabIndex(
  items: readonly MenuItemLike[],
  activeIndex: number | null,
): number | null {
  const resolvedIndex =
    activeIndex !== null && activeIndex >= 0 && activeIndex < items.length ? activeIndex : 0
  if (items.length === 0) return null

  items.forEach((item, index) => {
    item.setAttribute('tabindex', index === resolvedIndex ? '0' : '-1')
  })
  return resolvedIndex
}

export function isMenuItemDisabled(item: MenuItemLike): boolean {
  return (
    item.hasAttribute('disabled') ||
    item.getAttribute('aria-disabled') === 'true' ||
    itemMatches(item, ':disabled')
  )
}

export function findMenuItems(host: Element): HTMLElement[] {
  return Array.from(host.children).filter((child): child is HTMLElement =>
    child.matches(MENU_ITEM_SELECTOR),
  )
}

function syncMenuItemSemantics(item: MenuItemLike): void {
  const role = item.getAttribute('role')
  if (role !== 'menuitemcheckbox' && role !== 'menuitemradio') {
    item.setAttribute('role', 'menuitem')
  }

  if (item.hasAttribute('disabled')) {
    item.removeAttribute('disabled')
    item.setAttribute('aria-disabled', 'true')
  }
}

function syncMenuItemSubmenuSemantics(item: MenuItemLike): void {
  if (!hasOwnerDocument(item) || !isHTMLElement(item, item.ownerDocument.defaultView)) return
  const submenu = submenuForItem(item)
  if (!submenu) return

  if (!submenu.id) {
    submenu.id = `ui-submenu-${++nextMenuSubmenuAnchorId}`
  }
  if (!submenu.hasAttribute('popover')) {
    submenu.setAttribute('popover', 'auto')
  }
  item.setAttribute('aria-haspopup', 'menu')
  item.setAttribute('aria-controls', submenu.id)
  item.setAttribute('aria-expanded', isSubmenuOpen(submenu) ? 'true' : 'false')
}

function initialMenuActiveIndex(items: readonly MenuItemLike[]): number | null {
  return items.length > 0 ? 0 : null
}

function adjacentMenuItemIndex(
  items: readonly MenuItemLike[],
  currentIndex: number,
  direction: 1 | -1,
): number | null {
  if (items.length === 0) return null
  return (currentIndex + direction + items.length) % items.length
}

function isTypeaheadEvent(event: KeyboardEvent): boolean {
  return event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey
}

function itemMatches(item: MenuItemLike, selector: string): boolean {
  try {
    return item.matches?.(selector) === true
  } catch {
    return false
  }
}

function submenuForItem(item: HTMLElement): HTMLElement | null {
  const controlledId = item.getAttribute('aria-controls')
  const controlled = controlledId ? item.ownerDocument.getElementById(controlledId) : null
  if (isHTMLElement(controlled, item.ownerDocument.defaultView) && isSubmenuElement(controlled)) {
    return controlled
  }

  const sibling = item.nextElementSibling
  return isHTMLElement(sibling, item.ownerDocument.defaultView) && isSubmenuElement(sibling)
    ? sibling
    : null
}

function isSubmenuElement(element: HTMLElement): boolean {
  return element.localName === 'ui-menu' || element.matches('[role="menu"]')
}

function hasOpenSubmenu(items: readonly HTMLElement[]): boolean {
  return items.some((item) => {
    const submenu = submenuForItem(item)
    return submenu ? isSubmenuOpen(submenu) : false
  })
}

function closeSiblingSubmenus(
  items: readonly HTMLElement[],
  activeSubmenu: HTMLElement | null,
): void {
  for (const item of items) {
    const submenu = submenuForItem(item)
    if (!submenu || submenu === activeSubmenu) continue

    if (isSubmenuOpen(submenu)) {
      submenu.hidePopover()
    }
    item.setAttribute('aria-expanded', 'false')
  }
}

function focusSubmenuItem(submenu: HTMLElement, target: 'first' | 'last'): void {
  const items = findMenuItems(submenu)
  const index = target === 'last' ? items.length - 1 : 0
  const resolvedIndex = syncMenuRovingTabIndex(items, index)
  if (resolvedIndex !== null) {
    items[resolvedIndex]?.focus()
  }
}

function submenuTriggerForContent(content: HTMLElement): HTMLElement | null {
  if (!content.id) return null
  return content.ownerDocument.querySelector<HTMLElement>(
    `[aria-controls="${CSS.escape(content.id)}"]`,
  )
}

function isSubmenuOpen(submenu: HTMLElement): boolean {
  try {
    return submenu.matches(':popover-open')
  } catch {
    return false
  }
}

function isHTMLElement(value: unknown, targetWindow?: Window | null): value is HTMLElement {
  const realm = (targetWindow ?? (typeof window === 'undefined' ? null : window)) as
    | (Window & typeof globalThis)
    | null
  return Boolean(realm?.HTMLElement && value instanceof realm.HTMLElement)
}

function hasOwnerDocument(value: unknown): value is { readonly ownerDocument: Document } {
  return Boolean(value && typeof value === 'object' && 'ownerDocument' in value)
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-menu': UIMenuElement
  }
}
