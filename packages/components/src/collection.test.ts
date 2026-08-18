import { describe, expect, it } from 'vitest'
import {
  collectionItemText,
  collectionNavigationTarget,
  collectionTextMatches,
  findCollectionItemByTextPrefix,
  gridCollectionNavigationTarget,
  isCollectionItemDisabled,
  resolveCollectionOrientation,
  syncRovingTabIndex,
  type CollectionItemLike,
} from './collection'

class FakeCollectionItem implements CollectionItemLike {
  textContent: string | null
  readonly attributes = new Map<string, string>()

  constructor(textContent: string, attributes: Record<string, string> = {}) {
    this.textContent = textContent
    for (const [name, value] of Object.entries(attributes)) {
      this.setAttribute(name, value)
    }
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name)
  }

  matches(selector: string): boolean {
    return selector === ':disabled' && this.hasAttribute('disabled')
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }
}

describe('collectionNavigationTarget', () => {
  it('moves through enabled vertical items with Home and End handling', () => {
    const items = [
      new FakeCollectionItem('New file'),
      new FakeCollectionItem('Duplicate', { disabled: '' }),
      new FakeCollectionItem('Rename'),
    ]

    expect(collectionNavigationTarget(items, 0, 'ArrowDown', 'vertical')).toBe(2)
    expect(collectionNavigationTarget(items, 0, 'ArrowUp', 'vertical')).toBe(2)
    expect(collectionNavigationTarget(items, 2, 'Home', 'vertical')).toBe(0)
    expect(collectionNavigationTarget(items, 0, 'End', 'vertical')).toBe(2)
    expect(collectionNavigationTarget(items, 0, 'ArrowRight', 'vertical')).toBeNull()
  })

  it('moves through enabled horizontal and bidirectional items with matching arrow keys', () => {
    const items = [
      new FakeCollectionItem('Small'),
      new FakeCollectionItem('Medium', { 'aria-disabled': 'true' }),
      new FakeCollectionItem('Large'),
    ]

    expect(collectionNavigationTarget(items, 0, 'ArrowRight', 'horizontal')).toBe(2)
    expect(collectionNavigationTarget(items, 0, 'ArrowLeft', 'horizontal')).toBe(2)
    expect(collectionNavigationTarget(items, 0, 'ArrowDown', 'horizontal')).toBeNull()
    expect(collectionNavigationTarget(items, 0, 'ArrowDown', 'both')).toBe(2)
  })
})

describe('syncRovingTabIndex', () => {
  it('keeps only one enabled item in the tab order', () => {
    const items = [
      new FakeCollectionItem('First'),
      new FakeCollectionItem('Second', { disabled: '' }),
      new FakeCollectionItem('Third'),
    ]

    expect(syncRovingTabIndex(items, 1)).toBe(0)
    expect(items.map((item) => item.getAttribute('tabindex'))).toEqual(['0', '-1', '-1'])

    expect(syncRovingTabIndex(items, 2)).toBe(2)
    expect(items.map((item) => item.getAttribute('tabindex'))).toEqual(['-1', '-1', '0'])
  })
})

describe('findCollectionItemByTextPrefix', () => {
  it('finds the next enabled item by normalized text or aria-label', () => {
    const items = [
      new FakeCollectionItem('Open'),
      new FakeCollectionItem('Delete', { disabled: '' }),
      new FakeCollectionItem('Duplicate'),
      new FakeCollectionItem('Rename', { 'aria-label': 'Move item' }),
    ]

    expect(findCollectionItemByTextPrefix(items, 'd', 0)).toBe(2)
    expect(findCollectionItemByTextPrefix(items, 'move', 0)).toBe(3)
    expect(findCollectionItemByTextPrefix(items, 'missing', 0)).toBeNull()
    expect(collectionItemText(items[3]!)).toBe('move item')
    expect(isCollectionItemDisabled(items[1]!)).toBe(true)
  })
})

describe('collectionTextMatches', () => {
  it('matches locale-aware composed and decomposed diacritics', () => {
    expect(collectionTextMatches('Flabébé', 'flabebe')).toBe(true)
    expect(collectionTextMatches('Cafe\u0301 au lait', 'café')).toBe(true)
    expect(collectionTextMatches('İstanbul', 'istanbul', { locale: 'tr' })).toBe(true)
    expect(collectionTextMatches('Bulbasaur', 'saur')).toBe(true)
    expect(collectionTextMatches('Bulbasaur', 'saur', { mode: 'prefix' })).toBe(false)
  })
})

describe('gridCollectionNavigationTarget', () => {
  it('retains columns across uneven rows and skips disabled items', () => {
    const items = [
      new FakeCollectionItem('One'),
      new FakeCollectionItem('Two'),
      new FakeCollectionItem('Three'),
      new FakeCollectionItem('Four'),
      new FakeCollectionItem('Five', { disabled: '' }),
      new FakeCollectionItem('Six'),
      new FakeCollectionItem('Seven'),
    ]

    expect(gridCollectionNavigationTarget(items, 1, 'ArrowDown', 3)).toEqual({
      index: 5,
      column: 1,
    })
    expect(gridCollectionNavigationTarget(items, 5, 'ArrowDown', 3, 1)).toEqual({
      index: 6,
      column: 1,
    })
    expect(gridCollectionNavigationTarget(items, 6, 'PageUp', 3, 1)).toEqual({
      index: 1,
      column: 1,
    })
  })
})

describe('resolveCollectionOrientation', () => {
  it('accepts supported orientations and falls back otherwise', () => {
    expect(resolveCollectionOrientation('horizontal')).toBe('horizontal')
    expect(resolveCollectionOrientation('both')).toBe('both')
    expect(resolveCollectionOrientation('inline')).toBe('vertical')
    expect(resolveCollectionOrientation(null, 'horizontal')).toBe('horizontal')
  })
})
