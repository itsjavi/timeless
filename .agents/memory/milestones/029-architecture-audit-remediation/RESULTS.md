# Milestone 029 Results

## Baseline

Read-only audit of a clean working tree at `9046d41` ("feat: menus, context menus, and overlay
gestures (milestone 024)"), Node 24.19.0, pnpm 11.22.0. No files were changed during the audit. The
CSS measurements behind the companion milestone are recorded in
[028](../028-core-and-theme-css-separation/RESULTS.md) and not repeated here.

| Fact                                                      | Value                                                 |
| --------------------------------------------------------- | ----------------------------------------------------- |
| `package.json` export entries                             | 37                                                    |
| Public exports carrying the `Atmosphere` name             | 6, all from `src/tokens.ts`                           |
| `Atmosphere` occurrences in `vscode.css-custom-data.json` | 58, generated                                         |
| `src/contracts.ts` (generated)                            | 3,967 lines                                           |
| Runtime modules importing `componentContracts`            | 3 — `attributes.ts`, `index.ts`, `validate.ts`        |
| Behavior modules importing `componentContracts`           | 0                                                     |
| `isTypeaheadEvent` definitions                            | 3 — `listbox.ts:963`, `menu.ts:446`, `select.ts:1038` |
| `:state()` selectors in CSS                               | 8                                                     |
| Consumer-facing Tailwind guidance                         | none                                                  |
| Entries covered by `performance:check`                    | 4 — `popover`, `listbox`, `select`, `combobox`        |

| Entry    | JS gzip |  JS raw |
| -------- | ------: | ------: |
| select   |  30,023 | 113,729 |
| combobox |  28,522 | 106,755 |
| listbox  |  15,380 |  55,052 |
| popover  |   5,644 |  18,340 |

Colour surface, by destination:

| File                   | Lines | Destination                   |
| ---------------------- | ----: | ----------------------------- |
| `color.ts`             | 1,060 | `@timelessui/color`           |
| `contrast.ts`          |   103 | `@timelessui/color`           |
| `color.test.ts`        |   158 | `@timelessui/color`           |
| `color-api.ts`         |     2 | becomes the new package index |
| `color-picker.ts`      |   865 | stays in `components`         |
| `color-picker.test.ts` |    58 | stays in `components`         |
| `color-picker.css`     |     — | stays in `components`         |
| `color-swatch.css`     |     — | stays in `components`         |

## A reported finding that did not survive investigation

The audit initially reported four export subpaths as redundant aliases: `./radio-group` and
`./checkbox-group` resolving to `dist/choice-group.js`, and `./toaster` and `./toast` resolving to
`dist/toast.js`. It recommended dropping two of the four. That was wrong on every count, and it is
recorded here so the same conclusion is not reached twice.

`choice-group.ts` declares `ui-radio-group` at line 86 and `ui-checkbox-group` at line 213 — two
distinct elements in one module. `toast.ts` declares `ui-toaster` and `ui-toast`. So the four
subpaths are per-element entry points, not duplicate names.

The per-component subpath also does a different job from the `define` entry point. `./toast` exports
the `toast()` imperative API, `dismissToast()`, `readToastDuration()`, two element classes, two type
guards, and eight types. `./define/ui-toast` is six lines that register one tag. A consumer needs
either or both depending on whether they are calling the API or registering the element.

Most decisively, `check-exports.mjs:12` _asserts_ that a class entry point exists for every
registered element, and carves out exactly `ui-radio-group`, `ui-checkbox-group`, and `ui-toaster` —
the three tags whose modules are shared. The convention is deliberate, machine-enforced, and its
exceptions are explicit in the gate. The lesson for future audits: check whether a validator already
encodes the convention before calling it accidental.

## Platform behavior confirmed before planning

Nothing yet. Three tasks require it and are written as verification rather than assertion:

- That the inverted Tailwind v4 import order really does make Timeless outrank every utility. This
  is the stated reason the utility-CSS page exists, so it must be reproduced before being published
  as the failure mode.
- That a `display` utility on an option row reintroduces filtered options. The reasoning — it
  outranks the UA `[hidden]` rule — is sound but untested.
- That the centrepiece Popover snippet renders, anchors, opens, and light-dismisses when pasted into
  a running app with the core layer and no theme CSS. A page that exists because a failure mode is
  silent cannot ship an unrun snippet.

## Decisions and constraints

Two decisions were taken before the milestone opened rather than left to implementation.

**The token exports become `ui*`, not `timeless*` or bare.** `uiTokenGroups`, `uiTokens`,
`isUIToken`, `UIToken`, `UITokenGroup`, `UITokenName`. The deciding argument is consistency:
`uiAttributes()` and `uiAttributeString()` already exist in the same package as the same kind of
neutral, contract-level API, and the tokens themselves are `--ui-*`. `timelessTokenGroups` was
rejected as longer with no other export carrying that prefix. Bare `tokenGroups` was rejected
because it says nothing about origin once imported into a consumer's scope.

The rename exists because Atmosphere is a set of _values_ for the `--ui-*` vocabulary, not the owner
of it. `DESIGN.md:3` calls Atmosphere the theme and `DESIGN.md:16` calls it the design language. A
second Timeless theme would have implemented `atmosphereTokenGroups`, which is incoherent, and a
consumer auditing their own theme against the contract was being told they audited against
Atmosphere.

**The colour split is generic-out, primitives-in.** `color.ts`, `contrast.ts`, and their tests move
to `@timelessui/color`; `color-picker.ts`, its test, and both stylesheets stay in `components`.

This resolves the scope inconsistency without ruling against Colour Picker, which was the framing
the audit got wrong. The scope test in `docs/reference/scope.mdx` asks whether something needs
domain machinery — a locale database, a layout engine, a virtualiser. OKLCH and OKLab parsing,
contrast computation, and channel gradient construction meet that test; a picker and a swatch do
not. They are UI primitives that depend on a colour library, the same way any component depends on a
platform capability. So the page needs amending to say a colour primitive is in scope while a colour
model is a library — which the split makes true rather than merely asserted.

The boundary happens to be clean, which is why this is tractable: `color-api.ts` is a two-line
barrel of exactly the two moving files, `contrast.ts` imports only from `color.ts`, and
`color-picker.ts` imports from `./color` at one site.

### Constraints discovered during the audit

**`generate-elements.mjs` parses `src/tokens.ts` as text.** Per
`.agents/reference/generated-files.md`, the generator reads the file as text rather than importing
it, and requires the `atmosphereTokenGroups = { ... } as const` shape to stay parseable. So the
token rename is not a symbol rename — it changes a generator's parser, and the 58 downstream
occurrences in `vscode.css-custom-data.json` follow regeneration.

**`AGENTS.md` forbids renaming a public export.** The rule is that a public export must never change
name or module. Six renames violate it, and the only thing that makes them permissible is that the
package is unpublished at `0.0.1`. That reasoning is recorded rather than left implicit, because
after publication this finding becomes unfixable and the record should show the window was used
deliberately.

**`check-boundaries.mjs` currently forbids only two things** — importing from `.local/`, and `core`
or `components` depending on `@timelessui/examples`. A new leaf package needs its own rule, or
nothing prevents `@timelessui/color` from later importing `components` and creating a cycle.

**The bundle figures move when milestone 028 lands.** Re-baselining is ordered after 028 rather than
before, so the CSS numbers are not measured twice.

### What the audit confirmed rather than found

The behavior modules are already clean of the contract registry: importing
`@timelessui/components/select` never reaches `contracts.ts`. Only `attributes.ts`, `validate.ts`,
and the barrel do. Finding 3 is therefore a targeted fix to one helper, not a structural problem —
worth stating so the fix is not over-scoped into a general dependency audit.

## Summary

Pending implementation.

## Validation results

Pending implementation.

---

Generated by Claude Opus 5 (High)
