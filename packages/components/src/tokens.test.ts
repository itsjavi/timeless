import { describe, expect, it } from 'vitest'
import { atmosphereTokenGroups, atmosphereTokens, isAtmosphereToken } from './tokens'

describe('atmosphere token contract', () => {
  it('exposes stable token groups for surfaces, controls, radius, and shadows', () => {
    expect(atmosphereTokenGroups.color).toContain('--ui-bg-surface')
    expect(atmosphereTokenGroups.controlFill).toContain('--ui-bg-control-hover')
    expect(atmosphereTokenGroups.radius).toContain('--ui-radius-control')
    expect(atmosphereTokenGroups.shadow).toContain('--ui-shadow-floating')
  })

  it('validates public CSS custom property names', () => {
    expect(atmosphereTokens).toContain('--ui-bg-accent')
    expect(isAtmosphereToken('--ui-shadow-control')).toBe(true)
    expect(isAtmosphereToken('--ti-shadow-control')).toBe(false)
  })

  /** The token list and `tokens.css` are held in step by `scripts/validate-contracts.mjs`. */
  it('assigns every token to exactly one group', () => {
    expect(new Set(atmosphereTokens).size).toBe(atmosphereTokens.length)
  })
})
