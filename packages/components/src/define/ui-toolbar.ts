import { createToolbarElementClass } from '../toolbar'
import { defineRegisteredElement } from './registry'

export function defineToolbarElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-toolbar', createToolbarElementClass, targetWindow)
}
