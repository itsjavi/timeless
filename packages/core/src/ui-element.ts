import {
  readElementMetadata,
  type AttributeDefinition,
  type ListenerDefinition,
  type MetadataConstructor,
} from './metadata'

type ListenerTarget = Window | Document | HTMLElement
type PartsEnhancer = (signal: AbortSignal) => void

type PartsObservation = {
  abortController?: AbortController
  observer: MutationObserver
  queued: boolean
}

type BaseHTMLElementConstructor = typeof HTMLElement

const FallbackHTMLElement = class {} as BaseHTMLElementConstructor

export interface UIElementDecoratorHost extends HTMLElement {
  querySelectorAllArray<TElement extends Element = HTMLElement>(selector: string): TElement[]
  reflectDecoratedAttribute(definition: AttributeDefinition, value: unknown): void
  notifyDecoratedWatchers(property: string, value: unknown, oldValue: unknown): void
}

export declare abstract class UIElementHost extends HTMLElement implements UIElementDecoratorHost {
  connectedCallback(): void
  disconnectedCallback(): void
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void
  protected connected(): void
  protected disconnected(): void
  protected get signal(): AbortSignal
  protected observeParts(enhance: PartsEnhancer): void
  protected setCustomState(name: `--${string}`, active: boolean): void
  protected hasCustomState(name: `--${string}`): boolean
  protected get internals(): ElementInternals | undefined
  protected on(
    target: ListenerTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions,
  ): void
  protected on(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions,
  ): void
  protected emit<TDetail>(
    type: string,
    detail: TDetail,
    options?: Omit<CustomEventInit<TDetail>, 'detail'>,
  ): boolean
  protected $<TElement extends Element = HTMLElement>(selector: string): TElement | null
  protected $all<TElement extends Element = HTMLElement>(selector: string): TElement[]
  protected closestTarget<TElement extends Element>(event: Event, selector: string): TElement | null
  protected getControlledElement(controller: Element): HTMLElement | null
  querySelectorAllArray<TElement extends Element = HTMLElement>(selector: string): TElement[]
  reflectDecoratedAttribute(definition: AttributeDefinition, value: unknown): void
  notifyDecoratedWatchers(property: string, value: unknown, oldValue: unknown): void
}

export type UIElementClass = (abstract new () => UIElementHost) & {
  readonly observedAttributes: readonly string[]
}

export function createUIElementClass(targetWindow?: Window): UIElementClass {
  const BaseHTMLElement =
    (targetWindow as (Window & typeof globalThis) | undefined)?.HTMLElement ??
    (typeof HTMLElement === 'undefined' ? FallbackHTMLElement : HTMLElement)

  abstract class RealmUIElement extends BaseHTMLElement implements UIElementDecoratorHost {
    #abortController?: AbortController
    #customStates = new Set<`--${string}`>()
    #internals?: ElementInternals
    #partsObservations: PartsObservation[] = []
    #reflectingAttribute = false
    #updatingFromAttribute = false

    static get observedAttributes(): string[] {
      return readElementMetadata(this as MetadataConstructor).attributes.map(
        (definition) => definition.attribute,
      )
    }

    connectedCallback(): void {
      this.#abortController = this.createAbortController()
      this.replayDecoratedProperties()
      this.connected()
      this.attachDecoratedListeners()
      this.runImmediateDecoratedWatchers()
    }

    disconnectedCallback(): void {
      this.#abortController?.abort()
      this.#abortController = undefined
      for (const observation of this.#partsObservations) {
        observation.observer.disconnect()
        observation.abortController?.abort()
      }
      this.#partsObservations = []
      this.disconnected()
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
      if (oldValue === newValue || this.#reflectingAttribute) return

      const definition = this.attributeDefinitionFor(name)
      if (!definition) return

      const next = coerceAttributeValue(definition, newValue)

      this.#updatingFromAttribute = true
      try {
        ;(this as unknown as Record<string, unknown>)[definition.property] = next
      } finally {
        this.#updatingFromAttribute = false
      }
    }

    protected connected(): void {}

    protected disconnected(): void {}

    protected get signal(): AbortSignal {
      if (!this.#abortController) {
        this.#abortController = this.createAbortController()
      }
      return this.#abortController.signal
    }

    protected observeParts(enhance: PartsEnhancer): void {
      const ownerWindow = this.ownerDocument.defaultView as (Window & typeof globalThis) | null
      const configuredWindow = targetWindow as (Window & typeof globalThis) | undefined
      const Observer = ownerWindow?.MutationObserver ?? configuredWindow?.MutationObserver
      if (!Observer) {
        this.runPartsEnhancer({}, enhance)
        return
      }

      const observation: PartsObservation = {
        observer: undefined as unknown as MutationObserver,
        queued: false,
      }
      observation.observer = new Observer((records) => {
        if (!records.some(hasElementPartMutation)) return
        if (observation.queued) return
        observation.queued = true
        const enqueue =
          ownerWindow?.queueMicrotask ?? configuredWindow?.queueMicrotask ?? queueMicrotask
        enqueue(() => {
          observation.queued = false
          if (!this.isConnected) return
          this.runPartsEnhancer(observation, enhance)
        })
      })
      this.#partsObservations.push(observation)
      observation.observer.observe(this, { childList: true, subtree: true })
      this.runPartsEnhancer(observation, enhance)
    }

    protected setCustomState(name: `--${string}`, active: boolean): void {
      const states = this.elementInternals()?.states
      if (active) {
        states?.add(name)
        this.#customStates.add(name)
      } else {
        states?.delete(name)
        this.#customStates.delete(name)
      }
    }

    protected hasCustomState(name: `--${string}`): boolean {
      return this.elementInternals()?.states?.has(name) ?? this.#customStates.has(name)
    }

    /**
     * The element's `ElementInternals`, attached on first use.
     *
     * Undefined where `attachInternals` is unavailable or already claimed, which is why every call
     * site treats form participation as an enhancement rather than a guarantee. A form-associated
     * element must also declare `static formAssociated = true` on its own class; internals alone do
     * not make the browser submit anything.
     */
    protected get internals(): ElementInternals | undefined {
      return this.elementInternals()
    }

    protected on(
      target: ListenerTarget,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions,
    ): void
    protected on(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions,
    ): void
    protected on(
      first: ListenerTarget | string,
      second: string | EventListenerOrEventListenerObject,
      third?: EventListenerOrEventListenerObject | AddEventListenerOptions,
      fourth?: AddEventListenerOptions,
    ): void {
      const target = typeof first === 'string' ? this : first
      const type = typeof first === 'string' ? first : (second as string)
      const listener =
        typeof first === 'string'
          ? (second as EventListenerOrEventListenerObject)
          : (third as EventListenerOrEventListenerObject)
      const options = typeof first === 'string' ? (third as AddEventListenerOptions) : fourth

      target.addEventListener(type, listener, {
        ...options,
        signal: options?.signal ?? this.signal,
      })
    }

    protected emit<TDetail>(
      type: string,
      detail: TDetail,
      options: Omit<CustomEventInit<TDetail>, 'detail'> = {},
    ): boolean {
      const ownerWindow = this.ownerDocument.defaultView as (Window & typeof globalThis) | null
      const configuredWindow = targetWindow as (Window & typeof globalThis) | undefined
      const CustomEventConstructor =
        ownerWindow?.CustomEvent ?? configuredWindow?.CustomEvent ?? CustomEvent
      return this.dispatchEvent(
        new CustomEventConstructor<TDetail>(type, {
          bubbles: true,
          composed: true,
          cancelable: false,
          ...options,
          detail,
        }),
      )
    }

    protected $<TElement extends Element = HTMLElement>(selector: string): TElement | null {
      return this.querySelector<TElement>(selector)
    }

    protected $all<TElement extends Element = HTMLElement>(selector: string): TElement[] {
      return this.querySelectorAllArray<TElement>(selector)
    }

    protected closestTarget<TElement extends Element>(
      event: Event,
      selector: string,
    ): TElement | null {
      const target = event.target
      if (!target || typeof target !== 'object') return null

      const node = target as Element
      if (typeof node.closest !== 'function') return null

      const match = node.closest<TElement>(selector)
      return match && this.contains(match) ? match : null
    }

    protected getControlledElement(controller: Element): HTMLElement | null {
      const id = controller.getAttribute('aria-controls')
      if (!id) return null
      return this.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
    }

    querySelectorAllArray<TElement extends Element = HTMLElement>(selector: string): TElement[] {
      return Array.from(this.querySelectorAll<TElement>(selector))
    }

    reflectDecoratedAttribute(definition: AttributeDefinition, value: unknown): void {
      if (this.#updatingFromAttribute) return

      this.#reflectingAttribute = true
      try {
        if (definition.kind === 'boolean') {
          if (value) {
            this.setAttribute(definition.attribute, '')
          } else {
            this.removeAttribute(definition.attribute)
          }
          return
        }

        if (value == null || value === '') {
          this.removeAttribute(definition.attribute)
        } else {
          this.setAttribute(definition.attribute, String(value))
        }
      } finally {
        this.#reflectingAttribute = false
      }
    }

    notifyDecoratedWatchers(property: string, value: unknown, oldValue: unknown): void {
      for (const watcher of readElementMetadata(this.constructor as MetadataConstructor).watchers) {
        if (!watcher.properties.includes(property)) continue
        const method = (this as unknown as Record<string, unknown>)[watcher.method]
        if (typeof method === 'function') {
          method.call(this, value, oldValue)
        }
      }
    }

    private runImmediateDecoratedWatchers(): void {
      for (const watcher of readElementMetadata(this.constructor as MetadataConstructor).watchers) {
        if (!watcher.immediate) continue
        const method = (this as unknown as Record<string, unknown>)[watcher.method]
        if (typeof method !== 'function') continue
        method.call(this)
      }
    }

    private elementInternals(): ElementInternals | undefined {
      if (this.#internals) return this.#internals
      if (typeof this.attachInternals !== 'function') return undefined

      try {
        this.#internals = this.attachInternals()
        for (const state of this.#customStates) this.#internals.states?.add(state)
      } catch {
        return undefined
      }
      return this.#internals
    }

    private replayDecoratedProperties(): void {
      const host = this as unknown as Record<string, unknown>
      const metadata = readElementMetadata(this.constructor as MetadataConstructor)
      const properties = new Set([
        ...metadata.attributes.map((definition) => definition.property),
        ...metadata.properties,
      ])
      for (const property of properties) {
        if (!Object.prototype.hasOwnProperty.call(this, property)) continue

        const value = host[property]
        delete host[property]
        host[property] = value
      }
    }

    private runPartsEnhancer(
      observation: Pick<PartsObservation, 'abortController'>,
      enhance: PartsEnhancer,
    ): void {
      observation.abortController?.abort()
      observation.abortController = this.createAbortController()
      enhance(observation.abortController.signal)
    }

    private createAbortController(): AbortController {
      const AbortControllerConstructor =
        (this.ownerDocument.defaultView as (Window & typeof globalThis) | null)?.AbortController ??
        (targetWindow as (Window & typeof globalThis) | undefined)?.AbortController ??
        AbortController
      return new AbortControllerConstructor()
    }

    private attachDecoratedListeners(): void {
      for (const listener of readElementMetadata(this.constructor as MetadataConstructor)
        .listeners) {
        const target = this.listenerTarget(listener)
        const method = (this as unknown as Record<string, unknown>)[listener.method]
        if (!target || typeof method !== 'function') continue
        this.on(
          target,
          listener.event.replace(/^(document|window):/, ''),
          method.bind(this),
          listener.options,
        )
      }
    }

    private listenerTarget(listener: ListenerDefinition): ListenerTarget | null {
      if (listener.event.startsWith('document:')) return this.ownerDocument
      if (listener.event.startsWith('window:')) return this.ownerDocument.defaultView
      return this
    }

    private attributeDefinitionFor(name: string): AttributeDefinition | undefined {
      return readElementMetadata(this.constructor as MetadataConstructor).attributes.find(
        (definition) => definition.attribute === name,
      )
    }
  }

  return RealmUIElement as unknown as UIElementClass
}

export abstract class UIElement extends createUIElementClass() {}

function coerceAttributeValue(definition: AttributeDefinition, value: string | null): unknown {
  if (definition.kind === 'boolean') return value !== null
  if (definition.kind === 'number') {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : 0
  }
  return value ?? ''
}

function hasElementPartMutation(record: MutationRecord): boolean {
  return [...record.addedNodes, ...record.removedNodes].some((node) => node.nodeType === 1)
}
