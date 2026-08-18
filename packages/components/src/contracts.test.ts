import { describe, expect, it } from 'vitest'
import {
  buttonSizes,
  buttonVariants,
  choiceGroupOrientations,
  colorPickerFormats,
  fieldLayouts,
  floatingPlacements,
  sheetPositions,
  tabsActivations,
  tabsOrientations,
  toasterPlacements,
  toasterStacks,
  toggleGroupSelections,
} from './index'
import {
  componentContracts,
  componentNames,
  isComponentName,
  type ComponentAttributeContract,
  type ComponentName,
} from './contracts'

const attributesOf = (name: ComponentName): readonly ComponentAttributeContract[] =>
  componentContracts[name].attributes as readonly ComponentAttributeContract[]

const attribute = (component: ComponentName, name: string): ComponentAttributeContract => {
  const found = attributesOf(component).find((item) => item.name === name)
  if (!found) throw new Error(`${component} does not declare ${name}`)
  return found
}

describe('component contracts', () => {
  it('contains every component exactly once', () => {
    expect(new Set(componentNames).size).toBe(componentNames.length)
    expect(componentContracts.button.root).toEqual({ kind: 'class', name: 'ui-button' })
    expect(componentContracts.tabs.root).toEqual({ kind: 'element', name: 'ui-tabs' })
    expect(componentContracts.nativeSelect.root).toEqual({ kind: 'class', name: 'ui-select' })
    expect(componentContracts.select.root).toEqual({ kind: 'element', name: 'ui-select' })
  })

  it('uses the unified public grammar', () => {
    expect(attributesOf('button').map((item) => item.name)).toEqual([
      'data-ui-variant',
      'data-ui-size',
    ])
    expect(componentContracts.card.parts).toContainEqual({
      name: 'title',
      required: false,
      selector: "[data-ui-part~='title']",
      description: 'Card heading. Use a real heading element.',
    })
    expect(componentContracts.tabs.parts.map((item) => item.selector)).toEqual([
      "[role='tablist']",
      "[role='tab']",
      "[role='tabpanel']",
    ])
    expect(componentContracts.separator.root.kind).toBe('class')
    expect(componentNames.filter((name) => name === 'hoverCard')).toHaveLength(1)
  })

  it('guards catalog names', () => {
    expect(isComponentName('dialog')).toBe(true)
    expect(isComponentName('tooltip')).toBe(false)
    expect(isComponentName('unknown')).toBe(false)
  })
})

describe('documented attribute values', () => {
  it('describes every attribute, part, state, variable, and event', () => {
    for (const name of componentNames) {
      const contract = componentContracts[name]
      for (const item of attributesOf(name)) {
        expect(item.description, `${name} ${item.name} description`).not.toBe('')
      }
      for (const item of contract.parts) {
        expect(item.description, `${name} part ${item.name} description`).not.toBe('')
      }
      for (const item of contract.states) {
        expect(item.description, `${name} state ${item.name} description`).not.toBe('')
      }
      for (const item of contract.variables) {
        expect(item.description, `${name} variable ${item.name} description`).not.toBe('')
      }
      for (const item of contract.events) {
        expect(item.description, `${name} event ${item.name} description`).not.toBe('')
      }
    }
  })

  it('keeps every default inside its own value set', () => {
    for (const name of componentNames) {
      for (const item of attributesOf(name)) {
        if (item.default === undefined || !item.values) continue
        expect(item.values, `${name} ${item.name} default`).toContain(item.default)
      }
    }
  })

  /**
   * Values are declared per component because the stylesheets implement different subsets, so this
   * asserts containment rather than equality. `validate-contracts.mjs` proves the subset against the
   * CSS; this proves it against the exported TypeScript unions consumers write against.
   */
  it('draws values from the exported public unions', () => {
    const cases: readonly [ComponentAttributeContract, readonly string[], string][] = [
      [attribute('button', 'data-ui-variant'), buttonVariants, 'buttonVariants'],
      [attribute('button', 'data-ui-size'), buttonSizes, 'buttonSizes'],
      [attribute('toggle', 'data-ui-variant'), buttonVariants, 'buttonVariants'],
      [attribute('field', 'data-ui-layout'), fieldLayouts, 'fieldLayouts'],
      [attribute('choiceGroup', 'data-ui-orientation'), choiceGroupOrientations, 'orientations'],
      [attribute('tabs', 'activation'), tabsActivations, 'tabsActivations'],
      [attribute('tabs', 'orientation'), tabsOrientations, 'tabsOrientations'],
      [attribute('popover', 'placement'), floatingPlacements, 'floatingPlacements'],
      [attribute('select', 'placement'), floatingPlacements, 'floatingPlacements'],
      [attribute('menuButton', 'placement'), floatingPlacements, 'floatingPlacements'],
      [attribute('hoverCard', 'placement'), floatingPlacements, 'floatingPlacements'],
      [attribute('sheet', 'position'), sheetPositions, 'sheetPositions'],
      [attribute('toaster', 'placement'), toasterPlacements, 'toasterPlacements'],
      [attribute('toaster', 'stack'), toasterStacks, 'toasterStacks'],
      [attribute('toggleGroup', 'selection'), toggleGroupSelections, 'toggleGroupSelections'],
      [attribute('colorPicker', 'format'), colorPickerFormats, 'colorPickerFormats'],
    ]

    for (const [item, union, unionName] of cases) {
      expect(item.values, `${item.name} declares values`).toBeDefined()
      for (const value of item.values ?? []) {
        expect(union, `${item.name} value '${value}' is missing from ${unionName}`).toContain(value)
      }
    }
  })
})
