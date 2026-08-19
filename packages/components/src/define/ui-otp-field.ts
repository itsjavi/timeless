import { createOtpFieldElementClass } from '../otp-field'
import { defineRegisteredElement } from './registry'

export function defineOtpFieldElement(targetWindow: Window = window): CustomElementConstructor {
  return defineRegisteredElement('ui-otp-field', createOtpFieldElementClass, targetWindow)
}
