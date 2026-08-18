import { oklchToRgb, parseCssColor, type OklchColor } from './color'

export type ContrastKind = 'normal-text' | 'large-text' | 'ui'
export type ContrastLevel = {
  readonly pass: boolean
  readonly threshold: number
}

export type ContrastPairInput = {
  readonly id: string
  readonly fg: string
  readonly bg: string
  readonly kind: ContrastKind
  readonly description?: string
}

export type ContrastPairResult = ContrastPairInput & {
  readonly fgValue: string | null
  readonly bgValue: string | null
  readonly ratio: number | null
  readonly aa: boolean
  readonly aaa: boolean
  readonly status: 'pass-aaa' | 'pass-aa' | 'fail' | 'unknown'
}

const AA_THRESHOLDS: Record<ContrastKind, number> = {
  'normal-text': 4.5,
  'large-text': 3,
  ui: 3,
}

const AAA_THRESHOLDS: Record<ContrastKind, number> = {
  'normal-text': 7,
  'large-text': 4.5,
  ui: 4.5,
}

export function wcagContrastRatio(fg: OklchColor, bg: OklchColor): number {
  const fgLuminance = relativeLuminance(fg)
  const bgLuminance = relativeLuminance(bg)
  const lighter = Math.max(fgLuminance, bgLuminance)
  const darker = Math.min(fgLuminance, bgLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

export function wcagAALevel(ratio: number, kind: ContrastKind): ContrastLevel {
  const threshold = AA_THRESHOLDS[kind]
  return { pass: ratio >= threshold, threshold }
}

export function wcagAAALevel(ratio: number, kind: ContrastKind): ContrastLevel {
  const threshold = AAA_THRESHOLDS[kind]
  return { pass: ratio >= threshold, threshold }
}

export function evaluateContrastPairs(
  pairs: readonly ContrastPairInput[],
  resolve: (cssVar: string) => string | null,
): ContrastPairResult[] {
  return pairs.map((pair) => {
    const fgValue = resolve(pair.fg)
    const bgValue = resolve(pair.bg)
    const fgColor = fgValue ? parseCssColor(fgValue) : null
    const bgColor = bgValue ? parseCssColor(bgValue) : null

    if (fgColor?.status !== 'parsed' || bgColor?.status !== 'parsed') {
      return {
        ...pair,
        fgValue,
        bgValue,
        ratio: null,
        aa: false,
        aaa: false,
        status: 'unknown',
      }
    }

    const ratio = wcagContrastRatio(fgColor.oklch, bgColor.oklch)
    const aa = wcagAALevel(ratio, pair.kind).pass
    const aaa = wcagAAALevel(ratio, pair.kind).pass

    return {
      ...pair,
      fgValue,
      bgValue,
      ratio,
      aa,
      aaa,
      status: aaa ? 'pass-aaa' : aa ? 'pass-aa' : 'fail',
    }
  })
}

function relativeLuminance(color: OklchColor): number {
  const rgb = oklchToRgb(color)
  const channel = (value: number) => {
    const v = Math.max(0, Math.min(1, value))
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }

  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
}
