# Milestone 024 Results

## Baseline

Measured on `main` at commit `97761b1`.

| Measure                                                | Value                                                                                                                             |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `menu.ts`                                              | 536 lines                                                                                                                         |
| `findMenuItems` scope                                  | `host.children` only (`menu.ts:399-403`)                                                                                          |
| `MENU_ITEM_SELECTOR`                                   | includes bare `button, a[href]` (`menu.ts:37-38`), broader than the declared `[role^='menuitem']` (`component-registry.mjs:1051`) |
| Declared `menu` parts                                  | 2 — `menu`, `item`                                                                                                                |
| `aria-checked` writes in `menu.ts`                     | **zero**, while `menu.css:74-78` styles it                                                                                        |
| Submenu keys in a non-menubar menu                     | **none**; both route through the menubar-only path (`menu.ts:126-138`)                                                            |
| `menu` accessibility key rows mentioning submenus      | **zero** (`component-registry.mjs:1058-1072`)                                                                                     |
| `contextmenu` occurrences in `packages/components/src` | **zero**                                                                                                                          |
| Pointer listeners in `sheet.ts`                        | **zero**                                                                                                                          |
| `sheet` declared parts / states / variables            | trigger, panel, close / **0** / **0** (`component-registry.mjs:911-918`)                                                          |
| `SheetDismissSource` members                           | no swipe member (`sheet.ts:19-20`)                                                                                                |
| Sheet exit animation                                   | none; entry only, via `@keyframes` per position (`sheet.css:106-146`)                                                             |
| `aria-labelledby` writes in `dialog.ts`                | **zero**; naming delegated by a prose note (`component-registry.mjs:886`)                                                         |
| Undeclared selectors in `sheet.css`                    | `> header > h1                                                                                                                    | h2  | h3` (`:73-79`) |

### Corrected while measuring

An early reading concluded that neither hover-card variant closes on Escape, because
`hover-card.ts:313` sets `popover="manual"` and `:224-229` disables outside-pointer and
outside-focus dismissal, and `hover-card.ts` has no keydown handler. **That is wrong.**
`createDismissableLayerController` in `packages/core/src/dismissable-layer.ts:23` opts into Escape
by default — `if (options.escapeKey !== false)` — and hover-card never passes `escapeKey`, so the
document-level keydown listener at `:24-32` is installed. The Escape key documented at
`component-registry.mjs:1021` is honest, and this milestone must not "fix" it.

## Platform behavior confirmed while implementing

The four things the plan said to measure rather than assume, all measured in Chromium, Firefox, and
WebKit through `platform.spec.ts` unless noted:

- **Pointer capture is fine across engines.** `setPointerCapture` on the panel plus `pointercancel`
  handling behaves the same in all three, so the swipe needed no per-engine branch. The
  `platform.spec.ts` case is kept anyway, because that is the claim it is there to hold.
- **`contextmenu` is preventable everywhere**, and `preventDefault()` does suppress the native menu.
  Two surprises, both handled: headless Chromium does **not** raise `contextmenu` for a
  Playwright-synthesised right button, so the pointer cases dispatch a real `MouseEvent`; and
  several engines fire `contextmenu` for the Context Menu **key** with the origin as its
  coordinates, which is why `contextMenuPointFromEvent` treats `0,0` as "no position" and falls back
  to the focused element.
- **`Shift+F10` and the `ContextMenu` key both reach the page** in all three engines. Both are
  implemented; neither alone would have been enough to call the pattern keyboard-operable.
- **`:state()` does gate an animation**, but the plan's `:not(:state(--dragging))` form is the wrong
  way round. `:not()` is not a forgiving selector list, so in a browser without `:state()` the whole
  rule — and with it the entry animation — would be dropped. Written as an `animation: none`
  override under `ui-sheet:state(--dragging)` instead, which degrades to "the animation is not
  suppressed during a drag" rather than to no animation at all.

## Decisions

### `MENU_ITEM_SELECTOR`: the JavaScript moved

Narrowed to `[role^='menuitem']`, the selector the registry already declared. A bare `<button>` or
`<a href>` inside a `ui-menu` is no longer a menu item.

This is potentially breaking, and it is the right direction: the alternative was to widen the
declaration and bless a menu item with no menu-item role, which is worse for assistive technology
than the churn is for authors. Nothing in the repository relied on it — every example and story
already authored the role — and `syncMenuItemSemantics` still normalises an odd `role="menuitemx"`
to `menuitem`. The narrowing also removed the need for the separator guard the plan asked for: one
`role` attribute cannot be both `menuitem` and `separator`.

### Disabled items stay arrow-reachable; only the resting tab stop moved

The plan reads defect #6 as "focus lands on a disabled item". Two different things were tangled in
that. Arrow keys travelling **through** disabled items is deliberate, is what the APG recommends,
and is asserted by a test that predates this milestone — a command you cannot use is easier to
understand than one that is not there. Focus **arriving** on one when the menu opens is just broken.

So `initialMenuActiveIndex` and `focusFirstMenuItem` now resolve the first _enabled_ item, and
`focusSubmenuItem` the first or last enabled one, while `menuNavigationTarget` is untouched. The
registry's accessibility note said "disabled items are skipped", which was never true; it now
describes the split. One existing unit assertion changed with it, because it was pinning the defect.

### Timeless manages `aria-checked`, with `ui-before-change` as the escape hatch

A `menuitemcheckbox` toggles on activation; a `menuitemradio` sets itself and clears the other
radios in its owning group — its `group` part or `role="group"` wrapper, or the whole menu when it
has neither. Two radio sets in one menu therefore do not clear each other, which is what makes the
grouping load-bearing rather than decorative.

The compatibility mechanism is not optional polish. A consumer already writing `aria-checked` from
its own state now has two writers, and cancelling the `ui-before-change` proposal is how it keeps
being the only one. Re-activating an already-checked radio dispatches nothing, because in the APG
pattern it is not a change.

### Submenu keys are resolved logically, and so is menubar traversal

`menuInlineDirection` maps the inline arrows onto `forward` / `backward` through the computed
writing direction, so `dir="rtl"` swaps them. The same resolution is applied to horizontal menubar
traversal via `mirrorInlineKey`, because a menubar laid out right-to-left has to advance on Arrow
Left as well — fixing half of it would have been the more confusing outcome.

Order matters and is not arbitrary: outward first (open a submenu at any depth), then the menubar
walk (Arrow Left from a first-level submenu moves along the bar, which is the APG behavior), then
inward (close a submenu and return to its trigger). Escape keeps its own path, which closes
whichever popover holds the menu — including a Menu Button's — while the inward arrow only ever
closes a real submenu, one whose invoker is itself a menu item. Without that distinction Arrow Left
would collapse a Menu Button menu.

Pointer-opening submenus with an intent delay stays out of scope. Keyboard parity was the gap; hover
is a preference.

### Context Menu positions from custom properties, and clamps rather than flips

No anchor element is generated. `check-generated-dom.mjs` reserves element creation for Toast, and a
zero-size invisible shim is not "optional, documented, and stylable through a stable public API" by
any reading. JavaScript writes `--ui-context-menu-x` and `--ui-context-menu-y` as measured values —
the `floating.ts` precedent exactly — and `context-menu.css` owns everything else.

The plan asked for a flip near the edges; it clamps instead. Percentages in `translate` resolve
against the element's own size, which is the only way CSS can reason about how large the surface
turned out to be, so `min(0px, 100dvw - inset - x - 100%)` pulls it back inside by exactly its
overflow and by nothing when it fits. A hard flip needs a step function, and `if()` is not Baseline.
Near the bottom edge the surface ends up bottom-aligned to the viewport rather than above the
pointer, which keeps it adjacent to the click — and a menu taller than the space would have needed
clamping after a flip anyway. Verified at all four corners.

### Dismissal comes from the Popover API, not from core's dismissable layer

The plan said to reuse `createDismissableLayerController`. The surface is `popover="auto"`, so
Escape, light dismiss, and top-layer stacking are already the platform's, and a controller would
reimplement them. Escape also returns focus to the target for free, because Menu's own Escape path
resolves the invoker through `aria-controls` — which Context Menu writes.

### Tooltip loses the click toggle and keeps hoverability

The plan's step 5 says to remove both the click toggle and the pointer-enterable surface. Only the
first is right. WCAG 2.2 SC 1.4.13 "Hoverable" requires content triggered by pointer hover to
survive the pointer being moved onto it, and `close-delay` plus the surface's `pointerenter`
listener is exactly that mechanism. Removing it would have traded an APG problem for a WCAG AA
failure that axe cannot see — `a11y.spec.ts` was green with the regression in place.

What was actually wrong is the click toggle: it makes the tooltip a disclosure and takes a
button-shaped trigger's activation away from it. That is gone under `variant="tooltip"`; hover,
focus, Escape, and hoverability all stay.

Delays stay shared at 180/100ms. The two variants are one element and the attributes are documented
once on Hover Card, so a variant-dependent default would make the documented default false for half
the instances. An author who wants a snappier tooltip sets `open-delay`.

### Dialog and Sheet declare the naming parts, and the examples keep authoring the ARIA

The parts landed as planned: `title` and `description`, wired with `aria-labelledby` and
`aria-describedby` through `nameSurfaceFromParts`, never overwriting an authored relationship. The
selector accepts a heading or paragraph in the panel `<header>` without a token, because that is the
shape both stylesheets already drew.

The plan's other half — stripping the hand-written ids and ARIA out of `createDialog` and
`createSheet` — was **not** taken. `no-javascript.spec.ts` caught why within one run: a modal dialog
opened by `command="show-modal"` before any bundle loads has no accessible name if naming depends on
enhancement, and that pre-script path is the thing this library advertises about Dialog. The
factories now carry both, so the tokens teach the anatomy and the ARIA keeps the panel correct at
the moment it matters. The declared parts still earn their place: they name a panel whose author
wired nothing, which is the common case and was previously silently broken.

### A swipe is a backdrop click by another name

Not cancelable. The plan worried that a swipe would be the one dismissal an author cannot intercept,
but a backdrop click already is — `ui-dismiss` has never been cancelable, and only Escape and
`command="request-close"` route through the platform's cancel algorithm. A swipe is a pointer
gesture on the overlay, so it behaves like the pointer gesture it most resembles, and reports
`swipe` so a consumer can tell them apart.

**Thresholds: 40% of the panel's extent along the drag axis, with a 48px floor.** Distance only, no
velocity. A flick dismissing from a short drag feels better and is far harder to assert; distance is
predictable and is the half that has to be right first. The proportion means a narrow sheet and a
tall one ask for the same share of effort; the floor stops a small panel closing on a stray few
pixels.

**Scroll conflict resolves in the scroller's favour.** The gesture walks from the press target up to
the panel, and yields to the first ancestor that both overflows along the drag axis and has
`overflow: auto | scroll | overlay` on that axis. A sheet that stole its own body's scroll would be
unusable on touch.

**A mouse only starts a drag from the `drag-handle` part.** A mouse-down anywhere else in the panel
is far more likely to be a text selection, so the affordance is the origin; touch and pen can start
anywhere the scroll guard allows. That also made the gesture testable, since Playwright cannot
synthesise a touch drag.

**Direction comes from the panel's measured rect, not from `position`.** A sheet is flush against
one viewport edge and closes by moving toward it, so `sheetDismissDirection` compares the two gaps.
That is what makes the gesture correct under `dir="rtl"`, where `position="right"` puts the panel
against the physical left edge — no direction lookup required.

JavaScript writes one length, `--ui-sheet-drag-offset`, and one custom state, `--dragging`. No
`translate`, no `transition`, no inset, no colour: `sheet.css` decides which axis a length moves,
per position.

## Constraints found during the work

- **`validate-contracts.mjs`'s value scanner has a lookbehind.** Its selector pattern is
  `(?<![-a-z])\[([a-z][a-z-]*)…`, so `ui-sheet[position='left']` is never collected while
  `:where([position='top'], [position='bottom'])` is. Writing the drag-handle rules with `:where()`
  made two of the four positions "selected" and the other two "documented but never selected", which
  failed the build. The rules are a plain comma list instead. Worth knowing before the next
  stylesheet reaches for `:where()` around a valued attribute.
- **A drag inside a modal sheet used to dismiss it.** The browser fires `click` on the nearest
  common ancestor of the press and the release, which for a drag from the header into the body — or
  a swipe that ends past the panel edge — is the `<dialog>`, and that is what the backdrop check
  matched. A backdrop dismissal now requires the press to have landed on the panel element too.
  Pre-existing; the gesture is what made it reachable.
- **The sheet panel clipped its own footer.** `> section { block-size: 100% }` made the content
  taller than the panel, so Cancel and Done were unreachable behind `overflow: hidden`. Visible in
  the "before" screenshot, and it blocked an acceptance test outright once the drag handle added
  anything above the body. The panel is a flex column now: header and footer keep their height, the
  body takes what is left. Out of the plan's scope, in the same stylesheet, and six lines.
- **Playwright cannot click inside the sheet with scripting disabled.** With script execution off
  the panel's entry animation never settles for the rAF-based stability probe, so every click times
  out — confirmed on `main` as well as on this branch, and true before the animation existed too.
  The no-JavaScript case closes the sheet with Escape instead, which is the same claim about the
  same markup through the platform's own path.
- **Story drags must wait for the entry animation.** Grabbing a handle that is still sliding lands
  the press where the handle was. `settleAnimations` before every gesture; no timing hacks.

## Summary of changes

**Menu** — `findMenuItems` is an ownership-scoped descendant walk over `[role^='menuitem']`, so
grouped items are found and a nested `ui-menu`'s are not; `findMenuGroups` is new alongside it.
`aria-checked` is managed for both checkable roles, scoped per group, behind `ui-before-change` /
`ui-change` and `MenuCheckedDetail`. The inline arrows open and close submenus at any depth and swap
under `dir="rtl"`. Five new parts — `group`, `group-label`, `separator`, `submenu`,
`submenu-trigger` — and two new key rows. `menu.css` merged its duplicate root block, stopped
lighting up disabled items on hover, aligned their disabled treatment with the option surfaces, and
gained group and group-label rules.

**Context Menu** — a new `ui-context-menu` element: `target` and `menu` parts, opening on
`contextmenu`, `Shift+F10`, and the Context Menu key, positioned from two measured custom properties
and clamped in CSS, dismissed by the Popover API, with items and keyboard delegated wholesale to
Menu. Full add sequence: registry, stylesheet, `components.css`, module and test, generation,
`src/index.ts`, the `./context-menu` subpath, `define.test.ts`, example factory, catalog entry,
preview loader, story, smoke test, `story-routes.json`, and the component count in the docs index.

**Tooltip** — no click toggle under `variant="tooltip"`; hover, focus, Escape, and WCAG 1.4.13
hoverability unchanged.

**Dialog and Sheet** — `title` and `description` parts on both, wired by the new
`overlay-naming.ts`, with an authored relationship always winning.

**Sheet** — swipe-to-dismiss from all four positions, with a `drag-handle` part, a `--dragging`
custom state, a `--ui-sheet-drag-offset` variable, a `swipe` member on `SheetDismissSource`, and a
flex-column panel that no longer clips its footer.

## Validation

Every gate below was run locally on this branch.

| Gate                                                 | Result                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| `pnpm qa`                                            | green (exit 0)                                                   |
| `pnpm -F @timelessui/components test`                | 39 files, 251 tests                                              |
| `pnpm -F @timelessui/components contracts:validate`  | 58 contracts, 22 elements, 199 values, 58 tokens                 |
| `pnpm -F @timelessui/components manifest:validate`   | 22 elements                                                      |
| `pnpm -F @timelessui/examples test`                  | 51 canonical examples                                            |
| `pnpm -F @apps/stories test`                         | 10 tests                                                         |
| `pnpm test:e2e`                                      | 393 passed, across `stories-chromium`, `-firefox`, and `-webkit` |
| `pnpm contracts:check`                               | green — boundaries, exports, generated-dom, performance          |
| `pnpm -F @timelessui/components exports:validate`    | green (after `pnpm build:packages`)                              |
| `pnpm -F @timelessui/components generated-dom:check` | green — no component creates elements                            |
| `pnpm boundaries:check`                              | green                                                            |
| `pnpm -F @apps/web run test:dist`                    | green, inside `pnpm qa`                                          |
| `audit-component-contracts` over the diff            | clean on all eight checks                                        |
| `verify-apg-conformance`                             | one finding, the tooltip's hoverability — fixed, see Decisions   |

### Performance

`performance:check` is green with **no re-baselining**, contrary to the plan's expectation. Every
figure is byte-identical to the committed baseline:

| Entry    | rawBytes | gzipBytes | cssRawBytes | cssGzipBytes |
| -------- | -------- | --------- | ----------- | ------------ |
| popover  | 18340    | 5644      | 7622        | 2640         |
| listbox  | 55052    | 15380     | 13329       | 3871         |
| select   | 113729   | 30023     | 15075       | 4710         |
| combobox | 106755   | 28522     | 15344       | 4790         |

The four pinned entrypoints import none of Menu, Menu Button, Sheet, Dialog, or Context Menu, and
`parts.ts` was deliberately left untouched — the overlay naming helper is its own module rather than
an addition to it, which is why the `parts-DTbd10X0.js` chunk hash did not move.

### Known gaps, recorded rather than fixed

- **Tab does not close a menu.** The Popover API closes an `auto` popover on outside pointerdown and
  Escape, not on focus leaving it, so tabbing out of a Menu Button menu leaves it open. The registry
  claims no Tab key, so nothing documented is false; it is still a gap against the APG's menu-button
  pattern and belongs to whichever milestone takes menu dismissal on.
- **Pointer-opened submenus.** Out of scope by decision, recorded above.

---

Generated by Claude Opus 5 - High reasoning

Implemented by Claude Opus 5 - High reasoning
