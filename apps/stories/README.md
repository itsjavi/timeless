# Component catalog

The StoryLite workbench for Timeless components: variants, live controls, and manual testing.

```bash
pnpm dev:ui       # http://localhost:1992
pnpm build:stories
```

## What belongs here, and what does not

Reference documentation lives in `apps/web` and is generated from the component registry — attribute
values, defaults, anatomy, state, events, and CSS imports are all rendered from the contract, so
writing them here by hand would create a second source of truth that drifts.

Use this app for what generated reference pages cannot show:

- Variant and state matrices compared side by side.
- Interactive controls over story arguments.
- Light and dark examples where the treatment differs materially.
- No-JavaScript and unsupported-capability scenarios.
- Performance and large-dataset scenarios.

Stories show public consumer markup. See [AGENTS.md](../../AGENTS.md) for the authoring rules.

## Story ids

`.storylite/config.ts` derives every story id from the example catalog in `packages/examples`, so
routes stay `library-{domain}-{component}--{story}`. The `domain` field is deliberately separate
from the documentation sidebar `group`: regrouping the sidebar for readers must not rename these
routes, because the website links to them and `scripts/compose-static-site.mjs` validates those
links.

`pnpm build:stories` regenerates `story-routes.json` and fails if implementation-oriented routes
reappear.

## Markdown documentation in a story

StoryLite can render Markdown as document content when the Vite pipeline turns Markdown imports into
HTML strings. This app uses Satteri through `vite-plugin-satteri`, but that is not a Timeless
requirement — any Vite plugin works as long as a Markdown import yields plain HTML.

```ts
import { defineConfig } from '@storylite/storylite'
import satteri from 'vite-plugin-satteri'

export default defineConfig({
  stories: ['./src/**/*.stories.ts'],
  vitePlugins: [satteri({ mdx: false, features: { frontmatter: true, gfm: true } })],
})
```

Declare the import shape, adjusting it if the chosen plugin exports different names:

```ts
declare module '*.md' {
  const html: string
  const frontmatter: Record<string, unknown>
  export default html
  export { html, frontmatter }
}
```

Then export a documentation story alongside the interactive ones, keeping the `.stories.md` file
next to the story so the two move together:

```ts
import type { StoryLiteStoryDefinition } from '@storylite/storylite'
import buttonDocsHtml from './button.stories.md'

export const Documentation = {
  render: () => `<main class="story-md">${buttonDocsHtml}</main>`,
} satisfies StoryLiteStoryDefinition
```

Keep `Default` focused on the component API and controls. Use Markdown only for guidance that the
generated reference pages do not already carry.
