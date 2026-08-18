import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createToggleGroup } from '../toggle.html'
import { createMissingComponentMeta } from '../missing-components/shared'

const meta = createMissingComponentMeta('Collection Navigation', 'Toggle Group')
export default meta

const alignment = () =>
  createToggleGroup({
    label: 'Text alignment',
    attached: true,
    items: [
      { label: 'Left', value: 'left', pressed: true },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' },
    ],
  })

export const Default = {
  source: alignment,
  render: () =>
    `<main class="ui-demo-page"><header><h1>Toggle Group</h1><p>The group owns selection and roving focus while its direct children stay native buttons.</p></header>${alignment()}</main>`,
} satisfies StoryLiteStoryDefinition

export const MultipleAndVertical = {
  render: () =>
    `<main class="ui-demo-page">${createToggleGroup({
      label: 'Text styles',
      selection: 'multiple',
      orientation: 'vertical',
      attached: true,
      items: [
        { label: 'Bold', value: 'bold', pressed: true },
        { label: 'Italic', value: 'italic' },
        { label: 'Underline', value: 'underline', disabled: true },
      ],
    })}</main>`,
} satisfies StoryLiteStoryDefinition
