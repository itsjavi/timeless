import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createHoverCard, createTooltip } from '../overlays.html'
import { createProgressiveOverlayMeta } from './shared'

const meta = createProgressiveOverlayMeta('Tooltip')
export default meta

export const Default = {
  source: () =>
    createTooltip({
      id: 'copy-tooltip',
      triggerLabel: 'Copy',
      description: 'Copy package import path',
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Tooltip</h1>
      <p>Tooltip is a hover-card recipe that switches the floating content to tooltip semantics and compact styling.</p>
    </header>
    <section class="ui-demo-row" aria-label="Tooltip example">
      ${createTooltip({
        id: 'copy-tooltip',
        triggerLabel: 'Copy',
        description: 'Copy package import path',
      })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition

export const ToolbarHints = {
  source: () => `${createTooltip({
    id: 'preview-tooltip',
    triggerLabel: 'Preview',
    description: 'Open component preview',
  })}
${createTooltip({
  id: 'docs-tooltip',
  triggerLabel: 'Docs',
  description: 'Open component documentation',
})}`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Toolbar hints</h1>
      <p>Use terse tooltip copy for icon or compact toolbar controls.</p>
    </header>
    <section class="ui-demo-row" aria-label="Toolbar tooltip examples">
      ${createTooltip({
        id: 'preview-tooltip',
        triggerLabel: 'Preview',
        description: 'Open component preview',
      })}
      ${createTooltip({
        id: 'docs-tooltip',
        triggerLabel: 'Docs',
        description: 'Open component documentation',
      })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition

export const AgainstHoverCard = {
  source: () => `${createTooltip({
    id: 'compare-tooltip',
    triggerLabel: 'Tooltip',
    description: 'Open component documentation',
  })}
${createHoverCard({
  id: 'compare-hover-card',
  triggerLabel: 'Hover card',
  title: 'Component documentation',
  description:
    'The reference page lists every attribute, part, public state, and CSS custom property this component declares.',
})}`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Tooltip against Hover Card</h1>
      <p>One custom element, two boxes. The tooltip sizes to its single line, never scrolls, and reserves no viewport height. The hover card is a panel: it caps its width and height and scrolls its own content. Hover or focus each trigger to compare them.</p>
    </header>
    <section class="ui-demo-row" aria-label="Tooltip and hover card comparison">
      ${createTooltip({
        id: 'compare-tooltip',
        triggerLabel: 'Tooltip',
        description: 'Open component documentation',
      })}
      ${createHoverCard({
        id: 'compare-hover-card',
        triggerLabel: 'Hover card',
        title: 'Component documentation',
        description:
          'The reference page lists every attribute, part, public state, and CSS custom property this component declares.',
      })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition
