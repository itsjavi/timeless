---
name: author-component-story
description:
  Write or revise a StoryLite story for a Timeless UI component in apps/stories — file structure,
  meta and title paths, arg types, reusable anatomy factories, copyable source snippets, and
  demo-only styling. Use for requests like "add a story", "add a demo", "fix the story controls", or
  "split this story file", and for the build failure "implementation-oriented StoryLite routes
  remain". Not for changing the component's own public contract, which is author-component.
---

# Author a component story

Stories in `apps/stories` are the component catalog and the copy surface consumers paste from.
Almost none of these rules are machine-checked, so they have to be applied deliberately.

## File layout

One component per story file. Related components group by title path, not by file.

```
apps/stories/src/stories/<group>/<component>.stories.ts   the story
apps/stories/src/stories/<group>/shared.ts                the group's meta factory
apps/stories/src/stories/<group>/shared.css               group demo styles
apps/stories/src/stories/<component>.html.ts              anatomy factories, when not in examples
apps/stories/src/stories/<component>.stories.md           long-form docs, when needed
apps/stories/src/stories/<component>.stories.css          component-specific demo styles
```

Anatomy factories belong in `@timelessui/examples` whenever consumers should see the same markup the
website shows. Several `*.html.ts` files in `apps/stories/src/stories` are one-line re-exports of
the examples package — follow that, do not fork the markup.

## meta

Keep `meta` near the top: after imports, before local types, constants, helpers, and story exports.

```ts
const meta: StoryLiteMeta = {
  title: 'Library/Overlays/Popover',
  parameters: {
    renderer: 'html',
    css: [tokensCss, popoverCss, demoCss],
    defineCustomElements: defineTimelessElements,
  },
}
export default meta
```

Most groups build this through a factory in their `shared.ts` — `createCssPrimitiveMeta('Badge')`
and its siblings — which derives `Library/${domain}/${displayName}` and attaches the group's CSS
list. Use the factory when one exists; write `meta` inline only when the story needs its own CSS or
its own docs page, as `button.stories.ts` does.

### Title paths

`Library/<Group>/<Component>` or `Recipes/<Group>/<Component>`. `<Group>` is the catalog group:
Foundations, Actions, Content, Feedback, Forms, Navigation, Overlays, Color.

`apps/stories/scripts/write-route-catalog.mjs` **fails the build** on implementation-oriented
prefixes. Never title a story `CSS Primitives/…`, `Form Primitives/…`, `Collection Navigation/…`,
`Progressive Overlays/…`, or `Color Controls/…` — those are directory names, not catalog groups. The
build also fails if no `Library/` or no `Recipes/` route exists.

## Stories to export

- `Default` is required. Give it useful args and working controls.
- Additional exports must teach something `Default`'s controls cannot reach. Do not export a variant
  that is one control value.
- When a component has several useful dimensions, prefer a composite story that compares them
  together — a Button sizes story showing each size across variants, disabled, and loading.
- Prefer a realistic interface over an artificial variant grid when that teaches the contract
  better. `recipes/` holds the fully composed cases.

## argTypes

Import the exported value array. Never retype the options.

```ts
import {
  buttonSizes,
  buttonVariants,
  type ButtonSize,
  type ButtonVariant,
} from '@timelessui/components'

const argTypes: StoryLiteArgTypes = {
  variant: { control: 'select', options: [...buttonVariants] },
  size: { control: 'select', options: [...buttonSizes] },
}
```

A hand-copied list drifts silently the moment the registry changes, and nothing catches it.

## render and source

`render` may add StoryLite wrappers, layout, and explanatory content. The moment it does, the story
is no longer pure consumer markup, so declare an explicit `source` with the code a consumer should
paste:

```ts
export const Default: StoryLiteStoryDefinition = {
  args: { label: 'Save', variant: 'primary', size: 'md' },
  argTypes,
  render: (args) => `<main class="demo-page">${createButton(args)}</main>`,
  source: (args) => createButton(args),
}
```

Both paths call the same factory. Never let StoryLite copy a demo-only `<main>`, a showcase grid, or
a section heading. Copied source must contain no `data-ui-internal-*` and no generated ids.

## Factories

Typed, exported, reusable by both `render` and `source`:

```ts
export type PopoverProps = { id: string; label: string; role?: PopoverRole }
export const createPopover = (props: PopoverProps) => `<ui-popover>...</ui-popover>`
```

They must emit the public API a consumer writes: plain attributes on `ui-*` hosts, contract-declared
`data-ui-*` on native roots, `data-ui-part` for authored anatomy. Escape every arg-derived value
with `escapeHtml` and `escapeAttribute` from `apps/stories/src/lib/utils.ts`.

Story-only page wrappers, demo data, demo grids, and one-off scenario composition stay in the
`.stories.ts` file unless they are shared or useful as copyable anatomy.

## Demo styles

Shared demo layout lives in `apps/stories/src/stories/styles.css`. Component-specific demo styles go
in a dedicated `<component>.stories.css`, imported `?raw` and appended to `meta.parameters.css`.
Wrap them in `@layer ui.showcase` so they never compete with component CSS.

Demo styles are demo styles. If a rule looks like it belongs to the component, it belongs in
`packages/components/src/css/`.

## Long-form docs

For a component that needs more explanation than args can carry, add a sibling
`<component>.stories.md`, import it as HTML, and export it as the default documentation story —
`button.stories.ts` is the working example.

## Verify

```bash
pnpm -F @apps/stories run typecheck
pnpm dev:ui
```

The route catalog and the axe sweep both read the built routes, so run the full gate before opening
a PR:

```bash
pnpm qa
```
