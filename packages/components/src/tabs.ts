import {
  attr,
  createId,
  createUIElementClass,
  element,
  ensureElementId,
  listen,
  property,
  query,
  watch,
} from '@timelessui/core'
import { transitionSourceFromEvent, type UITransitionDetail } from './events'
import { tabsActivations, tabsOrientations } from './values/tabs'
import type { TabsActivation, TabsOrientation } from './values/tabs'

export { tabsActivations, tabsOrientations, type TabsActivation, type TabsOrientation }

export type TabsElementLike = {
  id: string
  hidden: boolean | 'until-found'
  focus(): void
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  removeAttribute(name: string): void
  setAttribute(name: string, value: string): void
}

export type TabsEnhancementParts = {
  readonly host: TabsElementLike
  readonly list: TabsElementLike | null
  readonly tabs: readonly TabsElementLike[]
  readonly panels: readonly TabsElementLike[]
}

export type TabsEnhancementOptions = {
  readonly generatedIdPrefix: string
  readonly orientation?: TabsOrientation
  readonly value?: string | null
}

export type TabsEnhancementResult =
  | {
      readonly status: 'enhanced'
      readonly selectedIndex: number | null
      readonly value: string | null
      readonly tabIds: readonly string[]
      readonly panelIds: readonly string[]
    }
  | { readonly status: 'invalid'; readonly missing: readonly string[] }

export type TabsStateParts = {
  readonly tabs: readonly TabsElementLike[]
  readonly panels: readonly (TabsElementLike | undefined)[]
}

export type TabsChangeDetail = UITransitionDetail<string | null, 'activate'> & {
  readonly tab: HTMLElement
  readonly panel: HTMLElement | null
}

const TAB_LIST_SELECTOR = ':scope > [role="tablist"]'
const TAB_SELECTOR = '[role="tab"]'
const TAB_PANEL_SELECTOR = '[role="tabpanel"]'

export type UITabsElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & {
    activation: TabsActivation
    orientation: TabsOrientation
    value: string
  }
}

export function createTabsElementClass(targetWindow?: Window): UITabsElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-tabs')
  class UITabsElement extends UIElementBase {
    @attr accessor orientation: TabsOrientation = 'horizontal'
    @attr accessor activation: TabsActivation = 'automatic'
    @attr({ attribute: 'value' }) accessor defaultValue = ''
    @property accessor value = ''
    @query(TAB_LIST_SELECTOR) accessor list: HTMLElement | null = null

    #tabs: HTMLElement[] = []
    #panels: HTMLElement[] = []
    #reflectingSelection = false
    #syncingDefaultValue = false
    #valueDirty = false

    protected override connected(): void {
      this.observeParts(() => this.enhance())
    }

    protected override disconnected(): void {
      this.#tabs = []
      this.#panels = []
    }

    private enhance(): void {
      const list = this.list
      const tabs = list ? Array.from(list.querySelectorAll<HTMLElement>(TAB_SELECTOR)) : []
      const panels = directPanels(this, list)
      const instanceId = nextAvailableTabsInstanceId(this.ownerDocument)
      const result = enhanceTabsParts(
        {
          host: this,
          list,
          tabs,
          panels,
        },
        {
          generatedIdPrefix: instanceId,
          orientation: resolveTabsOrientation(this.orientation),
          value: this.value,
        },
      )

      if (result.status !== 'enhanced' || !list) {
        return
      }

      this.#tabs = tabs
      this.#panels = panels
      if (!this.#valueDirty && result.value !== null) {
        this.applyDefaultValue(this.defaultValue || result.value)
      }
    }

    @watch('orientation', { immediate: true })
    syncOrientation(): void {
      this.list?.setAttribute('aria-orientation', resolveTabsOrientation(this.orientation))
    }

    @watch('value')
    selectValue(value?: unknown): void {
      if (!this.#syncingDefaultValue) this.#valueDirty = true
      if (this.#reflectingSelection || !this.#tabs.length) return

      const index = this.#tabs.findIndex((tab) => tabValue(tab) === String(value ?? ''))
      if (index >= 0) {
        this.activate(index, false)
      }
    }

    @watch('defaultValue')
    syncDefaultValue(): void {
      if (!this.#valueDirty) this.applyDefaultValue(this.defaultValue)
    }

    reset(): void {
      this.#valueDirty = false
      this.applyDefaultValue(this.defaultValue)
    }

    @listen('click')
    handleClick(event: Event): void {
      const tab = closestOwnedElement(this, event.target, TAB_SELECTOR)
      if (!tab || !this.#tabs.includes(tab) || isDisabledTab(tab)) {
        return
      }

      this.activate(this.#tabs.indexOf(tab), false, event)
    }

    @listen('keydown')
    handleKeyDown(event: KeyboardEvent): void {
      const tab = closestOwnedElement(this, event.target, TAB_SELECTOR)
      if (!tab || !this.#tabs.includes(tab)) {
        return
      }

      const activation = resolveTabsActivation(this.activation)
      const orientation = resolveTabsOrientation(this.orientation)
      if (activation === 'manual' && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        this.activate(this.#tabs.indexOf(tab), false, event)
        return
      }

      const targetIndex = tabsNavigationTarget(
        this.#tabs,
        this.#tabs.indexOf(tab),
        event.key,
        orientation,
      )
      if (targetIndex === null) {
        return
      }

      event.preventDefault()

      if (activation === 'manual') {
        syncTabsFocusState(this.#tabs, targetIndex)
        this.#tabs[targetIndex]?.focus()
        return
      }

      this.activate(targetIndex, true, event)
    }

    private activate(index: number, focus: boolean, originalEvent: Event | null = null): void {
      if (index < 0 || index >= this.#tabs.length || isDisabledTab(this.#tabs[index]!)) {
        return
      }

      const pairs = pairTabsAndPanels(this.#tabs, this.#panels)
      const previousValue = selectedTabsValue(this.#tabs)
      const nextValue = tabValue(this.#tabs[index]!)
      const detail: TabsChangeDetail = {
        originalEvent,
        panel: (pairs[index] as HTMLElement | undefined) ?? null,
        previousValue,
        reason: 'activate',
        source: transitionSourceFromEvent(originalEvent),
        tab: this.#tabs[index]!,
        value: nextValue,
      }
      if (
        originalEvent &&
        previousValue !== nextValue &&
        !this.emit('ui-before-change', detail, { cancelable: true })
      ) {
        return
      }
      syncTabsState({ tabs: this.#tabs, panels: pairs }, index)

      this.#reflectingSelection = true
      try {
        this.value = nextValue ?? ''
      } finally {
        this.#reflectingSelection = false
      }

      if (focus) {
        this.#tabs[index]?.focus()
      }

      if (originalEvent && previousValue !== nextValue) {
        this.emit('ui-change', detail)
      }
    }

    private applyDefaultValue(value: string): void {
      this.#syncingDefaultValue = true
      try {
        this.value = value
      } finally {
        this.#syncingDefaultValue = false
      }
      const index = this.#tabs.findIndex((tab) => tabValue(tab) === value)
      if (index >= 0) this.activate(index, false)
    }
  }

  return UITabsElement as unknown as UITabsElementConstructor
}

export const UITabsElement = createTabsElementClass()
export type UITabsElement = InstanceType<typeof UITabsElement>

export function enhanceTabsParts(
  parts: TabsEnhancementParts,
  options: TabsEnhancementOptions,
): TabsEnhancementResult {
  const missing = invalidTabsParts(parts)

  if (missing.length > 0) {
    return { status: 'invalid', missing }
  }

  const list = parts.list!
  const orientation = options.orientation ?? 'horizontal'
  const panelPairs = pairTabsAndPanels(parts.tabs, parts.panels)
  const selectedIndex = initialSelectedIndex(parts.tabs, options.value)

  if (!list.hasAttribute('role')) {
    list.setAttribute('role', 'tablist')
  }
  list.setAttribute('aria-orientation', orientation)

  parts.tabs.forEach((tab, index) => {
    const panel = panelPairs[index]
    if (!panel) return

    if (!tab.hasAttribute('role')) {
      tab.setAttribute('role', 'tab')
    }
    ensureElementId(tab, `${options.generatedIdPrefix}-tab-${index + 1}`)

    if (!panel.hasAttribute('role')) {
      panel.setAttribute('role', 'tabpanel')
    }
    ensureElementId(panel, `${options.generatedIdPrefix}-panel-${index + 1}`)

    const controlledId = tab.getAttribute('aria-controls')
    const controlledPanel = controlledId
      ? parts.panels.find((candidate) => candidate.id === controlledId)
      : undefined
    if (!controlledId || controlledPanel !== panel) {
      tab.setAttribute('aria-controls', panel.id)
    }
    if (!panel.hasAttribute('aria-labelledby')) {
      panel.setAttribute('aria-labelledby', tab.id)
    }
    if (!panel.hasAttribute('tabindex')) {
      panel.setAttribute('tabindex', '0')
    }
  })

  syncTabsState({ tabs: parts.tabs, panels: panelPairs }, selectedIndex)

  const value = selectedIndex === null ? null : tabValue(parts.tabs[selectedIndex]!)

  return {
    status: 'enhanced',
    selectedIndex,
    value,
    tabIds: parts.tabs.map((tab) => tab.id),
    panelIds: panelPairs.map((panel) => panel?.id ?? ''),
  }
}

export function syncTabsState(parts: TabsStateParts, selectedIndex: number | null): void {
  parts.tabs.forEach((tab, index) => {
    const selected = index === selectedIndex
    tab.setAttribute('aria-selected', String(selected))
    tab.setAttribute('tabindex', selected ? '0' : '-1')
  })

  parts.panels.forEach((panel, index) => {
    if (!panel) return

    const selected = index === selectedIndex
    panel.hidden = !selected
  })
}

export function syncTabsFocusState(tabs: readonly TabsElementLike[], focusedIndex: number): void {
  tabs.forEach((tab, index) => {
    tab.setAttribute('tabindex', index === focusedIndex ? '0' : '-1')
  })
}

export function tabsNavigationTarget(
  tabs: readonly TabsElementLike[],
  currentIndex: number,
  key: string,
  orientation: TabsOrientation,
): number | null {
  if (key === 'Home') return firstEnabledTabIndex(tabs)
  if (key === 'End') return lastEnabledTabIndex(tabs)
  if (orientation === 'horizontal' && key === 'ArrowRight') {
    return adjacentEnabledTabIndex(tabs, currentIndex, 1)
  }
  if (orientation === 'horizontal' && key === 'ArrowLeft') {
    return adjacentEnabledTabIndex(tabs, currentIndex, -1)
  }
  if (orientation === 'vertical' && key === 'ArrowDown') {
    return adjacentEnabledTabIndex(tabs, currentIndex, 1)
  }
  if (orientation === 'vertical' && key === 'ArrowUp') {
    return adjacentEnabledTabIndex(tabs, currentIndex, -1)
  }
  return null
}

export function resolveTabsOrientation(value: string | null): TabsOrientation {
  return value === 'vertical' ? 'vertical' : 'horizontal'
}

export function resolveTabsActivation(value: string | null): TabsActivation {
  return value === 'manual' ? 'manual' : 'automatic'
}

function pairTabsAndPanels(
  tabs: readonly TabsElementLike[],
  panels: readonly TabsElementLike[],
): Array<TabsElementLike | undefined> {
  const panelsById = new Map<string, TabsElementLike>()
  for (const panel of panels) {
    if (panel.id) {
      panelsById.set(panel.id, panel)
    }
  }

  const pairs: Array<TabsElementLike | undefined> = []
  const usedPanels = new Set<TabsElementLike>()

  tabs.forEach((tab, index) => {
    const controlledId = tab.getAttribute('aria-controls')
    const controlledPanel = controlledId ? panelsById.get(controlledId) : undefined
    if (controlledPanel) {
      pairs[index] = controlledPanel
      usedPanels.add(controlledPanel)
    }
  })

  tabs.forEach((_tab, index) => {
    if (pairs[index]) return

    const indexedPanel = panels[index]
    if (indexedPanel && !usedPanels.has(indexedPanel)) {
      pairs[index] = indexedPanel
      usedPanels.add(indexedPanel)
      return
    }

    const fallbackPanel = panels.find((panel) => !usedPanels.has(panel))
    pairs[index] = fallbackPanel
    if (fallbackPanel) {
      usedPanels.add(fallbackPanel)
    }
  })

  return pairs
}

function initialSelectedIndex(
  tabs: readonly TabsElementLike[],
  value: string | null | undefined,
): number | null {
  if (value) {
    const valuedIndex = tabs.findIndex((tab) => tabValue(tab) === value && !isDisabledTab(tab))
    if (valuedIndex >= 0) return valuedIndex
  }

  const selected = tabs.findIndex(
    (tab) => tab.getAttribute('aria-selected') === 'true' && !isDisabledTab(tab),
  )
  if (selected >= 0) return selected
  return firstEnabledTabIndex(tabs)
}

function selectedTabsValue(tabs: readonly TabsElementLike[]): string | null {
  const selected = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')
  return selected ? tabValue(selected) : null
}

function tabValue(tab: TabsElementLike): string | null {
  return tab.getAttribute('value') ?? tab.getAttribute('data-ui-value') ?? tab.id ?? null
}

function firstEnabledTabIndex(tabs: readonly TabsElementLike[]): number | null {
  const index = tabs.findIndex((tab) => !isDisabledTab(tab))
  return index >= 0 ? index : null
}

function lastEnabledTabIndex(tabs: readonly TabsElementLike[]): number | null {
  for (let index = tabs.length - 1; index >= 0; index -= 1) {
    if (!isDisabledTab(tabs[index]!)) {
      return index
    }
  }
  return null
}

function adjacentEnabledTabIndex(
  tabs: readonly TabsElementLike[],
  currentIndex: number,
  direction: 1 | -1,
): number | null {
  if (tabs.length === 0 || firstEnabledTabIndex(tabs) === null) {
    return null
  }

  let index = currentIndex
  for (let offset = 0; offset < tabs.length; offset += 1) {
    index = (index + direction + tabs.length) % tabs.length
    if (!isDisabledTab(tabs[index]!)) {
      return index
    }
  }

  return null
}

function invalidTabsParts(parts: TabsEnhancementParts): readonly string[] {
  const missing: string[] = []
  if (!parts.list) missing.push('list')
  if (parts.tabs.length === 0) missing.push('tabs')
  if (parts.panels.length === 0 || parts.panels.length < parts.tabs.length) {
    missing.push('panels')
  }
  return missing
}

function isDisabledTab(tab: TabsElementLike): boolean {
  return tab.hasAttribute('disabled') || tab.getAttribute('aria-disabled') === 'true'
}

function directPanels(host: Element, list: Element | null): HTMLElement[] {
  return Array.from(host.children).filter(
    (child): child is HTMLElement => child !== list && child.matches(TAB_PANEL_SELECTOR),
  )
}

function closestOwnedElement(
  host: Element,
  target: EventTarget | null,
  selector: string,
): HTMLElement | null {
  const ElementConstructor = host.ownerDocument.defaultView?.Element
  const element = ElementConstructor && target instanceof ElementConstructor ? target : null
  const match = element?.closest<HTMLElement>(selector) ?? null
  return match && host.contains(match) ? match : null
}

function nextAvailableTabsInstanceId(ownerDocument: Document): string {
  let id: string
  do {
    id = createId('ui-tabs', ownerDocument)
  } while (
    ownerDocument.getElementById(`${id}-tab-1`) ||
    ownerDocument.getElementById(`${id}-panel-1`)
  )
  return id
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-tabs': UITabsElement
  }
}
