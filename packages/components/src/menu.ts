import { attr, createId, createUIElementClass, element, listen, watch } from '@timelessui/core'
import { collectionItemText } from './collection'
import { syncFloatingAnchor } from './floating'
import { queryOwnedParts } from './parts'
import { menuOrientations } from './values/menu'
import type { MenuOrientation } from './values/menu'

export type MenuRole = 'menu' | 'menubar'
export type MenuCheckableRole = 'menuitemcheckbox' | 'menuitemradio'
export { menuOrientations, type MenuOrientation }

export type MenuItemLike = {
  readonly textContent?: string | null
  click?(): void
  /** Used to resolve an item's owning radio group. Absent on a structural test double with no DOM. */
  closest?(selector: string): unknown
  focus(): void
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  matches?(selector: string): boolean
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type MenuHostLike = MenuItemLike

export type MenuGroupLike = {
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  setAttribute(name: string, value: string): void
  querySelector?(selector: string): { id: string } | null
}

/**
 * The proposal and the outcome of a checkable item changing state. `role` is the item's own role,
 * because a checkbox toggles while a radio only ever turns on.
 */
export type MenuCheckedDetail = {
  readonly checked: boolean
  readonly item: MenuItemLike
  readonly role: MenuCheckableRole
}

export type MenuEnhancementParts = {
  readonly host: MenuHostLike
  readonly items: readonly MenuItemLike[]
  readonly groups?: readonly MenuGroupLike[]
}

export type MenuEnhancementOptions = {
  readonly orientation: MenuOrientation
  readonly generatedIdPrefix?: string
  readonly role?: MenuRole
}

export type MenuEnhancementResult =
  | { readonly status: 'enhanced'; readonly activeIndex: number | null; readonly role: MenuRole }
  | { readonly status: 'invalid'; readonly missing: readonly string[] }

/**
 * The declared `item` part, character for character.
 *
 * An element becomes a menu item by carrying a menu-item role, not by being a button. The selector
 * used to also accept a bare `button` or `a[href]`, which made a `<button role="separator">` a
 * focusable command and put the JavaScript one step ahead of the documented anatomy. Narrowing it
 * also removes the need for a separator guard: one `role` attribute cannot be both.
 */
const MENU_ITEM_SELECTOR = "[role^='menuitem']"
const MENU_GROUP_SELECTOR = "[data-ui-part~='group']"
const MENU_GROUP_LABEL_SELECTOR = "[data-ui-part~='group-label']"
/** An item's radio scope: its authored group, or the menu itself when it has none. */
const MENU_GROUP_SCOPE_SELECTOR = "[data-ui-part~='group'], [role='group']"
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
    #instanceId = ''

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
          groups: this.groups,
        },
        {
          generatedIdPrefix: this.instanceId,
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
      this.toggleCheckedItem(item)
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
      const rightToLeft = isRightToLeft(this)
      const inlineDirection = menuInlineDirection(event.key, rightToLeft)

      if (role === 'menubar' && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        if (this.openSubmenu(item, event.key === 'ArrowUp' ? 'last' : 'first')) {
          event.preventDefault()
        }
        return
      }

      // A submenu opens outward and closes inward, whatever depth it sits at. The menubar traversal
      // below is the depth-one special case: closing a first-level submenu moves along the bar.
      if (role === 'menu' && inlineDirection === 'forward' && this.openSubmenu(item, 'first')) {
        event.preventDefault()
        return
      }

      if (
        role === 'menu' &&
        inlineDirection !== null &&
        this.moveBetweenMenubarSubmenus(inlineDirection === 'forward' ? 1 : -1)
      ) {
        event.preventDefault()
        return
      }

      if (role === 'menu' && inlineDirection === 'backward' && this.closeParentSubmenu()) {
        event.preventDefault()
        return
      }

      if (role === 'menu' && event.key === 'Escape' && this.closeContainingPopover()) {
        event.preventDefault()
        return
      }

      const targetIndex = menuNavigationTarget(
        items,
        currentIndex,
        rightToLeft ? mirrorInlineKey(event.key) : event.key,
        orientation,
      )

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

    /**
     * Writes `aria-checked` for a checkable item, after offering the change to the author.
     *
     * The stylesheet has always drawn `[aria-checked='true']` while nothing wrote it, so the state
     * was a promise the component did not keep. Consumers who already toggle it themselves stay in
     * control by cancelling `ui-before-change`.
     */
    private toggleCheckedItem(item: HTMLElement): void {
      const role = menuCheckableRole(item)
      if (!role) return

      const checked = role === 'menuitemradio' ? true : item.getAttribute('aria-checked') !== 'true'
      // Re-activating a checked radio is a no-op in the APG pattern, so it is not a change at all.
      if (role === 'menuitemradio' && item.getAttribute('aria-checked') === 'true') return

      const detail: MenuCheckedDetail = { checked, item, role }
      if (!this.emit<MenuCheckedDetail>('ui-before-change', detail, { cancelable: true })) {
        return
      }

      applyMenuItemChecked(item, this.items, checked)
      this.emit<MenuCheckedDetail>('ui-change', detail)
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

    /**
     * The inward half of the submenu keys. Unlike Escape it acts only on a real submenu — one whose
     * invoker is itself a menu item — so it never collapses the menu a Menu Button opened.
     */
    private closeParentSubmenu(): boolean {
      const submenu = this.closest<HTMLElement>('[popover]')
      if (!submenu || !isSubmenuOpen(submenu)) {
        return false
      }

      const trigger = submenuTriggerForContent(submenu)
      if (!trigger || !trigger.matches(MENU_ITEM_SELECTOR)) {
        return false
      }

      submenu.hidePopover()
      trigger.setAttribute('aria-expanded', 'false')
      trigger.focus()
      return true
    }

    private closeContainingPopover(): boolean {
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

    private get instanceId(): string {
      if (!this.#instanceId) {
        this.#instanceId = this.id || createId('ui-menu', this.ownerDocument)
      }
      return this.#instanceId
    }

    private get items(): HTMLElement[] {
      return findMenuItems(this)
    }

    private get groups(): HTMLElement[] {
      return findMenuGroups(this)
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
  enhanceMenuGroups(parts.groups ?? [], options.generatedIdPrefix ?? 'ui-menu')

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

/**
 * Which way an inline arrow points once writing direction is applied: `forward` opens a submenu,
 * `backward` closes one. Under `dir="rtl"` the two keys swap, because a submenu opens toward the
 * inline end wherever that happens to be.
 */
export function menuInlineDirection(
  key: string,
  rightToLeft: boolean,
): 'forward' | 'backward' | null {
  if (key !== 'ArrowRight' && key !== 'ArrowLeft') return null
  const forward = rightToLeft ? 'ArrowLeft' : 'ArrowRight'
  return key === forward ? 'forward' : 'backward'
}

/** Mirrors the inline arrows for a right-to-left horizontal menubar. Other keys pass through. */
export function mirrorInlineKey(key: string): string {
  if (key === 'ArrowRight') return 'ArrowLeft'
  if (key === 'ArrowLeft') return 'ArrowRight'
  return key
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

/** The checkable role an item carries, or `null` when it is a plain command. */
export function menuCheckableRole(item: MenuItemLike): MenuCheckableRole | null {
  const role = item.getAttribute('role')
  return role === 'menuitemcheckbox' || role === 'menuitemradio' ? role : null
}

/**
 * Writes the checked state for one item.
 *
 * A checkbox owns its own state. A radio turning on turns off the radios it shares a group with —
 * its authored `group` part or `role="group"` wrapper, and the whole menu when it has neither. The
 * scope matters: two radio groups in one menu must not clear each other.
 */
export function applyMenuItemChecked(
  item: MenuItemLike,
  items: readonly MenuItemLike[],
  checked: boolean,
): void {
  if (menuCheckableRole(item) !== 'menuitemradio') {
    item.setAttribute('aria-checked', String(checked))
    return
  }

  const scope = menuItemGroupScope(item)
  for (const candidate of items) {
    if (menuCheckableRole(candidate) !== 'menuitemradio') continue
    if (menuItemGroupScope(candidate) !== scope) continue
    candidate.setAttribute('aria-checked', String(candidate === item && checked))
  }
}

/** Every item the menu owns, through group wrappers but never into a nested menu. */
export function findMenuItems(host: Element): HTMLElement[] {
  return queryOwnedParts<HTMLElement>(host, MENU_ITEM_SELECTOR)
}

/** Every authored item group the menu owns. */
export function findMenuGroups(host: Element): HTMLElement[] {
  return queryOwnedParts<HTMLElement>(host, MENU_GROUP_SELECTOR)
}

/** The first item that can actually be activated, for opening and for the resting tab stop. */
export function firstEnabledMenuItemIndex(items: readonly MenuItemLike[]): number | null {
  const index = items.findIndex((item) => !isMenuItemDisabled(item))
  return index >= 0 ? index : null
}

export function lastEnabledMenuItemIndex(items: readonly MenuItemLike[]): number | null {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (!isMenuItemDisabled(items[index]!)) return index
  }
  return null
}

function menuItemGroupScope(item: MenuItemLike): unknown {
  return item.closest?.(MENU_GROUP_SCOPE_SELECTOR) ?? null
}

function enhanceMenuGroups(groups: readonly MenuGroupLike[], generatedIdPrefix: string): void {
  groups.forEach((group, index) => {
    if (!group.hasAttribute('role')) group.setAttribute('role', 'group')
    const label = group.querySelector?.(MENU_GROUP_LABEL_SELECTOR)
    if (!label) return
    if (!label.id) label.id = `${generatedIdPrefix}-group-${index + 1}-label`
    if (!group.hasAttribute('aria-labelledby')) {
      group.setAttribute('aria-labelledby', label.id)
    }
  })
}

function syncMenuItemSemantics(item: MenuItemLike): void {
  if (!menuCheckableRole(item)) {
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

/**
 * Where focus rests when the menu is first enhanced.
 *
 * Arrow keys deliberately still travel through disabled items, which is the APG's recommended
 * treatment — a command you cannot use is easier to understand than one that is not there. Landing
 * the *initial* tab stop on one is a different thing, and just looks broken.
 */
function initialMenuActiveIndex(items: readonly MenuItemLike[]): number | null {
  return firstEnabledMenuItemIndex(items) ?? (items.length > 0 ? 0 : null)
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

function isRightToLeft(element: HTMLElement): boolean {
  try {
    const computed = element.ownerDocument.defaultView?.getComputedStyle(element)
    if (computed?.direction) return computed.direction === 'rtl'
  } catch {
    // Falls through to the authored attribute below.
  }
  return element.closest('[dir]')?.getAttribute('dir')?.toLowerCase() === 'rtl'
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

function focusSubmenuItem(submenu: HTMLElement, target: 'first' | 'last'): boolean {
  const items = findMenuItems(submenu)
  const index =
    target === 'last' ? lastEnabledMenuItemIndex(items) : firstEnabledMenuItemIndex(items)
  const resolvedIndex = syncMenuRovingTabIndex(items, index)
  if (resolvedIndex === null) return false
  items[resolvedIndex]?.focus()
  return true
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
