import { describe, expect, it } from 'vitest'
import type {
  TimelessIntrinsicElements as PreactElements,
  UITabsElementProps as PreactTabsProps,
} from './preact'
import type {
  TimelessIntrinsicElements as ReactElements,
  UIHoverCardElementProps as ReactHoverCardProps,
  UIPopoverElementProps as ReactPopoverProps,
  UISheetElementProps as ReactSheetProps,
  UITabsElementProps as ReactTabsProps,
  UIToggleGroupElementProps as ReactToggleGroupProps,
} from './react'
import type {
  TimelessIntrinsicElements as SolidElements,
  UITabsElementProps as SolidTabsProps,
} from './solid'
import type { UITabsElementProps as SvelteTabsProps } from './svelte'
import type { UITabsElementProps as VueTabsProps } from './vue'
import type { TabsChangeDetail } from './tabs'

/**
 * Type-level fixtures for the generated framework declarations.
 *
 * `tsc` is the assertion here: every `@ts-expect-error` below fails the typecheck if the generated
 * declaration stops rejecting that value, and every plain assignment fails if it stops accepting one.
 * Nothing in this file runs, and nothing imports a framework — these assert the props types each
 * declaration exports, not each framework's own JSX pipeline, which would need five toolchains
 * installed to prove.
 */

type Expect<T extends true> = T
type Extends<TSubject, TTarget> = TSubject extends TTarget ? true : false

// Every registered element is declared, in every framework.
export type _ReactHasTags = Expect<Extends<'ui-tabs' | 'ui-color-picker', keyof ReactElements>>
export type _PreactHasTags = Expect<Extends<'ui-tabs' | 'ui-color-picker', keyof PreactElements>>
export type _SolidHasTags = Expect<Extends<'ui-tabs' | 'ui-color-picker', keyof SolidElements>>

// The event prop carries the element's own detail type, not a shared one.
export type _ReactEventDetail = Expect<
  Extends<
    NonNullable<ReactTabsProps['onui-change']>,
    (event: CustomEvent<TabsChangeDetail>) => void
  >
>

describe('generated framework typings', () => {
  it('accepts every permitted attribute value', () => {
    const react: ReactTabsProps = { orientation: 'vertical', activation: 'manual', value: 'a' }
    const preact: PreactTabsProps = { orientation: 'horizontal', activation: 'automatic' }
    const solid: SolidTabsProps = { orientation: 'vertical' }
    const vue: VueTabsProps = { orientation: 'vertical' }
    const svelte: SvelteTabsProps = { orientation: 'vertical' }
    expect([react, preact, solid, vue, svelte]).toHaveLength(5)
  })

  it('types booleans, numbers, and reflecting properties', () => {
    const sheet: ReactSheetProps = { modal: true, open: false, position: 'left' }
    const hoverCard: ReactHoverCardProps = { 'open-delay': 120, variant: 'tooltip' }
    // `ui-popover` reflects the `role` attribute through a `roleValue` property.
    const popover: ReactPopoverProps = { role: 'listbox', roleValue: 'menu', placement: 'top' }
    // `ui-tabs` authors `value` and exposes the authored default as `defaultValue`.
    const tabs: ReactTabsProps = { value: 'details', defaultValue: 'details' }
    expect([sheet, hoverCard, popover, tabs]).toHaveLength(4)
  })

  it('keeps consumer data and aria attributes open', () => {
    const props: ReactTabsProps = { 'data-testid': 'tabs', 'aria-label': 'Project' }
    expect(props).toBeTypeOf('object')
  })

  // Never called. Each line must be a type error for the declarations to be doing their job.
  it('rejects values, attributes, and tags outside the contract', () => {
    function typeErrors() {
      // @ts-expect-error 'sideways' is not a tabs orientation.
      const a: ReactTabsProps = { orientation: 'sideways' }
      // @ts-expect-error 'eager' is not a tabs activation.
      const b: PreactTabsProps = { activation: 'eager' }
      // @ts-expect-error 'centre' is not a sheet position.
      const c: ReactSheetProps = { position: 'centre' }
      // @ts-expect-error 'combobox' is not one of the four permitted popover roles.
      const d: ReactPopoverProps = { role: 'combobox' }
      // @ts-expect-error `selection` accepts 'single' or 'multiple'.
      const e: ReactToggleGroupProps = { selection: 'many' }
      // @ts-expect-error `open-delay` is a number, not a string.
      const f: ReactHoverCardProps = { 'open-delay': '120' }
      // @ts-expect-error Tabs has no `placement` attribute.
      const g: SolidTabsProps = { placement: 'top' }
      // @ts-expect-error `ui-nonexistent` is not a registered element.
      const h: ReactElements['ui-nonexistent'] = {}
      return [a, b, c, d, e, f, g, h]
    }
    expect(typeErrors).toBeTypeOf('function')
  })
})
