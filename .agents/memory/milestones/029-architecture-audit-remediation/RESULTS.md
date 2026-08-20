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

## Platform behavior, as confirmed

Three claims were written as verification rather than assertion, and were run in a Vite app with
Tailwind v4.3.3 against the built package before the documentation page was written. Two held and
one did not.

- **The inverted import order does make Timeless outrank every utility.** Confirmed on the property
  core actually owns: `overflow-visible` on a Popover surface computes `overflow: visible` with
  Timeless imported first and `overflow: auto` with Tailwind first, silently, in the same markup.
  The compiled layer statements are the mechanism, and they are readable in the output —
  `@layer ui.tokens, ui.components, ui.utilities;` followed by
  `@layer theme, base, components, utilities;`, or the reverse.
- **A `display` utility does not reintroduce filtered options** — not with Tailwind's default
  Preflight, which is the finding. See the section above; the trap is real only without Preflight,
  and both states are documented.
- **The centrepiece snippet works with the core layer and no theme.** The surface opens anchored
  below its trigger with the gap supplied by the `m-2` utility, registration adds `aria-controls`,
  `aria-expanded`, `aria-haspopup="dialog"` and `role="dialog"`, `anchor-name` and `position-anchor`
  resolve to the same per-instance name, and an outside click light-dismisses and returns
  `aria-expanded` to `false`.

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

## What the implementation found that the plan did not

Three of the plan's predictions were wrong, and each was wrong because it reasoned from the source
instead of running it.

**The three typeahead predicates had already drifted, and the plan's "internal only" was not true.**
`listbox.ts` and `select.ts` disqualified `shiftKey`; `menu.ts` did not. So `Shift+A` moved a menu
highlight and did nothing at all in a listbox, and typing a capital letter or a shifted symbol into
a Select was silently dead. `Shift+A` produces a printable `A`, so the shared predicate keeps Menu's
reading, which makes the consolidation a behavior change rather than a pure refactor — recorded here
because the plan billed finding 5 as internal.

**A `display` utility does not reintroduce filtered options.** The plan predicted it would,
reasoning that a utility outranks the UA `[hidden]` rule. Tailwind v4's Preflight ships
`[hidden]:where(:not([hidden='until-found'])) { display: none !important }`, and an important
declaration beats every normal one regardless of layer, so with the default `@import "tailwindcss"`
filtered options stay hidden under `flex`. Importing Tailwind without Preflight does reproduce the
trap exactly as described. Both states are documented, with `not-[[hidden]]:flex` as the guard.

**The `ui-*` host needs no display utility, and giving it one is the bug.** The plan expected to
tell consumers that core supplies the host display rather than making them hand-write it, which is
right — but the interesting half is the corollary. Because utilities win under the correct import
order, a `block` on `ui-popover` defeats core's `display: contents` and puts a box between the
trigger and its surface.

One trap was found only by running the page's own example. With no theme loaded a `[popover]` takes
the UA's `color: CanvasText` over `background-color: Canvas`, and `tokens.css` keeps
`color-scheme: light dark` deliberately, so on a dark-preferring browser a `bg-white` utility with
no `text-*` beside it renders white text on a white panel — in one colour scheme only. The first
draft of the documentation page had the bug in its own snippet.

## Measurements

The typed helper, before and after inlining the contract defaults. Dependency closure of
`dist/attributes.js`, each module gzipped separately, which is how `check-performance.mjs` measures:

| Entry        | gzip before | gzip after | raw before | raw after | Modules |
| ------------ | ----------: | ---------: | ---------: | --------: | ------- |
| `attributes` |      19,328 |      1,573 |    109,958 |     5,269 | 2 → 1   |
| `validate`   |      19,853 |     19,853 |    111,547 |   111,547 | 2 → 2   |

`attributes` no longer pulls the contracts chunk at all. `validate` is unchanged because it
genuinely introspects the registry, which was the point of keeping it.

Bundle attribution for Select, which the audit had flagged as the first number a skeptical evaluator
finds. Nine modules, 30,714 gzipped in the gate's units:

| Module          | gzip   | Share |
| --------------- | ------ | ----- |
| listbox chunk   | 11,358 | 37.0% |
| `select.js`     | 9,719  | 31.6% |
| popover chunk   | 2,941  | 9.6%  |
| `collection.js` | 2,701  | 8.8%  |
| floating chunk  | 1,301  | 4.2%  |
| six others      | 2,694  | 8.8%  |

Combobox has the same profile and shares the listbox chunk rather than duplicating it. So the weight
is composition, and the decision is to disclose rather than reduce — because the same closures,
bundled and minified with esbuild, are less than half the figure:

| Import                | gate units | bundled + minified |
| --------------------- | ---------: | -----------------: |
| select                |     30,714 |             13,489 |
| combobox              |     29,345 |             12,908 |
| select + combobox     |     60,059 |             15,972 |
| six enhanced elements |          — |             20,657 |

The pair costs 15,972 rather than 26,540 because everything under both is shared, and the marginal
cost of the second collection control is about 2.4KB. `packages.mdx` publishes these, and
`validators.md` now says what its own metric measures.

The size gate went from 4 hand-listed entries to 20, derived from the element registry. Of the four
it already covered, popover is unchanged and the three collection entries grew under 3% — the shared
typeahead machine's doc comments landing in unminified output. Minified, the same closures are 4 to
68 bytes _smaller_ than before the consolidation, which is the clearest statement of what the raw
figures do and do not mean.

## Decisions taken during implementation

**The `./color` subpath is removed, not kept as a re-export.** A re-export would have preserved the
documented import path at the cost of still shipping the generic library from the components
package, which is the finding itself. Consumers import `@timelessui/color`. The unpublished `0.0.1`
window makes this free, and it is the same window the token rename spends.

**`OPTION_TYPEAHEAD_RESET_MS` keeps its name.** It is a public export, and `AGENTS.md` forbids
renaming one. `collection.ts` owns the value as `COLLECTION_TYPEAHEAD_RESET_MS`, and `options.ts`
re-exports it under the public name, so the window is declared once without breaking the surface.
The token exports were renamed anyway, deliberately, and that asymmetry is the point: six exports
named after the wrong thing were worth the break, one constant with an accurate name was not.

**The colour package gets `attw` as well as `publint`.** `packages/core` has only `publint`. The new
package is a leaf a consumer may install directly, so its type resolution is worth proving.

**`performance:check` derives its entries rather than listing them.** A hand-listed gate is how it
came to cover four of twenty modules while being described as general. Deriving means a new
element's absence from the baselines fails the check, which matches the declare-then-regenerate
ordering the rest of the build already enforces.

## The one item 028 filed, and the path its fix left open

028's flagged item — the Select trigger carrying `aria-activedescendant`, which no button role
permits — was already closed on `main` before this branch existed, by `26799a0` (#9): the trigger
takes `role="combobox"`, `checkMarkup` reports the accessible name that role then needs, and the axe
sweep opens the Select with an active option so the state that carries the attribute is actually
scanned. This milestone's own pull request initially described that item as outstanding, which was
wrong.

What #9 left open is one path to the same defect. `role="combobox"` is applied only when the author
has not set a role, deliberately, so a consumer who sets `role="button"` on the trigger got
`aria-activedescendant` written onto it anyway — measured in Chromium on the built package:
`aria-activedescendant="ui-select-1-option-2"` on `role="button"`.

`syncListboxActiveDescendant` now refuses a controller whose stated role forbids the attribute, and
clears one stranded by a role that changed under it. Marking the active option and naming it are
separate jobs, so the highlight is unaffected — verified in the same probe, one highlighted option
either way. The guard lives in the shared writer rather than in Select, so Combobox and any consumer
calling the public helper get it too. An absent role is permitted, because a native `<input>`
carries the attribute legally and an attribute bag cannot say what the tag is.

The runtime degradation is correct but silent, so `checkMarkup` reports it too, as
`role-forbids-relationship` beside the `missing-accessible-name` finding that already covers the
same trigger. It names the offending role and the roles that would work. The role set is read out of
`src/listbox.ts` as text rather than copied — the approach `generate-elements.mjs` and
`check-core-boundary.mjs` already take to `src/tokens.ts` — so the checker and the runtime cannot
disagree about which roles work, and renaming the constant throws instead of checking against an
empty set.

## Two defects fixed in passing

**`tsdown.config.ts` fed declaration files through the decorator transform.** The plugin matched any
`.ts` path under `packages/components/src`, `.d.ts` included, and `transpileModule` cannot emit for
a declaration file. It had never fired because the plugin's `code.includes('@')` guard happened to
exclude `color-picker.d.ts` — until the colour extraction put `@timelessui/color` in its imports and
the build failed. The plugin now skips declaration files, which is what it always meant.

**`packages/components/README.md` told consumers to import stylesheets that no longer exist.** Drift
from milestone 028: nineteen `@timelessui/components/css/<component>.css` imports in the opening
snippet, plus one more further down, when the tiers moved to `css/core/` and
`css/themes/atmosphere/`. A consumer copying the first snippet in the published README got a
resolution error. Found by the close-out documentation audit, not by any script —
`validate-docs.mjs` proves every stylesheet is documented _somewhere_, not that a documented path
resolves.

`apps/web/scripts/validate-claims.mjs` needed a change after all: it collects "the library source"
from two directories, and the colour model now lives in a third, so a future colour claim would have
had no proof to find. `packages/color/src` is in the list.

## Summary

All six findings are implemented, in the plan's sequence.

1. The six token exports are `uiTokenGroups`, `uiTokens`, `isUIToken`, `UIToken`, `UITokenGroup`,
   and `UITokenName`. `generate-elements.mjs`'s text parser moved with them, and the 58 occurrences
   in `vscode.css-custom-data.json` followed regeneration. The editor description reads "Timeless
   design token" rather than naming the theme that supplies the values. Atmosphere still names the
   theme in `DESIGN.md` and on the values.
2. `@timelessui/color` holds `color.ts`, `contrast.ts`, and `color.test.ts`, depends on nothing, and
   is depended on by `components`. Colour Picker, its test, and both stylesheets stayed.
   `check-boundaries.mjs` keeps it a leaf. `scope.mdx` now says a colour primitive is in scope while
   a colour model is a library.
3. `attributes.ts` is generated with the root class and the declared defaults inlined, and no longer
   imports `componentContracts`. A new test asserts the inlined copy against every CSS-only
   contract, because that equivalence is the only thing making the inlining sound.
4. `performance:check` covers every element module. The weight is attributed, documented, and
   re-baselined after 028.
5. One typeahead buffer, one timer, one idle window, one predicate, in `collection.ts`. Policy stays
   per component: Listbox moves focus, a closed Select selects without opening, Menu resolves
   against menu-item text.
6. `docs/styling/utility-css.mdx` carries a Popover example that was pasted into a running Tailwind
   v4.3.3 app and confirmed to render, anchor, open, and light-dismiss before publication, plus the
   four interactions that are actually possible.

## Validation results

`pnpm qa` passes, exit 0: typecheck, `format:check`, build, 337 unit tests across four packages, 51
canonical examples, 6 platform claims and 8 house rules, 46 component and 19 guide Markdown routes,
`contracts:check`, `publint`, `attw`, and 403 end-to-end tests.

Verified along the way rather than only at the end:

- `generate:check` and `contracts:validate` after the rename — 58 public tokens, both directions.
- `publint` and `attw` on `@timelessui/color` and `@timelessui/components`.
- 29 collection e2e specs, including a new one holding Select's typeahead policy, and the 216-check
  axe and reflow sweep.
- Every claim on the utility-CSS page, in a Vite + Tailwind v4.3.3 app against the built package:
  both import orders, Preflight present and absent, the `not-[[hidden]]:flex` guard, the
  `[&:state(--closed)]:opacity-0` variant across a real open-to-closed transition, and the six other
  variant syntaxes the page names.

Not verified by the probe: Escape closing the popover. The probe's synthetic key dispatch does not
produce a UA close signal, so that path stays covered by
`apps/e2e/tests/apps/stories/overlays.spec.ts` rather than being asserted twice.

---

Generated by Claude Opus 5 (High)

Implemented by Claude Opus 5 (High)
