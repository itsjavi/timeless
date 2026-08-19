import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import { dialogKinds, type DialogKind } from '@timelessui/components'
import { createDialog } from '../overlays.html'
import { createProgressiveOverlayMeta } from './shared'

const meta = createProgressiveOverlayMeta('Dialog')
export default meta

type DialogArgs = {
  kind: DialogKind
}

const defaultArgs: DialogArgs = {
  kind: 'dialog',
}

const defaultArgTypes = {
  kind: { control: 'select', options: dialogKinds },
} satisfies StoryLiteArgTypes<DialogArgs>

export const Default = {
  args: defaultArgs,
  argTypes: defaultArgTypes,
  source: (args = defaultArgs) =>
    createDialog({
      id: 'release-dialog',
      triggerLabel: 'Review release',
      title: args.kind === 'alert' ? 'Confirm release' : 'Release checklist',
      description: 'Native dialog owns modality, Escape behavior, and top-layer rendering.',
      body: 'Review generated files, package exports, and browser smoke results before publishing.',
      kind: args.kind,
    }),
  render: (args = defaultArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Dialog</h1>
      <p>The host enhances an authored trigger and native dialog, then restores focus when the dialog closes.</p>
    </header>
    ${createDialog({
      id: 'release-dialog',
      triggerLabel: 'Review release',
      title: args.kind === 'alert' ? 'Confirm release' : 'Release checklist',
      description: 'Native dialog owns modality, Escape behavior, and top-layer rendering.',
      body: 'Review generated files, package exports, and browser smoke results before publishing.',
      kind: args.kind,
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition<DialogArgs>

export const DestructiveAction = {
  source: () =>
    createDialog({
      id: 'delete-dialog',
      triggerLabel: 'Delete component',
      title: 'Delete component?',
      description: 'This action cannot be undone from the design system registry.',
      body: 'Consumers should migrate before the component is removed from package exports.',
      kind: 'alert',
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Destructive action dialog</h1>
      <p>Alert dialogs use the same authored anatomy and switch to alertdialog semantics during enhancement.</p>
    </header>
    ${createDialog({
      id: 'delete-dialog',
      triggerLabel: 'Delete component',
      title: 'Delete component?',
      description: 'This action cannot be undone from the design system registry.',
      body: 'Consumers should migrate before the component is removed from package exports.',
      kind: 'alert',
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition
