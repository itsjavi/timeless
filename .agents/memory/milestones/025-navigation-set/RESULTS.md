# Milestone 025 Results

## Baseline

Measured on `main` at commit `97761b1`.

| Measure                                         | Value                                                                                                      |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `breadcrumb` occurrences                        | one, an unrelated string at `apps/web/src/scripts/not-found.ts:40`                                         |
| `pagination` occurrences                        | **zero**                                                                                                   |
| `navigation menu` / `nav-menu` occurrences      | **zero**                                                                                                   |
| `aria-current` occurrences                      | **one**, `menu.css:75`, written by no JavaScript                                                           |
| `aria-current` in `IGNORED_SELECTOR_ATTRIBUTES` | **absent** (`validate-contracts.mjs:23-37`)                                                                |
| Spacing ladder                                  | `--ui-space-1..5` = 0.25, 0.375, 0.5, 0.75, 1rem                                                           |
| Existing `sm \| md \| lg` value sets            | three — `buttonSizes`, `primitiveSizes`, `formControlSizes`                                                |
| `domain: 'navigation'` catalog entries          | eight — `checkbox-group`, `combobox`, `listbox`, `menu`, `menu-button`, `radio-group`, `select`, `toolbar` |
| `tabs` catalog placement                        | `domain: 'overlays'`, `group: 'Navigation'` — precedent for the two differing                              |

Comparison context: shadcn/ui ships all three of these; Base UI ships only Navigation Menu, because
Breadcrumb and Pagination need no behavior and a behavior-only library has nothing to add. That
asymmetry is the argument for this milestone being cheap for a CSS-first library.

## Platform behavior confirmed during implementation

Both open questions resolved in the library's favour, and one of them changed the design.

**Generated content is not announced when it carries empty alternative text.** The plan hoped a
`::before` separator would be inaudible by construction and flagged that generated content _is_
exposed in the accessibility tree in some engines. It is — plain `content: '›'` is exposed as static
text. The fix is `content: var(--ui-breadcrumb-separator) / ''`, the `content` property's
alternative text, Baseline since Firefox 133. Verified two ways:
`getComputedStyle(li, '::before').content` returns the glyph, and `locator.ariaSnapshot()` on the
whole trail contains no `›`. So there is no separator part, no authored `<span aria-hidden="true">`
between every pair of crumbs, and nothing for a consumer to remember. The `/ ''` half is called out
in the `--ui-breadcrumb-separator` description, because redeclaring `content` without it starts
announcing the glyph again.

**`text-overflow: ellipsis` needs `min-inline-size: 0` on the crumb — and on the root.** The plan
expected the first. The second was the actual bug: `.ui-breadcrumb` is a block, but a block that is
itself a flex or grid item defaults to `min-width: auto`, so the trail widened its own column
instead of eliding inside it and none of the truncation fired. Measured in Chromium at a 352px
container: the `<nav>` reported 573px wide until `min-inline-size: 0` went on the root, then 334px
with the middle crumbs shrunk to 41, 32, and 59px while the ends stayed at 72 and 98.

## Decisions and constraints

**Breadcrumb has an APG pattern, and the plan said it did not.** The plan asserted "there is no APG
'breadcrumb pattern' as such — it is under Landmarks and the `aria-current` guidance". There is one,
at `/WAI/ARIA/apg/patterns/breadcrumb/`, and it says exactly what the plan reasoned out from first
principles: a navigation landmark, labelled with `aria-label` or `aria-labelledby`, the current
page's link carrying `aria-current="page"`, `aria-current` optional when that element is not a link,
and "Keyboard Interaction: Not applicable." So the contract names the real slug and the docs link to
it. Pagination has no APG pattern — checked, 404 — so it keeps `pattern: null` and its note says the
composition is platform behavior rather than invented ARIA.

**`aria-current` is declared and selected, but `contracts:validate` never proves it.** The plan's
constraint — a selector on `[aria-current='page']` without a matching `state()` "will not pass" — is
wrong about the mechanism. `selectedValues` in `validate-contracts.mjs` does collect `aria-current`
out of the CSS, but the two-directional check only iterates a component's declared **attributes**,
and a state is not an attribute. So the pairing holds because both halves were written, not because
anything checks them. Worth knowing before someone relies on the guarantee.

**Pagination reuses `.ui-group[data-ui-attached]` for half of the joined strip, not all of it.** The
plan's phrasing was "reuse it rather than re-declaring adjacency and border-radius joining". Group
supplies the collapsed gap and the stretched rows, which is the adjacency; the border-radius joining
stays Pagination's, because Group joins `:where(.ui-button, .ui-progress, input, select, textarea)`
by name and Pagination's cells are a `data-ui-part` one level down inside an `<li>`. Reusing the
radii too would have meant either dropping the `<ul>`/`<li>` semantics so the cells became direct
children, or widening Group's selector list to know about a component it cannot see. Both are worse
than five declarations. The default gap is `:not(:where(.ui-group))`-guarded so that Pagination
never fights Group for it — same specificity, and `themes/atmosphere.css` imports Group first, so an
unguarded `gap` would have silently defeated the attached mode.

A joined strip also has to be continuous, so inside `[data-ui-attached]` every cell takes the border
and background, not only the links. Otherwise the ellipsis and a boundary `<span>` punch holes in it
and the strip reads as broken rather than as joined.

**Pagination's size set is `primitiveSizes`.** The plan offered `formControlSizes` or `buttonSizes`.
It is neither a form control nor a button, and `primitiveSizes` is the set every other CSS-only
primitive uses. No fourth `sm | md | lg` was declared.

**Both boundary decisions went the honest way.** At the first or last page, Previous and Next are
`<span>` elements rather than `<a aria-disabled="true">`, because a disabled link announces "dimmed"
and then navigates anyway. The current page is a `<span aria-current="page">` for the same reason.
The cost is real and was accepted: the element type changes with state, which is slightly awkward
for a consumer templating it. `--ui-fg-muted` rather than `--ui-fg-subtle` carries the boundary
text, because it is real text and not a disabled control, so WCAG 1.4.3 applies to it in full —
`--ui-fg-subtle` computes to 3.5:1 against the page in light mode.

**Breadcrumb truncation is CSS-only, with the limitation the plan predicted.** Middle crumbs elide;
the chain cannot collapse into a "…" overflow menu, which some designs want. That would need a
measurement loop in a component that otherwise runs no JavaScript at all. Recorded rather than
hidden.

**Navigation Menu: composition suffices. No element was added.** The prototype was built from
`ui-hover-card` rather than the `ui-popover` the plan named, because Popover resolves any unknown
surface `role` to `dialog` and then writes `aria-haspopup="dialog"` onto the trigger — a nav panel
is not a dialog — and it has no hover intent. Hover Card gives `role="group"`, no `aria-haspopup`,
`aria-expanded` and `aria-controls` per trigger, opening on pointer intent and on focus, and Escape
through its dismissable layer.

The plan set the bar for a new element at the **shared panel** — one surface whose content swaps as
the pointer moves along the bar. Two things decided against it. First, the behavior that shared
panel buys is a handoff without a flicker, and that turned out to be two numbers rather than a
component: `close-delay` shorter than `open-delay` closes the panel you are leaving before the next
one opens, so the two are never in the top layer together. Second, and more decisive, a genuinely
shared panel would mean moving authored DOM into a surface the element owns — and
`check-generated-dom.mjs` exists to forbid exactly that. Only Toast may create elements; everything
else enhances authored markup in place. The one behavior that would have justified `ui-nav-menu` is
the one the library's own rules refuse.

The recipe ships as a `recipes`-domain catalog example attached to the Menu page through `related`,
a StoryLite route, a row on `/docs/reference/scope/` under "It is composition, not a component", and
E2E coverage standing in for the element's own tests. Menu's `guidance` now states the rule the
whole exercise is about: `role="menu"` is a set of commands with roving focus, where the whole set
is one Tab stop; a nav of links is individually tabbable and `Tab` is the traversal.

**The prototype found a real defect in Hover Card, and fixing it was the condition of the
decision.** Only the trigger's `focusout` was wired, so tabbing from the trigger into the surface
scheduled a close with nothing to cancel it: the surface shut and focus fell to the document. Hover
Card's content was pointer-reachable and keyboard-unreachable, which is WCAG 2.1.1 rather than a
rough edge, and it contradicted the contract's own claim that "the content inside is reachable".
`hover-card.ts` now mirrors the pointer handling with `focusin`/`focusout` on the content — focus
entering cancels the close, focus leaving schedules one — which also makes focus moving _within_ the
surface cancel itself. Measured before and after in Chromium through Playwright: before, one Tab
left `:popover-open` false and `document.activeElement` on `<body>`; after, two Tabs walk
"Components" then "Themes" with the panel still open, and tabbing out closes it. Had this not been
fixable in four lines, the honest answer would have been to add the element.

This is also why the recipe's own E2E dwells 400ms before asserting focus. The first version of that
test asserted immediately, passed, and was documenting broken behavior — the close delay is 100ms,
so a fast assertion never sees the panel shut.

**Emphasis in registry prose printed as asterisks.** Pagination's note wanted
`**a disabled link is not a thing.**` and Menu's guidance wanted `**commands**` against `**links**`.
`inlineCode` in `apps/web/src/lib/component-docs.ts` converted code spans and nothing else, so the
HTML pages printed the asterisks while the `.md` routes rendered them correctly. Fixed there rather
than by writing worse prose: `**strong**` and `*em*` are now converted, applied only to the text
between tags so an asterisk inside a code span survives. It also clears one pre-existing instance —
Context Menu's note has printed
`**This is the one Timeless component with no no-JavaScript fallback**` literally since it was
written. Checked against all 503 registry descriptions and 37 catalog notes: exactly the three
intended strings change, and nothing gains accidental emphasis.

## Summary

Two CSS-only components, one recipe, and one accessibility fix to an existing element.

- **Breadcrumb** — `.ui-breadcrumb` over `<nav>` + `<ol>` + `<li>`, `data-ui-separator`
  (`chevron | slash`) and `data-ui-density`, the `item`/`link`/`current` parts, the `current` state,
  and `--ui-breadcrumb-gap` and `--ui-breadcrumb-separator`. The separator is generated content with
  empty alternative text. Truncation elides the middle crumbs and keeps both ends whole.
- **Pagination** — `.ui-pagination` over `<nav>` + `<ul>`, `data-ui-size` from `primitiveSizes`, the
  `item`/`link`/`previous`/`next`/`ellipsis` parts (never `pager`), the `current` state, and
  `--ui-pagination-gap` and `--ui-pagination-cell-size`. Composing
  `<ul class="ui-group" data-ui-attached>` joins the strip.
- **Navigation Menu** — no element. A documented Hover Card composition, in the catalog, in
  StoryLite, on the scope page, and under E2E.
- **Hover Card** — keeps its surface open while focus is inside it.

Neither component adds JavaScript, a `define/` entrypoint, a `package.json` subpath, a
`preview-runtime.ts` loader, or a `performance-baselines.json` entry. `breadcrumbSeparators` is the
only new public export, from the `primitives` module.

Nine new StoryLite routes: four Breadcrumb, four Pagination, one recipe. Fifteen new assertions
across four spec files.

## Validation results

`pnpm qa` green — 454 Playwright tests, plus typecheck, format, build, unit tests, `test:dist`,
`contracts:check`, `publint`, and `attw`.

The gates `pnpm qa` omits, all run locally:

| Gate                                                 | Result                                                                     |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| `pnpm boundaries:check`                              | pass                                                                       |
| `pnpm -F @timelessui/components exports:validate`    | pass — no new entrypoint to claim                                          |
| `pnpm -F @timelessui/components generated-dom:check` | pass                                                                       |
| `pnpm -F @timelessui/components performance:check`   | pass — no new element module, so no new baseline                           |
| `pnpm -F @timelessui/examples test`                  | 55 canonical examples                                                      |
| `pnpm -F @apps/web test`                             | 6 platform claims, 8 house rules, 55 examples, 23 elements, 87 CSS exports |
| `pnpm build:site`                                    | pass — the only check on the internal links the Breadcrumb example emits   |

Component-scoped proofs: `core:validate` reports 291 declarations across 43 core stylesheets with 41
theme counterparts and one `core-exempt`; `contracts:validate` reports 61 contracts, 23 elements,
206 documented attribute values, 58 public tokens, 87 fully layered stylesheets, 88 resolvable
imports; `manifest:validate` covers 23 elements; `generate:check` clean.

`audit-component-contracts` over the diff: clean on visual-styling-from-JS, `data-ui-*` on hosts,
boolean-with-value, private hooks in copyable source, ARIA-over-native, Shadow DOM, and public
diagnostics. One finding, fixed — the Breadcrumb story retyped `['normal', 'compact']` in a demo
grid instead of importing `compactDensities`; the copyable `source` for that story now derives its
combinations from the two exported arrays as well.

`verify-apg-conformance`: Breadcrumb matches the APG Breadcrumb pattern in full. Pagination has no
pattern and its composition is native throughout — links, a list, a labelled landmark,
`aria-current` completing a contract the platform has no attribute for, and `aria-hidden` on the one
decorative cell. The recipe carries no `role="menu"` and no `menuitem`, its panels are
`role="group"`, and `Tab` traverses its links; SC 1.4.13's three conditions all hold — dismissible
by Escape, hoverable across the gap, persistent until hover or focus leaves.

---

Generated by Claude Opus 5 - High reasoning

Implemented by Claude Opus 5 - High reasoning
