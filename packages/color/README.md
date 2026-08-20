# @timelessui/color

Dependency-free CSS color parsing, conversion, gamut, and contrast utilities.

This is the color model Timeless components are built on, published on its own because it is a
library rather than a UI primitive. It parses and serializes the color syntaxes the platform
accepts, converts between OKLCH, OKLab, LCH, Lab, HWB, HSL, sRGB, Display-P3, and Rec. 2020, reports
and clamps gamut, and computes WCAG contrast ratios. It renders nothing and touches no DOM.

```ts
import {
  inGamut,
  parseAnyColor,
  parseCssColor,
  serializeCssColor,
  wcagAALevel,
  wcagContrastRatio,
} from '@timelessui/color'

const parsed = parseCssColor('oklch(58% 0.19 265)')
if (parsed?.status === 'parsed') {
  serializeCssColor(parsed, 'hex') // '#4056d4'
  inGamut(parsed.oklch, 'srgb') // { in: true }
}

const fg = parseAnyColor('#1b1b1f')
const bg = parseAnyColor('white')
if (fg && bg) {
  wcagAALevel(wcagContrastRatio(fg, bg), 'normal-text') // { pass: true, threshold: 4.5 }
}
```

The package depends on neither `@timelessui/components` nor `@timelessui/core`, so a consumer who
wants only the color math never installs a component library. `ui-color-picker` and
`ui-color-swatch` stay in `@timelessui/components` and depend on this package the way any component
depends on a platform capability.
