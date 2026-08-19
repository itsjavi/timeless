# Milestone 023 Results

## Baseline

Measured on `main` at commit `97761b1`.

| Measure                                              | Value                                                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `.ui-select` padding                                 | shares `padding-inline: 0.75rem` with `.ui-input` and `.ui-file` (`forms.css:83-89`); `sm` 0.625rem (`:97-104`); `lg` 0.875rem (`:106-113`) |
| `appearance` declarations in `forms.css`             | one, on `.ui-switch` (`:273`)                                                                                                               |
| `background-image` across all 38 stylesheets         | **zero**                                                                                                                                    |
| `nativeSelect` declared parts                        | **0**                                                                                                                                       |
| `nativeSelect` root / `select` root                  | both the string `ui-select` — one a class, one an element                                                                                   |
| `choice-group.css` rules matching `.ui-choice-group` | **zero**; all seven match `:where(ui-radio-group, ui-checkbox-group)`                                                                       |
| Disabled opacity                                     | literal `0.6` (`forms.css:210`) vs `var(--ui-disabled-opacity)` = 0.56 (`choice-group.css:35`)                                              |
| `packages/components/src/range.ts`                   | does not exist; Range is CSS over one native input                                                                                          |
| `range` contract                                     | 1 attribute, 1 part (`hint`), 2 variables                                                                                                   |
| `formAssociated` / `setFormValue` occurrences        | **zero**                                                                                                                                    |
| `'paste'` / `beforeinput` / `InputEvent` occurrences | **zero**                                                                                                                                    |
| `autocomplete="one-time-code"` occurrences           | **zero**                                                                                                                                    |
| `aria-current` occurrences                           | one, `menu.css:75`, written by no JS                                                                                                        |
| Spacing ladder                                       | `--ui-space-1..5` = 0.25, 0.375, 0.5, 0.75, 1rem                                                                                            |

`packages/components/src/validate.ts` is **not** form validation. It exports
`validateTimelessMarkup`, an authoring linter for markup problems. Recorded because the filename
invites the opposite assumption.

By implementation time milestone 022 had landed, so `formAssociated` was no longer zero:
`ui-listbox`, `ui-select`, and `ui-combobox` each carry the full callback set, and the shared
helpers live in `src/value-state.ts`.

## Platform behavior measured before deciding

### The native select indicator: exit A does not work, on any engine

Rendered `.ui-select` beside `.ui-input` at `sm`, `md`, and `lg` in Chromium, Firefox, and WebKit
(Playwright, `deviceScaleFactor: 2`), then swept `padding-inline-end` through `0.75rem`, `0.5rem`,
`0.375rem`, `0.25rem`, and `0`.

| Engine       | `appearance: auto` behavior                                                                                                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Chromium** | Honors `padding`. The arrow **does not move** at any of the five end values — it is drawn at a fixed offset from the border. Glyph inset ≈ 14.5px against an arrow gutter ≈ 7.5px                                |
| **Firefox**  | Honors `padding`. The arrow **does not move** either. Glyph inset ≈ 10.5px, arrow gutter ≈ 7.5px                                                                                                                 |
| **WebKit**   | **Drops author `padding` entirely** — computed `padding-inline-start`/`-end` are `0px` against the input's `12px` — and ignores `min-block-size`, so the select renders visibly shorter than the input beside it |

Exit A asked for a chosen `padding-inline-end` that equalises the border-to-glyph and
border-to-arrow distances. No such value exists: in two engines the arrow is unaffected by the
property, and in the third the property is discarded along with the control height. **Exit A is
inert, so exit B was taken**, as the plan directed when verification fails on any engine.

The plan's premise was also wrong in direction. It expected "far more space on the inline-end side";
Chromium actually shows _less_ — the glyph sits about twice as far from its border as the arrow does
from its own.

### Exit B, as built

`appearance: none`, and Timeless draws the mark. It is **not** a declared `indicator` part: a
`<select>` admits only `<option>` and `<optgroup>` children, so an authored indicator would require
turning the `.ui-select` root into a wrapper — a breaking change to a public class root, and out of
scope here. It is also **not** an icon asset, which `DESIGN.md` discourages. It is two 45° gradient
halves forming a caret, so it inherits `currentColor` and themes itself, sized from one public
variable `--ui-select-indicator` that also sets the end padding reserved for it.

After the change all three engines report identical computed padding at every size:

| Size | `padding-inline-start` | `padding-inline-end` | Height |
| ---- | ---------------------- | -------------------- | ------ |
| `sm` | 10px                   | 26px                 | 32px   |
| `md` | 12px                   | 30px                 | 40px   |
| `lg` | 14px                   | 34px                 | 48px   |

The two sides are deliberately unequal — the end side carries the gutter plus the indicator — which
is what `forms.spec.ts` asserts, rather than a pixel figure that would only hold on one engine.

`color-scheme: light dark` stays and is not dead code: the drop-down list itself is still UA-drawn.

### `autocomplete="one-time-code"` on a multi-input group

Not verified on real iOS Safari or Android Chrome — no physical device was available in this
environment, and Playwright's emulation does not exercise OS-level SMS autofill. The anatomy still
went ahead as a group of native inputs, because that is the shape every browser's autofill heuristic
is written against, and the risk is contained: the attribute sits on the first cell only, and
`distributeOtpValue` already handles an autofill that arrives as a whole code in one cell — that
path is exercised by the `input` handler and unit-tested. **Confirm on hardware before release.**

## Decisions

**1. Exit B for the select indicator.** Evidence above. `nativeSelect` gains the
`--ui-select-indicator` variable and keeps its empty `parts` array, with the reason recorded on the
variable's description rather than left implicit.

**2. `choice-group.css` → `choice-groups.css`, and the drift resolved by deleting a copy rather than
reconciling two.** The file now holds only the two custom-element hosts' own layout. Everything it
used to restate — accent colour, focus ring, disabled treatment, the control-beside-label layout —
comes from `forms.css`, which both group contracts now declare in their `css` array, so each concern
is declared exactly once:

| Concern           | Before                                        | After                                              |
| ----------------- | --------------------------------------------- | -------------------------------------------------- |
| Disabled opacity  | literal `0.6` vs `var(--ui-disabled-opacity)` | `var(--ui-disabled-opacity)`, in `forms.css`, once |
| Vertical gap      | `--ui-space-3` vs `--ui-space-2`              | `--ui-space-3` on both roots                       |
| Horizontal layout | `grid` auto-fit vs `flex-wrap`                | one model: column flex that becomes a wrapping row |
| Accent, focus     | declared in both files                        | `forms.css` only                                   |

Making that true required the group examples to author `class="ui-choice"` on the label and
`class="ui-radio"` / `class="ui-checkbox"` on the input, which is the same anatomy the CSS-only
`.ui-choice-group` already uses. That is a change to what a consumer copies, and it is the point: a
choice inside `<ui-radio-group>` and a choice inside `<fieldset class="ui-choice-group">` are now
the same markup.

One rule is new rather than moved: in a horizontal group the `description` and `error` parts take
`flex-basis: 100%`, because group-level copy describes the whole row rather than sitting in it.

**3. The choice group is not consolidated into one root, and that is the answer to "exactly one
orientation attribute".** `.ui-choice-group`, `ui-radio-group`, and `ui-checkbox-group` are three
contracts, not one component with two spellings. AGENTS.md requires `data-ui-orientation` on a class
root and a plain `orientation` on a custom-element host, and the plan's own context section says
that split "is correct per AGENTS.md and must stay". Each root carries exactly one orientation
attribute; none carries both. What was genuinely duplicated was the stylesheet, and that is what
decision 2 removed. `isChoiceGroupOrientation` is still exported from `forms.ts` under its own name.

**4. `ui-form` reaches form-associated elements through `setCustomValidity`, which those elements
now forward.** This was the milestone's stated main design risk. A form-associated custom element's
validity lives in its `ElementInternals` and has no `setCustomValidity`, so `ui-form` had either to
special-case those elements or to be given a door. The door won: `ui-listbox`, `ui-select`,
`ui-combobox`, and the new `ui-otp-field` each expose `setCustomValidity(message)` with the native
signature, storing the message and letting `applyCollectionValidity` apply it. `ui-form` then does
not know or care which kind of control it is holding — it duck-types on the method. A custom error
outranks `valueMissing`, matching how a native control reports it.

**5. `ui-range-field` is deliberately _not_ form-associated.** The plan asked for the full callback
set; the plan also required the field to "degrade to plain inputs that still submit". Those two are
in direct conflict: if the host owns the value, the authored inputs must lose their `name` and
nothing submits without JavaScript; if the inputs keep their `name`, a form-associated host submits
the pair a second time. The no-JavaScript requirement is the library's thesis, so the natives keep
their names, submit two entries (`budget-from`, `budget-to`), and reset natively. The element adds
ordering, the measured fill, and `ui-change`, and nothing else. `ui-otp-field` _is_ form-associated,
because a joined code has no native owner.

**6. Range thumbs block rather than swap.** A thumb stops at its neighbour. Swapping reads better
under a mouse but is surprising under a keyboard: the arrow key you are holding would silently start
moving the other thumb. `clampRangePair` is pure and unit-tested in both directions.

**7. The OTP accessibility contract is `pattern: null`.** The APG has no one-time-code pattern, so
rather than borrow a slug the contract records the composition it actually implements: a named
`role="group"` over native inputs, each independently tabbable and separately labelled by position.
`ComponentAccessibilityContract.pattern` is now `string | null`, and the reference page renders
prose saying the APG has no pattern for it instead of linking a URL that does not exist. `ui-form`
uses the same escape hatch.

**8. OTP traversal stays local, not a `collection.ts` export.** `collectionNavigationTarget` assumes
roving `tabindex` over one tab stop; every OTP cell is a real tab stop. `otpTraversalTarget` is
exported from `otp-field.ts` so it is testable, but it is not added to the `./collection` subpath,
where it would become public API that cannot later be renamed.

**9. Form association was extended in `value-state.ts`, not moved into `@timelessui/core`.** The
plan asked for the common part to be extracted into core. It already _is_ extracted — milestone 022
put it in `src/value-state.ts` — and that module is a published subpath,
`@timelessui/components/value-state`. Moving it would rename a public export's module, which this
milestone's own constraints forbid. Core keeps what is genuinely lifecycle-shaped (`internals`
attachment on `ui-element.ts`) and stays visual-free. `applyCollectionValidity` grew one option,
`customError`.

**10. The `ui-select` / `.ui-select` name collision is still not fixed**, as the plan directed.

## Bug found and fixed during implementation

`ui-form`'s first draft guarded its `input` handler with `event.target instanceof Element`.
StoryLite evaluates story modules in the manager window and renders markup inside the preview frame,
so the module's `Element` is not the story's `Element` and the guard rejected every real control — a
server error would stick after the user corrected the field. The guard is now duck-typed, with the
reason in a comment, because every element class in this library is built per window realm.

The same realm split made the story's demo wiring silently dead. A `<script>` injected as story
markup never executes, and `parameters.defineCustomElements` is only honoured by StoryLite's
`web-components` renderer, not the `html` renderer these stories use. The wrapper element is
registered from `.storylite/setup.ts`, whose `setupPreview(window)` is called with the preview
window. **The pre-existing `story-owned-filter` fixture in the Combobox story has the same defect
and is still broken** — verified in the running dev server — and is filed separately rather than
fixed here.

## What shipped

- **Native select**: `.ui-select` split out of the three shared padding rules and given
  `appearance: none`, a gradient-drawn indicator, and asymmetric inline padding at all three sizes.
- **`fieldset`**: new CSS-only contract, root `.ui-fieldset`, required native `legend` part,
  `description` and `error` parts, `data-ui-density`, `invalid` and `disabled` states.
- **`ui-form`**: `setErrors` / `clearErrors` / `errors`, error-element resolution with no pairing
  attribute, `aria-invalid` and `aria-describedby` wiring through `ensureElementId`, focus to the
  first invalid control, per-field clearing on the next `input`, and the `ui-invalid` event.
- **`ui-range-field`**: two native thumbs on one shared track, blocked crossing, measured
  `--ui-range-fill-start` / `--ui-range-fill-end` rendered by CSS, live `output`.
- **`ui-otp-field`**: form-associated group of native cells, `distributeOtpValue`, paste
  distribution — the repository's first `paste` handler — fill-advance, `Backspace` retreat, arrow
  and `Home`/`End` traversal, and a `tooShort`-shaped message for a half-typed code.
- `.ui-range` is unchanged.

## Constraints hit

- **`generated-dom:check` forbids a component creating elements at all.** Both new fields therefore
  enhance authored markup: the OTP cells and the two range thumbs are written by the consumer, which
  is also what makes the example the whole copyable contract.
- **WCAG 2.2 Target Size (Minimum) failed the first range build.** Two stacked full-width range
  inputs with an inert track give axe a 16px-tall target with zero safe space. `--ui-range-thumb`
  defaults to `1.5rem` on `ui-range-field` — larger than the single-thumb `.ui-range` default —
  because here the thumb _is_ the whole target. Caught by `a11y.spec.ts` and
  `component-reference.spec.ts`, not by review.
- **The stories app loads CSS from `dist`,** so a stylesheet edit is invisible until
  `pnpm -F @timelessui/components build` runs. Two rounds of confusing browser verification came
  from that before it was noticed.
- `performance-baselines.json` has no `justification` field, and `check-performance.mjs` does not
  pin the module list — it only asserts that four named modules stay out of the combobox closure.
  The plan described both. Re-baselined anyway; figures below.

## Performance

Re-baselined with `node scripts/check-performance.mjs --measure`. Module composition is unchanged —
only content-hash filenames moved. Growth is `setCustomValidity` plus the `customError` branch on
three elements, all inside the 10% budget.

| Entry      | cssGzip     | cssRaw        | gzip          | raw             |
| ---------- | ----------- | ------------- | ------------- | --------------- |
| `popover`  | 2640 → 2640 | 7622 → 7622   | 5624 → 5644   | 18233 → 18340   |
| `listbox`  | 3860 → 3871 | 13240 → 13329 | 14198 → 15380 | 51348 → 55052   |
| `select`   | 4699 → 4710 | 14986 → 15075 | 28894 → 30023 | 110398 → 113729 |
| `combobox` | 4779 → 4790 | 15255 → 15344 | 27355 → 28522 | 103331 → 106755 |

Largest movement is `listbox` `gzipBytes`, +8.3%.

## Validation

`pnpm qa` is green end to end: `typecheck` → `format:check` → `build` → `test` → `contracts:check` →
`publint` → `attw` → `test:e2e`. 354 Playwright tests pass across Chromium, Firefox, and WebKit; 217
component unit tests, 33 core, 8 story smoke tests; 50 canonical examples validated.

Every CI-only gate was run locally, all green:

- `pnpm boundaries:check`
- `pnpm -F @timelessui/components exports:validate` (after `pnpm build:packages`)
- `pnpm -F @timelessui/components generated-dom:check`
- `pnpm -F @timelessui/components performance:check`
- `pnpm -F @timelessui/examples test`
- `pnpm -F @apps/web test`

New E2E coverage in `apps/e2e/tests/apps/stories/forms.spec.ts`: select padding shape and box
height; a disabled `<fieldset>` submitting nothing; `ui-form` setting, focusing, and clearing a
server error; OTP fill-advance, `Backspace`, arrows, `Home`/`End`, full-code paste, submitted entry,
required and half-typed validity, and reset; range thumb tabbing, blocked crossing with the measured
fill, and the two submitted entries. `no-javascript.spec.ts` adds the fieldset and native select
working fully with scripting off, the range pair still submitting, and the OTP cells staying usable
but not submitting.

Manual verification beyond the suite: every new story driven in a real browser — OTP paste, typing,
traversal and validity; range clamping in both directions with the measured fill and native
submission; `ui-form` apply, per-field clear, and clear-all; the consolidated choice groups and the
new fieldset rendered; the generated reference page for `otp-field` showing the null-pattern prose.

Not verified: `autocomplete="one-time-code"` against real OS SMS autofill on iOS Safari and Android
Chrome. See above.

---

Generated by Claude Opus 5 - High reasoning

Implemented by Claude Opus 5 - High reasoning
