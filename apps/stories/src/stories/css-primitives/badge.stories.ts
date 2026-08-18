import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import {
  badgeVariants,
  primitiveSizes,
  type BadgeVariant,
  type PrimitiveSize,
} from '@timelessui/components'
import { createBadge } from '../primitives.html'
import { createCssPrimitiveMeta } from './shared'

const meta = createCssPrimitiveMeta('Badge')
export default meta

type BadgeArgs = {
  label: string
  variant: BadgeVariant
  size: PrimitiveSize
  dot: boolean
}

const badgeArgs: BadgeArgs = {
  label: 'Ready',
  variant: 'accent',
  size: 'md',
  dot: true,
}

const badgeArgTypes = {
  label: { control: 'text' },
  variant: { control: 'select', options: badgeVariants },
  size: { control: 'select', options: primitiveSizes },
  dot: { control: 'boolean' },
} satisfies StoryLiteArgTypes<BadgeArgs>

export const Default = {
  args: badgeArgs,
  argTypes: badgeArgTypes,
  source: createBadge,
  render: (args = badgeArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Badge</h1>
      <p>Small flat status surfaces use <code class="ui-code">.ui-badge</code> plus optional variant and size attributes.</p>
    </header>
    <section class="ui-demo-row" aria-label="Badge variants">
      ${createBadge(args)}
      ${createBadge({ label: 'Stable', variant: 'success', dot: true })}
      ${createBadge({ label: 'Warning', variant: 'warning', dot: true })}
      ${createBadge({ label: 'Danger', variant: 'danger', dot: true })}
      ${createBadge({ label: 'Outline', variant: 'outline' })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition<BadgeArgs>
