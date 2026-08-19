import { describe, expect, it } from 'vitest'
import {
  applyOptionFilter,
  applyOptionWindow,
  enabledOptions,
  findOptionByPrefix,
  matchOption,
  optionLabel,
  optionPageWindow,
  visibleOptions,
  type OptionLike,
} from './options'

class FakeOption implements OptionLike {
  hidden: boolean | 'until-found' = false
  readonly attributes = new Map<string, string>()

  constructor(public textContent: string | null = null) {}

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name)
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name)
  }
}

function options(...labels: readonly string[]): FakeOption[] {
  return labels.map((label) => new FakeOption(label))
}

describe('optionLabel', () => {
  it('prefers the authored label over every other source', () => {
    const option = new FakeOption('  Two lines of visible content  ')
    expect(optionLabel(option)).toBe('Two lines of visible content')

    option.setAttribute('aria-label', 'Accessible name')
    expect(optionLabel(option)).toBe('Accessible name')

    option.setAttribute('data-ui-label', 'Data label')
    expect(optionLabel(option)).toBe('Data label')

    option.setAttribute('label', 'Authored label')
    expect(optionLabel(option)).toBe('Authored label')
  })

  it('ignores an empty authored label rather than resolving to nothing', () => {
    const option = new FakeOption('Fallback')
    option.setAttribute('label', '   ')
    expect(optionLabel(option)).toBe('Fallback')
  })

  it('does not change the accessible name it reads from', () => {
    const option = new FakeOption('Ada Lovelace — Engineering')
    option.setAttribute('aria-label', 'Ada Lovelace, engineering')
    option.setAttribute('label', 'Ada')

    expect(optionLabel(option)).toBe('Ada')
    expect(option.getAttribute('aria-label')).toBe('Ada Lovelace, engineering')
  })
})

describe('matchOption', () => {
  it('matches case- and diacritic-insensitively through the shared collator', () => {
    const option = new FakeOption('Café')
    expect(matchOption(option, 'cafe')).toBe(true)
    expect(matchOption(option, 'CAFÉ')).toBe(true)
    expect(matchOption(option, 'coffee')).toBe(false)
  })

  it('distinguishes contains from starts-with', () => {
    const option = new FakeOption('Apricot')
    expect(matchOption(option, 'ric', 'contains')).toBe(true)
    expect(matchOption(option, 'ric', 'starts-with')).toBe(false)
    expect(matchOption(option, 'apr', 'starts-with')).toBe(true)
  })

  it('matches everything under `off`, because the consumer owns visibility there', () => {
    const option = new FakeOption('Apricot')
    expect(matchOption(option, 'nothing like it', 'off')).toBe(true)
  })

  it('matches the authored label rather than the rendered text', () => {
    const option = new FakeOption('Not this')
    option.setAttribute('label', 'Findable')
    expect(matchOption(option, 'find')).toBe(true)
    expect(matchOption(option, 'not this')).toBe(false)
  })
})

describe('applyOptionFilter', () => {
  it('writes hidden and returns what survived', () => {
    const list = options('Apple', 'Banana', 'Apricot')
    expect(applyOptionFilter(list, 'ap')).toHaveLength(2)
    expect(list.map((option) => option.hidden)).toEqual([false, true, false])
  })

  it('leaves consumer-owned visibility alone under `off`', () => {
    const list = options('Apple', 'Banana', 'Apricot')
    list[1]!.hidden = true

    expect(applyOptionFilter(list, 'ap', 'off')).toEqual([list[0], list[2]])
    expect(list.map((option) => option.hidden)).toEqual([false, true, false])
  })
})

describe('findOptionByPrefix', () => {
  it('advances from the current option and wraps around', () => {
    const list = options('Apple', 'Apricot', 'Banana')
    expect(findOptionByPrefix(list, 'ap')).toBe(0)
    expect(findOptionByPrefix(list, 'ap', 0)).toBe(1)
    expect(findOptionByPrefix(list, 'ap', 1)).toBe(0)
  })

  it('skips hidden and disabled options', () => {
    const list = options('Apple', 'Apricot', 'Avocado')
    list[0]!.hidden = true
    list[1]!.setAttribute('aria-disabled', 'true')

    expect(findOptionByPrefix(list, 'a')).toBe(2)
  })

  it('returns null for an empty search', () => {
    expect(findOptionByPrefix(options('Apple'), '   ')).toBeNull()
  })
})

describe('optionPageWindow', () => {
  it('is a single page when unpaged', () => {
    const list = options('a', 'b', 'c')
    expect(optionPageWindow(list, 0)).toEqual({ page: 0, totalPages: 1, visible: list })
  })

  it('slices the first and last page', () => {
    const list = options('a', 'b', 'c', 'd', 'e')

    const first = optionPageWindow(list, 2, 0)
    expect(first.page).toBe(0)
    expect(first.totalPages).toBe(3)
    expect(first.visible).toEqual([list[0], list[1]])

    const last = optionPageWindow(list, 2, 2)
    expect(last.page).toBe(2)
    expect(last.visible).toEqual([list[4]])
  })

  it('clamps a page index past the end rather than emptying the surface', () => {
    const list = options('a', 'b', 'c')
    expect(optionPageWindow(list, 2, 9).page).toBe(1)
    expect(optionPageWindow(list, 2, -4).page).toBe(0)
  })

  it('is one page when the page size exceeds the option count', () => {
    const list = options('a', 'b')
    expect(optionPageWindow(list, 50)).toEqual({ page: 0, totalPages: 1, visible: list })
  })
})

describe('applyOptionWindow', () => {
  it('pages what the filter left behind', () => {
    const list = options('Apple', 'Banana', 'Apricot', 'Avocado')

    const applied = applyOptionWindow(list, {
      filter: 'starts-with',
      query: 'a',
      pageSize: 2,
    })

    expect(applied.totalPages).toBe(2)
    expect(applied.visible).toEqual([list[0], list[2]])
    expect(list.map((option) => option.hidden)).toEqual([false, true, false, true])
  })

  it('un-hides only what it hid, so a re-page never clobbers the filter', () => {
    const list = options('Apple', 'Banana', 'Apricot', 'Avocado')
    const page = { filter: 'starts-with', query: 'a', pageSize: 2 } as const
    applyOptionWindow(list, { ...page, page: 0 })

    const second = applyOptionWindow(list, { ...page, page: 1 })

    expect(second.visible).toEqual([list[3]])
    // Banana never matched, so it stays hidden across both pages.
    expect(list.map((option) => option.hidden)).toEqual([true, true, true, false])
  })

  it('pages a consumer-filtered list without un-hiding the consumer’s choices', () => {
    const list = options('Apple', 'Banana', 'Apricot', 'Avocado')
    list[1]!.hidden = true

    const first = applyOptionWindow(list, { filter: 'off', pageSize: 2, page: 0 })
    expect(first.totalPages).toBe(2)
    expect(first.visible).toEqual([list[0], list[2]])

    const second = applyOptionWindow(list, { filter: 'off', pageSize: 2, page: 1 })
    expect(second.visible).toEqual([list[3]])
    expect(list[1]!.hidden).toBe(true)
  })
})

describe('visibleOptions and enabledOptions', () => {
  it('report the two sets navigation runs over', () => {
    const list = options('Apple', 'Banana', 'Cherry')
    list[0]!.hidden = true
    list[1]!.setAttribute('aria-disabled', 'true')

    expect(visibleOptions(list)).toEqual([list[1], list[2]])
    expect(enabledOptions(list)).toEqual([list[0], list[2]])
  })
})
