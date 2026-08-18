import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createCustomSelect } from '../collections.html'
import { createCollectionNavigationMeta } from './shared'

const meta = createCollectionNavigationMeta('Select')
export default meta

const roleOptions = [
  { label: 'Designer' },
  { label: 'Engineer' },
  { label: 'Manager' },
  { label: 'Viewer', disabled: true },
] as const

export const Default = {
  source: () =>
    createCustomSelect({
      id: 'role-select',
      label: 'Role',
      name: 'role',
      value: 'engineer',
      options: roleOptions,
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Select</h1>
      <p>Custom select keeps submitted value ownership in an authored hidden input.</p>
    </header>
    ${createCustomSelect({
      id: 'role-select',
      label: 'Role',
      name: 'role',
      value: 'engineer',
      options: roleOptions,
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const GroupedForm = {
  source: () => `<form>
  ${createCustomSelect({
    id: 'assignee-select',
    label: 'Assignee',
    name: 'assignee',
    value: 'designer',
    options: roleOptions,
  })}
</form>`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Select in a form</h1>
      <p>The hidden input remains the canonical form value.</p>
    </header>
    <form class="ui-overlay-demo-panel">
      ${createCustomSelect({
        id: 'assignee-select',
        label: 'Assignee',
        name: 'assignee',
        value: 'designer',
        options: roleOptions,
      })}
      <button class="ui-button" type="submit">Save</button>
    </form>
  </main>`,
} satisfies StoryLiteStoryDefinition
