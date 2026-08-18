import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import { createEmpty } from '../empty.html'
import { createMissingComponentMeta } from '../missing-components/shared'

const meta = createMissingComponentMeta('CSS Primitives', 'Empty')
export default meta

export const Default = {
  source: () =>
    createEmpty({
      id: 'empty-projects',
      title: 'No projects yet',
      description: 'Create your first project to start building an interface.',
    }),
  render: () =>
    `<main class="ui-demo-page">${createEmpty({ id: 'empty-projects', title: 'No projects yet', description: 'Create your first project to start building an interface.' })}</main>`,
} satisfies StoryLiteStoryDefinition

export const Densities = {
  render: () =>
    `<main class="ui-demo-page">${createEmpty({ id: 'empty-search', title: 'No matches', description: 'Try another search term.', density: 'compact' })}${createEmpty({ id: 'empty-library', title: 'Library is empty', description: 'Reusable components appear here.', density: 'spacious' })}</main>`,
} satisfies StoryLiteStoryDefinition
