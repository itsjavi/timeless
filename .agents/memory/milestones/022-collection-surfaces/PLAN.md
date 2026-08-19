---
status: Implemented
---

# Milestone 022 Plan: Collection Surfaces — Listbox, Select, Combobox

## Goal

Rebuild the three option-collection components on one shared core, and take them from the happy path
to the surface a consumer actually needs: option groups, multiple selection with removable chips, a
search field inside a Select's surface, a clear control, empty and status regions, paged navigation
for long lists, form participation, and a popover that is the width of its trigger and aligned to
its edge instead of centred on it.

This is the largest single gap in the library. It is also where the most duplication lives: three
stylesheets repeat the same option styling three times with three gratuitous differences, three
surfaces use three different `position-area` values of which two are wrong, and two of the three
components cannot submit a value to a form at all.

## Context

Timeless declares 53 component contracts. `select` and `combobox` both declare `apg: 'combobox'` —
the registry already admits they are the same ARIA pattern — and between them they expose four
attributes: `open`, `placement`, `value`, and `value`. Base UI's Combobox exposes twenty-five parts.
The gap is not breadth; it is depth on three components.

### What the study found

Read directly from the source, not inferred.

**1. `ui-listbox` is already the shared core, for one of the two consumers.** `combobox.ts` does not
implement option handling; it forwards to listbox:

```ts
// combobox.ts:388
export function syncComboboxActiveDescendant(input, options, activeIndex) {
  if (!input) return null
  return syncListboxActiveDescendant(input, { host: input, options }, activeIndex)
}
// combobox.ts:397
export function filterComboboxOptions(options, value) {
  return filterListboxOptions(options, value) as readonly ComboboxOptionLike[]
}
// combobox.ts:404
export function comboboxOptionValue(option) {
  return listboxOptionValue(option)
}
```

Three pure pass-throughs that exist only to give Combobox its own export names. `select.ts` does
**not** delegate: it carries its own `selectOptionValue` (line 441) and `syncSelectValue` (line
432). So the sharing is half-built, and the half that exists is hidden behind aliases.

| File             | Lines | Delegates to listbox? |
| ---------------- | ----: | --------------------- |
| `listbox.ts`     |   477 | —                     |
| `select.ts`      |   473 | No                    |
| `combobox.ts`    |   434 | Yes, via 3 aliases    |
| `collection.ts`  |   255 | shared by all three   |
| `value-state.ts` |    64 | shared                |
| `floating.ts`    |   187 | shared                |

`collection.ts` already provides the keyboard layer for all three — `collectionNavigationTarget`,
`syncRovingTabIndex`, `findCollectionItemByTextPrefix`, `gridCollectionNavigationTarget`,
`isCollectionItemDisabled`, `resolveCollectionOrientation`. What is _not_ shared is option
discovery, selection state, surface wiring, and value serialisation.

**2. The option stylesheet is written three times.** `[role='option']` is byte-identical in all
three:

```css
/* select.css:46, combobox.css:46, listbox.css:14 — the same seven declarations */
display: grid;
min-block-size: 2rem;
align-items: center;
border-radius: var(--ui-radius-sm);
padding: var(--ui-space-2) var(--ui-space-3);
color: var(--ui-fg);
line-height: 1.25;
```

The hover, selected, and disabled rules repeat too — and the three copies have drifted:

| Rule                                              | `listbox.css`  | `combobox.css`    | `select.css`      |
| ------------------------------------------------- | -------------- | ----------------- | ----------------- |
| `[data-ui-internal-active]` in the hover selector | yes (line 28)  | yes (line 60)     | **no** (line 56)  |
| `[role='option'][hidden] { display: none }`       | yes (line 45)  | yes (line 77)     | **no**            |
| `:where()` wrapping of the selected rule          | none (line 34) | wrapped (line 66) | wrapped (line 61) |

Those are not design decisions, they are three copies that stopped matching. The missing
`[data-ui-internal-active]` in `select.css` is the visible symptom of a real behavioral difference:
Combobox and Listbox track an active option with a private runtime hook and keep DOM focus
elsewhere, while Select relies on `:focus-visible`, meaning Select moves real focus into the
surface. That difference is undocumented.

**3. Three surfaces, three `position-area` values, two of them wrong.**

| Stylesheet        | Value               | What it actually does                                                                                         |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `select.css:75`   | `bottom center`     | **Centres the surface on the trigger.** The reported defect.                                                  |
| `combobox.css:84` | `bottom left`       | **Selects the bottom-left corner tile** — diagonally below-and-left of the trigger, not left-aligned under it |
| `menu.css:94`     | `bottom span-right` | Correct: starts at the trigger's inline-start edge, spans outward                                             |
| `popover.css:101` | `bottom center`     | Correct _for a popover or tooltip_, which conventionally centre                                               |

`position-area` is a 3×3 grid around the anchor. A two-keyword value of two side keywords picks a
single **corner tile**; a side plus a `span-*` keyword places the element in the centre of that row
and spans outward, which is what edge alignment means. So `bottom left` and `bottom center` are both
wrong for a select, and only Menu got it right. The logical, RTL-safe forms are
`block-end span-inline-end` for start alignment and `block-end span-inline-start` for end alignment.

**4. Only Combobox sizes itself against its trigger.**

```css
/* combobox.css:29 */
inline-size: max(var(--ui-combobox-popup-width, 14rem), anchor-size(width));
```

`select.css:16-18` has no `anchor-size()` at all — it uses `inline-size: max-content` with
`min-inline-size: var(--ui-select-listbox-min-inline-size, 14rem)`. So the requirement "minimum
width is the trigger width" is already solved in one component and absent from the other, and the
two components expose _differently named custom properties for the same concept_
(`--ui-combobox-popup-width` versus `--ui-select-listbox-min-inline-size`). The `max-inline-size`
values differ too, arbitrarily: `min(22rem, calc(100vw - 2rem))` versus
`min(24rem, calc(100vw - 1.5rem))`.

**5. The trigger gap is applied with `translate`.** `select.css:76`, `combobox.css:85`, and
`popover.css:102` all use `translate: 0 var(--ui-floating-offset, 0.375rem)`. A transform is applied
after layout, so it does not participate in the overflow calculation that drives
`position-try-fallbacks`. The surface can therefore be judged as fitting, then translated partly
off-screen. `margin-block` on the anchored element is the declaration that both positions the gap
and counts toward the fit.

**6. Two of the three components cannot participate in a form.** The registry declares:

| Contract   | Attributes                   | `name`? | Form value                                                                                                         |
| ---------- | ---------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| `select`   | `open`, `placement`, `value` | no      | author-supplied `<input type="hidden">`, found via `select.ts:90` and written by hand in `collections.html.ts:111` |
| `combobox` | `value`                      | no      | **none**                                                                                                           |
| `listbox`  | `multiple`, `value`          | no      | **none**                                                                                                           |

No component in `packages/components/src` declares `static formAssociated` or calls `setFormValue`,
`setValidity`, or `formResetCallback`. `@timelessui/core` attaches internals (`ui-element.ts:304`)
and already exposes `setCustomState` / `hasCustomState`, which colour-picker and toast use — so the
internals plumbing exists and is simply unused for form participation. A combobox that cannot submit
is not usable in the forms it is designed for.

**7. Four more defects found while measuring, each of which changes the plan.**

**(a) `aria-selected` is used to mark the _active_ option, which destroys the selection.**

```ts
// listbox.ts:373-377, inside syncListboxActiveDescendant
const resolvedIndex = syncListboxActiveOption(parts, activeIndex)
parts.options.forEach((option, index) => {
  option.setAttribute('aria-selected', String(index === resolvedIndex))
})
```

`aria-selected` is selection state; `aria-activedescendant` is which option is _focused_. Writing
`aria-selected` from the active index means arrowing through a combobox announces every option you
pass as "selected", repaints each one with the accent treatment from `combobox.css:66`, and wipes
`aria-selected="true"` off the option that is actually selected. This is a correctness bug in the
shared helper, and it must be fixed before `multiple` is built on top of it — multiple selection is
unimplementable while the selection attribute is being used as a focus ring.

**(b) The anchor-positioning fallback is unreachable, because nothing detects support.**
`grep -rn "CSS.supports" packages/components/src packages/core/src` returns **nothing**.
`applyFloatingPosition` ([floating.ts:76-114](packages/components/src/floating.ts:76)) stamps
`data-ui-internal-floating="fallback"`, `data-ui-internal-placement`, and inline
`--ui-floating-left` / `--ui-floating-top` unconditionally, and in `select.ts` it is called from
exactly one place — `@watch('placement')` at
[select.ts:188-197](packages/components/src/select.ts:188). So:

- In a browser **with** anchor positioning, changing `placement` while open stamps the private
  fallback attribute and computes coordinates that the later `@supports` rule then discards via
  `inset: auto` ([select.css:74](packages/components/src/css/select.css:74)). Dead work, a private
  hook stamped in a supported browser, and a cascade that resolves correctly only by source order —
  reorder the stylesheet and positioning breaks.
- In a browser **without** anchor positioning, nothing calls `applyFloatingPosition` at all unless
  the author happens to change `placement`, so the `[data-ui-internal-floating='fallback']` block
  that exists in `select.css:34-44`, `menu.css:37-47`, and `popover.css:71-83` is effectively
  unreachable.

The documented "unsupported anchor positioning falls back" story is therefore unimplemented. Fix
both halves: gate the call on support, and make missing support the thing that triggers it.

**(c) `anchor-size(width)` sits outside its `@supports` guard.** `combobox.css:29` is in the
unguarded block while the anchor rules are guarded at line 81. A declaration containing an invalid
`anchor-size()` is invalid at computed-value time, so before JS wires `position-anchor` the whole
`inline-size` declaration drops and the surface falls back to `auto`. So the one component that
appeared to solve trigger-width tracking does not reliably do so either.

**(d) `select.css` has no `[placement]` selectors at all.** The registry declares `placement` on
`select` against `floatingPlacements` with default `bottom`
([component-registry.mjs:1268-1272](packages/components/scripts/component-registry.mjs:1268)), and
`menu.css:112-125` implements all four. `select.css` implements none, so
`<ui-select placement="top">` has no CSS effect. `contracts:validate` does not catch it, which is
worth recording alongside the milestone-021 finding about the same gate: it proves a _value_ is
selected somewhere, not that the component that declares it implements it.

**(e) `ui-listbox` and popover-mode `ui-menu` have no `max-block-size` and no `overflow`.**
`listbox.css:2-12` and `menu.css:23-31` set neither, so a fifty-item listbox overflows the viewport
with no way to scroll it. The select and combobox surfaces do clamp; the standalone listbox does
not.

**7b. Select and Combobox open their surface imperatively, so their triggers are dead until JS
loads.** `select.ts:279` and `:289` call `showPopover()` / `hidePopover()` directly, as does
`menu-button.ts:185` / `:197`. By contrast `ui-popover` **writes `popovertarget`** onto its trigger
(`popover.ts:187`) and its example authors it (`overlays.html.ts:265`), so a popover opens before
any script runs.

Milestone 020 identified exactly this and deferred it, with the reasoning that "plain
`popovertarget` would do the same and is already widely available — consistency, not capability".
That deferral is correct in isolation and wrong here: **this milestone rewrites Select's open path
anyway.** Adopting `popovertarget` while the path is already open costs almost nothing; deferring it
again means a third pass over the same code. Note the fix is `popovertarget`, **not**
`command`/`commandfor` — a select surface is a popover, not a dialog, and there is no invoker
command that opens one usefully.

**8. Four surface custom properties read as public API and are declared nowhere.**
`--ui-select-listbox-min-inline-size` (`select.css:17`), `--ui-combobox-popup-width`
(`combobox.css:29`), `--ui-menu-min-inline-size` (`menu.css:13`), and `--ui-floating-offset` (eleven
call sites) are all set on or read by public roots, and none appears in any contract's `variables`.
This is systemic rather than local: **50 of the 53 contracts declare zero CSS custom properties**,
and only `button` (13), `range` (2), and `toaster` (2) declare any. Nothing in `contracts:validate`
or `manifest:validate` checks it, which is how they drifted. This milestone fixes the four it
touches and records the rest.

**9. Structural duplication beyond the option row.** The nine-declaration
`[data-ui-internal-floating='fallback']` reset is byte-identical in `select.css:34-44`,
`menu.css:37-47`, and `popover.css:71-83`. The `inset: auto` + `translate` + four-line
`position-try-fallbacks` block appears five times (`select.css:74-80`, `combobox.css:83-89`,
`popover.css:100-106`, `menu.css:93-99`, `menu.css:103-109`), and the per-placement `translate`
variants twice more (`popover.css:109-125`, `menu.css:112-125`).

**10. The anchor hooks live only in `popover.css`.** `anchor-name` and `position-anchor` are
declared once, at [popover.css:63-69](packages/components/src/css/popover.css:63), against
`[data-ui-internal-floating-anchor]` and `[data-ui-internal-floating-content]`. Every anchored
component depends on that file. A consumer who imports `tokens.css`, `button.css`, and `select.css`
— exactly what the `select` catalog entry lists minus `popover.css` — gets an unanchored,
viewport-centred listbox. The dependency is real and undeclared.

**11. The registry describes Select's focus model backwards.** `component-registry.mjs:1306` says
the active option "is announced through `aria-activedescendant`". `select.ts:251-253` moves real DOM
focus with roving `tabindex`, and `select.ts:237` reads the active option back off `tabindex="0"`.
One of the two has to change, and since this milestone is choosing Select's focus model anyway, fix
the contract to match whatever is chosen.

**12. `findMenuItems`-style direct-children discovery is the blocker for option groups.** The menu's
`findMenuItems` filters `host.children` (`menu.ts:399-403`), so wrapping items in a container
removes them from navigation entirely. Whatever option-group markup this milestone adopts, the
discovery function must descend — and the same fix is needed for Menu in milestone 024, which is why
the part vocabulary is decided here and adopted there.

### Techniques adopted, and where they come from

The following are patterns worth taking, evaluated on their merits. Several were validated in a
separate prototype; what matters here is the technique, restated in Timeless conventions.

- **Locale-aware filtering — already built, do not rebuild it.** This was the first technique on the
  adoption list, and checking the source removed it: `collection.ts` already has the whole thing.
  `collectionCollator` ([collection.ts:227-241](packages/components/src/collection.ts:227)) caches
  one `Intl.Collator` per locale with `{ sensitivity: 'base', usage: 'search' }`;
  `normalizeCollectionText` ([collection.ts:243-247](packages/components/src/collection.ts:243))
  collapses whitespace, trims, lowercases per locale, and applies NFC; and `collectionTextMatches`
  ([collection.ts:133-153](packages/components/src/collection.ts:133)) does the code-point
  sliding-window compare with both `contains` and `prefix` modes. `filterListboxOptions` routes
  through it, so Timeless filtering is _already_ case- and diacritic-insensitive — "cafe" already
  matches "Café".

  So `options.ts` **reuses** `collection.ts` and adds only what is genuinely missing:
  1. **Label precedence.** `collectionItemText`
     ([collection.ts:129-131](packages/components/src/collection.ts:129)) resolves
     `aria-label ?? textContent`. There is no `label` attribute and no `data-label`, so a consumer
     whose option renders an avatar and two lines of text has no way to supply a short filterable
     label except by overriding `aria-label` — which changes the accessible name as a side effect.
     That is the real gap.
  2. **`ignorePunctuation`.** Not set today. Decide deliberately: it makes "St. John" match "St
     John", and it also makes "C++" match "C". Test both before choosing.
  3. **Exposing the mode.** `CollectionMatchMode` is `'contains' | 'prefix'` internally and is not a
     public attribute. The `filter` attribute below surfaces it, adds `off`, and stops being a
     private choice.

  Do **not** add a second collator. A second normalisation path would let filtering and typeahead
  disagree, which is the exact failure the shared module exists to prevent.

- **Consumer-owned filtering through the same channel as built-in filtering.** Option visibility is
  the `hidden` attribute on option elements. A `filter="off"` opt-out plus an `inputchange` event
  lets a consumer hide, show, replace, or lazily fetch options themselves and get identical
  navigation, empty-state, and paging behavior, because everything downstream reads `hidden`. This
  is the answer to "let consumers bring their own search data and mechanism": no data-provider
  interface, no adapter, just the DOM plus one event and one opt-out.
- **Focus stays on the search field; options are highlighted virtually.** With a search input in the
  surface, DOM focus must remain in the input or typing breaks. Options carry ids and the input
  carries `aria-activedescendant`. This is what Combobox and Listbox already do via
  `[data-ui-internal-active]`, and what Select does not.
- **Left and Right arrows stay caret movement.** In a searchable surface, horizontal arrows must
  move the text caret, not the highlight — except in a grid-layout surface, where they navigate
  columns.
- **Closed-state typeahead on a button trigger.** Printable characters on a closed Select select a
  matching option without opening, which is what a native `<select>` does. Timeless's Select does
  not do this today.
- **Paging, not virtualisation.** For long lists, render a window of options and page through it.
  Virtualisation needs measured heights, breaks find-in-page, and makes `aria-setsize` /
  `aria-posinset` a manual bookkeeping problem. Paging keeps the rendered set small, keeps every
  rendered option real, and is expressible as authored markup. Boundary buttons stay focusable and
  take `aria-disabled` rather than `disabled`, so a screen-reader user can discover the boundary
  instead of finding the control gone. The page indicator lives in a `role="status"`
  `aria-live="polite"` region.
- **`anchor-size(width)` for the minimum width and `max-block-size: 100%` for the height.** Under
  anchor positioning, a percentage block size resolves against the `position-area` tile, so `100%`
  self-clamps to the space actually available in the chosen direction — better than a hardcoded
  `min(18rem, calc(100vh - 2rem))`.
- **`anchor-scope`** confines an anchor name to a component subtree so two instances on a page
  cannot capture each other's anchor. Timeless currently achieves this with a per-instance custom
  property (`popover.css:63-69`); `anchor-scope` is the declarative form and worth evaluating as a
  simplification, not adopting blind.
- **A text-node write guard.** Writing an unchanged text node inside an element observed by a
  child-list `MutationObserver` re-triggers the observer forever and starves the event loop. Core's
  `observeParts` queues re-enhancement, which makes the loop cheaper but does not break it. Every
  place this milestone writes a trigger label must compare before assigning.

### Decisions taken

**1. Keep three custom elements. Promote `ui-listbox` to the explicit shared core.**

The alternative — one element with `behavior="combobox | listbox | select"` — was considered and
rejected:

- The registry declares exactly one `accessibility.pattern` per contract, and the generated
  reference renders one keyboard table per page. An element with three behaviors would need three
  contracts pointing at one root, or one page documenting three mutually exclusive keyboard maps.
  Milestone 021 is already testing whether the registry can express a _qualified_ root; making one
  element carry three APG patterns is a larger bet on the same untested capability.
- `ui-listbox` genuinely differs: it has no trigger and no popover, it is visible inline, and its
  APG pattern is `listbox`, not `combobox`. Folding it into a popover element would either force a
  popover onto an inline listbox or make an attribute change the element's role.
- The real overlap is `ui-select` versus `ui-combobox`, and those two already share an APG pattern.
  They are one attribute apart, not one element.

So: `ui-listbox` owns option discovery, selection, groups, typeahead, active-descendant, and paging.
`ui-select` and `ui-combobox` each compose a listbox surface and add a trigger. Composition is the
library's stated model — author-owned Light DOM, enhanced in place — and it makes the shared core a
_public_ element rather than a hidden internal module.

**2. Select and Combobox get identical anatomy.** The only difference becomes where typing happens:

- `ui-select` — a `<button>` trigger; add `searchable` to put a search field inside the surface.
- `ui-combobox` — an `<input role="combobox">` as the trigger; free text, with the surface filtering
  as you type.

A `searchable` Select and a Combobox then differ only in whether the text field is inside or outside
the surface, which is the honest description of the difference and is one attribute wide.

**3. The form value comes from `ElementInternals`, not a hand-authored hidden input.** Add `name`,
`required`, and `disabled` to all three, `static formAssociated = true`, `setFormValue`,
`setValidity`, and `formResetCallback`. Keep reading an author-supplied hidden input if one is
present, so the current Select example does not break, but stop requiring it.

**4. `value` is the default; the live value is the property.** Mirror native inputs: the `value`
attribute seeds the initial selection and stops applying once the user has committed a change, and
`formResetCallback` restores it. Without this, a framework that re-renders the attribute clobbers
user input.

**5. Multiple selection uses chips in the trigger area, and `Backspace` removes the last one.** The
form value for a multiple selection is one entry per selected value under the same `name`, matching
`<select multiple>`.

**6. Paging is opt-in and off by default.** No `page-size` means no pager, no status line, and no
behavior change for the overwhelming majority of lists.

**7. Alignment is a public attribute with a logical default.** `align="start | end"` mapping to
`block-end span-inline-end` and `block-end span-inline-start`. Not `left`/`right`.

**8. The rebuilt surface opens declaratively via `popovertarget`**, matching `popover.ts:187`, so a
Select trigger works before its script loads. This closes the item milestone 020 deferred, at the
one moment it is nearly free. It is **not** an invoker-command migration: `popovertarget` is the
right primitive for a popover surface, and 020's own reasoning for deferring said so.

## Architecture

- One new module, `packages/components/src/options.ts`, owns option discovery (descending into
  groups), the `Intl.Collator` filter, label resolution, group collapse, and the paging window. It
  takes structural `…Like` types the way `collection.ts` and `toolbar.ts` do, so it is unit-testable
  without a DOM.
- `listbox.ts` consumes `options.ts` and keeps its public exports. `select.ts` and `combobox.ts`
  stop reimplementing and stop aliasing: delete the three pass-throughs at `combobox.ts:388-406` and
  the `selectOptionValue` / `syncSelectValue` pair at `select.ts:432-441`, and re-export the listbox
  functions directly if a name must survive.
- **Public export names are load-bearing.** AGENTS.md: a public export must never change name or
  module. Every name currently exported from `select.ts`, `combobox.ts`, and `listbox.ts` must still
  be exported from the same module afterwards, even when its body becomes a re-export.
  `exports:validate` is the gate.
- Every custom property a public root sets or reads gets a registry `variable()` declaration,
  following the `button` / `range` / `toaster` precedent — or is renamed with an `--ui-internal-`
  prefix to say it is not public. That covers `--ui-select-listbox-min-inline-size`,
  `--ui-combobox-popup-width`, `--ui-menu-min-inline-size`, and `--ui-floating-offset`. The other
  ~46 undeclared contracts are out of scope here; record the count so a later milestone can take
  them.
- One stylesheet owns the option row and the floating listbox surface; `select.css`, `combobox.css`,
  and `listbox.css` keep only what is genuinely theirs. The three drifted differences are resolved
  by deletion, not by picking a winner per file.
- Selection state stays in ARIA. `aria-selected` on options, `aria-activedescendant` on the focused
  field, `aria-expanded` on the trigger. Host state with no attribute equivalent uses
  `setCustomState`. Private child hooks stay `data-ui-internal-*` and must never reach copyable
  story source.
- No visual declarations from JavaScript. The drag-free equivalents here are: JS sets `hidden`, ids,
  ARIA, and `data-ui-internal-*`; CSS decides what a hidden, active, or selected option looks like.
  Measured values — the paging window offset, if any — go through custom properties.
- `options.ts` must not import from `select.ts`, `combobox.ts`, or `listbox.ts`. The dependency runs
  one way.

## Constraints

- **`ui-listbox` nested inside `ui-select` means two form-associated elements.** The outer element
  owns the form value; a nested listbox must detect an owning collection host and not register its
  own. Decide this before writing `formAssociated`, and test the nested case — a listbox that
  submits a duplicate entry under the same `name` is the failure mode.
- `apg: 'combobox'` on both `select` and `combobox` must be reviewed against the APG select-only
  combobox pattern. A searchable Select with a text field inside the surface is not the same
  keyboard contract as an editable Combobox, and the registry has to declare each accurately or
  `verify-apg-conformance` has nothing to check against.
- `floatingPlacements` is `['bottom', 'top', 'right', 'left']` and is shared by popover, hover-card,
  select, and menu-button. A new `align` attribute needs its own set; do not overload `placement`.
- Removing `translate` in favour of `margin-block` changes `popover.css`, which milestone 021 also
  edits. Sequence 021 first.
- **Milestone 020 is `Accepted` and unimplemented (1 of 57 tasks), so it lands around this work.**
  It does not touch `select.ts`, `combobox.ts`, or `listbox.ts` — its scope is `ui-dialog` and
  `ui-sheet` only — so there is no file collision. But it establishes the house pattern for a
  declarative trigger with a JS fallback (`triggerWiring: 'authored' | 'listener'` reported out of
  the enhancement result, feature-detected, behaviourally indistinguishable). The `popovertarget`
  adoption here should follow that shape rather than inventing a second one. Read 020's `RESULTS.md`
  before starting if it has landed.
- `contracts:validate` proves values against stylesheets in both directions. Every new attribute
  value needs a selector, and every selector needs a declared value, in the same commit.
- **`packages/examples/scripts/validate.mjs` is the strictest gate in the repository and is missing
  from [.agents/reference/validators.md](.agents/reference/validators.md).** It runs as
  `pnpm -F @timelessui/examples run test`, imports the registry directly, renders every example, and
  throws on seventeen distinct conditions. Four of them govern this milestone directly:

  | Failure                                                                        | Consequence here                                                                                                                                                       |
  | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `<id> uses unknown part <token>`                                               | Every new `data-ui-part` token — `chips`, `chip-remove`, `pager`, `page-status`, `header`, `footer` — must be declared in the registry **before** any example emits it |
  | `<id> uses unknown public attribute <name>`                                    | Same for `align`, `searchable`, `filter`, `page-size`, `name`, `required`                                                                                              |
  | `<id> authors private runtime hook <name>`                                     | `data-ui-internal-active` may never appear in an example factory                                                                                                       |
  | `<id> renders unregistered element <tag>` / `without declaring its definition` | A new tag needs registration and a `definitions` entry                                                                                                                 |

  This forces the ordering in **Implementation sequence**: registry first, generate second, examples
  third. Reversing it fails the build rather than producing a warning. Add this validator to
  `.agents/reference/validators.md` as part of this milestone, since five milestones are about to
  depend on it.

- **`apps/stories/story-routes.json` is generated, committed, and holds 88 routes today**, written
  by `apps/stories/scripts/write-route-catalog.mjs`.
  `apps/e2e/tests/apps/stories/a11y.spec.ts:16-21` loads it and creates one axe test per route.
  Every story this milestone adds therefore adds an axe test automatically, and the committed
  catalog must be regenerated in the same commit or the sweep runs against a stale list.
- New events must declare the detail type the element really dispatches, and `manifest:validate`
  fails when the named type is not exported. Do not reuse `UITransitionDetail` for a selection
  change.
- `performance:check` has a budget. This milestone adds behavior to three components; if the budget
  moves, record the before and after rather than raising the number quietly.
- Every value list goes in `valueSets` and is imported by stories, examples, and tests. Never
  hand-copy into `argTypes.options`.
- The paging control is **not** the navigation Pagination component planned for milestone 025. Name
  the part `pager` here and reserve `ui-pagination` for page navigation, so the two never collide in
  docs or in CSS.

## Implementation sequence

### 1. Shared option core — new file `packages/components/src/options.ts`

Colocate `options.test.ts`. This module **builds on** `collection.ts` and must not duplicate its
collator, normalisation, or match logic. Export:

- `optionLabel(option)` — `label` attribute, then `data-label`, then `aria-label`, then trimmed text
  content. This extends `collectionItemText`'s existing `aria-label ?? textContent` order with the
  two author-supplied hooks it lacks. Feed the result to `collectionTextMatches`; do not reimplement
  matching.
- `matchOption(option, query, mode, locale)` — a thin wrapper over `collectionTextMatches` that
  takes its candidate from `optionLabel`. This is the only new matching surface, and it exists so
  filtering and typeahead share one entry point.
- Decide and record whether `collectionCollator` gains `ignorePunctuation: true`. If it does, it
  changes typeahead for Menu, Toolbar, and Toggle Group too, since they all use `collection.ts` — so
  either accept that blast radius deliberately or thread the option through
  `CollectionMatcherOptions` instead.
- `findOptions(host)` — every `[role='option']` in the subtree whose nearest collection root is
  `host`, **descending through groups**. This is the function `menu.ts:399` should have been.
- `visibleOptions(options)` — those without `hidden`.
- `applyOptionFilter(options, query, filter)` — sets `hidden`, returns the visible set.
- `groupIsEmpty(group)` — for collapsing a group whose every option is filtered out. Prefer the CSS
  `:has()` form; keep the function only if CSS cannot express it.
- `optionPageWindow(options, pageSize, page)` — `{ visible, page, totalPages }`, pure.

Replace `listbox.ts`'s private `visibleListboxOptions` and `normalizeListboxText` with calls into
this module, keeping the public `filterListboxOptions` export as a thin wrapper so its name and
module survive.

Reconcile the typeahead reset window: `listbox.ts:75` uses `700ms`. Pick one value, name it in
`options.ts`, and state the choice.

`isCollectionItemDisabled` ([collection.ts:208](packages/components/src/collection.ts:208)) is the
disabled predicate for this trio — six call sites: `listbox.ts:155`, `:167`, `:451`,
`combobox.ts:243`, `:271`, `select.ts:209`. It is **not** the library's only one: `menu.ts:391`
declares `isMenuItemDisabled`, and `choice-group.ts` and `toggle-group.ts` carry their own. Do not
unify those here — Menu's is milestone 024's problem, and touching four components' disabled
semantics inside a collection refactor is how a milestone stops landing.

### 2. Unify the option and surface stylesheets

New `packages/components/src/css/options.css`, or a shared block inside `listbox.css` — decide by
whether `contracts:validate` can attribute a shared stylesheet to three contracts, and record the
answer.

- Move the `[role='option']` row, hover, selected, disabled, and `[hidden]` rules there once.
- Include `[data-ui-internal-active]` in the active selector for **all three**, which fixes Select.
- Include `[role='option'][hidden] { display: none }` for all three, which fixes Select.
- Use one `:where()` convention throughout so specificity is uniform and consumer CSS wins
  predictably.
- Add `[role='option'][hidden] { display: none !important }` only if a real theme conflict is
  observed. An `!important` in a component stylesheet needs a recorded reason — milestone 021 is
  removing an unexplained one.
- Move the floating listbox surface — border, radius, padding, background, shadow, scroll — into one
  place, and replace the two rival custom properties with one name.

Extract the three structural blocks that are currently copied:

- the nine-declaration `[data-ui-internal-floating='fallback']` reset, identical in
  `select.css:34-44`, `menu.css:37-47`, and `popover.css:71-83`;
- the `inset: auto` + offset + `position-try-fallbacks` block, appearing five times;
- the per-placement variants, appearing twice.

Move `anchor-name` and `position-anchor` out of `popover.css:63-69` into whichever stylesheet every
anchored component is guaranteed to load, or declare the `popover.css` dependency explicitly in each
catalog entry's `styles` array and in the registry description. Verify by rendering a `ui-select`
with only `tokens.css`, `button.css`, and `select.css` loaded and asserting the open listbox sits
next to its trigger.

Give `ui-listbox` and popover-mode `ui-menu` a `max-block-size` and `overflow: auto`, so a long list
is reachable. Ship `max-block-size` and `overflow` together — a height clamp without a scroll
container just truncates.

Then fix the positioning, in whichever stylesheet owns the surface:

```css
@supports (anchor-name: --ui-anchor) {
  /* Start-aligned by default: begins at the trigger's inline-start edge and spans outward. */
  ui-select > [role='listbox']:popover-open,
  ui-combobox > [role='listbox']:popover-open {
    inset: auto;
    position-area: block-end span-inline-end;
    min-inline-size: anchor-size(width);
    max-block-size: 100%;
    margin-block: var(--ui-floating-offset, 0.375rem);
    position-try-fallbacks:
      flip-block,
      flip-inline,
      flip-block flip-inline;
  }

  :where(ui-select, ui-combobox):where([align='end']) > [role='listbox']:popover-open {
    position-area: block-end span-inline-start;
  }
}
```

- Delete `translate` from the anchored rules; the gap is `margin-block`.
- Do **not** change `popover.css:101`'s `bottom center`. A popover and a tooltip centre on their
  anchor by convention; only the collection surfaces are edge-aligned. Say so in a comment, because
  the next reader will otherwise "fix" it.
- Consider whether `anchor-scope` on the host can replace the `--ui-floating-anchor` per-instance
  custom property at `popover.css:63-69`. If it can, it simplifies three components; if it cannot,
  leave the existing mechanism alone and record why.
- Keep the anchor rules **out of** `:popover-open` if any exit transition is ever added, or the
  surface will jump to the UA-centred fallback mid-close. There is no exit transition today, so this
  is a comment and a constraint, not a bug being fixed.
- **Move `anchor-size(width)` inside the `@supports` guard.** At `combobox.css:29` it sits outside,
  so the entire `inline-size` declaration is invalid at computed-value time until JS wires
  `position-anchor`, and the surface silently falls back to `auto`. Verify the surface is at least
  the declared floor with JavaScript disabled.
- **Add the four `[placement]` rules to the select surface**, mirroring `menu.css:112-125`, so the
  declared `placement` attribute has a CSS implementation instead of only a JS one.

### 2a. Open the surface declaratively

- Wire `popovertarget` from the trigger to the surface, the way `popover.ts:187` already does, and
  stop calling `showPopover()` / `hidePopover()` imperatively from `select.ts:279` and `:289`.
- Keep an imperative fallback for browsers without the Popover API, feature-detected through the
  capability module, and report which path is live out of the enhancement result — the shape
  milestone 020 establishes for dialog and sheet.
- The example factories must author `popovertarget` so the copyable source shows a trigger that
  works before the script loads.
- Add a `no-javascript.spec.ts` case asserting the surface opens with scripting disabled. That case
  is the whole justification; if it fails, keep the imperative path and record why.
- Leave `ui-menu-button` alone. It has the same defect and is not in this milestone's scope; note it
  for a later pass rather than widening this one.

### 2b. Make the anchor-positioning fallback real

Two halves, and both are needed:

- Add `supportsAnchorPositioning(win)` to the capability module milestone 021 creates —
  `win.CSS?.supports?.('anchor-name: --x') ?? false`. There is currently **no `CSS.supports` call
  anywhere** in `packages/components/src` or `packages/core/src`.
- Gate `applyFloatingPosition` on it. Today `select.ts:188-197` calls it from `@watch('placement')`
  only, ungated, so in a supporting browser it stamps `data-ui-internal-floating="fallback"` and
  computes coordinates the `@supports` rule then discards, and in a non-supporting browser it never
  runs at all unless the author changes `placement`. Invert both: run it **because** support is
  missing, and never stamp the private hook when support is present.
- Give Combobox a fallback path or state in the registry that it deliberately has none. It imports
  only `syncFloatingAnchor` (`combobox.ts:16`) and its stylesheet has no fallback block, making it
  the only anchored surface with no non-anchor story.
- Assert in E2E that an open select in an anchor-positioning browser carries **no** inline
  `--ui-floating-left` and no `data-ui-internal-floating` attribute.

### 3. Registry: the shared part vocabulary and the new attributes

This step decides names that milestone 024 will reuse for Menu. Get it right here.

Parts, shared across the three contracts as applicable:

| Part               | On                              | Purpose                                                     |
| ------------------ | ------------------------------- | ----------------------------------------------------------- |
| `trigger`          | select, combobox                | The button or input that opens the surface                  |
| `value`            | select                          | Where the selected label is written                         |
| `search`           | select (`searchable`), combobox | The text field that filters                                 |
| `listbox`          | all three                       | `role="listbox"` container                                  |
| `option`           | all three                       | `role="option"`                                             |
| `option-indicator` | all three                       | Selected affordance inside an option                        |
| `group`            | all three                       | `role="group"` wrapper                                      |
| `group-label`      | all three                       | Its label, wired with `aria-labelledby`                     |
| `separator`        | all three                       | `role="separator"`, skipped by navigation                   |
| `chips`            | select, combobox                | Container for a multiple selection                          |
| `chip`             | select, combobox                | One selected value                                          |
| `chip-remove`      | select, combobox                | Its remove button                                           |
| `clear`            | select, combobox                | Clears the whole selection                                  |
| `empty`            | all three                       | Shown when zero options are visible                         |
| `status`           | all three                       | `role="status" aria-live="polite"`; counts, loading, errors |
| `header`           | all three                       | Optional surface header, outside option navigation          |
| `footer`           | all three                       | Optional surface footer, outside option navigation          |
| `pager`            | all three                       | Wraps the page controls; hidden unless paging is on         |
| `page-previous`    | all three                       | Focusable at the boundary, `aria-disabled`                  |
| `page-next`        | all three                       | Same                                                        |
| `page-status`      | all three                       | `role="status" aria-live="polite"`                          |

`header` and `footer` must be excluded from `findOptions` and from arrow navigation, and must be
reachable by `Tab` from the search field. State that in the accessibility notes, because an
interactive control inside a `role="listbox"` that arrow keys skip is the kind of thing that reads
as a bug.

Attributes:

| Attribute    | On               | Values / type                                                                         | Notes                                     |
| ------------ | ---------------- | ------------------------------------------------------------------------------------- | ----------------------------------------- |
| `name`       | all three        | string                                                                                | Form field name                           |
| `required`   | all three        | boolean, presence                                                                     | `setValidity({ valueMissing })`           |
| `disabled`   | all three        | boolean, presence                                                                     |                                           |
| `multiple`   | select, combobox | boolean, presence                                                                     | listbox already has it                    |
| `align`      | select, combobox | new `collectionAlignments` set, `['start', 'end']`, default `start`                   |                                           |
| `searchable` | select           | boolean, presence                                                                     | Puts the `search` part inside the surface |
| `filter`     | select, combobox | new `optionFilterModes` set, `['contains', 'starts-with', 'off']`, default `contains` | `off` hands filtering to the consumer     |
| `page-size`  | all three        | number                                                                                | Absent means unpaged                      |

Booleans use presence, never `="true"`. `align`, `filter`, `searchable`, and `page-size` are plain
attributes on custom-element hosts, never `data-ui-*`.

Events — each needs a detail type exported from the module that dispatches it, or
`manifest:validate` fails:

| Event              | Detail                                   | Cancelable    |
| ------------------ | ---------------------------------------- | ------------- |
| `ui-select-change` | selected values, previous values, reason | yes           |
| `ui-select-input`  | query text                               | no            |
| `ui-select-open`   | open state, reason                       | while opening |
| `ui-select-page`   | page, totalPages                         | no            |

Use the module's existing event-naming convention; check `events.ts` before inventing one.

### 3b. Separate active from selected

This blocks everything in step 4 and 5, so do it before them.

`syncListboxActiveDescendant` ([listbox.ts:373-377](packages/components/src/listbox.ts:373)) writes
`aria-selected` from the active index. Stop. The correct split:

- `aria-activedescendant` on the controlling field names the active option. That already happens.
- The active option's _visual_ highlight comes from the existing private hook,
  `data-ui-internal-active` — which is why `combobox.css:60` and `listbox.css:28` include it and
  `select.css:56` needs it added.
- `aria-selected` reflects **selection only**, and is written by the selection code path, never by
  the navigation code path.

Add a unit test that arrows past a selected option and asserts the selected option keeps
`aria-selected="true"` while the passed-over option gets `data-ui-internal-active` and
`aria-selected="false"`. This is the test that makes `multiple` possible.

Also correct `component-registry.mjs:1306`, which documents Select as announcing the active option
through `aria-activedescendant` while `select.ts:251-253` moves real DOM focus with roving
`tabindex`. Whichever focus model step 5 chooses, the contract must say that one.

### 4. Listbox: groups, paging, form participation

- Swap internals to `options.ts`, keeping every public export name and module.
- Group support: `findOptions` descends; roving tabindex and `aria-activedescendant` operate over
  the flattened visible set; `group-label` is wired with `aria-labelledby` on the `role="group"`.
- Collapse a group whose options are all filtered out, preferring
  `[data-ui-part~='group']:not(:has([role='option']:not([hidden])))` in CSS over a JS `hidden`
  write.
- `static formAssociated = true` and the **full** callback set, not just reset: `setFormValue`,
  `setValidity`, `formResetCallback`, `formDisabledCallback` (a control inside a disabled
  `<fieldset>` is disabled without its own `disabled` attribute, so track that in a separate field),
  and `formStateRestoreCallback` for session restore. For `multiple`, submit one entry per value
  under the same `name`.
- Anchor `setValidity`'s third argument on the **visible trigger or input**, not the custom-element
  host. The host may have no layout, and the browser positions its native validation bubble against
  whatever element is passed.
- Add the nested-host guard from **Constraints**: a listbox inside a select or combobox does not
  register its own form value.
- Paging via `optionPageWindow`, wired to the `pager` parts, hidden unless `page-size` is set and
  more than one page exists.

### 5. Select: search inside the surface, chips, clear, closed-state typeahead

- Rebuild on the listbox core; delete `selectOptionValue` and `syncSelectValue` bodies, re-exporting
  from `listbox.ts` so the names survive.
- `searchable` renders — that is, _enhances an authored_ — `search` part inside the surface. Focus
  moves to it on open; DOM focus stays there; options highlight via `aria-activedescendant`. This is
  the change that gives Select the `[data-ui-internal-active]` behavior its stylesheet was missing.
- Non-searchable Select keeps focus on the trigger and moves `aria-activedescendant`, or moves DOM
  focus into options — pick one, make it match the APG pattern the registry declares, and do not
  keep both paths.
- Closed-state typeahead on the trigger via `getOptionTextFilter().startsWith`.
- `multiple` renders chips into the `chips` part. `Backspace` in an empty search field removes the
  last chip; each `chip-remove` is a real focusable button with an accessible name naming _which_
  value it removes.
- `clear` empties the selection, is disabled when there is nothing to clear, and gets a default
  accessible name only when the author supplied neither text nor label.
- Keep reading an author-supplied `<input type="hidden">` when present, so `collections.html.ts:111`
  keeps working, but drive the form value from internals.
- Guard every trigger-label text write with an inequality check.

### 6. Combobox: alignment with Select

- Same core, same parts, same events.
- `filter="off"` skips built-in filtering and emits the input event; the consumer sets `hidden` and
  everything downstream — navigation, empty state, paging, group collapse — keeps working because it
  all reads `hidden`. Document this as the extension point.
- Left and Right arrows move the caret. Only a grid-layout surface navigates with them.
- Add form participation, chips, clear, empty, status, and paging, as Select.
- Delete the three pass-through aliases at `combobox.ts:388-406`, re-exporting instead.

### 7. Examples, stories, docs

- [packages/examples/src/collections.html.ts](packages/examples/src/collections.html.ts): rebuild
  `createCustomSelect`, `createCombobox`, and `createListbox` so all three emit the shared anatomy.
  These factories feed both StoryLite and the website, so this is the public-API change consumers
  copy.
- Add factories or props for groups, chips, clear, empty, status, header, footer, and the pager.
- Catalog: rewrite the `select`, `combobox`, and `listbox` entries' `guidance` to say plainly that
  Select and Combobox are the same ARIA pattern differing in where typing happens, and that Listbox
  is the inline core.
- Stories: composite stories over the new dimensions — grouped options, multiple with chips, a
  searchable Select beside a Combobox, a paged long list, consumer-owned filtering with
  `filter="off"`. Give every story an explicit `source` snippet where the render adds demo wrappers.
- Import every value array from `values/`. Never hand-copy into `argTypes.options`.
- Milestone 021 promised a Command-palette recipe once this lands. Write it: a `searchable`
  multiple-off Select inside a `ui-dialog`, as a documented recipe, not a component.

### 8. Milestone records

`.agents/memory/milestones/022-collection-surfaces/`. `RESULTS.md` must record the measured
before-and-after line counts for the three modules and three stylesheets, the
nested-form-association decision, the typeahead-window choice, whether `anchor-scope` replaced the
custom-property anchor, and whether a shared stylesheet could be attributed to three contracts.

## Verification

1. **Unit** — `pnpm -F @timelessui/components run test`. New `options.test.ts` covering: the
   collator matching "cafe" against "Café" and case-insensitively; `contains` versus `starts-with`;
   `optionLabel` precedence across `label`, `data-label`, and text content; `findOptions` descending
   through a group; `optionPageWindow` at both boundaries and with a page size larger than the set.
2. **Regression on the aliases** — `select.test.ts`, `combobox.test.ts`, and `listbox.test.ts` must
   still pass, and `exports:validate` must confirm every previously public name is still exported
   from the same module.
3. **The positioning fix, measured** — an E2E assertion comparing the surface's bounding box to the
   trigger's: with `align="start"` the inline-start edges match within a pixel; with `align="end"`
   the inline-end edges match; the surface is never narrower than the trigger. Write this test first
   and watch it fail on `main`, so the centred-surface defect is demonstrated rather than described.
4. **Accessibility** — extend `a11y.spec.ts`, then run `verify-apg-conformance` against Select,
   Combobox, and Listbox. A `role="listbox"` containing a search field, a header, and a pager is
   exactly the shape that produces "interactive element inside a listbox" findings; resolve them
   deliberately rather than suppressing them.
5. **Keyboard** — E2E over the full map per component: arrows, Home, End, PageUp, PageDown,
   typeahead open and closed, Enter, Escape, Tab into header and footer, Backspace removing a chip,
   and Left and Right moving the caret in a searchable surface.
6. **Forms** — an E2E that submits a real `<form>` and asserts the serialised body: single value,
   multiple values under one `name`, `required` blocking submission with `valueMissing`, and
   `formResetCallback` restoring the `value` attribute after the user changed the selection.
7. **Consumer-owned filtering** — an E2E driving a `filter="off"` combobox whose consumer script
   sets `hidden`, asserting that navigation, the empty state, and paging all follow.
8. **No-JavaScript** — `no-javascript.spec.ts` must show the authored markup still renders readable
   options. These are enhanced components, so the bar is "inspectable and not broken", not "fully
   functional"; state which it is.
9. **Cross-browser** — add a case to `platform.spec.ts`, the only spec `stories-firefox` and
   `stories-webkit` run. `anchor-size()` is Baseline as of January 2026, so the runner's browsers
   must be checked and the non-anchor fallback path exercised if any predates it.
10. **Performance** — `performance:check`. Record any budget movement.
11. **Full gate** — `pnpm qa`.

```bash
pnpm qa
```

## Acceptance

- One module owns option discovery, filtering, label resolution, and paging, and `select.ts`,
  `combobox.ts`, and `listbox.ts` all consume it. No pass-through alias remains whose body is a
  single call to a listbox function.
- The `[role='option']` row, hover, selected, disabled, and `[hidden]` rules are declared once.
  Select gains `[data-ui-internal-active]` and `[hidden]` handling. All three use one `:where()`
  convention.
- One custom property names the surface width. `--ui-combobox-popup-width` and
  `--ui-select-listbox-min-inline-size` do not both exist.
- Select and Combobox surfaces are never narrower than their trigger, align to the trigger's
  inline-start edge by default and inline-end under `align="end"`, and neither uses
  `position-area: bottom center` or `bottom left`. Proven by a bounding-box E2E assertion that fails
  on `main`.
- The trigger gap is `margin-block`. No collection surface positions itself with `translate`.
- A Select trigger opens its surface with scripting disabled, via authored `popovertarget`, proven
  by `no-javascript.spec.ts`. No `showPopover()` call remains on the supported path, and the
  imperative fallback is feature-detected and reported out of the enhancement result.
- `popover.css`'s `bottom center` is unchanged, with a comment saying why popovers and tooltips
  centre while collection surfaces do not.
- Option groups work: options inside a `role="group"` are navigable, the group is labelled, and a
  group whose options are all filtered out disappears.
- `multiple` renders removable chips with per-chip accessible names, `Backspace` removes the last
  chip from an empty search field, and the form submits one entry per value under one `name`.
- A `searchable` Select filters from a field inside its surface with DOM focus in that field and
  `aria-activedescendant` tracking the highlight. Left and Right move the caret.
- A closed Select responds to printable characters by selecting without opening.
- `clear` empties the selection, is disabled when empty, and has an accessible name.
- `empty` appears at zero visible options; `status` announces counts, loading, and errors through
  `role="status" aria-live="polite"`.
- `header` and `footer` are `Tab`-reachable, excluded from arrow navigation, and documented as such.
- `page-size` pages long lists; the pager is absent when unset or when one page; boundary buttons
  stay focusable with `aria-disabled`; the page status is announced.
- All three elements are form-associated, support `name`, `required`, `disabled`, and reset, and a
  nested `ui-listbox` inside a Select or Combobox submits nothing of its own.
- The `value` attribute seeds the initial selection and stops applying after the first user commit;
  reset restores it.
- `filter="off"` plus the input event lets a consumer own filtering, with navigation, empty state,
  group collapse, and paging all still working. Covered by an E2E test.
- Every previously public export from the three modules is still exported from the same module.
- Every new attribute value is declared in `valueSets`, selected by a stylesheet, and imported
  rather than hand-copied into stories, examples, and tests.
- A Command-palette recipe is documented as a composition, and no `ui-command` element exists.
- `verify-apg-conformance` passes for all three, and the registry declares the pattern each one
  actually implements.
- `pnpm qa` is green, and any performance-budget movement is recorded with before and after.

---

Generated by Claude Opus 5 - High reasoning
