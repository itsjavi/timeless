import { describe, expect, it } from 'vitest'
import {
  applyAccessorDecorator,
  applyElementDecorator,
  attachMetadata,
  installCoreTestGlobals,
  TestHTMLElement,
} from './test-support'

installCoreTestGlobals()

describe('query decorators', () => {
  it('provides live single-target queries', async () => {
    const core = await import('./index')

    class QueryElement extends core.UIElement {
      declare control: unknown
    }

    const metadata = attachMetadata(QueryElement)
    applyElementDecorator(core, QueryElement, 'ui-query', metadata)
    applyAccessorDecorator(core.query('[data-control]'), QueryElement, metadata, 'control')

    const element = new QueryElement()
    const testElement = element as unknown as TestHTMLElement
    const first = { id: 'first' }
    const second = { id: 'second' }

    expect(element.control).toBeNull()

    testElement.selectors.set('[data-control]', [first])
    expect(element.control).toBe(first)

    testElement.selectors.set('[data-control]', [second])
    expect(element.control).toBe(second)
  })

  it('provides live multi-target queries as arrays', async () => {
    const core = await import('./index')

    class QueryElement extends core.UIElement {
      declare items: unknown[]
    }

    const metadata = attachMetadata(QueryElement)
    applyElementDecorator(core, QueryElement, 'ui-query', metadata)
    applyAccessorDecorator(core.queryAll('[data-item]'), QueryElement, metadata, 'items')

    const element = new QueryElement()
    const testElement = element as unknown as TestHTMLElement
    const items = [{ id: 1 }, { id: 2 }]

    expect(element.items).toEqual([])

    testElement.selectors.set('[data-item]', items)

    expect(element.items).toEqual(items)
  })
})
