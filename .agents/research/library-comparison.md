---
model: Claude Opus 5 Ultracode
date: 2026-08-19
---

# Timeless UI vs Base UI vs shadcn/ui — surface comparison

Sources:

- Timeless: `packages/components/scripts/component-registry.mjs` (53 contracts) and
  `packages/examples/src/catalog.ts` (43 documented components).
- Base UI: `base-ui.com` sidebar + `llms.txt` (37 components).
- shadcn/ui: `ui.shadcn.com/docs/components` (64 entries).

## The headline

The premise "Timeless has too much stuff" is **not true by count** — it is true by **duplication**.

| Library   | Components        | Shape                                                  |
| --------- | ----------------- | ------------------------------------------------------ |
| Base UI   | 37                | Unstyled React primitives. Behavior only.              |
| Timeless  | 43 (53 contracts) | CSS-first, custom elements only where CSS can't reach. |
| shadcn/ui | 64                | Copy-paste recipes over Radix / Base UI / React Aria.  |

Timeless sits in the middle. It doesn't have too many _components_ — it has three places where **two
components do one job**, and that is what makes the library feel padded:

1. **Disclosure + Collapsible** — same `<details>`, same single `data-ui-density` attribute, no
   parts on either. Two stylesheets, two doc pages, two catalog entries, for lighter vs heavier
   padding.
2. **Choice Group + Checkbox Group / Radio Group** — one job split on _"do you want the JS or not"_.
   The consumer has to pick an implementation instead of a behavior.
3. **Tooltip** exists only as `<ui-hover-card variant="tooltip">` — documented as a component, not
   addressable as one.

The real problem is the opposite of too much: **the collection components are too shallow.**
Combobox, Select, and Menu all exist and all pass their APG pattern, but their contracts stop at the
happy path. Combobox declares one attribute (`value`) and three parts. Menu declares two parts
(`menu`, `item`) — no checkbox item, radio item, group label, or separator. That's what a consumer
hits on day two, and it's where the effort should go before any new component is added.

And the differentiator is unambiguous: **nothing in Base UI or shadcn ships colour.** Not a picker,
not a swatch, not OKLCH↔P3↔Rec2020 conversion, not gamut clamping, not WCAG contrast evaluation.
That's the moat.

---

## Foundations & Content

| Component           | Timeless                                | Base UI | shadcn/ui                                             | Verdict                                                                                                                                                                                                                                                              |
| ------------------- | --------------------------------------- | ------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Separator           | ✅                                      | ✅      | ✅                                                    | ✅ Keep.                                                                                                                                                                                                                                                             |
| Link / Kbd / Code   | ✅ three CSS contracts                  | ❌      | ⚠️ Kbd + Typography                                   | ✅ Keep. CSS-only, near-zero cost, and every docs site needs them.                                                                                                                                                                                                   |
| Card                | ✅                                      | ❌      | ✅                                                    | ✅ Keep. Base UI's absence is a behaviour-only library talking, not a signal.                                                                                                                                                                                        |
| Avatar              | ✅ shape + status                       | ✅      | ✅                                                    | ✅ Keep. Timeless is _ahead_ here — `data-ui-status` is a presence dot neither peer ships. Missing: avatar group / stack overlap.                                                                                                                                    |
| Table               | ✅ density, align, caption, empty       | ❌      | ✅ Table + ✅ Data Table                              | ✅ Keep the CSS table. ❌ Never build Data Table — that's TanStack Table's job and it would drag a runtime in.                                                                                                                                                       |
| List                | ✅ plain / divided / inset / ordered    | ❌      | ⚠️ Item                                               | ⚠️ Keep but trim. Four visual variants of `<ul>` is a design-system opinion, not a platform primitive — the most opinionated thing in the library. `divided` + `inset` earn their place; `plain` is the browser default and `ordered` is `<ol>`.                     |
| Group               | ✅ `ui-group` orientation/wrap/attached | ❌      | ✅ Button Group + Input Group                         | ✅ Keep, but split like shadcn did. Attached buttons and an input with addons are the same layout and _different_ affordances. Missing: input addon composition.                                                                                                     |
| Collapsible         | ✅                                      | ✅      | ✅                                                    | ⚠️ **Merge with Disclosure.**                                                                                                                                                                                                                                        |
| Disclosure          | ✅                                      | ❌      | ❌                                                    | ⚠️ **Merge into Collapsible** as `data-ui-variant="plain \| panel"`. Nobody else has two.                                                                                                                                                                            |
| Accordion           | ⚠️ a stack of Collapsibles              | ✅      | ✅                                                    | ⚠️ Gap in _behavior_, not markup. A stack of `<details>` isn't an accordion until one-open-at-a-time is coordinated — and `<details name="group">` does that natively across all three engines. Timeless doesn't use or document it. Cheapest real win on this page. |
| Aspect Ratio        | ❌                                      | ❌      | ✅                                                    | ❌ Drop from consideration. `aspect-ratio: 16/9` is one line of CSS. Shipping a component for it is the kind of padding this library should avoid.                                                                                                                   |
| Scroll Area         | ❌                                      | ✅      | ✅                                                    | ❌ Drop. Custom scrollbars fight the platform — they break momentum scrolling, overlay scrollbar conventions, and AT behaviour. `scrollbar-color`, `scrollbar-width`, and `scrollbar-gutter` are Baseline. Document the CSS instead of owning a component.           |
| Resizable           | ❌                                      | ❌      | ✅                                                    | ❌ Skip. App-shell furniture.                                                                                                                                                                                                                                        |
| Carousel            | ❌                                      | ❌      | ✅ (wraps Embla)                                      | ❌ Skip. Wrapping a third-party engine contradicts the platform thesis. CSS scroll-snap plus `::scroll-button()` is where this is going — revisit as CSS, never as JS.                                                                                               |
| Chart               | ❌                                      | ❌      | ✅ (wraps Recharts)                                   | ❌ Skip. Out of scope.                                                                                                                                                                                                                                               |
| Sidebar / app shell | ❌                                      | ❌      | ✅                                                    | ❌ Skip. Composition, not a primitive.                                                                                                                                                                                                                               |
| Chat & AI surfaces  | ❌                                      | ❌      | ✅ Bubble, Message, Attachment, Questionnaire, Marker | ❌ Skip. shadcn is expanding into _product_ surfaces. A general UI library has no business here.                                                                                                                                                                     |
| Tree View           | ❌                                      | ❌      | ❌                                                    | ❌ Skip. Nobody ships it; it's the hardest APG pattern for the least reuse.                                                                                                                                                                                          |

## Actions

| Component       | Timeless                     | Base UI | shadcn/ui  | Verdict                                                                                                                                                                |
| --------------- | ---------------------------- | ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button          | ✅ 7 variants, 3 sizes       | ✅      | ✅         | ✅ Keep.                                                                                                                                                               |
| Toggle          | ✅                           | ✅      | ✅         | ✅ Keep.                                                                                                                                                               |
| Toggle Group    | ✅ single/multiple, attached | ✅      | ✅         | ✅ Keep.                                                                                                                                                               |
| Toolbar         | ✅                           | ✅      | ❌         | ✅ Keep — a genuine advantage over shadcn, and the APG pattern is implemented.                                                                                         |
| Command palette | ❌                           | ❌      | ✅ Command | ❌ Skip as a component. It's Combobox + Dialog. Once Combobox has option groups and async filtering it becomes a documented recipe — which is the honest shape for it. |

## Forms

| Component                           | Timeless                                       | Base UI                        | shadcn/ui             | Verdict                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------- | ------------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field / Label / Description / Error | ✅ 5 contracts                                 | ✅ Field                       | ✅ Field              | ✅ Keep. Splitting into five CSS contracts is more granular than either peer, and correct for a CSS-first library.                                                                                                                                                                                                                                                                                                                 |
| Fieldset + legend                   | ⚠️ only via Choice Group                       | ✅ standalone                  | ⚠️ inside Field       | ⚠️ Gap. A `<fieldset>` styling contract exists but is welded to checkbox/radio groups. Any set of grouped controls needs it. Cheap to extract.                                                                                                                                                                                                                                                                                     |
| Form (submit + errors)              | ❌                                             | ✅                             | ✅                    | ⚠️ Add small. Correction to my first pass: `validate.ts` is **not** form validation — it exports `validateTimelessMarkup`, an authoring linter. And **no** Timeless element is form-associated: `formAssociated`, `setFormValue`, and `setValidity` appear nowhere, so Combobox and Listbox cannot submit at all. Native `<form>` covers most of it; the delta is form association plus mapping _server_ errors onto named fields. |
| Input                               | ✅                                             | ✅                             | ✅                    | ✅ Keep.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Textarea                            | ✅                                             | ❌ (Input covers it)           | ✅                    | ✅ Keep.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Checkbox                            | ✅                                             | ✅                             | ✅                    | ✅ Keep.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Radio                               | ✅                                             | ✅                             | ✅                    | ✅ Keep.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Switch                              | ✅                                             | ✅                             | ✅                    | ✅ Keep. Guidance separating it from Toggle is genuinely good and neither peer bothers.                                                                                                                                                                                                                                                                                                                                            |
| Checkbox Group                      | ✅ `ui-checkbox-group` **and** ✅ Choice Group | ✅                             | ⚠️ recipe             | ⚠️ **Merge.** One behaviour, two entry points, split on whether JS loads. The custom element already degrades to plain markup — that _is_ the CSS-only story. Keep `ui-checkbox-group`, fold Choice Group's styling into it, drop the separate page.                                                                                                                                                                               |
| Radio Group                         | ✅ `ui-radio-group` **and** ✅ Choice Group    | ✅                             | ✅                    | ⚠️ Same merge.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Native Select                       | ✅                                             | ❌                             | ✅                    | ✅ Keep. Cheap and the right default — this is the recommendation the other two can't make.                                                                                                                                                                                                                                                                                                                                        |
| Select (custom)                     | ✅ open, placement, value                      | ✅ with groups, multiple       | ✅                    | ⚠️ **Deepen.** No `multiple`, no option groups, no `label`-on-group part. Also declares APG `combobox` — same pattern as Combobox — so the two contracts overlap while neither is complete.                                                                                                                                                                                                                                        |
| Combobox                            | ✅ `value` + input/listbox/option              | ✅ **Combobox + Autocomplete** | ✅ (Command recipe)   | ⚠️ **We are covered, but it works differently and it's shallow.** Base UI splits the pattern in two: Autocomplete filters freely-typed text, Combobox picks from a fixed list. Timeless has one contract with one attribute. Missing: multi-select with chips, option groups, async/remote filtering, create-new, clear button, empty/no-results state. **This is the single biggest depth gap in the library.**                   |
| Listbox                             | ✅ with `multiple`                             | ❌ (only inside Select)        | ❌                    | ✅ Keep — an advantage. A standalone APG listbox with multi-select is exposed by neither peer.                                                                                                                                                                                                                                                                                                                                     |
| Number Field                        | ✅ Number Stepper                              | ✅                             | ⚠️ Input Group recipe | ✅ Keep.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Slider                              | ⚠️ `ui-range`, single thumb                    | ✅ multi-thumb                 | ✅ multi-thumb        | ⚠️ Gap. `ui-range` is CSS over one `input[type=range]`, which is the right default and covers most uses. Two-thumb ranges can't be CSS-only and need a real custom element. Worth it — price filters and date ranges are everywhere.                                                                                                                                                                                               |
| OTP / PIN Field                     | ❌                                             | ✅ OTP Field                   | ✅ Input OTP          | ⚠️ **Add.** Every auth flow needs it, it is deceptively hard (paste splitting, `autocomplete="one-time-code"`, backspace across cells, mobile keyboards), and hand-rolled versions are almost always broken. High value per line.                                                                                                                                                                                                  |
| File Input                          | ✅                                             | ❌                             | ⚠️ Attachment         | ✅ Keep.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Date Picker / Calendar              | ❌                                             | ❌                             | ✅ (react-day-picker) | ❌ Not now. `<input type="date">` covers the common case, and a real calendar is a locale/i18n/first-day-of-week project — the highest-cost thing a framework-agnostic library can take on. Base UI skipping it is the signal. Revisit only after Combobox depth lands.                                                                                                                                                            |

## Overlays

| Component      | Timeless                                   | Base UI                         | shadcn/ui            | Verdict                                                                                                                                                                                                               |
| -------------- | ------------------------------------------ | ------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dialog         | ✅ `kind="dialog \| alert"`                | ✅ Dialog + ✅ Alert Dialog     | ✅ + ✅              | ✅ Keep. Folding alert dialogs into one contract via `kind` is _better_ than the peers' two components. Missing: `title` / `description` parts, so authors wire `aria-labelledby` by hand — a papercut worth closing. |
| Popover        | ✅ native popover + anchor positioning     | ✅                              | ✅                   | ✅ Keep. This is the flagship: the browser opens, light-dismisses, and Escape-handles it before any JS loads. Neither peer can say that.                                                                              |
| Sheet / Drawer | ✅ Sheet, 4 positions, modal               | ✅ Drawer with swipe-to-dismiss | ✅ Sheet + ✅ Drawer | ⚠️ Covered, missing the gesture. Swipe-to-dismiss is what makes a drawer feel native on touch, and it's the only meaningful delta.                                                                                    |
| Tooltip        | ⚠️ `ui-hover-card variant="tooltip"`       | ✅                              | ✅                   | ⚠️ Works and is APG-correct, but shipping the most-searched overlay as a _variant of another component_ is a discoverability tax. Alias `ui-tooltip`, or accept that people won't find it.                            |
| Hover Card     | ✅                                         | ✅ Preview Card                 | ✅                   | ✅ Keep.                                                                                                                                                                                                              |
| Context Menu   | ❌                                         | ✅                              | ✅                   | ⚠️ **Add.** The only overlay pattern with no native fallback, and the delta is small: `contextmenu` event plus the Menu and Popover machinery that already exists.                                                    |
| Toast          | ✅ Toaster + Toast, 6 placements, 2 stacks | ✅                              | ✅                   | ✅ Keep.                                                                                                                                                                                                              |

## Navigation

| Component       | Timeless                          | Base UI              | shadcn/ui        | Verdict                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------- | --------------------------------- | -------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tabs            | ✅ orientation, automatic/manual  | ✅                   | ✅               | ✅ Keep.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Menu / Menubar  | ✅ one contract, `role="menubar"` | ✅ Menu + ✅ Menubar | ✅ Menubar       | ✅ Covered by a single contract — better factored than two. ⚠️ But three real gaps, found on a second pass: `aria-checked` is **styled but never written by any JS**, so checkbox/radio items are decorative; `ArrowRight`/`ArrowLeft` do **not** open or close a submenu outside a menubar; and item discovery reads only direct children, so a `role="group"` wrapper loses every item. Separators and `aria-checked` _are_ styled and _are_ mentioned in the registry — my first pass understated that. |
| Menu Button     | ✅                                | ✅ (Menu)            | ✅ Dropdown Menu | ✅ Keep.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Navigation Menu | ❌                                | ✅                   | ✅               | ⚠️ Add thin. Most of it is Popover plus `<nav>`; the real content is the shared-panel behaviour and the rule that a menu of _links_ must not become an APG menu (a mistake both peers document).                                                                                                                                                                                                                                                                                                           |
| Breadcrumb      | ❌                                | ❌                   | ✅               | ⚠️ **Add — highest value per byte on this page.** Pure CSS over `<nav><ol>`, zero JS, `aria-current="page"` on the last crumb, and virtually every app has one.                                                                                                                                                                                                                                                                                                                                            |
| Pagination      | ❌                                | ❌                   | ✅               | ⚠️ Add cheap. Same shape: CSS over `<nav>` + links, plus the `aria-current` and "current page isn't a link" rules.                                                                                                                                                                                                                                                                                                                                                                                         |

## Feedback

| Component | Timeless               | Base UI | shadcn/ui | Verdict                                                                                             |
| --------- | ---------------------- | ------- | --------- | --------------------------------------------------------------------------------------------------- |
| Alert     | ✅ variants            | ❌      | ✅        | ✅ Keep.                                                                                            |
| Badge     | ✅ variants            | ❌      | ✅        | ✅ Keep.                                                                                            |
| Progress  | ✅                     | ✅      | ✅        | ✅ Keep.                                                                                            |
| Meter     | ✅ `ui-meter-field`    | ✅      | ❌        | ✅ Keep. Native `<meter>` for bounded measurements, distinct from Progress — shadcn conflates them. |
| Skeleton  | ✅ shapes + widths     | ❌      | ✅        | ✅ Keep.                                                                                            |
| Spinner   | ✅ variants            | ❌      | ✅        | ✅ Keep.                                                                                            |
| Empty     | ✅ art + actions parts | ❌      | ✅        | ✅ Keep.                                                                                            |

## Color — Timeless only

| Component / Utility                                                      | Timeless                              | Base UI | shadcn/ui | Verdict                                                        |
| ------------------------------------------------------------------------ | ------------------------------------- | ------- | --------- | -------------------------------------------------------------- |
| Color Picker                                                             | ✅ 10 formats, 21 parts               | ❌      | ❌        | ✅ **Keep and lead with it.** No peer has anything comparable. |
| Color Swatch                                                             | ✅                                    | ❌      | ❌        | ✅ Keep.                                                       |
| Color Palette                                                            | ✅                                    | ❌      | ❌        | ✅ Keep.                                                       |
| Colour conversion (OKLCH, OKLab, LCH, Lab, HWB, HSL, sRGB, P3, Rec.2020) | ✅                                    | ❌      | ❌        | ✅ Keep.                                                       |
| Gamut check + clamp                                                      | ✅ `inGamut`, `clampToGamut`          | ❌      | ❌        | ✅ Keep. Nothing else in this space ships it.                  |
| WCAG contrast evaluation                                                 | ✅ `wcagContrastRatio`, AA/AAA levels | ❌      | ❌        | ✅ Keep.                                                       |

---

## What to actually do

### Merge — removes 3 doc pages and the "padded" feeling, changes no capability

1. **Disclosure → Collapsible** as `data-ui-variant="plain | panel"`. Two contracts for one
   `<details>` with different padding.
2. **Choice Group → Checkbox Group / Radio Group.** Stop splitting one behaviour on "with or without
   JS" — the custom elements already degrade, and that _is_ the CSS-only story. Keep Choice Group's
   stylesheet, drop it as a separately documented component.
3. **Alias `ui-tooltip`** so the most-searched overlay is addressable by its own name.

### Deepen — where the real work is, in priority order

1. **Combobox.** Multi-select with chips, option groups, async/remote filtering, empty state, clear.
   Decide whether to follow Base UI and split Autocomplete from Combobox.
2. **Menu parts.** Checkbox item, radio item, group + group label, separator, declared submenu part.
3. **Select.** `multiple` and option groups.
4. **Dialog.** `title` and `description` parts so `aria-labelledby` isn't hand-wired.
5. **`<details name>`** to make Collapsible a real exclusive accordion, natively.

### Add — small, common, and platform-shaped

1. **Breadcrumb** — CSS only, zero JS. Best value on the list.
2. **Pagination** — CSS only.
3. **OTP field** — genuinely hard, universally needed.
4. **Context Menu** — small delta over Menu + Popover, no native fallback exists.
5. **Standalone Fieldset** — extract from Choice Group.
6. **Multi-thumb range** — needs a real custom element.
7. **Sheet swipe-to-dismiss.**
8. **Navigation Menu** — thin, mostly Popover + `<nav>`.
9. **Form-level server-error mapping** — the only part native validation doesn't cover.

### Never — say no in the docs, out loud

Aspect Ratio (one CSS line), Scroll Area (fights the platform; `scrollbar-*` is Baseline), Carousel
and Chart (wrap third-party engines), Data Table (TanStack's job), Sidebar and app shells
(composition), chat/AI surfaces (product, not primitive), Tree View (hardest pattern, least reuse).
Date Picker is a _not yet_, not a never — and only after Combobox.

Writing this list down is itself a feature. "Too much stuff" is a scope problem, and the fix is a
published boundary, not fewer components.

---

## Corrections from a second, deeper read

A second pass read the actual source rather than the contracts, and three things above needed
correcting:

1. **Menu is better documented than I said, and more broken than I said.** Separators and
   `aria-checked` _are_ styled in `menu.css` and _are_ mentioned in the registry. But no JavaScript
   ever writes `aria-checked`, and `ArrowRight` / `ArrowLeft` do not open or close a submenu outside
   a menubar — so checkbox items and submenus are keyboard-inoperable, which is worse than a missing
   part declaration.
2. **`validate.ts` is not form validation.** It is `validateTimelessMarkup`, an authoring linter. No
   element in the library is form-associated, so Combobox and Listbox cannot submit a value at all.
3. **Several "already solved" things are not.** `combobox.css` does track its trigger width with
   `anchor-size(width)` — but the declaration sits outside its `@supports` guard, so it silently
   degrades to `auto`. And `filterListboxOptions` is _already_ locale-aware through a cached
   `Intl.Collator` in `collection.ts`, so the filtering work is smaller than it looked.

Other defects found along the way: `.ui-disclosure[data-ui-density='compact']` does nothing (its
custom properties are shadowed on `> summary`); `data-ui-variant="ordered"` on `.ui-list` is inert
in the case the docs endorse; `syncListboxActiveDescendant` writes `aria-selected` from the _active_
index, which destroys the real selection and announces every option you arrow past as selected; and
there is no `CSS.supports` call anywhere, so the anchor-positioning fallback is unreachable.

---

## Derived milestones

Five milestones were written from this research on 2026-08-19, under
[`.agents/memory/milestones/`](../memory/milestones/), each with `PLAN.md`, `TASKS.md`, and
`RESULTS.md`. All five opened at `status: Proposed`; none is implemented.

| Milestone                                                                                       | Covers                                                                                                                                                                                                                                                                                    | Tasks |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----: |
| [`021-surface-consolidation`](../memory/milestones/021-surface-consolidation/PLAN.md)           | Merge Disclosure into Collapsible, native `<details name>` accordions, drop the `ordered` list variant, retire the Choice Group page, give Tooltip its own contract and a materially smaller box, dedupe seven feature-detect copies, publish the "will not ship" boundary                |    81 |
| [`022-collection-surfaces`](../memory/milestones/022-collection-surfaces/PLAN.md)               | The Select / Combobox / Listbox rebuild: one shared core, option groups, multiple selection with chips, a search field inside the Select surface, clear, empty and status regions, paged navigation, form association, plus the `position-area`, `anchor-size`, and `aria-selected` fixes |   149 |
| [`023-form-completeness`](../memory/milestones/023-form-completeness/PLAN.md)                   | Native select padding, a standalone Fieldset contract, `ui-form` for server errors, multi-thumb range, OTP/PIN field                                                                                                                                                                      |    96 |
| [`024-menus-context-and-gestures`](../memory/milestones/024-menus-context-and-gestures/PLAN.md) | Menu part depth and submenu keys, managed `aria-checked`, Context Menu, Dialog and Sheet accessible names, Sheet swipe-to-dismiss                                                                                                                                                         |   106 |
| [`025-navigation-set`](../memory/milestones/025-navigation-set/PLAN.md)                         | Breadcrumb and Pagination as CSS-only components, Navigation Menu only if composition proves insufficient                                                                                                                                                                                 |    78 |

### Why this order

The sequence is dependency-driven, not priority-driven:

- **021 first** because it shrinks the surface everything else has to carry, and because its
  `capabilities.ts` module is where 022 adds `supportsAnchorPositioning`. It also runs the
  qualified-root registry experiment (a contract whose root is `ui-hover-card[variant='tooltip']`)
  that 022's element-count decision depends on.
- **022 before 024** because it decides the `group` / `group-label` / `separator` part vocabulary
  and the ownership-scoped item-discovery helper that Menu then reuses. Deciding those names twice
  would guarantee they diverge.
- **022 before 023** because 022 writes form association for the first time, and 023 generalises it
  rather than reimplementing it.
- **025 last** because it is the cheapest and depends on nothing, so it is the natural buffer.

### What did not become a milestone

Three findings were recorded rather than scheduled, because each needs its own decision:

- **50 of 53 contracts declare zero CSS custom properties** while the stylesheets define many. 021
  and 022 declare the ones they touch; the remaining ~46 need a dedicated pass.
- **`nativeSelect` and `select` both claim the root name `ui-select`** — one a class, one an
  element. Renaming either is a breaking public change with a long ordered sequence, noted in 023's
  open decisions.
- **`packages/examples/scripts/validate.mjs`** is the strictest gate in the repository — 17 throw
  conditions — and is absent from [`reference/validators.md`](../reference/validators.md).
  Documenting it is a task inside 022, since all five milestones depend on its ordering.
