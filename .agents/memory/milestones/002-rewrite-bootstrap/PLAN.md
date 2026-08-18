# Timeless UI Rewrite Bootstrap Plan

## Summary

- Keep `apps/stories-poc` as the current PoC StoryLite app.
- Rename `packages/timeless-ui` to `packages/proof-of-concept` and rename its package to private
  `@timelessui/poc`.
- Add `apps/stories` as the clean StoryLite workbench for the rewrite, with no PoC dependency.
- Add `packages/core` as publishable `@timelessui/core`, the thin Web Components authoring layer.
- Add `packages/components` as publishable `@timelessui/components`, the new CSS-first component
  package.
- Start the new components package with Button only.
- As part of this bootstrap, write separate follow-up milestones under `.agents/memory/milestones/`
  for implementing the full v1 component set.

## Key Changes

- PoC preservation:
  - Move `packages/timeless-ui` to `packages/proof-of-concept`.
  - Rename package to `@timelessui/poc`, mark it private, and keep its current API intact.
  - Update `apps/stories-poc` dependency/imports from `timeless-ui` to `@timelessui/poc`.
  - Do not refactor PoC internals.

- `apps/stories`:
  - Copy `apps/stories-poc`, then strip old component stories and all PoC usage.
  - Keep StoryLite config, branding, preview setup, shared docs styling, escaping helpers, and
    smoke-test pattern.
  - Add architecture/usage docs and a Button story consuming the new components CSS.
  - Use package name `@apps/stories` and distinct dev/preview ports.

- `@timelessui/core`:
  - ESM-only, MIT, publishable, no runtime dependencies.
  - Build with `tsdown`, declarations, sourcemaps, and `publint`.
  - Export `UIElement`, `defineElement`, `element`, `attr`, `boolAttr`, `numberAttr`, `watch`,
    `query`, `queryAll`, and `listen`.
  - Implement tested helpers plus modern `accessor` decorators; decorators store metadata but never
    auto-register elements.

- `@timelessui/components`:
  - ESM-only, MIT, publishable, depends on `@timelessui/core: workspace:*`.
  - Use side-effect-free root exports and explicit CSS exports.
  - Export `css/tokens.css`, `css/button.css`, and `css/components.css`.
  - Add Button as `.ui-button` plus `data-ui-variant` and `data-ui-size`; do not support
    `[data-ui-button]` in the new package.
  - Export Button public types such as `ButtonVariant` and `ButtonSize`.

## Milestone-Writing Deliverable

- During this bootstrap, create follow-up milestone folders under `.agents/memory/milestones/` using
  the `.agents/memory/README.md` rules.
- Treat `.agents/memory/milestones/002-rewrite-bootstrap` as the bootstrap milestone and ensure it
  has `PLAN.md`, `TASKS.md`, and `RESULTS.md`.
- Write the future component milestones as separate planning artifacts, not as definitions embedded
  in this bootstrap plan.
- The follow-up milestone set must cover the complete v1 component scope from the user-approved
  focus list: CSS-only primitives, form styling primitives, progressive Web Component components,
  and explicitly postponed complex components.
- Each follow-up milestone must include `PLAN.md`, `TASKS.md`, and `RESULTS.md`, with pending
  implementation records where work has not started.
- The milestone docs should define sequencing, dependencies, public contracts, docs expectations,
  and acceptance checks for their own slice.

## Test Plan

- Preserve current staged/unstaged user edits before making changes.
- After bootstrap implementation run:
  - `pnpm install`
  - `pnpm -F @timelessui/core run typecheck && pnpm -F @timelessui/core run build && pnpm -F @timelessui/core run test`
  - `pnpm -F @timelessui/components run typecheck && pnpm -F @timelessui/components run build && pnpm -F @timelessui/components run test && pnpm -F @timelessui/components run publint`
  - `pnpm -F @apps/stories-poc run typecheck && pnpm -F @apps/stories-poc run build && pnpm -F @apps/stories-poc run test`
  - `pnpm -F @apps/stories run typecheck && pnpm -F @apps/stories run build && pnpm -F @apps/stories run test`
  - `pnpm run format:check`

## Assumptions

- `@timelessui/poc` is private and exists only to keep the old PoC app usable.
- New packages are the future publishable packages and must not import PoC code.
- `apps/stories` is the documentation/workbench for the new architecture and consumes only the new
  packages.
- The exact follow-up milestone breakdown belongs in the new `.agents/memory/milestones/*` artifacts
  created during implementation, not in this bootstrap plan.
