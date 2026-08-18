import { createListboxElementClass } from '../listbox'
import { defineRegisteredElement } from './registry'

export function defineListboxElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-listbox', createListboxElementClass, targetWindow)
}
