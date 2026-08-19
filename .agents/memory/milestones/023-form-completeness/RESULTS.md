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

## Platform behavior confirmed before planning

Pending implementation. Two things must be measured, not assumed:

- **The UA select-indicator gutter differs per engine.** Step 1's inline-end padding cannot be
  derived; it has to be chosen against rendered output in Chrome, Firefox, and WebKit. Record the
  values and the screenshots.
- **Whether `autocomplete="one-time-code"` on the first cell of a multi-input group triggers OS SMS
  autofill**, and whether the OS fills one cell or attempts the whole code. This decides whether the
  OTP field can be a group of inputs at all, or has to be one input with a cell overlay. Test on iOS
  Safari and Android Chrome before committing to the anatomy in decision 6.

## Open decisions

**Exit A or exit B for the select indicator.** A keeps `appearance: auto` and lets the platform draw
the arrow; B takes it over with `appearance: none` plus a declared indicator. A is the plan's choice
— smaller, and it preserves the `color-scheme: light dark` declaration that was clearly added to
theme the native arrow. B buys pixel-identical rendering across engines at the cost of shipping an
icon opinion that DESIGN.md discourages, and it makes the existing `color-scheme` declaration dead.
The deciding evidence is step 1's per-engine screenshots.

**How `ui-form` sets validity on a form-associated custom element.** A form-associated element's
validity belongs to its `ElementInternals`; it has no `setCustomValidity`. So `ui-form` cannot treat
the elements from milestone 022 the way it treats a native input. Either it delegates to a method
the element exposes, or form-associated elements opt out of `ui-form` error mapping entirely. The
first is more useful and adds public API to three elements; the second is smaller and leaves a hole
exactly where a select most needs a server error. This is the main design risk in the milestone.

**Range thumb crossing.** Block crossing, or swap the active thumb when they meet. Blocking is
predictable and can feel stuck; swapping matches most native-feeling implementations and makes the
keyboard case surprising, because the arrow key you were holding now moves the other thumb.

**The `ui-select` / `.ui-select` name collision.** Deliberately not fixed here. A rename is a
breaking public change with an ordered sequence spanning the registry, the stylesheet filename and
its selectors, the module filename, the `valueSets` `module` field, `src/index.ts`, the
`package.json` exports key, the catalog `id` — which changes both the documentation URL and the
StoryLite route — the story `meta.title`, `story-routes.json`, the preview-runtime key, and every
E2E route string. It needs its own decision, and folding it into a forms milestone would bury it.

**Whether OTP traversal becomes a shared `collection.ts` export.** `collectionNavigationTarget`
assumes roving tabindex over one tab stop; OTP cells are each tabbable, so the existing helper does
not fit. Keeping traversal local is simpler; exporting it makes it public API that cannot later be
renamed.

Pending implementation.

## Decisions and constraints

Pending implementation.

## Summary

Pending implementation.

## Validation results

Pending implementation.

---

Generated by Claude Opus 5 - High reasoning
