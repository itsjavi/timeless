import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createColorPicker } from '../color-picker.html'
import { createMissingComponentMeta } from '../missing-components/shared'

const meta = createMissingComponentMeta('Color Controls', 'Color Picker')
export default meta

export const Default = {
  source: () =>
    createColorPicker({ id: 'brand-picker', label: 'Brand color', value: 'oklch(62% 0.18 250)' }),
  render: () =>
    `<main class="ui-demo-page"><header><h1>Color Picker</h1><p>A compact color editing flow built with native controls and Light DOM.</p></header>${createColorPicker({ id: 'brand-picker', label: 'Brand color', value: 'oklch(62% 0.18 250)' })}</main>`,
} satisfies StoryLiteStoryDefinition

export const ContextualAndInvalid = {
  render: () =>
    `<main class="ui-demo-page"><div style="display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(17.5rem,1fr))">${createColorPicker({ id: 'contextual-picker', label: 'Contextual color', value: 'var(--brand)' })}${createColorPicker({ id: 'invalid-picker', label: 'Draft validation', value: 'oklch(0.7 0.254 201)' })}</div></main>`,
} satisfies StoryLiteStoryDefinition
