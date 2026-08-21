---
name: author-component
description:
  Add a new Timeless UI component, or change the public surface of an existing one — attributes,
  permitted values, parts, states, CSS variables, events, or the accessibility contract. Covers the
  registry, stylesheet, behavior module, generation, examples, and catalog, in that order. Use for
  requests like "add a component", "add a variant", "change the contract", or "expose a CSS
  variable", and for the build failures "generated element contracts are stale", "uncatalogued
  public class", "undeclared value", and "undocumented custom element". Not for story-only work,
  which is author-component-story, and not for judging a keyboard contract, which is
  verify-apg-conformance.
---

# Author a Timeless component

Adding or changing a component is order-dependent and spans five packages. The order below is not
stylistic: the registry is the single declaration, generation projects it, the validators prove it
against the CSS, and everything downstream reads the generated output. Working out of order means
hand-editing a generated file, which the next `pnpm generate` silently reverts.

Read `.agents/reference/generated-files.md` before editing anything under `packages/components/src`.
Read `.agents/reference/validators.md` when a check fails.

If this is cross-cutting work — a new public API, several components at once, or an architecture
change — open a milestone first with the `manage-milestone` skill.

## 1. Declare the contract in the registry

Everything public starts in `packages/components/scripts/component-registry.mjs`. Nothing public is
declared anywhere else.

Permitted values go in `valueSets`, once:

```js
buttonVariants: {
  type: 'ButtonVariant',
  module: 'button',
  values: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'danger-outline', 'link'],
},
```

- `type` is the exported union type name. `module` decides which `src/values/<module>.ts` gets the
  array, and which module re-exports it.
- Reference a set by name through `set:`. Never inline a value list on an attribute — the registry
  throws on an unknown set name, which is the cheap failure you want.
- Sets with identical values still get separate names when they are separate public exports.
  `buttonSizes`, `primitiveSizes`, and `formControlSizes` are all `sm | md | lg`, and a consumer
  importing one must keep getting that name back.

Then add the component with the helper that matches its kind:

`stylesheet` takes a single value or an array; a component split across the two tiers passes an
array.

```js
css(name, root, stylesheet, attributes, parts, states, variables, a11y)

customElement(
  name,
  tag,
  module,
  classExport,
  factory,
  defineExport,
  stylesheet,
  attributes,
  parts,
  states,
  variables,
  events,
  a11y,
)
```

The field helpers:

| Helper          | Signature                                               | Notes                                                                                                                                                           |
| --------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `attribute`     | `(name, type, { set, default, description, property })` | `property` defaults to `{ name }`; pass `false` when the attribute reflects nothing, or `{ name, type, live }` when the DOM property differs from the attribute |
| `part`          | `(name, required, selector, description)`               | `selector` defaults to `[data-ui-part~='<name>']`; pass a tag when the part is a native element, as `part('panel', true, 'dialog', ...)`                        |
| `state`         | `(name, source, isPublic, description)`                 | `source` is `native`, `aria`, `custom-state`, or `internal-data`                                                                                                |
| `variable`      | `(name, description)`                                   | Component-specific custom properties only. Global Atmosphere tokens are documented once in the theming guide                                                    |
| `event`         | `(name, type, description, cancelable)`                 | `type` must name the detail type _this element_ dispatches, not the shared `UITransitionDetail`                                                                 |
| `accessibility` | `(pattern, patternLabel, keys, notes)`                  | `pattern` is an APG slug. `keys` lists only what the component implements; platform behavior goes in `notes`                                                    |
| `key`           | `(name, action)`                                        | One row of the keyboard table                                                                                                                                   |

Reuse `COLLECTION_KEYS`, `transitionEvents`, and `overlayEvents` rather than restating them.

Choosing attribute style is a hard rule, not a preference:

- Native CSS component, `.ui-*` root class → contract-declared config is `data-ui-*`.
- `ui-*` custom-element host → config is a **plain attribute**. Never `data-ui-*` on a host.
- Booleans on a host are presence/absence — `invalid`, `wrap`, `attached`. Never
  `data-ui-invalid="true"`.
- Authored anatomy is a whitespace-separated `data-ui-part` token list, selected with
  `[data-ui-part~='name']`.
- State with no public attribute equivalent uses `ElementInternals.states` and `:state()`.
  Unavoidable child runtime hooks use private `data-ui-internal-*`, which is never public and never
  documented.

## 2. Write the stylesheets

**Two files, not one.** Since milestone 028 a component's CSS is split by tier, and both halves must
be created and both added by hand to their aggregate:

| File                                   | Holds                                                                                      | Aggregate                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------- |
| `src/css/core/<name>.css`              | Behavior: `display`, positioning, anchoring, scrolling, `appearance`, `pointer-events`     | `src/css/core.css`              |
| `src/css/themes/atmosphere/<name>.css` | The look: colour, background, border, radius, shadow, type, transition, and **all sizing** | `src/css/themes/atmosphere.css` |

Both go in the right cascade layer (`ui.tokens`, `ui.components`, `ui.utilities`), and the registry
entry names both: `['core/<name>.css', 'themes/atmosphere/<name>.css']`.

`check-core-boundary.mjs`, run as `pnpm core:validate` and inside `build`, decides which file a
given declaration belongs in — in **both** directions, so a half-finished split fails rather than
passing quietly. Read its header before arguing with it; the escape hatch is a `core-exempt:`
comment naming a reason, and the count of those is printed on every run.

A core stylesheet must also give every Atmosphere token it reads a literal fallback, because core
has to work with no theme loaded.

`validate-contracts.mjs` proves the stylesheet and the registry against each other in **both**
directions: a value the CSS selects must be declared, and a declared value must be selected or be
the attribute's default. Selectors on `data-ui-internal-*` are skipped, and native or ARIA
attributes are treated as authoritative state rather than documented configuration.

All consumer-facing styling lives here. Component JS must not write colors, spacing, borders,
shadows, layout, position, inset, transforms, or animation.

## 3. Write the behavior module

Only if CSS genuinely cannot carry it. Prefer CSS-only; prefer anchor positioning, native `popover`,
and native `<dialog>` over JS positioning; prefer Light DOM over Shadow DOM; prefer native semantics
before ARIA, adding ARIA only to complete a native contract.

`packages/components/src/<module>.ts`, built on the `@timelessui/core` authoring layer, with a
colocated `<module>.test.ts`.

JS may set behavior attributes and platform state — `id`, `hidden`, `popover`, `aria-*`, `tabindex`,
`role`, `ElementInternals` states, `data-ui-internal-*` hooks, and CSS custom properties for
measured values. It may not create visual class names. Core JS enhances authored markup; it
generates an element only when that element is optional, documented, and stylable through a stable
public API before it is shown.

## 4. Generate

```bash
pnpm -F @timelessui/components run generate
```

Then confirm the proofs:

```bash
pnpm -F @timelessui/components run contracts:validate
pnpm -F @timelessui/components run core:validate
pnpm -F @timelessui/components run manifest:validate
pnpm -F @timelessui/components run exports:validate
pnpm -F @timelessui/components run performance:check
pnpm -F @timelessui/components run test
```

Two of those need a hand-written entry before they can pass, and neither is generated:

- `package.json` `exports` gains a `./<tag-without-the-ui-prefix>` subpath, or `exports:validate`
  reports `Missing class entrypoint`.
- `scripts/performance-baselines.json` gains an entry from `performance:check -- --measure`, or
  `performance:check` reports `Missing performance baseline`.

A public export must never change name or module. If a rename looks necessary, that is a breaking
change and belongs in a milestone.

## 5. Add the consumer example

`packages/examples/src/<group>.html.ts` exports typed `create*` factories that represent the
contract markup. Build root attributes with the typed helper rather than string-concatenating class
and `data-ui-*`:

```ts
import { uiAttributes, uiAttributeString } from '@timelessui/components/attributes'
```

Escape every arg-derived value with `escapeHtml` and `escapeAttribute` from
`packages/examples/src/utils.ts`.

Copyable source must contain no `data-ui-internal-*` and no generated ids. When the component is
invoked declaratively, the author supplies the `id`.

## 6. Register in the catalog

Add an entry to `packages/examples/src/catalog.ts`. Required: `id`, `domain`, `group`, `contracts`,
`component`, `title`, `description`, `definitions`, `styles`, and `render`. Optional and worth
knowing: `guidance` compares sibling components, `authoring` says what the consumer must write, and
`beforeJavaScript` overrides the reference page's generic "Before JavaScript runs" paragraph for a
component that has no pre-registration shell. `contracts` is the field that decides which component
APIs the page documents.

This one declaration drives the documentation sidebar, `/docs/components/`, and the live previews.
**Not** the StoryLite route ids: those come from `resolveStoryId` in
`apps/stories/.storylite/config.ts`, which reads the story filename, and a new story needs a
hand-added entry in its `storyDomains` table.

`validate-docs.mjs` fails on any custom element with no catalog entry and any stylesheet no example
references. For a component with no MDX page, `guidance` **is** its prose — that is where behavior
caveats belong.

## 7. Story, tests, docs

- Story: use the `author-component-story` skill.
- Accessibility: use the `verify-apg-conformance` skill for anything with semantics or interaction.
- E2E: extend the closest spec in `apps/e2e/tests`. Add a `no-javascript.spec.ts` case when the
  component is meant to work before hydration, and a `platform.spec.ts` case when engine behavior
  differs.
- Docs: MDX under `apps/web/src/content/docs/docs/` only for cross-cutting guides. Per-component
  prose belongs in `guidance` and in the registry descriptions.
- Landing page: adding a platform claim to the tin shelf requires a proof pattern in
  `apps/web/scripts/validate-claims.mjs`.

## 8. Gate

```bash
pnpm qa
```

Then run the `audit-component-contracts` skill over the diff for the rules no script checks.
