# Rewrite Bootstrap Results

Status: Complete.

## Implemented

- Preserved the existing PoC by moving `packages/timeless-ui` to `packages/proof-of-concept`,
  renaming the package to private `@timelessui/poc`, and updating `apps/stories-poc`
  imports/dependencies.
- Added `packages/core` as publishable `@timelessui/core` with the initial thin authoring layer:
  `UIElement`, `defineElement`, element/attribute/watch/query/listen decorators, metadata storage,
  and unit coverage.
- Added `packages/components` as publishable `@timelessui/components` with explicit CSS exports,
  `@timelessui/core` as its only workspace dependency, and the initial Button contract/CSS.
- Added `apps/stories` as a clean StoryLite workbench with architecture notes, Button story, smoke
  tests, and no PoC dependency.
- Added follow-up milestone artifacts for the v1 component scope: `003-css-primitives`,
  `004-form-primitives`, `005-progressive-overlays`, `006-menus-select-combobox`, and
  `007-actions-release-readiness`.

## Notes

- The PoC package internals were not refactored. Its public API remains available through
  `@timelessui/poc` so `apps/stories-poc` can keep serving as the current reference workbench.
- The new components package intentionally starts with Button only. It uses `.ui-button`,
  `data-ui-variant`, and `data-ui-size`; it does not carry forward `[data-ui-button]`.
- Vitest unit tests for decorator behavior invoke decorators with standard decorator contexts
  instead of using decorator syntax directly, because the test runner parser does not currently
  accept that syntax in test files.

## Verification

- `pnpm install`
- `pnpm -F @timelessui/core run typecheck`
- `pnpm -F @timelessui/core run build`
- `pnpm -F @timelessui/core run test`
- `pnpm -F @timelessui/core run publint`
- `pnpm -F @timelessui/components run typecheck`
- `pnpm -F @timelessui/components run build`
- `pnpm -F @timelessui/components run test`
- `pnpm -F @timelessui/components run publint`
- `pnpm -F @apps/stories-poc run typecheck`
- `pnpm -F @apps/stories-poc run build`
- `pnpm -F @apps/stories-poc run test`
- `pnpm -F @apps/stories run typecheck`
- `pnpm -F @apps/stories run build`
- `pnpm -F @apps/stories run test`
- `pnpm run format:check`
