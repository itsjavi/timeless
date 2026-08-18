import { createRadioGroupElementClass } from '../choice-group'
import { defineRegisteredElement } from './registry'

export function defineRadioGroupElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-radio-group', createRadioGroupElementClass, targetWindow)
}
