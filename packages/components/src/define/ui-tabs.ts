import { createTabsElementClass } from '../tabs'
import { defineRegisteredElement } from './registry'

export function defineTabsElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-tabs', createTabsElementClass, targetWindow)
}
