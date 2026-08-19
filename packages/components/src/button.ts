import { buttonSizes, buttonVariants } from './values/button'
import type { ButtonSize, ButtonVariant } from './values/button'

export { buttonSizes, buttonVariants, type ButtonSize, type ButtonVariant }

export function isButtonVariant(value: string): value is ButtonVariant {
  return buttonVariants.includes(value as ButtonVariant)
}

export function isButtonSize(value: string): value is ButtonSize {
  return buttonSizes.includes(value as ButtonSize)
}
