import type {
  StoryLiteArgTypes,
  StoryLiteMeta,
  StoryLiteStoryDefinition,
} from '@storylite/storylite'
import coreButtonCss from '@timelessui/components/css/core/button.css?raw'
import coreCodeCss from '@timelessui/components/css/core/code.css?raw'
import coreCopyButtonCss from '@timelessui/components/css/core/copy-button.css?raw'
import buttonCss from '@timelessui/components/css/themes/atmosphere/button.css?raw'
import codeCss from '@timelessui/components/css/themes/atmosphere/code.css?raw'
import copyButtonCss from '@timelessui/components/css/themes/atmosphere/copy-button.css?raw'
import themeCss from '@timelessui/components/css/themes/atmosphere/tokens.css?raw'
import tokensCss from '@timelessui/components/css/tokens.css?raw'
import { defineTimelessElements } from '@timelessui/components/define'
import { createCopyButton, createCopySnippet } from './copy-button.html'
import demoCss from './styles.css?raw'

const meta: StoryLiteMeta = {
  title: 'Library/Actions/Copy Button',
  parameters: {
    renderer: 'html',
    css: [
      tokensCss,
      coreCodeCss,
      coreButtonCss,
      coreCopyButtonCss,
      themeCss,
      codeCss,
      buttonCss,
      copyButtonCss,
      demoCss,
    ],
    defineCustomElements: defineTimelessElements,
  },
}
export default meta

type SnippetArgs = {
  snippet: string
  label: string
  copiedMessage: string
}

const snippetArgs: SnippetArgs = {
  snippet: 'pnpm add @timelessui/components',
  label: 'Copy the install command',
  copiedMessage: 'Install command copied',
}

const snippetArgTypes = {
  snippet: { control: 'text' },
  label: { control: 'text' },
  copiedMessage: { control: 'text' },
} satisfies StoryLiteArgTypes<SnippetArgs>

const createSnippet = (args: SnippetArgs = snippetArgs): string =>
  createCopySnippet({ id: 'install-command', ...args })

export const Default = {
  args: snippetArgs,
  argTypes: snippetArgTypes,
  source: createSnippet,
  render: (args = snippetArgs) => `<main class="ui-demo-page">
    <header>
      <h1>Copy Button</h1>
      <p><code class="ui-code">from</code> names the element holding the text, so the snippet lives once in the markup the reader is looking at. The trigger keeps one accessible name throughout; the label that swaps is decorative, and the confirmation is announced through the <code class="ui-code">status</code> region.</p>
    </header>
    <section class="ui-demo-row" aria-label="Copy an install command">
      ${createSnippet(args)}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition<SnippetArgs>

/**
 * The three anatomies together, because what changes between them is where the announcement comes
 * from — and that is the decision an author has to make once.
 */
const token = {
  label: 'Copy the API token',
  value: 'tok_7f3c19b2',
  copiedMessage: 'API token copied',
} as const

const buildCommand = {
  id: 'shapes-command',
  label: 'Copy the build command',
  snippet: 'pnpm build:site',
  copiedMessage: 'Build command copied',
} as const

export const Shapes = {
  source: () =>
    [
      createCopyButton(token),
      createCopyButton({ ...token, labels: 'icons' }),
      createCopySnippet(buildCommand),
    ].join('\n'),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Copy Button shapes</h1>
      <p>All three copy and announce. They differ in what the reader sees and where the announcement text comes from.</p>
    </header>
    <section class="ui-demo-stack" aria-label="Worded labels">
      <h2>Worded</h2>
      <p>The <code class="ui-code">copied</code> label reads <em>Copied</em>, so <code class="ui-code">copied-message</code> is optional — the part&rsquo;s own text is the fallback.</p>
      ${createCopyButton(token)}
    </section>
    <section class="ui-demo-stack" aria-label="Icon labels">
      <h2>Icon only</h2>
      <p>Two glyphs and no text, which is why <code class="ui-code">copied-message</code> exists: there is nothing to read an announcement off.</p>
      ${createCopyButton({ ...token, labels: 'icons' })}
    </section>
    <section class="ui-demo-stack" aria-label="Copying from the page">
      <h2>From the page</h2>
      <p><code class="ui-code">from</code> reads the element it names — <code class="ui-code">.value</code> for an input, select, or textarea, and text for anything else.</p>
      <div class="ui-demo-row">
        ${createCopySnippet(buildCommand)}
      </div>
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition

/**
 * The opt-in reveal. Authoring the trigger `hidden` is the only way to guarantee no dead control ever
 * renders, since `navigator.clipboard` is absent outside a secure context and the element will not
 * remove a visible button an author wrote.
 */
export const HiddenUntilSupported = {
  source: () => createCopyButton({ ...token, labels: 'icons', hiddenUntilSupported: true }),
  render: () => `<main class="ui-demo-page">
    <header>
      <h1>Hidden until supported</h1>
      <p>The trigger is authored <code class="ui-code">hidden</code>. Registration removes the attribute only once <code class="ui-code">navigator.clipboard</code> is there, so on an insecure origin, or before this script runs, the button is not shown at all rather than shown and inert.</p>
    </header>
    <section class="ui-demo-row" aria-label="A trigger revealed by enhancement">
      ${createCopyButton({ ...token, labels: 'icons', hiddenUntilSupported: true })}
    </section>
  </main>`,
} satisfies StoryLiteStoryDefinition
