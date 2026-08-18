# Milestone 020 Results

## Baseline

- Starting commit: `698e5d900a46d8f9e2612c7e64b5edb49b238559`.
- Starting package version: `0.0.1` for `@timelessui/components` and `@timelessui/core`.
- Runtime: Node 24.19.0 with the repository-declared pnpm 11.22.0.
- `packages/*/src`, `apps/*/src`, and `apps/e2e` contain zero occurrences of `commandfor`,
  `command=`, `CommandEvent`, and `commandForElement`. Nothing in the library uses the Invoker
  Commands API today.
- The only declarative invocation anywhere in the library is `popover.ts:183`, which writes
  `popovertarget` during enhancement. `ui-popover` has no click listener at all and is the model the
  rest of the overlay components do not follow.
- `ui-menu-button`, `ui-select`, and `ui-menu` set `popover="auto"` on their content and then
  re-implement toggling with `showPopover()` and `hidePopover()` behind a click listener.
- `dialog.ts` is 292 lines. Its trigger is wired only by `@listen('click')`, so the trigger does
  nothing until the bundle executes. `handleDialogClick` extracts the close button's `value` by hand
  to pass as `dialog.close(value)`.
- `sheet.ts` is 407 lines and repeats that structure, plus hand-rolled backdrop light-dismiss.
- `modal` on `ui-sheet` is a `@boolAttr` defaulting to false, and the non-modal open path calls
  `panel.show()`.
- Helper duplication in `packages/components/src` that this milestone touches the edges of: five
  copies of `supportsNativePopover`, two of `supportsNativeDialog`, two of `isDisabledControl`, and
  four of `closestOwnedElement`.
- `apps/e2e/tests/apps/stories/no-javascript.spec.ts` is a single 12-line test covering a
  performance fixture's native input. No overlay is currently tested with scripting disabled.
- The landing page tin at `apps/web/src/pages/index.astro:78-80` reads "A new way to define
  declarative behavior for UI components" under a section introduced as "Built with the browser
  features Timeless is meant to preserve, not replace".
- The documentation names this milestone by number in three places, all of which have to be
  retracted when it lands. `README.md:33` says "Invoker Commands are next: milestone 020 will move
  overlay triggers onto `command` and `commandfor`". `docs/reference/browser-support.mdx` (moved out
  of `getting-started/`) carries an Invoker Commands row in the progressive-features table plus the
  paragraph "**Invoker Commands are not wired up yet.**". And `apps/web/scripts/validate-claims.mjs`
  lists the claim in its `planned` map against milestone `020` with the proof pattern
  `/commandfor|CommandEvent/`.
- That script is a build gate, not a note: it fails with "is now implemented; move it from planned
  to proofs" the moment the pattern matches `packages/*/src`. The documentation change is therefore
  forced to land in the same commit as the implementation.
- Dialog and sheet have no component MDX file. Their page prose comes from `guidance` on the catalog
  entries in `packages/examples/src/catalog.ts` and from the part descriptions in
  `src/contracts.ts`, so component documentation for this milestone is written in the library, not
  in `apps/web`.
- `apps/stories/src/stories/overlays.html.ts` is a single re-export of
  `@timelessui/examples/overlays`, and the reference pages render the same factories, so the example
  markup change updates the StoryLite copy surface and the website at once.
- `createSheet` takes `modal` as a boolean prop and the sheet story exposes it as a boolean control,
  so the non-modal case that cannot use an authored open command is one click away in the catalog.

## Platform behavior confirmed before planning

Verified by direct execution in Chrome 148 rather than taken from documentation, because the
specification text and MDN were incomplete on several of these points:

- A `<button>` carrying both `command` and `commandfor` is not a submit button; its `type` resolves
  to `button`, so it is safe inside a form.
- `command="close"` propagates the button's `value` to `dialog.returnValue`.
- `close` and `request-close` both work on a non-modal dialog opened with `show()`, and carry
  `returnValue`. Only the open path lacks a non-modal command.
- `request-close` fires `cancel` and is blocked by `preventDefault()` on that event.
- `CommandEvent` is `cancelable: true`, `bubbles: false`, and exposes `source` as the invoking
  button. `preventDefault()` blocks built-in commands, not just custom ones.
- `commandfor` and `popovertarget` on the same button do not stack. One click produces one toggle,
  so the existing `popover.ts` wiring cannot double-fire against an authored command.
- `commandfor` without `command` is inert, only `<button>` acts as an invoker, and a command
  mismatched to its target no-ops instead of throwing.
- Feature support is detectable as `'command' in HTMLButtonElement.prototype`.
- Baseline newly available since 2025-12-12: Chrome 135 (2025-04-01), Firefox 144 (2025-10-14),
  Safari 26.2 (2025-12-12). Projected widely available 2028-06-12.

## Open decisions

- Whether an authored but unrecognized command, such as a misspelling, should fall back to the click
  path or be left inert. Falling back is more forgiving but makes the two paths observably
  different; leaving it inert matches the platform but fails silently.
- Whether `supportsInvokerCommands` belongs in `packages/components/src/invoker.ts` as planned, or
  should be hoisted into `packages/core` together with the five existing copies of
  `supportsNativePopover` and two of `supportsNativeDialog`. The plan keeps it in `components` to
  avoid widening scope, at the cost of adding one more detection site.
- Whether a non-modal `ui-sheet` should keep declarative close controls while its trigger stays on
  the click path. This is supported by the platform but leaves one component half-declarative, which
  is harder to document than a uniform rule.
- Whether `aria-expanded` on a modal dialog trigger is correct at all, given that the APG dialog
  pattern does not use it. `syncDialogExpanded` is preserved unchanged by this milestone, so the
  question is recorded rather than acted on.

## Decisions and constraints

Pending implementation.

## Summary

Pending implementation.

## Validation results

Pending implementation.
