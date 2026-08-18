import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import { formControlSizes, type FormControlSize } from '@timelessui/components'
import { createSelectField } from '../forms.html'
import { createFormPrimitiveMeta } from './shared'

const meta = createFormPrimitiveMeta('Select')
export default meta

type SelectArgs = {
  label: string
  value: string
  size: FormControlSize
  required: boolean
  invalid: boolean
  disabled: boolean
}

const selectArgs: SelectArgs = {
  label: 'Role',
  value: 'maintainer',
  size: 'md',
  required: false,
  invalid: false,
  disabled: false,
}

const selectArgTypes = {
  label: { control: 'text' },
  value: {
    control: 'select',
    options: ['reader', 'maintainer', 'admin'],
  },
  size: { control: 'select', options: formControlSizes },
  required: { control: 'boolean' },
  invalid: { control: 'boolean' },
  disabled: { control: 'boolean' },
} satisfies StoryLiteArgTypes<SelectArgs>

export const Default = {
  args: selectArgs,
  argTypes: selectArgTypes,
  source: (args = selectArgs) => createSelectFromArgs(args),
  render: (args = selectArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Select</h1>
      <p>Native selects stay submission-friendly and keyboard-operable while sharing the control surface treatment.</p>
    </header>
    ${createSelectFromArgs(args)}
  </main>`,
} satisfies StoryLiteStoryDefinition<SelectArgs>

export const InlineLayout = {
  source: () =>
    createSelectField({
      id: 'select-timezone',
      name: 'timezone',
      label: 'Timezone',
      value: 'cet',
      layout: 'inline',
      description: 'Used for scheduled reminders and release windows.',
      options: [
        ['pst', 'Pacific Time'],
        ['est', 'Eastern Time'],
        ['cet', 'Central European Time'],
      ],
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Inline select</h1>
      <p>Inline fields collapse to a stacked layout on narrow screens.</p>
    </header>
    ${createSelectField({
      id: 'select-timezone',
      name: 'timezone',
      label: 'Timezone',
      value: 'cet',
      layout: 'inline',
      description: 'Used for scheduled reminders and release windows.',
      options: [
        ['pst', 'Pacific Time'],
        ['est', 'Eastern Time'],
        ['cet', 'Central European Time'],
      ],
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition

function createSelectFromArgs(args: SelectArgs): string {
  return createSelectField({
    id: 'select-role',
    name: 'role',
    label: args.label,
    value: args.value,
    size: args.size,
    description: 'Choose the access level for this workspace member.',
    error: args.invalid ? 'Select a role before continuing.' : undefined,
    required: args.required,
    invalid: args.invalid,
    disabled: args.disabled,
    options: [
      ['reader', 'Reader'],
      ['maintainer', 'Maintainer'],
      ['admin', 'Admin'],
    ],
  })
}
