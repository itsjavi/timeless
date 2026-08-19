import { attr, createUIElementClass, element, listen, watch } from '@timelessui/core'
import {
  clampToGamut,
  colorFormatGamut,
  hslToRgb,
  hwbToRgb,
  inGamut,
  labToOklch,
  lchToOklch,
  oklabToOklch,
  oklchToLab,
  oklchToLch,
  oklchToOklab,
  oklchToP3,
  oklchToRec2020,
  oklchToRgb,
  p3ToOklch,
  parseCssColor,
  rec2020ToOklch,
  rgbToHsl,
  rgbToHwb,
  rgbToOklch,
  serializeCssColor,
  type ColorFormat,
  type GamutTarget,
  type OklchColor,
  type ParsedColor,
  type RgbColor,
} from './color'
import { colorPickerFormats } from './values/color-picker'
import type { ColorPickerFormat } from './values/color-picker'

export { colorPickerFormats, type ColorPickerFormat }

export type ColorChannelDefinition = {
  readonly key: string
  readonly label: string
  readonly name: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly value: number
  readonly display: string
  readonly gradient: string
  /** The track color under the thumb at the current value. */
  readonly swatch: string
}

const RAW_SELECTOR = "input[data-ui-part~='input']"
const FORMAT_SELECTOR = "select[data-ui-part~='format']"
const CHANNEL_SELECTOR = "[data-ui-part~='channel']"
const CHANNEL_RANGE_SELECTOR = "input[data-ui-part~='channel-range']"
const CHANNEL_INPUT_SELECTOR = "input[data-ui-part~='channel-input']"
const WARNING_SELECTOR = "[data-ui-part~='warning']"
const GAMUT_SELECTOR = "[data-ui-part~='gamut']"
const CLAMP_SELECTOR = "[data-ui-part~='clamp']"
const COPY_SELECTOR = "[data-ui-part~='copy']"
const COPIED_DURATION = 1800
const INVALID_MESSAGE = 'Enter a supported CSS color value.'
const CONTEXTUAL_MESSAGE = 'This color needs page context before its channels can be edited.'

export function colorPickerFormatGamut(format: ColorPickerFormat): GamutTarget | null {
  return colorFormatGamut(format)
}

export function resolveGamutTarget(value: string | null): GamutTarget {
  return value === 'p3' || value === 'rec2020' ? value : 'srgb'
}

export function resolveColorPickerFormat(value: string | null): ColorPickerFormat {
  return colorPickerFormats.includes(value as ColorPickerFormat)
    ? (value as ColorPickerFormat)
    : 'oklch'
}

export function colorChannels(
  source: OklchColor,
  format: ColorPickerFormat,
): readonly ColorChannelDefinition[] {
  const gamut = colorPickerFormatGamut(format)
  const color = gamut ? clampToGamut(source, gamut) : source
  const alpha = alphaChannel(color)
  if (format === 'oklch') {
    return [
      channel({
        key: 'l',
        label: 'L',
        name: 'Lightness',
        max: 1,
        step: 0.001,
        value: color.l,
        display: color.l.toFixed(3),
        gradient: lightnessGradient(color),
        swatch: oklchCss(color),
      }),
      channel({
        key: 'c',
        label: 'C',
        name: 'Chroma',
        max: 0.4,
        step: 0.001,
        value: color.c,
        display: color.c.toFixed(3),
        gradient: `linear-gradient(to right, oklch(${color.l} 0 ${color.h}), oklch(${color.l} 0.4 ${color.h}))`,
        swatch: oklchCss(color),
      }),
      hueChannel(color.h, oklchHueBand),
      alpha,
    ]
  }
  if (format === 'oklab') {
    const lab = oklchToOklab(color)
    const labCss = `oklab(${lab.l} ${lab.a} ${lab.b})`
    return [
      channel({
        key: 'l',
        label: 'L',
        name: 'Lightness',
        max: 1,
        step: 0.001,
        value: lab.l,
        display: lab.l.toFixed(3),
        gradient: `linear-gradient(to right, oklab(0 ${lab.a} ${lab.b}), oklab(1 ${lab.a} ${lab.b}))`,
        swatch: labCss,
      }),
      channel({
        key: 'a',
        label: 'a',
        name: 'Green to red axis',
        min: -0.4,
        max: 0.4,
        step: 0.001,
        value: lab.a,
        display: lab.a.toFixed(3),
        gradient: `linear-gradient(to right, oklab(${lab.l} -0.4 ${lab.b}), oklab(${lab.l} 0.4 ${lab.b}))`,
        swatch: labCss,
      }),
      channel({
        key: 'b',
        label: 'b',
        name: 'Blue to yellow axis',
        min: -0.4,
        max: 0.4,
        step: 0.001,
        value: lab.b,
        display: lab.b.toFixed(3),
        gradient: `linear-gradient(to right, oklab(${lab.l} ${lab.a} -0.4), oklab(${lab.l} ${lab.a} 0.4))`,
        swatch: labCss,
      }),
      alpha,
    ]
  }
  if (format === 'hsl') {
    const hsl = rgbToHsl(oklchToRgb(color))
    const saturation = hsl.s * 100
    const lightness = hsl.l * 100
    const hslCss = `hsl(${hsl.h} ${saturation}% ${lightness}%)`
    return [
      hueChannel(hsl.h, hslHueBand),
      channel({
        key: 's',
        label: 'S',
        name: 'Saturation',
        max: 100,
        step: 1,
        value: saturation,
        display: saturation.toFixed(0),
        gradient: `linear-gradient(to right, hsl(${hsl.h} 0% ${lightness}%), hsl(${hsl.h} 100% ${lightness}%))`,
        swatch: hslCss,
      }),
      channel({
        key: 'l',
        label: 'L',
        name: 'Lightness',
        max: 100,
        step: 1,
        value: lightness,
        display: lightness.toFixed(0),
        gradient: `linear-gradient(to right, hsl(${hsl.h} ${saturation}% 0%), hsl(${hsl.h} ${saturation}% 50%), hsl(${hsl.h} ${saturation}% 100%))`,
        swatch: hslCss,
      }),
      alpha,
    ]
  }

  if (format === 'hwb') {
    const hwb = rgbToHwb(oklchToRgb(color))
    const white = hwb.w * 100
    const black = hwb.b * 100
    const hwbCss = `hwb(${hwb.h} ${white}% ${black}%)`
    return [
      hueChannel(hwb.h, hslHueBand),
      channel({
        key: 'w',
        label: 'W',
        name: 'Whiteness',
        max: 100,
        step: 1,
        value: white,
        display: white.toFixed(0),
        gradient: `linear-gradient(to right, hwb(${hwb.h} 0% ${black}%), hwb(${hwb.h} 100% ${black}%))`,
        swatch: hwbCss,
      }),
      channel({
        key: 'b',
        label: 'B',
        name: 'Blackness',
        max: 100,
        step: 1,
        value: black,
        display: black.toFixed(0),
        gradient: `linear-gradient(to right, hwb(${hwb.h} ${white}% 0%), hwb(${hwb.h} ${white}% 100%))`,
        swatch: hwbCss,
      }),
      alpha,
    ]
  }
  if (format === 'lab') {
    const lab = oklchToLab(color)
    const labCss = `lab(${lab.l}% ${lab.a} ${lab.b})`
    return [
      channel({
        key: 'l',
        label: 'L',
        name: 'Lightness',
        max: 100,
        step: 0.1,
        value: lab.l,
        display: lab.l.toFixed(1),
        gradient: `linear-gradient(to right, lab(0% ${lab.a} ${lab.b}), lab(100% ${lab.a} ${lab.b}))`,
        swatch: labCss,
      }),
      channel({
        key: 'a',
        label: 'a',
        name: 'Green to red axis',
        min: -125,
        max: 125,
        step: 0.1,
        value: lab.a,
        display: lab.a.toFixed(1),
        gradient: `linear-gradient(to right, lab(${lab.l}% -125 ${lab.b}), lab(${lab.l}% 125 ${lab.b}))`,
        swatch: labCss,
      }),
      channel({
        key: 'b',
        label: 'b',
        name: 'Blue to yellow axis',
        min: -125,
        max: 125,
        step: 0.1,
        value: lab.b,
        display: lab.b.toFixed(1),
        gradient: `linear-gradient(to right, lab(${lab.l}% ${lab.a} -125), lab(${lab.l}% ${lab.a} 125))`,
        swatch: labCss,
      }),
      alpha,
    ]
  }
  if (format === 'lch') {
    const lch = oklchToLch(color)
    const lchCss = `lch(${lch.l}% ${lch.c} ${lch.h})`
    return [
      channel({
        key: 'l',
        label: 'L',
        name: 'Lightness',
        max: 100,
        step: 0.1,
        value: lch.l,
        display: lch.l.toFixed(1),
        gradient: `linear-gradient(to right, lch(0% ${lch.c} ${lch.h}), lch(100% ${lch.c} ${lch.h}))`,
        swatch: lchCss,
      }),
      channel({
        key: 'c',
        label: 'C',
        name: 'Chroma',
        max: 150,
        step: 0.1,
        value: lch.c,
        display: lch.c.toFixed(1),
        gradient: `linear-gradient(to right, lch(${lch.l}% 0 ${lch.h}), lch(${lch.l}% 150 ${lch.h}))`,
        swatch: lchCss,
      }),
      hueChannel(lch.h, lchHueBand),
      alpha,
    ]
  }

  const space = rgbSpace(format)
  const rgb = space.toRgb(color)
  const scale = space.scale
  const step = space.step
  const values = [rgb.r * scale, rgb.g * scale, rgb.b * scale] as const
  const css = space.css
  const current = css(values[0], values[1], values[2])
  return [
    channel({
      key: 'r',
      label: 'R',
      name: 'Red',
      max: scale,
      step,
      value: values[0],
      display: space.display(values[0]),
      gradient: `linear-gradient(to right, ${css(0, values[1], values[2])}, ${css(scale, values[1], values[2])})`,
      swatch: current,
    }),
    channel({
      key: 'g',
      label: 'G',
      name: 'Green',
      max: scale,
      step,
      value: values[1],
      display: space.display(values[1]),
      gradient: `linear-gradient(to right, ${css(values[0], 0, values[2])}, ${css(values[0], scale, values[2])})`,
      swatch: current,
    }),
    channel({
      key: 'b',
      label: 'B',
      name: 'Blue',
      max: scale,
      step,
      value: values[2],
      display: space.display(values[2]),
      gradient: `linear-gradient(to right, ${css(values[0], values[1], 0)}, ${css(values[0], values[1], scale)})`,
      swatch: current,
    }),
    alpha,
  ]
}

export function updateColorChannel(
  color: OklchColor,
  format: ColorPickerFormat,
  key: string,
  value: number,
): OklchColor | null {
  if (!Number.isFinite(value)) return null
  if (key === 'alpha') return { ...color, alpha: clamp(value / 100, 0, 1) }
  if (format === 'oklch') {
    if (key === 'l') return { ...color, l: clamp(value, 0, 1) }
    if (key === 'c') return { ...color, c: Math.max(0, value) }
    if (key === 'h') return { ...color, h: normalizeHue(value) }
  }
  if (format === 'oklab') {
    const lab = oklchToOklab(color)
    if (key === 'l') return oklabToOklch({ ...lab, l: clamp(value, 0, 1) })
    if (key === 'a') return oklabToOklch({ ...lab, a: value })
    if (key === 'b') return oklabToOklch({ ...lab, b: value })
  }
  if (format === 'hsl') {
    const hsl = rgbToHsl(oklchToRgb(color))
    if (key === 'h') return rgbToOklch(hslToRgb({ ...hsl, h: normalizeHue(value) }))
    if (key === 's') return rgbToOklch(hslToRgb({ ...hsl, s: clamp(value / 100, 0, 1) }))
    if (key === 'l') return rgbToOklch(hslToRgb({ ...hsl, l: clamp(value / 100, 0, 1) }))
  }
  if (format === 'hwb') {
    const hwb = rgbToHwb(oklchToRgb(color))
    if (key === 'h') return rgbToOklch(hwbToRgb({ ...hwb, h: normalizeHue(value) }))
    if (key === 'w') return rgbToOklch(hwbToRgb({ ...hwb, w: clamp(value / 100, 0, 1) }))
    if (key === 'b') return rgbToOklch(hwbToRgb({ ...hwb, b: clamp(value / 100, 0, 1) }))
  }
  if (format === 'lab') {
    const lab = oklchToLab(color)
    if (key === 'l') return labToOklch({ ...lab, l: clamp(value, 0, 100) })
    if (key === 'a') return labToOklch({ ...lab, a: value })
    if (key === 'b') return labToOklch({ ...lab, b: value })
  }
  if (format === 'lch') {
    const lch = oklchToLch(color)
    if (key === 'l') return lchToOklch({ ...lch, l: clamp(value, 0, 100) })
    if (key === 'c') return lchToOklch({ ...lch, c: Math.max(0, value) })
    if (key === 'h') return lchToOklch({ ...lch, h: normalizeHue(value) })
  }
  if (key === 'r' || key === 'g' || key === 'b') {
    const space = rgbSpace(format)
    const rgb = space.toRgb(color)
    return space.toOklch({ ...rgb, [key]: clamp(value / space.scale, 0, 1) })
  }
  return null
}

type RgbSpace = {
  readonly scale: number
  readonly step: number
  readonly toRgb: (color: OklchColor) => RgbColor
  readonly toOklch: (rgb: RgbColor) => OklchColor
  readonly css: (r: number, g: number, b: number) => string
  readonly display: (value: number) => string
}

function rgbSpace(format: ColorPickerFormat): RgbSpace {
  if (format === 'p3') {
    return {
      scale: 1,
      step: 0.001,
      toRgb: oklchToP3,
      toOklch: p3ToOklch,
      css: (r, g, b) => `color(display-p3 ${r} ${g} ${b})`,
      display: (value) => value.toFixed(3),
    }
  }
  if (format === 'rec2020') {
    return {
      scale: 1,
      step: 0.001,
      toRgb: oklchToRec2020,
      toOklch: rec2020ToOklch,
      css: (r, g, b) => `color(rec2020 ${r} ${g} ${b})`,
      display: (value) => value.toFixed(3),
    }
  }
  return {
    scale: 255,
    step: 1,
    toRgb: oklchToRgb,
    toOklch: rgbToOklch,
    css: (r, g, b) => `rgb(${r} ${g} ${b})`,
    display: (value) => Math.round(value).toString(),
  }
}

export type UIColorPickerElementConstructor = CustomElementConstructor & {
  elementName?: string
  new (): HTMLElement & { format: ColorPickerFormat; value: string }
}

export function createColorPickerElementClass(
  targetWindow?: Window,
): UIColorPickerElementConstructor {
  const UIElementBase = createUIElementClass(targetWindow)

  @element('ui-color-picker')
  class UIColorPickerElement extends UIElementBase {
    @attr accessor format: ColorPickerFormat = 'oklch'
    @attr accessor value = ''

    #committed: ParsedColor | null = null
    #reflecting = false
    #copiedTimer = 0

    protected override connected(): void {
      this.observeParts(() => {
        this.syncFromValue(this.value || this.rawInput?.value || '', true)
      })
    }

    @watch('value')
    valueChanged(): void {
      if (!this.#reflecting) this.syncFromValue(this.value, false)
    }

    @watch('format')
    formatChanged(): void {
      if (this.#reflecting) return
      const format = resolveColorPickerFormat(this.format)
      if (this.#committed?.status === 'parsed') {
        this.commitParsed(this.#committed, format, 'input')
      } else {
        this.syncParts(this.#committed)
      }
    }

    @listen('input')
    handleInput(event: Event): void {
      this.handleControl(event, 'input')
    }

    @listen('change')
    handleChange(event: Event): void {
      this.handleControl(event, 'change')
    }

    @listen('click')
    handleClick(event: Event): void {
      const target = event.target
      if (!isElementTarget(target)) return
      const clampButton = target.closest<HTMLElement>(CLAMP_SELECTOR)
      if (clampButton && this.contains(clampButton) && this.#committed?.status === 'parsed') {
        const gamut = resolveGamutTarget(clampButton.getAttribute('value'))
        this.commitColor(clampToGamut(this.#committed.oklch, gamut), 'change')
        return
      }

      const copyButton = target.closest<HTMLElement>(COPY_SELECTOR)
      if (copyButton && this.contains(copyButton)) void this.copyValue()
    }

    private async copyValue(): Promise<void> {
      const value = this.rawInput?.value || this.value
      if (!value) return
      try {
        await this.ownerDocument.defaultView?.navigator.clipboard.writeText(value)
      } catch {
        return
      }
      this.setCustomState('--copied', true)
      const view = this.ownerDocument.defaultView
      view?.clearTimeout(this.#copiedTimer)
      this.#copiedTimer =
        view?.setTimeout(() => this.setCustomState('--copied', false), COPIED_DURATION) ?? 0
    }

    private handleControl(event: Event, eventType: 'input' | 'change'): void {
      const target = event.target
      if (target === this.rawInput) {
        event.stopPropagation()
        this.handleRawInput(eventType)
        return
      }
      if (isElementTarget(target) && target.matches(FORMAT_SELECTOR) && this.contains(target)) {
        event.stopPropagation()
        this.selectFormat(resolveColorPickerFormat((target as HTMLSelectElement).value))
        return
      }
      const input = closestChannelInput(target)
      if (input && this.contains(input)) {
        event.stopPropagation()
        this.handleChannel(input, eventType)
      }
    }

    private selectFormat(format: ColorPickerFormat): void {
      this.#reflecting = true
      this.format = format
      this.#reflecting = false
      if (this.#committed?.status === 'parsed') {
        this.commitParsed(this.#committed, format, 'input')
      } else {
        this.syncParts(this.#committed)
      }
    }

    private handleRawInput(eventType: 'input' | 'change'): void {
      const raw = this.rawInput?.value ?? ''
      const parsed = parseCssColor(raw)
      if (!parsed) {
        this.setInvalid(INVALID_MESSAGE)
        return
      }
      if (parsed.status === 'preserved') {
        this.#committed = parsed
        this.reflectValue(raw)
        this.syncParts(parsed)
        this.emitNative(eventType)
        return
      }
      const format = resolveColorPickerFormat(this.format)
      const representable = representableColor(parsed, format)
      const serialized = serializeCssColor(representable, format)
      this.#committed = { ...representable, raw: serialized }
      this.reflectValue(serialized)
      if (eventType === 'change' && this.rawInput) this.rawInput.value = serialized
      this.syncParts(this.#committed)
      this.emitNative(eventType)
    }

    private handleChannel(input: HTMLInputElement, eventType: 'input' | 'change'): void {
      if (this.#committed?.status !== 'parsed') return
      const key = input.closest<HTMLElement>(CHANNEL_SELECTOR)?.getAttribute('data-channel') ?? ''
      const next = updateColorChannel(
        this.#committed.oklch,
        resolveColorPickerFormat(this.format),
        key,
        input.valueAsNumber,
      )
      if (next) this.commitColor(next, eventType, eventType === 'input' ? input : null)
    }

    private commitColor(
      color: OklchColor,
      eventType: 'input' | 'change',
      origin: HTMLInputElement | null = null,
    ): void {
      this.commitParsed(
        { status: 'parsed', format: 'oklch', raw: '', oklch: color },
        resolveColorPickerFormat(this.format),
        eventType,
        origin,
      )
    }

    private commitParsed(
      parsed: ParsedColor & { status: 'parsed' },
      format: ColorPickerFormat,
      eventType: 'input' | 'change',
      origin: HTMLInputElement | null = null,
    ): void {
      const representable = representableColor(parsed, format)
      const serialized = serializeCssColor(representable, format as ColorFormat)
      this.#committed = { ...representable, raw: serialized }
      this.reflectValue(serialized)
      if (this.rawInput && this.rawInput !== origin) this.rawInput.value = serialized
      this.syncParts(this.#committed, origin)
      this.emitNative(eventType)
    }

    private syncFromValue(value: string, preserveRaw: boolean): void {
      const parsed = parseCssColor(value)
      if (!parsed) {
        this.#committed = null
        if (this.rawInput) this.rawInput.value = value
        this.setInvalid(INVALID_MESSAGE)
        return
      }
      const format = resolveColorPickerFormat(this.format)
      this.#committed = parsed.status === 'parsed' ? representableColor(parsed, format) : parsed
      this.reflectValue(value)
      if (this.rawInput) {
        this.rawInput.value =
          preserveRaw || parsed.status === 'preserved'
            ? value
            : serializeCssColor(this.#committed, format)
      }
      this.syncParts(this.#committed)
    }

    private syncParts(parsed: ParsedColor | null, origin: HTMLInputElement | null = null): void {
      const format = resolveColorPickerFormat(this.format)
      const raw = this.rawInput
      const parsedColor = parsed?.status === 'parsed' ? parsed.oklch : null
      const contextual = parsed?.status === 'preserved'

      if (raw && parsed) raw.removeAttribute('aria-invalid')
      this.setCustomState('--contextual', contextual)

      const select = this.querySelector<HTMLSelectElement>(FORMAT_SELECTOR)
      if (select && select.value !== format) select.value = format

      this.setWarning(contextual ? CONTEXTUAL_MESSAGE : '')

      this.reflectSwatch(parsedColor, parsed?.raw ?? '')
      this.reflectGamut(parsedColor)

      const channels = parsedColor ? colorChannels(parsedColor, format) : []
      const rows = Array.from(this.querySelectorAll<HTMLElement>(CHANNEL_SELECTOR))
      rows.forEach((row, index) => syncChannelRow(row, channels[index], origin))
    }

    private reflectSwatch(parsedColor: OklchColor | null, fallback: string): void {
      const css = parsedColor
        ? serializeCssColor(
            { status: 'parsed', format: 'oklch', raw: '', oklch: parsedColor },
            'oklch',
          )
        : fallback
      if (css === '') {
        this.style.removeProperty('--ui-color-current')
        this.style.removeProperty('--ui-color-current-opaque')
        this.style.removeProperty('--ui-color-current-lightness')
        return
      }
      this.style.setProperty('--ui-color-current', css)
      if (parsedColor) {
        this.style.setProperty(
          '--ui-color-current-opaque',
          serializeCssColor(
            { status: 'parsed', format: 'oklch', raw: '', oklch: { ...parsedColor, alpha: 1 } },
            'oklch',
          ),
        )
        this.style.setProperty('--ui-color-current-lightness', parsedColor.l.toFixed(4))
      } else {
        this.style.setProperty('--ui-color-current-opaque', css)
        this.style.removeProperty('--ui-color-current-lightness')
      }
    }

    private reflectGamut(parsedColor: OklchColor | null): void {
      const gamut: GamutTarget | null = !parsedColor
        ? null
        : inGamut(parsedColor, 'srgb').in
          ? 'srgb'
          : inGamut(parsedColor, 'p3').in
            ? 'p3'
            : inGamut(parsedColor, 'rec2020').in
              ? 'rec2020'
              : null
      const label = this.querySelector<HTMLElement>(GAMUT_SELECTOR)
      if (label) {
        const text = !parsedColor ? '' : (gamut ?? 'xyz')
        if (label.textContent !== text) label.textContent = text
        label.hidden = text === ''
      }
      for (const button of Array.from(this.querySelectorAll<HTMLButtonElement>(CLAMP_SELECTOR))) {
        const target = resolveGamutTarget(button.getAttribute('value'))
        button.hidden = !parsedColor || inGamut(parsedColor, target).in
      }
    }

    private setWarning(message: string): void {
      const warning = this.querySelector<HTMLElement>(WARNING_SELECTOR)
      if (!warning) return
      if (warning.textContent !== message) warning.textContent = message
      warning.hidden = message === ''
    }

    private setInvalid(message: string): void {
      this.rawInput?.setAttribute('aria-invalid', 'true')
      this.setWarning(message)
      for (const row of Array.from(this.querySelectorAll<HTMLElement>(CHANNEL_SELECTOR))) {
        for (const input of Array.from(row.querySelectorAll<HTMLInputElement>('input'))) {
          input.disabled = true
        }
      }
    }

    private reflectValue(value: string): void {
      this.#reflecting = true
      this.value = value
      this.#reflecting = false
    }

    private emitNative(type: 'input' | 'change'): void {
      const EventConstructor = this.ownerDocument.defaultView?.Event ?? Event
      this.dispatchEvent(new EventConstructor(type, { bubbles: true }))
    }

    private get rawInput(): HTMLInputElement | null {
      return this.querySelector<HTMLInputElement>(RAW_SELECTOR)
    }
  }

  return UIColorPickerElement as unknown as UIColorPickerElementConstructor
}

function representableColor(
  parsed: ParsedColor & { status: 'parsed' },
  format: ColorPickerFormat,
): ParsedColor & { status: 'parsed' } {
  const gamut = colorPickerFormatGamut(format)
  return gamut ? { ...parsed, oklch: clampToGamut(parsed.oklch, gamut) } : parsed
}

function syncChannelRow(
  row: HTMLElement,
  definition: ColorChannelDefinition | undefined,
  origin: HTMLInputElement | null,
): void {
  const range = row.querySelector<HTMLInputElement>(CHANNEL_RANGE_SELECTOR)
  const number = row.querySelector<HTMLInputElement>(CHANNEL_INPUT_SELECTOR)
  const label = row.querySelector<HTMLElement>("[data-ui-part~='channel-label']")
  row.hidden = !definition
  if (!definition) {
    for (const input of [range, number]) if (input) input.disabled = true
    if (label?.textContent) label.textContent = ''
    return
  }
  row.setAttribute('data-channel', definition.key)
  if (label && label.textContent !== definition.label) label.textContent = definition.label
  if (range) {
    applyChannelBounds(range, definition)
    if (range !== origin) range.value = String(definition.value)
    range.setAttribute('aria-label', definition.name)
    range.style.setProperty('--ui-range-gradient', definition.gradient)
    range.style.setProperty('--ui-color-channel', definition.swatch)
    range.style.setProperty(
      '--ui-range-position',
      `${((definition.value - definition.min) / (definition.max - definition.min)) * 100}%`,
    )
  }
  if (number) {
    applyChannelBounds(number, definition)
    if (number !== origin) number.value = definition.display
    number.setAttribute('aria-label', `${definition.name} value`)
  }
}

function applyChannelBounds(input: HTMLInputElement, definition: ColorChannelDefinition): void {
  input.min = String(definition.min)
  input.max = String(definition.max)
  input.step = String(definition.step)
  input.disabled = false
}

function closestChannelInput(target: EventTarget | null): HTMLInputElement | null {
  if (!isElementTarget(target)) return null
  const selector = `${CHANNEL_SELECTOR} :is(${CHANNEL_RANGE_SELECTOR}, ${CHANNEL_INPUT_SELECTOR})`
  return target.matches(selector) ? (target as HTMLInputElement) : null
}

function isElementTarget(target: EventTarget | null): target is Element {
  return target !== null && typeof (target as Element).closest === 'function'
}

function channel(definition: {
  key: string
  label: string
  name: string
  min?: number
  max: number
  step: number
  value: number
  display: string
  gradient: string
  swatch: string
}): ColorChannelDefinition {
  return { min: 0, ...definition }
}

type HueBand = (hue: number) => string

function hueChannel(hue: number, band: HueBand): ColorChannelDefinition {
  const stops = Array.from({ length: 13 }, (_, index) => band(index * 30))
  return channel({
    key: 'h',
    label: 'H',
    name: 'Hue',
    max: 360,
    step: 1,
    value: hue,
    display: hue.toFixed(0),
    gradient: `linear-gradient(to right, ${stops.join(', ')})`,
    swatch: band(hue),
  })
}

/** Hue tracks show the pure hue band so the thumb reads as that hue, not the edited color. */
const oklchHueBand: HueBand = (hue) => `oklch(0.72 0.22 ${hue})`
const hslHueBand: HueBand = (hue) => `hsl(${hue} 100% 50%)`
const lchHueBand: HueBand = (hue) => `lch(65% 105 ${hue})`

function alphaChannel(color: OklchColor): ColorChannelDefinition {
  const alpha = color.alpha * 100
  return channel({
    key: 'alpha',
    label: 'A',
    name: 'Alpha',
    max: 100,
    step: 1,
    value: alpha,
    display: alpha.toFixed(0),
    gradient: `linear-gradient(to right, oklch(${color.l} ${color.c} ${color.h} / 0), oklch(${color.l} ${color.c} ${color.h} / 1))`,
    swatch: `oklch(${color.l} ${color.c} ${color.h} / ${color.alpha})`,
  })
}

function oklchCss(color: OklchColor): string {
  return `oklch(${color.l} ${color.c} ${color.h})`
}

function lightnessGradient(color: OklchColor): string {
  return `linear-gradient(to right, ${Array.from({ length: 11 }, (_, index) => `oklch(${index / 10} ${color.c} ${color.h})`).join(', ')})`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeHue(value: number): number {
  return ((value % 360) + 360) % 360
}

export const UIColorPickerElement = createColorPickerElementClass()
export type UIColorPickerElement = InstanceType<typeof UIColorPickerElement>

declare global {
  interface HTMLElementTagNameMap {
    'ui-color-picker': UIColorPickerElement
  }
}
