import { describe, expect, it } from 'vitest'
import { defineTabsElement, defineTimelessElements } from './define'

class RealmHTMLElement {}

describe('define entrypoint', () => {
  it('creates custom element constructors in the requested window realm', () => {
    const { registry, targetWindow } = createRealmWindow()

    const constructor = defineTabsElement(targetWindow) as CustomElementConstructor & {
      readonly observedAttributes: readonly string[]
    }
    const repeatedConstructor = defineTabsElement(targetWindow)

    expect(RealmHTMLElement.prototype.isPrototypeOf(constructor.prototype)).toBe(true)
    expect(constructor.observedAttributes).toEqual(['orientation', 'activation', 'value'])
    expect(repeatedConstructor).toBe(constructor)
    expect(registry.get('ui-tabs')).toBe(constructor)
  })

  it('registers all progressive elements without using the module global HTMLElement', () => {
    const { registry, targetWindow } = createRealmWindow()

    defineTimelessElements(targetWindow)

    expect([...registry.keys()]).toEqual([
      'ui-tabs',
      'ui-dialog',
      'ui-sheet',
      'ui-popover',
      'ui-hover-card',
      'ui-menu',
      'ui-menu-button',
      'ui-context-menu',
      'ui-toolbar',
      'ui-radio-group',
      'ui-checkbox-group',
      'ui-listbox',
      'ui-select',
      'ui-combobox',
      'ui-toaster',
      'ui-toast',
      'ui-toggle-group',
      'ui-number-stepper',
      'ui-color-picker',
      'ui-form',
      'ui-range-field',
      'ui-otp-field',
    ])
    for (const constructor of registry.values()) {
      expect(RealmHTMLElement.prototype.isPrototypeOf(constructor.prototype)).toBe(true)
    }
  })

  it('fails clearly when another constructor already owns the tag name', () => {
    const { registry, targetWindow } = createRealmWindow()
    class ConflictingElement extends RealmHTMLElement {}
    registry.set('ui-tabs', ConflictingElement as unknown as CustomElementConstructor)

    expect(() => defineTabsElement(targetWindow)).toThrow(
      /ui-tabs.*ConflictingElement.*UITabsElement/,
    )
  })
})

function createRealmWindow(): {
  readonly registry: Map<string, CustomElementConstructor>
  readonly targetWindow: Window
} {
  const registry = new Map<string, CustomElementConstructor>()
  const targetWindow = {
    HTMLElement: RealmHTMLElement,
    customElements: {
      define(name: string, constructor: CustomElementConstructor) {
        registry.set(name, constructor)
      },
      get(name: string) {
        return registry.get(name)
      },
    },
  } as unknown as Window

  return { registry, targetWindow }
}
