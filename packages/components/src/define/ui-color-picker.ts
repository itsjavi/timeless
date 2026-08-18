import { createColorPickerElementClass } from '../color-picker'
import { defineRegisteredElement } from './registry'

export function defineColorPickerElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-color-picker', createColorPickerElementClass, targetWindow)
}
