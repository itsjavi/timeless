# Milestone 024 Tasks

Depends on milestone 022 for the `group` / `group-label` / `separator` part vocabulary and the
ownership-scoped discovery helper, and on milestone 021 for the tooltip's visual work.

## 1. Menu discovery, roles, and CSS tidy-up

- [ ] Replace `findMenuItems`'s `host.children` filter (`menu.ts:399-403`) with an ownership-scoped
      descendant walk that stops at nested component roots, modelled on `parts.ts`'s `isOwnedBy`
- [ ] Keep the exported name `findMenuItems`
- [ ] Reconcile `MENU_ITEM_SELECTOR` (`menu.ts:37-38`) with the registry's `item` selector
      `[role^='menuitem']` (`component-registry.mjs:1051`); record which side moved
- [ ] Add a `:not([role='separator'])` guard to item discovery
- [ ] Fix `focusFirstMenuItem` (`menu-button.ts:203-209`) to skip disabled items using the exported
      `isMenuItemDisabled` (`menu.ts:391`)
- [ ] Merge the two identical-selector `ui-menu` blocks at `menu.css:6-8` and `menu.css:10-16`
- [ ] Add `:where(:not([aria-disabled='true']))` to the hover rule at `menu.css:65-72`
- [ ] Align the disabled treatment at `menu.css:80-82` with the option surfaces' background and
      colour reset
- [ ] Declare `--ui-menu-min-inline-size` (`menu.css:13`) in the registry, or rename it
      `--ui-internal-*`
- [ ] Declare `group`, `group-label`, `separator`, `submenu`, and `submenu-trigger` parts on `menu`
- [ ] Wire `group-label` with `aria-labelledby` on the `role="group"`
- [ ] Confirm every selector `menu.css` targets has a declared part
- [ ] Unit test: grouped items are found; a nested `ui-menu`'s items are not; separators are
      excluded

## 2. Checkbox and radio menu items

- [ ] Toggle `aria-checked` on activation of a `menuitemcheckbox`
- [ ] Set `aria-checked` and clear siblings for a `menuitemradio`, scoped to its owning
      `role="group"` or the menu when there is no group
- [ ] Emit a cancelable event before writing so an author can `preventDefault()` and keep owning the
      state
- [ ] Export the event's detail type, or `manifest:validate` fails
- [ ] Update the `item` part description, which currently implies the author does this
- [ ] Add the behavior to the accessibility notes
- [ ] Unit test: radio sibling clearing does not cross group boundaries
- [ ] Unit test: a cancelled event leaves `aria-checked` untouched

## 3. Submenu keys at any depth

- [ ] `ArrowRight` on an item with a submenu opens it and focuses its first enabled item
- [ ] `ArrowLeft` inside a submenu closes it and returns focus to its trigger
- [ ] Preserve the existing menubar top-level behavior
- [ ] Resolve the keys logically so they swap under `dir="rtl"`
- [ ] Add both key rows to the accessibility block at `component-registry.mjs:1058-1072`
- [ ] Record that pointer-opening submenus with an intent delay is deliberately out of scope
- [ ] E2E: two levels deep, and in `dir="rtl"`

## 4. `ui-context-menu`

- [ ] Settle the anchor question: position the surface from `--ui-context-menu-x` /
      `--ui-context-menu-y` custom properties with CSS owning `position: fixed` and the insets. Do
      **not** generate an undocumented zero-size anchor element
- [ ] Listen for `contextmenu` on the host, `preventDefault()`, record coordinates, open the menu
- [ ] Support the `ContextMenu` key and `Shift+F10`, positioned against the focused element
- [ ] Clamp to the viewport and flip near edges, in CSS
- [ ] Reuse core's dismissable-layer controller for dismissal
- [ ] Delegate items, keyboard, typeahead, and submenus to the Menu enhancement functions
- [ ] Registry `customElement(...)` entry with real descriptions
- [ ] `src/css/context-menu.css` in the `ui.components` layer
- [ ] `@import` added to `src/css/components.css`
- [ ] `src/context-menu.ts` and `src/context-menu.test.ts`
- [ ] `pnpm -F @timelessui/components run generate`
- [ ] Export block added to `src/index.ts`
- [ ] `./context-menu` subpath added to `packages/components/package.json` exports
- [ ] Tag appended to the ordered list in `src/define.test.ts`
- [ ] Example factory using `uiAttributes` / `uiAttributeString`, escaped
- [ ] Catalog entry whose `styles` include every stylesheet of every named contract plus
      `tokens.css`
- [ ] Loader added to `apps/web/src/scripts/preview-runtime.ts`
- [ ] Story titled `Library/<Domain>/<Component>` matching the catalog domain and id
- [ ] Entry added to `apps/stories/src/smoke.test.ts`
- [ ] `pnpm build:stories`, then commit the regenerated `apps/stories/story-routes.json`
- [ ] Update the hardcoded component count in `apps/web/src/content/docs/docs/index.mdx`
- [ ] Document that this pattern has no no-JavaScript fallback
- [ ] Confirm `audit-component-contracts` finds no generated visual element and no visual
      declaration written from JS

## 5. Tooltip becomes non-interactive

- [ ] Remove the click toggle under `variant="tooltip"` (`hover-card.ts:140`, `:201-213`)
- [ ] Remove the pointer-enterable surface behavior (`hover-card.ts:143-144`)
- [ ] Confirm hover and focus still open it
- [ ] Confirm Escape still closes it via core's dismissable layer (`dismissable-layer.ts:23`)
- [ ] Decide whether tooltips get their own delay defaults instead of the shared 180/100ms pair; if
      so, change the registry attribute defaults rather than adding a value set
- [ ] Run `verify-apg-conformance` against the `tooltip` pattern claimed at
      `component-registry.mjs:1019` and confirm it now passes

## 6. Dialog and Sheet accessible names

- [ ] Add declared `title` and `description` parts to the `dialog` contract
- [ ] Add the same to the `sheet` contract
- [ ] Wire `aria-labelledby` and `aria-describedby` from them using `ensureElementId`, following
      `tabs.ts:303-304`
- [ ] Make `sheet.css:73-79`'s `> header > h1|h2|h3` the `title` part's selector
- [ ] Never overwrite an author-supplied `aria-labelledby`
- [ ] Update the prose note at `component-registry.mjs:886` so the parts table also explains naming
- [ ] Convert `createDialog` and `createSheet` in `overlays.html.ts` from hand-authored `titleId` /
      `descriptionId` + `aria-labelledby` / `aria-describedby` to `data-ui-part="title"` and
      `="description"`, so the copyable source stops teaching the boilerplate
- [ ] Rebase those factory edits onto milestone 020's, which adds `commandfor` / `command` to the
      same lines
- [ ] Confirm 020's `triggerWiring` field survives in the `enhanceDialogParts` / `enhanceSheetParts`
      results after the ARIA wiring is added
- [ ] E2E: accessible name and description resolve from the parts; an authored `aria-labelledby`
      survives

## 7. Sheet swipe-to-dismiss

- [ ] Add pointer listeners in the `enhance()` body at `sheet.ts:122-131` using
      `this.on(target, type, handler, { signal })`
- [ ] Capture the `pointerId` with `setPointerCapture`
- [ ] Derive the drag axis from `resolveSheetPosition`
- [ ] Track the start coordinate, running delta, and threshold-crossed
- [ ] Detect whether the gesture began inside the scrolling `> section` (`sheet.css:88-94`) and let
      it scroll instead of dragging when that section can scroll in the drag axis
- [ ] Write `--ui-sheet-drag-offset` as a px length on the panel, following `floating.ts:108-111`
- [ ] Confirm JS writes no `translate`, `transition`, inset, or colour
- [ ] Suppress the entry animation while dragging via `setCustomState('--dragging', true)`
- [ ] Gate `sheet.css`'s `@keyframes` on `:not(:state(dragging))`
- [ ] Restore the animation on release
- [ ] Dismiss past the threshold; otherwise clear the offset and let CSS animate back
- [ ] Respect `prefers-reduced-motion` for the release animation only, not for the drag
- [ ] Declare a `drag-handle` part if one is introduced
- [ ] Declare the `dragging` state, following the internal custom-state precedent at
      `component-registry.mjs:1562-1574`
- [ ] Declare `--ui-sheet-drag-offset` as a registry variable
- [ ] Decide whether a swipe emits a cancelable event before dismissing, for consistency with the
      platform's cancelable `request-close` that milestone 020 relies on; record the choice
- [ ] Add a `swipe` member to `SheetDismissSource` (`sheet.ts:19-20`), and confirm
      `SheetEventSource` widens with it and does not collide with 020's use of `'trigger'`
- [ ] Thread it through `dismissAndClose` (`sheet.ts:248-251`)
- [ ] Update the event description at `component-registry.mjs:920-924`
- [ ] Confirm the sheet's parts, states, and variables arrays are no longer empty

## 8. Verification

- [ ] `pnpm -F @timelessui/components run test`
- [ ] `pnpm -F @timelessui/components run contracts:validate`
- [ ] `pnpm -F @timelessui/components run manifest:validate`
- [ ] E2E: right-click opens the context menu at the pointer, clamped near all four viewport edges
- [ ] E2E: `ContextMenu` key and `Shift+F10` open it from the keyboard
- [ ] E2E: swipe dismisses a sheet from each of the four positions
- [ ] E2E: a swipe starting in a scrollable section scrolls rather than dragging
- [ ] E2E: a below-threshold swipe springs back
- [ ] E2E: swipe-dismissing a sheet opened through milestone 020's **authored**
      `command="show-modal"` path returns focus to the trigger — the combination is new, since that
      path captures the return target from `CommandEvent.source` rather than a click handler
- [ ] E2E: typeahead still works with grouped menu items
- [ ] `a11y.spec.ts` over the new and changed routes
- [ ] `verify-apg-conformance` for Menu, Menubar, Tooltip, Dialog, Sheet, and the context menu
- [ ] `no-javascript.spec.ts`: sheets still open and close with no gesture
- [ ] Reduced-motion: drag tracks the pointer, release animation suppressed
- [ ] Add submenu-key and swipe cases to `platform.spec.ts` and confirm Firefox and WebKit
- [ ] `pnpm build:packages` then `pnpm -F @timelessui/components run exports:validate`
- [ ] `pnpm -F @timelessui/components run generated-dom:check`
- [ ] Re-baseline `performance-baselines.json` with `node scripts/check-performance.mjs --measure`
      and rewrite the `justification`
- [ ] `pnpm boundaries:check`
- [ ] `pnpm -F @timelessui/examples test`
- [ ] `pnpm -F @apps/web test`
- [ ] `pnpm qa`
- [ ] Name every CI-only gate that was run locally in RESULTS.md
- [ ] Record decisions, trade-offs, and results in RESULTS.md

---

Generated by Claude Opus 5 - High reasoning
