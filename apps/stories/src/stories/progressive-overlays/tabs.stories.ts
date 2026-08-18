import type { StoryLiteArgTypes, StoryLiteStoryDefinition } from '@storylite/storylite'
import {
  tabsActivations,
  tabsOrientations,
  type TabsActivation,
  type TabsOrientation,
} from '@timelessui/components'
import { createStaticTabs, createTabs, type TabItem } from '../overlays.html'
import { createProgressiveOverlayMeta } from './shared'

const meta = createProgressiveOverlayMeta('Tabs')
export default meta

type TabId = 'overview' | 'usage' | 'history'

type TabsArgs = {
  orientation: TabsOrientation
  activation: TabsActivation
  selected: TabId
}

const tabs: readonly TabItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    content: 'Review the current release status, owner, and next review date.',
  },
  {
    id: 'usage',
    label: 'Usage',
    content: 'Track adoption signals and identify teams that still need migration help.',
  },
  {
    id: 'history',
    label: 'History',
    content: 'Read recent changes before deciding whether to promote the component.',
  },
] as const

const defaultArgs: TabsArgs = {
  orientation: 'horizontal',
  activation: 'automatic',
  selected: 'overview',
}

const defaultArgTypes = {
  orientation: { control: 'select', options: tabsOrientations },
  activation: { control: 'select', options: tabsActivations },
  selected: { control: 'select', options: ['overview', 'usage', 'history'] },
} satisfies StoryLiteArgTypes<TabsArgs>

export const Default = {
  args: defaultArgs,
  argTypes: defaultArgTypes,
  source: (args = defaultArgs) =>
    createTabs({
      id: 'tabs-default',
      label: 'Component sections',
      items: tabs,
      orientation: args.orientation,
      activation: args.activation,
      value: args.selected,
    }),
  render: (args = defaultArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Tabs</h1>
      <p>The custom element enhances author-owned buttons and panels with ARIA state, keyboard navigation, and hidden panel management.</p>
    </header>
    ${createTabs({
      id: 'tabs-default',
      label: 'Component sections',
      items: tabs,
      orientation: args.orientation,
      activation: args.activation,
      value: args.selected,
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition<TabsArgs>

export const ProductSettings = {
  source: () =>
    createTabs({
      id: 'tabs-product-settings',
      label: 'Product settings',
      items: [
        ...tabs,
        {
          id: 'billing',
          label: 'Billing',
          content: 'Billing settings are visible to administrators but disabled for this role.',
          disabled: true,
        },
      ],
      orientation: 'vertical',
      activation: 'manual',
      value: 'usage',
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Product settings tabs</h1>
      <p>Manual vertical tabs keep focus movement separate from panel activation and skip disabled tabs.</p>
    </header>
    <section class="ui-overlay-demo-panel">
      ${createTabs({
        id: 'tabs-product-settings',
        label: 'Product settings',
        items: [
          ...tabs,
          {
            id: 'billing',
            label: 'Billing',
            content: 'Billing settings are visible to administrators but disabled for this role.',
            disabled: true,
          },
        ],
        orientation: 'vertical',
        activation: 'manual',
        value: 'usage',
      })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition

export const StaticFallback = {
  source: () =>
    createStaticTabs({
      id: 'tabs-static',
      label: 'Static component sections',
      items: tabs,
      value: 'overview',
    }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Tabs static fallback</h1>
      <p>Before enhancement, authors can ship the same public anatomy with roles, selected state, and hidden inactive panels.</p>
    </header>
    ${createStaticTabs({
      id: 'tabs-static',
      label: 'Static component sections',
      items: tabs,
      value: 'overview',
    })}
  </main>`,
} satisfies StoryLiteStoryDefinition
