import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import { createRangeFieldPair } from '../form-fields.html'
import { createRangeField } from '../forms.html'
import { createFormPrimitiveMeta } from './shared'

const meta = createFormPrimitiveMeta('Range Field')
export default meta

type RangeFieldArgs = {
  from: number
  to: number
  step: number
  disabled: boolean
}

const rangeFieldArgs: RangeFieldArgs = {
  from: 120,
  to: 380,
  step: 10,
  disabled: false,
}

const rangeFieldArgTypes = {
  from: { control: 'number' },
  to: { control: 'number' },
  step: { control: 'number' },
  disabled: { control: 'boolean' },
} satisfies StoryLiteArgTypes<RangeFieldArgs>

function createBudgetRange(args: RangeFieldArgs): string {
  const from = Math.max(0, Math.min(500, args.from))

  return createRangeFieldPair({
    id: 'budget',
    name: 'budget',
    label: 'Monthly budget',
    min: 0,
    max: 500,
    step: Math.max(1, args.step),
    from,
    to: Math.max(from, Math.min(500, args.to)),
    disabled: args.disabled,
    description: 'A thumb stops at its neighbour rather than swapping with it.',
  })
}

export const Default = {
  args: rangeFieldArgs,
  argTypes: rangeFieldArgTypes,
  source: (args = rangeFieldArgs) => createBudgetRange(args),
  render: (args = rangeFieldArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Range Field</h1>
      <p>
        Two native range inputs share one track. Each is its own tab stop with its own accessible
        name, and each submits under its own name.
      </p>
    </header>
    ${createBudgetRange(args)}
  </main>`,
} satisfies StoryLiteStoryDefinition<RangeFieldArgs>

/**
 * The single-thumb Range beside the pair, because the choice between them is the decision worth
 * showing: one is CSS over a native input and needs no JavaScript, the other coordinates two.
 */
export const AgainstSingleThumb = {
  source: () =>
    [
      createRangeField({
        id: 'range-quality',
        name: 'quality',
        label: 'Quality',
        min: 0,
        max: 100,
        value: 72,
        description: 'One value. CSS only.',
      }),
      createRangeFieldPair({
        id: 'delivery-window',
        name: 'delivery',
        label: 'Delivery window (days)',
        min: 1,
        max: 30,
        from: 4,
        to: 12,
        description: 'A span. Two native thumbs kept in order.',
      }),
    ].join('\n'),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>One value, or a span</h1>
      <p>Reach for the pair only when the answer has two ends.</p>
    </header>
    <div class="ui-form-demo-grid">
      ${createRangeField({
        id: 'range-quality',
        name: 'quality',
        label: 'Quality',
        min: 0,
        max: 100,
        value: 72,
        description: 'One value. CSS only.',
      })}
      ${createRangeFieldPair({
        id: 'delivery-window',
        name: 'delivery',
        label: 'Delivery window (days)',
        min: 1,
        max: 30,
        from: 4,
        to: 12,
        description: 'A span. Two native thumbs kept in order.',
      })}
    </div>
  </main>`,
} satisfies StoryLiteStoryDefinition
