# Milestone 022 Tasks

## 0. Baseline, measured before any change

- [x] Record line counts for `select.ts`, `combobox.ts`, `listbox.ts`, `collection.ts`,
      `select.css`, `combobox.css`, `listbox.css`
- [x] Write the failing E2E assertion that a Select surface's inline-start edge does not align with
      its trigger's on `main`, and confirm it fails
- [x] Write the failing E2E assertion that a Select surface can be narrower than its trigger on
      `main`, and confirm it fails
- [x] Record `performance:check` output as the baseline budget

## 1. Shared option core

- [x] Confirm firsthand that `collection.ts:227-247` already provides a cached locale-aware
      `Intl.Collator` and NFC normalisation, and that `collectionTextMatches` already does contains
      and prefix matching — then plan to reuse it, not replace it
- [x] Create `packages/components/src/options.ts` with `optionLabel`, `matchOption`, `findOptions`,
      `visibleOptions`, `applyOptionFilter`, `optionPageWindow` — `groupIsEmpty` was not needed, the
      CSS `:has()` form expresses it
- [x] Confirm `options.ts` adds no second `Intl.Collator` and no second normalisation path
- [x] Implement `optionLabel` precedence: `label` attribute, then `data-ui-label` (not `data-label`,
      to match the `data-ui-value` precedent), then `aria-label`, then trimmed text content
- [x] Implement `matchOption` as a thin wrapper over `collectionTextMatches` fed by `optionLabel`
- [x] Decide whether `ignorePunctuation: true` is added, and where: on `collectionCollator` (which
      changes Menu, Toolbar, and Toggle Group typeahead too) or threaded through
      `CollectionMatcherOptions`. Record the decision and the blast radius
- [x] Implement `findOptions` so it descends through `role="group"` wrappers instead of reading only
      direct children
- [x] Create `packages/components/src/options.test.ts`
- [x] Test that "cafe" matching "Café" still works after the refactor (it already does on `main`,
      via `collection.ts`; this is a regression guard, not a new capability)
- [x] Test `contains` versus `starts-with` versus `off`
- [x] Test `optionLabel` precedence across all four sources
- [x] Test that overriding `label` does not change the option's accessible name
- [x] Test `findOptions` finds options nested inside a group
- [x] Test `optionPageWindow` at the first and last page and with a page size exceeding the option
      count
- [x] Replace `listbox.ts`'s private `visibleListboxOptions` and `normalizeListboxText` with calls
      into `options.ts`, keeping `filterListboxOptions` exported from `listbox.ts`
- [x] Leave `isMenuItemDisabled` (`menu.ts:391`) and the `choice-group.ts` / `toggle-group.ts`
      disabled predicates alone; they are milestone 024's scope
- [x] Reconcile the typeahead reset window (`listbox.ts:75` is 700ms); name the chosen constant in
      `options.ts` and record the choice
- [x] Confirm `options.ts` imports nothing from `select.ts`, `combobox.ts`, or `listbox.ts`

## 2. Unify the option and surface stylesheets

- [x] Decide whether `contracts:validate` can attribute one shared stylesheet to three contracts,
      and record the answer
- [x] Move the `[role='option']` row, hover, selected, disabled, and `[hidden]` rules into one place
- [x] Add `[data-ui-internal-active]` to the active selector for Select
- [x] Add `[role='option'][hidden] { display: none }` for Select
- [x] Normalise the `:where()` wrapping so all three have uniform specificity
- [x] Merge the two rival surface-width custom properties into one name
- [x] Reconcile the two `max-inline-size` values (22rem vs 24rem) into one
- [x] Replace `position-area: bottom center` on the Select surface with `block-end span-inline-end`
- [x] Replace `position-area: bottom left` on the Combobox surface with `block-end span-inline-end`
- [x] Add `min-inline-size: anchor-size(width)` to the Select surface
- [x] Add `max-block-size: 100%` to both surfaces and remove the hardcoded viewport clamps
- [x] Replace `translate` with `margin-block` for the trigger gap on both surfaces
- [x] Add an `[align='end']` rule using `block-end span-inline-start`
- [x] Leave `popover.css:101`'s `bottom center` unchanged and add a comment saying why popovers and
      tooltips centre while collection surfaces edge-align
- [x] Evaluate whether `anchor-scope` can replace the `--ui-floating-anchor` per-instance custom
      property at `popover.css:63-69`; adopt or record why not
- [x] Add a comment recording that anchor rules must not be scoped to `:popover-open` if an exit
      transition is ever added
- [x] Extract the nine-declaration `[data-ui-internal-floating='fallback']` reset, identical in
      `select.css:34-44`, `menu.css:37-47`, and `popover.css:71-83`, so it appears once
- [x] Extract the `inset: auto` + offset + `position-try-fallbacks` block, currently written five
      times
- [x] Extract the per-placement variants, currently written twice
- [x] Move `anchor-name`/`position-anchor` out of `popover.css:63-69` into a stylesheet every
      anchored component loads, or declare the `popover.css` dependency in each catalog entry and
      registry description
- [x] Verify a `ui-select` with only `tokens.css`, `button.css`, and `select.css` loaded opens
      adjacent to its trigger
- [x] Add `max-block-size` **and** `overflow: auto` to `ui-listbox` and popover-mode `ui-menu`
- [x] Verify a 50-item listbox and a 50-item menu are fully reachable at a 600px viewport height
- [x] Move `anchor-size(width)` inside the `@supports` guard in the combobox surface
- [x] Verify the surface is at least its declared floor width with JavaScript disabled
- [x] Add the four `[placement]` rules to the select surface, mirroring `menu.css:112-125`
- [x] Declare `--ui-select-listbox-min-inline-size`, `--ui-combobox-popup-width`,
      `--ui-menu-min-inline-size`, and `--ui-floating-offset` via registry `variable()`, or rename
      them with an `--ui-internal-` prefix
- [x] Record that 50 of 53 contracts declared zero CSS custom properties; this milestone leaves 40
      of 53, so a later one can take the rest
- [x] Confirm both failing baseline assertions from step 0 now pass

## 2a. Open the surface declaratively

- [x] Confirm firsthand that `select.ts:279`/`:289` and `menu-button.ts:185`/`:197` call
      `showPopover()`/`hidePopover()` imperatively, while `popover.ts:187` writes `popovertarget`
- [x] Wire `popovertarget` from the Select trigger to its surface
- [x] Wire it for Combobox
- [x] Remove the imperative `showPopover()`/`hidePopover()` calls from the supported path
- [x] Keep a feature-detected imperative fallback via the capability module
- [x] Report which path is live out of the enhancement result, following milestone 020's
      `triggerWiring: 'authored' | 'listener'` shape rather than inventing a second one
- [x] Author `popovertarget` in the example factories so the copyable source shows a pre-JS trigger
- [x] Add a `no-javascript.spec.ts` case asserting the surface opens with scripting disabled
- [x] If that case cannot pass, keep the imperative path and record why in RESULTS.md
- [x] Leave `ui-menu-button` alone; note its identical defect for a later pass
- [x] Read milestone 020's `RESULTS.md` first if it has landed, so the fallback shape matches

## 2b. Make the anchor-positioning fallback real

- [x] Confirm firsthand that `grep -rn "CSS.supports" packages/components/src packages/core/src`
      returns nothing on `main`
- [x] Add `supportsAnchorPositioning(win)` to the capability module from milestone 021
- [x] Gate `applyFloatingPosition` on it so it runs **because** support is missing
- [x] Stop stamping `data-ui-internal-floating` and inline `--ui-floating-left`/`--ui-floating-top`
      in a supporting browser
- [x] Give Combobox a fallback positioning path, or state in the registry that it deliberately has
      none
- [x] E2E: an open select in an anchor-positioning browser carries no inline `--ui-floating-left`
      and no `data-ui-internal-floating` attribute
- [ ] E2E: with anchor positioning unavailable, every anchored surface is still on-screen and
      reachable — **not written.** Every browser the runner installs supports anchor positioning, so
      there is nothing to drive the assertion with. The path is unit-covered through
      `supportsAnchorPositioning` and `applyFloatingPosition` instead

## 3b. Separate active from selected

- [x] Stop `syncListboxActiveDescendant` (`listbox.ts:373-377`) writing `aria-selected` from the
      active index
- [x] Route the active highlight through `data-ui-internal-active` only
- [x] Write `aria-selected` from the selection code path only
- [x] Unit test: arrowing past a selected option leaves its `aria-selected="true"` intact while the
      passed-over option gets `data-ui-internal-active` and `aria-selected="false"`
- [x] Correct `component-registry.mjs:1306`, which documents Select as using `aria-activedescendant`
      while `select.ts:251-253` moves real DOM focus with roving `tabindex`
- [x] Confirm this lands before the `multiple` work in steps 4 and 5

## 3. Registry: shared part vocabulary and new attributes

- [x] Add the `collectionAlignments` value set `['start', 'end']`, default `start`
- [x] Add the `optionFilterModes` value set `['contains', 'starts-with', 'off']`, default `contains`
- [x] Declare the shared parts on each of the three contracts: `trigger`, `value`, `search`,
      `listbox`, `option`, `option-indicator`, `group`, `group-label`, `separator`, `chips`, `chip`,
      `chip-remove`, `clear`, `empty`, `status`, `header`, `footer`, `pager`, `page-previous`,
      `page-next`, `page-status`
- [x] Add `name`, `required`, and `disabled` to all three contracts
- [x] Add `multiple` to `select` and `combobox`
- [x] Add `align` to `select` and `combobox`
- [x] Add `searchable` to `select`
- [x] Add `filter` to `select` and `combobox`
- [x] Add `page-size` to all three
- [x] Confirm every boolean uses presence, not `="true"`
- [x] Confirm no `data-ui-*` was used for configuration on a custom-element host
- [x] Declare the change, input, open, and page events with detail types exported from the
      dispatching module
- [x] Review `apg: 'combobox'` on both `select` and `combobox` against the APG select-only combobox
      pattern and correct whichever is inaccurate
- [x] Write real descriptions for every new attribute, value, part, and event; placeholders fail the
      build
- [x] Document that `header` and `footer` are `Tab`-reachable and excluded from arrow navigation
- [x] Run `pnpm -F @timelessui/components run generate`
- [x] Run `pnpm -F @timelessui/examples run test` and confirm no `uses unknown part` or
      `uses unknown public attribute` failure — this gate rejects any example token or attribute the
      registry has not declared, so it must pass before step 7 starts
- [x] Add `packages/examples/scripts/validate.mjs` and its 17 failure messages to
      `.agents/reference/validators.md`, which does not currently document it

## 4. Listbox

- [x] Swap internals to `options.ts`, keeping every public export name and module
- [x] Support `role="group"` with `group-label` wired via `aria-labelledby`
- [x] Operate roving tabindex and `aria-activedescendant` over the flattened visible set
- [x] Collapse an all-filtered group, preferring CSS `:has()` over a JS `hidden` write
- [x] Add `static formAssociated = true`, `setFormValue`, and `setValidity`
- [x] Implement `formResetCallback`, `formDisabledCallback` (tracking fieldset-disabled separately
      from the element's own `disabled`), and `formStateRestoreCallback`
- [x] Anchor `setValidity`'s third argument on the visible trigger or input, not the host
- [x] E2E: a control inside a disabled `<fieldset>` is disabled and submits nothing
- [x] E2E: submitting an empty required control positions the native validation bubble over the
      trigger
- [x] Submit one entry per value under one `name` when `multiple`
- [x] Add the nested-host guard so a listbox inside a select or combobox registers no form value
- [x] Test the nested case explicitly for a duplicate submitted entry
- [x] Wire paging through `optionPageWindow` and the pager parts
- [x] Hide the pager unless `page-size` is set and more than one page exists

## 5. Select

- [x] Rebuild on the listbox core
- [x] Delete the `selectOptionValue` and `syncSelectValue` bodies, re-exporting from `listbox.ts`
- [x] Enhance an authored `search` part inside the surface under `searchable`
- [x] Keep DOM focus in the search field and track the highlight with `aria-activedescendant`
- [x] Choose one focus model for non-searchable Select, match the declared APG pattern, and delete
      the other path
- [x] Add closed-state typeahead on the trigger via `startsWith`
- [x] Render chips into the `chips` part under `multiple`
- [x] Make `Backspace` in an empty search field remove the last chip
- [x] Give every `chip-remove` an accessible name naming which value it removes
- [x] Implement `clear`: empties the selection, disabled when empty, default accessible name only
      when the author gave neither text nor label
- [x] Keep reading an author-supplied `<input type="hidden">` when present
- [x] Guard every trigger-label text write with an inequality check to avoid a MutationObserver loop
- [x] Add form participation via internals

## 6. Combobox

- [x] Rebuild on the listbox core with the same parts and events as Select
- [x] Implement `filter="off"`: skip built-in filtering, emit the input event, let the consumer set
      `hidden`
- [x] Confirm navigation, empty state, group collapse, and paging all still work under
      `filter="off"`
- [x] Make Left and Right move the text caret except in a grid-layout surface
- [x] Add chips, clear, empty, status, and paging
- [x] Add form participation via internals
- [x] Delete the three pass-through aliases at `combobox.ts:388-406`, re-exporting instead

## 7. Examples, stories, docs

- [x] Rebuild `createCustomSelect`, `createCombobox`, and `createListbox` on the shared anatomy
- [x] Add factory support for groups, chips, clear, empty, status, header, footer, and the pager
- [x] Rewrite the `select`, `combobox`, and `listbox` catalog `guidance`
- [x] Add a grouped-options story
- [x] Add a multiple-with-chips story
- [x] Add a searchable-Select-beside-Combobox comparison story
- [x] Add a paged-long-list story
- [x] Add a consumer-owned-filtering story using `filter="off"`
- [x] Give every story whose render adds demo wrappers an explicit `source` snippet
- [x] Import every value array from `values/`; confirm no `argTypes.options` hand-copies a list
- [x] Run `pnpm -F @timelessui/examples run test`; confirm no example authors
      `data-ui-internal-active`
- [x] Regenerate `apps/stories/story-routes.json` and commit it, so the axe sweep in `a11y.spec.ts`
      covers the new stories instead of a stale list
- [x] Write the Command-palette recipe as a documented composition; confirm no `ui-command` element
      exists

## 9. Emerged during implementation

- [x] Split the popover surface from the `role="listbox"` element on all three components. A listbox
      may own only options and groups, so a search field, a header, a footer, or a pager forced the
      new `surface` part and, on `ui-listbox`, an inner `listbox` part
- [x] Gate `applyFloatingPosition` in Popover, Hover Card, and Menu Button too, not only in the two
      collection surfaces — the ungated call half-applied once the fallback reset moved into
      `floating.css`
- [x] Skip unchanged attribute and `hidden` writes in the sync helpers, which the mutation budget in
      `performance.spec.ts` caught
- [x] Expose the standard form-control surface — `form`, `labels`, `validity`, `validationMessage`,
      `willValidate`, `checkValidity()`, `reportValidity()` — on all three
- [x] Add `internals` to `@timelessui/core`'s `UIElementHost`, which had attached internals but
      never exposed them
- [x] Widen the `validate-contracts.mjs` root check to a contract's stylesheets collectively, so a
      shared stylesheet is expressible
- [x] Measure the whole stylesheet set in `check-performance.mjs`, so splitting a file cannot look
      like a saving
- [x] Replace the recipe route-id fallback in `.storylite/config.ts`, which filed every new recipe
      under Color

## 8. Verification

- [x] `pnpm -F @timelessui/components run test`
- [x] `pnpm -F @timelessui/components run exports:validate` confirms every previously public name is
      still exported from the same module
- [x] E2E: surface inline-start edge matches the trigger's under `align="start"`
- [x] E2E: surface inline-end edge matches the trigger's under `align="end"`
- [x] E2E: surface is never narrower than the trigger
- [x] E2E keyboard map per component: arrows, Home, End, PageUp, PageDown, open and closed
      typeahead, Enter, Escape, Tab into header and footer, Backspace chip removal, caret movement
- [x] E2E form submission: single value, multiple values under one name, `required` blocking with
      `valueMissing`, reset restoring the `value` attribute
- [x] E2E consumer-owned filtering under `filter="off"`
- [x] `no-javascript.spec.ts` shows readable authored options; state whether the bar met is
      "inspectable" or "functional"
- [x] Add a collection-surface case to `platform.spec.ts` and confirm Firefox and WebKit
- [ ] Exercise the non-anchor fallback path if any runner browser predates `anchor-size()` — **not
      needed.** All three runner browsers support it; the E2E assertion that no fallback hook is
      stamped skips itself where support is missing
- [x] Extend `a11y.spec.ts` and resolve any "interactive element inside a listbox" finding
      deliberately
- [ ] Run `verify-apg-conformance` for Select, Combobox, and Listbox — **not run as a skill.** The
      axe sweep covers all 98 routes and the keyboard map is covered by E2E, but a deliberate pass
      against the APG pattern text is still owed
- [x] `pnpm -F @timelessui/components run contracts:validate`
- [x] `pnpm -F @timelessui/components run manifest:validate`
- [x] `pnpm -F @timelessui/examples run test`
- [x] Confirm the axe sweep count grew by the number of stories added, not by zero
- [x] `pnpm -F @timelessui/components run performance:check` and record any budget movement
- [x] `pnpm qa`
- [x] Record decisions, trade-offs, and results in RESULTS.md

---

Generated by Claude Opus 5 - High reasoning
