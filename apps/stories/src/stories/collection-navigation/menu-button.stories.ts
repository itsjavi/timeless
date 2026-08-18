import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import { createMenuButton } from '../collections.html'
import { createCollectionNavigationMeta } from './shared'

const meta = createCollectionNavigationMeta('Menu Button')
export default meta

type MenuButtonArgs = {
  placement: 'bottom' | 'top' | 'right' | 'left'
}

const defaultArgs: MenuButtonArgs = {
  placement: 'bottom',
}

const defaultArgTypes = {
  placement: { control: 'select', options: ['bottom', 'top', 'right', 'left'] },
} satisfies StoryLiteArgTypes<MenuButtonArgs>

const releaseMenuItems = [
  { label: 'Preview release' },
  { label: 'Copy changelog' },
  { label: 'Include prerelease notes', checked: true },
  { label: 'Archive release', disabled: true },
] as const

export const Default = {
  args: defaultArgs,
  argTypes: defaultArgTypes,
  source: (args = defaultArgs) =>
    createMenuButton({
      id: 'release-menu',
      label: 'Release actions',
      items: releaseMenuItems,
      placement: args.placement,
    }),
  render: (args = defaultArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Menu button</h1>
      <p>The trigger owns menu popup semantics while ui-menu owns roving focus and typeahead.</p>
    </header>
    ${createMenuButton({
      id: 'release-menu',
      label: 'Release actions',
      items: releaseMenuItems,
      placement: args.placement,
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition<MenuButtonArgs>

export const StaticMenu = {
  source: () =>
    createMenuButton({
      id: 'static-menu',
      label: 'Static menu',
      items: releaseMenuItems,
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Static menu fallback</h1>
      <p>Without enhancement, the menu remains authored Light DOM and closed popover content stays hidden.</p>
    </header>
    ${createMenuButton({
      id: 'static-menu',
      label: 'Static menu',
      items: releaseMenuItems,
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition
