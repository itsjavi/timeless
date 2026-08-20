import { describe, expect, it } from 'vitest'
import {
  colorChannels,
  colorPickerFormatGamut,
  colorPickerFormats,
  resolveColorPickerFormat,
  updateColorChannel,
} from './color-picker'
import { parseAnyColor, parseCssColor } from '@timelessui/color'

const parsed = parseCssColor('oklch(0.7 0.18 250 / 0.8)')
if (parsed?.status !== 'parsed') throw new Error('Expected parsed fixture')

describe('color picker helpers', () => {
  it('resolves supported formats and defaults unknown values', () => {
    expect(resolveColorPickerFormat('p3')).toBe('p3')
    expect(resolveColorPickerFormat('raw')).toBe('oklch')
  })

  it('creates four channels for every editable format', () => {
    for (const format of colorPickerFormats) {
      const channels = colorChannels(parsed.oklch, format)
      expect(channels, format).toHaveLength(4)
      expect(channels.at(-1)?.key, format).toBe('alpha')
      for (const channel of channels) {
        expect(channel.value, `${format}.${channel.key}`).toBeGreaterThanOrEqual(channel.min)
        expect(channel.value, `${format}.${channel.key}`).toBeLessThanOrEqual(channel.max)
        expect(parseAnyColor(channel.swatch), `${format}.${channel.key}`).not.toBeNull()
      }
    }
  })

  it('edits every channel of every format back into a color', () => {
    for (const format of colorPickerFormats) {
      for (const channel of colorChannels(parsed.oklch, format)) {
        const midpoint = (channel.min + channel.max) / 2
        expect(
          updateColorChannel(parsed.oklch, format, channel.key, midpoint),
          `${format}.${channel.key}`,
        ).not.toBeNull()
      }
    }
  })

  it('reports the gamut each format can express', () => {
    expect(colorPickerFormatGamut('hex')).toBe('srgb')
    expect(colorPickerFormatGamut('hwb')).toBe('srgb')
    expect(colorPickerFormatGamut('p3')).toBe('p3')
    expect(colorPickerFormatGamut('rec2020')).toBe('rec2020')
    expect(colorPickerFormatGamut('lch')).toBeNull()
  })

  it('updates native P3 channels without applying sRGB semantics', () => {
    const next = updateColorChannel(parsed.oklch, 'p3', 'r', 0.2)
    expect(next).not.toBeNull()
    expect(next?.alpha).toBe(0.8)
  })
})
