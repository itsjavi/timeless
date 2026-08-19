# Milestone 021 Tasks

## 1. One capability module

- [x] Create `packages/components/src/capabilities.ts` exporting `supportsNativePopover(win)` and
      `supportsNativeDialog(win)`, lifted verbatim from the existing copies
- [x] Create `packages/components/src/capabilities.test.ts` covering both against a fake window with
      and without the feature
- [x] Delete the private copy in `combobox.ts` and import from `capabilities.ts`
- [x] Delete the private copy in `hover-card.ts` and import from `capabilities.ts`
- [x] Delete the private copy in `menu-button.ts` and import from `capabilities.ts`
- [x] Delete the private copy in `popover.ts` and import from `capabilities.ts`
- [x] Delete the private copy in `select.ts` and import from `capabilities.ts`
- [x] Delete the `supportsNativeDialog` copy in `dialog.ts` and import from `capabilities.ts`
- [x] Delete the `supportsNativeDialog` copy in `sheet.ts` and import from `capabilities.ts`
- [x] Confirm `grep -c "function supportsNative" packages/components/src/*.ts` reports exactly one
      file with two matches
- [x] Milestone 020 had landed, so `supportsInvokerCommands` moved into `capabilities.ts` and
      `invoker.ts` re-exports it
- [x] Confirm `authoredCommand`, `hasAuthoredCommand`, and the command-name constants stay in
      `invoker.ts`
- [x] Confirm `exports:validate` still resolves every name 020 added to `src/index.ts`
- [x] Run `pnpm -F @timelessui/components run test` and confirm every existing
      `supportsPopover: false` and `supportsDialog: false` fallback test passes unchanged
- [x] Run `pnpm -F @timelessui/components run exports:validate`

The two `supportsNativeDialog` copies were **not** identical, so "lifted verbatim" could not apply
to both. See RESULTS.md.

## 2. Collapsible absorbs Disclosure

- [x] Capture the baseline: line counts of `disclosure.css` and `collapsible.css`, and computed
      styles for each at default and compact density
- [x] Prove `.ui-disclosure[data-ui-density='compact']` does not change the trigger height on `main`
- [x] ~~Add a `collapsibleVariants` value set `['panel', 'plain']`~~ — dropped. The rendered
      comparison the plan required first showed the two identical at default density, so PLAN.md's
      own open decision resolves to a straight deletion
- [x] ~~Add `data-ui-variant` to the `collapsible` registry entry~~ — dropped with the value set
- [x] Delete the `disclosure` component entry from the registry
- [x] ~~Merge the disclosure look into `collapsible.css` as a `[data-ui-variant='plain']` block~~ —
      nothing to merge; `collapsible.css` is unchanged at 104 lines
- [x] `.ui-collapsible > summary` already used `cursor: default`; `.ui-disclosure`'s `pointer` is
      gone with the file
- [x] Delete `packages/components/src/css/disclosure.css`
- [x] Remove `disclosure.css` from `packages/components/src/css/components.css`
- [x] Run `pnpm -F @timelessui/components run generate`
- [x] Delete `createDisclosure` from `packages/examples/src/primitives.html.ts`, and its row from
      the primitive coverage table
- [x] ~~Add a `variant` prop to `createCollapsible`~~ — dropped with the variant; a `name` prop was
      added instead for step 3
- [x] Delete the `disclosure` catalog entry and rewrite the `collapsible` entry's `guidance`
- [x] Delete `disclosure.stories.ts`; remove `disclosureCss` and the `Disclosure` domain entry from
      `css-primitives/shared.ts`, the `disclosure` mapping from `.storylite/config.ts`, and the
      assertion from `smoke.test.ts`
- [x] Confirm the compact-density assertion passes against `.ui-collapsible`
- [x] Confirm no `.ts`, `.css`, `.mdx`, or `.astro` file outside the milestone and research records
      mentions `ui-disclosure`

## 3. Native exclusive accordions

- [x] Test whether `<details name>` auto-close runs the `::details-content` height transition, and
      record the answer in `RESULTS.md`
- [x] Add a `name` prop to `createCollapsible` and emit it in the catalog example
- [x] Document exclusive accordions in the `collapsible` catalog `guidance` and in the contract's
      accessibility notes
- [x] Add a StoryLite story comparing an exclusive stack with an independent stack
- [x] Add an E2E assertion that opening the second panel closes the first
- [x] Run that assertion with `javaScriptEnabled: false`, which is the point of the step

## 4. Remove `ordered` from `listVariants`

- [x] Drop `'ordered'` from the `listVariants` set
- [x] Rewrite the `list` `data-ui-variant` description
- [x] Replace `list.css:15` with `ul.ui-list { list-style: none }`
- [x] Decide whether `list-style-position: inside` still applies — kept, see RESULTS.md
- [x] Convert the `data-ui-variant="ordered"` use in the List story to `<ol class="ui-list">`
      through a new `ordered` prop on `createList`
- [x] Confirm `<ol class="ui-list">` still renders its markers
- [x] Run `pnpm generate` then `pnpm -F @timelessui/components run contracts:validate`

## 5. Choice Group stops being a documented component

- [x] Confirm the `choiceGroup` and `choice` registry contracts are untouched
- [x] Move the plain-`<fieldset>` demonstration into the `checkbox-group` and `radio-group` catalog
      entries as a second example each
- [x] Delete the `choice-group` catalog entry
- [x] Delete the reciprocal `guidance` on all three, replacing it with one progressive-enhancement
      paragraph on each surviving page
- [x] Confirm `choice-group.css` is still in the `styles` array of both surviving entries
- [x] Confirm no MDX or Astro page links to `/docs/components/choice-group/`
- [x] Confirm the build emits no `choice-group` page and `contracts:validate` reports no
      `Undocumented CSS exports`
- [x] Rehome the `checkbox` and `radio` contracts, which the deleted entry was the only page to
      document

`choice-group.css` and `forms.css` were never duplicates. See RESULTS.md.

## 6. Tooltip: its own contract, and materially smaller

- [x] Split `popover.css`'s shared `[popover]` base into a floating frame and per-component boxes
- [x] Remove `overscroll-behavior` and `max-block-size` from the tooltip surface, and declare
      `overflow: visible` — the UA stylesheet gives every `[popover]` `overflow: auto`, so declaring
      nothing would have left it scrollable
- [x] Set the tooltip `max-inline-size` to `min(16rem, calc(100vw - 2rem))`, checked against the
      longest tooltip in the stories
- [x] Set the tooltip `line-height` to `1.35`
- [x] Add `--ui-shadow-tooltip` to both `tokens.css` and `src/tokens.ts`
- [x] Delete the redundant `box-shadow` re-declaration
- [x] Determine what the `!important` was for — it was defending against the stories' own demo
      stylesheet across a cascade layer, not against the base `p` rule. Removed, and fixed at source
- [x] Attempt a registry contract whose root is `ui-hover-card[variant='tooltip']` — it worked
- [x] Add the `tooltip` contract with its own parts, `apg: 'tooltip'`, and CSS variables, and
      repoint the `tooltip` catalog entry at it
- [x] No `ui-tooltip` element was added; the manifest still holds 18 elements
- [x] Add an E2E assertion on the tooltip surface's computed box against the hover card's
- [x] Add a side-by-side Tooltip / Hover Card story and review it in the browser

## 6b. Declare the CSS custom properties of the components this milestone touches

- [x] Declare the 7 `--ui-collapsible-*` properties on the merged contract
- [x] Declare the 3 `--ui-list-*` properties
- [x] Declare `--ui-tooltip-bg` and `--ui-tooltip-fg` on the new tooltip contract
- [x] Record the remaining count in RESULTS.md so a later milestone can take them
- [x] Confirm `pnpm generate` emits the declared variables into `contracts.ts` and that the
      generated reference page lists them

## 7. Publish the boundary

- [x] Create `apps/web/src/content/docs/docs/reference/scope.mdx` listing every component Timeless
      will not ship, with a reason per row, grouped by the reason
- [x] Record Date Picker as deferred pending milestone 022, not refused
- [x] Note that Command palette becomes a documented recipe once 022 lands
- [x] Link the page from the components index and from `README.md`
- [x] Confirm no validator was added for this page

## 8. Gates

- [x] `pnpm -F @timelessui/examples run test` — 45 canonical examples
- [x] Regenerate and commit `apps/stories/story-routes.json`
- [x] `pnpm -F @timelessui/components run generate:check`
- [x] `pnpm -F @timelessui/components run contracts:validate`
- [x] `pnpm -F @timelessui/components run manifest:validate`
- [x] `pnpm -F @timelessui/components run test`
- [x] `pnpm test:e2e` — 298 passed
- [x] Check the MDX, Astro, and README prose for stale Disclosure, Choice Group, and `ordered`
      references
- [x] `pnpm qa`
- [x] Record decisions, trade-offs, and results in RESULTS.md

---

Generated by Claude Opus 5 - High reasoning
