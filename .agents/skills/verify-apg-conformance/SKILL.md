---
name: verify-apg-conformance
description:
  Verify a Timeless UI component against its ARIA Authoring Practices Guide pattern — keyboard
  behavior, focus handling, accessible names, descriptions, roles, states, and relationships — and
  against WCAG 2.2 Level A and AA, including the criteria axe cannot see — contrast in both colour
  schemes, focus-indicator contrast, timing limits, focus survival, and target size. Use for
  requests like "is this accessible", "check WCAG", "check the keyboard navigation", "is the ARIA
  right", or an axe violation from the apps/e2e sweep, and whenever an interactive component is
  added or changed. Prefer this over generic WCAG advice for anything in this library, because the
  registry declares what each component must implement.
---

# Verify APG conformance

AGENTS.md makes this a hard rule: every component with semantics or interaction implements the
keyboard behavior, focus handling, accessible names, descriptions, roles, states, and relationships
its APG pattern expects. <https://www.w3.org/WAI/ARIA/apg/patterns/>

Automation catches a fraction of this. `apps/e2e/tests/apps/stories/a11y.spec.ts` runs axe across
every StoryLite route in applicable states, which finds contrast, naming, and structural failures —
and cannot find a wrong roving-tabindex implementation, a focus trap that returns focus to the wrong
element, or ARIA papering over missing behavior.

## 1. Read the declared contract

The component's `accessibility()` block in `packages/components/scripts/component-registry.mjs`:

```js
accessibility(
  'tabs', // APG pattern slug
  'Tabs', // display label
  [key('Arrow keys', '...'), key('Home / End', '...')],
  'The tablist is one tab stop: ...', // notes
)
```

The split between `keys` and `notes` is deliberate and load-bearing for a progressive-enhancement
library: `keys` documents only what the component itself implements, and platform behavior goes in
`notes`, because "the browser does this" is the more useful fact for a consumer. Check the split is
still honest after any behavior change.

Then read the pattern itself. Do not verify against the registry block alone — the block can be
wrong, and that is one of the things being checked.

## 2. Check native-first

In order, before any keyboard testing:

- Is the root a native element that already carries the semantics? A `<button>`, `<dialog>`,
  `<details>`, `<input type="checkbox">`. If the component reimplements one, that is the finding.
- Is any ARIA replacing DOM behavior rather than completing a native contract? `role="button"` on a
  `<div>` with a click handler is the canonical failure; so is `aria-expanded` maintained by JS on a
  trigger the platform would have handled through `popovertarget` or `commandfor`.
- Is Shadow DOM used where Light DOM would work?
- Is decorative anatomy and are generated behavior hooks hidden from assistive technology?
- Does the component still carry its semantics with Timeless CSS absent?

## 3. Check the pattern's keyboard contract

For every key the pattern names, decide: implemented by the component, provided by the platform, or
missing. `notes` should already say which — verify, do not trust.

Repo-specific things to confirm:

- Roving tabindex: the collection is **one** tab stop. Tab enters the active item and leaves the
  collection; arrows move within it. `COLLECTION_KEYS` in the registry declares arrows, Home/End,
  and Page Up/Down for every roving-focus collection — a component that declares it must implement
  all of it, including skipping disabled items.
- Focus return: an overlay returns focus to the element that opened it. Native `<dialog>` and the
  Popover API do this; a JS trigger path must not break it.
- Escape and light dismiss: for `popover` and `<dialog>` these come from the platform. Confirm the
  component has not overridden them.
- Orientation: arrow-key axis follows the `orientation` attribute.

## 4. Check names, descriptions, relationships

Timeless wires relationships, never content. A `role="dialog"` surface still needs an
author-supplied `aria-labelledby` — verify the story and the example factory supply one, since that
markup is what consumers copy.

Confirm `aria-controls`, `aria-expanded`, `aria-haspopup`, `aria-selected`, `aria-checked`, and
`hidden` are set where the pattern requires, and that public state is exposed through native
attributes, ARIA, or `:state()` — never through a public `data-ui-*` diagnostic.

## 5. Check the WCAG 2.2 AA criteria axe cannot see

The target is WCAG 2.2 Level A and AA. The axe sweep covers the structural half; these six are the
ones that have actually bitten this library, each verified by driving the component rather than by
reading the CSS. Milestone 030 records the measurements.

**SC 1.4.3 Contrast, in _both_ colour schemes.** A token that resolves through `light-dark()` has
two values and only one of them has been checked if you scanned once. Scan
`prefers-color-scheme: dark` as well. Two traps:

- axe cannot see the UA canvas. Timeless deliberately leaves `html` and `body` unpainted, so on a
  bare page axe blends dark-scheme text over the white it assumes and reports nearly everything at
  about 1.09:1. Paint a surface before scanning or every result is noise.
- A colour token used as a _foreground_ needs a dark branch; one used as a _fill_ behind a fixed
  foreground must not have one. `--ui-accent` versus `--ui-bg-accent` is that distinction.

**SC 1.4.11 Non-text Contrast, for the focus ring.** 3:1 against the adjacent surface. No axe rule
covers it. `--ui-focus` derives from `--ui-accent`, so it inherits whatever that token does — check
it against every surface token the component can sit on.

**SC 2.2.1 Timing Adjustable.** Anything that dismisses, advances, or expires on a timer. A limit is
only acceptable if the user can turn it off, adjust it, or extend it — and a timer that keeps
running while the pointer is over the element or focus is inside it fails in practice whatever the
attribute allows.

**SC 2.4.3 Focus Order — focus survival.** The single highest-yield check in this list. Whenever a
component sets `disabled`, `hidden`, closes a `popover`, or removes a node, ask whether that element
could be holding focus. Chromium drops focus to `<body>` and restores nothing. Test it: focus the
control, drive it to the state that hides or disables it, then read `document.activeElement`.

```js
await control.focus()
await control.press('Enter') // or wait out the timer
await expect(page.locator('body')).not.toBeFocused()
```

Prefer `aria-disabled="true"` with a no-op activation over `disabled` for exactly this reason — it
is also the APG treatment, and Menu's registry note already argues for it.

**SC 2.5.8 Target Size (Minimum).** 24 × 24 CSS px. axe-core does have a `target-size` rule under
`wcag22aa`, so the sweep sees the clear cases — but it cannot tell you that a target passes _only_
through the spacing exemption, which a consumer tightening a gap will silently break. Measure the
effective target, which for a labelled control is the `<label>`, not the input. Check it with the
theme dropped too: sizing lives in the theme, so a core-only build can fail where the themed one
passes.

**SC 2.5.7 Dragging Movements.** Any pointer gesture needs a single-pointer alternative. Sheet's
swipe-to-dismiss has Escape and a close control; a new gesture needs the same.

## 6. Prove every declared key

`accessibility().keys` is a promise. Press each key and watch focus or value move. Two rows in this
repository were documented for five components and implemented by none, and one component declared a
whole table with no `keydown` handler behind it — so treat the registry as the claim under test,
never as evidence.

Rows shared through `COLLECTION_KEYS` are the highest risk: one wrong row propagates to every
collection, into `contracts.ts`, into `llms-full.txt`, and into the contract table inside the
published skill.

## 7. Run the automation

```bash
pnpm build:packages && pnpm build:stories
pnpm -F @apps/e2e run e2e -- a11y
```

The axe spec reads `apps/stories/story-routes.json`, so a new component needs its story built before
it is covered. Add an interaction state to the spec when the default render does not exercise the
component's interesting state — the existing listbox `selected` and dialog `open` cases are the
pattern to copy.

Then check the states the sweep cannot reach: keyboard-only traversal, focus order after open and
close, the dark scheme, and behavior with scripting disabled where the component claims to work
without it (`apps/e2e/tests/apps/stories/no-javascript.spec.ts`).

Two things a green sweep does not mean. It does not mean the published package behaves this way —
nothing in the repository installs it and follows the documented install path. And it does not mean
a disabled control is fine: a disabled item reports no hover, focus, or active state and no
`:focus-visible`, which reads identically to a control with no states at all. Exclude them or you
will report noise.

## 8. Report

For each finding: the pattern requirement or the WCAG success criterion by number and name, what the
component does instead, the file and line, and whether a native platform feature would remove the
need for the ARIA or JS involved. Prefer removing JS over adding ARIA.

Give a measured number wherever one exists — "2.62:1 against 4.5:1" and "`activeElement` became
`<body>`" are findings; "contrast looks low" and "focus might be lost" are not. Say how each was
confirmed, and name the browser build when the answer came from driving it.
