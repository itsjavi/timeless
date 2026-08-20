# Milestone 028 Results

## Baseline

Read-only audit of a clean working tree at `9046d41` ("feat: menus, context menus, and overlay
gestures (milestone 024)"), Node 24.19.0, pnpm 11.22.0. No files were changed during the audit.

Every declaration in the 43 stylesheets was classified by property name with a throwaway script,
after stripping comments. Custom property _definitions_ were counted separately from the properties
that read them.

| Category                                                     | Declarations | Share |
| ------------------------------------------------------------ | -----------: | ----: |
| Behavior-critical (anchoring, display, overflow, appearance) |          271 | 13.5% |
| Structural but design-chosen (sizing, grid and flex layout)  |          371 | 18.5% |
| Cosmetic (colour, border, shadow, type, transition)          |          837 | 41.7% |
| Spacing (padding, margin, gap, border width)                 |          250 | 12.5% |
| Custom property definitions                                  |          303 | 15.1% |
| **Total**                                                    |    **2,006** |       |

The behavior-critical set breaks down as `display` 109, `overflow` 22, `appearance` 17,
`position-area` 17, `position` 16, `translate` 14, the `inset` family 42 across six logical
properties, `pointer-events` 6, `overscroll-behavior` 5, `forced-color-adjust` 4,
`position-try-fallbacks` 3, `z-index` 3, `color-scheme` 2, and one each of `anchor-name`,
`position-anchor`, `resize`, `touch-action`, and `border-collapse`. It spreads across 41 of the 43
files; only `components.css` and `link.css` contain none.

The classification is approximate at the boundary and should not be treated as exact. `translate`
was counted behavior-critical because in this library it positions anchored surfaces rather than
animating them, which is true of those surfaces and not necessarily of everything else. `padding`
and `gap` were given their own category precisely because they are arguably either. The number that
matters is the order of magnitude: a behavior-critical core is a seventh of the CSS, not half of it.

Supporting facts:

| Fact                                                 | Value                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| Stylesheets, and how many `components.css` imports   | 43, importing 42                                           |
| Stylesheets with rules outside a `@layer` block      | 0                                                          |
| `!important` declarations                            | 0                                                          |
| `attachShadow` calls across all packages             | 0                                                          |
| Contracts naming `floating.css` in their `css` array | 7                                                          |
| Contracts naming `tokens.css` in their `css` array   | 0                                                          |
| `tokens.css`                                         | 93 lines, 26 `light-dark()` values                         |
| CSS gzip, the four measured entries                  | popover 2,640, listbox 3,871, select 4,710, combobox 4,790 |

## Platform behavior confirmed before planning

Nothing yet. Four tasks require it and are written as verification rather than assertion:

- That importing only `core.css` and `tokens.css` leaves every component positioned, structurally
  intact, and operable. This is the acceptance criterion for the milestone and cannot be reasoned
  about — it is why phase 5 is a per-component browser sweep rather than a spot check.
- That dropping core as well degrades to unpositioned-but-functional, with no hang. The audit
  established that no JavaScript in the library waits on `transitionend`, `animationend`, or
  `getAnimations`, which is the reason to expect degradation rather than deadlock, but expecting is
  not confirming.
- That the anchoring fallback branch can or cannot win by layer order instead of `:popover-open`
  specificity.
- That `tokens.css` alone still establishes the layer order after the split, confirmed by a consumer
  class beating a component rule.

## Decisions and constraints

Four decisions were taken before the milestone opened rather than left to implementation.

**Core is per-component files plus an aggregate.** `src/css/core/<component>.css` with a `core.css`
that imports them, mirroring how `components.css` imports the 42 today. The alternative — one
aggregate file — was rejected because it breaks the promise in `css.mdx` that a route imports only
what it renders; a route pulling one component would carry core rules for all of them. Per-component
files with no aggregate were rejected because every consumer would then assemble two import lists
with no simple "just give me core" path. The chosen shape costs a directory and introduces no new
convention.

**`tokens.css` splits rather than being renamed.** The file currently mixes two unlike things: the
`@layer ui.tokens, ui.components, ui.utilities;` statement, which is what makes consumer overrides
win and is not Atmosphere's, and 26 `light-dark()` values, which are. Renaming the whole file to
`theme-atmosphere.css` was rejected because it would bury the one non-optional line in a file named
like a theme, which is how someone's override story silently breaks. Leaving the filename and
documenting the mixture was rejected because it preserves exactly the ambiguity this milestone
exists to remove. So `tokens.css` keeps the layer statement and `color-scheme`, and
`theme-atmosphere.css` takes the values.

**The narrow tier, not the broad one.** Core targets the 271 behavior-critical declarations, not the
642 that also include sizing and layout. The reason is the constraint below: every extracted
declaration duplicates a selector across two files, and that duplication has to be maintained. At
271, dominated by `display`, the cost is bounded. At 642 it is a rewrite of the entire visual layer
with a permanent synchronisation obligation, and much of what it would move — a `max-block-size`
clamp, a grid template — is a design decision rather than a behavioral requirement.

**Boundary enforcement is mechanical, not editorial.** A check fails the build when a core
stylesheet declares a cosmetic property. Without it the boundary erodes on the first convenient
exception, and this repository's pattern is to gate its own claims rather than trust review.

### Constraints discovered during the audit

**The split runs inside rule blocks, not between them.** From `listbox.css`, one `ui-listbox` rule
carries `box-sizing`, `min-inline-size`, and `max-block-size` alongside `border`, `border-radius`,
`background`, and `color`. So extraction is not a file move: each affected rule becomes two rules
sharing a selector across two files, which must then stay in sync as selectors change. This is the
single largest cost in the milestone and it shaped the narrow-tier decision above.

**A cascade layer cannot substitute for the file split.** Layers reorder CSS; they cannot exclude
it. There is no mechanism to load a stylesheet and opt out of one of its layers. `@layer ui.core`
looks like a cheaper version of this milestone and is not a version of it at all.

**`validate-contracts.mjs` proves each contract against the stylesheets it names, in both
directions.** Every affected contract's `css` array gains its core file or the validator fails. This
forces the ordering within each phase: extract, then update the contract, then update the example
`styles`, then validate.

**The recorded CSS sizes all move.** `performance-baselines.json` holds CSS figures for four
entries, and every one changes when rules relocate. Re-baselining is part of this milestone, not a
follow-up.

### What the audit confirmed rather than found

Four properties hold library-wide and constrain what this milestone may break:

- Every stylesheet rule is inside `ui.tokens`, `ui.components`, or `ui.utilities`. Unlayered
  consumer CSS beats every Timeless rule at any specificity, and no `!important` exists to fight.
- No Shadow DOM in any package, so consumer CSS reaches every host and descendant.
- No JavaScript waits on a CSS transition or animation, so removing stylesheets degrades rendering
  without deadlocking behavior.
- Component roots sit at 0,1,0 (`.ui-button`) or 0,0,1 (`ui-tabs`), with variants wrapped in
  `:where()`. `options.css` wraps everything past the root deliberately.

`DESIGN.md:252` already requires components stay "understandable without the theme CSS" and
`DESIGN.md:245` already forbids core from enforcing Atmosphere styling. This milestone implements a
principle the design language already states.

### The audit's own limits

The registry could not be introspected from a one-off Node import — `component-registry.mjs` does
not export `componentContracts` under the name tried — so contract and root counts were not
re-verified. Every figure above comes from the source files directly.

`HEAD` moved from `a165c0c` to `9046d41` mid-audit. Every figure was re-measured on `9046d41`
afterwards; earlier drafts of the stylesheet count and the `:state()` count reflected the older tree
and were corrected to 43 and 8.

## Summary

Pending implementation.

## Validation results

Pending implementation.

---

Generated by Claude Opus 5 (High)
