/**
 * React 19 declarations for every Timeless custom element, generated from the component
 * registry. Types only: importing this module adds no runtime code and no React 19 dependency.
 *
 * React 19 is required: earlier versions stringify non-primitive props and never register `on*` listeners for custom elements.
 */

import type { TabsActivation, TabsOrientation } from './values/tabs'
import type { DialogKind } from './values/dialog'
import type { SheetPosition } from './values/sheet'
import type { FloatingPlacement } from './values/floating'
import type { PopoverRole } from './values/popover'
import type { HoverCardVariant } from './values/hover-card'
import type { MenuOrientation } from './values/menu'
import type { ToolbarOrientation } from './values/toolbar'
import type { ChoiceGroupOrientation } from './values/forms'
import type { CollectionAlignment, OptionFilterMode } from './values/options'
import type { ToasterPlacement, ToasterStack } from './values/toast'
import type { ToggleGroupOrientation, ToggleGroupSelection } from './values/toggle-group'
import type { ColorPickerFormat } from './values/color-picker'
import type { TabsChangeDetail } from './tabs'
import type { SheetEventDetail } from './sheet'
import type { MenuCheckedDetail } from './menu'
import type { MenuButtonToggleDetail } from './menu-button'
import type { ContextMenuToggleDetail } from './context-menu'
import type { CheckboxGroupChangeDetail, RadioGroupChangeDetail } from './choice-group'
import type { ListboxChangeDetail, ListboxPageDetail } from './listbox'
import type {
  SelectChangeDetail,
  SelectInputDetail,
  SelectPageDetail,
  SelectToggleDetail,
} from './select'
import type {
  ComboboxChangeDetail,
  ComboboxInputDetail,
  ComboboxPageDetail,
  ComboboxToggleDetail,
} from './combobox'
import type { ToastDismissDetail } from './toast'
import type { ToggleGroupChangeDetail } from './toggle-group'
import type { FormInvalidDetail } from './form'
import type { RangeFieldChangeDetail } from './range-field'
import type { OtpFieldChangeDetail, OtpFieldCompleteDetail } from './otp-field'
import type { CopyDetail, CopyProposalDetail } from './copy-button'

/**
 * Consumer-authored `data-*` and `aria-*` attributes stay open. The generated members above are
 * the escape hatch's opposite number: they are what completes and what type-checks.
 */
type OpenAttributes = {
  [name: `data-${string}`]: unknown
  [name: `aria-${string}`]: string | number | boolean | undefined
}

export type TimelessGlobalProps = OpenAttributes & {
  children?: unknown
  class?: string
  dir?: 'ltr' | 'rtl' | 'auto'
  hidden?: boolean | 'until-found'
  id?: string
  inert?: boolean
  lang?: string
  part?: string
  exportparts?: string
  popover?: 'auto' | 'manual' | 'hint'
  role?: string
  slot?: string
  title?: string
  className?: string
  key?: string | number
  ref?: unknown
  style?: Record<string, string | number>
  tabIndex?: number
  dangerouslySetInnerHTML?: { __html: string }
  suppressHydrationWarning?: boolean
}

export interface UITabsElementProps extends TimelessGlobalProps {
  /** Whether moving focus with the arrow keys selects the tab immediately (`automatic`) or waits for Enter or Space (`manual`). Use `manual` when selecting a tab is expensive. */
  activation?: TabsActivation
  /** Arrow-key axis. Mirrored onto `aria-orientation` on the tablist during enhancement. */
  orientation?: TabsOrientation
  /** The tab selected on load and after a form reset. Match a tab’s `value` attribute. Assign the `value` property for live changes. */
  value?: string
  /** Authored default and form-reset value, reflecting the `value` attribute. */
  defaultValue?: string
  /** Cancelable proposal dispatched before the selected tab changes. Call `preventDefault()` to reject the transition and keep the current value. */
  'onui-before-change'?: (event: CustomEvent<TabsChangeDetail>) => void
  /** Dispatched after the selected tab has changed. Bubbles and is composed. */
  'onui-change'?: (event: CustomEvent<TabsChangeDetail>) => void
}

export interface UIDialogElementProps extends TimelessGlobalProps {
  /** Whether the panel is a regular dialog or an alert dialog. `alert` resolves to `role="alertdialog"`, for a destructive confirmation the user must answer. */
  kind?: DialogKind
}

export interface UISheetElementProps extends TimelessGlobalProps {
  /** Present to open the sheet as a modal, trapping focus and blocking the page behind it. Omit for a non-modal sheet the user can interact around. */
  modal?: boolean
  /** Present to render the sheet open on load. */
  open?: boolean
  /** Which viewport edge the sheet slides in from. */
  position?: SheetPosition
  /** Dispatched after the sheet opens. */
  'onui-open'?: (event: CustomEvent<SheetEventDetail>) => void
  /** Dispatched after the sheet closes. */
  'onui-close'?: (event: CustomEvent<SheetEventDetail>) => void
  /** Dispatched when the sheet closes through Escape, a backdrop click, or a swipe past the dismiss threshold, rather than through an explicit control. The detail names which. A swipe reports `swipe` and behaves exactly like a backdrop click, because that is what it is: a pointer gesture on the overlay rather than a command. */
  'onui-dismiss'?: (event: CustomEvent<SheetEventDetail>) => void
}

export interface UIPopoverElementProps extends TimelessGlobalProps {
  /** Preferred side of the trigger. Positioning uses CSS anchor positioning, so the browser may flip the surface to keep it on screen. */
  placement?: FloatingPlacement
  /** Semantics applied to the surface, and the `aria-haspopup` value set on the trigger. Choose it from the interaction, not the appearance. */
  role?: PopoverRole
  /** DOM property reflecting the `role` attribute. */
  roleValue?: PopoverRole
}

export interface UIHoverCardElementProps extends TimelessGlobalProps {
  /** Id of an element to anchor against instead of the trigger. Use it when the visual anchor differs from the control that opens the card. */
  anchor?: string
  /** Set `tooltip` for the compact tooltip treatment. Omit for the roomier hover-card surface. */
  variant?: HoverCardVariant
  /** Preferred side of the anchor. */
  placement?: FloatingPlacement
  /** Milliseconds of hover or focus intent before opening. The resolved number is available on the read-only `openDelay` property. */
  'open-delay'?: number
  /** Milliseconds after the pointer leaves before closing, so the user can cross the gap into the surface. The resolved number is available on the read-only `closeDelay` property. */
  'close-delay'?: number
  /** DOM property reflecting the `open-delay` attribute. */
  openDelayValue?: string
  /** DOM property reflecting the `close-delay` attribute. */
  closeDelayValue?: string
}

export interface UIMenuElementProps extends TimelessGlobalProps {
  /** Arrow-key axis. Defaults to `horizontal` when the menu part is `role="menubar"`. */
  orientation?: MenuOrientation
  /** Cancelable proposal dispatched before a checkable item changes. Call `preventDefault()` to reject the transition and keep the current value. */
  'onui-before-change'?: (event: CustomEvent<MenuCheckedDetail>) => void
  /** Dispatched after a checkable item has changed. Bubbles and is composed. */
  'onui-change'?: (event: CustomEvent<MenuCheckedDetail>) => void
}

export interface UIMenuButtonElementProps extends TimelessGlobalProps {
  /** Present to render the menu open on load. */
  open?: boolean
  /** Preferred side of the trigger. */
  placement?: FloatingPlacement
  /** Dispatched after the menu opens. */
  'onui-open'?: (event: CustomEvent<MenuButtonToggleDetail>) => void
  /** Dispatched after the menu closes. */
  'onui-close'?: (event: CustomEvent<MenuButtonToggleDetail>) => void
}

export interface UIContextMenuElementProps extends TimelessGlobalProps {
  /** Dispatched after the context menu opens. */
  'onui-open'?: (event: CustomEvent<ContextMenuToggleDetail>) => void
  /** Dispatched after the context menu closes. */
  'onui-close'?: (event: CustomEvent<ContextMenuToggleDetail>) => void
}

export interface UIToolbarElementProps extends TimelessGlobalProps {
  /** Arrow-key axis across the toolbar controls. */
  orientation?: ToolbarOrientation
}

export interface UIRadioGroupElementProps extends TimelessGlobalProps {
  /** Layout and arrow-key axis. */
  orientation?: ChoiceGroupOrientation
  /** The radio checked on load and after a form reset. Match one input’s `value`. Assign the `value` property for live changes. */
  value?: string
  /** Authored default and form-reset value, reflecting the `value` attribute. */
  defaultValue?: string
  /** Cancelable proposal dispatched before the checked radio changes. Call `preventDefault()` to reject the transition and keep the current value. */
  'onui-before-change'?: (event: CustomEvent<RadioGroupChangeDetail>) => void
  /** Dispatched after the checked radio has changed. Bubbles and is composed. */
  'onui-change'?: (event: CustomEvent<RadioGroupChangeDetail>) => void
}

export interface UICheckboxGroupElementProps extends TimelessGlobalProps {
  /** Layout and arrow-key axis. */
  orientation?: ChoiceGroupOrientation
  /** Cancelable proposal dispatched before the set of checked boxes changes. Call `preventDefault()` to reject the transition and keep the current value. */
  'onui-before-change'?: (event: CustomEvent<CheckboxGroupChangeDetail>) => void
  /** Dispatched after the set of checked boxes has changed. Bubbles and is composed. */
  'onui-change'?: (event: CustomEvent<CheckboxGroupChangeDetail>) => void
}

export interface UIListboxElementProps extends TimelessGlobalProps {
  /** Present to allow more than one selected option, submitting one form entry per value under the same `name`. */
  multiple?: boolean
  /** The option selected on load and after a form reset. Assign the `value` property for live changes; once the user commits a change the attribute stops applying, the way it does on a native input. */
  value?: string
  /** Form field name. The element submits its own value through `ElementInternals`. */
  name?: string
  /** Present to block submission while nothing is selected, with `valueMissing`. */
  required?: boolean
  /** Present to disable the control. A control inside a disabled `<fieldset>` is disabled too, and submits nothing either way. */
  disabled?: boolean
  /** Options to render per page. Absent means unpaged, which is the default and adds no pager. The resolved number is available on the read-only `pageCount` property. */
  'page-size'?: number
  /** Authored default and form-reset value, reflecting the `value` attribute. */
  defaultValue?: string
  /** DOM property reflecting the `page-size` attribute. */
  pageSize?: string
  /** Cancelable proposal dispatched before the selection changes. Call `preventDefault()` to reject the transition and keep the current value. */
  'onui-before-change'?: (event: CustomEvent<ListboxChangeDetail>) => void
  /** Dispatched after the selection has changed. Bubbles and is composed. */
  'onui-change'?: (event: CustomEvent<ListboxChangeDetail>) => void
  /** Dispatched after the rendered page of a paged list changes. */
  'onui-page'?: (event: CustomEvent<ListboxPageDetail>) => void
}

export interface UISelectElementProps extends TimelessGlobalProps {
  /** Present to render the listbox open on load. */
  open?: boolean
  /** Preferred side of the trigger for the listbox surface. */
  placement?: FloatingPlacement
  /** Present to filter from a `search` field inside the surface. Focus moves into that field on open and stays there; the highlight travels through `aria-activedescendant`. */
  searchable?: boolean
  /** The option selected on load and after a form reset. Once the user commits a change the attribute stops applying, the way it does on a native input. */
  value?: string
  /** Which edge of the trigger the surface aligns to. The surface is never narrower than the trigger. */
  align?: CollectionAlignment
  /** How typed text narrows the options. `off` hands visibility to you: listen for `ui-input` and set `hidden` yourself, and navigation, the empty state, group collapse, and paging all follow. */
  filter?: OptionFilterMode
  /** Present to allow more than one selected option. Selected values render as chips and submit one form entry each under the same `name`. */
  multiple?: boolean
  /** Form field name. The element submits its own value through `ElementInternals`. */
  name?: string
  /** Present to block submission while nothing is selected, with `valueMissing`. */
  required?: boolean
  /** Present to disable the control. A control inside a disabled `<fieldset>` is disabled too, and submits nothing either way. */
  disabled?: boolean
  /** Options to render per page. Absent means unpaged, which is the default and adds no pager. The resolved number is available on the read-only `pageCount` property. */
  'page-size'?: number
  /** Authored default and form-reset value, reflecting the `value` attribute. */
  defaultValue?: string
  /** DOM property reflecting the `page-size` attribute. */
  pageSize?: string
  /** Cancelable proposal dispatched before the selected option changes. Call `preventDefault()` to reject the transition and keep the current value. */
  'onui-before-change'?: (event: CustomEvent<SelectChangeDetail>) => void
  /** Dispatched after the selected option has changed. Bubbles and is composed. */
  'onui-change'?: (event: CustomEvent<SelectChangeDetail>) => void
  /** Dispatched after the listbox opens. */
  'onui-open'?: (event: CustomEvent<SelectToggleDetail>) => void
  /** Dispatched after the listbox closes. */
  'onui-close'?: (event: CustomEvent<SelectToggleDetail>) => void
  /** Dispatched when the query text changes, before options are filtered. Under `filter="off"` this is where you set `hidden` yourself. */
  'onui-input'?: (event: CustomEvent<SelectInputDetail>) => void
  /** Dispatched after the rendered page of a paged list changes. */
  'onui-page'?: (event: CustomEvent<SelectPageDetail>) => void
}

export interface UIComboboxElementProps extends TimelessGlobalProps {
  /** The option selected on load and after a form reset. Once the user commits a change the attribute stops applying, the way it does on a native input. */
  value?: string
  /** Which edge of the trigger the surface aligns to. The surface is never narrower than the trigger. */
  align?: CollectionAlignment
  /** How typed text narrows the options. `off` hands visibility to you: listen for `ui-input` and set `hidden` yourself, and navigation, the empty state, group collapse, and paging all follow. */
  filter?: OptionFilterMode
  /** Present to allow more than one selected option. Selected values render as chips and submit one form entry each under the same `name`. */
  multiple?: boolean
  /** Form field name. The element submits its own value through `ElementInternals`. */
  name?: string
  /** Present to block submission while nothing is selected, with `valueMissing`. */
  required?: boolean
  /** Present to disable the control. A control inside a disabled `<fieldset>` is disabled too, and submits nothing either way. */
  disabled?: boolean
  /** Options to render per page. Absent means unpaged, which is the default and adds no pager. The resolved number is available on the read-only `pageCount` property. */
  'page-size'?: number
  /** Authored default and form-reset value, reflecting the `value` attribute. */
  defaultValue?: string
  /** DOM property reflecting the `page-size` attribute. */
  pageSize?: string
  /** Cancelable proposal dispatched before the selected option changes. Call `preventDefault()` to reject the transition and keep the current value. */
  'onui-before-change'?: (event: CustomEvent<ComboboxChangeDetail>) => void
  /** Dispatched after the selected option has changed. Bubbles and is composed. */
  'onui-change'?: (event: CustomEvent<ComboboxChangeDetail>) => void
  /** Dispatched after the listbox opens. */
  'onui-open'?: (event: CustomEvent<ComboboxToggleDetail>) => void
  /** Dispatched after the listbox closes. */
  'onui-close'?: (event: CustomEvent<ComboboxToggleDetail>) => void
  /** Dispatched when the query text changes, before options are filtered. Under `filter="off"` this is where you set `hidden` yourself. */
  'onui-input'?: (event: CustomEvent<ComboboxInputDetail>) => void
  /** Dispatched after the rendered page of a paged list changes. */
  'onui-page'?: (event: CustomEvent<ComboboxPageDetail>) => void
}

export interface UIToasterElementProps extends TimelessGlobalProps {
  /** Corner or edge of the viewport the toasts stack against. */
  placement?: ToasterPlacement
  /** Whether queued toasts overlap into a deck (`overlap`) or lay out as a full list (`list`). */
  stack?: ToasterStack
}

export interface UIToastElementProps extends TimelessGlobalProps {
  /** Milliseconds before the toast dismisses itself. `0` keeps it open until dismissed. */
  duration?: number
  /** Present to disable auto-dismiss regardless of `duration`. */
  persistent?: boolean
  /** Dispatched when the toast is dismissed. The detail names the reason: a timeout, the close control, or the imperative API. */
  'onui-dismiss'?: (event: CustomEvent<ToastDismissDetail>) => void
}

export interface UIToggleGroupElementProps extends TimelessGlobalProps {
  /** Present to join the buttons into one segmented control. Styling only, resolved by `toggle.css`. */
  attached?: boolean
  /** Layout and arrow-key axis. */
  orientation?: ToggleGroupOrientation
  /** Whether pressing one button releases the others (`single`) or toggles independently (`multiple`). */
  selection?: ToggleGroupSelection
  /** Cancelable proposal dispatched before the pressed set changes. Call `preventDefault()` to reject the transition and keep the current value. */
  'onui-before-change'?: (event: CustomEvent<ToggleGroupChangeDetail>) => void
  /** Dispatched after the pressed set has changed. Bubbles and is composed. */
  'onui-change'?: (event: CustomEvent<ToggleGroupChangeDetail>) => void
}

export interface UINumberStepperElementProps extends TimelessGlobalProps {
  /** Native `input` event dispatched on the inner number input after each step. */
  oninput?: (event: Event) => void
  /** Native `change` event dispatched on the inner number input. */
  onchange?: (event: Event) => void
}

export interface UIColorPickerElementProps extends TimelessGlobalProps {
  /** Color space the channel controls edit and the raw input round-trips through. The picker converts the current value when this changes. */
  format?: ColorPickerFormat
  /** Initial and form-reset color, in any CSS color syntax. Unlike the collection elements, the picker reflects one `value` property rather than a separate authored default. */
  value?: string
  /** Native `input` event dispatched while the color is being edited. */
  oninput?: (event: Event) => void
  /** Native `change` event dispatched when the edit is committed. */
  onchange?: (event: Event) => void
}

export interface UIFormElementProps extends TimelessGlobalProps {
  /** Dispatched after `setErrors` has put at least one message on a control, naming the fields that matched. Clearing errors dispatches nothing. */
  'onui-invalid'?: (event: CustomEvent<FormInvalidDetail>) => void
}

export interface UIRangeFieldElementProps extends TimelessGlobalProps {
  /** Dispatched after either thumb moves, carrying the clamped pair and which thumb moved. Bubbles and is composed. */
  'onui-change'?: (event: CustomEvent<RangeFieldChangeDetail>) => void
}

export interface UIOtpFieldElementProps extends TimelessGlobalProps {
  /** Form field name. The joined code submits as one entry through `ElementInternals`; the cells themselves carry no `name`. */
  name?: string
  /** How many characters the code has. Defaults to the number of authored cells, and is what a partly filled field is measured against. */
  length?: number
  /** The code on load and after a form reset. Assign the `value` property for live changes; once the user types, the attribute stops applying, the way it does on a native input. */
  value?: string
  /** Present to block submission while the field is empty, with `valueMissing`. */
  required?: boolean
  /** Present to disable the field. A field inside a disabled `<fieldset>` is disabled too, and submits nothing either way. */
  disabled?: boolean
  /** Authored default and form-reset value, reflecting the `value` attribute. */
  defaultValue?: string
  /** Cancelable proposal dispatched before the code changes. Call `preventDefault()` to reject the transition and keep the current value. */
  'onui-before-change'?: (event: CustomEvent<OtpFieldChangeDetail>) => void
  /** Dispatched after the code has changed. Bubbles and is composed. */
  'onui-change'?: (event: CustomEvent<OtpFieldChangeDetail>) => void
  /** Dispatched once every character the field expects has been entered, which is where an auto-submit belongs. */
  'onui-complete'?: (event: CustomEvent<OtpFieldCompleteDetail>) => void
}

export interface UICopyButtonElementProps extends TimelessGlobalProps {
  /** The literal text to copy. Wins over `from` on presence rather than content, the way `value` does on an option: an explicit `value=""` is the author saying to copy nothing. */
  value?: string
  /** Id of the element to read instead of `value`. An `input`, `textarea`, or `select` gives its current `value`; anything else gives its text. Read at activation rather than cached, so this is the one to reach for when the text is long or changes: it stays current on its own, and nothing is duplicated into an attribute. Assigning the `value` property works too, but a long string then reflects into the DOM. */
  from?: string
  /** Milliseconds the `--copied` state persists after a successful copy, and with it the text in the `status` region — the two clear together, so copying the same value twice is announced twice. `0` clears both on the next task, which is short enough that a screen reader may miss the announcement. */
  'feedback-duration'?: number
  /** What the `status` region announces after a successful copy. Falls back to the `copied` part’s text, so a button whose confirmation is a word needs no message at all and an icon-only one does. With neither, nothing is announced. */
  'copied-message'?: string
  /** DOM property reflecting the `feedback-duration` attribute. */
  feedbackDuration?: string
  /** DOM property reflecting the `copied-message` attribute. */
  copiedMessage?: string
  /** Cancelable proposal dispatched before anything is written, carrying the resolved `value`. Call `preventDefault()` to reject the copy, and no `ui-copy` follows. Or call `detail.respondWith(promise)` to perform the write yourself — which is how you copy an image, a blob, or `text/html`, since `writeText` carries a string and nothing else. The element then awaits your promise and drives `--copied`, the announcement, and `ui-copy` from its outcome, so a confirmation never claims a copy that did not happen. Call it synchronously, and call your own clipboard method synchronously too — the click’s transient user activation is the same one the element depends on. `ClipboardItem` accepts a promised blob, so `new ClipboardItem({ 'image/png': blobPromise })` starts the write immediately while the data resolves. */
  'onui-before-copy'?: (event: CustomEvent<CopyProposalDetail>) => void
  /** Dispatched once per activation, on success and on every failure, unless a listener cancelled the proposal. The detail carries `status`, the resolved `value`, and a `reason` naming what went wrong: `empty` when nothing resolved, `unsupported` when there is no Clipboard API, `denied` when the browser refused the write, and `rejected` when a `respondWith` promise failed. */
  'onui-copy'?: (event: CustomEvent<CopyDetail>) => void
}

export interface TimelessIntrinsicElements {
  'ui-tabs': UITabsElementProps
  'ui-dialog': UIDialogElementProps
  'ui-sheet': UISheetElementProps
  'ui-popover': UIPopoverElementProps
  'ui-hover-card': UIHoverCardElementProps
  'ui-menu': UIMenuElementProps
  'ui-menu-button': UIMenuButtonElementProps
  'ui-context-menu': UIContextMenuElementProps
  'ui-toolbar': UIToolbarElementProps
  'ui-radio-group': UIRadioGroupElementProps
  'ui-checkbox-group': UICheckboxGroupElementProps
  'ui-listbox': UIListboxElementProps
  'ui-select': UISelectElementProps
  'ui-combobox': UIComboboxElementProps
  'ui-toaster': UIToasterElementProps
  'ui-toast': UIToastElementProps
  'ui-toggle-group': UIToggleGroupElementProps
  'ui-number-stepper': UINumberStepperElementProps
  'ui-color-picker': UIColorPickerElementProps
  'ui-form': UIFormElementProps
  'ui-range-field': UIRangeFieldElementProps
  'ui-otp-field': UIOtpFieldElementProps
  'ui-copy-button': UICopyButtonElementProps
}

// @ts-ignore React 19 is an optional consumer dependency.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends TimelessIntrinsicElements {}
  }
}

// @ts-ignore React 19 is an optional consumer dependency.
declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements extends TimelessIntrinsicElements {}
  }
}

export {}
