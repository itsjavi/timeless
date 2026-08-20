import { defineTabsElement } from './define/ui-tabs'
import { defineDialogElement } from './define/ui-dialog'
import { defineSheetElement } from './define/ui-sheet'
import { definePopoverElement } from './define/ui-popover'
import { defineHoverCardElement } from './define/ui-hover-card'
import { defineMenuElement } from './define/ui-menu'
import { defineMenuButtonElement } from './define/ui-menu-button'
import { defineContextMenuElement } from './define/ui-context-menu'
import { defineToolbarElement } from './define/ui-toolbar'
import { defineRadioGroupElement } from './define/ui-radio-group'
import { defineCheckboxGroupElement } from './define/ui-checkbox-group'
import { defineListboxElement } from './define/ui-listbox'
import { defineSelectElement } from './define/ui-select'
import { defineComboboxElement } from './define/ui-combobox'
import { defineToasterElement } from './define/ui-toaster'
import { defineToastElement } from './define/ui-toast'
import { defineToggleGroupElement } from './define/ui-toggle-group'
import { defineNumberStepperElement } from './define/ui-number-stepper'
import { defineColorPickerElement } from './define/ui-color-picker'
import { defineFormElement } from './define/ui-form'
import { defineRangeFieldElement } from './define/ui-range-field'
import { defineOtpFieldElement } from './define/ui-otp-field'
import { defineCopyButtonElement } from './define/ui-copy-button'

export {
  defineTabsElement,
  defineDialogElement,
  defineSheetElement,
  definePopoverElement,
  defineHoverCardElement,
  defineMenuElement,
  defineMenuButtonElement,
  defineContextMenuElement,
  defineToolbarElement,
  defineRadioGroupElement,
  defineCheckboxGroupElement,
  defineListboxElement,
  defineSelectElement,
  defineComboboxElement,
  defineToasterElement,
  defineToastElement,
  defineToggleGroupElement,
  defineNumberStepperElement,
  defineColorPickerElement,
  defineFormElement,
  defineRangeFieldElement,
  defineOtpFieldElement,
  defineCopyButtonElement,
}

export function defineTimelessElements(targetWindow: Window = window): void {
  defineTabsElement(targetWindow)
  defineDialogElement(targetWindow)
  defineSheetElement(targetWindow)
  definePopoverElement(targetWindow)
  defineHoverCardElement(targetWindow)
  defineMenuElement(targetWindow)
  defineMenuButtonElement(targetWindow)
  defineContextMenuElement(targetWindow)
  defineToolbarElement(targetWindow)
  defineRadioGroupElement(targetWindow)
  defineCheckboxGroupElement(targetWindow)
  defineListboxElement(targetWindow)
  defineSelectElement(targetWindow)
  defineComboboxElement(targetWindow)
  defineToasterElement(targetWindow)
  defineToastElement(targetWindow)
  defineToggleGroupElement(targetWindow)
  defineNumberStepperElement(targetWindow)
  defineColorPickerElement(targetWindow)
  defineFormElement(targetWindow)
  defineRangeFieldElement(targetWindow)
  defineOtpFieldElement(targetWindow)
  defineCopyButtonElement(targetWindow)
}
