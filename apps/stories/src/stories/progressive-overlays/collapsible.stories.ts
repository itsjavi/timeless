import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import { createCollapsible } from '../overlays.html'
import { createProgressiveOverlayMeta } from './shared'

const meta = createProgressiveOverlayMeta('Collapsible')
export default meta

type CollapsibleArgs = {
  firstOpen: boolean
  density: 'compact' | 'normal'
}

const defaultArgs: CollapsibleArgs = {
  firstOpen: true,
  density: 'normal',
}

const defaultArgTypes = {
  firstOpen: { control: 'boolean' },
  density: { control: 'select', options: ['normal', 'compact'] },
} satisfies StoryLiteArgTypes<CollapsibleArgs>

const releaseItems = [
  {
    title: 'What ships in the CSS package?',
    content: 'Tokens, flat primitives, native form styling, and progressive overlay CSS.',
  },
  {
    title: 'Does Collapsible require JavaScript?',
    content:
      'No. It uses native details and summary so open state, keyboard access, and find-in-page stay platform-owned.',
  },
  {
    title: 'Can apps replace the icon?',
    content:
      'Yes. The public summary anatomy is authored by the app; the default CSS only adds a small indicator.',
  },
] as const

export const Default = {
  args: defaultArgs,
  argTypes: defaultArgTypes,
  source: (args = defaultArgs) =>
    createCollapsible({
      density: args.density,
      items: releaseItems.map((item, index) => ({
        ...item,
        open: index === 0 ? args.firstOpen : false,
      })),
    }),
  render: (args = defaultArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Collapsible</h1>
      <p>Native details and summary provide the interaction; Timeless CSS styles the public accordion anatomy.</p>
    </header>
    ${createCollapsible({
      density: args.density,
      items: releaseItems.map((item, index) => ({
        ...item,
        open: index === 0 ? args.firstOpen : false,
      })),
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition<CollapsibleArgs>

export const ReleaseChecklist = {
  source: () =>
    createCollapsible({
      density: 'compact',
      items: [
        {
          title: 'Audit exported contracts',
          content:
            'Confirm public names, host attributes, and data anatomy match the package README.',
          open: true,
        },
        {
          title: 'Run browser smoke checks',
          content:
            'Verify native disclosure behavior and enhanced tabs render with no console errors.',
        },
        {
          title: 'Record milestone results',
          content:
            'Capture checks, browser notes, and the components intentionally left for the next batch.',
        },
      ],
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Release checklist</h1>
      <p>Compact density works well for operational checklists where each item expands in place.</p>
    </header>
    <section class="ui-overlay-demo-panel">
      ${createCollapsible({
        density: 'compact',
        items: [
          {
            title: 'Audit exported contracts',
            content:
              'Confirm public names, host attributes, and data anatomy match the package README.',
            open: true,
          },
          {
            title: 'Run browser smoke checks',
            content:
              'Verify native disclosure behavior and enhanced tabs render with no console errors.',
          },
          {
            title: 'Record milestone results',
            content:
              'Capture checks, browser notes, and the components intentionally left for the next batch.',
          },
        ],
      })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition
