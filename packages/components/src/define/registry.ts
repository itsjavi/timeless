import { defineElement, type UIElementConstructor } from '@timelessui/core'

type ElementFactory = (targetWindow?: Window) => CustomElementConstructor & {
  readonly elementName?: string
}

const constructorsByWindow = new WeakMap<Window, Map<string, CustomElementConstructor>>()

export function defineRegisteredElement(
  name: string,
  factory: ElementFactory,
  targetWindow: Window,
): CustomElementConstructor {
  let constructors = constructorsByWindow.get(targetWindow)
  if (!constructors) {
    constructors = new Map()
    constructorsByWindow.set(targetWindow, constructors)
  }

  const expected = constructors.get(name) ?? factory(targetWindow)
  constructors.set(name, expected)
  const existing = targetWindow.customElements.get(name)
  if (existing && existing !== expected) {
    throw new Error(
      `Custom element "${name}" is already defined with ${existing.name || 'an anonymous constructor'} instead of ${expected.name || 'the Timeless constructor'}.`,
    )
  }
  return defineElement(expected as UIElementConstructor, { name, targetWindow })
}
