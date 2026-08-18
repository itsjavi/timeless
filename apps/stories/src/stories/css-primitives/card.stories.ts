import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createCard } from '../primitives.html'
import { createCssPrimitiveMeta } from './shared'

const meta = createCssPrimitiveMeta('Card')
export default meta

export const Default = {
  source: () =>
    createCard({
      title: 'Atmosphere tokens',
      description: 'Surface, radius, and shadow tokens now have stable public names.',
      meta: 'Milestone 003',
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Card</h1>
      <p>Cards remain flat content containers. Depth is reserved for controls and later overlays.</p>
    </header>
    <section class="ui-primitive-grid" aria-label="Card examples">
      ${createCard({
        title: 'Atmosphere tokens',
        description: 'Surface, radius, and shadow tokens now have stable public names.',
        meta: 'Milestone 003',
      })}
      ${createCard({
        title: 'Flat filled card',
        description: 'Filled cards use a raised surface without a drop shadow.',
        variant: 'filled',
        density: 'compact',
      })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition
