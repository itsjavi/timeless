/** Permitted values for `ui-popover` `role`. */
export const popoverRoles = ['dialog', 'menu', 'listbox', 'tooltip'] as const
export type PopoverRole = (typeof popoverRoles)[number]
