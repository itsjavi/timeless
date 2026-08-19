import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import { toolbarOrientations, type ToolbarOrientation } from '@timelessui/components'
import { createToolbar } from '../collections.html'
import { createCollectionNavigationMeta } from './shared'

const meta = createCollectionNavigationMeta('Toolbar')
export default meta

type ToolbarArgs = {
  orientation: ToolbarOrientation
}

const defaultArgs: ToolbarArgs = {
  orientation: 'horizontal',
}

const defaultArgTypes = {
  orientation: { control: 'select', options: toolbarOrientations },
} satisfies StoryLiteArgTypes<ToolbarArgs>

export const Default = {
  args: defaultArgs,
  argTypes: defaultArgTypes,
  source: (args = defaultArgs) =>
    createToolbar({
      label: 'Formatting',
      orientation: args.orientation,
    }),
  render: (args = defaultArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Toolbar</h1>
      <p>Toolbar arrow-key navigation is separate from menu semantics.</p>
    </header>
    ${createToolbar({
      label: 'Formatting',
      orientation: args.orientation,
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition<ToolbarArgs>
