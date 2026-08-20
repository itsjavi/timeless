# Milestone 029 Tasks

## 0. Baseline, measured before any change

- [x] Confirm 6 public exports carry the `Atmosphere` name, all from `src/tokens.ts`
- [x] Confirm 58 `Atmosphere` occurrences in the generated `vscode.css-custom-data.json`
- [x] Confirm `componentContracts` is imported by exactly `attributes.ts`, `index.ts`, and
      `validate.ts`, and by no behavior module
- [x] Confirm `isTypeaheadEvent` is defined in `listbox.ts`, `menu.ts`, and `select.ts`, and that
      only `findOptionByPrefix` is shared
- [x] Confirm `performance:check` covers exactly `popover`, `listbox`, `select`, and `combobox`, and
      record the four bundle baselines
- [x] Confirm `color-api.ts` is a pure barrel of `color.ts` and `contrast.ts`
- [x] Confirm `contrast.ts` imports only from `color.ts`, and `color-picker.ts` imports from
      `./color` at exactly one site
- [x] Confirm zero consumer-facing Tailwind guidance exists
- [x] Investigate the reported export aliases and establish they are not aliases: `choice-group.ts`
      defines two elements, `toast.ts` defines two elements, and `check-exports.mjs:12` requires a
      class entry point per element with those three tags carved out

## 1. Rename the token exports off the theme

- [x] Rename the six exports to `uiTokenGroups`, `uiTokens`, `isUIToken`, `UIToken`, `UITokenGroup`,
      and `UITokenName`
- [x] Record why the rename is permissible: the package is unpublished at `0.0.1`, against the
      `AGENTS.md` rule that a public export never changes name or module
- [x] Update the text parser in `generate-elements.mjs` that reads `src/tokens.ts` expecting
      `atmosphereTokenGroups = { ... } as const`
- [x] Update `emit-editor-data.mjs` and `validate-contracts.mjs` for the new name
- [x] Regenerate and confirm the 58 occurrences in `vscode.css-custom-data.json` are replaced
      without hand-editing
- [x] Update `src/index.ts`, `apps/web/src/lib/component-docs.ts`, `TokenTable.astro`, and
      `[slug].astro`
- [x] Update `docs/styling/theming.mdx:65` and `docs/reference/packages.mdx:86-87`
- [x] Confirm no story references the old name — none did; the four suspected story hits were the
      theme's CSS paths, not the exports
- [x] Confirm `Atmosphere` still names the theme in `DESIGN.md` and still describes the token values
- [x] Confirm no remaining `Atmosphere` occurrence sits on a public export
- [x] Run `generate:check` and `typecheck`

## 2. Extract `@timelessui/color`

- [x] Create `packages/color` with `@timelessui/color` as its name
- [x] Move `color.ts`, `contrast.ts`, and `color.test.ts` into it
- [x] Make the new package's index the export surface `color-api.ts` currently provides
- [x] Add `@timelessui/color` as a dependency of `@timelessui/components`
- [x] Repoint the single `./color` import in `color-picker.ts`
- [x] Confirm `color-picker.ts`, `color-picker.test.ts`, `color-picker.css`, and `color-swatch.css`
      stay in `components`
- [x] Decide whether `@timelessui/components` keeps a `./color` re-export or consumers import the
      new package directly, and record the reason — the subpath is gone
- [x] Extend `check-boundaries.mjs` so `@timelessui/color` cannot depend on `components` or `core`
- [x] Run `pnpm boundaries:check`
- [x] Run `exports:validate`, `publint`, and `attw` on both packages
- [x] Confirm the colour unit tests pass in their new home
- [x] Amend `docs/reference/scope.mdx` to state that a colour primitive is in scope while a colour
      model is a library, so the page no longer implies Colour Picker is the inconsistency
- [x] Update `docs/reference/packages.mdx` for the new package
- [x] Confirm `README.md`'s colour sentence still matches where the code lives

## 3. Stop shipping the contract registry to the browser

- [x] Extend `generate-elements.mjs` to emit `attributes.ts` with per-component defaults inlined
- [x] Confirm `attributes.ts` no longer imports `componentContracts`
- [x] Confirm `uiAttributes()` and `uiAttributeString()` behavior is unchanged, defaults included
- [x] Run `generate:check` and confirm no stale-file failure
- [x] Measure the gzip delta for an entry importing `uiAttributes`, and record before and after —
      19,328 → 1,573 gzip, 109,958 → 5,269 raw
- [x] Confirm `validate.ts` still has the contract record it needs

## 4. One typeahead state machine

- [x] Lift `isTypeaheadEvent` into `collection.ts` or `options.ts` as a single definition — it went
      to `collection.ts` as `isCollectionTypeaheadEvent`, since Menu is not an option surface
- [x] Lift the `#typeahead` buffer, the `#typeaheadTimer`, and the module-level timer fallback into
      that module as one state machine with policy hooks
- [x] Confirm `listbox.ts` and `select.ts` define neither the predicate nor the buffer
- [x] Confirm `menu.ts` consumes the shared predicate while keeping its own key-handling policy
- [x] Confirm Select still selects without opening on a printable character when closed
- [x] Confirm Listbox typeahead behavior is unchanged
- [x] Confirm the debounce window is declared once
- [x] Run `pnpm -F @timelessui/components run test`
- [x] Run `pnpm test:e2e` and confirm the collection and menu specs pass — 29 passed, including a
      new Select typeahead-policy test
- [x] Run the axe sweep in `apps/e2e/tests/apps/stories/a11y.spec.ts`

## 5. Account for the bundle weight

- [x] Produce a per-module gzip attribution for the Select graph, naming which of the nine modules
      carries the weight — the Listbox chunk at 37% and `select.js` at 32%
- [x] Do the same for Combobox, and record whether the two share the same hot spot — they share it,
      and they share the chunk itself
- [x] Decide whether to reduce or to document the figure, based on that attribution — documented;
      minified, Select is 13.5KB rather than 30KB
- [x] Extend `performance-baselines.json` to at least one entry per component family, or narrow the
      `performance:check` row in `.agents/reference/validators.md` to the collection family — every
      element module is covered, 4 entries to 20
- [x] Re-baseline with `performance:check -- --measure` only after milestone 028 has landed, so the
      CSS figures are stable
- [x] Record before and after

## 6. Utility CSS and Tailwind

- [x] Write `docs/styling/utility-css.mdx`
- [x] Author the centrepiece example: a Popover with a button trigger, importing the core layer and
      no theme CSS, styled entirely in Tailwind utilities
- [x] Include the full import block in the order that makes utilities win
- [x] Include the host display, the trigger, the anchored surface, and a `:state()` or `aria-*`
      variant doing real work
- [x] Paste the snippet into a running app and confirm it renders, anchors, opens, and
      light-dismisses before publishing it
- [x] Verify in a browser that the inverted import order makes Timeless outrank every utility,
      before documenting it as the failure mode
- [x] Verify that a `display` utility on an option row reintroduces filtered options, and publish
      the one-line fix — it does not under Tailwind's Preflight, which carries
      `[hidden] { display: none !important }`; it does without Preflight, and the fix is
      `not-[[hidden]]:flex`
- [x] Document that `:state()` has no Tailwind variant, and show the arbitrary-variant form
- [x] Point at the core layer for host display rather than telling consumers to hand-write it
- [x] Confirm the page appears in the Styling sidebar group, and cross-link from `css.mdx` and
      `theming.mdx`

## 7. Close out

- [ ] Run `pnpm qa` and record what it said
- [ ] Run `audit-docs-drift` and confirm no prose still implies the tokens belong to Atmosphere, and
      none still places the generic colour functions in `components`
- [ ] Confirm `apps/web/scripts/validate-claims.mjs` needs no change, or update it
- [ ] Record decisions, trade-offs, and results in RESULTS.md

---

Generated by Claude Opus 5 (High)
