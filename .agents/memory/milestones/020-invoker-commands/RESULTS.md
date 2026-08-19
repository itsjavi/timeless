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

## Platform behavior confirmed during implementation

Verified in the Playwright builds used by the suite — Chromium 151, Firefox 153, WebKit 26.5 — all
of which ship Invoker Commands, so every engine in CI exercises the authored path rather than the
fallback:

- A microtask queued from a `command` listener resolves **before** the platform runs the command.
  The first probe suggested otherwise, but it clicked from inside an `evaluate` call, which keeps
  the JavaScript stack non-empty and defers the microtask checkpoint past the whole activation
  behavior. Under a real click the stack empties as soon as the listener returns, the checkpoint
  runs immediately, and the dialog is still closed. `command` therefore cannot carry any post-open
  work, which is what the plan assumed it would.
- `<dialog>` fires `toggle` with `newState: "open"` after the state change on all three engines, and
  every engine that shipped Invoker Commands had already shipped dialog toggle events, so the
  authored path can depend on it without widening the support floor for the click path.
- A `disabled` invoker dispatches no command on any engine, so that half of `isDisabledControl` is
  genuinely redundant on the authored path. An `aria-disabled="true"` invoker **does** dispatch, and
  does open the dialog. Timeless has always treated `aria-disabled` as inert on the click path, so
  the divergence had to be closed explicitly.
- Answering the question the plan left open: a `commandfor` popover invoker receives implicit
  `expanded` in the accessibility tree exactly as a `popovertarget` invoker does — both report
  `expanded: false` closed and `true` open in the Chromium AX tree, and neither writes a DOM
  `aria-expanded` attribute. So a future `ui-menu-button` or `ui-select` migration to `commandfor`
  would be no worse than the current wiring on this axis: the explicit mirroring is droppable for
  both wirings or for neither. Dialog invokers get nothing implicit either way, so
  `syncDialogExpanded` and `syncSheetExpanded` stay.

## Decisions taken on the open questions

- **An authored but unrecognized command falls back to the click path.** `hasAuthoredCommand` is a
  positive test against a listed set, so a misspelling or a command aimed at the wrong kind of
  target reads as no authored command at all. The platform no-ops on that markup, so standing down
  as well would leave a dead trigger.
- **`supportsInvokerCommands` stays in `packages/components/src/invoker.ts`**, not hoisted into
  `packages/core` with the existing `supportsNativePopover` copies. Consolidating detection is worth
  doing, but as its own change.
- **A non-modal sheet keeps declarative close controls while its trigger stays on the click path.**
  The asymmetry is real but it follows from the platform: `close` and `request-close` work on a
  non-modal `<dialog>`, and no built-in command opens one. Documented on the Sheet page rather than
  smoothed over.
- **`aria-expanded` on a modal dialog trigger is unchanged.** The APG dialog pattern does not use
  it; this milestone preserves the existing behavior and leaves the question open.

## Decisions and constraints

- **Timeless reads `command` and `commandfor`; it never writes them.** Enhancement adds only ARIA.
  Writing the invocation would put the trigger back behind the bundle, which is the entire problem
  the milestone exists to remove.
- **`toggle` carries the post-open work, `command` only the focus-return target.** The command
  handler runs before the dialog opens, so it can only read where focus was at invocation — which is
  exactly what it needs, and nothing more. `aria-expanded` and initial focus wait for `toggle`.
- **The click path was left untouched and does its work synchronously.** It does not depend on
  `toggle`, so it keeps working below the toggle-event floor. A private `#openedByCommand` flag,
  cleared by `openDialog`/`openSheet` and on close, keeps the toggle handler from repeating work the
  click path already did.
- **An authored `show-modal` wins the trigger even on a non-modal sheet.** This departs from the
  plan, which gated the authored path on `modal`. The platform runs `showModal()` on the target
  whatever `ui-sheet` intended, and the click listener runs first, so gating on `modal` would call
  `show()` and then let the platform call `showModal()` on an already-open non-modal dialog — which
  throws `InvalidStateError`. Standing down is the only safe response. `createSheet` still emits
  `show-modal` only when `modal` is set, so the catalog never produces that markup.
- **The command handler cancels an `aria-disabled` invocation.** One `preventDefault()` keeps the
  two paths indistinguishable, which is the property the whole design rests on.
- **Sheet events are identical on both paths.** A close command sets the close source and emits
  `ui-dismiss` before the platform closes, matching the order `dismissAndClose` produces. A
  `#commandDismiss` flag stops `handleCancel` from relabelling a `request-close` button as an Escape
  dismissal. Known limitation: if a consumer cancels the `CommandEvent` for a close command, the
  `ui-dismiss` has already been emitted and the close source stays `close` until the next close. The
  speculative correction for it was removed once the microtask ordering above was understood — it
  would have run while the panel was still open and reset the source before `handleClose` read it.
- **The reference pages gained an `authoring` field rather than reusing `guidance`.** The plan said
  to put the explanation in `guidance`, but that field renders under a hardcoded "Choosing between
  components" aside and every other entry is a sibling-component comparison. Authoring instructions
  under that heading would be wrong, so the catalog entry now has a separate optional `authoring`
  note rendered as its own aside.
- **`supportsInvokerCommands` is a required option** on `DialogEnhancementOptions` and
  `SheetEnhancementOptions`, matching how `supportsDialog` is threaded. Both packages are
  unpublished, so the pure-function signature change costs nothing downstream.
- **This change adds code.** Roughly 300 net lines across the library, because the click paths stay
  as the fallback. They can only be deleted when the support floor rises past Invoker Commands,
  projected widely available 2028-06-12.

## Summary

- New `packages/components/src/invoker.ts` (90 lines) plus `invoker.test.ts`: feature detection,
  authored-attribute reading, command and toggle event readers, and the three built-in command
  names. Exported from `src/index.ts`.
- `dialog.ts` and `sheet.ts` each gained a `supportsInvokerCommands` option, a
  `triggerWiring: 'authored' | 'listener'` field on the enhanced result, an early return from the
  trigger and close-control click paths when the markup authors a matching command, and `command`
  plus `toggle` listeners on the panel.
- `createDialog` authors `show-modal` on the trigger and `close` with a `value` on both footer
  buttons. `createSheet` authors `close` on every close control and `show-modal` on the trigger only
  when `modal` is set. These factories feed the StoryLite copy surface and the reference pages at
  once, so no story file needed its own markup.
- The registry documents the convention on the dialog and sheet `trigger`, `panel`, and `close`
  parts, and the catalog carries an `authoring` note on both component pages.
- `Invoker Commands` moved from `planned` to `proofs` in `validate-claims.mjs`; the `planned` map is
  now empty. The landing-page tin, `README.md`, and `docs/reference/browser-support.mdx` describe
  what the library does instead of what it intends to do.

## Validation results

- `pnpm qa` green: typecheck, `format:check`, build, unit tests, `publint`, `attw`, and 294 e2e
  tests. `boundaries:check`, `exports:validate`, `performance:check`, and `generated-dom:check` pass
  separately; the new module does not enter the measured `popover`, `listbox`, `select`, or
  `combobox` entrypoints.
- 153 unit tests in `@timelessui/components`, including `triggerWiring` assertions for the authored
  path, the unsupported-feature path, and a `commandfor` naming another element.
- `no-javascript.spec.ts` proves the decisive case: with scripting disabled the dialog opens from
  its trigger, closes from its Confirm button, and reports `returnValue` `confirm` — all from the
  authored markup, with no custom element upgraded.
- `overlays.spec.ts` covers the authored close control and its `returnValue`, `aria-expanded` on
  open and close, focus return, the click-listener fallback when the markup authors no command, the
  refusal of an `aria-disabled` invocation, and sheet event parity (`ui-open:trigger`,
  `ui-dismiss:close`, `ui-close:close`).
- `platform.spec.ts` runs a dialog-invoker case on Chromium, Firefox, and WebKit. All three
  Playwright engines support Invoker Commands, so all three exercised the **authored** path; the
  click fallback is covered instead by the no-command case in `overlays.spec.ts` and by the
  `supportsInvokerCommands: false` unit tests.
- No Safari older than 26.2 was available on this machine, so the fallback was not confirmed
  manually there.
- `packages/*/src` and `apps/*/src` contain no JavaScript that writes `command` or `commandfor`.

---

Generated by Claude Opus 5 - High reasoning

Implemented by Claude Opus 5 - High reasoning
