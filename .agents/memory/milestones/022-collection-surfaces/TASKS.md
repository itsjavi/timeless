# Milestone 022 Tasks

## 0. Baseline, measured before any change

- [ ] Record line counts for `select.ts`, `combobox.ts`, `listbox.ts`, `collection.ts`,
      `select.css`, `combobox.css`, `listbox.css`
- [ ] Write the failing E2E assertion that a Select surface's inline-start edge does not align with
      its trigger's on `main`, and confirm it fails
- [ ] Write the failing E2E assertion that a Select surface can be narrower than its trigger on
      `main`, and confirm it fails
- [ ] Record `performance:check` output as the baseline budget

## 1. Shared option core

- [ ] Confirm firsthand that `collection.ts:227-247` already provides a cached locale-aware
      `Intl.Collator` and NFC normalisation, and that `collectionTextMatches` already does contains
      and prefix matching — then plan to reuse it, not replace it
- [ ] Create `packages/components/src/options.ts` with `optionLabel`, `matchOption`, `findOptions`,
      `visibleOptions`, `applyOptionFilter`, `groupIsEmpty`, `optionPageWindow`
- [ ] Confirm `options.ts` adds no second `Intl.Collator` and no second normalisation path
- [ ] Implement `optionLabel` precedence: `label` attribute, then `data-label`, then `aria-label`,
      then trimmed text content — extending `collectionItemText`'s existing
      `aria-label ?? textContent`
- [ ] Implement `matchOption` as a thin wrapper over `collectionTextMatches` fed by `optionLabel`
- [ ] Decide whether `ignorePunctuation: true` is added, and where: on `collectionCollator` (which
      changes Menu, Toolbar, and Toggle Group typeahead too) or threaded through
      `CollectionMatcherOptions`. Record the decision and the blast radius
- [ ] Implement `findOptions` so it descends through `role="group"` wrappers instead of reading only
      direct children
- [ ] Create `packages/components/src/options.test.ts`
- [ ] Test that "cafe" matching "Café" still works after the refactor (it already does on `main`,
      via `collection.ts`; this is a regression guard, not a new capability)
- [ ] Test `contains` versus `starts-with` versus `off`
- [ ] Test `optionLabel` precedence across all four sources
- [ ] Test that overriding `label` does not change the option's accessible name
- [ ] Test `findOptions` finds options nested inside a group
- [ ] Test `optionPageWindow` at the first and last page and with a page size exceeding the option
      count
- [ ] Replace `listbox.ts`'s private `visibleListboxOptions` and `normalizeListboxText` with calls
      into `options.ts`, keeping `filterListboxOptions` exported from `listbox.ts`
- [ ] Leave `isMenuItemDisabled` (`menu.ts:391`) and the `choice-group.ts` / `toggle-group.ts`
      disabled predicates alone; they are milestone 024's scope
- [ ] Reconcile the typeahead reset window (`listbox.ts:75` is 700ms); name the chosen constant in
      `options.ts` and record the choice
- [ ] Confirm `options.ts` imports nothing from `select.ts`, `combobox.ts`, or `listbox.ts`

## 2. Unify the option and surface stylesheets

- [ ] Decide whether `contracts:validate` can attribute one shared stylesheet to three contracts,
      and record the answer
- [ ] Move the `[role='option']` row, hover, selected, disabled, and `[hidden]` rules into one place
- [ ] Add `[data-ui-internal-active]` to the active selector for Select
- [ ] Add `[role='option'][hidden] { display: none }` for Select
- [ ] Normalise the `:where()` wrapping so all three have uniform specificity
- [ ] Merge the two rival surface-width custom properties into one name
- [ ] Reconcile the two `max-inline-size` values (22rem vs 24rem) into one
- [ ] Replace `position-area: bottom center` on the Select surface with `block-end span-inline-end`
- [ ] Replace `position-area: bottom left` on the Combobox surface with `block-end span-inline-end`
- [ ] Add `min-inline-size: anchor-size(width)` to the Select surface
- [ ] Add `max-block-size: 100%` to both surfaces and remove the hardcoded viewport clamps
- [ ] Replace `translate` with `margin-block` for the trigger gap on both surfaces
- [ ] Add an `[align='end']` rule using `block-end span-inline-start`
- [ ] Leave `popover.css:101`'s `bottom center` unchanged and add a comment saying why popovers and
      tooltips centre while collection surfaces edge-align
- [ ] Evaluate whether `anchor-scope` can replace the `--ui-floating-anchor` per-instance custom
      property at `popover.css:63-69`; adopt or record why not
- [ ] Add a comment recording that anchor rules must not be scoped to `:popover-open` if an exit
      transition is ever added
- [ ] Extract the nine-declaration `[data-ui-internal-floating='fallback']` reset, identical in
      `select.css:34-44`, `menu.css:37-47`, and `popover.css:71-83`, so it appears once
- [ ] Extract the `inset: auto` + offset + `position-try-fallbacks` block, currently written five
      times
- [ ] Extract the per-placement variants, currently written twice
- [ ] Move `anchor-name`/`position-anchor` out of `popover.css:63-69` into a stylesheet every
      anchored component loads, or declare the `popover.css` dependency in each catalog entry and
      registry description
- [ ] Verify a `ui-select` with only `tokens.css`, `button.css`, and `select.css` loaded opens
      adjacent to its trigger
- [ ] Add `max-block-size` **and** `overflow: auto` to `ui-listbox` and popover-mode `ui-menu`
- [ ] Verify a 50-item listbox and a 50-item menu are fully reachable at a 600px viewport height
- [ ] Move `anchor-size(width)` inside the `@supports` guard in the combobox surface
- [ ] Verify the surface is at least its declared floor width with JavaScript disabled
- [ ] Add the four `[placement]` rules to the select surface, mirroring `menu.css:112-125`
- [ ] Declare `--ui-select-listbox-min-inline-size`, `--ui-combobox-popup-width`,
      `--ui-menu-min-inline-size`, and `--ui-floating-offset` via registry `variable()`, or rename
      them with an `--ui-internal-` prefix
- [ ] Record that 50 of 53 contracts declare zero CSS custom properties, so a later milestone can
      take the remaining ~46
- [ ] Confirm both failing baseline assertions from step 0 now pass

## 2a. Open the surface declaratively

- [ ] Confirm firsthand that `select.ts:279`/`:289` and `menu-button.ts:185`/`:197` call
      `showPopover()`/`hidePopover()` imperatively, while `popover.ts:187` writes `popovertarget`
- [ ] Wire `popovertarget` from the Select trigger to its surface
- [ ] Wire it for Combobox
- [ ] Remove the imperative `showPopover()`/`hidePopover()` calls from the supported path
- [ ] Keep a feature-detected imperative fallback via the capability module
- [ ] Report which path is live out of the enhancement result, following milestone 020's
      `triggerWiring: 'authored' | 'listener'` shape rather than inventing a second one
- [ ] Author `popovertarget` in the example factories so the copyable source shows a pre-JS trigger
- [ ] Add a `no-javascript.spec.ts` case asserting the surface opens with scripting disabled
- [ ] If that case cannot pass, keep the imperative path and record why in RESULTS.md
- [ ] Leave `ui-menu-button` alone; note its identical defect for a later pass
- [ ] Read milestone 020's `RESULTS.md` first if it has landed, so the fallback shape matches

## 2b. Make the anchor-positioning fallback real

- [ ] Confirm firsthand that `grep -rn "CSS.supports" packages/components/src packages/core/src`
      returns nothing on `main`
- [ ] Add `supportsAnchorPositioning(win)` to the capability module from milestone 021
- [ ] Gate `applyFloatingPosition` on it so it runs **because** support is missing
- [ ] Stop stamping `data-ui-internal-floating` and inline `--ui-floating-left`/`--ui-floating-top`
      in a supporting browser
- [ ] Give Combobox a fallback positioning path, or state in the registry that it deliberately has
      none
- [ ] E2E: an open select in an anchor-positioning browser carries no inline `--ui-floating-left`
      and no `data-ui-internal-floating` attribute
- [ ] E2E: with anchor positioning unavailable, every anchored surface is still on-screen and
      reachable

## 3b. Separate active from selected

- [ ] Stop `syncListboxActiveDescendant` (`listbox.ts:373-377`) writing `aria-selected` from the
      active index
- [ ] Route the active highlight through `data-ui-internal-active` only
- [ ] Write `aria-selected` from the selection code path only
- [ ] Unit test: arrowing past a selected option leaves its `aria-selected="true"` intact while the
      passed-over option gets `data-ui-internal-active` and `aria-selected="false"`
- [ ] Correct `component-registry.mjs:1306`, which documents Select as using `aria-activedescendant`
      while `select.ts:251-253` moves real DOM focus with roving `tabindex`
- [ ] Confirm this lands before the `multiple` work in steps 4 and 5

## 3. Registry: shared part vocabulary and new attributes

- [ ] Add the `collectionAlignments` value set `['start', 'end']`, default `start`
- [ ] Add the `optionFilterModes` value set `['contains', 'starts-with', 'off']`, default `contains`
- [ ] Declare the shared parts on each of the three contracts: `trigger`, `value`, `search`,
      `listbox`, `option`, `option-indicator`, `group`, `group-label`, `separator`, `chips`, `chip`,
      `chip-remove`, `clear`, `empty`, `status`, `header`, `footer`, `pager`, `page-previous`,
      `page-next`, `page-status`
- [ ] Add `name`, `required`, and `disabled` to all three contracts
- [ ] Add `multiple` to `select` and `combobox`
- [ ] Add `align` to `select` and `combobox`
- [ ] Add `searchable` to `select`
- [ ] Add `filter` to `select` and `combobox`
- [ ] Add `page-size` to all three
- [ ] Confirm every boolean uses presence, not `="true"`
- [ ] Confirm no `data-ui-*` was used for configuration on a custom-element host
- [ ] Declare the change, input, open, and page events with detail types exported from the
      dispatching module
- [ ] Review `apg: 'combobox'` on both `select` and `combobox` against the APG select-only combobox
      pattern and correct whichever is inaccurate
- [ ] Write real descriptions for every new attribute, value, part, and event; placeholders fail the
      build
- [ ] Document that `header` and `footer` are `Tab`-reachable and excluded from arrow navigation
- [ ] Run `pnpm -F @timelessui/components run generate`
- [ ] Run `pnpm -F @timelessui/examples run test` and confirm no `uses unknown part` or
      `uses unknown public attribute` failure — this gate rejects any example token or attribute the
      registry has not declared, so it must pass before step 7 starts
- [ ] Add `packages/examples/scripts/validate.mjs` and its 17 failure messages to
      `.agents/reference/validators.md`, which does not currently document it

## 4. Listbox

- [ ] Swap internals to `options.ts`, keeping every public export name and module
- [ ] Support `role="group"` with `group-label` wired via `aria-labelledby`
- [ ] Operate roving tabindex and `aria-activedescendant` over the flattened visible set
- [ ] Collapse an all-filtered group, preferring CSS `:has()` over a JS `hidden` write
- [ ] Add `static formAssociated = true`, `setFormValue`, and `setValidity`
- [ ] Implement `formResetCallback`, `formDisabledCallback` (tracking fieldset-disabled separately
      from the element's own `disabled`), and `formStateRestoreCallback`
- [ ] Anchor `setValidity`'s third argument on the visible trigger or input, not the host
- [ ] E2E: a control inside a disabled `<fieldset>` is disabled and submits nothing
- [ ] E2E: submitting an empty required control positions the native validation bubble over the
      trigger
- [ ] Submit one entry per value under one `name` when `multiple`
- [ ] Add the nested-host guard so a listbox inside a select or combobox registers no form value
- [ ] Test the nested case explicitly for a duplicate submitted entry
- [ ] Wire paging through `optionPageWindow` and the pager parts
- [ ] Hide the pager unless `page-size` is set and more than one page exists

## 5. Select

- [ ] Rebuild on the listbox core
- [ ] Delete the `selectOptionValue` and `syncSelectValue` bodies, re-exporting from `listbox.ts`
- [ ] Enhance an authored `search` part inside the surface under `searchable`
- [ ] Keep DOM focus in the search field and track the highlight with `aria-activedescendant`
- [ ] Choose one focus model for non-searchable Select, match the declared APG pattern, and delete
      the other path
- [ ] Add closed-state typeahead on the trigger via `startsWith`
- [ ] Render chips into the `chips` part under `multiple`
- [ ] Make `Backspace` in an empty search field remove the last chip
- [ ] Give every `chip-remove` an accessible name naming which value it removes
- [ ] Implement `clear`: empties the selection, disabled when empty, default accessible name only
      when the author gave neither text nor label
- [ ] Keep reading an author-supplied `<input type="hidden">` when present
- [ ] Guard every trigger-label text write with an inequality check to avoid a MutationObserver loop
- [ ] Add form participation via internals

## 6. Combobox

- [ ] Rebuild on the listbox core with the same parts and events as Select
- [ ] Implement `filter="off"`: skip built-in filtering, emit the input event, let the consumer set
      `hidden`
- [ ] Confirm navigation, empty state, group collapse, and paging all still work under
      `filter="off"`
- [ ] Make Left and Right move the text caret except in a grid-layout surface
- [ ] Add chips, clear, empty, status, and paging
- [ ] Add form participation via internals
- [ ] Delete the three pass-through aliases at `combobox.ts:388-406`, re-exporting instead

## 7. Examples, stories, docs

- [ ] Rebuild `createCustomSelect`, `createCombobox`, and `createListbox` on the shared anatomy
- [ ] Add factory support for groups, chips, clear, empty, status, header, footer, and the pager
- [ ] Rewrite the `select`, `combobox`, and `listbox` catalog `guidance`
- [ ] Add a grouped-options story
- [ ] Add a multiple-with-chips story
- [ ] Add a searchable-Select-beside-Combobox comparison story
- [ ] Add a paged-long-list story
- [ ] Add a consumer-owned-filtering story using `filter="off"`
- [ ] Give every story whose render adds demo wrappers an explicit `source` snippet
- [ ] Import every value array from `values/`; confirm no `argTypes.options` hand-copies a list
- [ ] Run `pnpm -F @timelessui/examples run test`; confirm no example authors
      `data-ui-internal-active`
- [ ] Regenerate `apps/stories/story-routes.json` and commit it, so the axe sweep in `a11y.spec.ts`
      covers the new stories instead of a stale list
- [ ] Write the Command-palette recipe as a documented composition; confirm no `ui-command` element
      exists

## 8. Verification

- [ ] `pnpm -F @timelessui/components run test`
- [ ] `pnpm -F @timelessui/components run exports:validate` confirms every previously public name is
      still exported from the same module
- [ ] E2E: surface inline-start edge matches the trigger's under `align="start"`
- [ ] E2E: surface inline-end edge matches the trigger's under `align="end"`
- [ ] E2E: surface is never narrower than the trigger
- [ ] E2E keyboard map per component: arrows, Home, End, PageUp, PageDown, open and closed
      typeahead, Enter, Escape, Tab into header and footer, Backspace chip removal, caret movement
- [ ] E2E form submission: single value, multiple values under one name, `required` blocking with
      `valueMissing`, reset restoring the `value` attribute
- [ ] E2E consumer-owned filtering under `filter="off"`
- [ ] `no-javascript.spec.ts` shows readable authored options; state whether the bar met is
      "inspectable" or "functional"
- [ ] Add a collection-surface case to `platform.spec.ts` and confirm Firefox and WebKit
- [ ] Exercise the non-anchor fallback path if any runner browser predates `anchor-size()`
- [ ] Extend `a11y.spec.ts` and resolve any "interactive element inside a listbox" finding
      deliberately
- [ ] Run `verify-apg-conformance` for Select, Combobox, and Listbox
- [ ] `pnpm -F @timelessui/components run contracts:validate`
- [ ] `pnpm -F @timelessui/components run manifest:validate`
- [ ] `pnpm -F @timelessui/examples run test`
- [ ] Confirm the axe sweep count grew by the number of stories added, not by zero
- [ ] `pnpm -F @timelessui/components run performance:check` and record any budget movement
- [ ] `pnpm qa`
- [ ] Record decisions, trade-offs, and results in RESULTS.md

---

Generated by Claude Opus 5 - High reasoning
