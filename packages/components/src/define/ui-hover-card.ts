import { createHoverCardElementClass } from '../hover-card'
import { defineRegisteredElement } from './registry'

export function defineHoverCardElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-hover-card', createHoverCardElementClass, targetWindow)
}
