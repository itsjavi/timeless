import { describe, expect, it } from 'vitest'
import { enhanceSelectParts, syncSelectValue, type SelectOptionLike } from './select'

class FakeSelectElement {
  id = ''
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

describe('enhanceSelectParts', () => {
  it('wires hidden value, trigger, listbox, options, and floating hooks', () => {
    const host = new FakeSelectElement()
    const input = new FakeSelectElement()
    const trigger = new FakeSelectElement()
    const listbox = new FakeSelectElement()
    const options = [
      new FakeSelectElement('Designer'),
      new FakeSelectElement('Engineer'),
      new FakeSelectElement('Manager'),
    ]
    options[1]!.setAttribute('data-ui-value', 'engineering')

    const result = enhanceSelectParts(
      { host, input, trigger, listbox, options },
      {
        anchorName: '--ui-select-anchor-1',
        generatedIdPrefix: 'ui-select-1',
        supportsPopover: true,
        value: 'engineering',
      },
    )

    expect(result).toEqual({
      status: 'enhanced',
      listboxId: 'ui-select-1-listbox',
      optionIds: ['ui-select-1-option-1', 'ui-select-1-option-2', 'ui-select-1-option-3'],
      selectedIndex: 1,
    })
    expect(input.value).toBe('engineering')
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox')
    expect(trigger.getAttribute('aria-controls')).toBe('ui-select-1-listbox')
    expect(trigger.style.values.get('--ui-floating-anchor')).toBe('--ui-select-anchor-1')
    expect(listbox.getAttribute('role')).toBe('listbox')
    expect(listbox.getAttribute('popover')).toBe('auto')
    expect(options.map((option) => option.getAttribute('aria-selected'))).toEqual([
      'false',
      'true',
      'false',
    ])
  })

  it('reports missing or unsupported platform requirements', () => {
    const host = new FakeSelectElement()

    expect(
      enhanceSelectParts(
        { host, input: null, trigger: null, listbox: null, options: [] },
        {
          anchorName: '--ui-select-anchor-2',
          generatedIdPrefix: 'ui-select-2',
          supportsPopover: true,
        },
      ),
    ).toEqual({ status: 'invalid', missing: ['input', 'trigger', 'listbox', 'options'] })

    const input = new FakeSelectElement()
    const trigger = new FakeSelectElement()
    const listbox = new FakeSelectElement()
    const options = [new FakeSelectElement('Designer')]
    expect(
      enhanceSelectParts(
        { host, input, trigger, listbox, options },
        {
          anchorName: '--ui-select-anchor-3',
          generatedIdPrefix: 'ui-select-3',
          supportsPopover: false,
        },
      ),
    ).toEqual({ status: 'unsupported', feature: 'popover' })
  })
})

describe('syncSelectValue', () => {
  it('syncs submitted value and selected option state', () => {
    const input = new FakeSelectElement()
    const trigger = new FakeSelectElement()
    const options: SelectOptionLike[] = [
      new FakeSelectElement('Designer'),
      new FakeSelectElement('Engineer'),
    ]

    options[1]!.setAttribute('data-ui-value', 'engineer')
    expect(
      syncSelectValue(
        { host: new FakeSelectElement(), input, trigger, listbox: null, options },
        'engineer',
      ),
    ).toBe(1)
    expect(input.value).toBe('engineer')
    expect(options.map((option) => option.getAttribute('aria-selected'))).toEqual(['false', 'true'])
  })
})
