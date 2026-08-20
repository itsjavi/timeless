import { createContextMenuElementClass } from '../context-menu'
import { defineRegisteredElement } from './registry'

export function defineContextMenuElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-context-menu', createContextMenuElementClass, targetWindow)
}
