---
name: verify-apg-conformance
description:
  Verify a Timeless UI component against its ARIA Authoring Practices Guide pattern — keyboard
  behavior, focus handling, accessible names, descriptions, roles, states, and relationships — and
  against the accessibility contract declared for it in the component registry. Use for requests
  like "is this accessible", "check the keyboard navigation", "is the ARIA right", or an axe
  violation from the apps/e2e sweep, and whenever an interactive component is added or changed.
  Prefer this over generic WCAG advice for anything in this library, because the registry declares
  what each component must implement.
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

## 5. Run the automation

```bash
pnpm build:packages && pnpm build:stories
pnpm -F @apps/e2e run e2e -- a11y
```

The axe spec reads `apps/stories/story-routes.json`, so a new component needs its story built before
it is covered. Add an interaction state to the spec when the default render does not exercise the
component's interesting state — the existing listbox `selected` and dialog `open` cases are the
pattern to copy.

Then check the states the sweep cannot reach: keyboard-only traversal, focus order after open and
close, and behavior with scripting disabled where the component claims to work without it
(`apps/e2e/tests/apps/stories/no-javascript.spec.ts`).

## 6. Report

For each finding: the pattern requirement, what the component does instead, the file and line, and
whether a native platform feature would remove the need for the ARIA or JS involved. Prefer removing
JS over adding ARIA.
