import { createMenuButtonElementClass } from '../menu-button'
import { defineRegisteredElement } from './registry'

export function defineMenuButtonElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-menu-button', createMenuButtonElementClass, targetWindow)
}
