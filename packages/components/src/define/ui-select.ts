import { createSelectElementClass } from '../select'
import { defineRegisteredElement } from './registry'

export function defineSelectElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-select', createSelectElementClass, targetWindow)
}
