import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { getExample, renderExample } from '@timelessui/examples'
import { createRecipeMeta } from './shared'

const example = getExample('command-palette')!
const meta = createRecipeMeta('Composition/Command Palette')
export default meta

/**
 * A command palette is a composition, not a component. There is no `ui-command` element and there
 * does not need to be: the dialog supplies the modal, the focus trap, and Escape; the `searchable`
 * Select supplies the filtering, the keyboard map, and the accessible relationships.
 */
export const Default = {
  source: () => renderExample(example),
  render: () =>
    `<main class="ui-demo-page"><header><h1>Command palette</h1><p>A <code>searchable</code> Select rendered inside a <code>ui-dialog</code>. Nothing here is new API — it is Dialog and Select, composed.</p></header>${renderExample(example)}</main>`,
} satisfies StoryLiteStoryDefinition
