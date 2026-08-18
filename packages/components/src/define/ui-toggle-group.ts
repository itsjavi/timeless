import { createToggleGroupElementClass } from '../toggle-group'
import { defineRegisteredElement } from './registry'

export function defineToggleGroupElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-toggle-group', createToggleGroupElementClass, targetWindow)
}
