import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createColorPalette, createColorSwatch } from '../color-swatch.html'
import { createMissingComponentMeta } from '../missing-components/shared'

const meta = createMissingComponentMeta('Color Controls', 'Color Swatch')
export default meta

export const Default = {
  source: () => createColorSwatch({ label: 'Midnight Blue', value: '#191970' }),
  render: () =>
    `<main class="ui-demo-page"><header><h1>Color Swatch</h1></header><div style="max-width: 18rem">${createColorSwatch({ label: 'Midnight Blue', value: '#191970' })}</div></main>`,
} satisfies StoryLiteStoryDefinition

export const SelectionAndWarning = {
  render: () =>
    `<main class="ui-demo-page"><div style="display:grid;gap:.5rem;max-width:18rem">${createColorSwatch({ label: 'Accent', value: 'oklch(62% 0.18 250)', pressed: true })}${createColorSwatch({ label: 'Muted text', value: '#8e9099', warning: 'Low contrast against page background.' })}</div></main>`,
} satisfies StoryLiteStoryDefinition

const PALETTE = [
  { label: 'Brand red', value: 'oklch(62% 0.18 32)' },
  { label: 'Brand amber', value: 'hwb(38 6% 8%)' },
  { label: 'Brand lime', value: 'color(display-p3 0.63 0.86 0.2)' },
  { label: 'Brand teal', value: 'lch(70% 45 190)' },
  { label: 'Brand blue', value: '#3366cc' },
  { label: 'Brand violet', value: 'oklch(52% 0.24 300)' },
  { label: 'Neutral 500', value: 'hsl(220 8% 46%)' },
  { label: 'Ink', value: 'lab(18% 1.5 -6)' },
]

export const Palette = {
  source: () => createColorPalette({ colors: PALETTE, selected: '#3366cc' }),
  render: () =>
    `<main class="ui-demo-page"><header><h1>Palette grid</h1><p>Swatches keep one shared anatomy across CSS color formats, so a grid of them stays aligned.</p></header>${createColorPalette(
      { colors: PALETTE, selected: '#3366cc' },
    )}</main>`,
} satisfies StoryLiteStoryDefinition
