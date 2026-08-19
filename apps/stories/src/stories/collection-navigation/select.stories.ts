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

const teamGroups = [
  {
    label: 'Product',
    options: [{ label: 'Design' }, { label: 'Research' }, { label: 'Content' }],
  },
  {
    label: 'Engineering',
    options: [{ label: 'Platform' }, { label: 'Frontend' }, { label: 'Data', disabled: true }],
  },
] as const

const cityOptions = [
  { label: 'Amsterdam' },
  { label: 'Barcelona' },
  { label: 'Berlin' },
  { label: 'Copenhagen' },
  { label: 'Dublin' },
  { label: 'Lisbon' },
  { label: 'Madrid' },
  { label: 'Munich' },
  { label: 'Paris' },
  { label: 'Stockholm' },
] as const

const defaultSelect = {
  id: 'role-select',
  label: 'Role',
  name: 'role',
  value: 'engineer',
  options: roleOptions,
} as const

export const Default = {
  source: () => createCustomSelect(defaultSelect),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Select</h1>
      <p>The trigger carries <code>popovertarget</code>, so the surface opens before any script runs. Timeless adds the roles, the relationships, and the form value.</p>
    </header>
    ${createCustomSelect(defaultSelect)}
  </main>`,
} satisfies StoryLiteStoryDefinition

/** The reported defect: the surface used to be centred on the trigger and narrower than it. */
export const Alignment = {
  source: () => `${createCustomSelect({
    id: 'align-start',
    label: 'Start aligned',
    name: 'start',
    value: 'engineer',
    options: roleOptions,
  })}
${createCustomSelect({
  id: 'align-end',
  label: 'End aligned',
  name: 'end',
  align: 'end',
  value: 'engineer',
  options: roleOptions,
})}`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Surface alignment</h1>
      <p>The surface is never narrower than its trigger. It begins at the trigger's inline-start edge by default, and at the inline-end edge under <code>align="end"</code>.</p>
    </header>
    <div class="ui-demo-row">
      ${createCustomSelect({
        id: 'align-start',
        label: 'Start aligned',
        name: 'start',
        value: 'engineer',
        options: roleOptions,
      })}
      ${createCustomSelect({
        id: 'align-end',
        label: 'End aligned',
        name: 'end',
        align: 'end',
        value: 'engineer',
        options: roleOptions,
      })}
    </div>
  </main>`,
} satisfies StoryLiteStoryDefinition

export const GroupedAndSearchable = {
  source: () =>
    createCustomSelect({
      id: 'team-select',
      label: 'Team',
      name: 'team',
      searchable: true,
      groups: teamGroups,
      empty: 'No team matches that filter.',
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Grouped options with in-surface search</h1>
      <p>Focus moves into the <code>search</code> field and stays there; the highlight travels through <code>aria-activedescendant</code>. Left and Right move the caret. A group whose options are all filtered out disappears.</p>
    </header>
    ${createCustomSelect({
      id: 'team-select',
      label: 'Team',
      name: 'team',
      searchable: true,
      groups: teamGroups,
      empty: 'No team matches that filter.',
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const MultipleWithChips = {
  source: () =>
    createCustomSelect({
      id: 'reviewers-select',
      label: 'Reviewers',
      name: 'reviewers',
      multiple: true,
      searchable: true,
      clear: true,
      placeholder: 'Add reviewers',
      options: roleOptions,
      empty: 'Everyone already added.',
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Multiple selection</h1>
      <p>Each selected value becomes a removable chip and submits its own form entry under one name. <kbd>Backspace</kbd> in an empty search field removes the last chip.</p>
    </header>
    ${createCustomSelect({
      id: 'reviewers-select',
      label: 'Reviewers',
      name: 'reviewers',
      multiple: true,
      searchable: true,
      clear: true,
      placeholder: 'Add reviewers',
      options: roleOptions,
      empty: 'Everyone already added.',
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const PagedLongList = {
  source: () =>
    createCustomSelect({
      id: 'city-select',
      label: 'City',
      name: 'city',
      searchable: true,
      pageSize: 4,
      options: cityOptions,
      empty: 'No city matches that filter.',
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Paged options</h1>
      <p>A page window keeps the rendered set small while every rendered option stays a real element. The boundary buttons keep focus and take <code>aria-disabled</code>, so the boundary is discoverable rather than gone.</p>
    </header>
    ${createCustomSelect({
      id: 'city-select',
      label: 'City',
      name: 'city',
      searchable: true,
      pageSize: 4,
      options: cityOptions,
      empty: 'No city matches that filter.',
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition

const assigneeSelect = {
  id: 'assignee-select',
  label: 'Assignee',
  name: 'assignee',
  value: 'designer',
  options: roleOptions,
} as const

const reviewerSelect = {
  id: 'reviewer-select',
  label: 'Reviewer',
  name: 'reviewer',
  required: true,
  placeholder: 'Choose a reviewer',
  options: roleOptions,
} as const

export const FormParticipation = {
  source: () => `<form>
  ${createCustomSelect(assigneeSelect)}
  ${createCustomSelect(reviewerSelect)}
  <button class="ui-button" type="submit">Save</button>
</form>`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Select in a form</h1>
      <p>The element submits its own value through <code>ElementInternals</code> — no hidden input. <code>value</code> is the authored default: it seeds the selection, stops applying once you change it, and comes back on reset. <code>required</code> blocks submission with <code>valueMissing</code>.</p>
    </header>
    <form class="ui-overlay-demo-panel">
      ${createCustomSelect(assigneeSelect)}
      ${createCustomSelect(reviewerSelect)}
      <button class="ui-button" type="submit">Save</button>
    </form>
  </main>`,
} satisfies StoryLiteStoryDefinition
