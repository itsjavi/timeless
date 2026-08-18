import { createMenuElementClass } from '../menu'
import { defineRegisteredElement } from './registry'

export function defineMenuElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-menu', createMenuElementClass, targetWindow)
}
