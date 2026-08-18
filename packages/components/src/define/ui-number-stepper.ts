import { createNumberStepperElementClass } from '../number-stepper'
import { defineRegisteredElement } from './registry'

export function defineNumberStepperElement(
  targetWindow: Window = window,
): CustomElementConstructor {
  return defineRegisteredElement('ui-number-stepper', createNumberStepperElementClass, targetWindow)
}
