# Milestone 030 Tasks

## 0. Audit (complete)

- [x] Pack and inspect the three published 0.1.0 tarballs; confirm `skills/`,
      `custom-elements.json`, `web-types.json`, both VS Code data files, and the two CSS entry
      points ship.
- [x] Build a throwaway Vite consumer that installs `@timelessui/components@0.1.0` from the registry
      with no workspace link.
- [x] Generate one consumer page per documented component from each live
      `/docs/components/<name>.md` page's own `## Markup` and `## Install` fences.
- [x] Cross-check every docs-declared import against the published tarball; record the four that are
      absent.
- [x] Run a production `vite build` of the consumer and record what fails.
- [x] Assert every `ui-*` tag upgrades: `:defined`, a registered constructor, not `HTMLElement`.
- [x] Run `validateTimelessMarkup()` over all forty-seven pages of documented markup.
- [x] Capture default, hover, focus-visible, and active screenshots per component and diff them.
- [x] Re-verify every state with computed-style deltas across ninety controls, so a pixel-identical
      state is separated from a genuinely missing one.
- [x] Measure every pointer target against SC 2.5.8, including the `<label>` as the effective target
      and the spacing exemption.
- [x] Run axe at `wcag2a`–`wcag22aa` over all forty-seven pages in the light scheme.
- [x] Run axe over all forty-seven pages in the dark scheme, with the page surface painted so the
      canvas is not mistaken for white.
- [x] Rebuild all forty-seven pages with the theme stripped and re-run upgrade, anchoring, and axe.
- [x] Test keyboard contracts against the documented markup: Menu, Checkbox Group, Radio Group,
      Toolbar, Listbox, Toggle Group, Tabs.
- [x] Test `Home`, `End`, `PageUp`, and `PageDown` on every collection that declares them.
- [x] Test focus survival when Toast auto-dismisses and when Number Stepper reaches a bound.
- [x] Confirm which registry roots are named on no documentation page.
- [x] Confirm what `context7.json` actually indexes, and check the hosted index.
- [x] Confirm the baseline is green at `705ea85` before and after: `pnpm build`, `pnpm typecheck`,
      `pnpm format:check`, `pnpm test`, `pnpm contracts:check`, `pnpm publint`, `pnpm attw`,
      `pnpm -F @apps/web test:dist`, `pnpm test:e2e`.
- [x] Record decisions, trade-offs, and results in RESULTS.md.

## 1. Registration, and the prose that describes it

- [x] Decide between self-registering `define/*` modules and a named-import-plus-call contract;
      record the decision and the rejected option in RESULTS.md.
- [x] Apply the decision to `src/define/*.ts` (and `sideEffects` in
      `packages/components/package.json` if the modules become side-effectful).
- [x] Update the generated Install block in `apps/web/src/lib/component-markdown.ts` so all
      twenty-three custom-element pages emit working registration.
- [x] Update `getting-started/installation.mdx`, `getting-started/quick-start.mdx`, and
      `concepts/index.mdx`.
- [x] Update the six framework guides: `react`, `preact`, `vue`, `svelte`, `solid`, `vanilla`, and
      the `astro` guide's inline script.
- [x] Correct `reference/packages.mdx`, which claims `define/ui-{element}` "Calls
      `customElements.define`".
- [x] Update the packaged skill's registration rule and `context7.json` rule 10 to state that
      registration is a call, not an import, if that is the decision.
- [x] Add an e2e or unit gate that consumes the packed package, follows the documented registration
      instructions verbatim, and asserts every element upgrades. Confirm it fails against today's
      `main`.

## 2. The dark scheme

- [x] Give `--ui-accent` a `light-dark()` pair whose dark branch clears 4.5:1 on `--ui-bg-surface`,
      `--ui-bg-surface-raised`, and `--ui-accent-soft` over each of them.
- [x] Pair `--ui-accent-hover` and `--ui-accent-active`, and confirm the dark branches move away
      from the surface rather than toward it.
- [x] Re-measure `--ui-focus` against SC 1.4.11's 3:1 in the dark scheme on all three surface
      tokens, and pair it independently of `--ui-accent` if the derivation cannot clear it.
- [x] Confirm `--ui-bg-accent`, `--ui-bg-accent-hover`, `--ui-bg-accent-active`, and
      `--ui-bg-danger` stay scheme-independent, and say why in the token file.
- [x] Extend `apps/e2e/tests/apps/stories/a11y.spec.ts` to run every route in both `light` and
      `dark`.
- [x] Paint a surface in the sweep, or assert `body` has a token background, so axe stops blending
      dark text over the white it assumes.
- [x] Confirm the extended sweep fails on today's `main` for Tabs, Listbox, Menu, Card, and Text and
      code, and passes after the token change.
- [x] Add the guide pages under `/docs/` to the website axe sweep.

## 3. Focus preservation and timing

- [x] Pause the Toast dismiss timer while the toast is hovered or contains focus, and restart it
      when both end.
- [x] Move focus deliberately when a toast holding focus is dismissed, rather than letting it fall
      to `<body>`.
- [x] Decide whether 5000 ms remains the default, and document the SC 2.2.1 position on the Toast
      page either way.
- [x] Replace `decrement.disabled` / `increment.disabled` in `syncNumberStepper` with
      `aria-disabled="true"` plus a no-op activation, so the button keeps focus at the bounds.
- [x] Check every other place a public component sets `disabled`, `hidden`, or `popover` closed on
      an element that may hold focus.
- [x] Add e2e assertions: focus survives Toast dismissal, and survives Number Stepper reaching `min`
      and `max`.

## 4. Declared keyboard contracts

- [x] Decide per collection whether `Page Up` / `Page Down` is implemented or the row is deleted:
      Toolbar, Radio Group, Checkbox Group, Listbox, Toggle Group.
- [x] If implemented, route the linear collections through page handling in
      `collectionNavigationTarget`; if deleted, remove the row from `COLLECTION_KEYS`.
- [x] Resolve `gridCollectionNavigationTarget`: give it a caller or stop exporting it from
      `index.ts`.
- [x] Decide Checkbox Group's contract. Deleting the arrow, `Home`/`End`, and Page rows and stating
      in `notes` that each checkbox is its own tab stop is the likely answer.
- [x] Add `packages/components/scripts/check-keyboard-contracts.mjs`, or an equivalent e2e sweep,
      that fails when a key declared in `accessibility().keys` is not exercised by a test.
- [x] Confirm the new gate fails on today's `main` for the Page rows and for Checkbox Group.

## 5. Contracts that describe the wrong thing

- [x] Change Toggle Group's declared pattern from `button` to `toolbar`, and reconcile the note with
      the `role="toolbar"` host it actually renders.
- [x] Stop Menu mutating an author's `disabled` into `aria-disabled`. Document
      `aria-disabled="true"` as the authored form, update the Menu markup fence and the example
      factory, and decide what the component does when it meets a real `disabled` item.
- [x] Reconcile Toolbar with Menu: either Toolbar keeps disabled items reachable too, or both notes
      explain why they differ.
- [x] Add `accessibility()` blocks for Number Stepper (Spinbutton), Color Picker, Toast, Toaster,
      Switch, and Alert.
- [x] Decide whether the remaining native-semantics roots get a short block or an honest "the
      platform owns all of this" line, so a reference page never renders the generic paragraph
      alone.
- [x] Fix the plural in `COLLECTION_KEYS` so the published contract stops reading "checkboxs".
- [x] Regenerate and confirm `contracts.ts`, `custom-elements.json`, `web-types.json`, the editor
      data, `llms-full.txt`, and the packaged skill all carry the corrections.

## 6. Documentation reach and release coupling

- [x] Give `ui-textarea` a documented home: its own catalog entry, or a Field page section that
      names the root and its `data-ui-size`.
- [x] Extend `validate-agent-surfaces.mjs` (or `validate-docs.mjs`) to fail when a registry root is
      named on no documentation page. Confirm it fails on today's `main` for `ui-textarea`.
- [x] Add the documentation page slug to every row of the skill's `reference/contracts.md`, so an
      agent reading a root name can reach its contract without guessing a URL.
- [x] Make the component contract pages reachable by context7: add the generated Markdown to a
      committed path inside an indexed folder, or point `context7.json` at whatever path it lands
      in.
- [x] Decide how to stop the deployed docs promising unpublished components — gate the gh-pages
      deploy on a tag, or mark unpublished components on the page and in the Install block. Record
      the choice in RESULTS.md.
- [x] Fix `validateTimelessMarkup()` so an `SVGElement`'s `className` no longer throws, and add a
      unit test that walks real DOM containing an inline `<svg>`.
- [x] Rewrite `repository.url` as `git+https://github.com/itsjavi/timeless.git` in the three
      publishable manifests.

## 7. Precision fixes in prose

- [x] Correct the README's theme-free claim for the anchored option surfaces, or add a named
      `core-exempt:` for `min-inline-size: anchor-size(width)` so the promise holds as written.
- [x] Document the SC 2.5.8 spacing exemption the checkbox, radio, and colour-picker slider targets
      depend on, so a consumer tightening the gap knows the cost.
- [x] Extend `core-only.spec.ts` beyond `select`, `listbox`, `menu-button`, and `dialog` — Color
      Picker and Number Stepper are the two where dropping the theme introduces a `target-size`
      violation.

## 7b. Found during implementation

Work the plan did not anticipate, all of it surfaced by the gates this milestone added.

- [x] Implement `Arrow Down` and `Arrow Up` on Menu Button. `check-keyboard-contracts.mjs` reported
      the declared `Enter / Space / Arrow Down` row against a module with no `keydown` handler, and
      driving it confirmed Arrow Down did nothing — Enter and Space came from `popovertarget` all
      along. The APG pattern asks for both arrows, so both are implemented and the row is split.
- [x] Add the two keyboard tests the new gate found missing: Tabs under `activation="manual"`, and
      Home/End on Toggle Group.
- [x] Fix `--sl-color-accent` on the documentation site. The new guide sweep found inline `code`
      inside a link at 4.48:1 against `--sl-color-bg-inline-code` — two hundredths under SC 1.4.3.
- [x] Fix the Entrypoints table on `/docs/reference/packages/`, which was an unfocusable horizontal
      scroll container (SC 2.1.1). Starlight's `code { overflow-wrap: break-word }` was overriding
      the cell's `anywhere`, so one long specifier pinned the column at 498px. Pre-existing, and
      live.
- [x] Use `aria-disabled` for the Select and Combobox clear controls, which had the same shape as
      the Number Stepper bound: activating the control is what makes it unavailable.
- [x] Re-baseline `performance-baselines.json`. Toast grew 18% gzipped for the timer pause and focus
      return, which is real behavior; a long comment in the shared `collection.ts` had inflated
      seven unrelated entrypoints, and was trimmed rather than baselined.

## 7c. Review of PR #15

Five threads. All five implemented; two of the five reports needed correcting on the way.

- [x] Menu navigation skips a native `disabled` item. Reported as a roving-`tabindex` desync;
      driving it showed worse — focus could never advance _past_ such an item, because the next key
      computes its origin from the focused element and kept recomputing the same unreachable target.
      `isMenuItemUnfocusable` now separates "the platform refuses to focus this" from "the APG wants
      this reachable", and arrows, `Home`/`End`, typeahead, and the resting tab stop all honour it.
- [x] Number Stepper uses native `disabled` when the whole control is disabled or read-only, and
      `aria-disabled` only at a bound. Using `aria-disabled` for both left two inert buttons in the
      tab order — worse than before the milestone for the common case.
- [x] Dark `--ui-danger` re-derived against the full fill matrix: `#f98080` measured 4.42:1 over
      `--ui-warning-soft` on a raised surface. `#fb8f8f` clears 4.94:1. The reviewer was right that
      the cross-fill rule applied to accent should apply here too.
- [x] `check-keyboard-contracts.mjs` scopes evidence per test block rather than per file. Tightening
      it immediately caught a real false pass the reviewer predicted: Radio Group's `Home / End` was
      being proven by a sibling collection's presses in the same spec file. The missing test is now
      written.
- [x] Toast rejects `body` and the root element as a focus-return target — but the reported repro
      does **not** reproduce. See RESULTS.md; the guard was added for consistency with the Dialog
      and Sheet idiom, not because the bug was live.

## 8. Close out

- [x] Re-run the audit harness against the fixed tree and confirm every finding is closed.
- [x] Run `pnpm qa` and record what it said in RESULTS.md.
- [x] Set `status: Implemented` in PLAN.md and add the `Implemented by` footer to RESULTS.md.
- [x] Record decisions, trade-offs, and results in RESULTS.md.

---

Generated by Claude Opus 5 (High)
