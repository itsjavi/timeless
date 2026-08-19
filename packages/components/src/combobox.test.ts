import { describe, expect, it } from 'vitest'
import {
  enhanceComboboxParts,
  filterComboboxOptions,
  syncComboboxActiveDescendant,
  type ComboboxOptionLike,
} from './combobox'

class FakeComboboxElement {
  id = ''
  hidden: boolean | 'until-found' = false
  value = ''
  readonly attributes = new Map<string, string>()
  readonly style = {
    values: new Map<string, string>(),
    removeProperty: (name: string) => {
      this.style.values.delete(name)
    },
    setProperty: (name: string, value: string) => {
      this.style.values.set(name, value)
    },
  }

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

describe('enhanceComboboxParts', () => {
  it('wires editable input, listbox popup, options, and anchor hooks', () => {
    const host = new FakeComboboxElement()
    const input = new FakeComboboxElement()
    const listbox = new FakeComboboxElement()
    const options = [new FakeComboboxElement('Apple'), new FakeComboboxElement('Banana')]

    const result = enhanceComboboxParts(
      { host, input, listbox, options },
      {
        anchorName: '--ui-combobox-anchor-1',
        generatedIdPrefix: 'ui-combobox-1',
        supportsPopover: true,
      },
    )

    expect(result).toEqual({
      status: 'enhanced',
      inputId: 'ui-combobox-1-input',
      listboxId: 'ui-combobox-1-listbox',
      optionIds: ['ui-combobox-1-option-1', 'ui-combobox-1-option-2'],
    })
    expect(input.getAttribute('role')).toBe('combobox')
    expect(input.getAttribute('aria-controls')).toBe('ui-combobox-1-listbox')
    expect(input.style.values.get('--ui-floating-anchor')).toBe('--ui-combobox-anchor-1')
    expect(listbox.getAttribute('role')).toBe('listbox')
    expect(listbox.getAttribute('popover')).toBe('manual')
    expect(listbox.hidden).toBe(false)
    expect(options.map((option) => option.getAttribute('role'))).toEqual(['option', 'option'])
  })

  it('reports missing or unsupported platform requirements', () => {
    const host = new FakeComboboxElement()
    const listbox = new FakeComboboxElement()

    expect(
      enhanceComboboxParts(
        { host, input: null, listbox, options: [] },
        {
          anchorName: '--ui-combobox-anchor-2',
          generatedIdPrefix: 'ui-combobox-2',
          supportsPopover: true,
        },
      ),
    ).toEqual({ status: 'invalid', missing: ['input'] })

    const input = new FakeComboboxElement()
    expect(
      enhanceComboboxParts(
        { host, input, listbox, options: [] },
        {
          anchorName: '--ui-combobox-anchor-3',
          generatedIdPrefix: 'ui-combobox-3',
          supportsPopover: false,
        },
      ),
    ).toEqual({ status: 'unsupported', feature: 'popover' })
    expect(listbox.hidden).toBe(true)
  })
})

describe('combobox option helpers', () => {
  it('filters options by normalized text', () => {
    const options: ComboboxOptionLike[] = [
      new FakeComboboxElement('Apple'),
      new FakeComboboxElement('Banana'),
      new FakeComboboxElement('Apricot'),
    ]

    expect(filterComboboxOptions(options, 'ap')).toHaveLength(2)
    expect(options.map((option) => option.hidden)).toEqual([false, true, false])
  })

  it('syncs the active descendant without disturbing the selection', () => {
    const input = new FakeComboboxElement()
    const options: ComboboxOptionLike[] = [
      new FakeComboboxElement('Apple'),
      new FakeComboboxElement('Banana'),
    ]
    options[0]!.id = 'apple'
    options[1]!.id = 'banana'
    options[0]!.setAttribute('aria-selected', 'true')
    options[1]!.setAttribute('aria-selected', 'false')

    expect(syncComboboxActiveDescendant(input, options, 1)).toBe(1)
    expect(input.getAttribute('aria-activedescendant')).toBe('banana')
    expect(options.map((option) => option.getAttribute('aria-selected'))).toEqual(['true', 'false'])
    expect(options.map((option) => option.hasAttribute('data-ui-internal-active'))).toEqual([
      false,
      true,
    ])

    expect(syncComboboxActiveDescendant(input, options, null)).toBeNull()
    expect(input.getAttribute('aria-activedescendant')).toBeNull()
    expect(options[0]!.getAttribute('aria-selected')).toBe('true')
  })
})
