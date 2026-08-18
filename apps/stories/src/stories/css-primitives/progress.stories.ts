import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import { primitiveSizes, type PrimitiveSize } from '@timelessui/components'
import { createProgress } from '../primitives.html'
import { createCssPrimitiveMeta } from './shared'

const meta = createCssPrimitiveMeta('Progress')
export default meta

type ProgressArgs = {
  label: string
  value: number
  size: PrimitiveSize
}

const progressArgs: ProgressArgs = {
  label: 'Package build',
  value: 68,
  size: 'md',
}

const progressArgTypes = {
  label: { control: 'text' },
  value: { control: 'number' },
  size: { control: 'select', options: primitiveSizes },
} satisfies StoryLiteArgTypes<ProgressArgs>

export const Default = {
  args: progressArgs,
  argTypes: progressArgTypes,
  source: (args = progressArgs) =>
    createProgress({
      label: args.label,
      value: Math.max(0, Math.min(100, args.value)),
      size: args.size,
      hint: 'Build artifacts are copied after declarations finish.',
    }),
  render: (args = progressArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Progress</h1>
      <p>Native progress keeps platform semantics and accepts the same primitive size scale as other flat indicators.</p>
    </header>
    <section class="ui-primitive-flow" aria-label="Progress examples">
      ${createProgress({
        label: args.label,
        value: Math.max(0, Math.min(100, args.value)),
        size: args.size,
        hint: 'Build artifacts are copied after declarations finish.',
      })}
      ${createProgress({ label: 'Indeterminate task' })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition<ProgressArgs>
