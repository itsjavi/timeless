import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createRadioGroup } from '../collections.html'
import { createCollectionNavigationMeta } from './shared'

const meta = createCollectionNavigationMeta('Radio Group')
export default meta

const cadenceOptions = [
  { label: 'Daily' },
  { label: 'Weekly' },
  { label: 'Monthly' },
  { label: 'Paused', disabled: true },
] as const

export const Default = {
  source: () =>
    createRadioGroup({
      id: 'cadence-radio-group',
      label: 'Cadence',
      name: 'cadence',
      value: 'weekly',
      options: cadenceOptions,
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Radio Group</h1>
      <p>Native radio inputs keep form behavior while the group adds roving arrow-key movement.</p>
    </header>
    ${createRadioGroup({
      id: 'cadence-radio-group',
      label: 'Cadence',
      name: 'cadence',
      value: 'weekly',
      options: cadenceOptions,
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const Horizontal = {
  source: () =>
    createRadioGroup({
      id: 'density-radio-group',
      label: 'Density',
      name: 'density',
      value: 'compact',
      orientation: 'horizontal',
      options: [{ label: 'Compact' }, { label: 'Comfortable' }, { label: 'Spacious' }],
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Horizontal radio group</h1>
      <p>Orientation controls which arrow keys move through the native inputs.</p>
    </header>
    ${createRadioGroup({
      id: 'density-radio-group',
      label: 'Density',
      name: 'density',
      value: 'compact',
      orientation: 'horizontal',
      options: [{ label: 'Compact' }, { label: 'Comfortable' }, { label: 'Spacious' }],
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition
