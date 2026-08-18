import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createPopover } from '../overlays.html'
import { createProgressiveOverlayMeta } from './shared'

const meta = createProgressiveOverlayMeta('Popover')
export default meta

export const Default = {
  source: () =>
    createPopover({
      id: 'release-popover',
      triggerLabel: 'Open status',
      title: 'Release status',
      description: 'Native popover opens from the bottom center of its trigger by default.',
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Popover</h1>
      <p>The enhancer wires a trigger to authored popover content with native popovertarget attributes and anchor positioning.</p>
    </header>
    ${createPopover({
      id: 'release-popover',
      triggerLabel: 'Open status',
      title: 'Release status',
      description: 'Native popover opens from the bottom center of its trigger by default.',
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const Placements = {
  source: () => `<div class="ui-overlay-demo-grid">
  ${createPopover({
    id: 'placement-bottom-popover',
    triggerLabel: 'Bottom',
    title: 'Bottom placement',
    description: 'Default placement uses bottom center and tries the other sides when constrained.',
  })}
  ${createPopover({
    id: 'placement-top-popover',
    placement: 'top',
    triggerLabel: 'Top',
    title: 'Top placement',
    description: 'Top placement prefers block-start center before trying other sides.',
  })}
  ${createPopover({
    id: 'placement-right-popover',
    placement: 'right',
    triggerLabel: 'Right',
    title: 'Right placement',
    description: 'Right placement prefers inline-end center before trying other sides.',
  })}
  ${createPopover({
    id: 'placement-left-popover',
    placement: 'left',
    triggerLabel: 'Left',
    title: 'Left placement',
    description: 'Left placement prefers inline-start center before trying other sides.',
  })}
</div>`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Placements</h1>
      <p>Floating content uses CSS anchor positioning with bottom, top, right, and left placement preferences.</p>
    </header>
    <section class="ui-overlay-placement-grid">
      ${createPopover({
        id: 'placement-bottom-popover',
        triggerLabel: 'Bottom',
        title: 'Bottom placement',
        description:
          'Default placement uses bottom center and tries the other sides when constrained.',
      })}
      ${createPopover({
        id: 'placement-top-popover',
        placement: 'top',
        triggerLabel: 'Top',
        title: 'Top placement',
        description: 'Top placement prefers block-start center before trying other sides.',
      })}
      ${createPopover({
        id: 'placement-right-popover',
        placement: 'right',
        triggerLabel: 'Right',
        title: 'Right placement',
        description: 'Right placement prefers inline-end center before trying other sides.',
      })}
      ${createPopover({
        id: 'placement-left-popover',
        placement: 'left',
        triggerLabel: 'Left',
        title: 'Left placement',
        description: 'Left placement prefers inline-start center before trying other sides.',
      })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition

export const InlineActions = {
  source: () =>
    createPopover({
      id: 'actions-popover',
      triggerLabel: 'More actions',
      title: 'Component actions',
      description: 'Use popovers for short contextual actions before graduating to menus.',
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Inline actions</h1>
      <p>Popover stays generic; menu, select, and combobox behavior are left for collection-navigation milestones.</p>
    </header>
    <section class="ui-overlay-demo-panel">
      ${createPopover({
        id: 'actions-popover',
        triggerLabel: 'More actions',
        title: 'Component actions',
        description: 'Use popovers for short contextual actions before graduating to menus.',
      })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition
