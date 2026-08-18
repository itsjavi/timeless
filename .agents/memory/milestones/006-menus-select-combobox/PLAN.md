# Menus Select Combobox And Sheets Plan

## Summary

- Build collection-based interactions that depend on list anatomy, popovers, roving focus, and
  active-descendant behavior.
- Add the first navigation/panel overlay with Sheet, reusing native dialog and the overlay/focus
  helpers from milestone 005.
- Add these components in `packages/components`, published as `@timelessui/components`.
- Reuse primitives from previous milestones instead of creating isolated menu/select
  implementations.

## Components

- Dropdown Menu
- Menu List / Menubar
- Menu Button
- Toolbar
- Custom Select
- Combobox
- Sheet / Side Panel

## Contracts

- Menu/list item anatomy must compose with List and List Item CSS contracts.
- Dropdown and custom select should compose with Popover rather than invent a separate overlay.
- Sheet should compose with native `dialog` rather than invent a custom overlay stack. Use
  `showModal()` only when the `modal` boolean attribute is present; otherwise use `show()` so the
  rest of the page remains interactive.
- Sheet host API: `<ui-sheet position="top|right|bottom|left" modal open>`. `position` defaults to
  `right`; `modal` and `open` are boolean attributes. Component JS reflects runtime open state back
  to the host `open` attribute.
- Sheet anatomy should be author-owned Light DOM: `data-ui-trigger` opens the sheet,
  `dialog[data-ui-sheet-panel]` is the native panel, `data-ui-close` closes it, and
  `data-ui-sheet-body` identifies the scrollable content area. Header, title, description, and
  actions hooks may use `data-ui-sheet-header`, `data-ui-sheet-title`, `data-ui-sheet-description`,
  and `data-ui-sheet-actions`.
- Do not add a separate `ui-sheet-overlay` custom element in v1. Modal sheets use the native
  `dialog::backdrop` as the scrim; non-modal sheets do not render a blocking overlay. If a future
  authored scrim hook becomes necessary, prefer a documented `data-ui-sheet-backdrop` anatomy hook
  over generated visual DOM.
- Sheet events should be emitted by the `ui-sheet` host, not by anonymous generated elements:
  `ui-open` after opening, `ui-close` after closing, and `ui-dismiss` for user dismissal intents
  such as Escape, backdrop click, or a close control. Include a source in event detail, e.g.
  `trigger`, `close`, `escape`, `outside`, or `api`.
- Combobox should remain input-first and use native input editing behavior.
- Custom Select and Combobox must document submitted value ownership through native inputs.
- Keyboard behavior should follow ARIA APG expectations for roving focus, typeahead, Escape, Enter,
  Home, End, and disabled item skipping.
- Sheet behavior should follow dialog accessibility expectations: accessible name required in
  stories, focus moves into the panel when opened, focus returns to the trigger when closed, Escape
  closes modal sheets, close controls remain native buttons, and no Timeless CSS is required for the
  underlying dialog to remain usable.
- CSS must stay in `@layer ui.components`, use low-specificity selectors such as
  `ui-sheet :where([data-ui-sheet-panel])`, target plain host attributes like
  `ui-sheet[position='left']`, and avoid BEM-style generated class anatomy.

## Acceptance

- Browser tests cover keyboard navigation, selection, closing behavior, and focus return.
- Sheet browser tests cover modal and non-modal opening, focus return, close control dismissal,
  backdrop/Escape dismissal for modal sheets, and page interaction remaining available for non-modal
  sheets.
- Stories show static fallback, enhanced usage, disabled options, grouped options, sheet positions,
  modal/non-modal sheets, and custom styling hooks.
- `pnpm -F @timelessui/components run test && pnpm -F @apps/stories run test`
