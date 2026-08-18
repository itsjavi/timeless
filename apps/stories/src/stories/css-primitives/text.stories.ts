import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createTextPrimitives } from '../primitives.html'
import { createCssPrimitiveMeta } from './shared'

const meta = createCssPrimitiveMeta('Text')
export default meta

export const Default = {
  source: () => `<p>
  Use <a class="ui-link" href="#link">links</a>,
  <code class="ui-code">inline code</code>,
  and <kbd class="ui-kbd">Cmd</kbd><kbd class="ui-kbd">K</kbd>
  in dense interface text.
</p>`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Link, Kbd, and Code</h1>
      <p>Inline text primitives stay flat and inherit the surrounding typography scale.</p>
    </header>
    ${createTextPrimitives()}
  </main>`,
} satisfies StoryLiteStoryDefinition
