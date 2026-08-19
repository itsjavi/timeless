import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import { formDensities, type FormDensity } from '@timelessui/components'
import { createFieldset } from '../form-fields.html'
import { createTextField } from '../forms.html'
import { createFormPrimitiveMeta } from './shared'

const meta = createFormPrimitiveMeta('Fieldset')
export default meta

type FieldsetArgs = {
  density: FormDensity
  disabled: boolean
  invalid: boolean
}

const fieldsetArgs: FieldsetArgs = {
  density: 'normal',
  disabled: false,
  invalid: false,
}

const fieldsetArgTypes = {
  density: { control: 'select', options: formDensities },
  disabled: { control: 'boolean' },
  invalid: { control: 'boolean' },
} satisfies StoryLiteArgTypes<FieldsetArgs>

function createBillingFieldset(args: FieldsetArgs): string {
  return createFieldset({
    id: 'billing',
    legend: 'Billing address',
    description: 'Used on every invoice for this workspace.',
    density: args.density,
    disabled: args.disabled,
    invalid: args.invalid,
    error: args.invalid ? 'This address could not be verified.' : undefined,
    children: [
      createTextField({
        id: 'billing-street',
        name: 'street',
        label: 'Street',
        placeholder: '12 Copperfield Way',
      }),
      createTextField({ id: 'billing-city', name: 'city', label: 'City' }),
      createTextField({ id: 'billing-postcode', name: 'postcode', label: 'Postcode' }),
    ].join('\n  '),
  })
}

export const Default = {
  args: fieldsetArgs,
  argTypes: fieldsetArgTypes,
  source: (args = fieldsetArgs) => createBillingFieldset(args),
  render: (args = fieldsetArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Fieldset</h1>
      <p>
        A native fieldset and legend around controls that are not one field. Disabling the group
        disables and un-submits everything inside it, with no per-control attribute.
      </p>
    </header>
    ${createBillingFieldset(args)}
  </main>`,
} satisfies StoryLiteStoryDefinition<FieldsetArgs>

/**
 * The two groupings side by side, because choosing between them is the decision a reader actually
 * has to make: a fieldset for controls that are merely related, a choice group for a set that
 * answers one question.
 */
export const AgainstChoiceGroup = {
  source: () =>
    [
      createFieldset({
        id: 'contact',
        legend: 'Contact',
        children: [
          createTextField({ id: 'contact-name', name: 'name', label: 'Name' }),
          createTextField({ id: 'contact-email', name: 'email', label: 'Email', type: 'email' }),
        ].join('\n  '),
      }),
      createFieldset({
        id: 'limits',
        legend: 'Limits',
        density: 'compact',
        description: 'Applied to every project in the workspace.',
        children: [
          createTextField({ id: 'limits-seats', name: 'seats', label: 'Seats', value: '25' }),
          createTextField({
            id: 'limits-storage',
            name: 'storage',
            label: 'Storage (GB)',
            value: '500',
          }),
        ].join('\n  '),
      }),
    ].join('\n'),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Density</h1>
      <p>The same group at normal and compact density, which moves both the gap and the padding.</p>
    </header>
    <div class="ui-form-demo-grid">
      ${createFieldset({
        id: 'contact',
        legend: 'Contact',
        children: [
          createTextField({ id: 'contact-name', name: 'name', label: 'Name' }),
          createTextField({ id: 'contact-email', name: 'email', label: 'Email', type: 'email' }),
        ].join('\n  '),
      })}
      ${createFieldset({
        id: 'limits',
        legend: 'Limits',
        density: 'compact',
        description: 'Applied to every project in the workspace.',
        children: [
          createTextField({ id: 'limits-seats', name: 'seats', label: 'Seats', value: '25' }),
          createTextField({
            id: 'limits-storage',
            name: 'storage',
            label: 'Storage (GB)',
            value: '500',
          }),
        ].join('\n  '),
      })}
    </div>
  </main>`,
} satisfies StoryLiteStoryDefinition
