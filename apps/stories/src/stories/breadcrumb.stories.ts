import type {
  StoryLiteArgTypes,
  StoryLiteMeta,
  StoryLiteStoryDefinition,
} from '@storylite/storylite'
import {
  breadcrumbSeparators,
  compactDensities,
  type BreadcrumbSeparator,
  type CompactDensity,
} from '@timelessui/components'
import coreBreadcrumbCss from '@timelessui/components/css/core/breadcrumb.css?raw'
import coreCardCss from '@timelessui/components/css/core/card.css?raw'
import coreCodeCss from '@timelessui/components/css/core/code.css?raw'
import breadcrumbCss from '@timelessui/components/css/themes/atmosphere/breadcrumb.css?raw'
import cardCss from '@timelessui/components/css/themes/atmosphere/card.css?raw'
import codeCss from '@timelessui/components/css/themes/atmosphere/code.css?raw'
import themeCss from '@timelessui/components/css/themes/atmosphere/tokens.css?raw'
import tokensCss from '@timelessui/components/css/tokens.css?raw'
import { createBreadcrumb } from './navigation.html'
import demoCss from './styles.css?raw'

/*
 * Demo-only. The measured widths exist to make truncation visible on a wide screen; a real breadcrumb
 * takes its width from its column, and nothing here belongs in copied source.
 */
const breadcrumbDemoCss = `@layer ui.showcase {
  .ui-breadcrumb-demo-widths {
    display: grid;
    gap: var(--ui-space-5);
  }

  .ui-breadcrumb-demo-width {
    display: grid;
    gap: var(--ui-space-2);
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: var(--ui-breadcrumb-demo-width, 100%);
    min-inline-size: 0;
    border: 1px dashed var(--ui-line);
    border-radius: var(--ui-radius-md);
    padding: var(--ui-space-3);
  }

  .ui-breadcrumb-demo-width > h2 {
    color: var(--ui-fg-muted);
    font-family: var(--ui-font-mono);
    font-size: 0.75rem;
    font-weight: 600;
  }

  .ui-breadcrumb-demo-matrix {
    display: grid;
    gap: var(--ui-space-4);
  }
}`

const meta: StoryLiteMeta = {
  title: 'Library/Navigation/Breadcrumb',
  parameters: {
    renderer: 'html',
    // Four per component since the core/theme split: base tokens, core, theme tokens, theme.
    css: [
      tokensCss,
      coreBreadcrumbCss,
      coreCardCss,
      coreCodeCss,
      themeCss,
      breadcrumbCss,
      cardCss,
      codeCss,
      demoCss,
      breadcrumbDemoCss,
    ],
  },
}
export default meta

type BreadcrumbArgs = {
  separator: BreadcrumbSeparator
  density: CompactDensity
}

const defaultArgs: BreadcrumbArgs = {
  separator: 'chevron',
  density: 'normal',
}

const argTypes = {
  separator: { control: 'select', options: breadcrumbSeparators },
  density: { control: 'select', options: compactDensities },
} satisfies StoryLiteArgTypes<BreadcrumbArgs>

const trail = [
  { label: 'Documentation', href: '/docs/' },
  { label: 'Components', href: '/docs/components/' },
  { label: 'Breadcrumb' },
] as const

const deepTrail = [
  { label: 'Workspace', href: '#workspace' },
  { label: 'Design systems', href: '#design-systems' },
  { label: 'Timeless UI', href: '#timeless-ui' },
  { label: 'Navigation components', href: '#navigation' },
  { label: 'Breadcrumb' },
] as const

const DEMO_WIDTHS = ['22rem', '32rem', '48rem'] as const

export const Default = {
  args: defaultArgs,
  argTypes,
  source: (args = defaultArgs) => createBreadcrumb({ trail, ...args }),
  render: (args = defaultArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Breadcrumb</h1>
      <p>A labelled <code class="ui-code">nav</code> landmark, an <code class="ui-code">ol</code> in hierarchical order, and a final crumb that is a <code class="ui-code">span</code> rather than a link. No JavaScript, and nothing authored between the crumbs — the separator is drawn.</p>
    </header>
    ${createBreadcrumb({ trail, ...args })}
  </main>`,
} satisfies StoryLiteStoryDefinition<BreadcrumbArgs>

export const Truncation = {
  source: () => createBreadcrumb({ trail: deepTrail, label: 'Breadcrumb' }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>A deep trail in a narrow column</h1>
      <p>The trail is one line that never wraps, so the crumbs in the middle clip to an ellipsis and the two ends stay whole. It is <code class="ui-code">overflow</code> and <code class="ui-code">text-overflow</code> doing the work: nothing is measured, so there is no resize listener and no layout pass to wait for.</p>
    </header>
    <div class="ui-breadcrumb-demo-widths">
      ${DEMO_WIDTHS.map(
        (
          width,
        ) => `<section class="ui-breadcrumb-demo-width" style="--ui-breadcrumb-demo-width: ${width}" aria-label="Trail at ${width}">
        <h2>${width}</h2>
        ${createBreadcrumb({ trail: deepTrail, label: `Breadcrumb at ${width}` })}
      </section>`,
      ).join('\n      ')}
    </div>
  </main>`,
} satisfies StoryLiteStoryDefinition

export const SeparatorsAndDensity = {
  source: () =>
    compactDensities
      .flatMap((density) =>
        breadcrumbSeparators.map((separator) => createBreadcrumb({ trail, separator, density })),
      )
      .join('\n'),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Separators against density</h1>
      <p>Two glyphs and two densities, which is the whole configuration surface. For any other glyph set <code class="ui-code">--ui-breadcrumb-separator</code>, and keep the empty alternative text after the slash, or the glyph starts being announced.</p>
    </header>
    <div class="ui-breadcrumb-demo-matrix">
      ${compactDensities
        .flatMap((density) =>
          breadcrumbSeparators.map(
            (
              separator,
            ) => `<section class="ui-breadcrumb-demo-width" aria-label="${separator} at ${density} density">
        <h2>${separator} &middot; ${density}</h2>
        ${createBreadcrumb({ trail, separator, density, label: `Breadcrumb ${separator} ${density}` })}
      </section>`,
          ),
        )
        .join('\n      ')}
    </div>
  </main>`,
} satisfies StoryLiteStoryDefinition

export const PageHeader = {
  source: () => `<header>
  ${createBreadcrumb({ trail })}
  <h1>Breadcrumb</h1>
</header>`,
  render: () => `<main class="ui-demo-page">
    <header>
      ${createBreadcrumb({ trail })}
      <h1>Breadcrumb</h1>
      <p>Where a breadcrumb actually goes: above the page title, inside the same header, so the trail and the heading read as one unit.</p>
    </header>
    <article class="ui-card">
      <h2 data-ui-part="title">Anatomy</h2>
      <p data-ui-part="description">Three parts and one state, all of them yours to author: <code class="ui-code">item</code>, <code class="ui-code">link</code>, <code class="ui-code">current</code>, and <code class="ui-code">aria-current="page"</code>.</p>
    </article>
  </main>`,
} satisfies StoryLiteStoryDefinition
