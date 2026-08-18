import { describe, expect, it } from 'vitest'
import {
  applyElementDecorator,
  applyAccessorDecorator,
  attachMetadata,
  eventWithTarget,
  installCoreTestGlobals,
  TestHTMLElement,
} from './test-support'

installCoreTestGlobals()

describe('UIElement', () => {
  it('creates element bases in the requested window realm', async () => {
    const core = await import('./index')
    class RealmHTMLElement {}

    const RealmUIElement = core.createUIElementClass({
      HTMLElement: RealmHTMLElement,
    } as unknown as Window)
    class RealmElement extends RealmUIElement {}

    expect(RealmHTMLElement.prototype.isPrototypeOf(RealmElement.prototype)).toBe(true)
  })

  it('toggles custom host states through ElementInternals', async () => {
    const core = await import('./index')
    const states = new Set<string>()

    class InternalsHTMLElement extends TestHTMLElement {
      attachInternals(): ElementInternals {
        return { states } as unknown as ElementInternals
      }
    }

    const RealmUIElement = core.createUIElementClass({
      AbortController,
      HTMLElement: InternalsHTMLElement,
    } as unknown as Window)

    class StatefulElement extends RealmUIElement {
      close(): void {
        this.setCustomState('--closed', true)
      }

      reopen(): void {
        this.setCustomState('--closed', false)
      }

      isClosed(): boolean {
        return this.hasCustomState('--closed')
      }
    }

    const element = new StatefulElement()
    element.close()
    expect(states.has('--closed')).toBe(true)
    expect(element.isClosed()).toBe(true)

    element.connectedCallback()
    element.disconnectedCallback()
    element.connectedCallback()
    expect(element.isClosed()).toBe(true)

    element.reopen()
    expect(states.has('--closed')).toBe(false)
    expect(element.isClosed()).toBe(false)
  })

  it('tracks custom states when ElementInternals is unavailable', async () => {
    const core = await import('./index')

    class StatefulElement extends core.UIElement {
      setState(active: boolean): void {
        this.setCustomState('--contextual', active)
      }

      isContextual(): boolean {
        return this.hasCustomState('--contextual')
      }
    }

    const element = new StatefulElement()
    element.setState(true)
    expect(element.isContextual()).toBe(true)
    element.setState(false)
    expect(element.isContextual()).toBe(false)
  })

  it('replays fallback custom states when a test double later provides internals', async () => {
    const core = await import('./index')
    const states = new Set<string>()
    let internalsAvailable = false

    class RecoveringHTMLElement extends TestHTMLElement {
      attachInternals(): ElementInternals {
        if (!internalsAvailable) throw new Error('Internals unavailable')
        return { states } as unknown as ElementInternals
      }
    }

    const RealmUIElement = core.createUIElementClass({
      AbortController,
      HTMLElement: RecoveringHTMLElement,
    } as unknown as Window)

    class StatefulElement extends RealmUIElement {
      setState(name: `--${string}`): void {
        this.setCustomState(name, true)
      }

      hasState(name: `--${string}`): boolean {
        return this.hasCustomState(name)
      }
    }

    const element = new StatefulElement()
    element.setState('--closed')
    internalsAvailable = true
    element.setState('--contextual')

    expect(states).toEqual(new Set(['--closed', '--contextual']))
    expect(element.hasState('--closed')).toBe(true)
  })

  it('emits composed bubbling custom events with typed details', async () => {
    const core = await import('./index')

    class EventElement extends core.UIElement {
      fire(): boolean {
        return this.emit('ui-ready', { value: 1 })
      }
    }

    const metadata = attachMetadata(EventElement)
    applyElementDecorator(core, EventElement, 'ui-event', metadata)

    const element = new EventElement()
    let receivedEvent: CustomEvent<{ value: number }> | undefined

    element.addEventListener('ui-ready', (event) => {
      receivedEvent = event as CustomEvent<{ value: number }>
    })

    expect(element.fire()).toBe(true)
    expect(receivedEvent?.detail).toEqual({ value: 1 })
    expect(receivedEvent?.bubbles).toBe(true)
    expect(receivedEvent?.composed).toBe(true)
  })

  it('resolves closest event targets without crossing the host boundary', async () => {
    const core = await import('./index')

    class TargetElement extends core.UIElement {
      findTarget(event: Event): Element | null {
        return this.closestTarget(event, '[data-action]')
      }
    }

    const metadata = attachMetadata(TargetElement)
    applyElementDecorator(core, TargetElement, 'ui-target', metadata)

    const element = new TargetElement()
    const testElement = element as unknown as TestHTMLElement
    const match = { id: 'inside' } as Element
    const target = {
      closest() {
        return match
      },
    }

    testElement.containedNodes.add(match)
    expect(element.findTarget(eventWithTarget(target))).toBe(match)

    testElement.containedNodes.clear()
    expect(element.findTarget(eventWithTarget(target))).toBeNull()
  })

  it('resolves aria-controls targets inside the host', async () => {
    const core = await import('./index')

    class ControlElement extends core.UIElement {
      getControlled(controller: Element): HTMLElement | null {
        return this.getControlledElement(controller)
      }
    }

    const metadata = attachMetadata(ControlElement)
    applyElementDecorator(core, ControlElement, 'ui-control', metadata)

    const element = new ControlElement()
    const testElement = element as unknown as TestHTMLElement
    const controlled = { id: 'panel' } as HTMLElement
    const controller = {
      getAttribute(name: string) {
        return name === 'aria-controls' ? 'panel' : null
      },
    } as Element

    testElement.selectors.set('#panel', [controlled])

    expect(element.getControlled(controller)).toBe(controlled)
  })

  it('replays decorated own properties before connection logic', async () => {
    const core = await import('./index')
    const values = new WeakMap<object, string>()
    const calls: string[] = []

    class ReplayElement extends core.UIElement {
      protected override connected(): void {
        calls.push(`connected:${this.value}`)
      }

      declare value: string
    }

    const metadata = attachMetadata(ReplayElement)
    applyAccessorDecorator(core.attr, ReplayElement, metadata, 'value', {
      get() {
        return values.get(this) ?? ''
      },
      set(value) {
        values.set(this, value as string)
        calls.push(`set:${String(value)}`)
      },
    })
    applyElementDecorator(core, ReplayElement, 'ui-replay', metadata)

    const element = new ReplayElement()
    Object.defineProperty(element, 'value', {
      configurable: true,
      enumerable: true,
      value: 'before-upgrade',
      writable: true,
    })

    element.connectedCallback()

    expect(Object.hasOwn(element, 'value')).toBe(false)
    expect(element.value).toBe('before-upgrade')
    expect(calls).toEqual(['set:before-upgrade', 'connected:before-upgrade'])
  })

  it('coalesces Light DOM observation and renews the scoped signal', async () => {
    const core = await import('./index')
    let notifyMutation: ((nodeType?: number) => void) | undefined

    class TestMutationObserver {
      constructor(callback: MutationCallback) {
        notifyMutation = (nodeType = 1) =>
          callback(
            [
              {
                addedNodes: [{ nodeType }],
                removedNodes: [],
              } as unknown as MutationRecord,
            ],
            this as unknown as MutationObserver,
          )
      }
      disconnect(): void {}
      observe(): void {}
    }

    const RealmUIElement = core.createUIElementClass({
      AbortController,
      HTMLElement: TestHTMLElement,
      MutationObserver: TestMutationObserver,
    } as unknown as Window)
    const signals: AbortSignal[] = []

    class ObservedElement extends RealmUIElement {
      protected override connected(): void {
        this.observeParts((signal) => signals.push(signal))
      }
    }

    const metadata = attachMetadata(ObservedElement)
    applyElementDecorator(core, ObservedElement, 'ui-observed', metadata)

    const element = new ObservedElement()
    Object.defineProperty(element, 'isConnected', { configurable: true, value: true })
    element.connectedCallback()
    notifyMutation?.(3)
    await Promise.resolve()
    expect(signals).toHaveLength(1)
    notifyMutation?.()
    notifyMutation?.()
    await Promise.resolve()

    expect(signals).toHaveLength(2)
    expect(signals[0]?.aborted).toBe(true)
    expect(signals[1]?.aborted).toBe(false)

    element.disconnectedCallback()
    expect(signals[1]?.aborted).toBe(true)
  })
})
