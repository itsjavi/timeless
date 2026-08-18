import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createNumberStepper } from '../number-stepper.html'
import { createMissingComponentMeta } from '../missing-components/shared'

const meta = createMissingComponentMeta('Form Primitives', 'Number Stepper')
export default meta

export const Default = {
  source: () =>
    createNumberStepper({ id: 'quantity', label: 'Quantity', value: 2, min: 0, max: 10, step: 1 }),
  render: () =>
    `<main class="ui-demo-page"><header><h1>Number Stepper</h1></header>${createNumberStepper({ id: 'quantity', label: 'Quantity', value: 2, min: 0, max: 10, step: 1 })}</main>`,
} satisfies StoryLiteStoryDefinition

export const Decimal = {
  render: () =>
    `<main class="ui-demo-page">${createNumberStepper({ id: 'opacity-step', label: 'Opacity', value: 0.5, min: 0, max: 1, step: 0.1 })}</main>`,
} satisfies StoryLiteStoryDefinition
