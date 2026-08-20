export type OklchColor = {
  readonly l: number
  readonly c: number
  readonly h: number
  readonly alpha: number
}

export type OklabColor = {
  readonly l: number
  readonly a: number
  readonly b: number
  readonly alpha: number
}

export type RgbColor = {
  readonly r: number
  readonly g: number
  readonly b: number
  readonly alpha: number
}

export type HslColor = {
  readonly h: number
  readonly s: number
  readonly l: number
  readonly alpha: number
}

export type P3Color = RgbColor

export type Rec2020Color = RgbColor

export type HwbColor = {
  readonly h: number
  readonly w: number
  readonly b: number
  readonly alpha: number
}

export type LchColor = {
  readonly l: number
  readonly c: number
  readonly h: number
  readonly alpha: number
}

export type LabColor = {
  readonly l: number
  readonly a: number
  readonly b: number
  readonly alpha: number
}

export type ColorFormat =
  | 'raw'
  | 'oklch'
  | 'oklab'
  | 'lch'
  | 'lab'
  | 'hex'
  | 'rgb'
  | 'hsl'
  | 'hwb'
  | 'p3'
  | 'rec2020'

export type GamutTarget = 'srgb' | 'p3' | 'rec2020'
export type ParsedColorFormat =
  | 'hex'
  | 'named'
  | 'rgb'
  | 'hsl'
  | 'hwb'
  | 'lab'
  | 'lch'
  | 'oklab'
  | 'oklch'
  | 'p3'
  | 'rec2020'
export type PreservedColorFormat = 'contextual' | 'unsupported-function'

export type ParsedColor =
  | {
      readonly status: 'parsed'
      readonly format: ParsedColorFormat
      readonly raw: string
      readonly oklch: OklchColor
    }
  | {
      readonly status: 'preserved'
      readonly format: PreservedColorFormat
      readonly raw: string
      readonly reason: string
    }

export type GamutCheck = {
  readonly in: boolean
  readonly clamped?: OklchColor
}

const NAMED_COLOR_HEX: Readonly<Record<string, string>> = {
  aliceblue: 'f0f8ff',
  antiquewhite: 'faebd7',
  aqua: '00ffff',
  aquamarine: '7fffd4',
  azure: 'f0ffff',
  beige: 'f5f5dc',
  bisque: 'ffe4c4',
  black: '000000',
  blanchedalmond: 'ffebcd',
  blue: '0000ff',
  blueviolet: '8a2be2',
  brown: 'a52a2a',
  burlywood: 'deb887',
  cadetblue: '5f9ea0',
  chartreuse: '7fff00',
  chocolate: 'd2691e',
  coral: 'ff7f50',
  cornflowerblue: '6495ed',
  cornsilk: 'fff8dc',
  crimson: 'dc143c',
  cyan: '00ffff',
  darkblue: '00008b',
  darkcyan: '008b8b',
  darkgoldenrod: 'b8860b',
  darkgray: 'a9a9a9',
  darkgreen: '006400',
  darkgrey: 'a9a9a9',
  darkkhaki: 'bdb76b',
  darkmagenta: '8b008b',
  darkolivegreen: '556b2f',
  darkorange: 'ff8c00',
  darkorchid: '9932cc',
  darkred: '8b0000',
  darksalmon: 'e9967a',
  darkseagreen: '8fbc8f',
  darkslateblue: '483d8b',
  darkslategray: '2f4f4f',
  darkslategrey: '2f4f4f',
  darkturquoise: '00ced1',
  darkviolet: '9400d3',
  deeppink: 'ff1493',
  deepskyblue: '00bfff',
  dimgray: '696969',
  dimgrey: '696969',
  dodgerblue: '1e90ff',
  firebrick: 'b22222',
  floralwhite: 'fffaf0',
  forestgreen: '228b22',
  fuchsia: 'ff00ff',
  gainsboro: 'dcdcdc',
  ghostwhite: 'f8f8ff',
  gold: 'ffd700',
  goldenrod: 'daa520',
  gray: '808080',
  green: '008000',
  greenyellow: 'adff2f',
  grey: '808080',
  honeydew: 'f0fff0',
  hotpink: 'ff69b4',
  indianred: 'cd5c5c',
  indigo: '4b0082',
  ivory: 'fffff0',
  khaki: 'f0e68c',
  lavender: 'e6e6fa',
  lavenderblush: 'fff0f5',
  lawngreen: '7cfc00',
  lemonchiffon: 'fffacd',
  lightblue: 'add8e6',
  lightcoral: 'f08080',
  lightcyan: 'e0ffff',
  lightgoldenrodyellow: 'fafad2',
  lightgray: 'd3d3d3',
  lightgreen: '90ee90',
  lightgrey: 'd3d3d3',
  lightpink: 'ffb6c1',
  lightsalmon: 'ffa07a',
  lightseagreen: '20b2aa',
  lightskyblue: '87cefa',
  lightslategray: '778899',
  lightslategrey: '778899',
  lightsteelblue: 'b0c4de',
  lightyellow: 'ffffe0',
  lime: '00ff00',
  limegreen: '32cd32',
  linen: 'faf0e6',
  magenta: 'ff00ff',
  maroon: '800000',
  mediumaquamarine: '66cdaa',
  mediumblue: '0000cd',
  mediumorchid: 'ba55d3',
  mediumpurple: '9370db',
  mediumseagreen: '3cb371',
  mediumslateblue: '7b68ee',
  mediumspringgreen: '00fa9a',
  mediumturquoise: '48d1cc',
  mediumvioletred: 'c71585',
  midnightblue: '191970',
  mintcream: 'f5fffa',
  mistyrose: 'ffe4e1',
  moccasin: 'ffe4b5',
  navajowhite: 'ffdead',
  navy: '000080',
  oldlace: 'fdf5e6',
  olive: '808000',
  olivedrab: '6b8e23',
  orange: 'ffa500',
  orangered: 'ff4500',
  orchid: 'da70d6',
  palegoldenrod: 'eee8aa',
  palegreen: '98fb98',
  paleturquoise: 'afeeee',
  palevioletred: 'db7093',
  papayawhip: 'ffefd5',
  peachpuff: 'ffdab9',
  peru: 'cd853f',
  pink: 'ffc0cb',
  plum: 'dda0dd',
  powderblue: 'b0e0e6',
  purple: '800080',
  rebeccapurple: '663399',
  red: 'ff0000',
  rosybrown: 'bc8f8f',
  royalblue: '4169e1',
  saddlebrown: '8b4513',
  salmon: 'fa8072',
  sandybrown: 'f4a460',
  seagreen: '2e8b57',
  seashell: 'fff5ee',
  sienna: 'a0522d',
  silver: 'c0c0c0',
  skyblue: '87ceeb',
  slateblue: '6a5acd',
  slategray: '708090',
  slategrey: '708090',
  snow: 'fffafa',
  springgreen: '00ff7f',
  steelblue: '4682b4',
  tan: 'd2b48c',
  teal: '008080',
  thistle: 'd8bfd8',
  tomato: 'ff6347',
  turquoise: '40e0d0',
  violet: 'ee82ee',
  wheat: 'f5deb3',
  white: 'ffffff',
  whitesmoke: 'f5f5f5',
  yellow: 'ffff00',
  yellowgreen: '9acd32',
}

export function parseCssColor(value: unknown): ParsedColor | null {
  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (!raw) return null

  const keyword = raw.toLowerCase()
  if (keyword === 'transparent') {
    return {
      status: 'parsed',
      format: 'named',
      raw,
      oklch: rgbToOklch({ r: 0, g: 0, b: 0, alpha: 0 }),
    }
  }
  const named = NAMED_COLOR_HEX[keyword]
  if (named) {
    return { status: 'parsed', format: 'named', raw, oklch: rgbToOklch(tryParseHex(`#${named}`)!) }
  }

  const preserved = preservedContextualColor(raw)
  if (preserved) return preserved

  const hex = tryParseHex(raw)
  if (hex) {
    return { status: 'parsed', format: 'hex', raw, oklch: rgbToOklch(hex) }
  }

  const fnMatch = /^([a-z][a-z0-9-]*)\((.*)\)$/i.exec(raw)
  if (!fnMatch) return null

  const fn = fnMatch[1]!.toLowerCase()
  const args = parseFunctionArgs(fnMatch[2]!)

  switch (fn) {
    case 'oklch':
      return parsed(raw, 'oklch', parseOklchArgs(args))
    case 'oklab':
      return parsed(raw, 'oklab', parseOklabArgs(args))
    case 'rgb':
    case 'rgba': {
      const rgb = parseRgbArgs(args)
      return rgb ? { status: 'parsed', format: 'rgb', raw, oklch: rgbToOklch(rgb) } : null
    }
    case 'hsl':
    case 'hsla': {
      const hsl = parseHslArgs(args)
      return hsl ? { status: 'parsed', format: 'hsl', raw, oklch: rgbToOklch(hslToRgb(hsl)) } : null
    }
    case 'hwb': {
      const hwb = parseHwbArgs(args)
      return hwb ? { status: 'parsed', format: 'hwb', raw, oklch: rgbToOklch(hwb) } : null
    }
    case 'color':
      return parseColorFunction(raw, args)
    case 'lab': {
      const color = parseLabArgs(args)
      return color ? { status: 'parsed', format: 'lab', raw, oklch: labToOklch(color) } : null
    }
    case 'lch': {
      const color = parseLchArgs(args)
      return color ? { status: 'parsed', format: 'lch', raw, oklch: labToOklch(color) } : null
    }
    default:
      return null
  }
}

export function parseAnyColor(value: unknown): OklchColor | null {
  const parsedColor = parseCssColor(value)
  return parsedColor?.status === 'parsed' ? parsedColor.oklch : null
}

/** The gamut a serialized format can represent, or null when the format is unbounded. */
export function colorFormatGamut(format: ColorFormat): GamutTarget | null {
  if (format === 'hex' || format === 'rgb' || format === 'hsl' || format === 'hwb') return 'srgb'
  if (format === 'p3') return 'p3'
  return format === 'rec2020' ? 'rec2020' : null
}

export function serializeCssColor(color: ParsedColor, preferred: ColorFormat = 'oklch'): string {
  if (preferred === 'raw' || color.status === 'preserved') return color.raw
  const gamut = colorFormatGamut(preferred)
  const oklch = gamut ? clampToGamut(color.oklch, gamut) : color.oklch
  if (preferred === 'oklab') return oklabToCss(oklchToOklab(oklch))
  if (preferred === 'lab') return labToCss(oklchToLab(oklch))
  if (preferred === 'lch') return lchToCss(oklchToLch(oklch))
  if (preferred === 'hex') return rgbToHex(oklchToRgb(oklch))
  if (preferred === 'rgb') return rgbToCss(oklchToRgb(oklch))
  if (preferred === 'hsl') return hslToCss(rgbToHsl(oklchToRgb(oklch)))
  if (preferred === 'hwb') return hwbToCss(rgbToHwb(oklchToRgb(oklch)))
  if (preferred === 'p3') return p3ToCss(oklchToP3(oklch))
  if (preferred === 'rec2020') return rec2020ToCss(oklchToRec2020(oklch))
  return oklchToCss(oklch)
}

export function oklchToCss(color: OklchColor): string {
  return `oklch(${round(color.l, 4)} ${round(color.c, 4)} ${round(color.h, 2)}${alphaSuffix(
    color.alpha,
  )})`
}

export function oklabToCss(color: OklabColor): string {
  return `oklab(${round(color.l, 4)} ${round(color.a, 4)} ${round(color.b, 4)}${alphaSuffix(
    color.alpha,
  )})`
}

export function rgbToCss(color: RgbColor): string {
  const r = clamp255(color.r)
  const g = clamp255(color.g)
  const b = clamp255(color.b)
  return color.alpha < 1 ? `rgb(${r} ${g} ${b} / ${round(color.alpha, 3)})` : `rgb(${r} ${g} ${b})`
}

export function hslToCss(color: HslColor): string {
  return `hsl(${round(color.h, 2)} ${round(color.s * 100, 2)}% ${round(color.l * 100, 2)}%${alphaSuffix(
    color.alpha,
  )})`
}

export function labToCss(color: LabColor): string {
  return `lab(${round(color.l, 3)}% ${round(color.a, 3)} ${round(color.b, 3)}${alphaSuffix(
    color.alpha,
  )})`
}

export function lchToCss(color: LchColor): string {
  return `lch(${round(color.l, 3)}% ${round(color.c, 3)} ${round(color.h, 2)}${alphaSuffix(
    color.alpha,
  )})`
}

export function hwbToCss(color: HwbColor): string {
  return `hwb(${round(color.h, 2)} ${round(color.w * 100, 2)}% ${round(color.b * 100, 2)}%${alphaSuffix(
    color.alpha,
  )})`
}

export function rgbToHex(color: RgbColor): string {
  const channels = [clamp255(color.r), clamp255(color.g), clamp255(color.b)]
  if (color.alpha < 1) channels.push(clamp255(color.alpha))
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

export function rec2020ToCss(color: Rec2020Color): string {
  return `color(rec2020 ${round(color.r, 4)} ${round(color.g, 4)} ${round(color.b, 4)}${alphaSuffix(
    color.alpha,
  )})`
}

export function p3ToCss(color: RgbColor): string {
  return `color(display-p3 ${round(color.r, 4)} ${round(color.g, 4)} ${round(color.b, 4)}${alphaSuffix(
    color.alpha,
  )})`
}

export function inGamut(color: OklchColor, target: GamutTarget): GamutCheck {
  const project = gamutProjection(target)
  const rgb = project(color)
  const min = -1e-6
  const max = 1 + 1e-6

  if (
    rgb.r >= min &&
    rgb.r <= max &&
    rgb.g >= min &&
    rgb.g <= max &&
    rgb.b >= min &&
    rgb.b <= max
  ) {
    return { in: true }
  }

  let lo = 0
  let hi = color.c
  let clamped: OklchColor = { ...color, c: 0 }

  for (let index = 0; index < 16; index += 1) {
    const c = (lo + hi) / 2
    const candidate: OklchColor = { ...color, c }
    const candidateRgb = project(candidate)
    const fits =
      candidateRgb.r >= min &&
      candidateRgb.r <= max &&
      candidateRgb.g >= min &&
      candidateRgb.g <= max &&
      candidateRgb.b >= min &&
      candidateRgb.b <= max

    if (fits) {
      lo = c
      clamped = candidate
    } else {
      hi = c
    }
  }

  return { in: false, clamped }
}

export function clampToGamut(color: OklchColor, target: GamutTarget): OklchColor {
  return inGamut(color, target).clamped ?? color
}

function gamutProjection(target: GamutTarget): (color: OklchColor) => RgbColor {
  if (target === 'p3') return oklchToP3
  if (target === 'rec2020') return oklchToRec2020
  return oklchToRgb
}

export function oklchToRgb(color: OklchColor): RgbColor {
  const lab = oklchToOklab(color)
  const linear = oklabToLinearRgb(lab)

  return {
    r: linearToSrgbChannel(linear.r),
    g: linearToSrgbChannel(linear.g),
    b: linearToSrgbChannel(linear.b),
    alpha: color.alpha,
  }
}

export function rgbToOklch(rgb: RgbColor): OklchColor {
  const lr = srgbToLinearChannel(rgb.r)
  const lg = srgbToLinearChannel(rgb.g)
  const lb = srgbToLinearChannel(rgb.b)

  return linearSrgbToOklch(lr, lg, lb, rgb.alpha)
}

export function p3ToOklch(p3: P3Color): OklchColor {
  const r = srgbToLinearChannel(p3.r)
  const g = srgbToLinearChannel(p3.g)
  const b = srgbToLinearChannel(p3.b)
  const x = 0.4865709486482162 * r + 0.26566769316909306 * g + 0.1982172852343625 * b
  const y = 0.2289745640697488 * r + 0.6917385218365064 * g + 0.079286914093745 * b
  const z = 0 * r + 0.04511338185890264 * g + 1.043944368900976 * b
  return xyzD65ToOklch(x, y, z, p3.alpha)
}

export function lchToOklch(lch: LchColor): OklchColor {
  const radians = (lch.h * Math.PI) / 180
  return labToOklch({
    l: lch.l,
    a: lch.c * Math.cos(radians),
    b: lch.c * Math.sin(radians),
    alpha: lch.alpha,
  })
}

export function oklchToLch(color: OklchColor): LchColor {
  const lab = oklchToLab(color)
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b)
  const h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI
  return { l: lab.l, c, h: normalizeHue(h), alpha: color.alpha }
}

export function oklchToLab(color: OklchColor): LabColor {
  const linear = oklabToLinearRgb(oklchToOklab(color))
  const { x, y, z } = linearSrgbToXyzD65(linear)
  const x50 = 1.0479298208405488 * x + 0.022946793341019088 * y - 0.05019222954313557 * z
  const y50 = 0.029627815688159344 * x + 0.990434484573249 * y - 0.01707382502938514 * z
  const z50 = -0.009243058152591178 * x + 0.015055144896577895 * y + 0.7518742899580008 * z
  const forward = (value: number) =>
    value > 216 / 24389 ? Math.cbrt(value) : (value * (24389 / 27) + 16) / 116
  const fx = forward(x50 / 0.96422)
  const fy = forward(y50)
  const fz = forward(z50 / 0.82521)
  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
    alpha: color.alpha,
  }
}

export function hwbToRgb(hwb: HwbColor): RgbColor {
  const total = hwb.w + hwb.b
  const w = total > 1 ? hwb.w / total : hwb.w
  const b = total > 1 ? hwb.b / total : hwb.b
  const base = hslToRgb({ h: hwb.h, s: 1, l: 0.5, alpha: 1 })
  const factor = 1 - w - b
  return {
    r: base.r * factor + w,
    g: base.g * factor + w,
    b: base.b * factor + w,
    alpha: hwb.alpha,
  }
}

export function rgbToHwb(rgb: RgbColor): HwbColor {
  const white = Math.min(rgb.r, rgb.g, rgb.b)
  const black = 1 - Math.max(rgb.r, rgb.g, rgb.b)
  return { h: rgbToHsl(rgb).h, w: white, b: black, alpha: rgb.alpha }
}

export function rec2020ToOklch(color: Rec2020Color): OklchColor {
  const r = rec2020ToLinearChannel(color.r)
  const g = rec2020ToLinearChannel(color.g)
  const b = rec2020ToLinearChannel(color.b)
  const x = 0.6369580483012914 * r + 0.14461690358620832 * g + 0.1688809751641721 * b
  const y = 0.2627002120112671 * r + 0.6779980715188708 * g + 0.05930171646986196 * b
  const z = 0 * r + 0.028072693049087428 * g + 1.060985057710791 * b
  return xyzD65ToOklch(x, y, z, color.alpha)
}

export function oklchToRec2020(color: OklchColor): Rec2020Color {
  const { x, y, z } = linearSrgbToXyzD65(oklabToLinearRgb(oklchToOklab(color)))
  return {
    r: linearToRec2020Channel(1.716651187971268 * x - 0.355670783776392 * y - 0.25336628137366 * z),
    g: linearToRec2020Channel(
      -0.666684351832489 * x + 1.616481236634939 * y + 0.0157685458139111 * z,
    ),
    b: linearToRec2020Channel(
      0.017639857445311 * x - 0.042770613257809 * y + 0.942103121235474 * z,
    ),
    alpha: color.alpha,
  }
}

const REC2020_ALPHA = 1.09929682680944
const REC2020_BETA = 0.018053968510807

function rec2020ToLinearChannel(value: number): number {
  const sign = value < 0 ? -1 : 1
  const magnitude = Math.abs(value)
  if (magnitude < REC2020_BETA * 4.5) return value / 4.5
  return sign * ((magnitude + REC2020_ALPHA - 1) / REC2020_ALPHA) ** (1 / 0.45)
}

function linearToRec2020Channel(value: number): number {
  const sign = value < 0 ? -1 : 1
  const magnitude = Math.abs(value)
  if (magnitude < REC2020_BETA) return 4.5 * value
  return sign * (REC2020_ALPHA * magnitude ** 0.45 - (REC2020_ALPHA - 1))
}

function linearSrgbToXyzD65(linear: {
  readonly r: number
  readonly g: number
  readonly b: number
}) {
  return {
    x:
      0.4123907992659595 * linear.r +
      0.35758433938387796 * linear.g +
      0.1804807884018343 * linear.b,
    y:
      0.21263900587151036 * linear.r +
      0.7151686787677559 * linear.g +
      0.07219231536073371 * linear.b,
    z:
      0.01933081871559185 * linear.r +
      0.11919477979462599 * linear.g +
      0.9505321522496607 * linear.b,
  }
}

export function labToOklch(lab: LabColor): OklchColor {
  const fy = (lab.l + 16) / 116
  const fx = fy + lab.a / 500
  const fz = fy - lab.b / 200
  const inverse = (value: number) => {
    const cube = value ** 3
    return cube > 216 / 24389 ? cube : (116 * value - 16) / (24389 / 27)
  }
  const x50 = 0.96422 * inverse(fx)
  const y50 = inverse(fy)
  const z50 = 0.82521 * inverse(fz)
  const x65 = 0.9554734 * x50 - 0.0230985 * y50 + 0.0632593 * z50
  const y65 = -0.0283697 * x50 + 1.0099955 * y50 + 0.0210414 * z50
  const z65 = 0.012314 * x50 - 0.0205077 * y50 + 1.3303659 * z50
  return xyzD65ToOklch(x65, y65, z65, lab.alpha)
}

function xyzD65ToOklch(x: number, y: number, z: number, alpha: number): OklchColor {
  return linearSrgbToOklch(
    3.2409699419045226 * x - 1.537383177570094 * y - 0.4986107602930034 * z,
    -0.9692436362808796 * x + 1.8759675015077202 * y + 0.04155505740717559 * z,
    0.05563007969699366 * x - 0.20397695888897652 * y + 1.0569715142428786 * z,
    alpha,
  )
}

export function oklchToP3(color: OklchColor): P3Color {
  const { x, y, z } = linearSrgbToXyzD65(oklabToLinearRgb(oklchToOklab(color)))

  return {
    r: linearToSrgbChannel(2.493496911941425 * x - 0.9313836179191239 * y - 0.402710784450717 * z),
    g: linearToSrgbChannel(
      -0.8294889695615747 * x + 1.7626640603183463 * y + 0.0236246858419436 * z,
    ),
    b: linearToSrgbChannel(
      0.03584583024378447 * x - 0.07617238926804182 * y + 0.9568845240076872 * z,
    ),
    alpha: color.alpha,
  }
}

function linearSrgbToOklch(lr: number, lg: number, lb: number, alpha: number): OklchColor {
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb

  const lRoot = Math.cbrt(l)
  const mRoot = Math.cbrt(m)
  const sRoot = Math.cbrt(s)

  return oklabToOklch({
    l: 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    a: 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    b: 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
    alpha,
  })
}

export function hslToRgb(hsl: HslColor): RgbColor {
  const h = normalizeHue(hsl.h)
  const s = clamp01(hsl.s)
  const l = clamp01(hsl.l)
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0

  if (h < 60) {
    r = c
    g = x
  } else if (h < 120) {
    r = x
    g = c
  } else if (h < 180) {
    g = c
    b = x
  } else if (h < 240) {
    g = x
    b = c
  } else if (h < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }

  return { r: r + m, g: g + m, b: b + m, alpha: hsl.alpha }
}

export function rgbToHsl(rgb: RgbColor): HslColor {
  const max = Math.max(rgb.r, rgb.g, rgb.b)
  const min = Math.min(rgb.r, rgb.g, rgb.b)
  const lightness = (max + min) / 2
  const difference = max - min
  if (difference === 0) return { h: 0, s: 0, l: lightness, alpha: rgb.alpha }

  const saturation = difference / (1 - Math.abs(2 * lightness - 1))
  let hue = 0
  if (max === rgb.r) hue = 60 * (((rgb.g - rgb.b) / difference) % 6)
  else if (max === rgb.g) hue = 60 * ((rgb.b - rgb.r) / difference + 2)
  else hue = 60 * ((rgb.r - rgb.g) / difference + 4)
  return { h: normalizeHue(hue), s: saturation, l: lightness, alpha: rgb.alpha }
}

function preservedContextualColor(raw: string): ParsedColor | null {
  const lower = raw.toLowerCase()
  const contextual =
    lower === 'currentcolor' ||
    (/^var\(\s*--[a-z0-9_-]+(?:\s*,[\s\S]+)?\)$/i.test(raw) && hasBalancedParentheses(raw)) ||
    (/^light-dark\([\s\S]+,[\s\S]+\)$/i.test(raw) && hasBalancedParentheses(raw)) ||
    (/^color-mix\(\s*in\s+[a-z0-9-]+[\s\S]*,[\s\S]+\)$/i.test(raw) && hasBalancedParentheses(raw))

  if (contextual) {
    return {
      status: 'preserved',
      format: 'contextual',
      raw,
      reason: 'Contextual CSS color values need runtime context before normalization.',
    }
  }

  return null
}

function hasBalancedParentheses(value: string): boolean {
  let depth = 0
  for (const character of value) {
    if (character === '(') depth += 1
    else if (character === ')') depth -= 1
    if (depth < 0) return false
  }
  return depth === 0
}

function parsed(
  raw: string,
  format: ParsedColorFormat,
  color: OklchColor | OklabColor | null,
): ParsedColor | null {
  if (!color) return null
  const oklch = 'c' in color ? color : oklabToOklch(color)
  return { status: 'parsed', format, raw, oklch }
}

const COLOR_FUNCTION_SPACES: Readonly<
  Record<
    string,
    { readonly format: ParsedColorFormat; readonly toOklch: (rgb: RgbColor) => OklchColor }
  >
> = {
  srgb: { format: 'rgb', toOklch: rgbToOklch },
  'display-p3': { format: 'p3', toOklch: p3ToOklch },
  rec2020: { format: 'rec2020', toOklch: rec2020ToOklch },
}

function parseColorFunction(raw: string, args: readonly string[]): ParsedColor | null {
  const space = args[0]?.toLowerCase() ?? ''
  const target = COLOR_FUNCTION_SPACES[space]
  if (!target || args.length < 4) {
    return {
      status: 'preserved',
      format: 'unsupported-function',
      raw,
      reason: `Only ${Object.keys(COLOR_FUNCTION_SPACES).join(', ')} color spaces can be normalized.`,
    }
  }

  const slashIndex = args.indexOf('/')
  const head = slashIndex === -1 ? args.slice(1, 4) : args.slice(1, slashIndex)
  const tail = slashIndex === -1 ? undefined : args[slashIndex + 1]
  const r = parseUnitChannel(head[0])
  const g = parseUnitChannel(head[1])
  const b = parseUnitChannel(head[2])
  const alpha = parseAlpha(tail)
  if (r === null || g === null || b === null || alpha === null) return null

  return {
    status: 'parsed',
    format: target.format,
    raw,
    oklch: target.toOklch({ r, g, b, alpha }),
  }
}

export function oklabToOklch(lab: OklabColor): OklchColor {
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b)
  const h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI
  return { l: lab.l, c, h: normalizeHue(h), alpha: lab.alpha }
}

export function oklchToOklab(color: OklchColor): OklabColor {
  const radians = (color.h * Math.PI) / 180
  return {
    l: color.l,
    a: color.c * Math.cos(radians),
    b: color.c * Math.sin(radians),
    alpha: color.alpha,
  }
}

function oklabToLinearRgb(lab: OklabColor): {
  readonly r: number
  readonly g: number
  readonly b: number
} {
  const lRoot = lab.l + 0.3963377774 * lab.a + 0.2158037573 * lab.b
  const mRoot = lab.l - 0.1055613458 * lab.a - 0.0638541728 * lab.b
  const sRoot = lab.l - 0.0894841775 * lab.a - 1.291485548 * lab.b

  const l = lRoot * lRoot * lRoot
  const m = mRoot * mRoot * mRoot
  const s = sRoot * sRoot * sRoot

  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  }
}

function linearToSrgbChannel(value: number): number {
  if (value <= 0.0031308) return 12.92 * value
  return 1.055 * Math.pow(value, 1 / 2.4) - 0.055
}

function srgbToLinearChannel(value: number): number {
  if (value <= 0.04045) return value / 12.92
  return Math.pow((value + 0.055) / 1.055, 2.4)
}

function parseFunctionArgs(raw: string): string[] {
  return raw.replace(/,/g, ' ').replace(/\//g, ' / ').split(/\s+/).filter(Boolean)
}

function parseOklchArgs(args: readonly string[]): OklchColor | null {
  if (args.length < 3) return null
  const { head, tail } = splitAlpha(args)
  const l = parseLightness(head[0])
  const c = parseNumber(head[1])
  const h = parseDegrees(head[2])
  const alpha = parseAlpha(tail)
  if (l === null || c === null || h === null || alpha === null) return null
  return { l, c, h: normalizeHue(h), alpha }
}

function parseOklabArgs(args: readonly string[]): OklabColor | null {
  if (args.length < 3) return null
  const { head, tail } = splitAlpha(args)
  const l = parseLightness(head[0])
  const a = parseNumber(head[1])
  const b = parseNumber(head[2])
  const alpha = parseAlpha(tail)
  if (l === null || a === null || b === null || alpha === null) return null
  return { l, a, b, alpha }
}

function parseLabArgs(args: readonly string[]): LabColor | null {
  if (args.length < 3) return null
  const { head, tail } = splitAlpha(args)
  const l = parseLabLightness(head[0])
  const a = parseLabAxis(head[1])
  const b = parseLabAxis(head[2])
  const alpha = parseAlpha(tail)
  if (l === null || a === null || b === null || alpha === null) return null
  return { l, a, b, alpha }
}

function parseLchArgs(args: readonly string[]): LabColor | null {
  if (args.length < 3) return null
  const { head, tail } = splitAlpha(args)
  const l = parseLabLightness(head[0])
  const c = parseLabAxis(head[1])
  const h = parseDegrees(head[2])
  const alpha = parseAlpha(tail)
  if (l === null || c === null || h === null || c < 0 || alpha === null) return null
  const radians = (h * Math.PI) / 180
  return {
    l,
    a: c * Math.cos(radians),
    b: c * Math.sin(radians),
    alpha,
  }
}

function parseRgbArgs(args: readonly string[]): RgbColor | null {
  if (args.length < 3) return null
  const { head, tail } = splitAlpha(args)
  const r = parseRgbChannel(head[0])
  const g = parseRgbChannel(head[1])
  const b = parseRgbChannel(head[2])
  const alpha = parseAlpha(tail ?? head[3])
  if (r === null || g === null || b === null || alpha === null) return null
  return { r, g, b, alpha }
}

function parseHslArgs(args: readonly string[]): HslColor | null {
  if (args.length < 3) return null
  const { head, tail } = splitAlpha(args)
  const h = parseDegrees(head[0])
  const s = parsePercent(head[1])
  const l = parsePercent(head[2])
  const alpha = parseAlpha(tail ?? head[3])
  if (h === null || s === null || l === null || alpha === null) return null
  return { h: normalizeHue(h), s, l, alpha }
}

function parseHwbArgs(args: readonly string[]): RgbColor | null {
  if (args.length < 3) return null
  const { head, tail } = splitAlpha(args)
  const h = parseDegrees(head[0])
  const white = parsePercent(head[1])
  const black = parsePercent(head[2])
  const alpha = parseAlpha(tail)
  if (h === null || white === null || black === null || alpha === null) return null

  return hwbToRgb({ h, w: white, b: black, alpha })
}

function tryParseHex(value: string): RgbColor | null {
  const match = /^#([0-9a-f]{3,8})$/i.exec(value)
  if (!match) return null
  const hex = match[1]!

  if (hex.length === 3 || hex.length === 4) {
    return {
      r: parseInt(hex[0]! + hex[0], 16) / 255,
      g: parseInt(hex[1]! + hex[1], 16) / 255,
      b: parseInt(hex[2]! + hex[2], 16) / 255,
      alpha: hex.length === 4 ? parseInt(hex[3]! + hex[3], 16) / 255 : 1,
    }
  }

  if (hex.length === 6 || hex.length === 8) {
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255,
      alpha: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
    }
  }

  return null
}

function splitAlpha(args: readonly string[]): {
  readonly head: readonly string[]
  readonly tail?: string
} {
  const slashIndex = args.indexOf('/')
  if (slashIndex === -1) return { head: args }
  return { head: args.slice(0, slashIndex), tail: args[slashIndex + 1] }
}

function parseLightness(value: string | undefined): number | null {
  if (value === undefined) return null
  if (value.endsWith('%')) return finiteNumber(value.slice(0, -1), 100)
  return finiteNumber(value, 1)
}

function parseLabLightness(value: string | undefined): number | null {
  if (value === undefined) return null
  const raw = value.endsWith('%') ? value.slice(0, -1) : value
  const numeric = Number(raw)
  return Number.isFinite(numeric) ? Math.min(100, Math.max(0, numeric)) : null
}

function parseLabAxis(value: string | undefined): number | null {
  if (value === undefined) return null
  const percent = value.endsWith('%')
  const numeric = Number(percent ? value.slice(0, -1) : value)
  if (!Number.isFinite(numeric)) return null
  return percent ? numeric * 1.25 : numeric
}

function parsePercent(value: string | undefined): number | null {
  if (value === undefined) return null
  if (!value.endsWith('%')) return null
  return finiteNumber(value.slice(0, -1), 100)
}

function parseRgbChannel(value: string | undefined): number | null {
  if (value === undefined) return null
  if (value.endsWith('%')) return finiteNumber(value.slice(0, -1), 100)
  return finiteNumber(value, 255)
}

function parseUnitChannel(value: string | undefined): number | null {
  if (value === undefined) return null
  if (value.endsWith('%')) return finiteNumber(value.slice(0, -1), 100)
  return finiteNumber(value, 1)
}

function parseNumber(value: string | undefined): number | null {
  if (value === undefined) return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function parseDegrees(value: string | undefined): number | null {
  if (value === undefined) return null
  const match = /^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)(deg|grad|rad|turn)?$/i.exec(value)
  if (!match) return null
  const numeric = Number(match[1])
  if (!Number.isFinite(numeric)) return null
  if (match[2]?.toLowerCase() === 'grad') return numeric * 0.9
  if (match[2]?.toLowerCase() === 'rad') return (numeric * 180) / Math.PI
  if (match[2]?.toLowerCase() === 'turn') return numeric * 360
  return numeric
}

function parseAlpha(value: string | undefined): number | null {
  if (value === undefined) return 1
  if (value.endsWith('%')) {
    const numeric = Number(value.slice(0, -1))
    return Number.isFinite(numeric) ? clamp01(numeric / 100) : null
  }
  const numeric = Number(value)
  return Number.isFinite(numeric) ? clamp01(numeric) : null
}

function finiteNumber(value: string, divisor: number): number | null {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? clamp01(numeric / divisor) : null
}

function normalizeHue(value: number): number {
  return ((value % 360) + 360) % 360
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function clamp255(value: number): number {
  return Math.round(clamp01(value) * 255)
}

function round(value: number, precision: number): number {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function alphaSuffix(alpha: number): string {
  return alpha < 1 ? ` / ${round(alpha, 3)}` : ''
}
