# Rewrite Bootstrap Tasks

- [x] Preserve the existing PoC app by moving `packages/timeless-ui` to `packages/proof-of-concept`.
- [x] Rename the PoC package to private `@timelessui/poc`.
- [x] Update `apps/stories-poc` to consume `@timelessui/poc`.
- [x] Create `@timelessui/core` with build, typecheck, publint, tests, and initial authoring
      helpers.
- [x] Create `packages/components` as `@timelessui/components` with build, typecheck, publint,
      tests, CSS exports, and Button.
- [x] Create `apps/stories` as a clean StoryLite workbench using only the new packages.
- [x] Write follow-up milestone folders for the full v1 component scope.
- [x] Run package and app acceptance checks.
