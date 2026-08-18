import { createPopoverElementClass } from '../popover'
import { defineRegisteredElement } from './registry'

export function definePopoverElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-popover', createPopoverElementClass, targetWindow)
}
