---
status: Implemented
---

# Milestone 021 Plan: Surface Consolidation and the Published Boundary

## Goal

Remove the duplication that makes the library feel padded, without removing capability. Three pairs
of components currently do one job each; one of those pairs hides a live bug. One attribute value is
inert and its documentation contradicts its implementation. Tooltip is a variant of Hover Card and
looks almost identical to it. Seven copies of two feature-detect functions exist. Fix all of that,
then publish the list of components Timeless will deliberately never ship, so "what belongs here" is
a written boundary instead of a judgement call repeated per pull request.

Nothing a consumer can do today may stop working, except where the current behavior is provably
broken or actively discourages native semantics.

## Context

A comparison against Base UI (37 components) and shadcn/ui (64) put Timeless at 43 documented
components over 53 registry contracts and 38 stylesheets. The count is unremarkable — the middle of
the three. What is remarkable is how much of it is the same thing written twice.

### What the study found

Each of these was read directly rather than inferred.

**1. `disclosure.css` and `collapsible.css` are the same stylesheet.** 98 and 104 lines, rule for
rule, selector for selector, in the same order: root border, `:first-child` border-block-start,
compact density override, `> summary` grid, `::-webkit-details-marker` reset, `::after` chevron,
`[open]` chevron rotation, `:hover`, `:focus-visible`, `> :not(summary)` panel, panel prose
constraint, `@supports selector(::details-content)` height animation, and the
`prefers-reduced-motion` clamp. Only three things differ:

| Aspect           | `.ui-disclosure`                                                                       | `.ui-collapsible`                                                                        |
| ---------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Parameterisation | 2 custom properties, declared **inside `> summary`**                                   | 7 custom properties, declared on the **root**                                            |
| Cursor           | `cursor: pointer` ([disclosure.css:30](packages/components/src/css/disclosure.css:30)) | `cursor: default` ([collapsible.css:36](packages/components/src/css/collapsible.css:36)) |
| Durations        | hardcoded `180ms`                                                                      | `var(--ui-collapsible-duration)`                                                         |

Both are the same `<details>` element. Both declare exactly one attribute, `data-ui-density`.
Neither declares a single part. The catalog tells readers the difference is that Disclosure is "the
same `<details>` element with lighter styling"
([catalog.ts:675](packages/examples/src/catalog.ts:675)) — and the stylesheets show it is not even
that, because the two are visually identical at default density.

**2. Disclosure's `data-ui-density="compact"` does nothing.** This is the bug the duplication hid.
`disclosure.css:10-13` sets `--ui-disclosure-trigger-min-block-size` and
`--ui-disclosure-trigger-padding-block` on the root under `:where([data-ui-density='compact'])`. But
`disclosure.css:15-17` re-declares both **on `> summary`**, and the summary's own declaration
shadows the value it would otherwise inherit from its parent. The summary then reads
`min-block-size: var(--ui-disclosure-trigger-min-block-size)`
([disclosure.css:23](packages/components/src/css/disclosure.css:23)) and always gets `3.5rem`.
`.ui-collapsible` is immune because it declares its custom properties on the root
([collapsible.css:4-9](packages/components/src/css/collapsible.css:4)).

`contracts:validate` passes anyway, and that is worth recording as a limit of the validator: it
proves a declared value is _selected_ by some rule, not that the rule has any effect. `compact` is
selected at `disclosure.css:10`, so the gate is satisfied by a rule whose declarations are
subsequently shadowed.

**3. `cursor: pointer` on `.ui-disclosure > summary` contradicts DESIGN.md**, which states plainly
that for interactive controls "cursor remains `default`". `.ui-collapsible` follows the guide.

**4. `data-ui-variant="ordered"` on `.ui-list` is inert where it is documented and wrong where it
works.** `list.css` has no positive rule for `ordered`. Its only appearance is a negation:

```css
/* list.css:15 */
ul.ui-list:where(:not([data-ui-variant='ordered'])) {
  list-style: none;
}
```

The registry describes it as "Use `ordered` together with an `<ol>` element, not instead of one."
But that selector matches `ul.ui-list` only, so on an `<ol class="ui-list">` — the documented use —
the attribute changes nothing; an `<ol>` keeps its markers with or without it. On a
`<ul class="ui-list" data-ui-variant="ordered">` it does have an effect, and the effect is _disc
bullets_, not numbers. So the value is inert in the case the docs endorse, misnamed in the case it
functions, and the only thing it can actually accomplish is making a `<ul>` look like a list with
markers — which a library built on native semantics should not offer.

`plain` is a different story and should stay. It has no rules either, but it is the declared
default, which `contracts:validate` explicitly permits, and a named default is useful documentation
and a useful explicit reset. Only `ordered` is being removed.

**5. Choice Group is already the shared stylesheet, and is documented as a rival anyway.** The
catalog's `checkbox-group` entry loads `['tokens.css', 'choice-group.css']`
([catalog.ts:550](packages/examples/src/catalog.ts:550)) — the same 37-line stylesheet the CSS-only
Choice Group loads. So the styling is not duplicated; only the _documentation_ is. Two component
pages, with reciprocal `guidance` sending readers to each other
([catalog.ts:402](packages/examples/src/catalog.ts:402),
[catalog.ts:542](packages/examples/src/catalog.ts:542)), tell a consumer to choose between "the CSS
one" and "the JavaScript one". That is an implementation choice presented as an API choice. A
consumer wants a checkbox group; whether keyboard coordination is present is the component's
problem, and `ui-checkbox-group` already degrades to plain native markup when its script does not
load.

**6. Tooltip is a Hover Card variant and barely looks different.** There is no `tooltip` contract.
`popover.css:44-57` overrides four things on `ui-hover-card[variant='tooltip']`:

| Property          | Base surface (popover.css:7-24)  | Tooltip override (popover.css:44-57)  |
| ----------------- | -------------------------------- | ------------------------------------- |
| `max-inline-size` | `min(22rem, calc(100vw - 2rem))` | `18rem`                               |
| `border-radius`   | `var(--ui-radius-lg)`            | `var(--ui-radius-md)`                 |
| `padding`         | `var(--ui-space-4)`              | `var(--ui-space-2) var(--ui-space-3)` |
| `font-size`       | inherited                        | `0.8125rem`                           |
| colours           | `--ui-bg-surface` / `--ui-fg`    | inverted via `--ui-tooltip-bg/fg`     |

and inherits everything else — including four declarations that are wrong for a tooltip:
`overflow: auto` and `overscroll-behavior: contain` (a tooltip is one non-interactive line and must
never scroll), `max-block-size: calc(100dvh - 6rem)` (reserving nearly the viewport for a label),
and `line-height: 1.5` (loose for a single line). `box-shadow: var(--ui-shadow-floating)` is
re-declared at `popover.css:55` with a value identical to the base at `popover.css:20`, so the
override does nothing at all. DESIGN.md asks for tooltips that are "small, crisp, and readable";
18rem wide with `--ui-space-4`-scale ancestry and a full floating shadow is none of those.

There is also an `!important` in the component stylesheet
([popover.css:128-130](packages/components/src/css/popover.css:128)) forcing `p` colour to inherit
inside a tooltip. Both the base `p` rule and the tooltip `p` rule resolve to specificity `0-0-1`,
and the tooltip rule comes later in source order, so it should already win. The `!important` is at
best unnecessary and at worst masking something else.

**7. Seven copies of two feature-detect functions.**

| Function                | Copies                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| `supportsNativePopover` | `combobox.ts:415`, `hover-card.ts:360`, `menu-button.ts:279`, `popover.ts:241`, `select.ts:454` |
| `supportsNativeDialog`  | `dialog.ts:252`, `sheet.ts:350`                                                                 |

Milestone 020's plan already names this ("Do not add a sixth copy of a `supportsX` function to a
component file") and creates `invoker.ts` for its own detect. Consolidating the existing seven is
the matching half of that decision, and it belongs in a consolidation milestone rather than being
deferred again.

### Decisions taken

1. **Collapsible absorbs Disclosure.** One stylesheet, one contract, one page. The visual difference
   becomes `data-ui-variant="panel | plain"` on `.ui-collapsible`, with `plain` reproducing the
   current disclosure look. Collapsible's root-declared custom properties are the surviving shape,
   which fixes the density bug by construction rather than by a separate patch.
2. **Exclusive accordions come from the platform, not from JavaScript.** `<details name="group">`
   gives one-open-at-a-time in all three engines. Timeless does not use or document it anywhere. The
   fix is a documented attribute on authored markup plus an example — no component, no script.
3. **`ordered` is removed from `listVariants`.** `plain`, `divided`, and `inset` stay.
4. **Choice Group stops being a documented component and stays a stylesheet.** `choice-group.css`
   keeps its name and its selectors; the `.ui-choice-group` root contract survives because CSS-only
   `<fieldset>` markup still needs it. What goes away is the second catalog entry and the pair of
   guidance notes telling consumers to pick an implementation.
5. **Tooltip gets its own contract and its own stylesheet section**, and is made materially smaller.
   Whether it also gets a `ui-tooltip` tag is settled below.
6. **One capability module** for the platform feature detects.
7. **The boundary gets published.** A documentation page naming what Timeless will not build, and
   why, with Date Picker recorded as "not yet" rather than "never".

### Decision detail: `ui-tooltip` tag, or `variant` on Hover Card?

Adding a `ui-tooltip` custom element would mean a second registered element wrapping the same
controller, a second contract, a second define entrypoint, and a second catalog entry — which is
exactly the pattern this milestone exists to remove. Keeping `variant="tooltip"` on `ui-hover-card`
keeps one element but leaves the most-searched overlay in the library undiscoverable under another
component's name.

**Take the middle option: keep one element, give Tooltip its own contract entry and its own page.**
The registry can declare a contract whose root is `ui-hover-card[variant='tooltip']`, so the
generated reference gets a real Tooltip page with its own anatomy, keys, and CSS variables, while
the runtime keeps exactly one custom element. This needs a registry change — `css()` and
`customElement()` both assume a bare root name — and that change is in scope. If the generator
cannot express a qualified root without distorting the manifest, fall back to keeping Tooltip as a
Hover Card variant and record why in `RESULTS.md`; do **not** add a second element as a workaround.

## Architecture

- The merged Collapsible keeps `.ui-collapsible` as the root and adds one attribute.
  `.ui-disclosure` disappears from the stylesheets, the registry, `values/primitives.ts`, the
  catalog, and the docs. Because the package is unpublished, this is a rename rather than a
  deprecation, and there is no compatibility shim — AGENTS.md's "a public export must never change
  name or module" rule protects published names, and `ui-disclosure` has never shipped.
- Every removal must travel through the registry. Deleting a value from `valueSets` and deleting the
  CSS that selects it are two halves of one change, and `contracts:validate` fails on either half
  alone: an orphaned value reports "declared value is never selected", an orphaned selector reports
  "selects undeclared value".
- Tooltip's declarations move out of the shared `[popover]` base rather than being layered on top of
  it. A tooltip that has to override `overflow`, `overscroll-behavior`, and `max-block-size` back to
  sane values is inheriting from the wrong place. Extract the genuinely shared floating surface
  (border, radius, background, shadow, anchor wiring) and let Hover Card and Tooltip each state
  their own box.
- The capability module exports one function per platform feature and is the only place a
  `'popover' in ...`-style probe appears. Component modules take the boolean as an enhancement
  option, which is the shape they already use (`supportsPopover`, `supportsDialog`) and which keeps
  their unit tests able to force the unsupported path.
- The boundary page is prose, not a gate. Do not build a validator for it.

## Constraints

- `contracts:validate` proves stylesheets against the registry in both directions, so the CSS and
  the value sets must change in the same commit.
- **`packages/examples/scripts/validate.mjs` is the strictest gate here and is undocumented in
  [.agents/reference/validators.md](.agents/reference/validators.md).** It runs as
  `pnpm -F @timelessui/examples run test`, imports the registry, renders every example, and throws
  on seventeen conditions. Deleting the `disclosure` contract or the `ordered` value makes every
  example still referencing them fail with `<id> references unknown contract` or
  `<id> uses unknown public attribute`. That forces the order: registry, generate, then examples.
- `Undocumented CSS exports: <files>` fires the moment a stylesheet is referenced by no example's
  `styles` array. Removing Choice Group's catalog entry must therefore keep `choice-group.css`
  listed on the `checkbox-group` and `radio-group` entries — which it already is.
- `Undocumented custom elements: <tags>` fires for a registered element with no catalog entry.
  Nothing in this milestone removes an element, so this gate should stay quiet; if it fires, an
  element was dropped by accident.
- Every generated file is rewritten by `pnpm generate`. `values/primitives.ts` carries
  `listVariants` and the disclosure/collapsible density sets, and `contracts.ts`, `attributes.ts`,
  the five framework typings, `custom-elements.json`, and the three editor-data files all change
  with it. Never hand-edit any of them; the full list is in
  [.agents/reference/generated-files.md](.agents/reference/generated-files.md).
- `ListVariant` is a public type export from `packages/components/src/values/primitives.ts`.
  Removing `ordered` narrows that union. It is a breaking type change, permitted only because the
  package is unpublished, and it must be stated in `RESULTS.md` rather than slipped in.
- The `data-ui-density` sets are shared. `compactDensities` is referenced by `list`, `table`,
  `disclosure`, and `collapsible`; removing the disclosure contract must not remove the set.
- Stories must keep showing copyable consumer markup with no `data-ui-internal-*`, and the StoryLite
  route titles must stay `Library/<Group>/<Component>` or
  `Implementation-oriented StoryLite routes remain` fires.
- The `!important` at `popover.css:128` may only be removed after confirming what it was for. If a
  story or example regresses without it, keep it and record the reason.

## Implementation sequence

### 1. One capability module — new file `packages/components/src/capabilities.ts`

Follow the small-focused-module shape of [floating.ts](packages/components/src/floating.ts), with a
colocated `capabilities.test.ts`.

- `supportsNativePopover(win)` and `supportsNativeDialog(win)`, lifted verbatim from the existing
  copies so behavior is unchanged.
- Delete the seven private copies at `combobox.ts:415`, `hover-card.ts:360`, `menu-button.ts:279`,
  `popover.ts:241`, `select.ts:454`, `dialog.ts:252`, and `sheet.ts:350`, importing from the new
  module instead.
- Do **not** export these from `src/index.ts`. They are internal; adding them to the public barrel
  creates a support surface this milestone has no reason to take on. Confirm `exports:validate`
  stays green either way.
- If milestone 020 has landed by the time this runs, move **only** `supportsInvokerCommands` here
  and have `invoker.ts` **re-export it**, rather than deleting it. 020 exports `invoker.ts`'s
  helpers from `src/index.ts`, which makes them public, and AGENTS.md says a public export must
  never change name or module. `authoredCommand`, `hasAuthoredCommand`, and the command-name
  constants are invoker-specific and stay in `invoker.ts`; only the capability probe moves. A
  re-export keeps one implementation and one public module, which is the whole point.

This step is pure refactor with no behavior change, which makes it the safe first commit.

### 2. Collapsible absorbs Disclosure

**Registry** — [component-registry.mjs](packages/components/scripts/component-registry.mjs):

- Delete the `disclosure` component entry.
- Add `data-ui-variant` to `collapsible`, referencing a new `collapsibleVariants` set with
  `['panel', 'plain']` and default `panel`. `panel` is the current collapsible look; `plain` is the
  current disclosure look.
- Keep `data-ui-density` on `collapsible` and leave `compactDensities` in place.
- Give both values real descriptions. Placeholders fail the build.

**Stylesheet** — merge into [collapsible.css](packages/components/src/css/collapsible.css) and
delete `packages/components/src/css/disclosure.css`:

- Keep collapsible's root-declared custom properties. Do not reintroduce the `> summary`
  declarations that made disclosure's compact density inert.
- Add a `[data-ui-variant='plain']` block for whatever genuinely differs. Compare the two rendered
  states first: if nothing differs beyond values already parameterised as custom properties, the
  variant block is a handful of custom-property overrides, not a second copy of the component.
- Set `cursor: default` on the merged `> summary`, per DESIGN.md.
- Remove `disclosure.css` from `packages/components/src/css/components.css` if it is aggregated
  there.

**Everything downstream:**

- `pnpm -F @timelessui/components run generate`.
- [packages/examples/src/primitives.html.ts](packages/examples/src/primitives.html.ts): delete
  `createDisclosure`, and give `createCollapsible` a `variant` prop.
- [packages/examples/src/catalog.ts](packages/examples/src/catalog.ts): delete the `disclosure`
  entry (line 226) and its `guidance`; rewrite the `collapsible` entry's `guidance` (line 674) so it
  stops pointing at a page that no longer exists and instead explains `panel` versus `plain`.
- `apps/stories/src/stories/progressive-overlays/collapsible.stories.ts`: fold the disclosure story
  in as a variant comparison, per the AGENTS.md rule that composite stories beat one-off variant
  exports. Delete any disclosure story file.
- Search the MDX docs and `README.md` for "Disclosure" and retract every mention. Run
  `audit-docs-drift` afterwards.

### 3. Native exclusive accordions

No component work. `<details name="faq">` already coordinates one-open-at-a-time across engines.

- Add a `name` prop to `createCollapsible` so the factory can emit it, and use it in the example so
  the copyable markup shows it.
- Document it in the `collapsible` catalog `guidance` and in the accessibility notes on the
  `collapsible` contract: an exclusive accordion is `name` on each `<details>`, the platform
  enforces it, and no script is involved.
- Add a StoryLite story showing an exclusive stack next to an independent stack, because the
  difference is behavioral and a generated reference page cannot show it.
- Add an E2E assertion in `apps/e2e/tests/apps/stories/` that opening the second panel closes the
  first, and verify it with scripting disabled in `no-javascript.spec.ts` — the entire point of this
  step is that no script is involved.

**Confirm before writing the docs:** whether `name` on `<details>` interacts badly with the
`::details-content` height transition at `collapsible.css:79-96`. An exclusive close is UA-driven
and may not run the same transition as a user toggle. Test it; if the animation is skipped on the
auto-closed panel, say so on the page rather than pretending otherwise.

### 4. Remove `ordered` from `listVariants`

- Registry: drop `'ordered'` from the `listVariants` set and rewrite the `data-ui-variant`
  description, which currently documents the value's inert case as its intended use.
- [list.css:15](packages/components/src/css/list.css:15): replace
  `ul.ui-list:where(:not([data-ui-variant='ordered'])) { list-style: none }` with
  `ul.ui-list { list-style: none }`. `<ol class="ui-list">` is unaffected — it was never matched by
  that selector and keeps its markers.
- Check `list-style-position: inside` at `list.css:12` is still wanted once no `<ul>` shows markers.
  It only affects marker-bearing lists, so it now applies solely to `<ol>`; keep it if `<ol>` inset
  and divided variants look right, drop it if not.
- Grep the examples, stories, and MDX for `data-ui-variant="ordered"` and convert every use to an
  `<ol class="ui-list">`.
- `pnpm generate`, then `contracts:validate`.

### 5. Choice Group stops being a documented component

- Registry: keep the `choiceGroup` and `choice` contracts. They are the CSS-only `<fieldset>` root
  and its rows, and `checkbox-group` / `radio-group` markup uses them.
- Catalog: delete the `choice-group` entry (line 400). Move anything it demonstrated that the other
  two do not — a plain `<fieldset>` with no custom element — into the `checkbox-group` entry as a
  second example, so the no-JavaScript story is still shown rather than deleted.
- Delete the reciprocal `guidance` on `choice-group`, `checkbox-group` (line 542), and
  `radio-group`. Replace with one sentence on the surviving pages: the custom element adds keyboard
  coordination and change events, and the markup still works without it.
- Confirm `choice-group.css` remains in the `styles` array of both surviving entries, or
  `Undocumented CSS exports` fires.
- Because `choiceGroup` keeps its contract but loses its page, confirm the component index at
  `/docs/components/` and `apps/web/src/pages/docs/components/[slug].astro` do not 404 on a stale
  link. Grep the MDX for `/docs/components/choice-group/`.

### 6. Tooltip: its own contract, and materially smaller

**Restructure `popover.css` first.** The current shared base
([popover.css:7-24](packages/components/src/css/popover.css:7)) is a _popover_ box that Hover Card
and Tooltip inherit. Split it:

- A floating-surface group holding only what all three share: `box-sizing`, `margin: 0`, border,
  background, shadow token reference, `font: inherit`, and the anchor wiring at lines 63-69.
- Per-component boxes for sizing, padding, radius, `overflow`, and `line-height`.

Then give Tooltip a box that suits a label:

- No `overflow` and no `overscroll-behavior`. A tooltip does not scroll.
- No `max-block-size`. Let content size it.
- A tighter `max-inline-size` — target roughly `min(16rem, calc(100vw - 2rem))`, and check it
  against the longest tooltip in the stories rather than picking a number blind.
- `line-height` near `1.35`.
- A lighter shadow than `--ui-shadow-floating`, or none. DESIGN.md permits overlays to be tactile
  but asks tooltips to be "small, crisp". Introduce `--ui-shadow-tooltip` in `tokens.css` if a
  distinct value is wanted, and remember that a token added to the stylesheet must also be listed in
  `src/tokens.ts` or the build fails.
- Drop the redundant `box-shadow` re-declaration at `popover.css:55`, which restates the base value.
- Investigate the `!important` at `popover.css:128-130`. Remove it if the tooltip `p` rule wins on
  source order as the specificity maths says it should; keep it and record why if a real case needs
  it.

**Then declare the contract.** Add a `tooltip` component to the registry whose root is
`ui-hover-card[variant='tooltip']`, with its own parts, `apg: 'tooltip'`, and its own CSS variables.
Add a `tooltip` catalog entry pointing at it, and drop the current arrangement where the Tooltip
page borrows the `hoverCard` contract ([catalog.ts:797](packages/examples/src/catalog.ts:797)).

If the registry's `css()` / `customElement()` helpers cannot express a qualified root, stop and take
the fallback named in "Decision detail" above rather than adding a `ui-tooltip` element.

**Keep `hoverCard`'s `variant` set as-is.** `hoverCardVariants` is `['tooltip']`, a single-value
set, and the tooltip contract does not replace the attribute — the attribute is how an author opts
in.

### 7. Publish the boundary

New MDX page under `apps/web/src/content/docs/docs/reference/` — sibling to `browser-support.mdx`,
which is the closest existing thing in voice and purpose.

Contents, stated as decisions with reasons rather than as a list of absences:

| Not shipping                                    | Because                                                                                                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Aspect Ratio                                    | `aspect-ratio` is one declaration                                                                                                              |
| Scroll Area                                     | Custom scrollbars fight momentum scrolling and platform conventions; `scrollbar-color`, `scrollbar-width`, and `scrollbar-gutter` are Baseline |
| Carousel                                        | Every implementation wraps a third-party engine; scroll-snap and scroll buttons are the CSS answer                                             |
| Chart                                           | Charting is a library, not a primitive                                                                                                         |
| Data Table                                      | Sorting, filtering, and virtualisation belong to a table library; the CSS `.ui-table` stays                                                    |
| Sidebar and app shells                          | Composition, not a primitive                                                                                                                   |
| Chat and AI surfaces                            | Product surfaces                                                                                                                               |
| Tree View                                       | The hardest APG pattern with the least reuse                                                                                                   |
| Command palette                                 | Combobox plus Dialog; will be documented as a recipe once milestone 022 lands                                                                  |
| Date Picker / Calendar — **not yet, not never** | `<input type="date">` covers the common case; a real calendar is a locale project. Revisit after 022                                           |

Link it from the components index and from `README.md`'s component-catalog section. Do not add a
validator for this page.

### 8. Milestone records

`.agents/memory/milestones/021-surface-consolidation/`. Keep `PLAN.md` static from here. `TASKS.md`
follows this sequence. `RESULTS.md` uses the Baseline / Platform behavior confirmed before planning
/ Open decisions / Decisions and constraints / Summary / Validation results shape, and must record:
the measured before-and-after stylesheet line counts, whether the `<details name>` close animates,
and whether the qualified-root registry change worked or the fallback was taken.

## Verification

1. **Unit** — `pnpm -F @timelessui/components run test`. New `capabilities.test.ts`. The existing
   `supportsPopover: false` / `supportsDialog: false` fallback tests in `popover.test.ts`,
   `select.test.ts`, `combobox.test.ts`, `menu-button.test.ts`, `hover-card.test.ts`,
   `dialog.test.ts`, and `sheet.test.ts` must pass unchanged — they are the proof that step 1
   changed nothing.
2. **The density bug, proven twice** — an E2E or unit assertion that a compact merged Collapsible
   really has a smaller trigger than a default one. Write it against `.ui-disclosure` first and
   watch it fail on `main`, so the fix is demonstrated rather than asserted.
3. **Exclusive accordion** — E2E in `apps/e2e/tests/apps/stories/`, plus a `no-javascript.spec.ts`
   case. Scripting off is the point.
4. **Tooltip size** — an E2E assertion on the computed `max-inline-size`, `padding`, and `overflow`
   of a tooltip surface, and a screenshot in the story pair so the visual difference from Hover Card
   is reviewable. `computed CSS` assertions are the only way to keep this from regressing silently.
5. **Contracts** — `pnpm -F @timelessui/components run contracts:validate` must report neither an
   undeclared value nor an unselected one after `ordered` and the disclosure contract are removed.
6. **Docs** — run `audit-docs-drift` for stale references to Disclosure, Choice Group, and
   `ordered`. Confirm no MDX page links to a removed component route.
7. **Accessibility** — `a11y.spec.ts` must stay green. The merged Collapsible is still
   `<details>`/`<summary>`, so nothing about its semantics changes; if axe reports something new,
   the merge broke markup rather than styling.
8. **Full gate** — `pnpm qa`.

```bash
pnpm qa
```

## Acceptance

- `packages/components/src/css/disclosure.css` does not exist; no registry entry, generated file,
  example, story, or doc page mentions `ui-disclosure` or `.ui-disclosure`.
- A compact `.ui-collapsible` renders a measurably shorter trigger than a default one, and the
  merged stylesheet declares its custom properties on the root, not on `> summary`.
- `.ui-collapsible > summary` uses `cursor: default`.
- `data-ui-variant="panel"` and `="plain"` both render, are both declared in the registry, and are
  both selected by the stylesheet.
- An exclusive accordion works from `<details name>` alone with scripting disabled, is documented,
  and is covered by an E2E test.
- `listVariants` is `['plain', 'divided', 'inset']`. No CSS selects `ordered`; no example or story
  uses it; `<ol class="ui-list">` still shows its markers.
- `choice-group` has no catalog entry, the `choiceGroup` and `choice` contracts survive,
  `choice-group.css` is still referenced by an example, and no page tells a consumer to choose
  between a CSS version and a JavaScript version of the same component.
- Tooltip has its own reference page generated from its own contract, and its surface does not
  scroll, does not reserve viewport height, is narrower than the Hover Card surface, and is visibly
  distinct from it in a side-by-side story.
- Exactly one definition of `supportsNativePopover` and one of `supportsNativeDialog` exist in
  `packages/components/src`, and every fallback unit test passes unchanged.
- A published reference page names every component Timeless will not ship and why, records Date
  Picker as deferred rather than refused, and is linked from the components index and `README.md`.
- Registry-count reduction is recorded in `RESULTS.md` as a measured before-and-after, not
  estimated.
- `pnpm qa` is green.

---

Generated by Claude Opus 5 - High reasoning
