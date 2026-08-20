import { createCopyButtonElementClass } from '../copy-button'
import { defineRegisteredElement } from './registry'

export function defineCopyButtonElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-copy-button', createCopyButtonElementClass, targetWindow)
}
