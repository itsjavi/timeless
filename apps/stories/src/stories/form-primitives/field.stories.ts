import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import {
  fieldLayouts,
  formControlSizes,
  formDensities,
  type FieldLayout,
  type FormControlSize,
  type FormDensity,
} from '@timelessui/components'
import { createTextField, createTextareaField } from '../forms.html'
import { createFormPrimitiveMeta } from './shared'

const meta = createFormPrimitiveMeta('Field')
export default meta

type FieldArgs = {
  label: string
  description: string
  placeholder: string
  size: FormControlSize
  layout: FieldLayout
  density: FormDensity
  required: boolean
  invalid: boolean
  disabled: boolean
  readonly: boolean
}

const fieldArgs: FieldArgs = {
  label: 'Email',
  description: 'Use the address for your workspace account.',
  placeholder: 'you@example.com',
  size: 'md',
  layout: 'stacked',
  density: 'normal',
  required: true,
  invalid: false,
  disabled: false,
  readonly: false,
}

const fieldArgTypes = {
  label: { control: 'text' },
  description: { control: 'text' },
  placeholder: { control: 'text' },
  size: { control: 'select', options: formControlSizes },
  layout: { control: 'select', options: fieldLayouts },
  density: { control: 'select', options: formDensities },
  required: { control: 'boolean' },
  invalid: { control: 'boolean' },
  disabled: { control: 'boolean' },
  readonly: { control: 'boolean' },
} satisfies StoryLiteArgTypes<FieldArgs>

export const Default = {
  args: fieldArgs,
  argTypes: fieldArgTypes,
  source: (args = fieldArgs) => createFieldFromArgs(args),
  render: (args = fieldArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Field</h1>
      <p>Field anatomy keeps labels, descriptions, errors, and native controls connected without JavaScript.</p>
    </header>
    ${createFieldFromArgs(args)}
  </main>`,
} satisfies StoryLiteStoryDefinition<FieldArgs>

export const Validation = {
  source: () => `${createTextField({
    id: 'validation-email',
    name: 'email',
    label: 'Email',
    type: 'email',
    value: 'not-an-email',
    description: 'Use a valid email address.',
    error: 'Enter an email address with an @ symbol.',
    required: true,
    invalid: true,
  })}
${createTextareaField({
  id: 'validation-notes',
  name: 'notes',
  label: 'Release notes',
  value: 'Tokens changed',
  description: 'Visible help text can sit next to invalid fields.',
  readonly: true,
})}`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Validation states</h1>
      <p>Invalid state combines native <code class="ui-code">aria-invalid</code>, error text, and a visible edge color.</p>
    </header>
    <section class="ui-form-demo-grid" aria-label="Validation examples">
      ${createTextField({
        id: 'validation-email',
        name: 'email',
        label: 'Email',
        type: 'email',
        value: 'not-an-email',
        description: 'Use a valid email address.',
        error: 'Enter an email address with an @ symbol.',
        required: true,
        invalid: true,
      })}
      ${createTextareaField({
        id: 'validation-notes',
        name: 'notes',
        label: 'Release notes',
        value: 'Tokens changed',
        description: 'Visible help text can sit next to invalid fields.',
        readonly: true,
      })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition

function createFieldFromArgs(args: FieldArgs): string {
  return createTextField({
    id: 'field-email',
    name: 'email',
    label: args.label,
    type: 'email',
    placeholder: args.placeholder,
    description: args.description,
    error: args.invalid ? 'Enter a valid email address.' : undefined,
    size: args.size,
    layout: args.layout,
    density: args.density,
    required: args.required,
    invalid: args.invalid,
    disabled: args.disabled,
    readonly: args.readonly,
  })
}
