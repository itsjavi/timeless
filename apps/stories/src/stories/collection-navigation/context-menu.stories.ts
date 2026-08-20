import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createContextMenu } from '../collections.html'
import { createCollectionNavigationMeta } from './shared'
import demoCss from './context-menu.stories.css?raw'

const meta = createCollectionNavigationMeta('Context Menu', [demoCss])
export default meta

const assetMenu = {
  id: 'asset-context-menu',
  label: 'Asset commands',
  targetLabel: 'hero-banner.avif',
  items: [{ label: 'Open' }, { label: 'Rename' }],
  groups: [
    {
      label: 'Share',
      items: [{ label: 'Copy link' }, { label: 'Invite reviewer' }],
    },
  ],
} as const

const rowMenu = {
  id: 'row-context-menu',
  label: 'Row commands',
  targetLabel: 'Q3 revenue report',
  items: [{ label: 'Open' }, { label: 'Duplicate' }, { label: 'Delete', disabled: true }],
  groups: [
    {
      label: 'Visibility',
      items: [
        { label: 'Pinned', checkable: 'checkbox', checked: true },
        { label: 'Archived', checkable: 'checkbox' },
      ],
    },
  ],
} as const

export const Default = {
  source: () => createContextMenu(assetMenu),
  render: () =>
    `<main class="ui-demo-page"><header><h1>Context Menu</h1><p>Right-click the region, or focus it and press Shift+F10.</p></header>${createContextMenu(
      assetMenu,
    )}</main>`,
} satisfies StoryLiteStoryDefinition

/**
 * Two regions on one page, each with its own commands. The second carries checkable items, so the
 * menu that opens over a row can report that row's state rather than only acting on it.
 */
export const PerRegion = {
  source: () => `${createContextMenu(assetMenu)}\n${createContextMenu(rowMenu)}`,
  render: () =>
    `<main class="ui-demo-page"><header><h1>One menu per region</h1><p>Each region opens its own commands at the pointer. There is no no-JavaScript fallback for this pattern, so nothing here is the only route to a command.</p></header>${createContextMenu(
      assetMenu,
    )}${createContextMenu(rowMenu)}</main>`,
} satisfies StoryLiteStoryDefinition
