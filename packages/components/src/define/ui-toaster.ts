import { createToasterElementClass } from '../toast'
import { defineRegisteredElement } from './registry'

export function defineToasterElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-toaster', createToasterElementClass, targetWindow)
}
