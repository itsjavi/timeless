import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { getExample, renderExample } from '@timelessui/examples'
import { createRecipeMeta } from './shared'

const example = getExample('account-form')!
const meta = createRecipeMeta('Forms/Account Form')
export default meta

export const Default = {
  source: () => renderExample(example),
  render: () =>
    `<main class="ui-demo-page"><header><h1>Account form</h1><p>Native form controls retain submission, reset, and browser validation.</p></header>${renderExample(example)}</main>`,
} satisfies StoryLiteStoryDefinition
