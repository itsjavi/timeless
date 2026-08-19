# Milestone 022 Results

## Baseline

Measured on `main` at commit `97761b1` by reading the source, before any work.

| Measure                                                | Value                                                   |
| ------------------------------------------------------ | ------------------------------------------------------- |
| `listbox.ts` / `select.ts` / `combobox.ts`             | 477 / 473 / 434 lines                                   |
| `collection.ts` / `value-state.ts` / `floating.ts`     | 255 / 64 / 187 lines (already shared)                   |
| `select.css` / `combobox.css` / `listbox.css`          | 83 / 92 / 48 lines                                      |
| Declared attributes: `select` / `combobox` / `listbox` | `open, placement, value` / `value` / `multiple, value`  |
| Declared parts: `select` / `combobox` / `listbox`      | 4 / 3 / 2                                               |
| Base UI Combobox parts, for comparison                 | 25                                                      |
| Contracts declaring zero CSS custom properties         | **50 of 53** (only `button` 13, `range` 2, `toaster` 2) |
| `CSS.supports` calls in `packages/*/src`               | **0**                                                   |
| Elements with `static formAssociated`                  | **0**                                                   |

## Platform behavior confirmed before planning

- **`anchor-size()` and CSS anchor positioning are Baseline as of January 2026** (Chrome 125+,
  Firefox 132+, Safari 18.2+). Confirmed against MDN, which also gives the syntax
  `anchor-size(<anchor-name>? <anchor-size>?, <length-percentage>?)` and lists `min-inline-size`
  among the properties it is valid in.
- **`position-area` is a 3×3 grid, and two side keywords name a single corner tile.** Confirmed
  against the MDN grid model. `bottom left` is the tile diagonally below-and-left of the anchor;
  `bottom span-right` places the element in the centre of the bottom row and spans outward, which is
  what edge alignment means. Logical equivalents: `block-end inline-start` and
  `block-end span-inline-end`. This is the fact that makes `select.css:75` and `combobox.css:84`
  both wrong and `menu.css:94` right.
- **A declaration containing an invalid `anchor-size()` is invalid at computed-value time**, which
  is why `combobox.css:29` sitting outside its `@supports` guard silently degrades the surface width
  to `auto` rather than falling back to the `max()` floor.
- **Not confirmed, and a task rather than an assumption:** whether `max-block-size: 100%` on an
  anchor-positioned surface clamps to the `position-area` tile in all three engines. The plan
  depends on it, so measure it in Chrome, Firefox, and WebKit before replacing the hardcoded
  viewport clamps.

## Open decisions

**One element with `behavior=`, or three elements sharing a core?** The plan takes three, promoting
`ui-listbox` to the explicit core because it already is one for Combobox — `combobox.ts:388-406` is
three pure pass-throughs to listbox functions. Recorded as an open decision because the user raised
`behavior="combobox | listbox | select"` directly and it deserves a written answer rather than a
silent choice.

- **For one element:** genuinely less surface; the two popover variants are one attribute apart.
- **Against:** the registry declares one `accessibility.pattern` per contract and the generated
  reference renders one keyboard table per page, so three behaviors on one root need either three
  contracts against one root — the same untested capability milestone 021 is probing for Tooltip —
  or one page documenting three mutually exclusive keyboard maps. `ui-listbox` also has no trigger
  and no popover and its APG pattern is `listbox`, not `combobox`.
- **The decision is reversible.** If the qualified-root experiment in 021 succeeds, collapsing to
  one element becomes cheap later. Doing it first bets the largest milestone on it.

**Does a nested `ui-listbox` inside `ui-select` own a form value?** The plan says no — the outer
host owns it and the inner listbox must detect an owning collection root and stay out. Not yet
proven. The failure mode is a duplicate entry submitted under the same `name`, so the test comes
before the code.

**Where does `ignorePunctuation` go, if anywhere?** `collectionCollator`
([collection.ts:229-241](packages/components/src/collection.ts:229)) does not set it. Adding it
there changes typeahead for Menu, Toolbar, and Toggle Group too, since they all route through
`collection.ts`. Threading it through `CollectionMatcherOptions` keeps the blast radius to the
collection surfaces but adds a parameter to a shared signature. It also cuts both ways as a feature:
it makes "St. John" match "St John", and it makes "C++" match "C".

**Does Select move DOM focus into options, or keep it on the trigger with `aria-activedescendant`?**
The code does the former (`select.ts:251-253`, roving `tabindex`); the registry documents the latter
(`component-registry.mjs:1306`). A `searchable` Select must keep focus in the search field, so it
will use active-descendant regardless. The open question is whether non-searchable Select should
match it for one focus model, or keep roving focus for two. One model is simpler; two match each
mode's conventions more closely.

**Is there a public alignment API at all?** The plan adds `align="start | end"`. The alternative is
no public API — a fixed `position-area` with `position-try-fallbacks`, overridable only by consumer
CSS, which is what the prototype shipped. Adding the attribute is a permanent contract; consumer CSS
is free. The reported defect was that the surface is _centred_, which is fixed either way, so
`align` should be justified by a real second use case rather than added because it is easy.

**A shared observable store: rejected.** The prototype built one, exported it, and never used it —
both of its real composites kept private fields on the root and pushed state down through imperative
sync methods. Recording it here as considered-and-rejected so it is not re-derived. Timeless's state
lives in ARIA and native attributes, which is the more inspectable answer and the one AGENTS.md
already mandates.

Pending implementation.

## Decisions and constraints

Pending implementation.

## Summary

Pending implementation.

## Validation results

Pending implementation.

---

Generated by Claude Opus 5 - High reasoning
