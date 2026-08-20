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

- [ ] Create `src/css/core/` and `src/css/core.css` importing every file in it
- [ ] Extract `floating.css` wholesale into `core/floating.css`: `anchor-name`, `position-anchor`,
      the `@supports (anchor-name: --ui-anchor)` block, `position-try-fallbacks`, and the fallback
      branch
- [ ] Determine whether the fallback branch can beat each component's `@supports not` default by
      layer order alone, removing the reliance on `:popover-open` specificity
- [ ] Record that determination in RESULTS.md whether or not the hack can be removed
- [ ] Extract core for `popover`, `menu`, `context-menu`, `select`, `combobox`, `listbox`,
      `options`, `sheet`, and `toast`
- [ ] Confirm each extracted rule keeps its original selector verbatim, so the theme rule and the
      core rule remain co-selectored
- [ ] Verify each anchored surface opens, anchors, flips on collision, and light-dismisses with only
      `core.css` and `tokens.css` loaded

## 3. Extract core for the remainder

- [ ] Extract core for the form surfaces: `forms`, `form`, `range`, `range-field`, `otp-field`,
      `number-stepper`, `choice-groups`
- [ ] Extract core for the remaining components with behavior-critical declarations
- [ ] Confirm `components.css` and `link.css` need no core file
- [ ] Confirm every one of the 271 behavior-critical declarations is either in a core file or
      deliberately left in the theme, with the reason recorded for each exception

## 4. Prove the boundary mechanically

- [ ] Add a check that fails when a core stylesheet declares `color`, `background`, `border-color`,
      `box-shadow`, `font`, any type property, `letter-spacing`, `transition`, `animation`,
      `opacity`, `filter`, or `border-radius`
- [ ] Confirm the check runs inside `pnpm qa` rather than only in CI
- [ ] Confirm every core stylesheet either reads no token or carries a literal fallback for each
      token it reads
- [ ] Add each core stylesheet to the `css` array of every contract that needs it
- [ ] Run `pnpm -F @timelessui/components run contracts:validate` and confirm both directions pass
- [ ] Add each core stylesheet to the relevant example `styles`

## 5. Verify core-only rendering

- [ ] Build a StoryLite or e2e fixture that loads `core.css` and `tokens.css` and no theme CSS
- [ ] Verify no custom-element host has collapsed to `display: inline`
- [ ] Verify every scroll container still scrolls, and `overscroll-behavior` still contains
- [ ] Verify filtered options stay hidden in Listbox, Select, and Combobox
- [ ] Verify Dialog and Sheet still reach the top layer, trap focus, and close on Escape
- [ ] Verify Toast still stacks and places
- [ ] Verify every anchored surface positions correctly
- [ ] Verify dropping `core.css` too leaves components functional but unpositioned, with no console
      error and no hang
- [ ] Run the axe sweep against the core-only fixture

## 6. Document the three tiers

- [ ] Rewrite `docs/styling/css.mdx:47-51` to state required core, required tokens, optional theme
- [ ] Rewrite `docs/styling/theming.mdx:155-157` to the same three tiers
- [ ] Remove every claim that CSS is fully optional
- [ ] Confirm every component page's **Styling** section lists its core stylesheet
- [ ] State plainly that the component stylesheets and `theme-atmosphere.css` are Atmosphere's
      cosmetics and can be replaced wholesale

## 7. Re-baseline and close out

- [ ] Re-baseline `performance-baselines.json` with `performance:check -- --measure`, recording the
      CSS figures before and after
- [ ] Confirm the core-only CSS payload is materially smaller than the current per-component figures
- [ ] Run `pnpm qa` and record what it said
- [ ] Run `audit-docs-drift` and confirm no prose still describes CSS as fully optional
- [ ] Record decisions, trade-offs, and results in RESULTS.md

---

Generated by Claude Opus 5 (High)
