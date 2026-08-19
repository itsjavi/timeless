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

## Platform behavior confirmed before planning

Pending implementation. Four things must be measured rather than assumed:

- **Pointer capture behavior across engines** for the sheet gesture. `setPointerCapture` plus
  `pointercancel` handling differs enough between Chrome, Firefox, and WebKit that the swipe needs a
  `platform.spec.ts` case, not just a Chromium one.
- **Whether `contextmenu` is preventable and what the platform does after** on each engine,
  including long-press on touch, which some engines map to `contextmenu` and some do not.
- **Whether the `ContextMenu` key and `Shift+F10` both reach the page** or are consumed by the
  browser or OS.
- **Whether `:state()` participates in `@keyframes` gating** the way the plan's drag-suppression
  assumes. Verify `sheet.css`'s animation really is suppressed under `:not(:state(dragging))` before
  relying on it; if not, a private `data-ui-internal-*` attribute on the panel is the fallback.

## Open decisions

**Does Timeless manage `aria-checked`, or document that the author owns it?** The plan says manage
it, with a cancelable event as the escape hatch.

- **For managing:** `menu.css:74-78` already styles the state, so today the library ships a visual
  treatment for something nothing drives. That is the worst of both.
- **Against:** it is a behavior change to a shipped component, and any consumer already toggling
  `aria-checked` themselves now has two writers. The cancelable event is what makes this safe, so
  the event is not optional polish — it is the compatibility mechanism.

**Which side moves on `MENU_ITEM_SELECTOR`?** Narrowing the JS to `[role^='menuitem']` makes the
contract literal but breaks any consumer relying on a bare `<button>` inside a menu working.
Widening the declared selector documents current behavior but blesses a menu item without a menu
role, which is worse for assistive technology. Narrowing is probably right; either way the two must
agree, and the choice needs recording because it is potentially breaking.

**Context-menu positioning.** The plan positions the surface from custom properties rather than
generating a zero-size anchor element. The anchor approach is more elegant — it reuses the anchor
positioning already in the stylesheets — but an invisible generated element is exactly what
AGENTS.md prohibits: "Core JS may generate behavior-support elements only when the generated element
is optional, documented, and stylable through a stable public API before it is shown." A zero-size
invisible anchor is none of those three. Choosing custom properties keeps the rule intact at the
cost of a second positioning path for one component. Record it, because a future reader will want to
know why the context menu does not use anchor positioning like everything else.

**Do tooltips get their own delays?** They currently share one 180/100ms pair with hover cards. A
tooltip conventionally appears faster and leaves faster. If they diverge, it is different attribute
defaults in the registry — not a new value set, and not a new attribute.

**Swipe threshold and velocity.** A pure-distance threshold is simple and predictable; adding
velocity makes a fast flick dismiss from a short distance, which feels better and is harder to test.
Start with distance, record the number, and only add velocity if the distance-only version feels
wrong on a real touch device.

Pending implementation.

## Decisions and constraints

Pending implementation.

## Summary

Pending implementation.

## Validation results

Pending implementation.

---

Generated by Claude Opus 5 - High reasoning
