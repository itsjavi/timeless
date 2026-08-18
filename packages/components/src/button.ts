export const buttonVariants = [
  'primary',
  'secondary',
  'outline',
  'ghost',
  'danger',
  'danger-outline',
  'link',
] as const
export type ButtonVariant = (typeof buttonVariants)[number]

export const buttonSizes = ['sm', 'md', 'lg'] as const
export type ButtonSize = (typeof buttonSizes)[number]

export function isButtonVariant(value: string): value is ButtonVariant {
  return buttonVariants.includes(value as ButtonVariant)
}

export function isButtonSize(value: string): value is ButtonSize {
  return buttonSizes.includes(value as ButtonSize)
}
