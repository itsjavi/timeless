# Milestone 023 Tasks

Depends on milestone 022 for the first form-association implementation and the
`formDisabledCallback` / `formStateRestoreCallback` precedent. Do not start step 3 before 022 lands.

## 1. Native select padding

- [ ] Capture the baseline: screenshot `.ui-select` beside `.ui-input` at `sm`, `md`, and `lg` in
      Chrome, Firefox, and WebKit
- [ ] Split `.ui-select` out of the shared padding rule at `forms.css:83-89`
- [ ] Split it out of the `sm` rule at `forms.css:97-104`
- [ ] Split it out of the `lg` rule at `forms.css:106-113`
- [ ] Measure and choose an inline-end value per size so border-to-glyph and border-to-arrow read
      equal on all three engines
- [ ] Confirm no stylesheet sets `appearance` on `.ui-select`
- [ ] Keep `color-scheme: light dark` at `forms.css:178-180`
- [ ] Add a `nativeSelect` registry description stating the indicator is UA-drawn and its gutter is
      engine-dependent
- [ ] Re-screenshot all three engines and compare against the baseline
- [ ] If any engine still reads wrong, stop and take exit B: `appearance: none`, a declared
      `indicator` part on `nativeSelect` (its `parts` array is empty today), and
      `padding-inline-end: calc(gutter + indicator)`
- [ ] E2E: assert computed `padding-inline-start` differs from `padding-inline-end`

## 2. Choice-group tangle, then a fieldset

- [ ] Confirm firsthand that all `choice-group.css` rules are scoped to
      `:where(ui-radio-group, ui-checkbox-group)` and none matches `.ui-choice-group`
- [ ] Rename `choice-group.css` to match the roots it selects
- [ ] Update the `styles` array of every catalog entry that lists it
- [ ] Update the `@import` in `packages/components/src/css/components.css`
- [ ] Replace the literal `0.6` at `forms.css:210` with `var(--ui-disabled-opacity)`
- [ ] Reconcile the vertical gap: `var(--ui-space-3)` (`forms.css:238`) vs `var(--ui-space-2)`
      (`choice-group.css:4`)
- [ ] Pick one horizontal layout model that handles both orientations, replacing the grid
      (`forms.css:250-254`) / flex-wrap (`choice-group.css:8-13`) split
- [ ] Remove the duplicated accent-color and focus-ring declarations from the group stylesheet
- [ ] Make `forms.css`'s choice anatomy reachable from `ui-checkbox-group` and `ui-radio-group`
- [ ] Add a `fieldset` contract: root `.ui-fieldset`, `legend` part, `data-ui-density`, plus the
      `description` and `error` parts
- [ ] Write real descriptions for every new field
- [ ] Decide the consolidated choice group's root kind, and therefore whether it takes
      `data-ui-orientation` or plain `orientation` — exactly one
- [ ] Confirm `isChoiceGroupOrientation` is still exported from `forms.ts` under the same name
- [ ] `pnpm -F @timelessui/components run generate` then `contracts:validate`

## 3. `ui-form`

- [ ] Extract whatever milestone 022's form association made common into `@timelessui/core`, keeping
      core visual-free
- [ ] Add the `ui-form` element with `setErrors(errorsByFieldName)` and `clearErrors()`
- [ ] Fill the matching authored `[data-ui-part~='error']` element per field
- [ ] Wire `aria-invalid` and `aria-describedby` using `ensureElementId` from core
- [ ] Move focus to the first invalid control
- [ ] Clear a field's custom validity on its next `input` event
- [ ] Resolve how `ui-form` sets validity on a form-associated custom element from 022, whose
      validity is owned by its internals and which has no `setCustomValidity` — most likely by
      delegating to a method on the element. Record the resolution
- [ ] Declare the event and its detail type; check `events.ts` for the naming convention first
- [ ] Confirm `ui-form` writes no visual declarations
- [ ] Test with `ui-select`, `ui-combobox`, and `ui-listbox`

## 4. `ui-range-field`

- [ ] Add the element wrapping two native `input[type=range]`, declared as `from` and `to` parts
      plus an `output` part
- [ ] Clamp so `from <= to`; decide block-crossing versus swap-active-thumb and document it
- [ ] Unit-test the clamp and the crossing behavior
- [ ] Write fill bounds as measured custom properties from JS, following `floating.ts:108-111`; let
      CSS own the rendering
- [ ] Decide the form value shape (two entries under `name`, or `name-from` / `name-to`) and state
      it
- [ ] Reuse `--ui-range-track` and `--ui-range-thumb`; declare any new variable in the registry
- [ ] Confirm `.ui-range` is byte-unchanged
- [ ] Add the full form-associated callback set

## 5. `ui-otp-field`

- [ ] Add the element: `role="group"` host with an accessible name and N native `input` cells as a
      `cell` part
- [ ] Add a `length` attribute, a `value` property joining the cells, and `name`
- [ ] Write `distributeOtpValue(cellCount, text)` as a pure exported helper
- [ ] Unit-test it: full-length paste, over-length paste, paste with spaces and dashes, paste into
      the middle, non-numeric input
- [ ] Implement traversal locally rather than via `collectionNavigationTarget` — cells are each
      tabbable, so there is no roving tabindex
- [ ] Fill advances focus to the next cell
- [ ] `Backspace` on an empty cell moves back and clears
- [ ] Arrows move between cells; `Home` / `End` jump to the ends
- [ ] Handle `paste` on any cell, distributing across all cells — the first `paste` handler in the
      repo
- [ ] Decide whether traversal becomes a new `collection.ts` export; if so, re-export from
      `src/index.ts` and the `./collection` subpath
- [ ] Have the example factory emit `inputmode="numeric"`, `autocomplete="one-time-code"` on the
      first cell only, `maxlength="1"`, and a per-cell `aria-label`
- [ ] Decide the `accessibility()` contract against
      `.agents/skills/verify-apg-conformance/SKILL.md`; there is no APG pattern for OTP, so record
      the reasoning
- [ ] Add the full form-associated callback set

## 6. The add sequence, per new element

For `ui-form`, `ui-range-field`, and `ui-otp-field`:

- [ ] Registry `valueSets` entries, then the `customElement(...)` entry
- [ ] `src/css/<name>.css` in the `ui.components` layer, selecting every declared non-default value
- [ ] `@import` added to `src/css/components.css`
- [ ] `src/<module>.ts` and `src/<module>.test.ts`
- [ ] `pnpm -F @timelessui/components run generate`
- [ ] Re-export generated arrays, unions, and guards from the behavior module
- [ ] Export block added to `src/index.ts`
- [ ] `./<module>` subpath added to `packages/components/package.json` exports
- [ ] Tag appended to the ordered list in `src/define.test.ts`
- [ ] Example factory built with `uiAttributes` / `uiAttributeString`, escaped with `escapeHtml` /
      `escapeAttribute`
- [ ] Catalog entry whose `styles` include every stylesheet of every named contract plus
      `tokens.css`
- [ ] Loader added to `apps/web/src/scripts/preview-runtime.ts`
- [ ] Story with `meta.title = 'Library/<Domain>/<Component>'`, slug matching the catalog domain and
      id
- [ ] Entry added to `apps/stories/src/smoke.test.ts`
- [ ] `pnpm build:stories`, then commit the regenerated `apps/stories/story-routes.json`
- [ ] Update the hardcoded component count in `apps/web/src/content/docs/docs/index.mdx`
- [ ] Confirm every gap value comes from `--ui-space-1..5`; if a token is added, add it to **both**
      `tokens.css` and `src/tokens.ts`

## 7. Verification

- [ ] `pnpm -F @timelessui/components run test`
- [ ] `pnpm -F @timelessui/components run contracts:validate`
- [ ] `pnpm -F @timelessui/components run manifest:validate`
- [ ] Per-engine select screenshots at all three sizes
- [ ] E2E: submit a form containing every control and assert the serialised body
- [ ] E2E: `required` OTP blocks submission
- [ ] E2E: `ui-form` sets, focuses, and clears a server error
- [ ] E2E: a control inside a disabled `<fieldset>` submits nothing
- [ ] E2E: reset restores defaults
- [ ] E2E: OTP fill-advance, `Backspace`, arrows, `Home`/`End`, full-code paste
- [ ] E2E: two-thumb range, each thumb focusable and arrow-operable
- [ ] `a11y.spec.ts` over the new routes
- [ ] `verify-apg-conformance` on the OTP field and range field
- [ ] `no-javascript.spec.ts`: fieldset and native select fully functional; OTP and range degrade to
      plain inputs that still submit
- [ ] `pnpm build:packages` then `pnpm -F @timelessui/components run exports:validate`
- [ ] `pnpm -F @timelessui/components run generated-dom:check`
- [ ] Re-baseline `performance-baselines.json` with `node scripts/check-performance.mjs --measure`
      and rewrite the `justification`
- [ ] `pnpm boundaries:check`
- [ ] `pnpm -F @timelessui/examples test`
- [ ] `pnpm -F @apps/web test`
- [ ] `pnpm qa`
- [ ] Name every CI-only gate that was run locally in RESULTS.md
- [ ] Record decisions, trade-offs, and results in RESULTS.md

---

Generated by Claude Opus 5 - High reasoning
