# Milestone 025 Tasks

> Revised before implementation, on 2026-08-21. This list was written before milestone 028 split
> every component stylesheet into `core/` and `themes/atmosphere/`, so its CSS tasks named
> `src/css/<component>.css` and an `@import` into `src/css/components.css`, a file that no longer
> exists. Each component now needs two stylesheets, two aggregate imports, and a `core:validate`
> pass, and a new element needs a `performance-baselines.json` entry and a `storyDomains` entry that
> did not exist as steps when this was planned. `PLAN.md` stays as written; this is the live list.

## 0. Baseline

- [x] Confirm zero occurrences of `breadcrumb`, `pagination`, and `nav-menu` in `packages/` and
      `apps/*/src`, other than the unrelated string at `apps/web/src/scripts/not-found.ts:40`
- [x] Confirm `aria-current` has exactly one occurrence (`menu.css:75`) and is written by no JS
- [x] Confirm `validate-contracts.mjs`'s `IGNORED_SELECTOR_ATTRIBUTES` (`:23-37`) does not list
      `aria-current`
- [x] Confirm the spacing ladder is `--ui-space-1..5` = 0.25, 0.375, 0.5, 0.75, 1rem
- [x] Check whether milestone 021's "will not ship" page listed Breadcrumb or Pagination; correct it
      if so — neither was listed, so nothing needed correcting

## 1. Breadcrumb — CSS only

- [x] Add a `breadcrumbSeparators` value set `['chevron', 'slash']` with a real type and module
- [x] Add the
      `css('breadcrumb', 'ui-breadcrumb', ['core/breadcrumb.css', 'themes/atmosphere/breadcrumb.css'], …)`
      registry entry
- [x] Declare `data-ui-separator` and `data-ui-density` (reusing `compactDensities`)
- [x] Declare the `item`, `link`, and `current` parts — the separator is a pseudo-element, not a
      part
- [x] Declare the `current` state with `state('current', 'aria', true, …)`
- [x] Set `accessibility()` to the `<nav>` + `<ol>` + `aria-current="page"` composition, checked
      against `.agents/skills/verify-apg-conformance/SKILL.md` — the APG **does** have a Breadcrumb
      pattern, so the slug is `breadcrumb` rather than the `null` the plan expected
- [x] Write real descriptions for every field
- [x] Create `src/css/core/breadcrumb.css` in the `ui.components` layer: `display`, and nothing
      cosmetic and no sizing, per `check-core-boundary.mjs`
- [x] Create `src/css/themes/atmosphere/breadcrumb.css` for the look and every size
- [x] Render the separator as generated content (`li + li::before` or `li:not(:last-child)::after`)
      in the **theme**, since the theme draws it and core has nothing to position without it
- [x] Select `[aria-current='page']` for the current crumb
- [x] Implement truncation with `min-inline-size: 0` and `text-overflow: ellipsis` on middle crumbs
      — `min-inline-size` is sizing, so it is the theme's
- [x] Confirm every gap comes from `--ui-space-1..5`, and that any token a core rule reads carries a
      literal fallback — core reads no token at all
- [x] Add the `@import` to **both** `src/css/core.css` and `src/css/themes/atmosphere.css`
- [x] `pnpm -F @timelessui/components run core:validate`
- [x] `pnpm -F @timelessui/components run generate`
- [x] Re-export the generated array, union, and guard from the primitives module
- [x] Add the export block to `src/index.ts`
- [x] Write the example factory emitting the `<nav>` accessible name, the `<ol>`, and an unlinked
      final crumb with `aria-current="page"`
- [x] Add the catalog entry with `group: 'Navigation'`, a deliberate `domain`, and complete
      `styles`: `tokens.css`, every `core/*` file, `themes/atmosphere/tokens.css`, then every theme
      file. `validate.mjs` rejects a theme file whose `core/` sibling or theme tokens are missing
- [x] Add the story titled `Library/<Domain>/<Component>` matching the catalog domain and id
- [x] Add `breadcrumb` to the `storyDomains` table in `apps/stories/.storylite/config.ts` — the
      title does not derive the route id, and without the entry the build fails on an
      implementation-oriented route
- [x] Add the `apps/stories/src/smoke.test.ts` entry
- [x] `pnpm -F @timelessui/components run contracts:validate`

## 2. Pagination — CSS only

- [x] Add the
      `css('pagination', 'ui-pagination', ['core/pagination.css', 'themes/atmosphere/pagination.css'], …)`
      registry entry
- [x] Reuse an existing `sm | md | lg` set for `data-ui-size`; do **not** declare a fourth one —
      `primitiveSizes`, since Pagination is a CSS-only primitive rather than a form control
- [x] Declare the `item`, `link`, `previous`, `next`, and `ellipsis` parts — never `pager`, which
      milestone 022 owns for paging options
- [x] Declare the `current` state, selected as `[aria-current='page']`
- [x] Set `accessibility()` to the `<nav>` + list-of-links composition — `pattern: null`, because
      unlike Breadcrumb the APG has no pagination pattern
- [x] Write real descriptions for every field
- [x] Create `src/css/core/pagination.css` and `src/css/themes/atmosphere/pagination.css`, reusing
      `.ui-group[data-ui-attached]` for the joined strip — Group supplies the collapsed gap and the
      stretched rows; the joined radii stay Pagination's, because Group joins the control classes it
      names and cannot see a `data-ui-part` a level further down. Recorded in RESULTS.md
- [x] Render the boundary control as a non-link `<span>`, not an `aria-disabled` `<a>`
- [x] Mark the ellipsis `aria-hidden` in the factory
- [x] Give previous and next accessible names that describe them, not glyphs
- [x] Add the `@import` to **both** aggregates, and run `core:validate`
- [x] `pnpm generate`, re-export values, add the `src/index.ts` block — nothing to add: the size set
      is `primitiveSizes`, already exported
- [x] Add the example factory, catalog entry with complete `styles`, story, `storyDomains` entry,
      and `smoke.test.ts` entry
- [x] Confirm no `ui-pagination` **custom element** was added — page navigation is links
- [x] `contracts:validate`

## 3. Navigation Menu — prototype first

- [x] Build a `<nav>` composed from `ui-popover` triggers and evaluate whether it covers the
      shared-panel requirement — built from `ui-hover-card` instead, because Popover forces
      `aria-haspopup="dialog"` onto the trigger and gives no hover intent
- [x] Record the outcome and the reasoning in RESULTS.md either way
- [x] **If composition suffices:** write a documented recipe, add no element, and stop here
- [ ] ~~**If not:** add `ui-nav-menu` with `trigger`, `panel`, and `link` parts~~ — not needed
- [ ] ~~Manage `aria-expanded` on triggers and `aria-controls` to panels~~ — Hover Card already does
- [ ] ~~Open on hover with an intent delay and on focus~~ — Hover Card already does
- [ ] ~~Close on Escape and outside interaction via core's dismissable-layer controller~~ — already
- [x] Move between triggers without closing and reopening the panel — resolved by delay, not by an
      element: `close-delay` shorter than `open-delay` hands the bar off cleanly
- [x] Confirm no `role="menu"` and no arrow-key roving focus; `Tab` traverses the links
- [x] State that rule explicitly in the contract and the docs — Menu's `guidance`, the scope page,
      the recipe's own prose, and an E2E assertion
- [x] Confirm the element writes no visual declarations and generates no elements — no element
      exists to check
- [ ] ~~Create `src/css/core/nav-menu.css` and `src/css/themes/atmosphere/nav-menu.css`~~ — the
      recipe reuses `core/popover.css`, `core/floating.css`, and the Atmosphere popover file
- [ ] ~~Complete the element add sequence~~ — no element was added
- [x] **Unplanned, and the finding that nearly reversed the decision:** tabbing from a Hover Card
      trigger into its surface closed the surface and dropped focus to the document, because only
      the trigger's `focusout` was wired. Fixed in `hover-card.ts` by mirroring the pointer handling
      with `focusin`/`focusout` on the content, with an E2E test and a contract note

## 4. Documentation

- [x] The component count in `apps/web/src/content/docs/docs/index.mdx` already interpolates from
      the catalog, so there is nothing to update — done ahead of this milestone
- [x] Pick `domain` and `group` deliberately for all three, noting that `tabs` already sits in
      `domain: 'overlays'` with `group: 'Navigation'` — both new components are
      `domain: 'navigation'`, `group: 'Navigation'`; the recipe is `domain: 'recipes'`
- [x] `pnpm build:stories`, then commit the regenerated `apps/stories/story-routes.json`
- [x] Add the Navigation Menu row to `/docs/reference/scope/` under "It is composition, not a
      component", and sync the README sentence that summarises that page
- [x] Fix `inlineCode` in `apps/web/src/lib/component-docs.ts` so `**strong**` and `*em*` in
      registry and catalog prose render as emphasis instead of printing asterisks

## 5. Verification

- [x] `no-javascript.spec.ts`: Breadcrumb and Pagination fully functional — every link navigable,
      current page marked, separator present. This is the primary test
- [x] E2E: the breadcrumb separator is absent from the accessibility tree
- [x] E2E: the final crumb is not a link and carries `aria-current="page"`
- [x] E2E: pagination's ellipsis is `aria-hidden`; previous and next have descriptive names
- [x] E2E: both `<nav>` landmarks have accessible names
- [x] E2E: a deep breadcrumb at a narrow viewport keeps its first and last crumbs legible and does
      not scroll the page horizontally
- [x] E2E for the recipe that replaced `ui-nav-menu`: hover-open with intent delay, focus-open,
      Escape, trigger-to-trigger handoff, no `role="menu"`, and `Tab` traversing the links with a
      dwell long enough to catch the panel closing under the user
- [x] E2E: both components stay laid out with no theme, in `core-only.spec.ts`
- [x] `a11y.spec.ts` over the new routes — 9 new routes, axe and the 320px reflow check
- [x] `verify-apg-conformance` for each new component
- [x] `pnpm -F @timelessui/components run contracts:validate` proves `aria-current` is both declared
      and selected
- [x] `pnpm -F @timelessui/components run manifest:validate`
- [x] `pnpm -F @timelessui/components run test`
- [x] `pnpm build:packages` then `pnpm -F @timelessui/components run exports:validate`
- [x] `pnpm -F @timelessui/components run generated-dom:check`
- [x] `pnpm -F @timelessui/components run performance:check`
- [x] `pnpm boundaries:check`
- [x] `pnpm -F @timelessui/examples test`
- [x] `pnpm -F @apps/web test`
- [x] `pnpm qa`
- [x] `pnpm build:site`, which is the only check on the internal links the breadcrumb example emits
- [x] `audit-component-contracts` over the diff
- [x] Name every CI-only gate that was run locally in RESULTS.md
- [x] Record decisions, trade-offs, and results in RESULTS.md

---

Generated by Claude Opus 5 - High reasoning
