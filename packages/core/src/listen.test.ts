import { describe, expect, it } from 'vitest'
import {
  applyElementDecorator,
  applyMethodDecorator,
  attachMetadata,
  installCoreTestGlobals,
  TestHTMLElement,
} from './test-support'

installCoreTestGlobals()

describe('listen', () => {
  it('binds host listeners for the connected lifecycle only', async () => {
    const core = await import('./index')

    class ListenerElement extends core.UIElement {
      clicks = 0

      onClick(): void {
        this.clicks += 1
      }
    }

    const metadata = attachMetadata(ListenerElement)
    applyElementDecorator(core, ListenerElement, 'ui-listener', metadata)
    applyMethodDecorator(core.listen('click'), ListenerElement, metadata, 'onClick')

    const element = new ListenerElement()

    element.connectedCallback()
    element.dispatchEvent(new Event('click'))
    element.disconnectedCallback()
    element.dispatchEvent(new Event('click'))

    expect(element.clicks).toBe(1)
  })

  it('binds document and window listeners for the connected lifecycle only', async () => {
    const core = await import('./index')

    class ListenerElement extends core.UIElement {
      documentEvents = 0
      windowEvents = 0

      onDocumentEvent(): void {
        this.documentEvents += 1
      }

      onWindowEvent(): void {
        this.windowEvents += 1
      }
    }

    const metadata = attachMetadata(ListenerElement)
    applyElementDecorator(core, ListenerElement, 'ui-listener', metadata)
    applyMethodDecorator(
      core.listen('document:keydown'),
      ListenerElement,
      metadata,
      'onDocumentEvent',
    )
    applyMethodDecorator(core.listen('window:resize'), ListenerElement, metadata, 'onWindowEvent')

    const element = new ListenerElement()
    const testElement = element as unknown as TestHTMLElement

    element.connectedCallback()
    testElement.ownerDocument.dispatchEvent(new Event('keydown'))
    testElement.ownerDocument.defaultView?.dispatchEvent(new Event('resize'))
    element.disconnectedCallback()
    testElement.ownerDocument.dispatchEvent(new Event('keydown'))
    testElement.ownerDocument.defaultView?.dispatchEvent(new Event('resize'))

    expect(element.documentEvents).toBe(1)
    expect(element.windowEvents).toBe(1)
  })
})
