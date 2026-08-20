---
status: Implemented
---

# Milestone 028 Plan: Core and Theme CSS Separation

## Goal

Make the Atmosphere theme genuinely optional by extracting the CSS that is not cosmetic. Ship a core
layer carrying only the declarations a component needs to behave correctly, keep the 43 existing
stylesheets as the theme layer, and split `tokens.css` so the layer statement every override depends
on stops travelling inside a file of theme values.

The test for done: a consumer imports the core layer, no theme CSS at all, and every component is
positioned, structured, and operable — plain-looking and correct.

## Context

`DESIGN.md:252` already requires every component to be "understandable without the theme CSS", and
`DESIGN.md:245` already forbids core from enforcing Atmosphere styling. The principle is not new.
What is missing is any artefact that expresses it.

Today `docs/styling/css.mdx:49` says "CSS is optional" and `docs/styling/theming.mdx:157` says
"Components stay usable with no Timeless stylesheet at all". A consumer who takes either at face
value and drops the stylesheets does not get plain components — they get mispositioned ones.
`floating.css` _is_ the anchor-positioning implementation, so Select, Combobox, Menu, Menu Button,
Hover Card, and Popover all open unanchored. And 109 `display` declarations, 22 `overflow`
declarations, and 17 `appearance` resets are load-bearing in the same way, scattered across 41
files.

So the claim is not wrong by a detail. The library has never separated contract from cosmetics in
what it ships, and the documentation describes a separation that does not exist.

### Measured baseline

Clean working tree at `9046d41`, Node 24.19.0, pnpm 11.22.0. Every declaration in the 43
stylesheets, classified by property after stripping comments:

| Category                                                     | Declarations | Share |
| ------------------------------------------------------------ | -----------: | ----: |
| Behavior-critical (anchoring, display, overflow, appearance) |          271 | 13.5% |
| Structural but design-chosen (sizing, grid and flex layout)  |          371 | 18.5% |
| Cosmetic (colour, border, shadow, type, transition)          |          837 | 41.7% |
| Spacing (padding, margin, gap, border width)                 |          250 | 12.5% |
| Custom property definitions                                  |          303 | 15.1% |
| **Total**                                                    |    **2,006** |       |

The behavior-critical set: `display` 109, `overflow` 22, `appearance` 17, `position-area` 17,
`position` 16, `translate` 14, the `inset` family 42 across six logical properties, `pointer-events`
6, `overscroll-behavior` 5, `forced-color-adjust` 4, `position-try-fallbacks` 3, `z-index` 3,
`color-scheme` 2, and one each of `anchor-name`, `position-anchor`, `resize`, `touch-action`, and
`border-collapse`. It spreads across 41 of the 43 files; only `components.css` and `link.css`
contain none.

Supporting facts:

| Fact                                                 | Value                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| Stylesheets, and how many `components.css` imports   | 43, importing 42                                           |
| Stylesheets with rules outside a `@layer` block      | 0                                                          |
| `!important` declarations                            | 0                                                          |
| Contracts naming `floating.css` in their `css` array | 7                                                          |
| Contracts naming `tokens.css` in their `css` array   | 0                                                          |
| `tokens.css`                                         | 93 lines, 26 `light-dark()` values                         |
| Recorded CSS gzip, the four measured entries         | popover 2,640, listbox 3,871, select 4,710, combobox 4,790 |

### The two constraints that shape the design

**The split runs inside rule blocks, not between them.** From `listbox.css`:

```css
ui-listbox {
  box-sizing: border-box;
  min-inline-size: min(100%, var(--ui-collection-surface-inline-size, 14rem));
  max-block-size: min(18rem, calc(100dvh - 2rem));
  margin: 0;
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius-lg);
  background: var(--ui-bg-surface);
  color: var(--ui-fg);
}
```

Three behavior-adjacent declarations and four cosmetic ones in one block. So this is not a file
move. Each affected rule becomes two rules sharing a selector across two files, and the two must
stay in sync as selectors change. That duplication cost is why this milestone targets the
271-declaration tier and not the 642-declaration one that also includes sizing: at 271 the
duplication is bounded and mostly `display`; at 642 it is a rewrite of the entire visual layer with
a permanent synchronisation obligation.

**A cascade layer cannot substitute.** Layers reorder CSS; they cannot exclude it. There is no way
to load a stylesheet and opt out of one of its layers, so an optional theme has to be a separate
file. This is worth stating because `@layer ui.core` looks like the cheap version of this milestone
and is not a version of it at all.

## Design

### Core stylesheets: per-component files plus an aggregate

`src/css/core/<component>.css` per component, plus `src/css/core.css` that imports them — mirroring
exactly how `components.css` imports the 42 today. This keeps the per-route granularity `css.mdx`
promises, keeps one convenient import for prototypes, and introduces no new convention to explain.

### What belongs in core

Only declarations whose absence changes behavior, not appearance:

- Anchoring: `anchor-name`, `position-anchor`, `position-area`, `position-try-fallbacks`,
  `position-visibility`, and the `@supports (anchor-name: --ui-anchor)` block
- Box participation: `display`, `box-sizing` where a component's layout contract depends on it
- Positioning: `position`, the `inset` family, `z-index`, and `translate` where it places rather
  than animates
- Scrolling: `overflow`, `overscroll-behavior`, `scrollbar-gutter` where it prevents layout shift
- Native control behavior: `appearance`, `field-sizing`, `resize`, `border-collapse`
- Input behavior: `pointer-events`, `touch-action`
- Platform integration: `color-scheme`, `forced-color-adjust`

Explicitly excluded: `color`, `background`, `border-color`, `box-shadow`, `font` and every type
property, `letter-spacing`, `transition`, `animation`, `opacity`, `filter`, and `border-radius`. If
a core rule appears to need one of these, the rule is misclassified.

Core should read as few tokens as possible. Where it must read one, it carries a literal fallback so
it works with no token file loaded.

### `tokens.css` splits

`tokens.css` keeps the `@layer ui.tokens, ui.components, ui.utilities;` statement and
`color-scheme: light dark` — the two things that are not Atmosphere's and are not optional.
`theme-atmosphere.css` takes the 26 `light-dark()` values and every other token value.

This is the point of the milestone applied to the one file that currently mixes both: the layer
statement is what makes consumer overrides win, and it must not look optional by living in a file
named after a theme.

### Anchoring folds in

`core/` absorbs what `floating.css` carries today. One open question carries over and is answered
during implementation rather than assumed: the fallback branch currently wins by `:popover-open`
specificity, described in the file as "load-bearing rather than decorative". That is a specificity
hack for correctness inside the one library whose styling pitch is that consumers never fight
specificity. Establish whether layer order can do that job instead, and record the answer either
way.

### The three tiers, as documented

1. `core.css` — required. Behavior, not appearance.
2. `tokens.css` — required. The layer order and `color-scheme`.
3. `theme-atmosphere.css` plus the 42 component stylesheets — optional cosmetics.

## Constraints

- `validate-contracts.mjs` proves each contract's declared roots and values against the stylesheets
  that contract names, in both directions. Every affected contract's `css` array gains its core
  file, and the validator must still pass.
- `validate-docs` fails on a stylesheet no example references, so each new core file joins the
  relevant example's `styles`.
- The CSS figures in `performance-baselines.json` all move. Re-baseline as part of this milestone,
  and record before and after.
- No contract _value_ changes here. `contracts:validate` should only ever differ because a `css`
  array grew.

## Sequencing

1. Split `tokens.css`, which is self-contained and proves the pattern on 93 lines.
2. Extract core per component, starting with the anchored surfaces where the stakes are highest —
   `floating`, `popover`, `menu`, `select`, `combobox`, `listbox`, `sheet`, `toast`.
3. Extract the remainder.
4. Verify core-only rendering in a browser, per component.
5. Rewrite the styling documentation around the three tiers.
6. Re-baseline the size gate.

## Acceptance criteria

- `src/css/core/<component>.css` exists per component, with `src/css/core.css` importing them.
- No core stylesheet contains a `color`, `background`, `border-color`, `box-shadow`, `font`,
  `letter-spacing`, `transition`, or `border-radius` declaration, proven by a check rather than by
  review.
- `tokens.css` holds the layer statement and `color-scheme` and no theme values.
  `theme-atmosphere.css` holds the values.
- Importing `core.css` and `tokens.css` and nothing else leaves every component correctly
  positioned, structurally intact, and operable, verified in a browser per component.
- Dropping core as well leaves components functional but unpositioned, with no console error and no
  hang.
- `docs/styling/css.mdx` and `docs/styling/theming.mdx` describe the three tiers, and no page claims
  CSS is fully optional.
- Every component page's **Styling** section lists its core stylesheet.
- Whether the `:popover-open` specificity reliance was removed is recorded either way.
- `pnpm qa` passes.

---

Generated by Claude Opus 5 (High)
