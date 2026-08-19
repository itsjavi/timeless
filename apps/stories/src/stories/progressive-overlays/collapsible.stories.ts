import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import { compactDensities, type CompactDensity } from '@timelessui/components'
import { createCollapsible } from '../overlays.html'
import { createProgressiveOverlayMeta } from './shared'

const meta = createProgressiveOverlayMeta('Collapsible')
export default meta

type CollapsibleArgs = {
  firstOpen: boolean
  density: CompactDensity
}

const defaultArgs: CollapsibleArgs = {
  firstOpen: true,
  density: 'normal',
}

const defaultArgTypes = {
  firstOpen: { control: 'boolean' },
  density: { control: 'select', options: compactDensities },
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

const faqItems = [
  {
    title: 'Is a single expandable region a different component?',
    content:
      'No. One details element with .ui-collapsible is the whole component; a stack is several of them.',
  },
  {
    title: 'What closes the previously open panel?',
    content:
      'The browser does, because every details element in the stack shares the same name attribute.',
  },
  {
    title: 'How much of this needs JavaScript?',
    content:
      'None of it. Open state, keyboard, find-in-page, and exclusivity are all platform-owned.',
  },
] as const

export const ExclusiveAndIndependent = {
  source:
    () => `${createCollapsible({ name: 'faq', items: faqItems.map((item, index) => ({ ...item, open: index === 0 })) })}
${createCollapsible({ items: faqItems.map((item, index) => ({ ...item, open: index === 0 })) })}`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Exclusive and independent stacks</h1>
      <p>The only difference between these two stacks is the <code class="ui-code">name</code> attribute on each <code class="ui-code">details</code>. Shared names make an accordion; omitting them lets every panel open at once. No script is involved either way, so both behave the same with JavaScript disabled.</p>
    </header>
    <section class="ui-overlay-demo-panel" aria-label="Exclusive accordion">
      <h2>Shared <code class="ui-code">name="faq"</code></h2>
      <p>Opening one panel closes the other. The browser enforces it.</p>
      ${createCollapsible({
        name: 'faq',
        items: faqItems.map((item, index) => ({ ...item, open: index === 0 })),
      })}
    </section>
    <section class="ui-overlay-demo-panel" aria-label="Independent stack">
      <h2>No <code class="ui-code">name</code></h2>
      <p>Every panel opens and closes on its own.</p>
      ${createCollapsible({
        items: faqItems.map((item, index) => ({ ...item, open: index === 0 })),
      })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition
