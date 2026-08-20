# Milestone 024 Tasks

Depends on milestone 022 for the `group` / `group-label` / `separator` part vocabulary and the
ownership-scoped discovery helper, and on milestone 021 for the tooltip's visual work.

## 1. Menu discovery, roles, and CSS tidy-up

- [x] Replace `findMenuItems`'s `host.children` filter (`menu.ts:399-403`) with an ownership-scoped
      descendant walk that stops at nested component roots, modelled on `parts.ts`'s `isOwnedBy`
- [x] Keep the exported name `findMenuItems`
- [x] Reconcile `MENU_ITEM_SELECTOR` (`menu.ts:37-38`) with the registry's `item` selector
      `[role^='menuitem']` (`component-registry.mjs:1051`); record which side moved
- [x] Add a `:not([role='separator'])` guard to item discovery — unnecessary once the selector is
      `[role^='menuitem']`, since one `role` attribute cannot be both. Not added rather than added
      dead
- [x] Fix `focusFirstMenuItem` (`menu-button.ts:203-209`) to skip disabled items using the exported
      `isMenuItemDisabled` (`menu.ts:391`)
- [x] Merge the two identical-selector `ui-menu` blocks at `menu.css:6-8` and `menu.css:10-16`
- [x] Add `:where(:not([aria-disabled='true']))` to the hover rule at `menu.css:65-72`
- [x] Align the disabled treatment at `menu.css:80-82` with the option surfaces' background and
      colour reset
- [x] Declare `--ui-menu-min-inline-size` (`menu.css:13`) in the registry, or rename it
      `--ui-internal-*` — already declared before this milestone; no change needed
- [x] Declare `group`, `group-label`, `separator`, `submenu`, and `submenu-trigger` parts on `menu`
- [x] Wire `group-label` with `aria-labelledby` on the `role="group"`
- [x] Confirm every selector `menu.css` targets has a declared part
- [x] Unit test: grouped items are found; a nested `ui-menu`'s items are not; separators are
      excluded

## 2. Checkbox and radio menu items

- [x] Toggle `aria-checked` on activation of a `menuitemcheckbox`
- [x] Set `aria-checked` and clear siblings for a `menuitemradio`, scoped to its owning
      `role="group"` or the menu when there is no group
- [x] Emit a cancelable event before writing so an author can `preventDefault()` and keep owning the
      state
- [x] Export the event's detail type, or `manifest:validate` fails
- [x] Update the `item` part description, which currently implies the author does this
- [x] Add the behavior to the accessibility notes
- [x] Unit test: radio sibling clearing does not cross group boundaries
- [x] Unit test: a cancelled event leaves `aria-checked` untouched

## 3. Submenu keys at any depth

- [x] `ArrowRight` on an item with a submenu opens it and focuses its first enabled item
- [x] `ArrowLeft` inside a submenu closes it and returns focus to its trigger
- [x] Preserve the existing menubar top-level behavior
- [x] Resolve the keys logically so they swap under `dir="rtl"`
- [x] Add both key rows to the accessibility block at `component-registry.mjs:1058-1072`
- [x] Record that pointer-opening submenus with an intent delay is deliberately out of scope
- [x] E2E: two levels deep, and in `dir="rtl"`

## 4. `ui-context-menu`

- [x] Settle the anchor question: position the surface from `--ui-context-menu-x` /
      `--ui-context-menu-y` custom properties with CSS owning `position: fixed` and the insets. Do
      **not** generate an undocumented zero-size anchor element
- [x] Listen for `contextmenu` on the host, `preventDefault()`, record coordinates, open the menu
- [x] Support the `ContextMenu` key and `Shift+F10`, positioned against the focused element
- [x] Clamp to the viewport and flip near edges, in CSS — clamped, not flipped. `min()` over a
      `translate` percentage shifts the surface back by exactly its overflow, which no `if()`-free
      CSS can turn into a hard flip. Recorded in RESULTS.md
- [ ] ~~Reuse core's dismissable-layer controller for dismissal~~ — not done, deliberately. The
      surface is `popover="auto"`, so Escape, light dismiss, and top-layer stacking come from the
      Popover API. A JavaScript layer here would reimplement the platform
- [x] Delegate items, keyboard, typeahead, and submenus to the Menu enhancement functions
- [x] Registry `customElement(...)` entry with real descriptions
- [x] `src/css/context-menu.css` in the `ui.components` layer
- [x] `@import` added to `src/css/components.css`
- [x] `src/context-menu.ts` and `src/context-menu.test.ts`
- [x] `pnpm -F @timelessui/components run generate`
- [x] Export block added to `src/index.ts`
- [x] `./context-menu` subpath added to `packages/components/package.json` exports
- [x] Tag appended to the ordered list in `src/define.test.ts`
- [x] Example factory, escaped — `uiAttributes` / `uiAttributeString` do not apply: the root is a
      custom-element host, so it takes plain attributes and has no `data-ui-*` configuration to
      spread
- [x] Catalog entry whose `styles` include every stylesheet of every named contract plus
      `tokens.css`
- [x] Loader added to `apps/web/src/scripts/preview-runtime.ts`
- [x] Story titled `Library/<Domain>/<Component>` matching the catalog domain and id
- [x] Entry added to `apps/stories/src/smoke.test.ts`
- [x] `pnpm build:stories`, then commit the regenerated `apps/stories/story-routes.json`
- [x] Update the hardcoded component count in `apps/web/src/content/docs/docs/index.mdx`
- [x] Document that this pattern has no no-JavaScript fallback
- [x] Confirm `audit-component-contracts` finds no generated visual element and no visual
      declaration written from JS

## 5. Tooltip becomes non-interactive

- [x] Remove the click toggle under `variant="tooltip"` (`hover-card.ts:140`, `:201-213`)
- [ ] ~~Remove the pointer-enterable surface behavior (`hover-card.ts:143-144`)~~ — not done, and
      must not be: WCAG 2.2 SC 1.4.13 "Hoverable" requires hover-triggered content to survive the
      pointer moving onto it. Only the click toggle was removed
- [x] Confirm hover and focus still open it
- [x] Confirm Escape still closes it via core's dismissable layer (`dismissable-layer.ts:23`)
- [x] Decide whether tooltips get their own delay defaults instead of the shared 180/100ms pair; if
      so, change the registry attribute defaults rather than adding a value set — decided: keep the
      shared pair, because one attribute cannot have two documented defaults
- [x] Run `verify-apg-conformance` against the `tooltip` pattern claimed at
      `component-registry.mjs:1019` and confirm it now passes

## 6. Dialog and Sheet accessible names

- [x] Add declared `title` and `description` parts to the `dialog` contract
- [x] Add the same to the `sheet` contract
- [x] Wire `aria-labelledby` and `aria-describedby` from them using `ensureElementId`, following
      `tabs.ts:303-304`
- [x] Make `sheet.css:73-79`'s `> header > h1|h2|h3` the `title` part's selector
- [x] Never overwrite an author-supplied `aria-labelledby`
- [x] Update the prose note at `component-registry.mjs:886` so the parts table also explains naming
- [ ] ~~Convert `createDialog` and `createSheet` in `overlays.html.ts` from hand-authored `titleId`
      / `descriptionId` + `aria-labelledby` / `aria-describedby` to `data-ui-part="title"` and
      `="description"`, so the copyable source stops teaching the boilerplate~~ — the part tokens
      were added and the authored ARIA kept. Removing it leaves a modal dialog nameless on exactly
      the path the library advertises: opened by `command="show-modal"` before any bundle loads.
      `no-javascript.spec.ts` caught it
- [x] Rebase those factory edits onto milestone 020's, which adds `commandfor` / `command` to the
      same lines
- [x] Confirm 020's `triggerWiring` field survives in the `enhanceDialogParts` / `enhanceSheetParts`
      results after the ARIA wiring is added
- [x] E2E: accessible name and description resolve from the parts; an authored `aria-labelledby`
      survives

## 7. Sheet swipe-to-dismiss

- [x] Add pointer listeners in the `enhance()` body at `sheet.ts:122-131` using
      `this.on(target, type, handler, { signal })`
- [x] Capture the `pointerId` with `setPointerCapture`
- [x] Derive the drag axis from `resolveSheetPosition`
- [x] Track the start coordinate, running delta, and threshold-crossed
- [x] Detect whether the gesture began inside the scrolling `> section` (`sheet.css:88-94`) and let
      it scroll instead of dragging when that section can scroll in the drag axis
- [x] Write `--ui-sheet-drag-offset` as a px length on the panel, following `floating.ts:108-111`
- [x] Confirm JS writes no `translate`, `transition`, inset, or colour
- [x] Suppress the entry animation while dragging via `setCustomState('--dragging', true)`
- [x] Gate `sheet.css`'s `@keyframes` on the drag state — written as an `animation: none` override
      under `ui-sheet:state(--dragging)` rather than a `:not()` guard, so a browser without
      `:state()` keeps the animation instead of dropping the whole rule
- [x] Restore the animation on release
- [x] Dismiss past the threshold; otherwise clear the offset and let CSS animate back
- [x] Respect `prefers-reduced-motion` for the release animation only, not for the drag
- [x] Declare a `drag-handle` part if one is introduced
- [x] Declare the `dragging` state, following the internal custom-state precedent at
      `component-registry.mjs:1562-1574`
- [x] Declare `--ui-sheet-drag-offset` as a registry variable
- [x] Decide whether a swipe emits a cancelable event before dismissing, for consistency with the
      platform's cancelable `request-close` that milestone 020 relies on; record the choice —
      decided: not cancelable, because a swipe is a pointer gesture on the overlay and behaves like
      the backdrop click it most resembles
- [x] Add a `swipe` member to `SheetDismissSource` (`sheet.ts:19-20`), and confirm
      `SheetEventSource` widens with it and does not collide with 020's use of `'trigger'`
- [x] Thread it through `dismissAndClose` (`sheet.ts:248-251`)
- [x] Update the event description at `component-registry.mjs:920-924`
- [x] Confirm the sheet's parts, states, and variables arrays are no longer empty

## 8. Verification

- [x] `pnpm -F @timelessui/components run test`
- [x] `pnpm -F @timelessui/components run contracts:validate`
- [x] `pnpm -F @timelessui/components run manifest:validate`
- [x] E2E: right-click opens the context menu at the pointer, clamped near all four viewport edges
- [x] E2E: `ContextMenu` key and `Shift+F10` open it from the keyboard
- [x] E2E: swipe dismisses a sheet from each of the four positions
- [x] E2E: a swipe starting in a scrollable section scrolls rather than dragging
- [x] E2E: a below-threshold swipe springs back
- [x] E2E: swipe-dismissing a sheet opened through milestone 020's **authored**
      `command="show-modal"` path returns focus to the trigger — the combination is new, since that
      path captures the return target from `CommandEvent.source` rather than a click handler
- [x] E2E: typeahead still works with grouped menu items
- [x] `a11y.spec.ts` over the new and changed routes
- [x] `verify-apg-conformance` for Menu, Menubar, Tooltip, Dialog, Sheet, and the context menu
- [x] `no-javascript.spec.ts`: sheets still open and close with no gesture
- [x] Reduced-motion: drag tracks the pointer, release animation suppressed
- [x] Add submenu-key and swipe cases to `platform.spec.ts` and confirm Firefox and WebKit
- [x] `pnpm build:packages` then `pnpm -F @timelessui/components run exports:validate`
- [x] `pnpm -F @timelessui/components run generated-dom:check`
- [x] Re-baseline `performance-baselines.json` — not needed: every figure is unchanged. None of the
      four pinned entrypoints imports Menu, Sheet, Dialog, or Context Menu, and `parts.ts` was not
      touched, so no chunk moved. Measured figures are in RESULTS.md
- [x] `pnpm boundaries:check`
- [x] `pnpm -F @timelessui/examples test`
- [x] `pnpm -F @apps/web run test:dist`, which is what `pnpm qa` runs
- [x] `pnpm qa`
- [x] Name every CI-only gate that was run locally in RESULTS.md
- [x] Record decisions, trade-offs, and results in RESULTS.md

---

Generated by Claude Opus 5 - High reasoning
