import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import { separatorOrientations, type SeparatorOrientation } from '@timelessui/components'
import {
  createLabeledSeparator,
  createSeparator,
  createVerticalLabeledSeparator,
} from '../primitives.html'
import { createCssPrimitiveMeta } from './shared'

const meta = createCssPrimitiveMeta('Separator')
export default meta

type SeparatorArgs = {
  orientation: SeparatorOrientation
  strong: boolean
}

const separatorArgs: SeparatorArgs = {
  orientation: 'horizontal',
  strong: false,
}

const separatorArgTypes = {
  orientation: { control: 'select', options: separatorOrientations },
  strong: { control: 'boolean' },
} satisfies StoryLiteArgTypes<SeparatorArgs>

export const Default = {
  args: separatorArgs,
  argTypes: separatorArgTypes,
  source: (args = separatorArgs) =>
    args.orientation === 'vertical'
      ? createSeparator({ orientation: 'vertical', variant: args.strong ? 'strong' : 'default' })
      : createSeparator({ variant: args.strong ? 'strong' : 'default' }),
  render: (args = separatorArgs) => {
    const separator =
      args.orientation === 'vertical'
        ? createSeparator({ orientation: 'vertical', variant: args.strong ? 'strong' : 'default' })
        : createSeparator({ variant: args.strong ? 'strong' : 'default' })

    return `<main class="ui-demo-page">
      <header>
        <h1>Separator</h1>
        <p>Use <code class="ui-code">ui-separator</code> for horizontal and vertical separator anatomy. Native <code class="ui-code">hr</code> remains the static fallback.</p>
      </header>
      <section class="ui-primitive-separator-demo" aria-label="Separator example">
        <span>Before</span>
        ${separator}
        <span>After</span>
      </section>
    </main>`
  },
} satisfies StoryLiteStoryDefinition<SeparatorArgs>

export const Labeled = {
  source: () => `${createLabeledSeparator('Advanced settings')}
${createVerticalLabeledSeparator({ before: 'before' })}
${createVerticalLabeledSeparator({ before: 'before', after: 'after' })}
${createVerticalLabeledSeparator({ after: 'after' })}`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Labeled separator</h1>
      <p>Use labels inside the same host when text needs to sit before, after, or between separator rules.</p>
    </header>
    <section class="ui-primitive-flow" aria-label="Labeled separator examples">
      <section class="ui-primitive-panel" aria-label="Horizontal labeled separator">
        <h2>Horizontal</h2>
        <p class="ui-primitive-muted">Basic settings</p>
        ${createLabeledSeparator('Advanced settings')}
        <p class="ui-primitive-muted">Developer options</p>
      </section>
      <section class="ui-primitive-separator-demo" aria-label="Vertical labeled separator">
        <span>Before only</span>
        ${createVerticalLabeledSeparator({ before: 'before' })}
        <span>Both labels</span>
        ${createVerticalLabeledSeparator({ before: 'before', after: 'after' })}
        <span>After only</span>
        ${createVerticalLabeledSeparator({ after: 'after' })}
      </section>
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition

export const StaticFallback = {
  source: () => `<hr class="ui-separator">
<span class="ui-separator" data-ui-orientation="vertical" role="separator" aria-orientation="vertical"></span>`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Static fallback</h1>
      <p>Use the class contract when authoring native fallback markup instead of the unified custom-element host.</p>
    </header>
    <section class="ui-primitive-flow" aria-label="Static separator fallback examples">
      <p class="ui-primitive-muted">Before</p>
      <hr class="ui-separator">
      <p class="ui-primitive-muted">After</p>
      <section class="ui-primitive-separator-demo" aria-label="Vertical fallback">
        <span>Before</span>
        <span class="ui-separator" data-ui-orientation="vertical" role="separator" aria-orientation="vertical"></span>
        <span>After</span>
      </section>
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition
