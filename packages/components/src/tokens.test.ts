import { describe, expect, it } from 'vitest'
import { uiTokenGroups, uiTokens, isUIToken } from './tokens'

describe('atmosphere token contract', () => {
  it('exposes stable token groups for surfaces, controls, radius, and shadows', () => {
    expect(uiTokenGroups.color).toContain('--ui-bg-surface')
    expect(uiTokenGroups.controlFill).toContain('--ui-bg-control-hover')
    expect(uiTokenGroups.radius).toContain('--ui-radius-control')
    expect(uiTokenGroups.shadow).toContain('--ui-shadow-floating')
  })

  it('validates public CSS custom property names', () => {
    expect(uiTokens).toContain('--ui-bg-accent')
    expect(isUIToken('--ui-shadow-control')).toBe(true)
    expect(isUIToken('--ti-shadow-control')).toBe(false)
  })

  /** The token list and `tokens.css` are held in step by `scripts/validate-contracts.mjs`. */
  it('assigns every token to exactly one group', () => {
    expect(new Set(uiTokens).size).toBe(uiTokens.length)
  })
})
