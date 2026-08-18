import { describe, expect, it } from 'vitest'
import { createIdFactory, ensureElementId, normalizeIdPart } from './ids'

describe('normalizeIdPart', () => {
  it('creates lowercase id-safe parts with a fallback', () => {
    expect(normalizeIdPart(' Product Tabs ')).toBe('product-tabs')
    expect(normalizeIdPart('Field: Error!')).toBe('field-error')
    expect(normalizeIdPart('!!!')).toBe('id')
  })
})

describe('createIdFactory', () => {
  it('creates scoped deterministic ids', () => {
    const nextId = createIdFactory('Product Tabs')

    expect(nextId('tab')).toBe('product-tabs-tab-1')
    expect(nextId('tab')).toBe('product-tabs-tab-2')
    expect(nextId()).toBe('product-tabs-item-3')
  })

  it('allocates independent counters for each document', async () => {
    const { createId } = await import('./ids')
    const firstDocument = {} as Document
    const secondDocument = {} as Document

    expect(createId('tabs', firstDocument)).toBe('tabs-1')
    expect(createId('tabs', firstDocument)).toBe('tabs-2')
    expect(createId('tabs', secondDocument)).toBe('tabs-1')
  })
})

describe('ensureElementId', () => {
  it('preserves author ids and fills empty ids', () => {
    const authored = { id: 'author-id' }
    const empty = { id: '' }

    expect(ensureElementId(authored, 'generated')).toBe('author-id')
    expect(ensureElementId(empty, 'generated')).toBe('generated')
    expect(empty.id).toBe('generated')
  })
})
