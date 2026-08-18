import { createToastElementClass } from '../toast'
import { defineRegisteredElement } from './registry'

export function defineToastElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-toast', createToastElementClass, targetWindow)
}
