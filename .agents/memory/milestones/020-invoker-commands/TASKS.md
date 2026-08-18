# Milestone 020 Tasks

## Baseline and inventory

- [ ] Confirm milestone 019 is complete and the worktree is clean.
- [ ] Record the starting commit, package versions, and runtime in `RESULTS.md`.
- [x] Create `PLAN.md`, `TASKS.md`, and `RESULTS.md`.
- [ ] Confirm the repository still has zero `commandfor`, `command=`, and `CommandEvent` usage in
      `packages/*/src`, `apps/*/src`, and `apps/e2e` before any change lands.
- [ ] Record which trigger paths in `dialog.ts` and `sheet.ts` are pure click-to-target wiring and
      which carry focus, ARIA, or event-emission work that must survive.
- [ ] Confirm in a current Chromium, Firefox, and WebKit build that a disabled button dispatches no
      command, so the `isDisabledControl` guards are genuinely redundant on the authored path.

## Invoker detection helpers

- [ ] Add `src/invoker.ts` with `supportsInvokerCommands`, `authoredCommand`, and
      `hasAuthoredCommand`, mirroring the shape of `supportsNativePopover` in `src/popover.ts`.
- [ ] Export the built-in command names used by this milestone as a shared constant rather than
      repeating string literals in `dialog.ts` and `sheet.ts`.
- [ ] Make `authoredCommand` return null when `commandfor` is absent or empty, matching the platform
      behavior that `commandfor` without `command` is inert.
- [ ] Decide and record whether an authored but unrecognized command falls back to the click path or
      is left inert.
- [ ] Add `src/invoker.test.ts` covering both helpers against a fake window and fake elements.
- [ ] Re-export from `src/index.ts` and keep `check-exports.mjs` passing.
- [ ] Confirm the new module does not regress the performance baselines in
      `scripts/check-performance.mjs`.

## ui-dialog

- [ ] Thread `supportsInvokerCommands` through `DialogEnhancementOptions` and `enhance()` the way
      `supportsDialog` is already threaded.
- [ ] Extend the `enhanced` result with `triggerWiring` so the live path is assertable.
- [ ] Keep `enhanceDialogParts` writing only ARIA, and confirm it writes no invocation attribute to
      the trigger.
- [ ] Skip `handleTriggerClick` when the trigger authors `show-modal` against the dialog id.
- [ ] Skip close controls in `handleDialogClick` that author `close` or `request-close`.
- [ ] Add a `command` listener on the dialog that captures the focus-return target from
      `CommandEvent.source`, syncs `aria-expanded`, and runs `focusInitialDialogTarget`.
- [ ] Guard that listener so it ignores commands aimed at any other element.
- [ ] Confirm `handleDialogClose`, `handleDialogCancel`, and `syncDialogExpanded` still run on both
      paths.
- [ ] Extend `dialog.test.ts` to assert `triggerWiring` for the authored path, the unsupported-
      feature path, and the plain-markup path.

## ui-sheet

- [ ] Mirror the dialog changes across `handleTriggerClick`, `handlePanelClick`, and
      `enhanceSheetParts`.
- [ ] Gate only the open path on `modal`, since `modal` defaults to false and non-modal opening uses
      `panel.show()`, for which no built-in command exists.
- [ ] Keep authored `close` and `request-close` available on non-modal sheets, which the platform
      supports including `returnValue`.
- [ ] Map `CommandEvent.source` to the existing `SheetEventSource` `'trigger'` value so `ui-open`,
      `ui-close`, and `ui-dismiss` details are unchanged.
- [ ] Confirm backdrop light-dismiss and `syncSheetModal` are untouched.
- [ ] Extend `sheet.test.ts` for the modal authored path and the non-modal listener path.

## Contracts and examples

- [ ] Document the authored-command convention on the dialog and sheet `trigger` and `close` parts
      in `src/contracts.ts`.
- [ ] Re-run `pnpm -F @timelessui/components run generate` and keep `generate:check`,
      `validate-contracts.mjs`, and `validate-manifest.mjs` green.
- [ ] Author `commandfor` and `command="show-modal"` on the dialog trigger and `command="close"` on
      the close controls in `createDialog`, using the `id` the factory already takes.
- [ ] Give the dialog's confirm control a `value` so the example demonstrates native `returnValue`
      propagation.
- [ ] In `createSheet`, emit `command="show-modal"` only when `props.modal` is set, so a non-modal
      sheet is never opened modally by the platform behind the retained click listener.
- [ ] Confirm the sheet story's `modal: false` control still opens a non-modal sheet, and the
      `modal: true` control uses the authored path.
- [ ] Confirm the copyable source contains no `data-ui-internal-*` and no generated ids.
- [ ] Confirm `@timelessui/examples` and the StoryLite stories still type-check and build, and that
      the dialog and sheet stories need no markup of their own because
      `apps/stories/src/stories/overlays.html.ts` re-exports the examples package.

## Documentation

- [ ] Move `Invoker Commands` from `planned` to `proofs` in `apps/web/scripts/validate-claims.mjs`.
      The script fails the build by design as soon as `commandfor` or `CommandEvent` appears in the
      library source while the claim is still marked planned, so this cannot be deferred.
- [ ] Replace the landing-page tin copy in `apps/web/src/pages/index.astro` with what Timeless
      actually does, in the same voice as the sibling tins.
- [ ] Replace the "Invoker Commands are next: milestone 020 will..." paragraph in `README.md` with
      the feature in the Baseline 2025 list above it.
- [ ] Delete the "Invoker Commands are not wired up yet" paragraph from
      `docs/reference/browser-support.mdx`, and rewrite the progressive-features row so the click
      listener reads as the fallback rather than as how every trigger works today.
- [ ] Put the authored-markup explanation in the `guidance` field of the `dialog` and `sheet`
      entries in `packages/examples/src/catalog.ts`, since those component pages have no MDX file.
- [ ] Document that a non-modal sheet cannot be opened declaratively, and why, in the same place.
- [ ] Document that the authored path requires an author-supplied `id`, so generated ids are not
      available for invoked elements.
- [ ] Confirm the dialog and sheet reference pages render the new guidance and the updated part
      descriptions, and that `apps/e2e/tests/apps/web/component-reference.spec.ts` still passes.
- [ ] Search the site and README for any remaining sentence that describes invoker commands as
      planned, unwired, or upcoming.

## Verification and completion

- [ ] Run `pnpm -F @timelessui/components run test` and `pnpm -F @timelessui/core run test`.
- [ ] Extend `no-javascript.spec.ts` to prove the dialog opens and closes with scripting disabled.
- [ ] Add a `returnValue` assertion proving native value propagation matches the previous JS
      behavior.
- [ ] Confirm the existing dialog and sheet cases in `overlays.spec.ts` pass unchanged, including
      `aria-expanded` sync and focus return to the trigger.
- [ ] Add a dialog-invoker case to `platform.spec.ts` so the Firefox and WebKit projects cover it.
- [ ] Record whether that case exercised the authored path or the fallback on each engine.
- [ ] Run `pnpm boundaries:check` and `pnpm publint`.
- [ ] Run the website build so `validate-claims.mjs` proves the landing-page claim against the
      library source.
- [ ] Run the full gate: `pnpm qa`.
- [ ] Manually confirm the fallback in a Safari older than 26.2, or record that none was available.
- [ ] Answer whether a `commandfor` popover invoker receives implicit `aria-expanded`, and record
      the consequence for a future `ui-menu-button` and `ui-select` migration.
- [ ] Record decisions, trade-offs, and results in `RESULTS.md`.
