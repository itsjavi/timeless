import { describe, expect, it } from 'vitest'
import {
  clampToGamut,
  colorFormatGamut,
  hwbToRgb,
  inGamut,
  labToOklch,
  lchToOklch,
  oklchToLab,
  oklchToLch,
  oklchToP3,
  oklchToRec2020,
  oklchToRgb,
  p3ToOklch,
  parseAnyColor,
  parseCssColor,
  rec2020ToOklch,
  rgbToHex,
  rgbToHwb,
  serializeCssColor,
} from './color'
import { wcagAALevel, wcagAAALevel, wcagContrastRatio } from './contrast'

describe('CSS color parsing and serialization', () => {
  it('parses the editable CSS color formats and angle units', () => {
    const colors = [
      '#ff000080',
      'rebeccapurple',
      'rgb(255 0 0 / 50%)',
      'hsl(0.5turn 100% 50%)',
      'hwb(3.141592653589793rad 10% 20%)',
      'lab(60% 20 30)',
      'lch(60% 35 0.25turn)',
      'oklab(0.7 0.1 -0.1)',
      'oklch(70% 0.18 30)',
      'color(display-p3 1 0.4 0 / 0.8)',
    ]

    for (const value of colors) expect(parseCssColor(value)?.status, value).toBe('parsed')
  })

  it('preserves contextual colors and rejects malformed values', () => {
    for (const value of [
      'currentColor',
      'var(--brand)',
      'light-dark(red, blue)',
      'color-mix(in oklab, red, blue)',
    ]) {
      expect(parseCssColor(value)).toMatchObject({ status: 'preserved', raw: value })
    }
    expect(parseCssColor('not-a-color')).toBeNull()
    expect(parseCssColor('rgb(nope 0 0)')).toBeNull()
    expect(parseCssColor('rgb(0 0 0 / nope)')).toBeNull()
    expect(parseCssColor('var(')).toBeNull()
    expect(parseCssColor('light-dark(red)')).toBeNull()
  })

  it('serializes each picker format', () => {
    const parsed = parseCssColor('oklch(0.7 0.1 250 / 0.8)')!
    expect(serializeCssColor(parsed, 'oklch')).toMatch(/^oklch\(/)
    expect(serializeCssColor(parsed, 'oklab')).toMatch(/^oklab\(/)
    expect(serializeCssColor(parsed, 'rgb')).toMatch(/^rgb\(/)
    expect(serializeCssColor(parsed, 'hsl')).toMatch(/^hsl\(/)
    expect(serializeCssColor(parsed, 'p3')).toMatch(/^color\(display-p3 /)
  })
})

describe('gamut and conversion', () => {
  it('round trips Display P3 channels through OKLCH', () => {
    const original = { r: 0.9, g: 0.2, b: 0.1, alpha: 0.75 }
    const roundTrip = oklchToP3(p3ToOklch(original))
    expect(roundTrip.r).toBeCloseTo(original.r, 5)
    expect(roundTrip.g).toBeCloseTo(original.g, 5)
    expect(roundTrip.b).toBeCloseTo(original.b, 5)
    expect(roundTrip.alpha).toBe(0.75)
  })

  it('distinguishes P3 from sRGB and clamps chroma into a requested gamut', () => {
    const wide = p3ToOklch({ r: 1, g: 0, b: 0, alpha: 1 })
    expect(inGamut(wide, 'p3').in).toBe(true)
    expect(inGamut(wide, 'srgb').in).toBe(false)
    expect(inGamut(clampToGamut(wide, 'srgb'), 'srgb').in).toBe(true)
  })
})

describe('contrast', () => {
  it('calculates WCAG contrast and thresholds', () => {
    const black = parseCssColor('black')!
    const white = parseCssColor('white')!
    if (black.status !== 'parsed' || white.status !== 'parsed') throw new Error('Expected colors')
    const ratio = wcagContrastRatio(black.oklch, white.oklch)
    expect(ratio).toBeCloseTo(21, 3)
    expect(wcagAALevel(ratio, 'normal-text').pass).toBe(true)
    expect(wcagAAALevel(4.5, 'normal-text').pass).toBe(false)
  })
})

describe('baseline color formats', () => {
  const fixtures = ['oklch(0.7 0.18 250)', 'red', '#3366cc', 'hsl(191 100% 67%)', 'lab(45% 20 -30)']

  for (const raw of fixtures) {
    it(`round trips ${raw} through every editable format`, () => {
      const parsedColor = parseCssColor(raw)
      if (parsedColor?.status !== 'parsed') throw new Error(`Expected ${raw} to parse`)
      const color = parsedColor.oklch

      for (const format of [
        'oklab',
        'lab',
        'lch',
        'hex',
        'rgb',
        'hsl',
        'hwb',
        'p3',
        'rec2020',
      ] as const) {
        const gamut = colorFormatGamut(format)
        const expected = gamut ? clampToGamut(color, gamut) : color
        const serialized = serializeCssColor(parsedColor, format)
        const reparsed = parseCssColor(serialized)
        expect(reparsed?.status, `${format} -> ${serialized}`).toBe('parsed')
        if (reparsed?.status !== 'parsed') continue
        expect(reparsed.oklch.l, `${format} -> ${serialized}`).toBeCloseTo(expected.l, 2)
        expect(reparsed.oklch.c, `${format} -> ${serialized}`).toBeCloseTo(expected.c, 2)
      }
    })
  }

  it('converts to and from CIE Lab, LCH, HWB, and Rec2020', () => {
    const color = { l: 0.62, c: 0.18, h: 32, alpha: 1 }
    expect(labToOklch(oklchToLab(color)).c).toBeCloseTo(color.c, 6)
    expect(lchToOklch(oklchToLch(color)).h).toBeCloseTo(color.h, 4)
    expect(rec2020ToOklch(oklchToRec2020(color)).l).toBeCloseTo(color.l, 6)
    const rgb = oklchToRgb(color)
    const hwb = rgbToHwb(rgb)
    expect(hwbToRgb(hwb).r).toBeCloseTo(rgb.r, 6)
  })

  it('parses the supported color() spaces and preserves the rest', () => {
    expect(parseCssColor('color(srgb 0.2 0.4 0.8)')?.format).toBe('rgb')
    expect(parseCssColor('color(rec2020 0.4 0.6 1)')?.format).toBe('rec2020')
    expect(parseCssColor('color(prophoto-rgb 0.4 0.6 1)')?.status).toBe('preserved')
  })

  it('serializes hex with and without alpha', () => {
    expect(rgbToHex({ r: 1, g: 0, b: 0, alpha: 1 })).toBe('#ff0000')
    expect(rgbToHex({ r: 0, g: 0, b: 0, alpha: 0.5 })).toBe('#00000080')
  })

  it('keeps serialized output inside the gamut each format can express', () => {
    const wide = parseCssColor('oklch(0.7 0.37 250)')
    if (wide?.status !== 'parsed') throw new Error('Expected a parsed fixture')
    expect(serializeCssColor(wide, 'hwb')).not.toContain('-')
    expect(inGamut(parseAnyColor(serializeCssColor(wide, 'rgb'))!, 'srgb').in).toBe(true)
    expect(inGamut(parseAnyColor(serializeCssColor(wide, 'p3'))!, 'p3').in).toBe(true)
  })
})
