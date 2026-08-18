import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createTooltip } from '../overlays.html'
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
