import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createList } from '../primitives.html'
import { createCssPrimitiveMeta } from './shared'

const meta = createCssPrimitiveMeta('List')
export default meta

export const Default = {
  source: () => createList({ variant: 'divided' }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>List</h1>
      <p>Lists use native <code class="ui-code">ul</code> and <code class="ui-code">ol</code> elements with optional divided or inset presentation. Numbering comes from choosing <code class="ui-code">ol</code>, never from an attribute.</p>
    </header>
    <section class="ui-primitive-grid" aria-label="List examples">
      ${createList({ variant: 'divided' })}
      ${createList({ variant: 'inset', density: 'compact' })}
      ${createList({ ordered: true })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition
