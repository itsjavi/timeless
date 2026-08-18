import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createTable } from '../primitives.html'
import { createCssPrimitiveMeta } from './shared'

const meta = createCssPrimitiveMeta('Table')
export default meta

export const Default = {
  source: createTable,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Table</h1>
      <p>Tables prioritize density, alignment, captions, and readable row states over decorative depth.</p>
    </header>
    ${createTable()}
  </main>`,
} satisfies StoryLiteStoryDefinition
