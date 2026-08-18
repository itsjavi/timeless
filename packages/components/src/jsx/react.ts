import type { UITabsElement } from '../tabs'
import type { UIDialogElement } from '../dialog'
import type { UISheetElement } from '../sheet'
import type { UIPopoverElement } from '../popover'
import type { UIHoverCardElement } from '../hover-card'
import type { UIMenuElement } from '../menu'
import type { UIMenuButtonElement } from '../menu-button'
import type { UIToolbarElement } from '../toolbar'
import type { UIRadioGroupElement } from '../choice-group'
import type { UICheckboxGroupElement } from '../choice-group'
import type { UIListboxElement } from '../listbox'
import type { UISelectElement } from '../select'
import type { UIComboboxElement } from '../combobox'
import type { UIToasterElement } from '../toast'
import type { UIToastElement } from '../toast'
import type { UIToggleGroupElement } from '../toggle-group'
import type { UINumberStepperElement } from '../number-stepper'
import type { UIColorPickerElement } from '../color-picker'
import type { UITransitionDetail } from '../events'

type DataAttributes = { [name: `data-${string}`]: unknown }
type AriaAttributes = { [name: `aria-${string}`]: string | number | boolean | undefined }

export type TimelessElementProps<TElement extends HTMLElement> = Partial<
  Omit<TElement, keyof HTMLElement>
> &
  DataAttributes &
  AriaAttributes & {
    children?: unknown
    class?: string
    className?: string
    id?: string
    ref?: unknown
    role?: string
    slot?: string
    style?: Record<string, string | number>
    title?: string
    'onui-before-change'?: (event: CustomEvent<UITransitionDetail<unknown>>) => void
    'onui-change'?: (event: CustomEvent<UITransitionDetail<unknown>>) => void
  }

export interface TimelessIntrinsicElements {
  'ui-tabs': TimelessElementProps<UITabsElement>
  'ui-dialog': TimelessElementProps<UIDialogElement>
  'ui-sheet': TimelessElementProps<UISheetElement>
  'ui-popover': TimelessElementProps<UIPopoverElement>
  'ui-hover-card': TimelessElementProps<UIHoverCardElement>
  'ui-menu': TimelessElementProps<UIMenuElement>
  'ui-menu-button': TimelessElementProps<UIMenuButtonElement>
  'ui-toolbar': TimelessElementProps<UIToolbarElement>
  'ui-radio-group': TimelessElementProps<UIRadioGroupElement>
  'ui-checkbox-group': TimelessElementProps<UICheckboxGroupElement>
  'ui-listbox': TimelessElementProps<UIListboxElement>
  'ui-select': TimelessElementProps<UISelectElement>
  'ui-combobox': TimelessElementProps<UIComboboxElement>
  'ui-toaster': TimelessElementProps<UIToasterElement>
  'ui-toast': TimelessElementProps<UIToastElement>
  'ui-toggle-group': TimelessElementProps<UIToggleGroupElement>
  'ui-number-stepper': TimelessElementProps<UINumberStepperElement>
  'ui-color-picker': TimelessElementProps<UIColorPickerElement>
}

// @ts-ignore React is an optional consumer dependency.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends TimelessIntrinsicElements {}
  }
}

// @ts-ignore React is an optional consumer dependency.
declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements extends TimelessIntrinsicElements {}
  }
}

export {}
