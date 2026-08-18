import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { getExample, renderExample } from '@timelessui/examples'
import { createRecipeMeta } from './shared'

const example = getExample('team-presence')!
const meta = createRecipeMeta('Identity/Team Presence')
export default meta

export const Default = {
  source: () => renderExample(example),
  render: () =>
    `<main class="ui-demo-page"><header><h1>Team presence</h1><p>Compose identity, presence, and status without hiding names in decoration.</p></header>${renderExample(example)}</main>`,
} satisfies StoryLiteStoryDefinition
