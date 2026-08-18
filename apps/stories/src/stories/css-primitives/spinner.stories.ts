import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import {
  primitiveSizes,
  spinnerVariants,
  type PrimitiveSize,
  type SpinnerVariant,
} from '@timelessui/components'
import { createSpinner } from '../primitives.html'
import { createCssPrimitiveMeta } from './shared'

const meta = createCssPrimitiveMeta('Spinner')
export default meta

type SpinnerArgs = {
  label: string
  size: PrimitiveSize
  variant: SpinnerVariant
}

const spinnerArgs: SpinnerArgs = {
  label: 'Loading package',
  size: 'md',
  variant: 'accent',
}

const spinnerArgTypes = {
  label: { control: 'text' },
  size: { control: 'select', options: primitiveSizes },
  variant: { control: 'select', options: spinnerVariants },
} satisfies StoryLiteArgTypes<SpinnerArgs>

export const Default = {
  args: spinnerArgs,
  argTypes: spinnerArgTypes,
  source: createSpinner,
  render: (args = spinnerArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Spinner</h1>
      <p>Spinners keep stable dimensions and pair the visual indicator with an accessible status label.</p>
    </header>
    ${createSpinner(args)}
  </main>`,
} satisfies StoryLiteStoryDefinition<SpinnerArgs>

export const LoadingStates = {
  source: () => `${createSpinner({ label: 'Resolving packages', size: 'sm' })}
${createSpinner({ label: 'Building declarations', variant: 'accent' })}
${createSpinner({ label: 'Retrying failed job', size: 'lg', variant: 'danger' })}`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Loading states</h1>
      <p>Use color sparingly. Most loading indicators should stay neutral unless the surrounding state already has semantic meaning.</p>
    </header>
    <section class="ui-primitive-loading-list" aria-label="Loading examples">
      ${createSpinner({ label: 'Resolving packages', size: 'sm' })}
      ${createSpinner({ label: 'Building declarations', variant: 'accent' })}
      ${createSpinner({ label: 'Retrying failed job', size: 'lg', variant: 'danger' })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition
