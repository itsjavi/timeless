# Milestone 028 Tasks

## 0. Baseline, measured before any change

- [x] Confirm 43 stylesheets in `packages/components/src/css/`, and that `components.css` imports 42
- [x] Confirm zero stylesheets carry rules outside a `@layer` block, and zero `!important`
- [x] Classify every CSS declaration by property and record the five-way split
- [x] Establish the behavior-critical subset at 271 declarations across 41 files, with the
      per-property breakdown
- [x] Confirm the split runs _within_ rule blocks, not between them, using `listbox.css` as the case
- [x] Confirm a cascade layer cannot express the separation, so splitting by file is forced
- [x] Confirm 7 contracts name `floating.css` and 0 name `tokens.css`
- [x] Record `tokens.css` at 93 lines with 26 `light-dark()` values
- [x] Record the four measured CSS gzip figures as the before numbers

## 1. Split `tokens.css`

- [x] Move the token values out of `tokens.css` into `theme-atmosphere.css`
- [x] Leave `tokens.css` holding the `@layer ui.tokens, ui.components, ui.utilities;` statement and
      `color-scheme: light dark`
- [x] Confirm `tokens.css` contains no `light-dark()` call and no colour, radius, shadow, space,
      type, or motion value
- [x] Point `validate-contracts.mjs` at `theme-atmosphere.css` for the token contract, and add the
      assertion that `tokens.css` declares no token value and still carries the layer statement
- [x] Confirm both new assertions fail when violated, not just pass when satisfied
- [x] Confirm `components.css` imports `tokens.css` then `theme-atmosphere.css`, in that order
- [x] Verify in a browser that importing `tokens.css` alone still establishes the layer order, by
      confirming a single consumer class still beats a component rule
- [x] Separate the two mechanisms that verification conflates, and record which one the layer
      statement is actually responsible for
- [x] Verify `color-scheme` in `tokens.css` is load-bearing, by confirming `light-dark()` resolves
      to the wrong branch without it
- [x] Add `theme-atmosphere.css` to every example's `styles`, and to the StoryLite shared CSS
      arrays, so previews still render Atmosphere
- [x] Point `TokenTable.astro` and `stylingFor` at the split files

## 2. Extract core for the anchored surfaces

- [x] Fix the three gates that listed `src/css` non-recursively or keyed it by basename, before any
      file existed under `core/`: `preview-styles.ts`, `validate-docs.mjs`, `examples/validate.mjs`
- [x] Create `src/css/core/` and `src/css/core.css` importing every file in it
- [x] Extract `floating.css` wholesale into `core/floating.css`: `anchor-name`, `position-anchor`,
      the `@supports (anchor-name: --ui-anchor)` block, `position-try-fallbacks`, and the fallback
      branch
- [x] Retire `src/css/floating.css` entirely — nothing cosmetic was left in it — and repoint the 7
      contracts, 10 examples, 5 story bundles, and 3 doc snippets that named it
- [x] Determine whether the fallback branch can beat each component's `@supports not` default by
      layer order alone, removing the reliance on `:popover-open` specificity
- [x] Record that determination in RESULTS.md whether or not the hack can be removed
- [x] Extract core for `popover`, `menu`, `context-menu`, `select`, `combobox`, `listbox`,
      `options`, `sheet`, and `toast`
- [x] Confirm each extracted rule keeps its original selector verbatim, so the theme rule and the
      core rule remain co-selectored
- [x] Verify each anchored surface opens, anchors, and is operable with only `core.css` and
      `tokens.css` loaded — Select, Menu Button, and Sheet checked
- [x] Fix the `min-inline-size` cascade inversion the split introduced, and gate the class of bug
      that caused it
- [x] Verify collision flipping and light dismiss core-only — asserted in the phase 5 spec

## 3. Extract core for the remainder

- [x] Extract core for the form surfaces: `forms`, `form`, `range`, `range-field`, `otp-field`,
      `number-stepper`, `choice-groups`
- [x] Extract core for the remaining components with behavior-critical declarations — 40 core
      stylesheets in total
- [x] Retire `src/css/form.css`, which held nothing but `display: contents`
- [x] Let the `css()` registry factory accept a stylesheet list, as the two element factories
      already did, so a CSS-only component can name both halves
- [x] Confirm `components.css` and `link.css` need no core file
- [x] Confirm every one of the 271 behavior-critical declarations is either in a core file or
      deliberately left in the theme, with the reason recorded for each exception — 255 in core, 15
      in the theme, all fifteen enumerated in RESULTS.md
- [x] Give the gate the two exemptions the extraction actually needs, and print the explicit count
      so it cannot grow quietly
- [x] Decide whether the four unlayered `@media (forced-colors: active)` blocks are intentional —
      they are not — move all seven inside `@layer ui.components`, and confirm the forced-colors
      rendering is unchanged under real emulation
- [x] Gate it: prove every declaration in every stylesheet sits inside a cascade layer, correcting
      the baseline's "0 rules outside a `@layer` block" from wrong to enforced

## 4. Prove the boundary mechanically

- [x] Add a check that fails when a core stylesheet declares `color`, `background`, `border-color`,
      `box-shadow`, `font`, any type property, `letter-spacing`, `transition`, `animation`,
      `opacity`, `filter`, or `border-radius`
- [x] Extend it to forbid sizing in core, which is where the one real extraction bug came from
- [x] Extend it with the inverse boundary: a theme file whose component has a core file may not
      declare a core-owned property, so a partial extraction fails instead of passing quietly
- [x] Confirm all four rules fail when violated and permit the honest cases, `@keyframes` included
- [x] Confirm the check runs inside `pnpm qa` rather than only in CI — it is in the package `build`
- [x] Confirm every core stylesheet either reads no token or carries a literal fallback for each
      token it reads
- [x] Add each core stylesheet to the `css` array of every contract that needs it — all 58 contracts
- [x] Run `pnpm -F @timelessui/components run contracts:validate` and confirm both directions pass
- [x] Add each core stylesheet to the relevant example `styles`, derived from the contracts each
      example documents rather than by hand
- [x] Add each core stylesheet to the StoryLite CSS bundles that render its component

## 4b. Restructure the stylesheets by tier

- [x] Move the 39 component cosmetic stylesheets and `theme-atmosphere.css` under
      `themes/atmosphere/`, as pure renames with no content change
- [x] Add `themes/atmosphere.css`, mirroring how `core.css` aggregates `core/`
- [x] Make `themes/atmosphere.css` the full entry — the required tiers plus its own 40 files — and
      delete `components.css`, so no import silently picks a theme and a second theme is a sibling
      of the same shape
- [x] Repoint the registry, examples, story bundles, doc snippets, `TokenTable`, `stylingFor`, and
      the two boundary validators
- [x] Fix the dangling `@import './form.css'` that phase 3 shipped, and gate every `@import` in the
      package so it cannot recur
- [x] Re-baseline the size gate for the moved paths

## 5. Verify core-only rendering

- [x] Build a fixture that loads `tokens.css` and every core stylesheet and no theme CSS —
      `apps/e2e/tests/apps/web/core-only.spec.ts`, reading the CSS in Node because the
      `web-chromium` project runs against a production build
- [x] Verify no custom-element host has collapsed to `display: inline` — asserted across all 51
      previews, zero found
- [x] Verify every scroll container still scrolls, and `overscroll-behavior` still contains
- [x] Verify filtered options stay hidden in Listbox, Select, and Combobox
- [x] Verify Dialog and Sheet still reach the top layer, trap focus, and close on Escape
- [x] Verify Toast still stacks and places, and that the region stays clickable through
- [x] Verify every anchored surface positions correctly — Popover, Hover Card, Select, Combobox,
      Menu Button
- [x] Verify dropping `core.css` too leaves components functional but unpositioned, with no console
      error and no hang
- [x] Run the axe sweep against the core-only fixture, as a relative assertion: core-only must add
      no violation the themed rendering does not already have
- [x] File the pre-existing `aria-activedescendant` violation that sweep surfaced, rather than
      masking it

## 6. Document the three tiers

- [x] Rewrite `docs/styling/css.mdx` to state required core, required tokens, optional theme, with
      the tier table up front
- [x] Rewrite `docs/styling/theming.mdx` to the same three tiers, replacing "Styling without
      Timeless CSS" with "Styling without the Atmosphere theme"
- [x] Document the bring-your-own-theme path: `tokens.css` + `core.css` and nothing else
- [x] Name Tailwind explicitly, and say that with v4 Timeless must be imported first
- [x] Say plainly that a cosmetic utility can never lose to core, and that a build check proves it
- [x] Say that sizing stays in the theme, so a Sheet is content-height core-only
- [x] Remove every claim that CSS is fully optional
- [x] Gate it: `validate-docs.mjs` now fails on five phrasings of the claim, and permits the honest
      neighbours — proven both ways
- [x] Reconcile `AGENTS.md:57` and `audit-component-contracts/SKILL.md` rule 8 to say "the
      Atmosphere theme" where they meant it
- [x] Confirm every component page's **Styling** section lists its core stylesheet
- [x] State plainly that the component stylesheets and the theme's tokens are Atmosphere's cosmetics
      and can be replaced wholesale

## 7. Re-baseline and close out

- [x] Re-baseline `performance-baselines.json` with `performance:check -- --measure`, recording the
      CSS figures before and after
- [x] Confirm the core-only CSS payload is materially smaller than the full per-component figures —
      39% to 45% of the gzipped bytes
- [x] Run `pnpm qa` and record what it said
- [x] Run the docs-drift sweep and fix what it found: `DESIGN.md` pointed at `tokens.css` for token
      values, and the generated authoring grammar named only `tokens.css` as required
- [x] Update the README to describe the three tiers and the gates that prove the boundary
- [x] Set `PLAN.md` status to `Implemented`
- [x] Record decisions, trade-offs, and results in RESULTS.md

---

Generated by Claude Opus 5 (High)
