import { describe, expect, it } from 'vitest'
import {
  applyAccessorDecorator,
  applyElementDecorator,
  applyMethodDecorator,
  attachMetadata,
  installCoreTestGlobals,
} from './test-support'

installCoreTestGlobals()

describe('watch', () => {
  it('runs watchers for property changes and skips unchanged values', async () => {
    const core = await import('./index')

    class WatchedElement extends core.UIElement {
      declare tone: string

      toneValue = 'neutral'
      changes: unknown[][] = []

      syncTone(value?: unknown, oldValue?: unknown): void {
        this.changes.push([value, oldValue])
      }
    }

    const metadata = attachMetadata(WatchedElement)
    applyElementDecorator(core, WatchedElement, 'ui-watched', metadata)
    applyAccessorDecorator(core.attr, WatchedElement, metadata, 'tone', {
      get() {
        return this.toneValue
      },
      set(value) {
        this.toneValue = value
      },
    })
    applyMethodDecorator(core.watch('tone'), WatchedElement, metadata, 'syncTone')

    const element = new WatchedElement()

    element.tone = 'strong'
    element.tone = 'strong'
    element.tone = 'subtle'

    expect(element.changes).toEqual([
      ['strong', 'neutral'],
      ['subtle', 'strong'],
    ])
  })

  it('supports immediate and multi-property watchers', async () => {
    const core = await import('./index')

    class WatchedElement extends core.UIElement {
      declare tone: string
      declare size: string

      toneValue = 'neutral'
      sizeValue = 'md'
      changes: unknown[][] = []

      syncOptions(value?: unknown, oldValue?: unknown): void {
        this.changes.push([value, oldValue])
      }
    }

    const metadata = attachMetadata(WatchedElement)
    applyElementDecorator(core, WatchedElement, 'ui-watched', metadata)
    applyAccessorDecorator(core.attr, WatchedElement, metadata, 'tone', {
      get() {
        return this.toneValue
      },
      set(value) {
        this.toneValue = value
      },
    })
    applyAccessorDecorator(core.attr, WatchedElement, metadata, 'size', {
      get() {
        return this.sizeValue
      },
      set(value) {
        this.sizeValue = value
      },
    })
    applyMethodDecorator(
      core.watch(['tone', 'size'], { immediate: true }),
      WatchedElement,
      metadata,
      'syncOptions',
    )

    const element = new WatchedElement()

    element.connectedCallback()
    element.size = 'lg'

    expect(element.changes).toEqual([
      [undefined, undefined],
      ['lg', 'md'],
    ])
  })

  it('notifies once when a watched property changes through its attribute', async () => {
    const core = await import('./index')

    class WatchedElement extends core.UIElement {
      declare tone: string

      toneValue = 'neutral'
      changes: unknown[][] = []

      syncTone(value?: unknown, oldValue?: unknown): void {
        this.changes.push([value, oldValue])
      }
    }

    const metadata = attachMetadata(WatchedElement)
    applyElementDecorator(core, WatchedElement, 'ui-watched', metadata)
    applyAccessorDecorator(core.attr, WatchedElement, metadata, 'tone', {
      get() {
        return this.toneValue
      },
      set(value) {
        this.toneValue = value
      },
    })
    applyMethodDecorator(core.watch('tone'), WatchedElement, metadata, 'syncTone')

    const element = new WatchedElement()

    element.setAttribute('tone', 'strong')

    expect(element.tone).toBe('strong')
    expect(element.changes).toEqual([['strong', 'neutral']])
  })
})
