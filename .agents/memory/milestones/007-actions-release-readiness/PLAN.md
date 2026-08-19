---
status: Rejected
---

# Actions And Release Readiness Plan

Rejected. Most of this milestone was delivered under later numbers, and the remainder moved to
milestone 026. `RESULTS.md` maps every item to where it landed. Kept to respect sequential milestone
numbering, and left otherwise unedited as the static record of what was planned.

## Summary

- Finish the v1 interaction set and prepare the new packages and docs app for first publish.
- Treat `packages/components` as the source folder for the publishable `@timelessui/components`
  package.
- Keep postponed complex components out of the release unless a later accepted milestone changes
  scope.

## Components

- Segmented Control
- Copy Button / Clipboard

## Release Work

- Audit public exports, CSS exports, side effects, package metadata, README usage, and StoryLite
  docs.
- Add React JSX type support if the component event and attribute contracts are stable.
- Add Custom Elements Manifest generation or a checked-in manifest if needed for docs and editor DX.
- Confirm postponed items are documented: interactive Data Tables, Color Picker, Date Picker, Time
  Picker, and broader catalog additions.

## Contracts

- Segmented Control should use native buttons plus a hidden native input when a submitted value is
  needed.
- Copy Button should preserve native button semantics and emit a documented event after clipboard
  success or failure.
- Release docs must separate CSS-only, form, and progressive component usage.

## Acceptance

- `pnpm run test:full-qa` passes or any excluded checks are explicitly recorded.
- `pnpm -F @timelessui/core run publint` and `pnpm -F @timelessui/components run publint` pass.
- Package READMEs and `apps/stories` usage docs show install, CSS import, and define-entrypoint
  patterns.
