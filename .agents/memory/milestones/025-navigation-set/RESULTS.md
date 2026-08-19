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

## Platform behavior confirmed before planning

Nothing platform-novel is required. Two things to check during implementation rather than assume:

- **Whether generated content from `::before` / `::after` is announced** by the screen readers in
  scope. The plan relies on a CSS separator being inaudible by construction. Current behavior in
  Chromium and WebKit is that generated content _is_ exposed in the accessibility tree in some
  cases, so verify with the axe sweep and a manual check before claiming the separator is silent. If
  it is announced, the fallback is an authored `<span aria-hidden="true">` the factory emits.
- **Whether `text-overflow: ellipsis` on a flex or grid child needs `min-inline-size: 0`** in all
  three engines for the breadcrumb truncation. It generally does; confirm rather than assume.

Pending implementation.

## Open decisions

**Does `ui-nav-menu` need to exist?** The plan requires a prototype before the element. `ui-menu`
already supports `role="menubar"` and `ui-menu-button` already gives a triggered surface, so the
only thing left unserved is the _shared panel_ — several triggers, one surface, and pointer movement
between triggers without a close-reopen flicker.

- **If composition covers it:** a documented recipe and no new element. This is the better outcome
  and should be genuinely preferred, not treated as a consolation.
- **If not:** the element's whole justification is the shared panel, and that must be stated in the
  contract so nobody later "simplifies" it back into a popover.

**Breadcrumb truncation strategy.** CSS-only truncation of the middle crumbs is simple and needs no
measurement, but it cannot collapse a chain into a "…" overflow menu the way some designs want. A
JS-measured collapse would look better on deep hierarchies and would put a measurement loop into a
component that otherwise needs no script at all. Take the CSS route; record the limitation instead
of hiding it.

**Pagination boundary controls.** These are links, so a "disabled previous" is a contradiction — a
disabled link is not a thing. Rendering the boundary as a non-link `<span>` is correct and means the
control's element type changes with state, which is slightly awkward for a consumer templating it.
The alternative, `aria-disabled` on an `<a href>`, keeps the markup stable and lies: the link still
navigates. Take the honest one.

**Should the docs component count be derived rather than hardcoded?**
`apps/web/src/content/docs/docs/index.mdx` carries the count by hand and no validator checks it, so
every milestone that adds or removes a component has silently depended on someone remembering.
Deriving it from `examples.length` closes the gap permanently and is a few lines. Doing it here is
scope creep; not doing it means the fifth milestone in a row carries the same manual task.

Pending implementation.

## Decisions and constraints

Pending implementation.

## Summary

Pending implementation.

## Validation results

Pending implementation.

---

Generated by Claude Opus 5 - High reasoning
