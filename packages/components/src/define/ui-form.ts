import { createFormElementClass } from '../form'
import { defineRegisteredElement } from './registry'

export function defineFormElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-form', createFormElementClass, targetWindow)
}
