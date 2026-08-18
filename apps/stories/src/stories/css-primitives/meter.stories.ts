import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createMeter } from '../meter.html'
import { createMissingComponentMeta } from '../missing-components/shared'

const meta = createMissingComponentMeta('CSS Primitives', 'Meter')
export default meta

export const Default = {
  source: () =>
    createMeter({
      id: 'storage',
      label: 'Storage',
      value: 42,
      max: 100,
      low: 70,
      high: 90,
      optimum: 20,
      hint: 'Resets next month.',
    }),
  render: () =>
    `<main class="ui-demo-page"><header><h1>Meter</h1></header>${createMeter({ id: 'storage', label: 'Storage', value: 42, max: 100, low: 70, high: 90, optimum: 20, hint: 'Resets next month.' })}</main>`,
} satisfies StoryLiteStoryDefinition

export const Thresholds = {
  render: () =>
    `<main class="ui-demo-page">${createMeter({ id: 'healthy', label: 'Healthy', value: 35, max: 100, low: 60, high: 85, optimum: 20 })}${createMeter({ id: 'warning', label: 'Warning', value: 72, max: 100, low: 60, high: 85, optimum: 20 })}${createMeter({ id: 'critical', label: 'Critical', value: 94, max: 100, low: 60, high: 85, optimum: 20 })}</main>`,
} satisfies StoryLiteStoryDefinition
