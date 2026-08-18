import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { escapeHtml } from '../../lib/utils'
import { createDisclosure } from '../primitives.html'
import { createCssPrimitiveMeta } from './shared'

const meta = createCssPrimitiveMeta('Disclosure')
export default meta

export const Default = {
  source: createDisclosure,
  render: () => {
    const source = createDisclosure()

    return `<main class="ui-demo-page">
      <header>
        <h1>Disclosure</h1>
        <p>Native <code class="ui-code">details</code> and <code class="ui-code">summary</code> provide the interaction; CSS styles the public anatomy.</p>
      </header>
      ${source}
      <pre class="ui-code" tabindex="0"><code>${escapeHtml(source)}</code></pre>
    </main>`
  },
} satisfies StoryLiteStoryDefinition
