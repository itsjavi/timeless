import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createListbox } from '../collections.html'
import { createCollectionNavigationMeta } from './shared'

const meta = createCollectionNavigationMeta('Listbox')
export default meta

const statusOptions = [
  { label: 'Backlog' },
  { label: 'In progress' },
  { label: 'Ready for review' },
  { label: 'Shipped' },
  { label: 'Archived', disabled: true },
] as const

export const Default = {
  source: () =>
    createListbox({
      id: 'status-listbox',
      label: 'Status',
      value: 'in-progress',
      options: statusOptions,
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Listbox</h1>
      <p>Listbox owns option semantics, selected state, roving focus, and typeahead.</p>
    </header>
    ${createListbox({
      id: 'status-listbox',
      label: 'Status',
      value: 'in-progress',
      options: statusOptions,
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const Multiple = {
  source: () =>
    createListbox({
      id: 'review-listbox',
      label: 'Review stages',
      multiple: true,
      options: [
        { label: 'Design', checked: true },
        { label: 'Engineering', checked: true },
        { label: 'Legal' },
        { label: 'Finance', disabled: true },
      ],
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Multiple listbox</h1>
      <p>Multiple mode preserves authored selected states and toggles options independently.</p>
    </header>
    ${createListbox({
      id: 'review-listbox',
      label: 'Review stages',
      multiple: true,
      options: [
        { label: 'Design', checked: true },
        { label: 'Engineering', checked: true },
        { label: 'Legal' },
        { label: 'Finance', disabled: true },
      ],
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition
