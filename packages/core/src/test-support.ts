import { beforeAll, vi } from 'vitest'

type CoreModule = typeof import('./index')
type Accessor = {
  get(this: any): unknown
  set(this: any, value: any): void
}

export type DecoratorMetadataStore = Record<PropertyKey, unknown>

class TestWindow extends EventTarget {}

class TestDocument extends EventTarget {
  readonly defaultView = new TestWindow() as Window & EventTarget
}

export class TestHTMLElement extends EventTarget {
  readonly ownerDocument = new TestDocument() as Document & EventTarget
  readonly attributes = new Map<string, string>()
  readonly selectors = new Map<string, unknown[]>()
  readonly containedNodes = new Set<unknown>()

  attributeChangedCallback?(name: string, oldValue: string | null, newValue: string | null): void

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name)
  }

  setAttribute(name: string, value: string): void {
    const oldValue = this.getAttribute(name)
    this.attributes.set(name, value)
    this.attributeChangedCallback?.(name, oldValue, value)
  }

  removeAttribute(name: string): void {
    const oldValue = this.getAttribute(name)
    this.attributes.delete(name)
    this.attributeChangedCallback?.(name, oldValue, null)
  }

  querySelector<TElement = unknown>(selector: string): TElement | null {
    return (this.selectors.get(selector)?.[0] as TElement | undefined) ?? null
  }

  querySelectorAll<TElement = unknown>(selector: string): TElement[] {
    return (this.selectors.get(selector) as TElement[] | undefined) ?? []
  }

  contains(node: unknown): boolean {
    if (!node) return false
    if (node === this) return true
    if (this.containedNodes.has(node)) return true

    for (const nodes of this.selectors.values()) {
      if (nodes.includes(node)) return true
    }

    return false
  }
}

export function installCoreTestGlobals(): void {
  beforeAll(() => {
    vi.stubGlobal('HTMLElement', TestHTMLElement)

    const css = (globalThis as typeof globalThis & { CSS?: { escape?: (value: string) => string } })
      .CSS
    if (!css?.escape) {
      vi.stubGlobal('CSS', {
        escape(value: string) {
          return value.replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`)
        },
      })
    }

    if (typeof CustomEvent === 'undefined') {
      vi.stubGlobal(
        'CustomEvent',
        class TestCustomEvent<TDetail> extends Event {
          readonly detail: TDetail

          constructor(type: string, init: CustomEventInit<TDetail> = {}) {
            super(type, init)
            this.detail = init.detail as TDetail
          }
        },
      )
    }
  })
}

export function attachMetadata(constructor: Function): DecoratorMetadataStore {
  const metadata: DecoratorMetadataStore = {}
  Object.defineProperty(constructor, Symbol.metadata, {
    configurable: true,
    value: metadata,
  })
  return metadata
}

export function createRegistryWindow(): {
  registry: Map<string, CustomElementConstructor>
  targetWindow: Window
} {
  const registry = new Map<string, CustomElementConstructor>()
  const targetWindow = {
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

export function applyElementDecorator(
  core: Pick<CoreModule, 'element'>,
  constructor: Function,
  name: string,
  metadata = attachMetadata(constructor),
): DecoratorMetadataStore {
  core.element(name)(
    constructor as abstract new () => HTMLElement,
    {
      kind: 'class',
      name: constructor.name,
      metadata,
      addInitializer() {},
    } as ClassDecoratorContext<abstract new () => HTMLElement>,
  )
  return metadata
}

export function applyAccessorDecorator(
  decorator: Function,
  constructor: Function,
  metadata: DecoratorMetadataStore,
  name: string,
  accessor: Accessor = {
    get() {
      return undefined
    },
    set() {},
  },
): void {
  const result = decorator(accessor, accessorContext(name, metadata)) as
    | ClassAccessorDecoratorResult<any, any>
    | undefined

  if (!result) return

  Object.defineProperty(constructor.prototype, name, {
    configurable: true,
    get() {
      return result.get ? result.get.call(this) : accessor.get.call(this)
    },
    set(value) {
      if (result.set) {
        result.set.call(this, value)
      } else {
        accessor.set.call(this, value)
      }
    },
  })
}

export function applyMethodDecorator(
  decorator: Function,
  constructor: Function,
  metadata: DecoratorMetadataStore,
  name: string,
): void {
  decorator(constructor.prototype[name], methodContext(name, metadata))
}

export function eventWithTarget(target: unknown): Event {
  const event = new Event('test')
  Object.defineProperty(event, 'target', {
    configurable: true,
    value: target,
  })
  return event
}

function accessorContext(
  name: string,
  metadata: DecoratorMetadataStore,
): ClassAccessorDecoratorContext<any, any> {
  return {
    access: {
      get() {
        return undefined
      },
      has() {
        return true
      },
      set() {},
    },
    addInitializer() {},
    kind: 'accessor',
    metadata,
    name,
    private: false,
    static: false,
  }
}

function methodContext(
  name: string,
  metadata: DecoratorMetadataStore,
): ClassMethodDecoratorContext<any, any> {
  return {
    access: {
      get() {
        return undefined
      },
      has() {
        return true
      },
    },
    addInitializer() {},
    kind: 'method',
    metadata,
    name,
    private: false,
    static: false,
  }
}
