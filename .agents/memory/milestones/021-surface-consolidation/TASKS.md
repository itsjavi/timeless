# Milestone 021 Tasks

## 1. One capability module

- [ ] Create `packages/components/src/capabilities.ts` exporting `supportsNativePopover(win)` and
      `supportsNativeDialog(win)`, lifted verbatim from the existing copies
- [ ] Create `packages/components/src/capabilities.test.ts` covering both against a fake window with
      and without the feature
- [ ] Delete the private copy in `combobox.ts` and import from `capabilities.ts`
- [ ] Delete the private copy in `hover-card.ts` and import from `capabilities.ts`
- [ ] Delete the private copy in `menu-button.ts` and import from `capabilities.ts`
- [ ] Delete the private copy in `popover.ts` and import from `capabilities.ts`
- [ ] Delete the private copy in `select.ts` and import from `capabilities.ts`
- [ ] Delete the `supportsNativeDialog` copy in `dialog.ts` and import from `capabilities.ts`
- [ ] Delete the `supportsNativeDialog` copy in `sheet.ts` and import from `capabilities.ts`
- [ ] Confirm `grep -c "function supportsNative" packages/components/src/*.ts` reports exactly one
      file with two matches
- [ ] If milestone 020 has landed, move **only** `supportsInvokerCommands` into `capabilities.ts`
      and have `invoker.ts` re-export it — do **not** delete it. 020 exports it from `src/index.ts`,
      so it is public, and a public export may not change module
- [ ] Confirm `authoredCommand`, `hasAuthoredCommand`, and the command-name constants stay in
      `invoker.ts`
- [ ] Confirm `exports:validate` still resolves every name 020 added to `src/index.ts`
- [ ] Run `pnpm -F @timelessui/components run test` and confirm every existing
      `supportsPopover: false` and `supportsDialog: false` fallback test passes unchanged
- [ ] Run `pnpm -F @timelessui/components run exports:validate`

## 2. Collapsible absorbs Disclosure

- [ ] Capture the baseline: line counts of `disclosure.css` and `collapsible.css`, and a rendered
      screenshot of each at default and compact density
- [ ] Write a failing assertion proving `.ui-disclosure[data-ui-density='compact']` does not change
      the trigger height on `main`
- [ ] Add a `collapsibleVariants` value set `['panel', 'plain']` to `valueSets` with
      `module: 'primitives'`
- [ ] Add `data-ui-variant` to the `collapsible` registry entry referencing that set, default
      `panel`, with a real description
- [ ] Delete the `disclosure` component entry from the registry
- [ ] Merge the disclosure look into `collapsible.css` as a `[data-ui-variant='plain']` block, using
      root-declared custom properties only
- [ ] Change `.ui-collapsible > summary` to `cursor: default`
- [ ] Delete `packages/components/src/css/disclosure.css`
- [ ] Remove `disclosure.css` from `packages/components/src/css/components.css` if aggregated there
- [ ] Run `pnpm -F @timelessui/components run generate`
- [ ] Delete `createDisclosure` from `packages/examples/src/primitives.html.ts`
- [ ] Add a `variant` prop to `createCollapsible`
- [ ] Delete the `disclosure` catalog entry and rewrite the `collapsible` entry's `guidance`
- [ ] Fold the disclosure story into `collapsible.stories.ts` as a variant comparison; delete any
      standalone disclosure story file
- [ ] Confirm the compact-density assertion now passes against `.ui-collapsible`
- [ ] Confirm
      `grep -ri "disclosure" packages/ apps/ --include="*.ts" --include="*.css" --include="*.mdx" --include="*.astro"`
      returns nothing outside milestone records

## 3. Native exclusive accordions

- [ ] Test whether `<details name>` auto-close runs the `::details-content` height transition, and
      record the answer in `RESULTS.md`
- [ ] Add a `name` prop to `createCollapsible` and emit it in the example markup
- [ ] Document exclusive accordions in the `collapsible` catalog `guidance` and in the contract's
      accessibility notes
- [ ] Add a StoryLite story comparing an exclusive stack with an independent stack
- [ ] Add an E2E assertion that opening the second panel closes the first
- [ ] Add the same assertion to `apps/e2e/tests/apps/stories/no-javascript.spec.ts`

## 4. Remove `ordered` from `listVariants`

- [ ] Drop `'ordered'` from the `listVariants` set
- [ ] Rewrite the `list` `data-ui-variant` description, which currently documents the inert case as
      the intended use
- [ ] Replace `list.css:15` with `ul.ui-list { list-style: none }`
- [ ] Decide whether `list-style-position: inside` at `list.css:12` still applies now that only
      `<ol>` shows markers, and record the decision
- [ ] Convert every `data-ui-variant="ordered"` use in examples, stories, and MDX to
      `<ol class="ui-list">`
- [ ] Confirm `<ol class="ui-list">` still renders its markers under `divided` and `inset`
- [ ] Run `pnpm generate` then `pnpm -F @timelessui/components run contracts:validate`

## 5. Choice Group stops being a documented component

- [ ] Confirm the `choiceGroup` and `choice` registry contracts are untouched
- [ ] Move the plain-`<fieldset>` no-JavaScript demonstration into the `checkbox-group` catalog
      entry as a second example
- [ ] Delete the `choice-group` catalog entry
- [ ] Delete the reciprocal `guidance` on `choice-group`, `checkbox-group`, and `radio-group`,
      replacing it with one sentence about progressive enhancement on the surviving pages
- [ ] Confirm `choice-group.css` is still in the `styles` array of both surviving entries
- [ ] Grep the MDX and Astro pages for `/docs/components/choice-group/` and fix any link
- [ ] Confirm `contracts:validate` does not report `Undocumented CSS exports`

## 6. Tooltip: its own contract, and materially smaller

- [ ] Split `popover.css`'s shared `[popover]` base into a floating-surface group and per-component
      boxes
- [ ] Remove `overflow`, `overscroll-behavior`, and `max-block-size` from the tooltip surface
- [ ] Set the tooltip `max-inline-size` against the longest tooltip in the stories, targeting
      `min(16rem, calc(100vw - 2rem))`
- [ ] Set the tooltip `line-height` near `1.35`
- [ ] Decide the tooltip shadow: a new `--ui-shadow-tooltip` token or none. If a token is added, add
      it to both `tokens.css` and `src/tokens.ts`
- [ ] Delete the redundant `box-shadow` re-declaration at `popover.css:55`
- [ ] Determine what the `!important` at `popover.css:128-130` is for; remove it if source order
      already wins, and record the finding either way
- [ ] Attempt a registry contract whose root is `ui-hover-card[variant='tooltip']`
- [ ] If the qualified root works: add the `tooltip` contract with its own parts, `apg: 'tooltip'`,
      and CSS variables, and repoint the `tooltip` catalog entry at it
- [ ] If it does not work: keep Tooltip as a Hover Card variant, do **not** add a `ui-tooltip`
      element, and record why in `RESULTS.md`
- [ ] Add an E2E assertion on the tooltip surface's computed `max-inline-size`, `padding`, and
      `overflow`
- [ ] Add a side-by-side Tooltip / Hover Card story and capture a screenshot for review

## 6b. Declare the CSS custom properties of the components this milestone touches

Only **3 of 53** contracts declare any CSS custom property today (`button` 13, `range` 2, `toaster`
2), while the stylesheets define many. Fix the ones in scope here; the rest is a later milestone's
work.

- [ ] Declare the 7 `--ui-collapsible-*` properties defined at `collapsible.css:3-9` on the merged
      contract, or inline the ones that are not meant to be public
- [ ] Declare the 3 `--ui-list-*` properties defined at `list.css:3-5`, or inline them
- [ ] Declare `--ui-tooltip-bg` and `--ui-tooltip-fg` (`popover.css:46-47`), or rename them
      `--ui-internal-*` to say they are not public API
- [ ] Record the full count (50 of 53 contracts with zero declared variables) in RESULTS.md so a
      later milestone can take the remaining ones
- [ ] Confirm `pnpm generate` emits the declared variables into `contracts.ts` and that the
      generated reference page lists them

## 7. Publish the boundary

- [ ] Create the reference MDX page listing every component Timeless will not ship, with a reason
      per row
- [ ] Record Date Picker as deferred pending milestone 022, not refused
- [ ] Note that Command palette becomes a documented recipe once 022 lands
- [ ] Link the page from the components index and from `README.md`
- [ ] Confirm no validator was added for this page

## 8. Gates

- [ ] `pnpm -F @timelessui/examples run test` — the catalog gate at
      `packages/examples/scripts/validate.mjs`, which throws on 17 conditions including
      `uses unknown part`, `uses unknown public attribute`, `uses uncatalogued public class`, and
      `authors private runtime hook`. Removing a contract or a value makes every example that still
      references it fail here
- [ ] Regenerate and commit `apps/stories/story-routes.json` after the story changes, so the axe
      sweep in `apps/e2e/tests/apps/stories/a11y.spec.ts` runs against the current route list
- [ ] `pnpm -F @timelessui/components run generate:check`
- [ ] `pnpm -F @timelessui/components run contracts:validate`
- [ ] `pnpm -F @timelessui/components run manifest:validate`
- [ ] `pnpm -F @timelessui/components run test`
- [ ] `pnpm test:e2e`
- [ ] Run `audit-docs-drift` for stale Disclosure, Choice Group, and `ordered` references
- [ ] `pnpm qa`
- [ ] Record decisions, trade-offs, and results in RESULTS.md

---

Generated by Claude Opus 5 - High reasoning
