import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createCheckboxGroup } from '../collections.html'
import { createCollectionNavigationMeta } from './shared'

const meta = createCollectionNavigationMeta('Checkbox Group')
export default meta

const channelOptions = [
  { label: 'Email' },
  { label: 'Push' },
  { label: 'SMS' },
  { label: 'Phone', disabled: true },
] as const

export const Default = {
  source: () =>
    createCheckboxGroup({
      id: 'channels-checkbox-group',
      label: 'Channels',
      name: 'channels',
      values: ['email', 'push'],
      options: channelOptions,
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Checkbox Group</h1>
      <p>Checkbox groups keep each native checkbox in the tab order and emit grouped values.</p>
    </header>
    ${createCheckboxGroup({
      id: 'channels-checkbox-group',
      label: 'Channels',
      name: 'channels',
      values: ['email', 'push'],
      options: channelOptions,
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const Horizontal = {
  source: () =>
    createCheckboxGroup({
      id: 'views-checkbox-group',
      label: 'Visible panels',
      name: 'views',
      values: ['timeline'],
      orientation: 'horizontal',
      options: [{ label: 'Timeline' }, { label: 'Board' }, { label: 'Calendar' }],
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Horizontal checkbox group</h1>
      <p>Horizontal layout changes only presentation; native checkbox keyboard behavior remains.</p>
    </header>
    ${createCheckboxGroup({
      id: 'views-checkbox-group',
      label: 'Visible panels',
      name: 'views',
      values: ['timeline'],
      orientation: 'horizontal',
      options: [{ label: 'Timeline' }, { label: 'Board' }, { label: 'Calendar' }],
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition
