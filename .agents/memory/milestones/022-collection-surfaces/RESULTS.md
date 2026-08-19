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

## Decisions resolved

Every question the planning pass left open, answered against what the implementation actually found.

**One element with `behavior=`, or three sharing a core? Three.** Unchanged from the plan. Three
elements, with `ui-listbox` promoted to the explicit core: `listbox.ts` now owns option discovery,
selection, the active highlight, typeahead, groups, paging, the empty and status regions, and the
pager, and exports all of it. `select.ts` and `combobox.ts` add a trigger and nothing else, and read
as each other's twin on purpose. The three pass-through aliases in `combobox.ts` are re-exports now
rather than wrappers, and `selectOptionValue` / `syncSelectValue` route through the listbox instead
of reimplementing it. Every previously public name is still exported from the same module.

**Does a nested `ui-listbox` inside `ui-select` own a form value? No.** `isOwnedByCollection` walks
up from the host and stays out when it finds a `ui-select` or `ui-combobox`. Proven by driving a
nested pair with the same `name` and asserting the submitted body holds nothing.

**Where does `ignorePunctuation` go? Nowhere.** Considered and rejected rather than threaded. It
makes `St. John` match `St John`, and it makes `C++` match `C` and `F#` match `F` — for a library
whose own option lists are full of technical labels, the punctuation-sensitive default is the better
one, and the APG typeahead contract is a prefix match on the label as authored. Adding a knob
nothing sets would have been worse than either. `collectionCollator` is unchanged, so Menu, Toolbar,
and Toggle Group typeahead are untouched.

**Does Select move DOM focus into options, or keep it on the trigger? On the trigger.** One focus
model, not two. Focus stays on the trigger — or in the `search` field under `searchable` — and the
active option travels through `aria-activedescendant`. The roving-focus path is gone, and
`syncListboxActiveOption` takes a `roving` flag so the inline listbox keeps real focus while the two
popover surfaces never become an extra tab stop. The registry text now matches the code, which is
what it documented all along.

**Is there a public alignment API? Yes, `align="start | end"`.** The second use case that justifies
it is a trigger sitting at the inline-end of its container, where a start-aligned surface overflows
and `position-try-fallbacks` flips it on every open. Consumer CSS could express it, but only by
reaching past `@supports` into `position-area`, which is exactly the internal the attribute exists
to keep private.

**Can `contracts:validate` attribute one shared stylesheet to three contracts? Yes, after one
change.** The root-presence check ran per stylesheet, so every file a contract claimed had to select
its root — impossible for `options.css` (three roots) and `floating.css` (none, it selects private
runtime hooks). The check now runs across a contract's stylesheets collectively, which is what it
was always for: catching a contract pointed at the wrong file.

**Can `anchor-scope` replace the per-instance `--ui-floating-anchor`? Not yet.** It is the
declarative form of the same idea and it would simplify three components, but it lands later than
anchor positioning itself in every engine, so adopting it would narrow support for no behavioral
gain. The custom-property mechanism is unchanged and the reasoning is now a comment in
`floating.css`, so the next reader does not re-derive it.

**Typeahead reset window: 700ms, unchanged.** There was nothing to reconcile — `listbox.ts` and
`menu.ts` had both landed on 700ms independently. It is named once now, as
`OPTION_TYPEAHEAD_RESET_MS` in `options.ts`, so they cannot drift apart again. `menu.ts` keeps its
own constant; unifying it is milestone 024's.

**A shared observable store: still rejected.** No new argument surfaced. State lives in ARIA and
native attributes; `values` reads `aria-selected` off the DOM rather than mirroring it.

## Constraints found during the work

**A `role="listbox"` may own only options and groups.** This is the constraint that shaped the
anatomy, and the plan's part table did not survive contact with it. A search field, a header, a
footer, or a pager inside the listbox is an `aria-required-children` violation — caught by the axe
sweep, on the paged listbox story, exactly where the plan predicted it. Resolved by splitting the
element that is the popover from the element that carries the role:

- On Select and Combobox, an optional `surface` part is the popover and the `listbox` sits inside
  it. With nothing but options, the listbox is its own surface and the part is unnecessary, so the
  simple authored markup is unchanged.
- On `ui-listbox`, an optional inner `listbox` part takes the role and the host becomes the frame
  around it. Same rule, same escape hatch.

**`popovertarget` is only honoured on a button.** The plan framed `triggerWiring` as
authored-versus-imperative for a browser without the Popover API, but that browser cannot run the
component at all — enhancement reports `unsupported` and stops. The real distinction is the trigger
element: a `<button>` gets `popovertarget` and opens before any script loads; anything else keeps a
click listener. `no-javascript.spec.ts` proves the first case.

**Enhancement runs again on every subtree mutation, including the chips the element writes.** The
first `multiple` implementation lost its selection on the second click, because `enhanceSelectParts`
reset the listbox from a single `value`. Enhancement now restores the live selection instead. The
same shape caused a subtler problem: writing an attribute its unchanged value still produces a
mutation record, which re-triggers enhancement, which writes again. The sync helpers compare before
writing, which is what brought the large-dataset mutation budget back under its ceiling.

**`queryOwnedPart` stops at any ancestor carrying a `ui-*` class.** The `value` part sits inside a
`.ui-button` trigger, so an ownership query from the host never reaches it and the trigger label
silently stopped updating. Scoped to the trigger instead. Worth knowing before putting a part inside
a styled root.

**The JS positioning fallback was ungated in five components, not two.** Gating it in Select and
Combobox alone broke Popover: once the fallback reset moved into `floating.css` it became strong
enough to half-apply, and the surface shifted off its anchor. Popover, Hover Card, and Menu Button
are gated too now, which is what plan item 2b was reaching for anyway.

## Summary of changes

### The shared core

`packages/components/src/options.ts` is new and owns the option layer: `optionLabel`, `matchOption`,
`findOptions`, `findOptionGroups`, `visibleOptions`, `enabledOptions`, `applyOptionFilter`,
`findOptionByPrefix`, `optionPageWindow`, and `applyOptionWindow`. It adds no second collator and no
second normalisation path — `collection.ts` already had both, so filtering and typeahead still share
one matcher. `applyOptionWindow` is the only function that writes `hidden`, because filtering and
paging both express themselves that way and a two-pass version would have each clobber the other;
the private `data-ui-internal-paged` hook records what the pager hid, which is what lets
`filter="off"` and paging coexist.

`options.test.ts` covers label precedence, the collator matching `cafe` against `Café`, contains
versus starts-with versus off, prefix typeahead skipping hidden and disabled options, page
boundaries and clamping, and consumer-owned visibility surviving a re-page.

### The stylesheets

`options.css` and `floating.css` are new. The option row, hover, selected, disabled, and `[hidden]`
rules are written once instead of three times, with the three drifted differences resolved by
deletion: Select gains the `[data-ui-internal-active]` highlight and the `[hidden]` rule it never
had, and all three sit at one `:where()` specificity. `floating.css` holds the anchor hooks, the
anchored base, and the JS fallback reset — which closes the undeclared dependency where every
anchored component needed rules that lived only in `popover.css`.

Positioning is fixed and proven: `block-end span-inline-end` instead of `bottom center` and
`bottom left`, `min-inline-size: anchor-size(width)` inside its `@supports` guard,
`max-block-size: 100%`, and `margin-block` instead of `translate` so the gap counts toward the
overflow calculation `position-try-fallbacks` runs on. `popover.css` keeps centring on purpose, with
a comment saying why. The UA-centred default moved into `@supports not`, so the three positioning
states can no longer be decided by stylesheet import order.

### The contracts

| Contract   | Attributes |  Parts | Events | Variables |
| ---------- | ---------: | -----: | -----: | --------: |
| `listbox`  |      2 → 6 | 2 → 14 |  2 → 3 |     0 → 1 |
| `select`   |     3 → 11 | 4 → 22 |  2 → 6 |     0 → 2 |
| `combobox` |      1 → 8 | 3 → 20 |  2 → 6 |     0 → 2 |

Two new value sets, `collectionAlignments` and `optionFilterModes`, both in `values/options.ts`. The
four undeclared custom properties are declared or merged: `--ui-select-listbox-min-inline-size` and
`--ui-combobox-popup-width` are one `--ui-collection-surface-inline-size`, and
`--ui-floating-offset` and `--ui-menu-min-inline-size` are declared where they are read. Contracts
declaring no custom property went from 50 of 53 to 40 of 53; the remaining 40 need their own pass.

The Select `label` part is now `value`, which says what it holds and stops colliding with a form
label. The Combobox `input` part is now `trigger`, so the two surfaces share one vocabulary.

### The behavior

Groups, multiple selection with removable chips, a `clear` control, `empty` and `status` regions,
`header` and `footer` bands outside arrow navigation, opt-in paging, closed-state typeahead on a
Select trigger, caret-preserving Left and Right in a text field, `Backspace` removing the last chip,
and `filter="off"` handing visibility to the consumer through `ui-input`.

All three are form-associated: `name`, `required`, `disabled`, `setFormValue`, `setValidity`
anchored on the visible trigger, `formResetCallback`, `formDisabledCallback` tracking fieldset
disablement separately, and `formStateRestoreCallback`. `multiple` submits one entry per value under
one name, matching `<select multiple>`. `value` is the authored default: it seeds the selection,
stops applying after the first user commit, and comes back on reset.

`@timelessui/core` gained one thing: a protected `internals` accessor. It had been attaching
`ElementInternals` since milestone 012 and never exposing them.

### Examples, stories, and docs

The three factories emit the shared anatomy with `popovertarget` authored, so the copyable source
shows a trigger that works before its script loads. Eight new stories cover alignment, groups with
in-surface search, multiple with chips, paging, a searchable Select beside a Combobox,
consumer-owned filtering, and form participation. The catalog `guidance` for all three now says
plainly that Select and Combobox are the same ARIA pattern differing only in where you type, and
that Listbox is the inline core. The Command Palette recipe is documented as a composition — a
`searchable` Select inside a `ui-dialog` — and no `ui-command` element exists.

`.agents/reference/validators.md` now documents `packages/examples/scripts/validate.mjs`, the
strictest gate in the repository and the one that forces registry → generate → examples ordering.

## Measurements

| Measure                                       | Before          | After                   |
| --------------------------------------------- | --------------- | ----------------------- |
| `listbox.ts` / `select.ts` / `combobox.ts`    | 477 / 467 / 428 | 905 / 1082 / 895        |
| `options.ts` (new)                            | —               | 240                     |
| `listbox.css` / `select.css` / `combobox.css` | 48 / 83 / 92    | 51 / 25 / 33            |
| `options.css` / `floating.css` (new)          | —               | 317 / 66                |
| Duplicated option-row rule                    | 3 copies        | 1                       |
| Duplicated floating fallback reset            | 3 copies        | 1                       |
| `inset` + `position-try-fallbacks` block      | 5 copies        | 1                       |
| Elements with `static formAssociated`         | 0               | 3                       |
| `CSS.supports` probes                         | 0               | 1, used by 5 components |
| Contracts declaring no CSS custom property    | 50 of 53        | 40 of 53                |
| StoryLite routes                              | 89              | 98                      |
| Canonical examples                            | 45              | 46                      |
| Unit tests in `packages/components`           | 162             | 182                     |
| E2E tests                                     | 306             | 324                     |

### Performance budget

The budget moved, in both directions, and the script that measures it changed. It used to read one
stylesheet per entry, which after the split would have reported Select's CSS shrinking by two thirds
while a consumer still had to load `options.css` and `floating.css`. It now sums every stylesheet
the entry's contract declares — so the "before" column below is not comparable to the old baseline
for CSS, and the honest comparison is the third column.

| Entry      | JS raw, before → after | CSS raw, old metric | CSS raw, new metric |
| ---------- | ---------------------- | ------------------- | ------------------- |
| `popover`  | 17,264 → 18,233        | 4,503 → 4,785       | 7,622               |
| `listbox`  | 25,847 → 51,348        | 1,156 → 1,695       | 13,240              |
| `select`   | 60,215 → 110,398       | 2,198 → 604         | 14,986              |
| `combobox` | 58,374 → 103,331       | 2,375 → 873         | 15,255              |

The JS roughly doubles on the three collection entries. Nothing unexpected was pulled in — the only
new module in the closure is `value-state.js` — so the growth is the behavior this milestone added:
groups, paging, chips, the clear control, the empty and status regions, and form participation. The
shared cost is real and worth naming: a consumer who wants only a plain Select still loads all of
`options.css`, including the chip and pager rules they may never use. Splitting it further would
reintroduce exactly the drift this milestone removed.

## Validation results

`pnpm qa` is green: typecheck, `format:check`, build (which runs `generate:check`,
`contracts:validate`, and `manifest:validate`), 182 unit tests, `publint`, `attw`, and 324 E2E tests
across Chromium, Firefox, and WebKit.

Proven rather than asserted:

- The surface's inline-start edge matches its trigger's under `align="start"` and its inline-end
  edge under `align="end"`, and it is never narrower than the trigger. Both assertions fail on
  `main`.
- An open Select in an anchor-positioning browser carries no `data-ui-internal-floating` attribute
  and no inline `--ui-floating-left`.
- An authored `popovertarget` opens and Escape-closes the surface with scripting disabled.
- A form submits one entry for a single selection and one per value for a `multiple` one, `required`
  blocks with `valueMissing`, reset restores the authored `value`, and a nested `ui-listbox` submits
  nothing of its own.
- Consumer-owned filtering under `filter="off"` drives navigation, the empty state, and paging.
- The axe sweep covers all 98 routes, up from 89, with no violations.

Still owed: a deliberate `verify-apg-conformance` pass against the APG pattern text for all three,
and an assertion of the non-anchor fallback path — which no runner browser can currently exercise,
since all three support anchor positioning.

---

Generated by Claude Opus 5 - High reasoning

Implemented by Claude Opus 5 - High reasoning
