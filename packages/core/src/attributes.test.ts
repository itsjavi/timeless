import { describe, expect, it } from 'vitest'
import {
  applyAccessorDecorator,
  applyElementDecorator,
  attachMetadata,
  installCoreTestGlobals,
} from './test-support'

installCoreTestGlobals()

describe('attribute decorators', () => {
  it('observes kebab-case and custom attribute names', async () => {
    const core = await import('./index')

    class OptionsElement extends core.UIElement {
      declare buttonLabel: string
      declare delay: number

      buttonLabelValue = ''
      delayValue = 0
    }

    const metadata = attachMetadata(OptionsElement)
    applyElementDecorator(core, OptionsElement, 'ui-options', metadata)
    applyAccessorDecorator(core.attr, OptionsElement, metadata, 'buttonLabel', {
      get() {
        return this.buttonLabelValue
      },
      set(value) {
        this.buttonLabelValue = value
      },
    })
    applyAccessorDecorator(
      core.numberAttr({ attribute: 'delay-ms' }),
      OptionsElement,
      metadata,
      'delay',
      {
        get() {
          return this.delayValue
        },
        set(value) {
          this.delayValue = value
        },
      },
    )

    expect([...OptionsElement.observedAttributes].sort()).toEqual(['button-label', 'delay-ms'])
  })

  it('reflects string, boolean, and number properties to attributes', async () => {
    const core = await import('./index')

    class OptionsElement extends core.UIElement {
      declare label: string
      declare open: boolean
      declare delay: number

      labelValue = ''
      openValue = false
      delayValue = 0
    }

    const metadata = attachMetadata(OptionsElement)
    applyElementDecorator(core, OptionsElement, 'ui-options', metadata)
    applyAccessorDecorator(core.attr, OptionsElement, metadata, 'label', {
      get() {
        return this.labelValue
      },
      set(value) {
        this.labelValue = value
      },
    })
    applyAccessorDecorator(core.boolAttr, OptionsElement, metadata, 'open', {
      get() {
        return this.openValue
      },
      set(value) {
        this.openValue = value
      },
    })
    applyAccessorDecorator(core.numberAttr, OptionsElement, metadata, 'delay', {
      get() {
        return this.delayValue
      },
      set(value) {
        this.delayValue = value
      },
    })

    const element = new OptionsElement()

    element.label = 'Save'
    element.open = true
    element.delay = 120

    expect(element.getAttribute('label')).toBe('Save')
    expect(element.hasAttribute('open')).toBe(true)
    expect(element.getAttribute('delay')).toBe('120')

    element.label = ''
    element.open = false
    ;(element as unknown as { delay: unknown }).delay = 'invalid'

    expect(element.hasAttribute('label')).toBe(false)
    expect(element.hasAttribute('open')).toBe(false)
    expect(element.delay).toBe(0)
    expect(element.getAttribute('delay')).toBe('0')
  })

  it('syncs attribute changes back to coerced properties', async () => {
    const core = await import('./index')

    class OptionsElement extends core.UIElement {
      declare label: string
      declare open: boolean
      declare delay: number

      labelValue = ''
      openValue = false
      delayValue = 0
    }

    const metadata = attachMetadata(OptionsElement)
    applyElementDecorator(core, OptionsElement, 'ui-options', metadata)
    applyAccessorDecorator(core.attr, OptionsElement, metadata, 'label', {
      get() {
        return this.labelValue
      },
      set(value) {
        this.labelValue = value
      },
    })
    applyAccessorDecorator(core.boolAttr, OptionsElement, metadata, 'open', {
      get() {
        return this.openValue
      },
      set(value) {
        this.openValue = value
      },
    })
    applyAccessorDecorator(core.numberAttr, OptionsElement, metadata, 'delay', {
      get() {
        return this.delayValue
      },
      set(value) {
        this.delayValue = value
      },
    })

    const element = new OptionsElement()

    element.setAttribute('label', 'Publish')
    element.setAttribute('open', '')
    element.setAttribute('delay', '240')

    expect(element.label).toBe('Publish')
    expect(element.open).toBe(true)
    expect(element.delay).toBe(240)

    element.removeAttribute('open')
    element.setAttribute('delay', 'invalid')

    expect(element.open).toBe(false)
    expect(element.delay).toBe(0)
    expect(element.getAttribute('delay')).toBe('invalid')
  })
})
