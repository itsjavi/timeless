import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import {
  avatarShapes,
  avatarStatuses,
  primitiveSizes,
  type AvatarShape,
  type AvatarStatus,
  type PrimitiveSize,
} from '@timelessui/components'
import { createAvatar } from '../primitives.html'
import { createCssPrimitiveMeta } from './shared'

const meta = createCssPrimitiveMeta('Avatar')
export default meta

type AvatarArgs = {
  label: string
  initials: string
  size: PrimitiveSize
  shape: AvatarShape
  status: AvatarStatus
}

const avatarArgs: AvatarArgs = {
  label: 'Javier Acero',
  initials: 'JA',
  size: 'md',
  shape: 'circle',
  status: 'online',
}

const avatarArgTypes = {
  label: { control: 'text' },
  initials: { control: 'text' },
  size: { control: 'select', options: primitiveSizes },
  shape: { control: 'select', options: avatarShapes },
  status: { control: 'select', options: avatarStatuses },
} satisfies StoryLiteArgTypes<AvatarArgs>

export const Default = {
  args: avatarArgs,
  argTypes: avatarArgTypes,
  source: createAvatar,
  render: (args = avatarArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Avatar</h1>
      <p>Avatars are stable inline identity markers with fallback text, optional status, and shape and size attributes.</p>
    </header>
    <section class="ui-demo-row" aria-label="Avatar example">
      ${createAvatar(args)}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition<AvatarArgs>
