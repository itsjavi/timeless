import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createGroup } from '../primitives.html'
import { createCssPrimitiveMeta } from './shared'

const meta = createCssPrimitiveMeta('Group')
export default meta

export const Default = {
  source: () => createGroup({ attached: true }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Group</h1>
      <p>Groups arrange native controls without introducing a custom element or behavior controller.</p>
    </header>
    <section class="ui-primitive-flow" aria-label="Group examples">
      ${createGroup({ wrap: true })}
      ${createGroup({ attached: true })}
      ${createGroup({ orientation: 'vertical', density: 'compact' })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition
