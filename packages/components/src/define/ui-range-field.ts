import { createRangeFieldElementClass } from '../range-field'
import { defineRegisteredElement } from './registry'

export function defineRangeFieldElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-range-field', createRangeFieldElementClass, targetWindow)
}
