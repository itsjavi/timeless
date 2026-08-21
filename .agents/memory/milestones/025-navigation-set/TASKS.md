# Milestone 025 Tasks

> Revised before implementation, on 2026-08-21. This list was written before milestone 028 split
> every component stylesheet into `core/` and `themes/atmosphere/`, so its CSS tasks named
> `src/css/<component>.css` and an `@import` into `src/css/components.css`, a file that no longer
> exists. Each component now needs two stylesheets, two aggregate imports, and a `core:validate`
> pass, and a new element needs a `performance-baselines.json` entry and a `storyDomains` entry that
> did not exist as steps when this was planned. `PLAN.md` stays as written; this is the live list.

## 0. Baseline

- [ ] Confirm zero occurrences of `breadcrumb`, `pagination`, and `nav-menu` in `packages/` and
      `apps/*/src`, other than the unrelated string at `apps/web/src/scripts/not-found.ts:40`
- [ ] Confirm `aria-current` has exactly one occurrence (`menu.css:75`) and is written by no JS
- [ ] Confirm `validate-contracts.mjs`'s `IGNORED_SELECTOR_ATTRIBUTES` (`:23-37`) does not list
      `aria-current`
- [ ] Confirm the spacing ladder is `--ui-space-1..5` = 0.25, 0.375, 0.5, 0.75, 1rem
- [ ] Check whether milestone 021's "will not ship" page listed Breadcrumb or Pagination; correct it
      if so

## 1. Breadcrumb — CSS only

- [ ] Add a `breadcrumbSeparators` value set `['chevron', 'slash']` with a real type and module
- [ ] Add the
      `css('breadcrumb', 'ui-breadcrumb', ['core/breadcrumb.css', 'themes/atmosphere/breadcrumb.css'], …)`
      registry entry
- [ ] Declare `data-ui-separator` and `data-ui-density` (reusing `compactDensities`)
- [ ] Declare the `item`, `link`, and `current` parts — the separator is a pseudo-element, not a
      part
- [ ] Declare the `current` state with `state('current', 'aria', true, …)`
- [ ] Set `accessibility()` to the `<nav>` + `<ol>` + `aria-current="page"` composition, checked
      against `.agents/skills/verify-apg-conformance/SKILL.md`
- [ ] Write real descriptions for every field
- [ ] Create `src/css/core/breadcrumb.css` in the `ui.components` layer: `display`, and nothing
      cosmetic and no sizing, per `check-core-boundary.mjs`
- [ ] Create `src/css/themes/atmosphere/breadcrumb.css` for the look and every size
- [ ] Render the separator as generated content (`li + li::before` or `li:not(:last-child)::after`)
      in the **theme**, since the theme draws it and core has nothing to position without it
- [ ] Select `[aria-current='page']` for the current crumb
- [ ] Implement truncation with `min-inline-size: 0` and `text-overflow: ellipsis` on middle crumbs
      — `min-inline-size` is sizing, so it is the theme's
- [ ] Confirm every gap comes from `--ui-space-1..5`, and that any token a core rule reads carries a
      literal fallback
- [ ] Add the `@import` to **both** `src/css/core.css` and `src/css/themes/atmosphere.css`
- [ ] `pnpm -F @timelessui/components run core:validate`
- [ ] `pnpm -F @timelessui/components run generate`
- [ ] Re-export the generated array, union, and guard from the primitives module
- [ ] Add the export block to `src/index.ts`
- [ ] Write the example factory emitting the `<nav>` accessible name, the `<ol>`, and an unlinked
      final crumb with `aria-current="page"`
- [ ] Add the catalog entry with `group: 'Navigation'`, a deliberate `domain`, and complete
      `styles`: `tokens.css`, every `core/*` file, `themes/atmosphere/tokens.css`, then every theme
      file. `validate.mjs` rejects a theme file whose `core/` sibling or theme tokens are missing
- [ ] Add the story titled `Library/<Domain>/<Component>` matching the catalog domain and id
- [ ] Add `breadcrumb` to the `storyDomains` table in `apps/stories/.storylite/config.ts` — the
      title does not derive the route id, and without the entry the build fails on an
      implementation-oriented route
- [ ] Add the `apps/stories/src/smoke.test.ts` entry
- [ ] `pnpm -F @timelessui/components run contracts:validate`

## 2. Pagination — CSS only

- [ ] Add the
      `css('pagination', 'ui-pagination', ['core/pagination.css', 'themes/atmosphere/pagination.css'], …)`
      registry entry
- [ ] Reuse an existing `sm | md | lg` set for `data-ui-size`; do **not** declare a fourth one
- [ ] Declare the `item`, `link`, `previous`, `next`, and `ellipsis` parts — never `pager`, which
      milestone 022 owns for paging options
- [ ] Declare the `current` state, selected as `[aria-current='page']`
- [ ] Set `accessibility()` to the `<nav>` + list-of-links composition
- [ ] Write real descriptions for every field
- [ ] Create `src/css/core/pagination.css` and `src/css/themes/atmosphere/pagination.css`, reusing
      `.ui-group[data-ui-attached]` for the joined strip
- [ ] Render the boundary control as a non-link `<span>`, not an `aria-disabled` `<a>`
- [ ] Mark the ellipsis `aria-hidden` in the factory
- [ ] Give previous and next accessible names that describe them, not glyphs
- [ ] Add the `@import` to **both** aggregates, and run `core:validate`
- [ ] `pnpm generate`, re-export values, add the `src/index.ts` block
- [ ] Add the example factory, catalog entry with complete `styles`, story, `storyDomains` entry,
      and `smoke.test.ts` entry
- [ ] Confirm no `ui-pagination` **custom element** was added — page navigation is links
- [ ] `contracts:validate`

## 3. Navigation Menu — prototype first

- [ ] Build a `<nav>` composed from `ui-popover` triggers and evaluate whether it covers the
      shared-panel requirement
- [ ] Record the outcome and the reasoning in RESULTS.md either way
- [ ] **If composition suffices:** write a documented recipe, add no element, and stop here
- [ ] **If not:** add `ui-nav-menu` with `trigger`, `panel`, and `link` parts
- [ ] Manage `aria-expanded` on triggers and `aria-controls` to panels
- [ ] Open on hover with an intent delay and on focus
- [ ] Close on Escape and outside interaction via core's dismissable-layer controller
- [ ] Move between triggers without closing and reopening the panel
- [ ] Confirm no `role="menu"` and no arrow-key roving focus; `Tab` traverses the links
- [ ] State that rule explicitly in the contract and the docs
- [ ] Confirm the element writes no visual declarations and generates no elements
- [ ] Create `src/css/core/nav-menu.css` and `src/css/themes/atmosphere/nav-menu.css`, add both to
      the aggregates, and run `core:validate`
- [ ] Complete the element add sequence: `src/nav-menu.ts` + test, generate, value re-exports,
      `src/index.ts` block, `./nav-menu` subpath in `packages/components/package.json`, a
      `performance-baselines.json` entry from `performance:check -- --measure`, tag in
      `src/define.test.ts`, `preview-runtime.ts` loader, catalog entry, story, `storyDomains` entry,
      `smoke.test.ts` entry

## 4. Documentation

- [x] The component count in `apps/web/src/content/docs/docs/index.mdx` already interpolates from
      the catalog, so there is nothing to update — done ahead of this milestone
- [ ] Pick `domain` and `group` deliberately for all three, noting that `tabs` already sits in
      `domain: 'overlays'` with `group: 'Navigation'`
- [ ] `pnpm build:stories`, then commit the regenerated `apps/stories/story-routes.json`

## 5. Verification

- [ ] `no-javascript.spec.ts`: Breadcrumb and Pagination fully functional — every link navigable,
      current page marked, separator present. This is the primary test
- [ ] E2E: the breadcrumb separator is absent from the accessibility tree
- [ ] E2E: the final crumb is not a link and carries `aria-current="page"`
- [ ] E2E: pagination's ellipsis is `aria-hidden`; previous and next have descriptive names
- [ ] E2E: both `<nav>` landmarks have accessible names
- [ ] E2E: a deep breadcrumb at a narrow viewport keeps its first and last crumbs legible and does
      not scroll the page horizontally
- [ ] E2E (only if `ui-nav-menu` was added): hover-open with intent delay, focus-open, Escape,
      outside dismissal, trigger-to-trigger without flicker, no `role="menu"`, `Tab` traverses links
- [ ] `a11y.spec.ts` over the new routes
- [ ] `verify-apg-conformance` for each new component
- [ ] `pnpm -F @timelessui/components run contracts:validate` proves `aria-current` is both declared
      and selected
- [ ] `pnpm -F @timelessui/components run manifest:validate`
- [ ] `pnpm -F @timelessui/components run test`
- [ ] `pnpm build:packages` then `pnpm -F @timelessui/components run exports:validate`
- [ ] `pnpm -F @timelessui/components run generated-dom:check`
- [ ] `pnpm -F @timelessui/components run performance:check`
- [ ] `pnpm boundaries:check`
- [ ] `pnpm -F @timelessui/examples test`
- [ ] `pnpm -F @apps/web test`
- [ ] `pnpm qa`
- [ ] Name every CI-only gate that was run locally in RESULTS.md
- [ ] Record decisions, trade-offs, and results in RESULTS.md

---

Generated by Claude Opus 5 - High reasoning
