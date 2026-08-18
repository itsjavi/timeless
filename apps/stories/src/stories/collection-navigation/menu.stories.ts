import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createMenu } from '../collections.html'
import { createCollectionNavigationMeta } from './shared'

const meta = createCollectionNavigationMeta('Menu')
export default meta

const menuItems = [
  { label: 'Duplicate' },
  { label: 'Archive' },
  { label: 'Delete', disabled: true },
]
const menubarItems = [
  { label: 'File', children: [{ label: 'New file' }, { label: 'Duplicate' }] },
  { label: 'Edit', children: [{ label: 'Undo' }, { label: 'Redo' }] },
  { label: 'View', children: [{ label: 'Show grid', checked: true }] },
] as const

export const Default = {
  source: () => createMenu({ label: 'Component actions', items: menuItems }),
  render: () =>
    `<main class="ui-demo-page"><header><h1>Menu</h1><p>Menus expose commands with roving keyboard navigation.</p></header>${createMenu({ label: 'Component actions', items: menuItems })}</main>`,
} satisfies StoryLiteStoryDefinition

export const Menubar = {
  source: () =>
    createMenu({
      label: 'Application menu',
      role: 'menubar',
      orientation: 'horizontal',
      items: menubarItems,
    }),
  render: () =>
    `<main class="ui-demo-page"><header><h1>Menubar</h1><p>Top-level items can open authored submenu popovers.</p></header>${createMenu({ label: 'Application menu', role: 'menubar', orientation: 'horizontal', items: menubarItems })}</main>`,
} satisfies StoryLiteStoryDefinition
