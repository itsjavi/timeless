import type { StoryLiteMeta, StoryLiteStoryDefinition } from '@storylite/storylite'
import { defineTimelessElements } from '@timelessui/components/define'
import coreButtonCss from '@timelessui/components/css/core/button.css?raw'
import coreCodeCss from '@timelessui/components/css/core/code.css?raw'
import coreFloatingCss from '@timelessui/components/css/core/floating.css?raw'
import coreGroupCss from '@timelessui/components/css/core/group.css?raw'
import coreListCss from '@timelessui/components/css/core/list.css?raw'
import corePopoverCss from '@timelessui/components/css/core/popover.css?raw'
import buttonCss from '@timelessui/components/css/themes/atmosphere/button.css?raw'
import codeCss from '@timelessui/components/css/themes/atmosphere/code.css?raw'
import groupCss from '@timelessui/components/css/themes/atmosphere/group.css?raw'
import linkCss from '@timelessui/components/css/themes/atmosphere/link.css?raw'
import listCss from '@timelessui/components/css/themes/atmosphere/list.css?raw'
import popoverCss from '@timelessui/components/css/themes/atmosphere/popover.css?raw'
import themeCss from '@timelessui/components/css/themes/atmosphere/tokens.css?raw'
import tokensCss from '@timelessui/components/css/tokens.css?raw'
import { createNavigationMenu } from '../navigation.html'
import demoCss from '../styles.css?raw'

/* Demo-only: a header bar to sit the nav in, so the panels have somewhere to open below. */
const navDemoCss = `@layer ui.showcase {
  .ui-nav-demo-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--ui-space-4);
    box-sizing: border-box;
    inline-size: 100%;
    border: 1px solid var(--ui-line);
    border-radius: var(--ui-radius-lg);
    padding: var(--ui-space-3) var(--ui-space-4);
    background: var(--ui-bg-surface);
  }

  .ui-nav-demo-brand {
    color: var(--ui-fg);
    font-weight: 750;
  }

  .ui-nav-demo-bar nav ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ui-nav-demo-bar [popover] {
    min-inline-size: 14rem;
  }

  .ui-nav-demo-bar [popover] h2 {
    margin: 0 0 var(--ui-space-2);
    color: var(--ui-fg-muted);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
  }
}`

const meta: StoryLiteMeta = {
  title: 'Recipes/Composition/Navigation Menu',
  parameters: {
    renderer: 'html',
    css: [
      tokensCss,
      coreFloatingCss,
      corePopoverCss,
      coreButtonCss,
      coreGroupCss,
      coreListCss,
      coreCodeCss,
      themeCss,
      popoverCss,
      buttonCss,
      groupCss,
      listCss,
      linkCss,
      codeCss,
      demoCss,
      navDemoCss,
    ],
    defineCustomElements: defineTimelessElements,
  },
}
export default meta

const sections = [
  {
    id: 'nav-products',
    label: 'Products',
    links: [
      { label: 'Components', href: '#components' },
      { label: 'Themes', href: '#themes' },
      { label: 'Colour tools', href: '#colour' },
    ],
  },
  {
    id: 'nav-resources',
    label: 'Resources',
    links: [
      { label: 'Documentation', href: '#documentation' },
      { label: 'Agent skills', href: '#agents' },
      { label: 'Changelog', href: '#changelog' },
    ],
  },
] as const

const links = [{ label: 'Pricing', href: '#pricing' }] as const

export const Default = {
  source: () => createNavigationMenu({ sections, links }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Navigation menu, composed</h1>
      <p>Several triggers, one panel open at a time, opening on pointer intent and on focus. There is no <code class="ui-code">ui-nav-menu</code> element: this is one <code class="ui-code">ui-hover-card</code> per trigger, and the handoff along the bar is two numbers — <code class="ui-code">close-delay</code> shorter than <code class="ui-code">open-delay</code>, so the panel you are leaving closes before the next one opens.</p>
      <p>The rule the recipe exists for: a menu of <em>links</em> is not an APG menu. <code class="ui-code">role="menu"</code> means commands with roving focus, where the whole set is one Tab stop. Links are individually tabbable, so the panels are <code class="ui-code">role="group"</code> regions and <code class="ui-code">Tab</code> is the traversal.</p>
    </header>
    <div class="ui-nav-demo-bar">
      <span class="ui-nav-demo-brand">Timeless</span>
      ${createNavigationMenu({ sections, links })}
    </div>
  </main>`,
} satisfies StoryLiteStoryDefinition
