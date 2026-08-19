# Milestone 021 Results

## Baseline

Measured on branch `main` at commit `97761b1` before any work, by reading the files directly.

| Measure                        | Value                                                                                               |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| Registry contracts             | 53 (`components` export in `component-registry.mjs`)                                                |
| Documented components          | 43 (catalog entries carrying a `group`)                                                             |
| Stylesheets in `src/css`       | 38                                                                                                  |
| `disclosure.css`               | 98 lines                                                                                            |
| `collapsible.css`              | 104 lines                                                                                           |
| `list.css`                     | 69 lines                                                                                            |
| `choice-group.css`             | 37 lines                                                                                            |
| `supportsNativePopover` copies | 5 (`combobox.ts:415`, `hover-card.ts:360`, `menu-button.ts:279`, `popover.ts:241`, `select.ts:454`) |
| `supportsNativeDialog` copies  | 2 (`dialog.ts:252`, `sheet.ts:350`)                                                                 |

Comparison figures the plan rests on: Base UI documents 37 components, shadcn/ui 64. Neither ships a
colour picker, colour swatch, gamut clamping, or WCAG contrast evaluation.

### Defects found while measuring, not while implementing

1. **`.ui-disclosure[data-ui-density='compact']` is inert.** `disclosure.css:10-13` sets
   `--ui-disclosure-trigger-min-block-size` and `--ui-disclosure-trigger-padding-block` on the root;
   `disclosure.css:15-17` re-declares both on `> summary`, and the summary's own declaration shadows
   the inherited value. `.ui-collapsible` declares the equivalents on the root
   (`collapsible.css:4-9`) and is unaffected.
2. **`contracts:validate` cannot catch it.** The gate proves a declared value is _selected_ by some
   rule. `compact` is selected at `disclosure.css:10`. It does not prove the rule's declarations
   survive the cascade. Recorded here because it bounds what the gate can be trusted for.
3. **`.ui-disclosure > summary` uses `cursor: pointer`**, against DESIGN.md's "cursor remains
   `default`". `.ui-collapsible` uses `cursor: default`.
4. **`data-ui-variant="ordered"` on `.ui-list` is inert in the case the registry documents.** Its
   only appearance in `list.css` is the negation at line 15, scoped to `ul.ui-list`. On
   `<ol class="ui-list">` — the use the description endorses — it changes nothing. On
   `<ul class="ui-list">` it restores disc bullets, not numbers.
5. **`box-shadow: var(--ui-shadow-floating)` at `popover.css:55` restates the base value at
   `popover.css:20`.** The tooltip override has no effect.
6. **Tooltip inherits four declarations that are wrong for a tooltip**: `overflow: auto`,
   `overscroll-behavior: contain`, `max-block-size: calc(100dvh - 6rem)`, and `line-height: 1.5`.
7. **`popover.css:128-130` carries an `!important`** whose necessity is unexplained; both competing
   `p` rules resolve to specificity `0-0-1` and the tooltip rule is later in source order.

8. **Only 3 of 53 contracts declare any CSS custom property** — `button` (13), `range` (2), and
   `toaster` (2) — while the stylesheets define many. `collapsible.css:3-9` defines seven,
   `list.css:3-5` three, and `popover.css:46-47` two, none declared. Nothing in `contracts:validate`
   or `manifest:validate` checks it, which is how they drifted. This milestone declares the ones it
   touches; the remaining ~46 contracts need their own pass.

### Not a defect, checked and cleared

- `choice-group.css` is **already** shared. The `checkbox-group` catalog entry loads
  `['tokens.css', 'choice-group.css']`, the same stylesheet the CSS-only Choice Group loads. The
  duplication is in the documentation, not the CSS.
  - **Corrected during implementation.** The two stylesheets are not shared at all:
    `choice-group.css` styles only `ui-radio-group` and `ui-checkbox-group`, and the CSS-only
    `<fieldset>` is styled by `forms.css`. The conclusion still holds — the duplication was in the
    documentation — but not for this reason. See "Decisions and constraints".
- `ElementInternals` custom states **are** in use via core's `setCustomState`
  (`color-picker.ts:501`, `toast.ts:88`), so the AGENTS.md `:state()` rule is live rather than
  aspirational.
- `createId` from `@timelessui/core` **is** used by every element that needs generated ids.

## Platform behavior confirmed before planning

- **`anchor-size()` and CSS anchor positioning are Baseline as of January 2026** (Chrome 125+,
  Firefox 132+, Safari 18.2+). Relevant here only because step 6 restructures the anchor wiring at
  `popover.css:63-69`; the feature was already in use at `combobox.css:29`.
- **`position-area: bottom left` selects the bottom-left corner tile, not a left-aligned edge.**
  Confirmed against the MDN grid model. `bottom span-right` is the aligned-and-spanning form, whose
  logical equivalent is `block-end span-inline-end`. This does not change milestone 021 —
  `popover.css` uses `bottom center`, which is correct for a tooltip and a popover — but it is the
  reason milestone 022 exists, and it is recorded here because both milestones edit `popover.css`.
- **`<details name>` exclusive accordions are supported in all three engines** and were used nowhere
  in this repository. Whether the UA-driven auto-close runs the `::details-content` height
  transition was recorded as a task, not an assumption. It is answered below.

## Measurements taken during implementation

Everything in this section was measured in Chrome 148.0.7778.280, by loading the real stylesheets
into a page and reading computed styles — not inferred from the source.

### The disclosure/collapsible comparison that decided the merge

`disclosure.css` and `collapsible.css` were loaded together and four `<details>` elements rendered:
each root at default and at compact density.

| Measure                   | `.ui-disclosure` | `.ui-disclosure` compact | `.ui-collapsible` | `.ui-collapsible` compact |
| ------------------------- | ---------------- | ------------------------ | ----------------- | ------------------------- |
| `min-block-size`          | 56px             | **56px**                 | 56px              | **44px**                  |
| Rendered summary height   | 80px             | **80px**                 | 80px              | **60px**                  |
| `padding-block`           | 12px             | **12px**                 | 12px              | **8px**                   |
| Panel `padding-block-end` | 16px             | 16px                     | 16px              | 12px                      |
| `gap`                     | 16px             | 16px                     | 16px              | 16px                      |
| `border-block-end`        | 1px `--ui-line`  | 1px `--ui-line`          | 1px `--ui-line`   | 1px `--ui-line`           |
| `font-weight`             | 650              | 650                      | 650               | 650                       |
| `cursor`                  | **pointer**      | pointer                  | **default**       | default                   |

Two things follow, and they decided step 2.

**The compact-density bug is confirmed, not merely diagnosed.** Every measured value is identical
between the two disclosure columns. The plan's cascade analysis was right: the root sets the trigger
custom properties, `> summary` re-declares them, and the summary's own declaration shadows the value
it would otherwise inherit.

**`plain` had no reason to exist.** At default density the two roots agreed on every single measured
property except `cursor`, and disclosure's `pointer` is a DESIGN.md violation rather than a feature.
PLAN.md required this comparison _before_ adding the variant and stated the outcome in advance: "if
the two are visually indistinguishable, `plain` has no reason to exist and the merge is a straight
deletion. That is a better outcome than inventing a difference to justify a variant." So no
`collapsibleVariants` set was added, and `collapsible.css` is byte-for-byte unchanged. This diverges
from the acceptance bullet asserting both `panel` and `plain` render; that bullet was conditional on
a difference existing, and no difference existed. Adding the variant would also have needed invented
CSS to satisfy `contracts:validate`'s "declared value is never selected" check — inventing the
difference the plan forbade, in order to pass a gate.

### `<details name>` and the height transition

Exclusivity works and needs no script: clicking the second summary set `open` on it and cleared
`open` on the first, measured twice, once in an isolated harness and once through the E2E suite with
`javaScriptEnabled: false`.

The transition question has a more useful answer than expected. **Neither** a user toggle **nor** a
UA-driven exclusive close animates the panel height. Sampling
`getComputedStyle(el, '::details-content').blockSize` every 20–25ms across 300ms, the value steps
from `0px` to its full height between two consecutive samples in both cases, with no intermediate
value. The chevron `::after` transform transition _does_ run on both, confirmed through
`getAnimations({subtree: true})` — including on the element the UA closed.

So `name` introduces no asymmetry, which is what the plan asked. But the `::details-content` height
transition at `collapsible.css:79-96` does not appear to run at all in Chrome 148, even though
`::details-content`, `interpolate-size: allow-keywords`, and `transition-behavior: allow-discrete`
all report as supported and `interpolate-size` reads back as applied on the pseudo-element. That is
pre-existing and outside this milestone's scope; it is recorded here as a finding for a later one,
and the documentation added by step 3 claims nothing about panel animation.

### Tooltip against Hover Card, after the restructure

| Measure               | Tooltip                | Hover Card panel        |
| --------------------- | ---------------------- | ----------------------- |
| `max-inline-size`     | 256px (16rem)          | 288px (22rem)           |
| `max-block-size`      | **none**               | capped to the viewport  |
| `overflow`            | **visible**            | auto                    |
| `overscroll-behavior` | auto (unset)           | contain                 |
| `line-height`         | 17.55px (13px × 1.35)  | 24px (16px × 1.5)       |
| `border-radius`       | 8px (`--ui-radius-md`) | 10px (`--ui-radius-lg`) |
| `padding`             | 6px 8px                | 12px                    |
| Rendered surface      | 217 × 32px             | 288 × 54px              |
| Label colour          | matches surface `fg`   | `--ui-fg-muted`         |

### Registry and stylesheet counts

| Measure                                   | Before (`main`) | After  |
| ----------------------------------------- | --------------- | ------ |
| Registry contracts                        | 53              | 53     |
| Registered custom elements                | 18              | **18** |
| Documented components (catalog `group`)   | 43              | 41     |
| Canonical examples                        | 46              | 45     |
| Stylesheets in `src/css`                  | 38              | 37     |
| Contracts declaring a CSS custom property | 3               | 6      |
| `supportsNativePopover` definitions       | 5               | 1      |
| `supportsNativeDialog` definitions        | 2               | 1      |
| `disclosure.css`                          | 98 lines        | gone   |
| `collapsible.css`                         | 104 lines       | 104    |
| `list.css`                                | 69 lines        | 69     |
| `popover.css`                             | 131 lines       | 166    |

The contract count is unchanged rather than reduced: `disclosure` left and `tooltip` arrived. That
is the intended shape — one fewer duplicate root, one more documented component that was previously
undiscoverable under another component's name — and the element count is what this milestone
promised not to grow. `popover.css` grew by 35 lines because the shared base was split into a frame
plus three per-component boxes, with the reasoning written down; the alternative was leaving a
tooltip that inherited a scroll container.

## Answers to the plan's open decisions

**Can the registry declare a contract whose root is a qualified selector? Yes.** A third root kind,
`selector`, was added alongside `class` and `element`, with a `selector()` factory next to `css()`
and `customElement()`. Nothing downstream needed reworking, which is the evidence the shape was
right: `publicClassRoots` in both validators already filters on `kind === 'class'` and so ignores
it; `createAttributeHelper` filters the same way, correctly, since `uiAttributes` spreads a class
and a selector is not one; the manifest only emits declarations for `kind === 'custom-element'`, so
`custom-elements.json` is untouched and still describes 18 elements; and `validate-contracts.mjs`'s
requirement that the root string appear literally in the stylesheet is satisfied by writing the
selector in `popover.css` in exactly the declared form. One line was added to the generated
`ComponentRoot` union. The fallback was not needed and no `ui-tooltip` element exists.

**How much of the disclosure look survives as `plain`? None.** See the measurement table above.

**Does `list-style-position: inside` still earn its place? Yes.** Verified on the rendered List
story: `<ol class="ui-list">` computes `list-style-type: decimal` and `list-style-position: inside`,
and its markers render flush with the list's left edge. The list sets `padding: 0`, so an `outside`
marker would be laid out in a zero-width padding area and hang outside the box. `inside` is what
keeps `<ol>` markers visible, and it now applies to nothing else, since `<ul>` never shows markers.

## Decisions and constraints

**The two `supportsNativeDialog` copies were not identical, so "lifted verbatim" was impossible.**
`sheet.ts` probed `show`, `showModal`, and `close`; `dialog.ts` probed `showModal` alone. The
surviving probe is the stricter one, because a non-modal sheet opens with `show()` and every close
path calls `close()` — a partial implementation would pass a `showModal`-only check and then fail at
the call site. No test constructs a window with partial dialog support, and every existing
`supportsDialog: false` fallback test passes unchanged, which is the evidence the change is inert in
practice.

**`supportsInvokerCommands` moved but kept its module.** Milestone 020 exports it from
`src/index.ts`, so it is public, and AGENTS.md forbids a public export changing module. The
implementation lives in `capabilities.ts` and `invoker.ts` re-exports it. `authoredCommand`,
`hasAuthoredCommand`, `commandFromEvent`, `commandSource`, `isOpenedByToggle`, and the command-name
constants are invoker-specific and stayed.

**The capability probes are not exported from `src/index.ts`.** They are internal, and publishing
them would take on a support surface this milestone has no reason to own. `exports:validate` is
green either way.

**`choice-group.css` and `forms.css` were never duplicates, so the plan's fifth finding is wrong on
its facts while right on its conclusion.** `choice-group.css` styles `ui-radio-group` and
`ui-checkbox-group` — the custom elements — and contains no `.ui-choice-group` selector at all. The
CSS-only `<fieldset>` is styled by `forms.css`, which is what the `choiceGroup` and `choice`
contracts declare. The duplication was purely in the documentation: three pages, with reciprocal
`guidance` telling a consumer to choose between "the CSS one" and "the JavaScript one", which is an
implementation detail presented as an API choice. Removing the third page still fixes that.

**Deleting the `choice-group` entry orphaned two contracts, which the plan did not anticipate.** It
was the only page documenting `checkbox` and `radio`. Both surviving pages now document the CSS-only
fieldset in their own flavour — `checkbox-group` takes `choiceGroup`, `choice`, and `checkbox`;
`radio-group` takes `choiceGroup`, `choice`, and `radio` — and each renders the enhanced element
next to the plain `<fieldset>`, so the no-JavaScript story is shown rather than described. Both load
`forms.css` alongside `choice-group.css`.

**The `!important` at `popover.css:128` was not what the plan thought, and the fix belonged
elsewhere.** The plan's specificity arithmetic was correct — both competing `p` rules resolve to
`0-0-1` and the tooltip rule was later in source order, so it already won — but that was not what
the `!important` was for. It was defending against the stories' own demo stylesheet.
`apps/stories/src/stories/styles.css` declares `@layer ui.showcase`, which is absent from the
`@layer ui.tokens, ui.components, ui.utilities` order that `tokens.css` establishes, so it is
appended last and outranks `ui.components` on **layer order**, before specificity is ever consulted.
Its `.ui-demo-page p:not([data-ui-part])` rule reached into overlay surfaces and painted the tooltip
label `--ui-fg-muted` against its inverted background. No specificity change in `popover.css` could
have won that; only `!important` could. So the component no longer carries it — an `!important` in a
component stylesheet also blocks the consumer restyling that AGENTS.md requires — and the demo rule
now excludes `:where([popover], dialog, ui-toast) *`, which is where the bug actually was. The
existing `expectReadableSurface(tooltip, 4.5)` contrast assertion in `overlays.spec.ts` guards the
outcome and passes.

**"Declare no `overflow`" would not have stopped the tooltip scrolling.** The UA stylesheet gives
every `[popover]` `overflow: auto`, verified by measuring a bare `<div popover>` (`auto`) against a
bare `<div>` (`visible`). The tooltip therefore declares `overflow: visible` explicitly, which is
safe because it declares no `max-block-size` and so cannot clip.

**Tooltip's box is scoped out of the panel rule, not layered over it.** The panel rule carries
`:not([variant='tooltip'])` so the tooltip never picks up `overflow`, `overscroll-behavior`,
`max-block-size`, or the panel's leading and then has to override them back. The same exclusion is
applied to the heading and paragraph rules, which is what let the `!important` rule go.

**The Tooltip page documents only the `tooltip` contract.** Listing `hoverCard` beside it rendered
the anatomy table and the Tooltip APG section twice, since both contracts declare `trigger` and
`content` and both name the tooltip pattern. The catalog type's own documented rule settles it — "a
Popover page never presents Hover Card's attributes as its own" — so the shared host attributes are
documented once, on Hover Card, and the Tooltip guidance links there. One consequence: the Element
API note "Reflects the `x` attribute, documented above" was untrue on a page with no attribute
table, so it is now conditional.

**`ordered` is a breaking type change.** `ListVariant` is a public export from
`packages/components/src/values/primitives.ts` and narrows from four members to three. This is
permitted only because the package is unpublished. `createList` in `packages/examples` gained an
`ordered?: boolean` prop, because choosing `<ol>` over `<ul>` is the element's job and never an
attribute's — which is also the new registry description.

**`data-ui-variant="ordered"` removal does not change any `<ol>`.** The deleted rule was
`ul.ui-list:where(:not([data-ui-variant='ordered'])) { list-style: none }`, whose `ul` type selector
never matched an `<ol>`. Its replacement, `ul.ui-list { list-style: none }`, is the same rule with
the dead exception removed.

**No validator was added for the boundary page.** It is prose about intent, and a gate over it would
encode today's list as a rule. `pnpm build` does prove its internal links, since a broken
`/docs/components/<id>/` reference would 404 in the built site; Table, Separator, Combobox, Dialog,
and Field were each confirmed present in `dist`.

**`.agents/research/library-comparison.md` keeps its stale counts.** It carries `date: 2026-08-19`
frontmatter and is the study this milestone was planned from. Rewriting its numbers to match today
would destroy the baseline it exists to record, the same convention milestone documents follow.

## Deferred to a later milestone

- **47 of 53 contracts still declare no CSS custom property** while their stylesheets define many.
  This milestone declared the three it touched — `collapsible` (7), `list` (3), and `tooltip` (2) —
  taking the total from 3 contracts to 6. Nothing in `contracts:validate` or `manifest:validate`
  checks this, which is how it drifted; a gate is the obvious companion to finishing the sweep.
- **`contracts:validate` proves a declared value is _selected_, not that the selecting rule has any
  effect.** `compact` was selected at `disclosure.css:10` by a rule whose declarations were then
  shadowed, so the gate passed on a value that did nothing. This bounds what the validator can be
  trusted for. The E2E assertion added in step 2 is the pattern that catches it, but only per
  component.
- **The `::details-content` height transition does not run in Chrome 148**, for user toggles or
  UA-driven closes. Measured, not inferred. See above.
- **`pnpm format` intermittently corrupts `vscode.css-custom-data.json`.** Hit while committing this
  milestone and then reproduced: `oxfmt --write .` (0.63.0) sometimes strips the leading `--` from
  every custom-property name in that file, turning `"--ui-bg-page"` into `"ui-bg-page"` and breaking
  the editor completion data the file exists to provide. It is non-deterministic — three consecutive
  `pnpm format` runs over an unchanged tree produced correct output twice and corrupt output once —
  which is why it has gone unnoticed. `pnpm -F @timelessui/components run generate` is deterministic
  across five runs, so the generator is not the source; the formatter pass over the
  already-generated file is. The same runs leave stray `apps/web/test.css` and
  `packages/examples/test.html` files behind, which points at the same tool writing to paths it
  should not.

  Nothing corrupt was committed: every commit on this branch carries the correct dashed form,
  checked individually. `generate:check` does not reliably catch it, because it compares the file
  against a generator run inside the same formatter, so both sides can be wrong together. This is
  pre-existing and unrelated to milestone 021's changes, but it can silently corrupt a published
  artifact in any commit where `pnpm format` runs, so it needs its own fix — most likely excluding
  generated JSON from `oxfmt` or upgrading it.

## Summary

Seven copies of two feature-detect functions became one `capabilities.ts`, with the stricter dialog
probe surviving and `supportsInvokerCommands` re-exported from `invoker.ts` to keep its public
module.

Disclosure was deleted rather than merged. Measurement showed it was pixel-identical to Collapsible
at default density, that its compact density was inert, and that its only distinguishing declaration
was a `cursor: pointer` DESIGN.md forbids. The planned `plain` variant was dropped because the
comparison the plan demanded first showed there was nothing to preserve. Collapsible's contract now
declares its seven CSS custom properties and documents `<details name>` for exclusive accordions —
platform behavior the repository was not using anywhere, now covered by an E2E test that runs with
scripting off.

`data-ui-variant="ordered"` is gone from `.ui-list`: it was inert on the `<ol>` the docs endorsed
and produced disc bullets rather than numbers on a `<ul>`. Choice Group stopped being a third page
for a need two other pages already covered, and both survivors now show the plain `<fieldset>`
beside the coordinated element instead of sending readers to pick an implementation.

Tooltip got its own contract at the qualified root `ui-hover-card[variant='tooltip']`, which needed
a new `selector` root kind and no second custom element, and a box that suits a label rather than
the scrolling panel it used to inherit. Investigating its `!important` found a cascade-layer bug in
the stories' demo stylesheet, fixed there rather than papered over in the component.

The boundary is published at `/docs/reference/scope/`, grouped by reason, with Date Picker recorded
as deferred.

## Validation results

`pnpm qa` green: typecheck, `format:check`, build, unit tests, `publint`, `attw`, and e2e.

| Gate                                      | Result                                                      |
| ----------------------------------------- | ----------------------------------------------------------- |
| `pnpm typecheck`                          | 6 projects, 0 errors                                        |
| `pnpm format:check`                       | clean                                                       |
| `contracts:validate`                      | 53 contracts, 18 elements, 186 attribute values, 58 tokens  |
| `manifest:validate`                       | 18 elements                                                 |
| `generate:check`                          | clean                                                       |
| `exports:validate`                        | clean                                                       |
| `pnpm -F @timelessui/components run test` | 33 files, 160 tests                                         |
| `pnpm -F @timelessui/examples run test`   | 45 canonical examples                                       |
| `apps/web` doc validators                 | 45 examples, 18 elements, 36 CSS exports, 6 platform claims |
| `pnpm test:e2e`                           | 298 passed, including axe across 89 story routes            |

Three tests were updated because the change made them stale, each a deliberate assertion rather than
a mechanical fix:

- `contracts.test.ts` asserted `isComponentName('tooltip') === false`. It now asserts the opposite,
  checks the qualified root, and uses `'disclosure'` as the negative case.
- `primitives.test.ts` asserted `isListVariant('ordered') === true`. It now asserts `false`, with
  `'divided'` covering the positive case.
- `smoke.test.ts` asserted the Disclosure story rendered `<details class="ui-disclosure"`. Removed
  with the story.

---

Generated by Claude Opus 5 - High reasoning

Implemented by Claude Opus 5 - High reasoning
