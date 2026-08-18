import { defineElementMetadata } from './metadata'

export type UIElementConstructor<TElement extends HTMLElement = HTMLElement> =
  CustomElementConstructor & {
    elementName?: string
    prototype: TElement
  }

export function element(name: string) {
  return function decorateElement<
    TConstructor extends abstract new (...args: never[]) => HTMLElement,
  >(constructor: TConstructor, context: ClassDecoratorContext<TConstructor>): TConstructor {
    const metadata = defineElementMetadata(context.metadata)
    metadata.elementName = name

    Object.defineProperty(constructor, 'elementName', {
      configurable: true,
      enumerable: false,
      value: name,
      writable: false,
    })

    return constructor
  }
}

export function defineElement<TElement extends HTMLElement>(
  constructor: UIElementConstructor<TElement>,
  options: {
    readonly name?: string
    readonly targetWindow?: Window
  } = {},
): UIElementConstructor<TElement> {
  const targetWindow = options.targetWindow ?? window
  const name = options.name ?? constructor.elementName

  if (!name) {
    throw new Error('Missing custom element name.')
  }

  const existing = targetWindow.customElements.get(name)
  if (!existing) {
    targetWindow.customElements.define(name, constructor)
    return constructor
  }

  if (existing !== constructor) {
    throw new Error(`Custom element "${name}" is already defined with a different constructor.`)
  }

  return constructor
}
