---
status: Accepted
---

# Milestone 024 Plan: Menus, Context Menus, and Overlay Gestures

## Goal

Make Menu implement the pattern it claims: submenu keys at any depth, real checkbox and radio items,
declared parts for the anatomy the CSS already styles, and item discovery that survives a group
wrapper. Add a context menu, which is the only overlay pattern with no native fallback. Give Dialog
and Sheet a way to name themselves without hand-wiring `aria-labelledby`. And add swipe-to-dismiss
to Sheet, which is the one thing that makes a drawer feel native on touch.

## Context

### What the study found

**1. Menu item discovery is direct-children-only, so any grouped markup silently loses every item.**

```ts
// menu.ts:399-403
export function findMenuItems(host: Element): HTMLElement[] {
  return Array.from(host.children).filter((child): child is HTMLElement =>
    child.matches(MENU_ITEM_SELECTOR),
  )
}
```

Wrap items in a `role="group"`, an `hr` inside a container, or a `<ul><li>` and navigation finds
nothing. This is the same defect milestone 022 fixes for options, and the fix should use the same
ownership-scoped descendant walk — `parts.ts`'s `isOwnedBy` is the existing precedent for stopping
at a nested component root.

**2. `MENU_ITEM_SELECTOR` is broader than the declared part, and has no separator guard.**

```ts
// menu.ts:37-38
const MENU_ITEM_SELECTOR =
  '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], button, a[href]'
```

The registry declares the `item` part as `[role^='menuitem']`
([component-registry.mjs:1051](packages/components/scripts/component-registry.mjs:1051)). The JS
also accepts a bare `button` or `a[href]`, so a `<button role="separator">` becomes a focusable menu
item. Narrow the JS to the declared selector, or widen the declaration — and add an explicit
`:not([role='separator'])` guard either way.

**3. Checkbox and radio menu items are decorative.** `menu.css:74-78` styles
`[aria-checked='true']`, and the registry's `item` description tells authors to use
`menuitemcheckbox` or `menuitemradio` "with `aria-checked`" — but **no JavaScript reads or writes
`aria-checked` anywhere in `menu.ts`**. So the styling exists, the roles are preserved by
`syncMenuItemSemantics` ([menu.ts:405-415](packages/components/src/menu.ts:405)), and the state is
entirely the author's problem with no event to hook. Either implement the toggle with proper
`menuitemradio` group semantics, or say plainly in the contract that the author owns `aria-checked`
and stop implying otherwise.

**4. `ArrowRight` does not open a submenu and `ArrowLeft` does not close one.** Both route
exclusively through the menubar-only `moveBetweenMenubarSubmenus` path
([menu.ts:126-138](packages/components/src/menu.ts:126)), so a vertical menu with a submenu has no
keyboard way in or out. The `submenuForItem` resolver
([menu.ts:458-469](packages/components/src/menu.ts:458)) already supports two conventions —
`aria-controls`, or the next element sibling — and `syncMenuItemSubmenuSemantics` already writes
`aria-haspopup="menu"` and `aria-expanded` ([menu.ts:428-430](packages/components/src/menu.ts:428)).
The wiring exists; the keys do not. The accessibility block
([component-registry.mjs:1058-1072](packages/components/scripts/component-registry.mjs:1058)) lists
neither key, so the contract does not currently promise what is missing — which means fixing the
code and the contract are one change.

**5. No declared part for a submenu, a submenu trigger, or a separator** — even though `menu.css:84`
styles `:where([role='separator'], hr)` and the JS resolves submenus. Every selector a component
stylesheet targets should have a registry part, or the generated Anatomy table lies by omission.

**6. `menu-button` focuses a disabled first item.** `focusFirstMenuItem`
([menu-button.ts:203-209](packages/components/src/menu-button.ts:203)) focuses `items[0]` with no
disabled filter, while `menu.ts:391` exports `isMenuItemDisabled` and uses it at `menu.ts:94`,
`:153`, and `:182`. Opening a menu whose first item is disabled lands focus on a disabled item.

**7. Menu's hover rule does not exclude disabled items.** `menu.css:65-72` has no
`:where(:not([aria-disabled='true']))` guard, unlike every option surface, so an `aria-disabled`
item still lights up on hover. Its disabled treatment is opacity-only (`menu.css:80-82`) where the
option surfaces also reset background and colour.

**8. Two consecutive `ui-menu` rule blocks share an identical selector** (`menu.css:6-8` and
`menu.css:10-16`) for no reason, and `menu.css:13` reads `--ui-menu-min-inline-size`, which no
contract declares.

**9. There is zero `contextmenu` support anywhere in `packages/components/src`.** A context menu is
net-new, and the hard part is positioning: it opens at **pointer coordinates**, so there is no
anchor element. Neither the anchor-positioning path nor `applyFloatingPosition`
([floating.ts:76-114](packages/components/src/floating.ts:76)) accepts a bare point — the latter
starts from `options.trigger.getBoundingClientRect()`.

**10. `variant="tooltip"` changes only the role and the aria relationship**
([hover-card.ts:150-170](packages/components/src/hover-card.ts:150)). A tooltip is still
click-toggleable (`hover-card.ts:140`, `:201-213`) and still pointer-interactive
(`hover-card.ts:143-144`). The APG `tooltip` pattern claimed at
[component-registry.mjs:1019](packages/components/scripts/component-registry.mjs:1019) is therefore
not met. Milestone 021 makes tooltips look right; this is the behavioral half.

Escape **does** work, contrary to a first reading: `hover-card.ts:313` sets `popover="manual"` and
`:224-229` disables outside-pointer and outside-focus dismissal, but
`createDismissableLayerController` in `packages/core/src/dismissable-layer.ts:23` opts into Escape
by default (`if (options.escapeKey !== false)`) and hover-card never passes `escapeKey`. The
registry's documented Escape key is honest.

**11. Dialog and Sheet both set dialog semantics with no accessible name.** `dialog.ts:201-213`
never writes `aria-labelledby`; the registry delegates naming to the author in a prose note
([component-registry.mjs:886](packages/components/scripts/component-registry.mjs:886)). Sheet is the
same without even the note — `sheet.ts:296-300` sets `role="dialog"` and `aria-modal`, and
`sheet.css:73-79` already styles an **undeclared** `> header > h1|h2|h3`.

**12. Sheet binds no pointer listeners at all.** Enter animation is CSS `@keyframes` on
`ui-sheet > dialog[open]` per position (`sheet.css:106-146`), gated by
`prefers-reduced-motion: no-preference`. There is no exit animation. Sheet's three registry arrays —
parts beyond trigger/panel/close, states, and variables — are all empty
([component-registry.mjs:911-918](packages/components/scripts/component-registry.mjs:911)), and
`SheetDismissSource` ([sheet.ts:19-20](packages/components/src/sheet.ts:19)) has no member for a
swipe.

### Decisions taken

1. **Menu adopts milestone 022's part vocabulary.** `group`, `group-label`, and `separator` mean the
   same thing on a menu as on a listbox. That is why 022 runs first.
2. **`findMenuItems` becomes an ownership-scoped descendant walk**, stopping at nested component
   roots, with an explicit separator exclusion.
3. **Timeless manages `aria-checked`.** A `menuitemcheckbox` toggles on activation; a
   `menuitemradio` deselects its siblings within its owning group. This is a real behavior change,
   so it needs an event and it needs the contract to say so. The alternative — documenting that the
   author owns it — leaves a styled state nothing drives, which is how it got here.
4. **Submenu keys work at any depth**, not only in a menubar, and the contract gains the key rows.
5. **Context menu is a new element, `ui-context-menu`**, wrapping the existing Menu for its anatomy
   and keyboard. Its only new problem is point-based positioning.
6. **Point positioning uses a zero-size anchor**, not a new positioning system. Place a
   `position: fixed` zero-size element at the pointer coordinates, give it an anchor name, and let
   the existing anchor-positioning CSS do the rest. This keeps one positioning mechanism instead of
   two, and the coordinates are a measured value written as custom properties — which is what
   AGENTS.md permits JS to write.
7. **Tooltip stops being interactive.** No click toggle, no pointer-enterable surface,
   `role="tooltip"`, hover and focus only.
8. **Dialog and Sheet gain declared `title` and `description` parts** that enhancement wires with
   `aria-labelledby` and `aria-describedby`, the way `tabs.ts:303-304` wires panels. Sheet's
   already-styled `> header > h1|h2|h3` becomes a declared part rather than an undocumented
   selector.
9. **Swipe-to-dismiss writes one measured custom property and nothing else visual.**

## Architecture

- Menu keeps its pure-function-plus-thin-element split. `findMenuItems`, `isMenuItemDisabled`, and
  the new group-aware discovery stay exported from `menu.ts` under their current names.
- `ui-context-menu` composes rather than reimplements: it owns the `contextmenu` listener, the
  pointer anchor, and dismissal, and delegates items, keyboard, and typeahead to the Menu
  enhancement functions.
- The pointer anchor is a private runtime element. That needs a deliberate exception, because
  AGENTS.md says core JS may generate behavior-support elements "only when the generated element is
  optional, documented, and stylable through a stable public API before it is shown". A zero-size
  invisible anchor is none of those, and should instead be an **authored** part the consumer
  includes, or the host itself positioned via custom properties. Resolve this in step 4 before
  writing code; generating an undocumented element would violate the rule this library exists to
  hold.
- Swipe state: JS tracks the captured `pointerId`, the axis derived from `resolveSheetPosition`, the
  start coordinate, the running delta, whether the movement threshold was crossed, and whether the
  gesture began inside the scrolling `> section` (`sheet.css:88-94`) so it does not steal scroll. It
  writes exactly one visual-adjacent thing: `--ui-sheet-drag-offset`, a length, following the
  `floating.ts:108-111` precedent. The stylesheet owns the resulting `translate`.
- Drag suppresses the entry animation through a host custom state via `setCustomState`
  (`core/src/ui-element.ts:159-168`), which `color-picker.ts:501` and `toast.ts:88` already use —
  not through a public attribute, because AGENTS.md forbids exposing runtime state as public
  `data-ui-*`.

## Constraints

- **Depends on milestone 022** for the part vocabulary (`group`, `group-label`, `separator`) and for
  the ownership-scoped discovery helper. Running 024 first means inventing the names twice.
- **Depends on milestone 021** for the tooltip's visual work; this milestone does the behavioral
  half. Both edit `popover.css` and `hover-card.ts`.
- **Milestone 020 edits the same two components and the same two example factories.** It is
  `Accepted` and unimplemented (1 of 57 tasks), so assume it lands first and rebase onto it. The
  overlaps:

  | Shared surface                                       | 020 does                                                                                  | 024 does                                                                                    | Compatible?                                                                                                                                |
  | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
  | `enhanceDialogParts` / `enhanceSheetParts`           | adds `triggerWiring: 'authored' \| 'listener'` to the result; adds nothing to the trigger | adds `aria-labelledby` / `aria-describedby` wiring from new `title` and `description` parts | Yes — additive to the same function. Preserve `triggerWiring`                                                                              |
  | `sheet.ts` `enhance()` body                          | registers a `command` listener beside the existing `cancel` / `close` listeners           | registers pointer listeners in the same block                                               | Yes — both additive. A real merge point, not a conflict                                                                                    |
  | `SheetDismissSource`                                 | maps `CommandEvent.source` to the existing `SheetEventSource` value `'trigger'`           | adds a `'swipe'` member to `SheetDismissSource`                                             | Yes — `'trigger'` already lives in `SheetEventSource`, `'swipe'` goes in `SheetDismissSource`, and `SheetEventSource` widens automatically |
  | `createDialog` / `createSheet` in `overlays.html.ts` | adds `commandfor` and `command` to triggers and close controls                            | converts the hand-authored naming to `data-ui-part="title"` and `="description"`            | Yes, but same lines. Rebase rather than merge blindly                                                                                      |

- **The example factories already hand-wire naming.** `createDialog` and `createSheet` emit
  `titleId` / `descriptionId`, `aria-labelledby`, `aria-describedby`, and `<h2 id>` / `<p id>`
  today. So the declared-parts work removes boilerplate from the copyable source rather than adding
  a capability the examples lacked. Update the factories, or the docs keep teaching the hand-wired
  form.
- **Swipe-dismiss must return focus on 020's authored path too.** On that path the trigger click
  handler never runs, so `#returnFocusTarget` is captured from `CommandEvent.source` in a `command`
  listener. Swipe closes through `dismissAndClose` → `closeSheet` → `panel.close()`, which should
  reuse the same return-focus logic — but the combination is new and untested, so it needs its own
  assertion.
- Managing `aria-checked` is a behavior change to a shipped component. Existing consumers who toggle
  it themselves must not end up fighting the component. Decide whether Timeless writes it only when
  the activation event is not cancelled, and make the event cancelable.
- `contracts.test.ts` asserts a non-empty description for every field and that every default belongs
  to its own value set.
- **`packages/examples/scripts/validate.mjs`** rejects examples using undeclared part tokens or
  attributes. Registry, generate, examples — in that order.
- A new element is the full 16-step add sequence: registry, stylesheet, `components.css` `@import`,
  module and test, generate, value re-exports, `src/index.ts` block, `package.json` `./context-menu`
  subpath (`check-exports.mjs` derives it as `./${tag.slice(3)}`), the tag in `define.test.ts`, the
  example factory, the catalog entry, the `preview-runtime.ts` loader, the story, the
  `smoke.test.ts` entry, the regenerated and committed `story-routes.json`, and the hardcoded
  component count in `apps/web/src/content/docs/docs/index.mdx`.
- Story titles must be `Library/<Domain>/<Component>` with the slugified domain and id matching the
  catalog; a mismatch surfaces only as `Missing internal site targets:` during `pnpm build:site`.
- `performance:check` pins the exact `modules` chunk list and compares four metrics at baseline ×
  1.1 for popover, listbox, select, and combobox. Adding a context menu that imports Menu changes
  the closure; re-baseline with `node scripts/check-performance.mjs --measure` and rewrite the
  `justification`.
- `pnpm qa` omits `exports:validate`, `generated-dom:check`, `performance:check`,
  `boundaries:check`, `pnpm -F @timelessui/examples test`, and `pnpm -F @apps/web test`. Run them
  and say so.
- Swipe must not break `no-javascript.spec.ts`: a sheet with scripting off has no gesture and must
  still open and close.
- A context menu has **no** no-JavaScript story. Say that in the docs rather than leaving it
  implied.

## Implementation sequence

### 1. Menu discovery, roles, and the CSS tidy-up

- Replace `findMenuItems`'s `host.children` filter with an ownership-scoped descendant walk that
  stops at nested component roots, modelled on `parts.ts`'s `isOwnedBy` and matching whatever 022
  built for options. Keep the exported name.
- Narrow `MENU_ITEM_SELECTOR` to the declared `[role^='menuitem']`, or widen the registry's `item`
  selector to match the JS. Pick one; they must agree. Add `:not([role='separator'])` regardless.
- Fix `focusFirstMenuItem` ([menu-button.ts:203-209](packages/components/src/menu-button.ts:203)) to
  skip disabled items using the already-exported `isMenuItemDisabled`.
- `menu.css`: merge the two identical-selector blocks at `:6-8` and `:10-16`; add a
  `:where(:not([aria-disabled='true']))` guard to the hover rule at `:65-72`; align the disabled
  treatment at `:80-82` with the option surfaces' background and colour reset; declare
  `--ui-menu-min-inline-size` in the registry or rename it `--ui-internal-*`.
- Add declared parts: `group`, `group-label`, `separator`, `submenu`, and `submenu-trigger`. Wire
  `group-label` with `aria-labelledby` on the `role="group"`.

### 2. Checkbox and radio menu items

- On activation of a `menuitemcheckbox`, toggle `aria-checked`. On a `menuitemradio`, set it and
  clear its siblings within the owning `role="group"`, or within the menu when there is no group.
- Emit a cancelable event before writing, so an author who owns the state can `preventDefault()` and
  keep doing so. Declare the event and export its detail type or `manifest:validate` fails.
- Update the `item` part description, which currently implies the author does this, and add the
  behavior to the accessibility notes.

### 3. Submenu keys at any depth

- `ArrowRight` on an item with a submenu opens it and focuses its first enabled item; `ArrowLeft`
  inside a submenu closes it and returns focus to its trigger. Keep the existing menubar behavior
  for a menubar's top level.
- Both directions must respect `dir="rtl"` — the keys swap. Use logical resolution, not hardcoded
  `ArrowRight`.
- Add the two key rows to the accessibility block at `component-registry.mjs:1058-1072`, which lists
  neither today.
- Pointer-opening submenus with an intent delay is **out of scope**. Record the decision; keyboard
  parity is the gap, hover is a preference.

### 4. `ui-context-menu`

Settle the anchor question first, because it decides the whole design.

- **Do not generate an undocumented zero-size anchor element.** AGENTS.md permits generated
  behavior-support elements only when they are optional, documented, and stylable through a stable
  public API. Two compliant options:
  1. Position the **surface** directly from custom properties JS writes — `--ui-context-menu-x` /
     `--ui-context-menu-y` — with CSS owning `position: fixed` and the insets. This needs no anchor
     element and no new element generation, and it matches the `floating.ts:108-111` precedent
     exactly. **Prefer this.**
  2. Require an authored anchor part the consumer includes. More markup for no benefit.
- Listen for `contextmenu` on the host, `preventDefault()`, record the coordinates, and open the
  menu.
- Keyboard: the `ContextMenu` key and `Shift+F10` must open it, positioned against the focused
  element rather than a pointer — so both a point and an element path are needed. Do not ship a
  context menu that only a mouse can open.
- Clamp to the viewport, and flip when near an edge, in CSS.
- Dismissal reuses the existing dismissable-layer controller from core.
- Delegate items, keyboard, typeahead, and submenus to the Menu enhancement functions.
  `ui-context-menu` owns opening, positioning, and dismissal only.
- Complete the full add sequence, and state in the docs that this pattern has no no-JavaScript
  fallback.

### 5. Tooltip becomes non-interactive

- Under `variant="tooltip"`: remove the click toggle (`hover-card.ts:140`, `:201-213`) and the
  pointer-enterable surface behavior (`hover-card.ts:143-144`). Hover and focus only, with the
  existing delays.
- Decide whether tooltips get their own delay defaults. Today they share one 180/100ms pair with
  hover cards. If they diverge, that is different attribute defaults in the registry, not a new
  value set.
- Keep Escape working — it already does, via core's dismissable layer.
- Re-run `verify-apg-conformance` against the `tooltip` pattern the registry claims at
  `component-registry.mjs:1019`. That claim is currently false, and this step is what makes it true.

### 6. Dialog and Sheet accessible names

- Add declared `title` and `description` parts to both contracts. Enhancement wires
  `aria-labelledby` and `aria-describedby` from them using `ensureElementId`, following
  `tabs.ts:303-304`.
- Sheet's already-styled `> header > h1|h2|h3` (`sheet.css:73-79`) becomes the `title` part's
  selector rather than an undeclared one.
- Author-supplied `aria-labelledby` always wins. Never overwrite one.
- Update the prose note at `component-registry.mjs:886` so the parts table, not only the
  accessibility note, tells an author how to name a dialog.

### 7. Sheet swipe-to-dismiss

- Insert into the `enhance()` body at [sheet.ts:122-131](packages/components/src/sheet.ts:122),
  using the existing `this.on(target, type, handler, { signal })` pattern.
- Track: captured `pointerId` via `setPointerCapture`, the axis from `resolveSheetPosition`, the
  start coordinate, the running delta, threshold-crossed, and whether the gesture began inside the
  scrolling `> section` — if it did and that section can scroll in the drag axis, let it scroll and
  do not drag.
- Write `--ui-sheet-drag-offset` as a px length on the panel. Nothing else. No `translate`, no
  `transition`, no inset from JS.
- Suppress the entry animation while dragging via `setCustomState('--dragging', true)`, and let
  `sheet.css` gate its `@keyframes` on `:not(:state(dragging))`. Restore on release.
- On release: past the threshold, dismiss; otherwise clear the offset and let CSS animate back.
- **Decide whether a swipe is cancelable.** Milestone 020 leans on the platform's `request-close`,
  which is cancelable, so a swipe that hard-closes would be the one dismissal path an author cannot
  intercept. Emitting a cancelable event before dismissing keeps the paths consistent; not emitting
  one is simpler and inconsistent. Record the choice.
- Respect `prefers-reduced-motion` for the **release** animation. Do not disable the drag itself —
  direct manipulation is not decorative motion.
- Registry additions to three currently-empty arrays: a `drag-handle` part if one is introduced, the
  `dragging` state (following the internal custom-state precedent at
  `component-registry.mjs:1562-1574`), and `--ui-sheet-drag-offset`.
- Add a `swipe` member to `SheetDismissSource`
  ([sheet.ts:19-20](packages/components/src/sheet.ts:19)), thread it through `dismissAndClose`
  (`sheet.ts:248-251`), and update the event description at `component-registry.mjs:920-924`.

### 8. Milestone records

`RESULTS.md` records: the `MENU_ITEM_SELECTOR` reconciliation and which side moved; how
`aria-checked` management coexists with authors who already do it; the context-menu positioning
decision and why no element was generated; whether tooltip delays diverged; the swipe threshold and
how scroll conflict was resolved; and the re-baselined performance numbers.

## Verification

1. **Unit** — group-aware `findMenuItems` against nested groups and a nested `ui-menu`; separator
   exclusion; `menuitemradio` sibling clearing scoped to its group; `focusFirstMenuItem` skipping a
   disabled first item; the swipe axis and threshold maths as a pure function.
2. **E2E keyboard** — `ArrowRight`/`ArrowLeft` opening and closing submenus at two levels deep and
   in `dir="rtl"`; `ContextMenu` key and `Shift+F10` opening the context menu from the keyboard;
   `menuitemcheckbox` toggling and `menuitemradio` switching; typeahead still working with grouped
   items.
3. **E2E pointer** — right-click opening the context menu at the pointer, clamped near all four
   viewport edges; swipe dismissing a sheet from each of the four positions; a swipe that starts
   inside a scrollable section scrolling rather than dragging; a below-threshold swipe springing
   back.
4. **Accessibility** — `a11y.spec.ts` over the new and changed routes; `verify-apg-conformance` for
   Menu (menu and menubar), Tooltip, Dialog, Sheet, and the context menu. Tooltip's is the one that
   is currently failing its declared pattern, so it is the decisive check.
5. **Names** — assert a Dialog and a Sheet with authored `title` and `description` parts expose the
   right accessible name and description, and that an author-supplied `aria-labelledby` is not
   overwritten.
6. **No-JavaScript** — sheets still open and close with scripting off and no gesture. Assert the
   context menu is documented as having no fallback rather than silently broken.
7. **Reduced motion** — a sheet drag still tracks the pointer; the release animation is suppressed.
8. **Cross-browser** — add a submenu-key case and a swipe case to `platform.spec.ts`, the only spec
   `stories-firefox` and `stories-webkit` run. Pointer capture and `contextmenu` behavior differ
   most across engines, so this is not optional here.
9. **Contracts and manifest** — `contracts:validate`, `manifest:validate`, and `pnpm test` for the
   description and default assertions.
10. **CI-only gates, run locally and named in `RESULTS.md`** — `exports:validate` (after
    `build:packages`), `generated-dom:check`, `performance:check`, `boundaries:check`,
    `pnpm -F @timelessui/examples test`, `pnpm -F @apps/web test`.
11. **Full gate** — `pnpm qa`.

```bash
pnpm qa
```

## Acceptance

- `findMenuItems` finds items nested inside a `role="group"`, stops at nested component roots, and
  never returns a separator. `MENU_ITEM_SELECTOR` and the registry's `item` selector agree.
- Menu declares `group`, `group-label`, `separator`, `submenu`, and `submenu-trigger` parts, and
  every selector `menu.css` targets has a declared part.
- A `menuitemcheckbox` toggles `aria-checked` on activation; a `menuitemradio` clears its siblings
  within its owning group; both emit a cancelable event an author can `preventDefault()` to keep
  owning the state; and the contract describes what Timeless does rather than what the author must
  do.
- `ArrowRight` opens and `ArrowLeft` closes a submenu at any depth, the keys swap under `dir="rtl"`,
  and both appear in the menu accessibility key list.
- `menu-button` never lands focus on a disabled first item.
- `menu.css` has one `ui-menu` block per selector, its hover rule excludes disabled items, its
  disabled treatment matches the option surfaces, and `--ui-menu-min-inline-size` is either declared
  or renamed internal.
- `ui-context-menu` opens on right-click at the pointer and from the keyboard via the `ContextMenu`
  key and `Shift+F10`, clamps and flips near viewport edges, dismisses through core's dismissable
  layer, and delegates items and keyboard to Menu. **No undocumented element is generated**, and
  positioning uses custom properties CSS consumes.
- The documentation states that a context menu has no no-JavaScript fallback.
- A `variant="tooltip"` hover card is not click-toggleable and not pointer-interactive, and
  `verify-apg-conformance` passes it against the `tooltip` pattern the registry claims.
- Dialog and Sheet declare `title` and `description` parts, enhancement wires `aria-labelledby` and
  `aria-describedby` from them, an author-supplied `aria-labelledby` is never overwritten, and
  Sheet's header selector is a declared part rather than an undocumented one.
- A sheet can be dismissed by swiping from each of its four positions; a swipe starting in a
  scrollable region scrolls instead; a below-threshold swipe springs back; the drag tracks the
  pointer under `prefers-reduced-motion` while the release animation does not.
- JS writes only `--ui-sheet-drag-offset` and a `dragging` custom state. No `translate`,
  `transition`, or inset is written from JavaScript, and `audit-component-contracts` is clean.
- `SheetDismissSource` includes a swipe member, `ui-dismiss` reports it, and the registry event
  description says so.
- Sheet's parts, states, and variables arrays are no longer empty.
- `performance-baselines.json` is re-baselined with a rewritten `justification`, and the numbers are
  in `RESULTS.md`.
- Every CI-only gate was run locally and is named in `RESULTS.md`.
- `pnpm qa` is green.

---

Generated by Claude Opus 5 - High reasoning
