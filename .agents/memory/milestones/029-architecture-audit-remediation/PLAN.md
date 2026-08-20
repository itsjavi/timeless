---
status: Implemented
---

# Milestone 029 Plan: Architecture Audit Remediation

## Goal

The six findings from the `9046d41` architecture audit that are not the core-and-theme CSS split.
Rename the token API off the theme it does not belong to, document the utility-CSS path that
[milestone 028](../028-core-and-theme-css-separation/PLAN.md) makes possible, stop shipping the
contract registry to the browser, account for the collection bundles, consolidate the last
duplicated state machine, and move the generic colour library out of the components package while
keeping the colour primitives in it.

## Context

The audit began as three consumer questions — how optional is the CSS, can styles be replaced
without specificity fights, can a consumer adopt Tailwind — and the answers were mostly yes. The
architecture holds where it is hardest to hold: 43 stylesheets with zero `!important`, no
`attachShadow` in any package, no JavaScript that waits on `transitionend` or `getAnimations`, and
`:where()` specificity discipline applied consistently rather than aspirationally. Component JS
writes custom properties and behavior attributes and never a visual declaration.

So these are not rescues. They are places where a name outran its meaning, a consolidation stopped
halfway, or a pre-1.0 surface is wider than it needs to be. Milestone 028 carries the one finding
large enough to need its own milestone; this one carries the rest.

### One audit finding was investigated and dismissed

The audit initially reported four export subpaths as redundant aliases: `./radio-group` and
`./checkbox-group` both resolving to `dist/choice-group.js`, and `./toaster` and `./toast` both
resolving to `dist/toast.js`. That was wrong, and it is recorded here so it is not re-raised.

`choice-group.ts` defines two distinct elements, `ui-radio-group` and `ui-checkbox-group`.
`toast.ts` defines `ui-toaster` and `ui-toast`. So these are per-element entry points into modules
that implement two elements each, not two names for one thing. And the per-component subpath does a
different job from the `define` entry point: `./toast` exports the `toast()` imperative API,
`dismissToast()`, the element classes, and the type guards, while `./define/ui-toast` is six lines
of registration. `check-exports.mjs:12` _requires_ a class entry point per registered element and
carves out exactly those three tags. The convention is deliberate, machine-enforced, and its
exceptions are explicit. There is nothing to fix.

### Measured baseline

Clean working tree at `9046d41`, Node 24.19.0, pnpm 11.22.0.

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
| Tailwind mentions aimed at consumers                      | 0                                                     |
| Entries covered by `performance:check`                    | 4 — `popover`, `listbox`, `select`, `combobox`        |

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

Bundle baselines from `scripts/performance-baselines.json`:

| Entry    | JS gzip |  JS raw |
| -------- | ------: | ------: |
| select   |  30,023 | 113,729 |
| combobox |  28,522 | 106,755 |
| listbox  |  15,380 |  55,052 |
| popover  |   5,644 |  18,340 |

---

## 1. The token API is named after one theme

Six public exports carry the theme's name: `atmosphereTokenGroups`, `atmosphereTokens`,
`isAtmosphereToken`, `AtmosphereToken`, `AtmosphereTokenGroup`, and `AtmosphereTokenName`.

Every name they contain is `--ui-*`. Atmosphere is one set of _values_ for that vocabulary —
`DESIGN.md:3` calls it the theme and `DESIGN.md:16` calls it the design language. The vocabulary is
the contract any theme implements. A second Timeless theme would implement `atmosphereTokenGroups`,
which is incoherent, and a consumer auditing their own theme against the contract is told they are
auditing against Atmosphere.

**Approach.** Rename to `uiTokenGroups`, `uiTokens`, `isUIToken`, `UIToken`, `UITokenGroup`, and
`UITokenName` — consistent with the existing `uiAttributes()` and `uiAttributeString()`, the same
kind of neutral API in the same package, and an echo of the `--ui-*` prefix the tokens themselves
carry. Atmosphere keeps its name in `DESIGN.md` and on the values, which milestone 028 moves into
`theme-atmosphere.css`.

Two constraints. `AGENTS.md` states a public export must never change name or module; the rename is
permissible only because the package is unpublished at `0.0.1`, and that reasoning belongs in the
record rather than left implicit. And per `.agents/reference/generated-files.md`,
`generate-elements.mjs` reads `src/tokens.ts` **as text** to build the CSS editor data and requires
the `atmosphereTokenGroups = { ... } as const` shape to stay parseable, so the generator's parser
changes with the rename. The 58 occurrences in `vscode.css-custom-data.json` follow regeneration and
are never hand-edited.

## 2. Utility CSS and Tailwind are undocumented

The only two Tailwind mentions in the repository tell _agents_ not to guess from Tailwind
conventions. Nothing tells a consumer how to adopt it, and the interaction fails silently: CSS layer
order is fixed by first declaration, so if `@import "tailwindcss"` is ordered before the Timeless
CSS, Tailwind's `theme, base, components, utilities` register first, `ui.*` registers after them,
and **Timeless beats every Tailwind utility**. Reversed, utilities win. No error either way.

Three smaller traps belong on the same page. Unknown elements default to `display: inline` and
Tailwind Preflight does not reset them, so a `ui-*` host needs an explicit display — which is
exactly what milestone 028's core layer provides, and the page should say so rather than telling
consumers to hand-write it. Option filtering expresses itself through the native `hidden` attribute,
so a `display` utility on an option row outranks the UA `[hidden]` rule and filtered options
reappear. And `:state()` has no Tailwind variant, so the 8 `:state()` selectors need an arbitrary
variant such as `[&:state(--closed)]:opacity-0`.

**Approach.** A `docs/styling/utility-css.mdx` page whose centrepiece is a complete, copyable,
verified example: a Popover with a button trigger, importing the core layer and no theme CSS, styled
entirely in Tailwind utilities. It shows the full import block in the winning order, the host
display, the trigger, the anchored surface, and a `:state()` or `aria-*` variant doing real work. It
is pasted into a running app and confirmed to render, anchor, open, and light-dismiss before
publication — a page that exists because a failure mode is silent cannot ship an unrun snippet.

Depends on milestone 028, since the import list names the core stylesheets.

## 3. `uiAttributes()` pulls the contract registry into the browser

`attributes.ts` imports `componentContracts` from a 3,967-line generated file so a function that
emits `data-ui-*` strings can read defaults at runtime. Build-time information doing runtime work.

The behavior modules are clean — importing `@timelessui/components/select` never reaches
`contracts.ts`. Only `attributes.ts`, `validate.ts`, and the barrel do. But that makes the typed
convenience helper the most expensive import in the package, and it is the import the typed
authoring surface encourages.

**Approach.** Generate `attributes.ts` with per-component defaults inlined so `uiAttributes()` needs
no contract record at runtime. Keep `componentContracts` for `validate.ts` and genuine
introspection. Measure the gzip delta for an entry that imports `uiAttributes`.

## 4. The collection bundles are unaccounted for, and the size gate covers four entries

Select pulls nine modules: 113,729 raw, 30,023 gzipped. Combobox is 28,522. Composition explains it
— Select legitimately contains Listbox, Popover, and the anchoring layer — but 30KB for a single
control is heavy for a library whose pitch is the absence of a framework runtime, and it is the
first number a skeptical evaluator finds.

Separately, `performance:check` covers four of roughly forty components while
`.agents/reference/validators.md` presents it as a general size gate.

**Approach.** Per-module gzip attribution for the Select and Combobox graphs first, so the decision
to reduce or to disclose rests on measurement rather than instinct. Then extend the gate to one
entry per component family, or narrow what `validators.md` claims. Re-baseline after milestone 028,
since the CSS figures move when core is extracted.

## 5. `isTypeaheadEvent` is implemented three times

Defined at `listbox.ts:963`, `menu.ts:446`, and `select.ts:1038`. Beyond the predicate, `listbox.ts`
and `select.ts` each carry their own `#typeahead` buffer, `#typeaheadTimer`, and module-level timer
fallback (`typeaheadTimerFallback` against `selectTypeaheadTimerFallback`). Only
`findOptionByPrefix` is shared, from `options.ts`.

This is the situation `options.css` was consolidated to fix — its header records that three copies
"had drifted apart", with two of three highlighting the active option and two of three hiding a
filtered one. The CSS was consolidated and the JS was not, so the remaining copy-paste is the
typeahead state machine, and a debounce window is exactly the value that drifts unnoticed.

**Approach.** One state machine in `collection.ts` or `options.ts` with per-component policy hooks.
Select deliberately differs from Listbox when closed and Menu is not a collection surface, so the
goal is one buffer and one timer with policy at the edges, not one shared key handler.

## 6. The generic colour library leaves; the colour primitives stay

`docs/reference/scope.mdx` excludes Chart, Data Table, and Tree View with the test: does it need
domain machinery — a locale database, a layout engine, a virtualiser — in which case it is a library
in its own right. OKLCH and OKLab parsing, contrast computation, and channel gradient construction
meet that test. A colour picker and a colour swatch do not: they are UI primitives that happen to
depend on a colour library, the same way any component depends on a platform capability.

So the resolution is a split rather than a verdict on Colour Picker. The generic functions move out;
the components stay; and the scope page stops implying that shipping a picker is the inconsistency.

**Approach.** A new `@timelessui/color` package takes `color.ts`, `contrast.ts`, and
`color.test.ts`, with the current two-line `color-api.ts` becoming its index. `color-picker.ts`, its
test, and both stylesheets stay in `components`, which gains a dependency on the new package. The
boundary is already clean: `color-api.ts` is a pure barrel of the two moving files, `contrast.ts`
imports only from `color.ts`, and `color-picker.ts` imports from `./color` at exactly one site.

Amend scope.mdx to say that a colour primitive is in scope while a colour model is a library, which
is what the split makes true.

---

## Sequencing

1. **Finding 1** — the token rename. Independent, and pairs naturally with 028's
   `theme-atmosphere.css`.
2. **Finding 6** — the colour package. The largest item here; a new published package.
3. **Finding 3** — generated `attributes.ts`.
4. **Finding 5** — typeahead consolidation. Internal only.
5. **Finding 4** — bundle attribution, after 028 so the CSS figures are stable.
6. **Finding 2** — the utility-CSS page, last, because it documents the end state of both
   milestones.

## Scope

In scope: the six token export renames and the generator's text parser, a new `@timelessui/color`
package and the components dependency on it, generation of `attributes.ts`, the size gate's
coverage, typeahead consolidation, one amendment to scope.mdx, and one new documentation page.

Out of scope: new components, visual redesign, the core-and-theme CSS split, and any change to a
declared attribute, permitted value, part, or event.

## Acceptance criteria

- No public export carries the `Atmosphere` name, and `Atmosphere` still names the theme in
  `DESIGN.md` and on the token values.
- `@timelessui/color` exists, holds the generic colour functions, depends on neither `components`
  nor `core`, and `components` depends on it.
- Colour Picker and Colour Swatch remain components, and scope.mdx no longer implies otherwise.
- `uiAttributes()` does not import `componentContracts`, and the gzip delta is recorded.
- `isTypeaheadEvent` has one definition, and the typeahead debounce window is declared once.
- `performance:check` coverage is extended, or `validators.md` accurately describes what it covers.
- `docs/styling/utility-css.mdx` carries a Popover-plus-button Tailwind example that has been run.
- `pnpm qa` passes.

---

Generated by Claude Opus 5 (High)
