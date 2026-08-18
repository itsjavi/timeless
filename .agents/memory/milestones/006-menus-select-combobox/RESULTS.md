# Menus Select Combobox And Sheets Results

Status: Complete.

## Summary

- Added shared collection navigation helpers for orientation-aware movement, roving tabindex,
  disabled item handling, and normalized typeahead text matching.
- Added progressive `ui-sheet`, `ui-menu`, `ui-menu-button`, `ui-toolbar`, `ui-select`, and
  `ui-combobox` elements to `@timelessui/components`, with explicit define entrypoints and
  side-effect-free root exports.
- Added CSS for Sheet, Menu/Menu Button, Toolbar, Select, and Combobox using `@layer ui.components`
  and low-specificity `:where(...)` selectors.
- Added StoryLite collection navigation stories for Menu Button, Toolbar/Menubar, Select, and
  Combobox, plus Sheet stories under Progressive Overlays.
- Added browser coverage for modal/non-modal Sheet behavior, Menu Button keyboard navigation,
  Menubar submenu keyboard behavior, Toolbar roving focus, Select value sync, and Combobox
  filtering/selection.

## Notes

- Sheet uses native `dialog`: `modal` maps to `showModal()` and native `::backdrop`; non-modal
  sheets use `show()` so the page remains interactive.
- Sheet does not add a separate overlay element. The native backdrop handles modal scrim behavior,
  preserving platform modality and avoiding generated visual DOM.
- Menu keeps disabled menu items focusable by converting authored `disabled` to `aria-disabled`,
  matching APG menu expectations. Toolbar uses the shared collection helper and skips disabled
  controls for roving focus.
- Menubar supports authored adjacent submenu popovers. Top-level submenu triggers advertise
  `aria-haspopup="menu"`, open on Down Arrow/Enter/Space, move focus into the submenu, and close
  back to the trigger on Escape.
- Menu Button composes native Popover API plus the floating fallback hooks from milestone 005.
  `ui-menu` remains responsible for menu item semantics and keyboard navigation.
- Custom Select keeps form submission native through an authored hidden input with
  `data-ui-select-value`. The trigger label is an authored `data-ui-select-label` span that JS
  updates when selection changes.
- Combobox remains input-first. The native input owns editing; the listbox filters authored options
  and uses `aria-activedescendant` for active option state.

## Verification

- `pnpm -F @timelessui/components run typecheck`
- `pnpm -F @timelessui/components run test` - 19 files, 67 tests
- `pnpm -F @timelessui/components run build`
- `pnpm -F @apps/stories run typecheck`
- `pnpm -F @apps/stories run test` - 1 file, 5 tests
- `pnpm -F @apps/stories run build`
- `pnpm -F @apps/e2e run typecheck`
- `pnpm -F @apps/e2e run e2e -- --project=stories-chromium tests/apps/stories/overlays.spec.ts tests/apps/stories/collections.spec.ts`
  - 18 tests passed
- Follow-up submenu check:
  `pnpm -F @apps/e2e run e2e -- --project=stories-chromium tests/apps/stories/collections.spec.ts`
  - 5 tests passed
