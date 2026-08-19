import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createServerErrorForm, serverErrorFormScript } from '../form-fields.html'
import { createFormPrimitiveMeta } from './shared'

const meta = createFormPrimitiveMeta('Form')
export default meta

/**
 * `source` is the code a consumer writes. `render` wraps the same wiring in a demo element, because
 * a `<script>` injected as story markup never runs.
 */
export const Default = {
  source: () => `${createServerErrorForm()}

<script type="module">
${serverErrorFormScript}
</script>`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Form</h1>
      <p>
        Save stands in for a server round trip. Each message lands on its own field, focus moves to
        the first one, and editing a field clears its message. Everything else — <code>required</code>,
        <code>type="email"</code>, submission — is still native constraint validation.
      </p>
    </header>
    <story-server-errors>
      ${createServerErrorForm()}
    </story-server-errors>
  </main>`,
} satisfies StoryLiteStoryDefinition
