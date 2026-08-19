# Milestone 021 Results

## Baseline

Measured on branch `main` at commit `97761b1` before any work, by reading the files directly.

| Measure                        | Value                                                                                               |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| Registry contracts             | 53 (`components` export in `component-registry.mjs`)                                                |
| Documented components          | 43 (catalog entries carrying a `group`)                                                             |
| Stylesheets in `src/css`       | 38                                                                                                  |
| `disclosure.css`               | 98 lines                                                                                            |
| `collapsible.css`              | 104 lines                                                                                           |
| `list.css`                     | 69 lines                                                                                            |
| `choice-group.css`             | 37 lines                                                                                            |
| `supportsNativePopover` copies | 5 (`combobox.ts:415`, `hover-card.ts:360`, `menu-button.ts:279`, `popover.ts:241`, `select.ts:454`) |
| `supportsNativeDialog` copies  | 2 (`dialog.ts:252`, `sheet.ts:350`)                                                                 |

Comparison figures the plan rests on: Base UI documents 37 components, shadcn/ui 64. Neither ships a
colour picker, colour swatch, gamut clamping, or WCAG contrast evaluation.

### Defects found while measuring, not while implementing

1. **`.ui-disclosure[data-ui-density='compact']` is inert.** `disclosure.css:10-13` sets
   `--ui-disclosure-trigger-min-block-size` and `--ui-disclosure-trigger-padding-block` on the root;
   `disclosure.css:15-17` re-declares both on `> summary`, and the summary's own declaration shadows
   the inherited value. `.ui-collapsible` declares the equivalents on the root
   (`collapsible.css:4-9`) and is unaffected.
2. **`contracts:validate` cannot catch it.** The gate proves a declared value is _selected_ by some
   rule. `compact` is selected at `disclosure.css:10`. It does not prove the rule's declarations
   survive the cascade. Recorded here because it bounds what the gate can be trusted for.
3. **`.ui-disclosure > summary` uses `cursor: pointer`**, against DESIGN.md's "cursor remains
   `default`". `.ui-collapsible` uses `cursor: default`.
4. **`data-ui-variant="ordered"` on `.ui-list` is inert in the case the registry documents.** Its
   only appearance in `list.css` is the negation at line 15, scoped to `ul.ui-list`. On
   `<ol class="ui-list">` — the use the description endorses — it changes nothing. On
   `<ul class="ui-list">` it restores disc bullets, not numbers.
5. **`box-shadow: var(--ui-shadow-floating)` at `popover.css:55` restates the base value at
   `popover.css:20`.** The tooltip override has no effect.
6. **Tooltip inherits four declarations that are wrong for a tooltip**: `overflow: auto`,
   `overscroll-behavior: contain`, `max-block-size: calc(100dvh - 6rem)`, and `line-height: 1.5`.
7. **`popover.css:128-130` carries an `!important`** whose necessity is unexplained; both competing
   `p` rules resolve to specificity `0-0-1` and the tooltip rule is later in source order.

8. **Only 3 of 53 contracts declare any CSS custom property** — `button` (13), `range` (2), and
   `toaster` (2) — while the stylesheets define many. `collapsible.css:3-9` defines seven,
   `list.css:3-5` three, and `popover.css:46-47` two, none declared. Nothing in `contracts:validate`
   or `manifest:validate` checks it, which is how they drifted. This milestone declares the ones it
   touches; the remaining ~46 contracts need their own pass.

### Not a defect, checked and cleared

- `choice-group.css` is **already** shared. The `checkbox-group` catalog entry loads
  `['tokens.css', 'choice-group.css']`, the same stylesheet the CSS-only Choice Group loads. The
  duplication is in the documentation, not the CSS.
- `ElementInternals` custom states **are** in use via core's `setCustomState`
  (`color-picker.ts:501`, `toast.ts:88`), so the AGENTS.md `:state()` rule is live rather than
  aspirational.
- `createId` from `@timelessui/core` **is** used by every element that needs generated ids.

## Platform behavior confirmed before planning

- **`anchor-size()` and CSS anchor positioning are Baseline as of January 2026** (Chrome 125+,
  Firefox 132+, Safari 18.2+). Relevant here only because step 6 restructures the anchor wiring at
  `popover.css:63-69`; the feature was already in use at `combobox.css:29`.
- **`position-area: bottom left` selects the bottom-left corner tile, not a left-aligned edge.**
  Confirmed against the MDN grid model. `bottom span-right` is the aligned-and-spanning form, whose
  logical equivalent is `block-end span-inline-end`. This does not change milestone 021 —
  `popover.css:101` uses `bottom center`, which is correct for a tooltip and a popover — but it is
  the reason milestone 022 exists, and it is recorded here because both milestones edit
  `popover.css`.
- **`<details name>` exclusive accordions are supported in all three engines** and are used nowhere
  in this repository. Whether the UA-driven auto-close runs the `::details-content` height
  transition is **not yet confirmed** and is a task, not an assumption.

Pending implementation.

## Open decisions

**Can the registry declare a contract whose root is a qualified selector?** The plan wants
`ui-hover-card[variant='tooltip']` as the `tooltip` contract's root so Tooltip gets a generated
reference page without a second custom element. The `css()` and `customElement()` helpers both take
a bare root name, and `custom-elements.json` may not tolerate a qualified tag.

- Making it work gives one element and two documented components, which is the shape this milestone
  argues for everywhere else.
- The fallback keeps Tooltip as an undiscoverable variant of Hover Card.
- The wrong answer is a `ui-tooltip` element: a second registered element, contract, define
  entrypoint, and catalog entry for the same controller is precisely the duplication being removed.

**How much of the disclosure look survives as `plain`?** If, once compared side by side at default
density, the two are visually indistinguishable, `plain` has no reason to exist and the merge is a
straight deletion. That is a better outcome than inventing a difference to justify a variant, and
the comparison must be made before the variant is added, not after.

**Does `list-style-position: inside` still earn its place?** Once no `<ul>` shows markers it applies
only to `<ol>`. Keep or drop on the rendered result.

Pending implementation.

## Decisions and constraints

Pending implementation.

## Summary

Pending implementation.

## Validation results

Pending implementation.

---

Generated by Claude Opus 5 - High reasoning
