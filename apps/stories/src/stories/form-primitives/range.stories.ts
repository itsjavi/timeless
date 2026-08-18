import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import { formControlSizes, type FormControlSize } from '@timelessui/components'
import { createRangeField } from '../forms.html'
import { createFormPrimitiveMeta } from './shared'

const meta = createFormPrimitiveMeta('Range')
export default meta

type RangeArgs = {
  value: number
  size: FormControlSize
  disabled: boolean
}

const rangeArgs: RangeArgs = {
  value: 65,
  size: 'md',
  disabled: false,
}

const rangeArgTypes = {
  value: { control: 'number' },
  size: { control: 'select', options: formControlSizes },
  disabled: { control: 'boolean' },
} satisfies StoryLiteArgTypes<RangeArgs>

export const Default = {
  args: rangeArgs,
  argTypes: rangeArgTypes,
  source: (args = rangeArgs) =>
    createRangeField({
      id: 'range-confidence',
      name: 'confidence',
      label: 'Confidence',
      min: 0,
      max: 100,
      value: Math.max(0, Math.min(100, args.value)),
      size: args.size,
      disabled: args.disabled,
      description: 'Native range input with shared focus and disabled treatment.',
    }),
  render: (args = rangeArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Range</h1>
      <p>Range styling stays native and keeps the browser-owned slider interaction.</p>
    </header>
    ${createRangeField({
      id: 'range-confidence',
      name: 'confidence',
      label: 'Confidence',
      min: 0,
      max: 100,
      value: Math.max(0, Math.min(100, args.value)),
      size: args.size,
      disabled: args.disabled,
      description: 'Native range input with shared focus and disabled treatment.',
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition<RangeArgs>
