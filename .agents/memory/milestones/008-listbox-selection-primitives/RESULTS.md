# 008 Listbox and Selection Primitives Results

## Summary

- Added `ui-radio-group` and `ui-checkbox-group` as Light DOM controllers over native inputs.
- Added `ui-listbox` plus shared listbox helpers for option roles, ids, roving focus, selected
  state, active descendant state, filtering, and value extraction.
- Refactored `ui-select` and `ui-combobox` to reuse listbox helpers while preserving their authored
  anatomy and current public behavior.
- Added StoryLite stories and focused e2e coverage for Radio Group, Checkbox Group, and Listbox.

## Decisions and Tradeoffs

- Radio group uses one-tab-stop roving focus because it follows the APG radio group interaction
  model and keeps arrow-key selection predictable across authored native inputs.
- Checkbox group leaves every checkbox in the native tab order. The component only groups semantics
  and emits checked values because native checkbox keyboard behavior is already correct.
- Listbox keeps committed selection and active descendant behavior separate. Select commits
  selection to the focused option, while Combobox can clear active descendant state without falling
  back to the first option.
- The new component CSS uses `:where()` and public host/anatomy selectors to preserve low
  specificity and consumer override room.

## Follow-up Fixes

- Collection navigation stories were missing `choice-group.css` and `listbox.css` in the StoryLite
  meta. This made the standalone Listbox story render unstyled even though the package CSS existed.
- Menubar submenus originally opened from keyboard only. Top-level menubar submenu triggers now open
  authored submenu popovers on click too, matching user expectations for mouse/pointer operation.
- E2E now asserts Listbox CSS application, click selection, and menubar submenu click opening so
  these paths cannot silently regress behind keyboard-only coverage.
- StoryLite workbench previews run component DOM inside an iframe realm. Menubar submenu lookup now
  checks elements against their owner document's `HTMLElement`, rather than the module-global
  `HTMLElement`, so authored submenus resolve correctly in embedded previews.
- Menubar submenu keyboard behavior now includes lateral `ArrowRight` and `ArrowLeft` movement from
  inside an open submenu to the next or previous top-level menubar item, matching the proof-of-
  concept behavior.
- Menubar submenu placement now uses `position-area: bottom span-right` so the submenu left edge
  aligns with the trigger left edge. `bottom left` placed the surface in the bottom-left grid area,
  which made it start at the trigger's right edge in Chromium.

## Verification

- `pnpm exec oxfmt --write ...`
- `pnpm -F @timelessui/components run typecheck`
- `pnpm -F @timelessui/components run test`
- `pnpm -F @timelessui/components run build`
- `pnpm -F @apps/stories run typecheck`
- `pnpm -F @apps/stories run test`
- `pnpm -F @apps/stories run build`
- `pnpm -F @apps/e2e run typecheck`
- `pnpm -F @apps/e2e run e2e -- --project=stories-chromium tests/apps/stories/collections.spec.ts`
  - 8 tests passed.
- Follow-up verification repeated the component package checks, stories checks, e2e typecheck, and
  the same full focused collections e2e suite with the new style/click assertions.
- A second follow-up added explicit `#/story/...` workbench iframe tests for Menubar and Listbox.
  The focused collections e2e suite now runs 10 tests and passes.
- Direct in-app browser verification on
  `http://localhost:1992/#/story/collection-navigation-toolbar--menubar` confirmed click opening and
  lateral submenu movement with `ArrowRight` and `ArrowLeft`.
- E2E now also asserts submenu bounding-box alignment against its trigger so visually wrong
  placement cannot pass as merely "visible".
- A visual audit of the 008 stories found that disabled choice labels and options depended on an
  undefined `--ui-disabled-opacity` token. The token now exists, and disabled radio/checkbox labels,
  Listbox options, Select options, and Combobox options use muted text plus transparent backgrounds.
- Listbox multiple mode now has a dedicated story. The component no longer lets the single-value
  watcher clear multiple authored `aria-selected="true"` options.
