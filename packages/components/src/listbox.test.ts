import { describe, expect, it } from 'vitest'
import {
  enhanceListboxParts,
  filterListboxOptions,
  listboxOptionValue,
  selectedListboxValues,
  syncListboxActiveDescendant,
  syncListboxSelection,
  syncListboxValue,
  type ListboxOptionLike,
} from './listbox'

class FakeListboxElement implements ListboxOptionLike {
  id = ''
  hidden: boolean | 'until-found' = false
  readonly attributes = new Map<string, string>()

  constructor(public textContent: string | null = null) {}

  getAttribute(name: string): string | null {
    if (name === 'id') return this.id || null
    return this.attributes.get(name) ?? null
  }

  hasAttribute(name: string): boolean {
    if (name === 'id') return this.id.length > 0
    return this.attributes.has(name)
  }

  matches(selector: string): boolean {
    return selector === ':disabled' && this.hasAttribute('disabled')
  }

  removeAttribute(name: string): void {
    if (name === 'id') {
      this.id = ''
      return
    }
    this.attributes.delete(name)
  }

  setAttribute(name: string, value: string): void {
    if (name === 'id') {
      this.id = value
    }
    this.attributes.set(name, value)
  }
}

describe('enhanceListboxParts', () => {
  it('sets listbox semantics, option ids, selection, and active option state', () => {
    const host = new FakeListboxElement()
    const options = [
      new FakeListboxElement('Designer'),
      new FakeListboxElement('Engineer'),
      new FakeListboxElement('Manager'),
    ]
    options[1]!.setAttribute('data-ui-value', 'engineer')

    const result = enhanceListboxParts(
      { host, options },
      { generatedIdPrefix: 'ui-listbox-1', multiple: false, value: 'engineer' },
    )

    expect(result).toEqual({
      status: 'enhanced',
      activeIndex: 1,
      optionIds: ['ui-listbox-1-option-1', 'ui-listbox-1-option-2', 'ui-listbox-1-option-3'],
      selectedIndex: 1,
      value: 'engineer',
    })
    expect(host.getAttribute('role')).toBe('listbox')
    expect(options.map((option) => option.getAttribute('role'))).toEqual([
      'option',
      'option',
      'option',
    ])
    expect(options.map((option) => option.getAttribute('aria-selected'))).toEqual([
      'false',
      'true',
      'false',
    ])
    expect(options.map((option) => option.getAttribute('tabindex'))).toEqual(['-1', '0', '-1'])
  })

  it('supports active descendant state for editable controllers', () => {
    const input = new FakeListboxElement()
    const host = new FakeListboxElement()
    const options = [new FakeListboxElement('Apple'), new FakeListboxElement('Banana')]
    options[0]!.id = 'apple'
    options[1]!.id = 'banana'

    expect(syncListboxActiveDescendant(input, { host, options }, 1)).toBe(1)
    expect(input.getAttribute('aria-activedescendant')).toBe('banana')
    expect(options.map((option) => option.hasAttribute('data-ui-internal-active'))).toEqual([
      false,
      true,
    ])
    // Focus never becomes a tab stop when a controller owns it.
    expect(options.map((option) => option.getAttribute('tabindex'))).toEqual(['-1', '-1'])

    expect(syncListboxActiveDescendant(input, { host, options }, null)).toBeNull()
    expect(input.getAttribute('aria-activedescendant')).toBeNull()
  })

  it('moves the active option without touching the selection', () => {
    const host = new FakeListboxElement()
    const input = new FakeListboxElement()
    const options = [
      new FakeListboxElement('Apple'),
      new FakeListboxElement('Banana'),
      new FakeListboxElement('Cherry'),
    ]
    options.forEach((option, index) => {
      option.id = `option-${index}`
    })
    syncListboxValue({ host, options }, 'Banana')
    expect(options.map((option) => option.getAttribute('aria-selected'))).toEqual([
      'false',
      'true',
      'false',
    ])

    // Arrow past the selected option: the highlight moves, the selection does not.
    syncListboxActiveDescendant(input, { host, options }, 2)

    expect(options.map((option) => option.getAttribute('aria-selected'))).toEqual([
      'false',
      'true',
      'false',
    ])
    expect(options.map((option) => option.hasAttribute('data-ui-internal-active'))).toEqual([
      false,
      false,
      true,
    ])
  })

  it('replaces the whole selection for a multiple listbox', () => {
    const host = new FakeListboxElement()
    const options = [
      new FakeListboxElement('Apple'),
      new FakeListboxElement('Banana'),
      new FakeListboxElement('Cherry'),
    ]

    expect(syncListboxSelection({ host, options }, ['Apple', 'Cherry'])).toEqual([
      'Apple',
      'Cherry',
    ])
    expect(options.map((option) => option.getAttribute('aria-selected'))).toEqual([
      'true',
      'false',
      'true',
    ])

    expect(syncListboxSelection({ host, options }, [])).toEqual([])
    expect(options.map((option) => option.getAttribute('aria-selected'))).toEqual([
      'false',
      'false',
      'false',
    ])
  })

  it('filters options and reports selected values', () => {
    const host = new FakeListboxElement()
    const options = [
      new FakeListboxElement('Apple'),
      new FakeListboxElement('Banana'),
      new FakeListboxElement('Apricot'),
    ]

    expect(filterListboxOptions(options, 'ap')).toHaveLength(2)
    expect(options.map((option) => option.hidden)).toEqual([false, true, false])

    expect(syncListboxValue({ host, options }, 'Banana')).toBe(1)
    expect(selectedListboxValues(options)).toEqual(['Banana'])
    options[1]!.setAttribute('data-ui-value', 'banana')
    expect(listboxOptionValue(options[1]!)).toBe('banana')
  })

  it('preserves authored selected options in multiple mode', () => {
    const host = new FakeListboxElement()
    const options = [
      new FakeListboxElement('Design'),
      new FakeListboxElement('Engineering'),
      new FakeListboxElement('Legal'),
    ]
    options[0]!.setAttribute('aria-selected', 'true')
    options[1]!.setAttribute('aria-selected', 'true')

    expect(
      enhanceListboxParts({ host, options }, { generatedIdPrefix: 'ui-listbox-3', multiple: true }),
    ).toMatchObject({ status: 'enhanced', activeIndex: 0, selectedIndex: 0 })
    expect(selectedListboxValues(options)).toEqual(['Design', 'Engineering'])
  })

  it('marks empty listboxes invalid', () => {
    const host = new FakeListboxElement()

    expect(
      enhanceListboxParts(
        { host, options: [] },
        { generatedIdPrefix: 'ui-listbox-2', multiple: false },
      ),
    ).toEqual({ status: 'invalid', missing: ['options'] })
    expect(host.getAttribute('data-ui-invalid')).toBeNull()
  })
})
