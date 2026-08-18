import { createCheckboxGroupElementClass } from '../choice-group'
import { defineRegisteredElement } from './registry'

export function defineCheckboxGroupElement(
  targetWindow: Window = window,
): CustomElementConstructor {
  return defineRegisteredElement('ui-checkbox-group', createCheckboxGroupElementClass, targetWindow)
}
