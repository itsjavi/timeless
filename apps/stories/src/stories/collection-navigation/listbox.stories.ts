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

const permissionGroups = [
  {
    label: 'Content',
    options: [{ label: 'Read posts' }, { label: 'Write posts' }, { label: 'Publish posts' }],
  },
  {
    label: 'Administration',
    options: [
      { label: 'Manage members' },
      { label: 'Manage billing' },
      { label: 'Delete workspace', disabled: true },
    ],
  },
] as const

const regionOptions = Array.from({ length: 12 }, (_, index) => ({
  label: `Region ${String(index + 1).padStart(2, '0')}`,
}))

const defaultListbox = {
  id: 'status-listbox',
  label: 'Status',
  name: 'status',
  value: 'in-progress',
  options: statusOptions,
} as const

export const Default = {
  source: () => createListbox(defaultListbox),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Listbox</h1>
      <p>The inline listbox is the core Select and Combobox compose. It owns option semantics, selection, roving focus, typeahead, and its own form value.</p>
    </header>
    ${createListbox(defaultListbox)}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const Multiple = {
  source: () =>
    createListbox({
      id: 'review-listbox',
      label: 'Review stages',
      name: 'stages',
      multiple: true,
      options: [
        { label: 'Design', selected: true },
        { label: 'Engineering', selected: true },
        { label: 'Legal' },
        { label: 'Finance', disabled: true },
      ],
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Multiple listbox</h1>
      <p>Authored <code>aria-selected</code> survives enhancement, options toggle independently, and each selected value submits its own form entry under one name.</p>
    </header>
    ${createListbox({
      id: 'review-listbox',
      label: 'Review stages',
      name: 'stages',
      multiple: true,
      options: [
        { label: 'Design', selected: true },
        { label: 'Engineering', selected: true },
        { label: 'Legal' },
        { label: 'Finance', disabled: true },
      ],
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const Grouped = {
  source: () =>
    createListbox({
      id: 'permissions-listbox',
      label: 'Permissions',
      name: 'permissions',
      multiple: true,
      groups: permissionGroups,
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Grouped options</h1>
      <p>Options inside a <code>group</code> stay in one flat navigation order, and each group is labelled with <code>aria-labelledby</code>. Arrow keys never stop on a group label.</p>
    </header>
    ${createListbox({
      id: 'permissions-listbox',
      label: 'Permissions',
      name: 'permissions',
      multiple: true,
      groups: permissionGroups,
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const Paged = {
  source: () =>
    createListbox({
      id: 'region-listbox',
      label: 'Region',
      name: 'region',
      pageSize: 5,
      options: regionOptions,
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Paged options</h1>
      <p>Twelve options, five per page. Paging renders a window rather than virtualising: every rendered option is a real element, so find-in-page and assistive technology see what is there.</p>
    </header>
    ${createListbox({
      id: 'region-listbox',
      label: 'Region',
      name: 'region',
      pageSize: 5,
      options: regionOptions,
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition
