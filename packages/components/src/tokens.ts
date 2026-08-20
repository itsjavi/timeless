/**
 * The `--ui-*` vocabulary every Timeless stylesheet reads, grouped by purpose. These are names, not
 * values: Atmosphere declares one set of values for them in `themes/atmosphere/tokens.css`, and a
 * second theme declares the same names. `validate-contracts.mjs` proves the list against that
 * stylesheet in both directions.
 */
export type UITokenName = `--ui-${string}`

export const uiTokenGroups = {
  color: [
    '--ui-bg-page',
    '--ui-bg-surface',
    '--ui-bg-surface-raised',
    '--ui-bg-surface-subtle',
    '--ui-fg',
    '--ui-fg-muted',
    '--ui-fg-subtle',
    '--ui-line',
    '--ui-line-strong',
    '--ui-accent',
    '--ui-accent-hover',
    '--ui-accent-active',
    '--ui-accent-soft',
    '--ui-success',
    '--ui-success-soft',
    '--ui-warning',
    '--ui-warning-soft',
    '--ui-danger',
    '--ui-danger-soft',
    '--ui-focus',
  ],
  controlFill: [
    '--ui-bg-control',
    '--ui-bg-control-hover',
    '--ui-bg-control-active',
    '--ui-bg-control-muted',
    '--ui-bg-accent',
    '--ui-bg-accent-hover',
    '--ui-bg-accent-active',
    '--ui-bg-danger',
    '--ui-bg-danger-hover',
    '--ui-bg-danger-active',
  ],
  radius: [
    '--ui-radius-xs',
    '--ui-radius-sm',
    '--ui-radius-md',
    '--ui-radius-lg',
    '--ui-radius-xl',
    '--ui-radius-control',
    '--ui-radius-pill',
  ],
  shadow: [
    '--ui-shadow-control',
    '--ui-shadow-control-hover',
    '--ui-shadow-control-active',
    '--ui-shadow-control-accent',
    '--ui-shadow-control-danger',
    '--ui-shadow-outline-control',
    '--ui-shadow-floating',
    '--ui-shadow-tooltip',
    '--ui-shadow-inset',
  ],
  space: ['--ui-space-1', '--ui-space-2', '--ui-space-3', '--ui-space-4', '--ui-space-5'],
  typography: ['--ui-font-sans', '--ui-font-mono'],
  motion: ['--ui-duration-fast', '--ui-ease-standard'],
  effect: ['--ui-disabled-opacity', '--ui-checkerboard', '--ui-checkerboard-ink'],
} as const satisfies Record<string, readonly UITokenName[]>

export type UITokenGroup = keyof typeof uiTokenGroups
export type UIToken = (typeof uiTokenGroups)[UITokenGroup][number]

export const uiTokens = Object.values(uiTokenGroups).flat() as UIToken[]

export function isUIToken(value: string): value is UIToken {
  return uiTokens.includes(value as UIToken)
}
