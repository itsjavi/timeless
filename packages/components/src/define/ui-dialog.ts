import { createDialogElementClass } from '../dialog'
import { defineRegisteredElement } from './registry'

export function defineDialogElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-dialog', createDialogElementClass, targetWindow)
}
