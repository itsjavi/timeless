import { createSheetElementClass } from '../sheet'
import { defineRegisteredElement } from './registry'

export function defineSheetElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-sheet', createSheetElementClass, targetWindow)
}
