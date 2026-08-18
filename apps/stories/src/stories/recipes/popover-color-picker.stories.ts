import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { getExample, renderExample } from '@timelessui/examples'
import { createRecipeMeta } from './shared'

const example = getExample('popover-color-picker')!
const meta = createRecipeMeta('Color/Popover Color Picker')
export default meta

const page = () =>
  `<header><h1>Popover color picker</h1><p>Compose an authored color editor with native popover behavior.</p></header>${renderExample(example)}`

/** Runs the documented consumer wiring so the demo swatch tracks the edited value. */
function mount(html: string): HTMLElement {
  const root = document.createElement('main')
  root.className = 'ui-demo-page'
  root.innerHTML = html
  if (example.script) {
    const script = document.createElement('script')
    script.textContent = example.script
    root.append(script)
  }
  return root
}

export const Default = {
  source: () => `${renderExample(example)}\n\n<script>\n${example.script ?? ''}\n</script>`,
  render: () =>
    typeof document === 'undefined' ? `<main class="ui-demo-page">${page()}</main>` : mount(page()),
} satisfies StoryLiteStoryDefinition
