import { createComboboxElementClass } from '../combobox'
import { defineRegisteredElement } from './registry'

export function defineComboboxElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-combobox', createComboboxElementClass, targetWindow)
}
