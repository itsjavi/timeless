/** Permitted values for `ui-button` `data-ui-variant` and `ui-toggle` `data-ui-variant`. */
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

/** Permitted values for `ui-button` `data-ui-size` and `ui-toggle` `data-ui-size`. */
export const buttonSizes = ['sm', 'md', 'lg'] as const
export type ButtonSize = (typeof buttonSizes)[number]
