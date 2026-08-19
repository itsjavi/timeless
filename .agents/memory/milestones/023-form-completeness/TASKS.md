# Milestone 023 Tasks

Depends on milestone 022 for the first form-association implementation and the
`formDisabledCallback` / `formStateRestoreCallback` precedent. Do not start step 3 before 022 lands.

## 1. Native select padding

- [x] Capture the baseline: screenshot `.ui-select` beside `.ui-input` at `sm`, `md`, and `lg` in
      Chrome, Firefox, and WebKit
- [x] Split `.ui-select` out of the shared padding rule at `forms.css:83-89`
- [x] Split it out of the `sm` rule at `forms.css:97-104`
- [x] Split it out of the `lg` rule at `forms.css:106-113`
- [x] Measured across five end values per engine: **no value equalises them**, because the UA arrow
      does not move with `padding-inline-end` in Chromium or Firefox, and WebKit discards the
      padding entirely
- [x] Confirmed no stylesheet set `appearance` on `.ui-select` — then set it deliberately, under
      exit B
- [x] Keep `color-scheme: light dark` at `forms.css:178-180`
- [x] Add a `nativeSelect` registry description stating the indicator is UA-drawn and its gutter is
      engine-dependent
- [x] Re-screenshot all three engines and compare against the baseline
- [x] Exit B taken — no engine moves the UA arrow with `padding-inline-end`, and WebKit drops author
      `padding` and `min-block-size` outright. Built as `appearance: none` plus a gradient-drawn
      indicator and `padding-inline-end: calc(gutter + indicator)`. **No `indicator` part**: a
      `<select>` admits only `<option>`, so an authored part would mean turning the root into a
      wrapper. Recorded on the `--ui-select-indicator` variable instead
- [x] E2E: assert computed `padding-inline-start` differs from `padding-inline-end`

## 2. Choice-group tangle, then a fieldset

- [x] Confirm firsthand that all `choice-group.css` rules are scoped to
      `:where(ui-radio-group, ui-checkbox-group)` and none matches `.ui-choice-group`
- [x] Rename `choice-group.css` to match the roots it selects
- [x] Update the `styles` array of every catalog entry that lists it
- [x] Update the `@import` in `packages/components/src/css/components.css`
- [x] Replace the literal `0.6` at `forms.css:210` with `var(--ui-disabled-opacity)`
- [x] Reconcile the vertical gap: `var(--ui-space-3)` (`forms.css:238`) vs `var(--ui-space-2)`
      (`choice-group.css:4`)
- [x] Pick one horizontal layout model that handles both orientations, replacing the grid
      (`forms.css:250-254`) / flex-wrap (`choice-group.css:8-13`) split
- [x] Remove the duplicated accent-color and focus-ring declarations from the group stylesheet
- [x] Make `forms.css`'s choice anatomy reachable from `ui-checkbox-group` and `ui-radio-group`
- [x] Add a `fieldset` contract: root `.ui-fieldset`, `legend` part, `data-ui-density`, plus the
      `description` and `error` parts
- [x] Write real descriptions for every new field
- [x] Decided: the three roots stay three contracts. Each carries exactly one orientation attribute,
      spelled as AGENTS.md requires for its root kind. What was duplicated was the stylesheet, not
      the attribute. See RESULTS decision 3
- [x] Confirm `isChoiceGroupOrientation` is still exported from `forms.ts` under the same name
- [x] `pnpm -F @timelessui/components run generate` then `contracts:validate`

## 3. `ui-form`

- [x] Superseded: 022 already extracted it into `src/value-state.ts`, which is the published
      `@timelessui/components/value-state` subpath. Moving it would rename a public export's module.
      Extended it in place with `customError`. See RESULTS decision 9
- [x] Add the `ui-form` element with `setErrors(errorsByFieldName)` and `clearErrors()`
- [x] Fill the matching authored `[data-ui-part~='error']` element per field
- [x] Wire `aria-invalid` and `aria-describedby` using `ensureElementId` from core
- [x] Move focus to the first invalid control
- [x] Clear a field's custom validity on its next `input` event
- [x] Resolve how `ui-form` sets validity on a form-associated custom element from 022, whose
      validity is owned by its internals and which has no `setCustomValidity` — most likely by
      delegating to a method on the element. Record the resolution
- [x] Declare the event and its detail type; check `events.ts` for the naming convention first
- [x] Confirm `ui-form` writes no visual declarations
- [x] Test with `ui-select`, `ui-combobox`, and `ui-listbox`

## 4. `ui-range-field`

- [x] Add the element wrapping two native `input[type=range]`, declared as `from` and `to` parts
      plus an `output` part
- [x] Clamp so `from <= to`; decide block-crossing versus swap-active-thumb and document it
- [x] Unit-test the clamp and the crossing behavior
- [x] Write fill bounds as measured custom properties from JS, following `floating.ts:108-111`; let
      CSS own the rendering
- [x] Decide the form value shape (two entries under `name`, or `name-from` / `name-to`) and state
      it
- [x] Reuse `--ui-range-track` and `--ui-range-thumb`; declare any new variable in the registry
- [x] Confirm `.ui-range` is byte-unchanged
- [x] Superseded: `ui-range-field` is deliberately not form-associated, so the pair keeps submitting
      and resetting natively with scripting off. See RESULTS decision 5

## 5. `ui-otp-field`

- [x] Add the element: `role="group"` host with an accessible name and N native `input` cells as a
      `cell` part
- [x] Add a `length` attribute, a `value` property joining the cells, and `name`
- [x] Write `distributeOtpValue(cellCount, text)` as a pure exported helper
- [x] Unit-test it: full-length paste, over-length paste, paste with spaces and dashes, paste into
      the middle, non-numeric input
- [x] Implement traversal locally rather than via `collectionNavigationTarget` — cells are each
      tabbable, so there is no roving tabindex
- [x] Fill advances focus to the next cell
- [x] `Backspace` on an empty cell moves back and clears
- [x] Arrows move between cells; `Home` / `End` jump to the ends
- [x] Handle `paste` on any cell, distributing across all cells — the first `paste` handler in the
      repo
- [x] Decided: traversal stays local. `otpTraversalTarget` is exported from `otp-field.ts` for
      testing but is not added to the `./collection` subpath
- [x] Have the example factory emit `inputmode="numeric"`, `autocomplete="one-time-code"` on the
      first cell only, `maxlength="1"`, and a per-cell `aria-label`
- [x] Decide the `accessibility()` contract against
      `.agents/skills/verify-apg-conformance/SKILL.md`; there is no APG pattern for OTP, so record
      the reasoning
- [x] Add the full form-associated callback set

## 6. The add sequence, per new element

For `ui-form`, `ui-range-field`, and `ui-otp-field`:

- [x] Registry `valueSets` entries, then the `customElement(...)` entry
- [x] `src/css/<name>.css` in the `ui.components` layer, selecting every declared non-default value
- [x] `@import` added to `src/css/components.css`
- [x] `src/<module>.ts` and `src/<module>.test.ts`
- [x] `pnpm -F @timelessui/components run generate`
- [x] Re-export generated arrays, unions, and guards from the behavior module
- [x] Export block added to `src/index.ts`
- [x] `./<module>` subpath added to `packages/components/package.json` exports
- [x] Tag appended to the ordered list in `src/define.test.ts`
- [x] Example factory built with `uiAttributes` / `uiAttributeString`, escaped with `escapeHtml` /
      `escapeAttribute`
- [x] Catalog entry whose `styles` include every stylesheet of every named contract plus
      `tokens.css`
- [x] Loader added to `apps/web/src/scripts/preview-runtime.ts`
- [x] Story with `meta.title = 'Library/<Domain>/<Component>'`, slug matching the catalog domain and
      id
- [x] Entry added to `apps/stories/src/smoke.test.ts`
- [x] `pnpm build:stories`, then commit the regenerated `apps/stories/story-routes.json`
- [x] Update the hardcoded component count in `apps/web/src/content/docs/docs/index.mdx`
- [x] Confirm every gap value comes from `--ui-space-1..5`; if a token is added, add it to **both**
      `tokens.css` and `src/tokens.ts`

## 7. Verification

- [x] `pnpm -F @timelessui/components run test`
- [x] `pnpm -F @timelessui/components run contracts:validate`
- [x] `pnpm -F @timelessui/components run manifest:validate`
- [x] Per-engine select screenshots at all three sizes
- [x] E2E: submit a form containing every control and assert the serialised body
- [x] E2E: `required` OTP blocks submission
- [x] E2E: `ui-form` sets, focuses, and clears a server error
- [x] E2E: a control inside a disabled `<fieldset>` submits nothing
- [x] E2E: reset restores defaults
- [x] E2E: OTP fill-advance, `Backspace`, arrows, `Home`/`End`, full-code paste
- [x] E2E: two-thumb range, each thumb focusable and arrow-operable
- [x] `a11y.spec.ts` over the new routes
- [x] `verify-apg-conformance` on the OTP field and range field
- [x] `no-javascript.spec.ts`: fieldset and native select fully functional; the range pair still
      submits; the OTP cells stay usable but submit nothing, which the docs state per component
- [x] `pnpm build:packages` then `pnpm -F @timelessui/components run exports:validate`
- [x] `pnpm -F @timelessui/components run generated-dom:check`
- [x] Re-baselined `performance-baselines.json` with `node scripts/check-performance.mjs --measure`.
      There is no `justification` field in that file; the figures and their cause are in RESULTS
- [x] `pnpm boundaries:check`
- [x] `pnpm -F @timelessui/examples test`
- [x] `pnpm -F @apps/web test`
- [x] `pnpm qa`
- [x] Name every CI-only gate that was run locally in RESULTS.md
- [x] Record decisions, trade-offs, and results in RESULTS.md
- [ ] **Open:** confirm `autocomplete="one-time-code"` against real OS SMS autofill on iOS Safari
      and Android Chrome. No physical device was available; Playwright cannot exercise it

---

Generated by Claude Opus 5 - High reasoning
