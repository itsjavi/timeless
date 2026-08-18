import { describe, expect, it } from 'vitest'
import {
  enhanceTabsParts,
  resolveTabsActivation,
  resolveTabsOrientation,
  tabsNavigationTarget,
  type TabsElementLike,
} from './tabs'

class FakeTabsElement implements TabsElementLike {
  id = ''
  hidden: boolean | 'until-found' = false
  focused = false
  readonly attributes = new Map<string, string>()

  constructor(attributes: Record<string, string> = {}) {
    for (const [name, value] of Object.entries(attributes)) {
      this.setAttribute(name, value)
    }
  }

  focus(): void {
    this.focused = true
  }

  getAttribute(name: string): string | null {
    if (name === 'id') return this.id || null
    return this.attributes.get(name) ?? null
  }

  hasAttribute(name: string): boolean {
    if (name === 'id') return this.id.length > 0
    return this.attributes.has(name)
  }

  removeAttribute(name: string): void {
    if (name === 'id') {
      this.id = ''
      return
    }
    this.attributes.delete(name)
  }

  setAttribute(name: string, value: string): void {
    if (name === 'id') {
      this.id = value
    }
    this.attributes.set(name, value)
  }
}

describe('enhanceTabsParts', () => {
  it('generates ids, ARIA links, selected state, and hidden panel state', () => {
    const host = new FakeTabsElement()
    const list = new FakeTabsElement()
    const tabs = [new FakeTabsElement(), new FakeTabsElement()]
    const panels = [new FakeTabsElement(), new FakeTabsElement()]

    const result = enhanceTabsParts(
      { host, list, tabs, panels },
      { generatedIdPrefix: 'ui-tabs-1', orientation: 'horizontal' },
    )

    expect(result).toEqual({
      status: 'enhanced',
      selectedIndex: 0,
      value: 'ui-tabs-1-tab-1',
      tabIds: ['ui-tabs-1-tab-1', 'ui-tabs-1-tab-2'],
      panelIds: ['ui-tabs-1-panel-1', 'ui-tabs-1-panel-2'],
    })
    expect(host.getAttribute('value')).toBeNull()
    expect(list.getAttribute('role')).toBe('tablist')
    expect(list.getAttribute('aria-orientation')).toBe('horizontal')
    expect(tabs[0]!.getAttribute('role')).toBe('tab')
    expect(tabs[0]!.getAttribute('aria-controls')).toBe('ui-tabs-1-panel-1')
    expect(tabs[0]!.getAttribute('aria-selected')).toBe('true')
    expect(tabs[0]!.getAttribute('tabindex')).toBe('0')
    expect(tabs[0]!.getAttribute('data-ui-state')).toBeNull()
    expect(tabs[1]!.getAttribute('aria-selected')).toBe('false')
    expect(tabs[1]!.getAttribute('tabindex')).toBe('-1')
    expect(panels[0]!.getAttribute('role')).toBe('tabpanel')
    expect(panels[0]!.getAttribute('aria-labelledby')).toBe('ui-tabs-1-tab-1')
    expect(panels[0]!.hidden).toBe(false)
    expect(panels[1]!.hidden).toBe(true)
  })

  it('preserves authored ids, aria-controls links, and value selection', () => {
    const host = new FakeTabsElement()
    const list = new FakeTabsElement({ role: 'tablist', 'aria-label': 'Product sections' })
    const controlledPanel = new FakeTabsElement()
    controlledPanel.id = 'author-panel'
    const tabs = [
      new FakeTabsElement({ 'aria-controls': 'author-panel', 'data-ui-value': 'overview' }),
      new FakeTabsElement({ 'data-ui-value': 'details' }),
    ]
    tabs[0]!.id = 'author-tab'
    const panels = [new FakeTabsElement(), controlledPanel]

    enhanceTabsParts(
      { host, list, tabs, panels },
      { generatedIdPrefix: 'ui-tabs-2', orientation: 'vertical', value: 'details' },
    )

    expect(list.getAttribute('aria-label')).toBe('Product sections')
    expect(list.getAttribute('aria-orientation')).toBe('vertical')
    expect(tabs[0]!.id).toBe('author-tab')
    expect(tabs[0]!.getAttribute('aria-controls')).toBe('author-panel')
    expect(controlledPanel.id).toBe('author-panel')
    expect(controlledPanel.getAttribute('aria-labelledby')).toBe('author-tab')
    expect(controlledPanel.hidden).toBe(true)
    expect(panels[0]!.hidden).toBe(false)
    expect(host.getAttribute('value')).toBeNull()
  })

  it('reports invalid anatomy instead of partially enhancing', () => {
    const host = new FakeTabsElement()

    const result = enhanceTabsParts(
      { host, list: null, tabs: [], panels: [] },
      { generatedIdPrefix: 'ui-tabs-3' },
    )

    expect(result).toEqual({ status: 'invalid', missing: ['list', 'tabs', 'panels'] })
    expect(host.getAttribute('data-ui-invalid')).toBeNull()
  })
})

describe('tabsNavigationTarget', () => {
  it('skips disabled tabs and wraps horizontal navigation', () => {
    const tabs = [
      new FakeTabsElement(),
      new FakeTabsElement({ disabled: '' }),
      new FakeTabsElement(),
    ]

    expect(tabsNavigationTarget(tabs, 0, 'ArrowRight', 'horizontal')).toBe(2)
    expect(tabsNavigationTarget(tabs, 0, 'ArrowLeft', 'horizontal')).toBe(2)
    expect(tabsNavigationTarget(tabs, 2, 'Home', 'horizontal')).toBe(0)
    expect(tabsNavigationTarget(tabs, 0, 'End', 'horizontal')).toBe(2)
  })

  it('uses vertical arrow keys only for vertical tablists', () => {
    const tabs = [new FakeTabsElement(), new FakeTabsElement(), new FakeTabsElement()]

    expect(tabsNavigationTarget(tabs, 0, 'ArrowDown', 'vertical')).toBe(1)
    expect(tabsNavigationTarget(tabs, 0, 'ArrowUp', 'vertical')).toBe(2)
    expect(tabsNavigationTarget(tabs, 0, 'ArrowDown', 'horizontal')).toBeNull()
  })
})

describe('tabs option resolvers', () => {
  it('falls back to progressive defaults', () => {
    expect(resolveTabsOrientation('vertical')).toBe('vertical')
    expect(resolveTabsOrientation('inline')).toBe('horizontal')
    expect(resolveTabsActivation('manual')).toBe('manual')
    expect(resolveTabsActivation('lazy')).toBe('automatic')
  })
})
