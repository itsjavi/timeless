import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import { createSheet } from '../overlays.html'
import { createProgressiveOverlayMeta } from './shared'

const meta = createProgressiveOverlayMeta('Sheet')
export default meta

type SheetArgs = {
  modal: boolean
  position: 'top' | 'right' | 'bottom' | 'left'
}

const defaultArgs: SheetArgs = {
  modal: true,
  position: 'right',
}

const defaultArgTypes = {
  modal: { control: 'boolean' },
  position: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
} satisfies StoryLiteArgTypes<SheetArgs>

function formatPosition(position: SheetArgs['position']): string {
  return `${position.slice(0, 1).toUpperCase()}${position.slice(1)}`
}

export const Default = {
  args: defaultArgs,
  argTypes: defaultArgTypes,
  source: (args = defaultArgs) =>
    createSheet({
      id: 'release-sheet',
      triggerLabel: 'Open release sheet',
      title: 'Release checklist',
      description: args.modal
        ? 'Modal sheets block the page with the native dialog backdrop.'
        : 'Non-modal sheets leave the rest of the page interactive.',
      body: 'Review package exports, StoryLite documentation, and browser smoke coverage before publishing.',
      modal: args.modal,
      position: args.position,
    }),
  render: (args = defaultArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Sheet</h1>
      <p>A sheet enhances an authored trigger and native dialog into an edge-aligned panel.</p>
    </header>
    ${createSheet({
      id: 'release-sheet',
      triggerLabel: 'Open release sheet',
      title: 'Release checklist',
      description: args.modal
        ? 'Modal sheets block the page with the native dialog backdrop.'
        : 'Non-modal sheets leave the rest of the page interactive.',
      body: 'Review package exports, StoryLite documentation, and browser smoke coverage before publishing.',
      modal: args.modal,
      position: args.position,
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition<SheetArgs>

export const Positions = {
  source: () =>
    ['top', 'right', 'bottom', 'left']
      .map((position) =>
        createSheet({
          id: `sheet-${position}`,
          triggerLabel: `${formatPosition(position as SheetArgs['position'])} sheet`,
          title: `${formatPosition(position as SheetArgs['position'])} sheet`,
          description: 'Each position uses the same native dialog anatomy with a host attribute.',
          body: 'Position is owned by CSS through ui-sheet[position] selectors.',
          modal: true,
          position: position as SheetArgs['position'],
        }),
      )
      .join('\n'),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Sheet positions</h1>
      <p>The panel can enter from each viewport edge without changing the Light DOM anatomy.</p>
    </header>
    <section class="ui-overlay-demo-grid" aria-label="Sheet position examples">
      ${(['top', 'right', 'bottom', 'left'] as const)
        .map(
          (position) => `<div class="ui-overlay-demo-panel">
        ${createSheet({
          id: `sheet-${position}`,
          triggerLabel: `${formatPosition(position)} sheet`,
          title: `${formatPosition(position)} sheet`,
          description: 'Each position uses the same native dialog anatomy with a host attribute.',
          body: 'Position is owned by CSS through ui-sheet[position] selectors.',
          modal: true,
          position,
        })}
      </div>`,
        )
        .join('\n')}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition

export const NonModal = {
  source: () =>
    createSheet({
      id: 'inspector-sheet',
      triggerLabel: 'Open inspector',
      title: 'Inspector',
      description: 'Without modal, the native dialog opens as a non-blocking panel.',
      body: 'Use non-modal sheets for inspectors, details panels, and workflows where background interaction remains useful.',
      modal: false,
      position: 'left',
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Non-modal sheet</h1>
      <p>The panel opens with dialog.show(), so controls outside the sheet remain available.</p>
    </header>
    <section class="ui-overlay-demo-grid">
      <div class="ui-overlay-demo-panel">
        ${createSheet({
          id: 'inspector-sheet',
          triggerLabel: 'Open inspector',
          title: 'Inspector',
          description: 'Without modal, the native dialog opens as a non-blocking panel.',
          body: 'Use non-modal sheets for inspectors, details panels, and workflows where background interaction remains useful.',
          modal: false,
          position: 'left',
        })}
      </div>
      <div class="ui-overlay-demo-panel">
        <h2>Background control</h2>
        <button class="ui-button" data-ui-variant="secondary" type="button">Still interactive</button>
      </div>
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition

export const StaticFallback = {
  source: () =>
    createSheet({
      id: 'fallback-sheet',
      triggerLabel: 'Native fallback',
      title: 'Fallback sheet',
      description: 'The authored dialog remains valid HTML without custom element enhancement.',
      body: 'Without JavaScript, the closed dialog stays hidden. Authors can also ship an initially open dialog with the native open attribute when that fallback is desired.',
      modal: false,
      position: 'bottom',
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Static fallback</h1>
      <p>Sheet markup is ordinary HTML: a trigger, a native dialog, and authored content anatomy.</p>
    </header>
    ${createSheet({
      id: 'fallback-sheet',
      triggerLabel: 'Native fallback',
      title: 'Fallback sheet',
      description: 'The authored dialog remains valid HTML without custom element enhancement.',
      body: 'Without JavaScript, the closed dialog stays hidden. Authors can also ship an initially open dialog with the native open attribute when that fallback is desired.',
      modal: false,
      position: 'bottom',
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition
