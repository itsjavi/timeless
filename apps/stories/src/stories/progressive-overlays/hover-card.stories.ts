import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createHoverCard } from '../overlays.html'
import { createProgressiveOverlayMeta } from './shared'

const meta = createProgressiveOverlayMeta('Hover Card')
export default meta

export const Default = {
  source: () =>
    createHoverCard({
      id: 'component-hover-card',
      triggerLabel: 'Button',
      title: 'Button',
      description:
        'Button is a native control with Atmosphere depth, explicit variants, and form-safe behavior.',
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Hover Card</h1>
      <p>Hover card content uses a manual popover and opens from pointer or focus intent.</p>
    </header>
    ${createHoverCard({
      id: 'component-hover-card',
      triggerLabel: 'Button',
      title: 'Button',
      description:
        'Button is a native control with Atmosphere depth, explicit variants, and form-safe behavior.',
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const DenseReference = {
  source: () =>
    createHoverCard({
      id: 'token-hover-card',
      triggerLabel: 'Atmosphere tokens',
      title: 'Atmosphere tokens',
      description:
        'Depth is reserved for controls and floating layers; flat primitives stay quiet.',
      openDelay: 80,
      closeDelay: 80,
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Dense reference</h1>
      <p>Shorter intent delays are useful in dense documentation indexes where users scan many terms.</p>
    </header>
    ${createHoverCard({
      id: 'token-hover-card',
      triggerLabel: 'Atmosphere tokens',
      title: 'Atmosphere tokens',
      description:
        'Depth is reserved for controls and floating layers; flat primitives stay quiet.',
      openDelay: 80,
      closeDelay: 80,
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition
