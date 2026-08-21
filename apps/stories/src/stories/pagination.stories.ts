import type {
  StoryLiteArgTypes,
  StoryLiteMeta,
  StoryLiteStoryDefinition,
} from '@storylite/storylite'
import { primitiveSizes, type PrimitiveSize } from '@timelessui/components'
import coreCodeCss from '@timelessui/components/css/core/code.css?raw'
import coreGroupCss from '@timelessui/components/css/core/group.css?raw'
import corePaginationCss from '@timelessui/components/css/core/pagination.css?raw'
import codeCss from '@timelessui/components/css/themes/atmosphere/code.css?raw'
import groupCss from '@timelessui/components/css/themes/atmosphere/group.css?raw'
import paginationCss from '@timelessui/components/css/themes/atmosphere/pagination.css?raw'
import themeCss from '@timelessui/components/css/themes/atmosphere/tokens.css?raw'
import tokensCss from '@timelessui/components/css/tokens.css?raw'
import { createPagination } from './navigation.html'
import demoCss from './styles.css?raw'

/* Demo-only: the labelled rows and the results footer frame, neither of which belongs in copied source. */
const paginationDemoCss = `@layer ui.showcase {
  .ui-pagination-demo-rows {
    display: grid;
    gap: var(--ui-space-5);
  }

  .ui-pagination-demo-row {
    display: grid;
    gap: var(--ui-space-2);
    justify-items: start;
  }

  .ui-pagination-demo-row > h2 {
    color: var(--ui-fg-muted);
    font-family: var(--ui-font-mono);
    font-size: 0.75rem;
    font-weight: 600;
  }

  .ui-pagination-demo-results {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--ui-space-4);
    box-sizing: border-box;
    inline-size: 100%;
    border: 1px solid var(--ui-line);
    border-radius: var(--ui-radius-lg);
    padding: var(--ui-space-4);
    background: var(--ui-bg-surface);
  }

  .ui-pagination-demo-count {
    color: var(--ui-fg-muted);
    font-size: 0.875rem;
  }
}`

const meta: StoryLiteMeta = {
  title: 'Library/Navigation/Pagination',
  parameters: {
    renderer: 'html',
    // Four per component since the core/theme split: base tokens, core, theme tokens, theme.
    css: [
      tokensCss,
      corePaginationCss,
      coreGroupCss,
      coreCodeCss,
      themeCss,
      paginationCss,
      groupCss,
      codeCss,
      demoCss,
      paginationDemoCss,
    ],
  },
}
export default meta

type PaginationArgs = {
  page: number
  pageCount: number
  size: PrimitiveSize
  attached: boolean
}

const defaultArgs: PaginationArgs = {
  page: 4,
  pageCount: 12,
  size: 'md',
  attached: false,
}

const argTypes = {
  page: { control: 'number' },
  pageCount: { control: 'number' },
  size: { control: 'select', options: primitiveSizes },
  attached: { control: 'boolean' },
} satisfies StoryLiteArgTypes<PaginationArgs>

const BOUNDARIES = [
  { page: 1, caption: 'First page — Previous is a span' },
  { page: 6, caption: 'Middle — both directions are links' },
  { page: 12, caption: 'Last page — Next is a span' },
] as const

export const Default = {
  args: defaultArgs,
  argTypes,
  source: (args = defaultArgs) => createPagination(args),
  render: (args = defaultArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Pagination</h1>
      <p>Links, not buttons. A page is a URL, so it is shareable, middle-clickable, and in the back button's history — none of which a click handler gives you. No JavaScript, and no element: <code class="ui-code">ui-pagination</code> is a class, deliberately, because a component that intercepted these clicks would be strictly worse than the markup it replaced.</p>
    </header>
    ${createPagination(args)}
  </main>`,
} satisfies StoryLiteStoryDefinition<PaginationArgs>

export const Boundaries = {
  source: () => BOUNDARIES.map(({ page }) => createPagination({ page, pageCount: 12 })).join('\n'),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Boundaries are absent, not disabled</h1>
      <p>A disabled link is a contradiction: <code class="ui-code">aria-disabled="true"</code> on an <code class="ui-code">a href</code> announces "dimmed" and then navigates anyway. At the first or last page the control becomes a <code class="ui-code">span</code>, so there is nothing to activate and nothing to lie about. The element type changes with state, which is the price of telling the truth.</p>
    </header>
    <div class="ui-pagination-demo-rows">
      ${BOUNDARIES.map(
        ({ page, caption }) => `<section class="ui-pagination-demo-row" aria-label="${caption}">
        <h2>${caption}</h2>
        ${createPagination({ page, pageCount: 12, label: `Pagination, ${caption}` })}
      </section>`,
      ).join('\n      ')}
    </div>
  </main>`,
} satisfies StoryLiteStoryDefinition

export const JoinedStrip = {
  source: () => `${createPagination({ page: 4, pageCount: 12, attached: true })}
${createPagination({ page: 4, pageCount: 12, attached: true, size: 'sm' })}`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Joined by Group, not by Pagination</h1>
      <p>Composing <code class="ui-code">class="ui-group" data-ui-attached</code> onto the list collapses the gap and stretches the cells — Group already does that for every segmented control in the library. Pagination adds only the joined radii, because Group joins the control classes it knows by name and cannot see a <code class="ui-code">data-ui-part</code> one level further down.</p>
    </header>
    <div class="ui-pagination-demo-rows">
      ${primitiveSizes
        .map(
          (size) => `<section class="ui-pagination-demo-row" aria-label="Joined strip, ${size}">
        <h2>${size}</h2>
        ${createPagination({ page: 4, pageCount: 12, size, attached: true, label: `Pagination, ${size}` })}
      </section>`,
        )
        .join('\n      ')}
    </div>
  </main>`,
} satisfies StoryLiteStoryDefinition

export const ResultsFooter = {
  source: () => `<footer>
  <p>Showing 61&ndash;80 of 237 records</p>
  ${createPagination({ page: 4, pageCount: 12 })}
</footer>`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Under a list of results</h1>
      <p>Where a pager actually goes: after the results, beside the count that tells you what you are paging through. The count is prose you own; Pagination has no opinion about it.</p>
    </header>
    <footer class="ui-pagination-demo-results">
      <p class="ui-pagination-demo-count">Showing 61&ndash;80 of 237 records</p>
      ${createPagination({ page: 4, pageCount: 12, size: 'sm' })}
    </footer>
  </main>`,
} satisfies StoryLiteStoryDefinition
