import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import {
  choiceGroupOrientations,
  formDensities,
  type ChoiceGroupOrientation,
  type FormDensity,
} from '@timelessui/components'
import { createChoiceGroup } from '../forms.html'
import { createFormPrimitiveMeta } from './shared'

const meta = createFormPrimitiveMeta('Choice Group')
export default meta

type ChoiceGroupArgs = {
  orientation: ChoiceGroupOrientation
  density: FormDensity
  invalid: boolean
}

const choiceGroupArgs: ChoiceGroupArgs = {
  orientation: 'vertical',
  density: 'normal',
  invalid: false,
}

const choiceGroupArgTypes = {
  orientation: { control: 'select', options: choiceGroupOrientations },
  density: { control: 'select', options: formDensities },
  invalid: { control: 'boolean' },
} satisfies StoryLiteArgTypes<ChoiceGroupArgs>

export const Default = {
  args: choiceGroupArgs,
  argTypes: choiceGroupArgTypes,
  source: (args = choiceGroupArgs) => createPermissionsGroup(args),
  render: (args = choiceGroupArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Choice group</h1>
      <p>Checkbox and radio groups use native fieldsets, legends, inputs, and labels.</p>
    </header>
    ${createPermissionsGroup(args)}
  </main>`,
} satisfies StoryLiteStoryDefinition<ChoiceGroupArgs>

export const RadioGroup = {
  source: () =>
    createChoiceGroup({
      legend: 'Release channel',
      name: 'release-channel',
      type: 'radio',
      orientation: 'horizontal',
      description: 'Only one channel can be active for automated releases.',
      options: [
        {
          value: 'stable',
          label: 'Stable',
          description: 'Publish after all checks pass.',
          checked: true,
        },
        { value: 'beta', label: 'Beta', description: 'Publish prerelease builds.' },
        { value: 'manual', label: 'Manual', description: 'Prepare artifacts without publishing.' },
      ],
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Radio group</h1>
      <p>Radio options share one native name so the browser owns exclusivity and submitted value.</p>
    </header>
    ${createChoiceGroup({
      legend: 'Release channel',
      name: 'release-channel',
      type: 'radio',
      orientation: 'horizontal',
      description: 'Only one channel can be active for automated releases.',
      options: [
        {
          value: 'stable',
          label: 'Stable',
          description: 'Publish after all checks pass.',
          checked: true,
        },
        { value: 'beta', label: 'Beta', description: 'Publish prerelease builds.' },
        { value: 'manual', label: 'Manual', description: 'Prepare artifacts without publishing.' },
      ],
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition

function createPermissionsGroup(args: ChoiceGroupArgs): string {
  return createChoiceGroup({
    legend: 'Permissions',
    name: 'permissions',
    type: 'checkbox',
    orientation: args.orientation,
    density: args.density,
    description: 'Choose the areas this member can update.',
    error: args.invalid ? 'Select at least one permission.' : undefined,
    invalid: args.invalid,
    options: [
      {
        value: 'components',
        label: 'Components',
        description: 'Edit package CSS and contracts.',
        checked: true,
      },
      {
        value: 'stories',
        label: 'Stories',
        description: 'Update StoryLite examples and docs.',
        checked: true,
      },
      {
        value: 'release',
        label: 'Release',
        description: 'Publish package artifacts.',
        disabled: true,
      },
    ],
  })
}
