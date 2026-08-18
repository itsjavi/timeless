import { describe, expect, it } from 'vitest'
import { applyElementDecorator, createRegistryWindow, installCoreTestGlobals } from './test-support'

installCoreTestGlobals()

describe('defineElement', () => {
  it('registers a decorated element once in the requested window', async () => {
    const { defineElement, element, UIElement } = await import('./index')

    class SampleElement extends UIElement {}

    applyElementDecorator({ element }, SampleElement, 'ui-sample')

    const { registry, targetWindow } = createRegistryWindow()

    defineElement(SampleElement, { targetWindow })
    defineElement(SampleElement, { targetWindow })

    expect(registry.get('ui-sample')).toBe(SampleElement)
    expect(registry.size).toBe(1)
  })

  it('accepts an explicit name without decorator metadata', async () => {
    const { defineElement, UIElement } = await import('./index')

    class PlainElement extends UIElement {}

    const { registry, targetWindow } = createRegistryWindow()

    defineElement(PlainElement, { name: 'ui-plain', targetWindow })

    expect(registry.get('ui-plain')).toBe(PlainElement)
  })

  it('rejects missing names and conflicting registrations', async () => {
    const { defineElement, UIElement } = await import('./index')

    class FirstElement extends UIElement {}
    class SecondElement extends UIElement {}

    const { targetWindow } = createRegistryWindow()

    expect(() => defineElement(FirstElement, { targetWindow })).toThrow(/Missing custom element/)

    defineElement(FirstElement, { name: 'ui-conflict', targetWindow })

    expect(() => defineElement(SecondElement, { name: 'ui-conflict', targetWindow })).toThrow(
      /different constructor/,
    )
  })
})
