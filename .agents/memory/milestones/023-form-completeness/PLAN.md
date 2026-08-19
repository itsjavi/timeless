---
status: Implemented
---

# Milestone 023 Plan: Form Completeness

## Goal

Close the form gaps that make Timeless unusable for a real form: no standalone fieldset, no way to
put server errors back on fields, a native select whose text is visibly off-centre, a range that
cannot express a range, and no one-time-code field. Along the way, resolve the choice-group tangle
that milestone 021 uncovered but deliberately left alone.

## Context

### What the study found

**1. The native select's right padding is wrong, and the stylesheet is stuck half-way through a
restyle.** `.ui-select` shares one padding rule with `.ui-input` and `.ui-file`:

```css
/* forms.css:83-89 */
.ui-input,
.ui-select,
.ui-file {
  min-block-size: var(--ui-form-control-height, 2.5rem);
  padding-block: 0.5rem;
  padding-inline: 0.75rem;
}
```

repeated symmetrically at `forms.css:97-104` (`sm`, `0.625rem`) and `forms.css:106-113` (`lg`,
`0.875rem`). The stylesheet then overrides the select's border (`forms.css:69`) and background
(`forms.css:71`) like a text input, and sets `color-scheme: light dark` (`forms.css:178-180`) so the
UA-drawn arrow follows the theme — but it **never sets `appearance`**, and there is **no
`background-image` in any of the 38 stylesheets**. The only `appearance: none` in `forms.css` is on
`.ui-switch` (line 273).

So the UA draws its own arrow inside the content box, and then `padding-inline-end: 0.75rem` pushes
it inward from the border. The result reads as far more space on the inline-end side than the
inline-start, which is exactly the reported defect, and it is _not_ a matter of taste: the distance
from the border to the first glyph and from the border to the arrow are unequal by design.

The stylesheet is in a half-restyled middle state, and there are exactly two coherent exits:

| Exit                                    | Do                                                                                                                                                 | Cost                                                                                                                                                                                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — the platform owns the indicator** | Keep `appearance: auto`. Give `.ui-select` its own `padding-inline` with a small or zero inline-end value so the UA gutter is the only end spacing | Free, honest, and matches the CSS-first thesis. The end gutter is engine-dependent, so Chrome, Safari, and Firefox will not be pixel-identical                                                                                          |
| **B — Timeless owns the indicator**     | `appearance: none`, a declared indicator part or a mask, and `padding-inline-end: calc(gutter + indicator)`                                        | Identical across engines, but DESIGN.md says "For standalone components, expose slots or allow user-authored SVG rather than shipping arbitrary icon opinions", and `color-scheme: light dark` at `forms.css:178-180` becomes dead code |

**Take A.** It is the smaller change, it keeps the platform arrow that the existing `color-scheme`
declaration was clearly added to support, and the visible defect is fixed either way. Record the
engine-dependent end gutter in the registry description rather than pretending it is uniform, and
verify the text inset looks equal on all three engines before calling it done. If it does not, B is
the fallback — and then `nativeSelect` needs the indicator part it currently lacks (its `parts`
array is empty).

**2. `nativeSelect` and `select` both claim the root name `ui-select`.** `nativeSelect`'s root is
the **class** `.ui-select` and `select`'s root is the **element** `<ui-select>`. Same string,
different kinds, one styling a native `<select>` and the other a custom element with a popover
listbox. That collision is part of why the native select CSS is entangled with the custom one, and
it makes every grep for "ui-select" ambiguous. Renaming either is a breaking change to a public
export and needs a decision, not a drive-by.

**3. `choice-group.css` is named after a component it does not style.** All seven of its rules are
scoped to `:where(ui-radio-group, ui-checkbox-group)` — the custom elements. The CSS-only
`.ui-choice-group` root lives in `forms.css`, which is what the registry says its stylesheet is. So
the file styles the JS groups, the name says otherwise, and milestone 021's catalog cleanup pointed
a `choice-group` entry at a stylesheet with zero matching selectors.

Worse, because `checkbox-group` and `radio-group` load only `tokens.css` and `choice-group.css`, the
`.ui-choice`, `.ui-checkbox`, and `.ui-radio` rules from `forms.css` are unavailable inside them —
so `choice-group.css` re-implements a subset and the two copies have drifted:

| Concern            | `forms.css`                                                               | `choice-group.css`                            |
| ------------------ | ------------------------------------------------------------------------- | --------------------------------------------- |
| Disabled opacity   | literal `0.6` (line 210)                                                  | `var(--ui-disabled-opacity)` = 0.56 (line 35) |
| Vertical gap       | `var(--ui-space-3)` (line 238)                                            | `var(--ui-space-2)` (line 4)                  |
| Horizontal layout  | grid, `repeat(auto-fit, minmax(min(100%, 10rem), max-content))` (250-254) | flex with `flex-wrap` (8-13)                  |
| Accent, focus ring | declared once                                                             | re-declared (24-26, 28-31)                    |

**4. Two orientation conventions for one value set.** `.ui-choice-group` takes `data-ui-orientation`
(`component-registry.mjs:732`) because it is a native class root; `ui-radio-group` and
`ui-checkbox-group` take a plain `orientation` (`:1151`, `:1189`) because they are custom-element
hosts. Both read the same `choiceGroupOrientations` set. That is correct per AGENTS.md and must stay
— but the consolidated component has to pick one root kind, because the attribute name follows from
it. `isChoiceGroupOrientation` (`forms.ts:37-39`) is a public export and must keep its name.

**5. There is no form validation anything.** `packages/components/src/validate.ts` sounds like it,
and is not: it exports `validateTimelessMarkup`, an _authoring_ linter for markup problems. No
component declares `static formAssociated`, and `setFormValue` / `setValidity` / `formResetCallback`
appear nowhere. Milestone 022 introduces form association for the three collection elements; this
milestone generalises it and covers the rest.

**6. Range is CSS over one native input, and there is no `range.ts`.** `range.css:6-9` is a grid of
`minmax(0, 1fr) auto` with the input at `grid-column: 1 / -1`, and the contract declares one part
(`hint`), one attribute (`data-ui-size`), and two variables (`--ui-range-track`,
`--ui-range-thumb`). That is the right default and covers most uses. A second thumb cannot be
CSS-only.

**7. Nothing for an OTP field exists, and three of its four hard parts have no precedent in the
repo.**

- **Paste splitting:** zero occurrences of `'paste'`, `beforeinput`, or `InputEvent` anywhere.
- **`autocomplete="one-time-code"` and `inputmode="numeric"`:** absent outside a colour channel
  input.
- **Per-cell traversal:** `collectionNavigationTarget` handles Arrow/Home/End/Page over a static
  item list with **roving tabindex**, where the collection is one tab stop. OTP cells are each
  independently tabbable, so the existing helper does not fit and traversal is new logic.
- **No APG pattern exists for OTP input**, so the `accessibility()` argument needs a deliberate
  decision rather than invented ARIA.

**8. `--ui-space-*` stops at `--ui-space-5` (1rem).** Values are 0.25, 0.375, 0.5, 0.75, 1rem. Every
new gap in this milestone must come from that ladder, or a token is added to **both** `tokens.css`
and `src/tokens.ts` — the build checks that they agree.

**9. `aria-current` has exactly one occurrence in the repository** (`menu.css:75`) and is written by
no JavaScript. Not needed here, but recorded because milestone 025 depends on it and
`validate-contracts.mjs`'s `IGNORED_SELECTOR_ATTRIBUTES` (lines 23-37) does not list it.

### Decisions taken

1. **Native select: exit A.** Keep the UA arrow, give `.ui-select` its own asymmetric
   `padding-inline` at all three sizes, and document that the end gutter is engine-drawn.
2. **A standalone `fieldset` contract**, extracted from the choice-group work, usable for any
   grouped controls rather than only checkboxes and radios.
3. **`choice-group.css` is renamed to match what it selects**, and the drift against `forms.css` is
   resolved to one declaration per concern.
4. **Form-level errors get a `ui-form` custom element** whose only job is mapping a name-keyed error
   object onto fields via `setCustomValidity` and the existing `ui-error` part. Native `<form>` and
   constraint validation keep doing everything else. This is deliberately the smallest thing that
   closes the gap.
5. **A multi-thumb range is a new custom element, `ui-range-field`**, not an attribute on the
   CSS-only `.ui-range`. Two thumbs need two native inputs coordinated in JS; bolting that onto a
   CSS-only contract would make the simple case pay for the complex one.
6. **The OTP field is a `role="group"` of native inputs**, not one input with a cell overlay. Native
   inputs give autofill, paste, and mobile keyboards for free, which is most of what makes an OTP
   field hard.
7. **The `ui-select` / `.ui-select` name collision is recorded, not fixed here.** It is a breaking
   public rename with a full ordered sequence (registry name, stylesheet filename and selectors,
   module filename, `valueSets` module field, `src/index.ts` block, `package.json` exports key,
   catalog `id` — which changes both the docs URL and the StoryLite route — story `meta.title`,
   `story-routes.json`, the preview-runtime key, and every E2E route string). It deserves its own
   decision.

## Architecture

- Form association becomes a shared concern, not five copies. Milestone 022 writes it first for the
  collection elements; this milestone extracts whatever is common into `@timelessui/core` — which
  already attaches internals at `ui-element.ts:304` — and applies it to `ui-otp-field` and
  `ui-range-field`. Core stays visual-free: it may manage internals, attributes, and lifecycle, and
  may not decide appearance.
- Every form-associated element implements the whole callback set: `formResetCallback`,
  `formDisabledCallback` (a control inside a disabled `<fieldset>` is disabled without its own
  `disabled` attribute, so track that separately), and `formStateRestoreCallback`.
- `setValidity`'s third argument is the **visible** control, so the native bubble has something with
  layout to point at.
- The `value` attribute is the default and stops driving live state after the first user commit; the
  live value is the property; reset restores the attribute. Same rule as 022.
- OTP splits into a pure exported helper plus a thin element, following `enhanceToolbarParts` and
  `syncNumberStepper`. `distributeOtpValue(cellCount, text)` is unit-testable with no DOM, and it is
  where paste, overtype, and truncation are decided.
- `ui-form` sets `setCustomValidity` and toggles authored `ui-error` content. It does not render
  error elements, and it writes no visual declarations.

## Constraints

- **Depends on milestone 022** for the first form-association implementation and for the
  `formDisabledCallback` / `formStateRestoreCallback` precedent. Running 023 first means writing
  that twice.
- **`contracts.test.ts` asserts a non-empty `description` for every attribute, part, state,
  variable, and event, and that every `default` is a member of its own `values`.** A placeholder
  fails `pnpm test`, not a validator.
- **`packages/examples/scripts/validate.mjs`** (17 failure conditions, undocumented in
  `.agents/reference/validators.md`) rejects any example using an undeclared part token or public
  attribute. Registry first, generate second, examples third.
- **Adding a new element is a 16-step sequence**, and several steps have no validator:
  `packages/components/package.json` `exports` needs a hand-added `./<module>` subpath —
  `check-exports.mjs` derives it mechanically as `./${tag.slice(3)}`; `src/css/components.css` needs
  the `@import`; `src/define.test.ts` needs the tag appended to its ordered list;
  `apps/web/src/scripts/preview-runtime.ts` needs the element loader;
  `apps/stories/src/smoke.test.ts` needs an entry; and `apps/web/src/content/docs/docs/index.mdx`
  carries a **hardcoded component count** that nothing checks.
- The three-way naming contract must hold: story `meta.title` = `Library/<Domain>/<Component>` where
  the slugified Domain equals the catalog `domain` and the slugified Component equals the catalog
  `id`. A mismatch surfaces only as `Missing internal site targets:` during `pnpm build:site`.
- `apps/stories/story-routes.json` is generated by `pnpm build:stories` and **committed**;
  `a11y.spec.ts` creates one axe test per route. Regenerate and commit it, or the sweep runs a stale
  list and may navigate to a 404.
- **`pnpm qa` does not run every gate.** `exports:validate`, `generated-dom:check`,
  `performance:check`, `boundaries:check`, `pnpm -F @timelessui/examples test`, and
  `pnpm -F @apps/web test` run only in the PR workflow. State which were run locally.
- `performance:check` compares against `performance-baselines.json` at baseline × 1.1 on four
  metrics for popover, listbox, select, and combobox, **and pins the exact `modules` chunk list**.
  Extracting form association into core changes the dependency closure, so re-baseline with
  `node scripts/check-performance.mjs --measure` and rewrite the `justification`.
- `exports:validate` needs a built `dist`, so it runs after `pnpm build:packages`.
- Renaming `choice-group.css` changes the `styles` arrays of every catalog entry that lists it.
- `isChoiceGroupOrientation` (`forms.ts:37-39`) must keep its exported name and module.

## Implementation sequence

### 1. Native select padding — the smallest visible fix, so it ships first

- Split `.ui-select` out of the three shared padding rules at `forms.css:83-89`, `:97-104`, and
  `:106-113`, giving it its own `padding-inline` per size with a reduced inline-end value.
- Measure, do not guess. Render a select and an input side by side at all three sizes in Chrome,
  Firefox, and WebKit, and pick the inline-end value that makes the border-to-glyph and
  border-to-arrow distances read as equal. The UA gutter differs per engine, so the target is "reads
  correct everywhere", not one number that is arithmetically perfect in one.
- Add a registry description on `nativeSelect` stating that the indicator is UA-drawn and its gutter
  is engine-dependent. Keep `color-scheme: light dark` — it is what makes that arrow themable.
- Do **not** set `appearance`. If step 1's verification fails on any engine, stop and take exit B,
  which additionally requires an `indicator` part on `nativeSelect` (its `parts` array is empty
  today).
- E2E: assert the computed `padding-inline-start` and `padding-inline-end` differ, and add a
  screenshot of select-beside-input at all three sizes.

### 2. Resolve the choice-group tangle, then extract a fieldset

- Rename `choice-group.css` to match the roots it selects — `choice-groups.css` if it keeps styling
  only the two custom elements. Update the `styles` array of every catalog entry that lists it and
  the `@import` in `components.css`.
- Resolve each drifted concern to one declaration: disabled opacity (drop the literal `0.6` at
  `forms.css:210` for `var(--ui-disabled-opacity)`), vertical gap, horizontal layout model, accent
  colour, and the focus ring. Pick one layout model that handles both orientations.
- Make `forms.css`'s choice anatomy reachable from the custom elements, either by adding `forms.css`
  to their catalog `styles` or by moving the shared rules somewhere both load. The current state — a
  group stylesheet re-implementing a subset of the anatomy stylesheet — is the cause of the drift.
- Add a `fieldset` contract: root `.ui-fieldset`, a `legend` part, `data-ui-density`, and the
  `description` and `error` parts `choiceGroup` already has. It must work for any grouped controls.
- Decide the consolidated choice group's root kind and therefore its orientation attribute name —
  one, not both. Keep `isChoiceGroupOrientation` exported from `forms.ts`.

### 3. `ui-form`: server errors onto fields

The smallest element that closes the gap. It does not replace native validation.

- A `setErrors(errorsByFieldName)` method, or an `errors` property, that calls `setCustomValidity`
  on each named control and fills the matching authored `[data-ui-part~='error']` element.
- `clearErrors()`, and automatic clearing of a field's custom validity on its next `input` event —
  otherwise a server error sticks after the user fixes it.
- Move focus to the first invalid control and ensure `aria-invalid` and `aria-describedby` point at
  the error element. Use `ensureElementId` from core.
- Declare a `ui-invalid` event, or reuse the existing event convention — check `events.ts` before
  inventing a name, and declare the detail type the element really dispatches or `manifest:validate`
  fails.
- No visual declarations from JS. `ui-form` sets `aria-*`, ids, and text content only.
- Confirm it works with `ui-select`, `ui-combobox`, and `ui-listbox` from milestone 022, which are
  form-associated and therefore need `setValidity`, not `setCustomValidity`. That difference is the
  main design risk in this step: a form-associated custom element's validity is owned by its
  internals. Resolve it explicitly — most likely by having `ui-form` delegate to a method on the
  element rather than reaching for `setCustomValidity` on a host that does not have it.

### 4. `ui-range-field`: two thumbs

- New custom element wrapping **two** native `input[type=range]` elements, declared as `from` and
  `to` parts, with an `output` part for the pair.
- Clamp so `from <= to`, and decide the crossing behavior: either block crossing or swap the active
  thumb. Whichever is chosen, document it and cover it in a unit test.
- Keyboard comes free from the native inputs; each thumb is independently tabbable and
  arrow-operable. Add nothing that competes with it.
- Track fill between the thumbs with a **measured** custom property written from JS —
  `--ui-range-fill-start` / `--ui-range-fill-end` — following the `floating.ts:108-111` precedent.
  CSS owns how it renders.
- Form value: two entries under `name`, or `name-from` / `name-to`. Pick one, match
  `<input type=range>` conventions where they exist, and state the choice.
- Reuse `--ui-range-track` and `--ui-range-thumb`, and declare any new variable in the registry — 50
  of 53 contracts declare none, and this milestone should not add to that.
- Leave `.ui-range` alone. The single-thumb CSS-only case must not get slower or heavier.

### 5. `ui-otp-field`

- Anatomy: a `role="group"` host with an accessible name, N native `input` cells as a `cell` part,
  each with `inputmode="numeric"`, `autocomplete="one-time-code"` on the **first** cell only,
  `maxlength="1"`, and an author-supplied per-cell `aria-label`. The example factory must emit all
  of it, because that is the copyable source; the library sets behavior attributes, not content.
- `length` attribute for the cell count; a `value` property joining the cells; `name` for
  submission.
- Pure helper `distributeOtpValue(cellCount, text)` in `otp-field.ts`, unit-tested with no DOM:
  paste of a full code, paste longer than the field, paste with spaces or dashes, paste into the
  middle.
- Traversal is new logic, not `collectionNavigationTarget` — cells are each tabbable, so there is no
  roving tabindex. Implement: fill advances focus, `Backspace` on an empty cell moves back and
  clears, arrows move between cells, `Home`/`End` jump to the ends. Decide whether it lives locally
  or as a new `collection.ts` export; a new export there must be re-exported from `src/index.ts` and
  the `./collection` subpath.
- `paste` on any cell distributes across all cells. There is no `paste` handling anywhere in the
  repository today, so this is the first.
- Accessibility: there is **no APG pattern for OTP input**. Decide the contract deliberately against
  `.agents/skills/verify-apg-conformance/SKILL.md` — a labelled `role="group"` of native inputs with
  per-cell names is the defensible choice — and set `accessibility()` to that composition, or to
  `null` with a note. Do not invent ARIA. Confirm the axe sweep is clean.
- Complete the 16-step add sequence, including the `package.json` `./otp-field` subpath, the
  `components.css` `@import`, the `define.test.ts` tag, the `preview-runtime.ts` loader, the
  `smoke.test.ts` entry, and the hardcoded component count in `docs/index.mdx`.

### 6. Milestone records

`RESULTS.md` must record: the per-engine inline-end padding values and screenshots that settled step
1; whether exit A held or B was taken; how `ui-form` reconciled `setCustomValidity` with
form-associated internals; the range crossing behavior; the OTP accessibility decision and why; and
the re-baselined performance numbers with their justification.

## Verification

1. **Unit** — `distributeOtpValue` across the paste cases; range clamping and crossing; `ui-form`
   error mapping and clearing.
2. **Visual, per engine** — select-beside-input at `sm`, `md`, and `lg` in Chrome, Firefox, and
   WebKit. This is the whole of step 1; a single-engine check does not settle it.
3. **E2E forms** — submit a real `<form>` containing every control and assert the serialised body.
   Then: a `required` OTP field blocking submission; `ui-form` putting a server error on a named
   field, focusing it, and clearing it on the next input; a control inside a disabled `<fieldset>`
   submitting nothing; reset restoring defaults.
4. **E2E keyboard** — OTP fill-advance, `Backspace` traversal, arrows, `Home`/`End`, and paste of a
   full code. Two-thumb range with each thumb independently focusable and arrow-operable.
5. **Accessibility** — `a11y.spec.ts` over the new routes, plus `verify-apg-conformance` on the OTP
   field and the range field.
6. **No-JavaScript** — the fieldset and the native select must be fully functional with scripting
   off. The OTP field and range field degrade to plain inputs that still submit; assert that, and
   say in the docs which bar each meets.
7. **Contracts and manifest** — `contracts:validate`, `manifest:validate`, and `pnpm test` for the
   description and default assertions in `contracts.test.ts`.
8. **The CI-only gates, run locally and named in `RESULTS.md`** — `exports:validate` (after
   `build:packages`), `generated-dom:check`, `performance:check`, `boundaries:check`,
   `pnpm -F @timelessui/examples test`, `pnpm -F @apps/web test`.
9. **Full gate** — `pnpm qa`.

```bash
pnpm qa
```

## Acceptance

- `.ui-select` has its own `padding-inline` at all three sizes; its border-to-glyph and
  border-to-arrow distances read as equal in Chrome, Firefox, and WebKit; the registry says the
  indicator is UA-drawn; and no stylesheet sets `appearance` on it.
- A standalone `fieldset` contract exists with a `legend` part and works for any grouped controls,
  not only checkboxes and radios.
- The group stylesheet's filename matches the roots it selects, and disabled opacity, vertical gap,
  horizontal layout, accent colour, and the focus ring are each declared exactly once across it and
  `forms.css`.
- The consolidated choice group has exactly one orientation attribute, and
  `isChoiceGroupOrientation` is still exported from `forms.ts`.
- `ui-form` maps server errors onto named fields, focuses the first invalid one, wires
  `aria-invalid` and `aria-describedby`, clears a field's error on its next input, works with the
  form-associated elements from milestone 022, and writes no visual declarations.
- `ui-range-field` supports two thumbs with documented crossing behavior, each thumb independently
  focusable and arrow-operable, fill rendered from measured custom properties by CSS, and a form
  value whose shape is stated. `.ui-range` is unchanged.
- `ui-otp-field` is a labelled `role="group"` of native inputs; paste of a full code distributes
  across cells; fill advances, `Backspace` retreats and clears, arrows and `Home`/`End` traverse;
  the example emits `inputmode`, `autocomplete="one-time-code"`, and per-cell labels; and the
  accessibility contract is a recorded decision rather than invented ARIA.
- Every new attribute, part, state, variable, and event has a real description, and every default is
  a member of its own value set.
- Every new element completed the full add sequence: `package.json` subpath, `components.css`
  `@import`, `define.test.ts` tag, `preview-runtime.ts` loader, `smoke.test.ts` entry, catalog
  entry, story with a conforming `meta.title`, regenerated and committed `story-routes.json`, and an
  updated component count in `docs/index.mdx`.
- `performance-baselines.json` is re-baselined with a rewritten `justification`, and the numbers are
  in `RESULTS.md`.
- Every CI-only gate was run locally and is named in `RESULTS.md`.
- `pnpm qa` is green.

---

Generated by Claude Opus 5 - High reasoning
