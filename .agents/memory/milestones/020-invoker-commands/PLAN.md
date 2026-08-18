# Milestone 020 Plan: Invoker Commands for Dialog and Sheet

## Goal

Adopt the Invoker Commands API where it produces behavior the library cannot otherwise provide, so a
`ui-dialog` and a modal `ui-sheet` open and close from authored markup before any script runs, and
make the landing page claim true. Preserve current behavior, accessibility, emitted events, and the
no-JavaScript fallback on every browser, and change nothing about `ui-popover`, which is already
declarative.

## Context

The landing page advertises Invoker Commands as a feature Timeless is **built with**, and it is not.
`apps/web/src/pages/index.astro:78-80` renders a tin titled "Invoker Commands" inside a section
whose intro reads "Built with the browser features Timeless is meant to preserve, not replace"
([index.astro:52](apps/web/src/pages/index.astro:52)). Every other tin in that shelf maps to real
implementation. This one does not: a repo-wide search for `commandfor`, `command=`, `CommandEvent`,
and `commandForElement` across `packages/` and `apps/*/src` returns **zero** hits. The only other
mentions are early architecture notes, where `command / commandfor` was recorded as an intended
primitive. `README.md:33` and
[browser-support.mdx](apps/web/src/content/docs/docs/reference/browser-support.mdx) both name the
feature as **pending** — "Invoker Commands are next: milestone 020 will..." and "Invoker Commands
are not wired up yet." — so the landing page contradicts the documentation as well as the code, and
the documentation is already written to be retracted once this lands.

So there are two problems: an inaccurate public claim, and a missed opportunity. This plan fixes
both — it adopts invokers where they genuinely earn their place, then makes the claim true.

### What the study found

I verified the platform behavior directly in Chrome 148 rather than trusting the docs. Findings that
drive the design:

- A `<button>` with both `command` and `commandfor` is **not** a submit button
  (`.type === "button"`), so it is safe inside forms.
- `command="close"` propagates the button's `value` to `dialog.returnValue` natively.
- `CommandEvent` is `cancelable: true`, `bubbles: false`, carries `source` (the button), and
  `preventDefault()` **does** block built-in commands.
- `commandfor` + `popovertarget` on one button do **not** stack — a single click yields a single
  toggle, so `command` takes precedence. Timeless's existing `popovertarget` wiring cannot
  double-fire against an authored command.
- `commandfor` without `command` does nothing; only `<button>` works (a `<div>` with both attributes
  is inert); a command mismatched to its target (`show-modal` on a popover) silently no-ops rather
  than throwing.
- Disabled buttons do not dispatch commands, which is why `isDisabledControl` becomes redundant.

**Where adoption pays off, ranked:**

| Component                                          | Wired today                                                                                                                                                              | Verdict                                                                                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `ui-dialog`                                        | click listener → `showModal()` ([dialog.ts:119-176](packages/components/src/dialog.ts:119))                                                                              | **Adopt.** Trigger is dead until JS loads.                                                                                         |
| `ui-sheet`                                         | click listener → `show()`/`showModal()` ([sheet.ts:159-251](packages/components/src/sheet.ts:159))                                                                       | **Adopt** (modal only).                                                                                                            |
| `ui-menu-button`, `ui-select`                      | `popover="auto"` + hand-rolled toggle ([menu-button.ts:151-201](packages/components/src/menu-button.ts:151), [select.ts:199-293](packages/components/src/select.ts:199)) | Deferred. Real cleanup, but plain `popovertarget` would do the same and is already widely available — consistency, not capability. |
| `ui-popover`                                       | `popovertarget`, **no click listener** ([popover.ts:183](packages/components/src/popover.ts:183))                                                                        | **Do not touch.** Already declarative; migrating buys nothing.                                                                     |
| `ui-number-stepper`, `ui-color-picker`, `ui-toast` | click listeners                                                                                                                                                          | Not now. Custom `--*` commands need JS to listen, so they trade a click listener for a command listener with no pre-JS gain.       |
| `ui-tabs`, `ui-toggle-group`                       | click → `aria-selected` / `aria-pressed`                                                                                                                                 | No. No built-in command exists; `aria-controls` already links tab→panel.                                                           |
| `.ui-disclosure`, `.ui-collapsible`                | native `<details>`/`<summary>`                                                                                                                                           | Nothing to do — already the model.                                                                                                 |

**Pros of adopting for dialog/sheet:** the trigger works before the bundle loads, which is the
explicit README promise ("the initial shell must be useful before JavaScript runs"); the platform
supplies `returnValue`, disabled handling, and cancelable close via `request-close`; it deletes
hand-rolled replicas of all three.

**Cons, stated honestly:** Invoker Commands are Baseline **newly available** (Chrome 135 Apr 2025,
Firefox 144 Oct 2025, Safari 26.2 Dec 2025; projected widely available Jun 2028). Because we keep a
fallback, **this change adds net lines of code in the short term** — a feature-detect branch, not a
deletion. The old click paths can only be removed once the support floor rises. Authors must also
supply an explicit `id` on the target, so generated IDs are unavailable on the authored path.

### Decisions taken

1. **Authored, JS defers.** Consumers write the attributes; Timeless detects them and skips its own
   click wiring. Timeless must **not** write `commandfor`/`command` itself — doing so would restore
   the "dead until JS" behavior and forfeit the entire benefit.
2. **Keep the click fallback**, feature-detected in the existing house style.
3. **Scope: `ui-dialog` and `ui-sheet` only.**

## Architecture

- Treat the invocation as authored consumer markup. Timeless reads `command` and `commandfor`; it
  never writes them, because writing them would restore the dead-until-JavaScript trigger this
  milestone exists to remove.
- Keep exactly two paths per component, chosen per instance: `authored` when the markup carries a
  usable command and the browser supports it, `listener` otherwise. The paths must be behaviorally
  indistinguishable.
- Put support detection and attribute reading in one module rather than a sixth copy of a
  `supportsNative*` helper.
- Report the chosen path out of the enhancement result so it is assertable in unit tests instead of
  inferred from side effects.
- Let the platform own what it already does: `returnValue` from the invoking button, disabled-button
  suppression, and cancelable close through `request-close`.
- Keep ARIA, focus return, and event emission in JavaScript on both paths. A dialog invoker receives
  no implicit `aria-expanded`, so nothing about the existing ARIA mirroring may be dropped.
- Derive the focus-return target from `CommandEvent.source` on the authored path, since the trigger
  click handler that captures it today never runs there.

## Constraints

- Only `show-modal`, `close`, and `request-close` are built-in dialog commands. **There is no
  built-in command for non-modal `dialog.show()`**, so a `ui-sheet` without `modal` cannot use the
  authored path and must keep the click listener regardless of browser support. Document this.
- Focus return currently depends on `#returnFocusTarget` being captured in `handleTriggerClick`
  ([dialog.ts:135](packages/components/src/dialog.ts:135)). On the authored path that handler never
  runs, so the target must instead be captured from `CommandEvent.source` in a `command` listener on
  the dialog. This is the one piece of new logic, not a deletion.
- Dialogs are not popovers, so browsers give the trigger **no** implicit `aria-expanded`.
  `syncDialogExpanded` / `syncSheetExpanded` must stay.
- Per `AGENTS.md`: no visual styling from JS; behavior attributes only. Story/example factories must
  emit the same public API consumers see, and copied source must never contain `data-ui-internal-*`.
- `validate-claims.mjs` fails as soon as the library source matches `/commandfor|CommandEvent/`
  while the landing-page claim is still marked planned. The documentation change is therefore not
  optional and cannot be deferred past the implementation commit.

## Implementation sequence

### 1. Shared detection and helpers — new file `packages/components/src/invoker.ts`

Follow the small-focused-module pattern of [floating.ts](packages/components/src/floating.ts) and
[parts.ts](packages/components/src/parts.ts), with a colocated `invoker.test.ts`. Do **not** add a
sixth copy of a `supportsX` function to a component file.

- `supportsInvokerCommands(win)` — `'command' in win.HTMLButtonElement.prototype`, mirroring
  `supportsNativePopover` ([popover.ts:237-242](packages/components/src/popover.ts:237)).
- `authoredCommand(el)` — returns the trimmed `command` attribute only when `commandfor` is also
  present and non-empty (verified: `commandfor` alone is inert).
- `hasAuthoredCommand(el, targetId, ...commands)` — true when the element authors one of `commands`
  against `targetId`. Used to decide whether to skip a click path.
- Exported command-name constants for `show-modal`, `close`, `request-close`.

Export from [packages/components/src/index.ts](packages/components/src/index.ts) alongside the
existing `popover`/`dialog` export blocks, and keep `packages/components/scripts/check-exports.mjs`
passing.

### 2. `ui-dialog` — [packages/components/src/dialog.ts](packages/components/src/dialog.ts)

- `DialogEnhancementOptions`: add `supportsInvokerCommands: boolean`, threaded from `enhance()`
  ([dialog.ts:89-111](packages/components/src/dialog.ts:89)) like `supportsDialog` already is.
- `enhanceDialogParts` ([dialog.ts:185-217](packages/components/src/dialog.ts:185)): keep the
  `aria-controls` / `aria-haspopup` / `aria-expanded` writes; **add nothing to the trigger**. Extend
  the `enhanced` result with `triggerWiring: 'authored' | 'listener'` so the element and its unit
  tests can assert which path is live.
- `handleTriggerClick` ([dialog.ts:130-137](packages/components/src/dialog.ts:130)): return early
  when the trigger authors `show-modal` against the dialog's id and the feature is supported.
- `handleDialogClick` ([dialog.ts:149-165](packages/components/src/dialog.ts:149)): skip close
  controls that author `close`/`request-close`. The platform already handles them **including
  `returnValue` from the button's `value`**, so the `HTMLButtonElement`/`value` extraction at
  [dialog.ts:157-163](packages/components/src/dialog.ts:157) is bypassed on that path.
- New `command` listener on the dialog, registered in `enhance()` next to the existing `close`/
  `cancel` listeners ([dialog.ts:109-110](packages/components/src/dialog.ts:109)): on `show-modal`,
  capture `#returnFocusTarget` via `returnTargetForTrigger` using `event.source`, then
  `syncDialogExpanded(trigger, true)` and `focusInitialDialogTarget`. Guard so the handler only acts
  on commands targeting this dialog.
- Leave `handleDialogClose` / `handleDialogCancel` and `focusInitialDialogTarget` intact.

### 3. `ui-sheet` — [packages/components/src/sheet.ts](packages/components/src/sheet.ts)

Mirror the dialog changes against `handleTriggerClick`
([sheet.ts:170-177](packages/components/src/sheet.ts:170)), `handlePanelClick`
([sheet.ts:179-196](packages/components/src/sheet.ts:179)), and `enhanceSheetParts`
([sheet.ts:274-308](packages/components/src/sheet.ts:274)), with two differences:

- Gate the authored path on the sheet being `modal`; non-modal keeps the listener unconditionally.
- Map `CommandEvent.source` to the existing `SheetEventSource` `'trigger'` value
  ([sheet.ts:20](packages/components/src/sheet.ts:20)) so emitted events are unchanged.
- Keep the backdrop light-dismiss logic at [sheet.ts:185-188](packages/components/src/sheet.ts:185).

### 4. Contracts and examples

- [contracts.ts:840-866](packages/components/src/contracts.ts:840) (dialog) and
  [867-893](packages/components/src/contracts.ts:867) (sheet): document the authored-command
  convention on the `trigger` and `close` parts. Re-run
  `pnpm -F @timelessui/components run generate` and keep `validate-contracts.mjs` /
  `validate-manifest.mjs` green.
- [packages/examples/src/overlays.html.ts:204-227](packages/examples/src/overlays.html.ts:204)
  (dialog) and [229-256](packages/examples/src/overlays.html.ts:229) (sheet): the `<dialog>` already
  takes an explicit `id`, so add `commandfor` plus `command="show-modal"` to the trigger and
  `command="close"` to the close controls. These strings are what consumers copy, so this is the
  public-API change.
- `createSheet` must emit `command="show-modal"` **only when `props.modal` is set**. `show-modal`
  calls `showModal()` on the target regardless of what `ui-sheet` intended, so emitting it
  unconditionally would open a non-modal sheet modally and leave the platform and the retained click
  listener fighting over the same trigger. The sheet story exposes `modal` as a boolean control, so
  this case is one click away in the catalog, not hypothetical.
- Give the dialog's confirm control a `value` so the example demonstrates the native `returnValue`
  propagation the milestone relies on, and so the E2E assertion has something to read.
- These two factories feed both surfaces: `apps/stories/src/stories/overlays.html.ts` re-exports
  `@timelessui/examples/overlays`, and the component reference pages render the same `render()`
  output. Updating the factories updates the StoryLite copy surface and the website together, which
  is why no story file needs its own copy of the markup.

### 5. Documentation — make the claim true

The site already documents this milestone as pending, in three places that name it explicitly. The
documentation work is therefore mostly retraction of "not yet", not new prose.

- [apps/web/scripts/validate-claims.mjs](apps/web/scripts/validate-claims.mjs) lists
  `Invoker Commands` in its `planned` map against milestone `020` with the proof pattern
  `/commandfor|CommandEvent/`. The moment that pattern matches `packages/*/src`, the script **fails
  the build** with "is now implemented; move it from planned to proofs". Moving the entry from
  `planned` to `proofs` is a required step of this milestone, not a cleanup — and it is the gate
  that makes the landing-page claim honest by construction.
- [apps/web/src/pages/index.astro:88-90](apps/web/src/pages/index.astro:88): replace the abstract
  body copy ("A new way to define declarative behavior for UI components") with what Timeless
  actually does, in the same voice as its siblings — e.g. "Dialog and sheet triggers work from
  markup alone, before any script runs."
- `README.md:33-35` already says "Invoker Commands are next: milestone 020 will move overlay
  triggers onto `command` and `commandfor`". Replace that forward-looking paragraph with the feature
  in the Baseline 2025 list above it, and keep the note that container queries remain candidates.
- `docs/reference/browser-support.mdx` (the page moved out of `getting-started/`) already carries an
  Invoker Commands row in the progressive-features table and a paragraph stating **"Invoker Commands
  are not wired up yet."** Delete that paragraph and rewrite the row's "Without it" column, which
  currently says triggers fall back "to a click listener for dialogs, which is how every trigger
  works today" — after this milestone that sentence describes the fallback, not the norm.
- Dialog and sheet component pages have no MDX file. Their prose lives in the example catalog and
  the contracts: `guidance` on the `dialog` and `sheet` entries in
  [packages/examples/src/catalog.ts:695](packages/examples/src/catalog.ts:695) renders as a tip
  aside, and the part descriptions in `src/contracts.ts` render as the Anatomy table. Put the
  authored-markup explanation and the non-modal sheet limitation there, where the generated page
  will pick them up.
- State on those pages that the authored path needs an author-supplied `id`, so a generated id
  cannot be used for an invoked element.

### 6. Milestone records

This milestone is `.agents/memory/milestones/020-invoker-commands/`; 019 is taken by the typed
authoring surface. `PLAN.md`, `TASKS.md`, and `RESULTS.md` exist and follow the 019 house style:
`TASKS.md` grouped by the sequence above, `RESULTS.md` as Baseline / Platform behavior confirmed
before planning / Open decisions / Decisions and constraints / Summary / Validation results. Keep
`PLAN.md` static from here and record outcomes in `RESULTS.md`.

## Verification

1. **Unit** — `pnpm -F @timelessui/components run test`. New `invoker.test.ts` covers
   `authoredCommand` (including `commandfor`-without-`command` returning null) and
   `supportsInvokerCommands` against a fake window. Extend `dialog.test.ts` / `sheet.test.ts` to
   assert `triggerWiring` is `'authored'` when the fake trigger carries the attributes and
   `'listener'` when `supportsInvokerCommands: false` — the same shape as the existing
   `supportsPopover: false` fallback tests in
   [popover.test.ts](packages/components/src/popover.test.ts).
2. **The decisive E2E test** — extend
   [apps/e2e/tests/apps/stories/no-javascript.spec.ts](apps/e2e/tests/apps/stories/no-javascript.spec.ts)
   (`test.use({ javaScriptEnabled: false })`) to prove the dialog opens and closes with scripting
   off. This is the entire justification for the change; if it fails, the adoption is pointless.
3. **Regression** — the existing dialog and sheet cases in
   [overlays.spec.ts](apps/e2e/tests/apps/stories/overlays.spec.ts) must pass unchanged
   (`aria-expanded` sync, `aria-labelledby`, focus return to trigger). Add a `returnValue` assertion
   proving the platform's native value propagation matches the old JS behavior.
4. **Cross-browser** — add a dialog-invoker case to
   [platform.spec.ts](apps/e2e/tests/apps/stories/platform.spec.ts), the only spec the
   `stories-firefox` and `stories-webkit` projects run. It must pass on WebKit via either the
   authored path or the click fallback, whichever the runner's version supports.
5. **Full gate** — `pnpm qa` (`typecheck && format:check && build && test && test:e2e`).
6. **Manual** — load the dialog story with JS disabled in Safari and confirm the fallback path still
   works there if the installed Safari predates 26.2.

One thing to confirm during step 1 that I could not settle from the specs: whether browsers expose
implicit `aria-expanded` on a `commandfor` **popover** invoker the way they do for `popovertarget`.
It does not affect this plan (dialogs get no implicit expanded state either way, so
`syncDialogExpanded` stays), but the answer decides whether a future `ui-menu-button`/`ui-select`
migration can drop its ARIA mirroring.

```bash
pnpm qa
```

## Acceptance

- `packages/*/src` and `apps/*/src` contain no JavaScript that writes `command` or `commandfor`.
- A `ui-dialog` whose markup authors `show-modal` and `close` opens, closes, and returns a value
  with scripting disabled, proven by `no-javascript.spec.ts`.
- The same dialog behaves identically with scripting enabled: `aria-expanded` syncs, focus returns
  to the trigger, and `ui-*` event details are unchanged.
- With `supportsInvokerCommands: false`, every dialog and sheet case behaves exactly as it does on
  `main` today, and the unit tests assert the `listener` path was chosen.
- A modal `ui-sheet` opens declaratively; a non-modal `ui-sheet` still opens by listener, and the
  reason is documented rather than left as an inconsistency.
- `overlays.spec.ts` passes unchanged, and `platform.spec.ts` covers a dialog invoker on Firefox and
  WebKit.
- The landing-page tin, `README.md`, and `docs/reference/browser-support.mdx` all describe invoker
  commands consistently, the tin states what Timeless does rather than what the API is, and no page
  still says the feature is unwired or pending.
- `Invoker Commands` has moved from `planned` to `proofs` in `validate-claims.mjs`, and the script
  passes.
- The dialog and sheet reference pages show the authored markup, name the author-supplied `id`
  requirement, and explain why a non-modal sheet cannot open declaratively.
- The StoryLite copy surface for dialog and sheet shows the same authored attributes as the website,
  with no generated ids and no `data-ui-internal-*`, and the sheet story's non-modal control still
  opens a non-modal sheet.
- Generation, contracts, manifest, export, boundary, and performance gates pass, and `pnpm qa` is
  green.
