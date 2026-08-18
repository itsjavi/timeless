import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createToggle } from '../toggle.html'
import { createMissingComponentMeta } from '../missing-components/shared'

const meta = createMissingComponentMeta('CSS Primitives', 'Toggle')
export default meta

export const Default = {
  source: () => `${createToggle({ label: 'Bold' })}
<script>
  const toggle = document.querySelector('.ui-toggle')
  toggle?.addEventListener('click', () => {
    toggle.setAttribute('aria-pressed', String(toggle.getAttribute('aria-pressed') !== 'true'))
  })
</script>`,
  render: () => `<main class="ui-demo-page">
    <header><h1>Toggle</h1><p>A native pressed button. The application owns standalone state.</p></header>
    ${createToggle({ label: 'Bold' })}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const States = {
  render: () => `<main class="ui-demo-page">
    <header><h1>Toggle states</h1></header>
    <div class="ui-demo-row">${createToggle({ label: 'Off' })}${createToggle({ label: 'On', pressed: true })}<button class="ui-button ui-toggle" type="button" aria-pressed="false" disabled>Disabled</button></div>
  </main>`,
} satisfies StoryLiteStoryDefinition
