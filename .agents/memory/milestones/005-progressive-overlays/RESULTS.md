# Progressive Overlays Results

Status: Complete.

## Summary

- Added shared `@timelessui/core` helpers for generated IDs, focus return, first-focus targeting,
  Escape/outside dismissable layers, and event outside checks.
- Added side-effect-free overlay modules in `@timelessui/components` for Tabs, Dialog, Popover,
  Hover Card, Tooltip recipe, Toast, and Toaster.
- Added an explicit `@timelessui/components/define` entrypoint. `defineTimelessElements(window)`
  registers the progressive custom elements; the package root remains side-effect free.
- Added CSS for Tabs, CSS-first Collapsible, Dialog, Popover/Hover Card/Tooltip, and Toast/Toaster.
  Floating popovers use CSS anchor positioning with bottom-center defaults and top/right/left
  fallback preferences.
- Added StoryLite stories under `Progressive Overlays/` with copyable source snippets and public
  Light DOM anatomy.
- Registered stories custom elements in `.storylite/setup.ts` so standalone canvas routes enhance
  consistently.

## Notes

- Collapsible stays CSS-first using native `details` and `summary`, based on the proof-of-concept
  accordion pattern.
- Dialog uses native `dialog` for modality, top-layer behavior, Escape handling, and focus return.
- Popover uses native `popover` and `popovertarget` wiring. Collection-style menu/select behavior
  remains deferred to `006-menus-select-combobox`.
- Hover Card and Tooltip use manual Popover API content. Pointer/focus intent opens the content;
  button-style triggers also support click as a touch and browser-QA fallback. Tooltip markup uses
  `ui-hover-card anchor="trigger-id"` so the host owns the floating content without tooltip-specific
  `data-ui-*` anatomy.
- Toast items are authored Light DOM, can auto-dismiss through `duration`, emit `ui-dismiss`, and
  can be appended through the thin `toast()` helper. `ui-toaster` is a fixed viewport container with
  configurable viewport `placement` and `stack` attributes; it is not anchored to the toast trigger.
  `stack="overlap"` gives the Sonner-like card pile.

## Final cleanup trade-offs

- The worktree/index curation pass found no staged or unstaged changes to split. The milestone work
  is already committed on `origin/main`, with local follow-up commits for floating fallback cleanup
  and agent-rule documentation.
- Floating fallback positioning now limits JavaScript to measured coordinates and state hooks:
  `--ui-floating-left`, `--ui-floating-top`, `data-ui-floating`, and `data-ui-placement`. CSS owns
  the visual positioning reset, placement fallback styling, and anchor hooks, which keeps component
  JS aligned with the CSS-first and Light DOM-first architecture rules.
- The fallback path still measures layout when native anchor positioning is not sufficient, because
  CSS alone cannot compute viewport-constrained fallback coordinates across all supported browsers.
  That measured output is intentionally exposed through CSS custom properties rather than direct
  visual declarations.
- The `ui-hover-card anchor="trigger-id"` tooltip recipe remains a documented exception where the
  host can also be the floating content. This keeps tooltip anatomy small, but requires CSS to style
  `ui-hover-card[anchor]` as floating content.
- Menu, menu button, toolbar, select, and combobox behavior remain deferred to
  `006-menus-select-combobox`; the overlay helpers are now the foundation those collection
  primitives should reuse.

## Verification

- `pnpm -F @timelessui/core run typecheck`
- `pnpm -F @timelessui/core run test`
- `pnpm -F @timelessui/core run build`
- `pnpm -F @timelessui/components run typecheck`
- `pnpm -F @timelessui/components run test`
- `pnpm -F @timelessui/components run build`
- `pnpm -F @apps/stories run typecheck`
- `pnpm -F @apps/stories run test`
- `pnpm -F @apps/stories run build`
- Browser QA at `http://localhost:1994/`:
  - Tabs enhanced tablist roles, generated IDs, selected state, keyboard navigation, and hidden
    inactive panels.
  - Collapsible rendered native `details` items and toggled open state without custom JavaScript.
  - Dialog opened a native modal dialog, applied dialog semantics, and restored trigger state.
  - Popover opened native popover content through `popovertarget` wiring.
  - Hover Card and Tooltip opened manual popovers and applied ARIA relationships.
  - Toast dismissed through the authored close control and set `data-ui-dismissed="user"`.
  - Console warnings/errors: none.

## Remaining

- Menu, custom Select, and Combobox collection behavior remain scoped to
  `006-menus-select-combobox`.
