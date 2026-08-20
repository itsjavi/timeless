import type {
  StoryLiteArgTypes,
  StoryLiteMeta,
  StoryLiteStoryDefinition,
} from '@storylite/storylite'
import {
  buttonSizes,
  buttonVariants,
  type ButtonSize,
  type ButtonVariant,
} from '@timelessui/components'
import coreButtonCss from '@timelessui/components/css/core/button.css?raw'
import buttonCss from '@timelessui/components/css/button.css?raw'
import themeCss from '@timelessui/components/css/theme-atmosphere.css?raw'
import tokensCss from '@timelessui/components/css/tokens.css?raw'
import { escapeAttribute, escapeHtml } from '../lib/utils'
import buttonDocsHtml from './button.stories.md'
import demoCss from './styles.css?raw'

const buttonDemoCss = `@layer ui.showcase {
  .ui-button-demo-grid {
    display: grid;
    gap: var(--ui-space-5);
  }

  .ui-button-demo-surface {
    color-scheme: light;
    display: grid;
    gap: var(--ui-space-4);
    border: 1px solid var(--ui-line);
    border-radius: 1rem;
    padding: var(--ui-space-5);
    background: var(--ui-bg-page);
  }

  .ui-button-demo-surface[data-ui-scheme='dark'] {
    color-scheme: dark;
  }

  .ui-button-demo-surface h2 {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--ui-fg-muted);
    text-transform: uppercase;
  }

  .ui-button-demo-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ui-space-4);
  }
}`

const meta: StoryLiteMeta = {
  title: 'Library/Actions/Button',
  parameters: {
    renderer: 'html',
    css: [tokensCss, coreButtonCss, themeCss, buttonCss, demoCss, buttonDemoCss],
  },
}
export default meta

type ButtonBaseArgs = {
  label: string
  variant: ButtonVariant
  disabled: boolean
  loading: boolean
}

type ButtonDefaultArgs = ButtonBaseArgs & {
  size: ButtonSize
}

const defaultArgs: ButtonDefaultArgs = {
  label: 'Button',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
}

const sizeArgs: ButtonBaseArgs = {
  label: 'Button',
  variant: 'primary',
  disabled: false,
  loading: false,
}

const baseArgTypes = {
  label: { control: 'text' },
  variant: { control: 'select', options: buttonVariants },
  disabled: { control: 'boolean' },
  loading: { control: 'boolean' },
} satisfies StoryLiteArgTypes<ButtonBaseArgs>

const defaultArgTypes = {
  ...baseArgTypes,
  size: { control: 'select', options: buttonSizes },
} satisfies StoryLiteArgTypes<ButtonDefaultArgs>

export const Default = {
  args: defaultArgs,
  argTypes: defaultArgTypes,
  source: createButton,
  render: (args = defaultArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Button</h1>
      <p>The native button is the component. Timeless CSS styles the <code>.ui-button</code> contract without wrapping the control.</p>
    </header>
    ${createButton(args)}
  </main>`,
} satisfies StoryLiteStoryDefinition<ButtonDefaultArgs>

export const Documentation = {
  source: () => buttonDocsHtml,
  render: () => `<main class="story-md">
    ${buttonDocsHtml}
  </main>`,
} satisfies StoryLiteStoryDefinition

export const Variants = {
  source: () => `<button class="ui-button" type="button">Button</button>
<button class="ui-button" data-ui-variant="secondary" type="button">Secondary</button>
<button class="ui-button" data-ui-variant="outline" type="button">Outline</button>
<button class="ui-button" data-ui-variant="ghost" type="button">Ghost</button>
<button class="ui-button" data-ui-variant="danger" type="button">Delete</button>
<button class="ui-button" data-ui-variant="danger-outline" type="button">Delete</button>
<button class="ui-button" data-ui-variant="link" type="button">Link</button>`,
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Button variants</h1>
      <p>Variants use namespaced data attributes so app-owned attributes do not collide with Timeless styling hooks.</p>
    </header>
    <div class="ui-button-demo-grid">
      ${createVariantSurface('light', 'Light')}
      ${createVariantSurface('dark', 'Dark')}
    </div>
  </main>`,
} satisfies StoryLiteStoryDefinition

export const Sizes = {
  args: sizeArgs,
  argTypes: baseArgTypes,
  source: (
    args = sizeArgs,
  ) => `${createButton({ ...args, label: `Small ${args.label}`, size: 'sm' })}
${createButton({ ...args, label: `Medium ${args.label}`, size: 'md' })}
${createButton({ ...args, label: `Large ${args.label}`, size: 'lg' })}`,
  render: (args = sizeArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Button sizes</h1>
      <p>Size remains a styling attribute; native button behavior and form participation stay untouched.</p>
    </header>
    <section class="ui-demo-row" aria-label="Button sizes">
      ${createButton({ ...args, label: `Small ${args.label}`, size: 'sm' })}
      ${createButton({ ...args, label: `Medium ${args.label}`, size: 'md' })}
      ${createButton({ ...args, label: `Large ${args.label}`, size: 'lg' })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition<ButtonBaseArgs>

function createVariantSurface(scheme: 'light' | 'dark', label: string): string {
  return `<section class="ui-button-demo-surface" data-ui-scheme="${scheme}" aria-label="${label} button variants">
    <h2>${label}</h2>
    <div class="ui-button-demo-list">
      <button class="ui-button" type="button">Button</button>
      <button class="ui-button" data-ui-variant="secondary" type="button">Secondary</button>
      <button class="ui-button" data-ui-variant="outline" type="button">Outline</button>
      <button class="ui-button" data-ui-variant="ghost" type="button">Ghost</button>
      <button class="ui-button" data-ui-variant="danger" type="button">Delete</button>
      <button class="ui-button" data-ui-variant="danger-outline" type="button">Delete</button>
      <button class="ui-button" data-ui-variant="link" type="button">Link</button>
      <button class="ui-button" data-ui-variant="secondary" data-ui-size="sm" aria-busy="true" type="button">Loading...</button>
    </div>
  </section>`
}

function createButton(args: ButtonDefaultArgs): string {
  const variantAttribute =
    args.variant === 'primary' ? '' : ` data-ui-variant="${escapeAttribute(args.variant)}"`
  const sizeAttribute = args.size === 'md' ? '' : ` data-ui-size="${escapeAttribute(args.size)}"`
  const disabledAttribute = args.disabled ? ' disabled' : ''
  const busyAttribute = args.loading ? ' aria-busy="true"' : ''

  return `<button class="ui-button"${variantAttribute}${sizeAttribute}${disabledAttribute}${busyAttribute} type="button">${escapeHtml(args.label)}</button>`
}
