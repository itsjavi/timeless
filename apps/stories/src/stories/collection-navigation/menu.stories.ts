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

const viewGroups = [
  {
    label: 'View',
    items: [
      { label: 'Show grid', checkable: 'checkbox', checked: true },
      { label: 'Show rulers', checkable: 'checkbox' },
    ],
  },
  {
    label: 'Density',
    items: [
      { label: 'Comfortable', checkable: 'radio', checked: true },
      { label: 'Compact', checkable: 'radio' },
    ],
  },
] as const

const menubarItems = [
  {
    label: 'File',
    children: [
      { label: 'New file' },
      { label: 'Duplicate' },
      {
        label: 'Export as',
        children: [{ label: 'PNG' }, { label: 'SVG' }, { label: 'PDF' }],
      },
    ],
  },
  { label: 'Edit', children: [{ label: 'Undo' }, { label: 'Redo' }] },
  { label: 'View', children: [{ label: 'Show grid', checkable: 'checkbox', checked: true }] },
] as const

export const Default = {
  source: () => createMenu({ label: 'Component actions', items: menuItems }),
  render: () =>
    `<main class="ui-demo-page"><header><h1>Menu</h1><p>Menus expose commands with roving keyboard navigation.</p></header>${createMenu({ label: 'Component actions', items: menuItems })}</main>`,
} satisfies StoryLiteStoryDefinition

/**
 * Groups and checkable commands together, because the two are related: a `menuitemradio` clears only
 * the radios inside its own group, so the grouping is what makes two radio sets in one menu work.
 */
export const GroupedAndCheckable = {
  source: () => createMenu({ label: 'View options', items: menuItems, groups: viewGroups }),
  render: () =>
    `<main class="ui-demo-page"><header><h1>Groups and checkable items</h1><p>Timeless writes <code>aria-checked</code> on activation, and names each group from its label. Arrow keys travel through the grouped items and skip the separators.</p></header>${createMenu(
      { label: 'View options', items: menuItems, groups: viewGroups },
    )}</main>`,
} satisfies StoryLiteStoryDefinition

/**
 * Two levels of submenu, which is what the Arrow Right and Arrow Left keys are for. The second
 * level proves the keys work at depth rather than only along the bar.
 */
export const Menubar = {
  source: () =>
    createMenu({
      label: 'Application menu',
      role: 'menubar',
      orientation: 'horizontal',
      items: menubarItems,
    }),
  render: () =>
    `<main class="ui-demo-page"><header><h1>Menubar</h1><p>Arrow Right opens a submenu at any depth; Arrow Left closes it, or moves along the bar from a first-level submenu. Both keys swap under <code>dir="rtl"</code>.</p></header>${createMenu({ label: 'Application menu', role: 'menubar', orientation: 'horizontal', items: menubarItems })}</main>`,
} satisfies StoryLiteStoryDefinition
