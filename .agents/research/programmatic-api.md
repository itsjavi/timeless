---
model: Claude Opus 5
date: 2026-08-21
---

# The programmatic surface — events, imperative API, and animated presence

Research into whether Timeless is usable from JavaScript by a consumer who is not authoring markup:
what a component reports, what it can be told to do, and whether a surface can be animated in and
out. Written because three questions kept arriving together — "do we need more events", "do we need
close-on-overlay-click", "do we need `data-` state attributes for animation" — and they have one
answer between them.

Repository facts were read from the working tree at `70ff6ce` (clean). The per-element numbers come
from the generated `packages/components/custom-elements.json`, which is the manifest a consumer's
editor and framework typings are built from, so it is the surface as _published_ rather than as
implemented.

Sources:

- `packages/components/custom-elements.json` — 24 custom elements, their attributes, members,
  events.
- `packages/components/scripts/component-registry.mjs` — the declaration all of the above is
  generated from.
- `packages/components/src/*.ts` — what the elements actually implement.
- `packages/components/src/css/core/`, `css/themes/atmosphere/` — what the two CSS tiers declare.
- `apps/web/src/content/docs/docs/reference/browser-support.mdx` — the published support claims.

## The headline

The declarative surface is excellent and the programmatic surface is unfinished in three specific
ways. None of them is "we need a JS API"; all three are **consistency** failures against patterns
the library has already established elsewhere in itself.

1. **Five elements report nothing.** `ui-dialog`, `ui-popover`, `ui-hover-card`, `ui-toolbar`, and
   `ui-toaster` declare zero events. For the first three that means a consumer cannot know a surface
   opened or closed — while `ui-sheet`, `ui-select`, `ui-combobox`, `ui-menu-button`, and
   `ui-context-menu`, which do the same job, all report it. Four different detail shapes across
   those five.
2. **Methods are not part of the contract at all.** The registry has no `method()` helper, so the
   manifest declares **zero methods across all 24 elements**. `toast()`, `openAt()`,
   `toast.dismiss()`, and `reset()` all exist and all work; none is documented, and
   `ui-context-menu` — the one element whose whole purpose is being opened from script — is typed as
   bare `HTMLElement`.
3. **Animated presence does not exist, and the docs say it does.** `@starting-style` appears exactly
   once in the entire repository: in the browser-support table, describing a behavior no stylesheet
   implements. `transition-behavior: allow-discrete` appears once, in Collapsible. Toast's exit is
   `display: none` written from **core**, which a consumer replacing the theme cannot animate
   around.

The animation question specifically has a smaller answer than it looks: `data-state="open|closed"`
is **not** what Timeless is missing, because the platform already publishes that state
(`:popover-open`, `[open]`, `:state()`). What is missing is a theme that uses it, and one core rule
that has to move. That is a stylesheet milestone, not an API one.

---

## Evidence: what a surface reports today

Every element that opens something, and the four questions a consumer asks of it:

| Element           | Open state readable from JS    | Openable from JS                    | `ui-open` / `ui-close` | Close reason                              |
| ----------------- | ------------------------------ | ----------------------------------- | ---------------------- | ----------------------------------------- |
| `ui-sheet`        | `open` (reflected)             | ✅ `open = true`                    | ✅ + `ui-dismiss`      | ✅ `close` `escape` `outside` `swipe`     |
| `ui-select`       | `open` (reflected)             | ✅ `open = true`                    | ✅                     | ❌ `{ open, originalEvent }`              |
| `ui-menu-button`  | `open` (reflected)             | ✅ `open = true`                    | ✅                     | ⚠️ `{ open, source: 'api' \| 'trigger' }` |
| `ui-context-menu` | ❌                             | ⚠️ `openAt()`, undeclared           | ✅                     | ⚠️ `{ open, source }`, open source only   |
| `ui-combobox`     | ❌ (`#open` is private)        | ❌                                  | ✅                     | ❌ `{ open, originalEvent }`              |
| `ui-dialog`       | ❌ (`.dialog.open`, untyped)   | ❌ (`.dialog.showModal()`, untyped) | ❌                     | ❌                                        |
| `ui-popover`      | ❌ (`.content`, untyped)       | ❌                                  | ❌                     | ❌                                        |
| `ui-hover-card`   | ❌                             | ❌                                  | ❌                     | ❌                                        |
| `ui-toast`        | `:state(--closed)` in CSS only | ✅ `toast()`, undeclared            | ⚠️ `ui-dismiss` only   | ✅ `programmatic` `timeout` `user`        |

Three observations fall straight out of that table.

**The `open` property already exists and already works.** `@boolAttr accessor open` plus a
`@watch('open')` that calls the internal open/close path is implemented three times — Sheet, Select,
Menu Button — identically. Extending it to Dialog, Popover, Hover Card, Combobox, and Context Menu
adds no new concept, no new family of attribute, and no new documentation shape. It is the cheapest
item in this document and it closes most of the "we need an API" feeling on its own.

**Nothing anywhere can veto a close.** `ui-before-change` is cancelable for value transitions on
eight elements, and `ui-before-copy` for the clipboard. There is no `ui-before-open` or
`ui-before-close` anywhere, so "block dismissal while the form is dirty" — the single most-requested
dialog behavior in every library — has no hook. Milestone 024 already reasoned about half of this
and decided a swipe dismissal is not cancelable _because a backdrop click already isn't_
([024 RESULTS](../memory/milestones/024-menus-context-and-gestures/RESULTS.md)). That reasoning is
consistent, but it settled parity between two uncancelable paths rather than deciding whether either
should be cancelable. It is still open.

**Four detail shapes for one event.** `{ source }` (Sheet, no `open` field),
`{ open, source: 'api' | 'trigger' }` (Menu Button),
`{ open, source: 'api' | 'keyboard' | 'pointer' }` (Context Menu), `{ open, originalEvent }`
(Select, Combobox). A consumer who learns one learns none of the others. Sheet's vocabulary is the
right one — it is the only shape that distinguishes _why_ a surface closed, which is the field a
consumer actually branches on.

## Evidence: the imperative surface is invisible

The registry declares `attribute()`, `part()`, `state()`, `variable()`, `event()`, and `a11y()`.
There is no `method()`. Consequences, all verified against the published manifest and the exported
types:

| API                                            | Exists at runtime | In the manifest | In the element's public type | Documented anywhere |
| ---------------------------------------------- | ----------------- | --------------- | ---------------------------- | ------------------- |
| `toast(input, options)`                        | ✅                | n/a (function)  | ✅ exported                  | ❌                  |
| `toastElement.dismiss(reason)`                 | ✅                | ❌              | ✅                           | ❌                  |
| `contextMenu.openAt(point, source)`            | ✅                | ❌              | ❌ typed `HTMLElement`       | ❌                  |
| `contextMenu.close()`                          | ✅                | ❌              | ❌                           | ❌                  |
| `select.reset()` (also listbox, combobox, otp) | ✅                | ❌              | ❌                           | ❌                  |
| `select.checkValidity()` and friends           | ✅                | ❌              | ✅ (hand-written)            | ❌                  |
| `dialog.dialog` / `popover.content` getters    | ✅                | ❌              | ❌ erased by the cast        | ❌                  |

The last row is the sharpest. Each element class is returned as
`UIDialogElement as unknown as UIDialogElementConstructor`, and that constructor type declares only
`{ kind: DialogKind }`. `HTMLElementTagNameMap` maps `'ui-dialog'` to it, so
`document.querySelector('ui-dialog').dialog` is a **type error** against a getter that exists,
returns the right element, and is the only way to reach the dialog imperatively. The same cast hides
`.trigger` and `.content` on Popover, Hover Card, and Menu Button.

`toast()` is the library's one genuinely imperative API — creates an element, appends it to a
resolved toaster, returns it — and it appears in no `.mdx` page, no example in `packages/examples`,
and not in the packaged `skills/using-timeless-ui/`. An agent reading the skill cannot discover that
Timeless can raise a toast from script.

`toast()` also never removes anything. `dismissToast` sets `hidden = true`, adds the element to a
module-level `WeakSet`, and dispatches `ui-dismiss`; the node stays in the DOM forever. On a
long-lived page — exactly the kind of app that raises toasts — the toaster accumulates hidden
elements without bound. That is a leak, not just an animation blocker.

## Close on outside click

Worth separating into three cases, because two of them are already solved and only one is a
decision.

**Popover, Menu, Menu Button, Select, Combobox, Hover Card: already done, by the platform.** These
are `[popover]` surfaces, so light dismiss, Escape, and top-layer behavior come from the Popover API
and Timeless adds nothing. The one gap is _reporting_: Select and Combobox fire `ui-close` with no
reason, so a consumer cannot tell a light dismiss from a selection.

**Sheet: already done, in Timeless.** `SheetDismissSource` is
`'close' | 'escape' | 'outside' | 'swipe'`, and the outside case is implemented. This is the model.

**Dialog: not done, and the platform now offers the answer.** `showModal()` has no light dismiss by
design. The declarative fix is `<dialog closedby="any">`, which needs **zero** JavaScript from
Timeless — it is exactly the shape of thing this library prefers, alongside `command="show-modal"`.
`closedby` appears nowhere in the repository: not in a stylesheet, not in a story, not in
`browser-support.mdx`, not in a story's copyable markup.

Two things it would need. First, real version data — `closedby` shipped well after the Baseline 2025
floor, so it belongs in the _Progressive features_ table with per-engine numbers taken from MDN BCD,
not from memory. Second, a decision about the fallback: a browser without `closedby` gives no light
dismiss at all, and `packages/core` already ships
`createDismissableLayerController({ escapeKey, outsidePointer, outsideFocus })` — currently used by
Hover Card only — which is precisely the fallback mechanism. My recommendation is to **support the
authored attribute and not write the fallback**: an author who writes `closedby="any"` gets the
platform's behavior where it exists and a dialog that still closes by its own controls where it does
not, which is the same progressive-enhancement bargain as Invoker Commands. A JS fallback would put
Timeless in the business of synthesising light dismiss, and light dismiss interacts with the top
layer in ways a listener cannot see.

What Timeless _does_ owe here is the `close` reason. `handleDialogClose` already runs on every path
and `handleDialogCancel` distinguishes Escape; the dialog's `returnValue` distinguishes an authored
close button. So `ui-close` with a reason is reachable from listeners that are already attached.

## Animated presence: what is actually true

| Claim                                                                   | Reality                                                                                                                                                                   |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Overlays appear and disappear with a transition" (browser-support.mdx) | No overlay has an enter or exit transition. `@starting-style` count in the repo: **0** (that table line is its only mention).                                             |
| `transition-behavior: allow-discrete`                                   | Used once, in `themes/atmosphere/collapsible.css`.                                                                                                                        |
| Sheet                                                                   | Has **entry** keyframes per position, plus a `:state(--dragging)` guard. No exit — `dialog.close()` is instant.                                                           |
| Toast                                                                   | `core/toast.css` sets `ui-toast:state(--closed) { display: none }`. Exit animation is impossible **and core owns the rule**.                                              |
| Tabs                                                                    | Panels hide via the `hidden` attribute, with `display: none` restated in `core/tabs.css`. No cross-fade possible.                                                         |
| Collapsible                                                             | ✅ The exemplar: `::details-content`, `interpolate-size: allow-keywords`, `allow-discrete`, a `--ui-collapsible-duration` variable, and a `prefers-reduced-motion` guard. |
| Motion tokens                                                           | Two, both theme-only: `--ui-duration-fast: 120ms`, `--ui-ease-standard`.                                                                                                  |

So the published documentation describes a capability the library does not have. That is a
docs-drift bug independent of whether animation gets built — `browser-support.mdx` should either
stop claiming it or the theme should earn the claim.

### Do we need `data-` state attributes for this?

Mostly **no**, and the reason is the four-families rule in AGENTS.md. A `data-ui-state="open"`
written by JS would be a public attribute that duplicates state the platform already publishes, and
it fits no family: it is not enumerated visual configuration (JS writes it), not anatomy, not
per-item input, and not private. Every state a presence animation needs is already selectable:

| What the animation needs to know | Selector that already exists                                                     |
| -------------------------------- | -------------------------------------------------------------------------------- |
| Popover-backed surface is open   | `:popover-open`                                                                  |
| Dialog or Sheet panel is open    | `dialog[open]`, `ui-sheet[open]`                                                 |
| Details panel is open            | `[open]`, `::details-content`                                                    |
| Toast is dismissed               | `ui-toast:state(--closed)`                                                       |
| The exit phase itself            | `@starting-style` + `transition-behavior: allow-discrete` — a phase, not a state |

The exit phase is the thing other libraries encode as `data-state="closed"` — and they do it because
React unmounts the node, so they need a JS-held phase to delay unmounting. Timeless never unmounts:
the markup is authored, the platform hides it. `allow-discrete` plus `@starting-style` is the
platform's own answer to the same problem, and it is the answer a library built on Baseline
primitives should ship.

There is exactly **one** genuine gap where a peer library's data attribute earns its place: the
**resolved side**. Radix and Base UI expose `data-side` / `data-align` so a surface can slide in
from the direction it actually opened. Timeless positions anchored surfaces with `position-area` and
`position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline`, so the _resolved_ side is
known only to the layout engine — no stylesheet and no listener can read it without measuring, and
measuring means re-introducing the per-open JS positioning that milestone 028 deliberately removed.

Three options, in order of what I'd do:

1. **Animate from the requested placement, not the resolved one.** `placement` is already a public
   attribute, so `ui-select[placement='top']` is selectable today with no new API. It is wrong only
   in the flipped case, where the surface slides from the "wrong" side by a few pixels of translate
   — an imperceptible defect in exchange for zero machinery. Caveat: Popover and Hover Card default
   `placement` to `''` rather than reflecting a value, so the default case is unselectable until
   they carry a real default like Menu Button's `'bottom'`.
2. **Animate scale and opacity only**, with no directional translate. Always correct, less
   characterful, and probably the right default for the theme regardless.
3. **Measure and stamp the resolved side.** Correct and expensive: a per-open measurement, a new
   writer, and a state that lies for one frame during a scroll-induced reflow. Not worth it.

### What would break if presence animation were added

Two synchronous cleanups run on close and would need to move behind the transition, or be shown to
be harmless:

- `clearFloatingPosition(content)` runs immediately in `menu-button.ts`, `popover.ts`,
  `hover-card.ts`, `select.ts`, and `combobox.ts` — it strips the coordinates and the
  `data-ui-internal-floating` hook, so an exiting surface in the **JS-fallback** path (a browser
  without anchor positioning) would jump to its unpositioned location mid-animation. Supported
  browsers are unaffected because the hook is never written there.
- `returnFocus(...)` on dialog close, and Toast's focus-return when it holds focus, both fire at
  close time. That is correct and must stay correct: focus cannot wait for an animation, and the
  AGENTS.md rule against removing the element that holds focus applies during the exit phase too —
  an exiting surface must stay focusable-out-of, not become `display: none` while focus is inside
  it.

`options.css` already carries a comment anticipating this: its rules are deliberately not scoped to
`:popover-open` "if an exit transition is ever added". Someone was here before.

## Recommendations

Ordered by value per unit of risk. The first three are additive and breaking nothing.

1. **Unify the overlay lifecycle.** One detail shape for `ui-open` / `ui-close` across Dialog,
   Popover, Hover Card, Sheet, Select, Combobox, Menu Button, Context Menu, carrying
   `{ open, reason, originalEvent }` where `reason` follows Sheet's vocabulary (`trigger`, `api`,
   `close`, `escape`, `outside`, `swipe`, `select`). Add `ui-open` / `ui-close` to the five elements
   that report nothing. Sheet keeps `ui-dismiss` as the narrower signal it already documents.
   _Migration cost: Select, Combobox, Menu Button, and Context Menu details gain a field; Sheet's
   gains `open`. Additive if the existing fields stay._
2. **`open` on every surface**, as a reflected boolean attribute plus property, copied from Sheet.
   This is the whole "programmatic API" ask for eight of nine elements, and it is a copy of code
   that already exists three times.
3. **Add `method()` to the registry**, project it into `custom-elements.json`, the component pages,
   the framework typings, and the packaged skill — then declare `toast()`, `openAt()`, `close()`,
   `dismiss()`, `reset()`, and the validity methods. Also stop erasing the part getters: the
   constructor casts should declare `.trigger`, `.content`, and `.dialog`. Nothing new is built
   here; what exists becomes visible.
4. **Decide on `ui-before-close`.** A cancelable close is the one behavior in this document that is
   genuinely absent rather than merely unpublished, and it is what "unsaved changes" needs. The
   platform's `cancel` event on `<dialog>` already offers it for Escape only; a Timeless-level
   cancelable close would have to be honest that a light dismiss and a swipe cannot be intercepted.
   That asymmetry is why this is a decision and not a task.
5. **Support `closedby` on Dialog**: document it, use it in a story, add a real BCD row to the
   progressive-features table, and add no fallback.
6. **Presence animation in the theme**, generalising Collapsible: `@starting-style` plus
   `transition-behavior: allow-discrete` (and `transition: overlay` for top-layer surfaces, whose
   engine support needs a BCD check) for Dialog, Sheet exit, Popover, Hover Card, Menu, Menu Button,
   Select, Combobox, Toast, and Tabs panels. Every duration behind a component variable, every rule
   behind `prefers-reduced-motion`. This needs two core changes first:
   `ui-toast:state(--closed) { display: none }` and the Tabs `[hidden]` rule are behavior-shaped
   only by accident and should become theme rules, or the theme cannot animate what core has already
   hidden.
7. **Fix or earn the browser-support claim** about `@starting-style`, and make Toast remove its
   dismissed nodes (after the exit transition, once there is one).

### What not to build

- **`data-ui-state="open|closed"` or any JS-written public state attribute.** It duplicates
  `:popover-open`, `[open]`, and `:state()`, and belongs to no family.
- **A presence/`AnimatePresence` runtime, or any JS-driven animation.** The library's CSS-in-CSS
  rule covers this: JS may set behavior attributes and measured custom properties, never visual
  declarations. Presence is `allow-discrete`'s job.
- **A JS light-dismiss fallback for `closedby`.** Progressive enhancement means the authored
  attribute wins where it exists and the component stays operable where it does not.
- **`data-side` by measurement.** Option 1 or 2 above, or nothing.

## Open decisions

1. Is a close cancelable? If yes, does it stay honest about the paths it cannot intercept, or does
   Timeless refuse the whole idea for consistency with 024's reasoning?
2. Does `reason` become a shared union in `events.ts`, or stay per-element like the change details
   (`manifest:validate` requires the declared type to be exported, and the registry comment argues
   for per-element detail types)?
3. Does moving `display: none` out of `core/toast.css` and `core/tabs.css` violate the core boundary
   in the other direction — is "the dismissed toast is not shown" behavior or appearance?
   `check-core-boundary.mjs` will have an opinion.
4. Does animation belong to Atmosphere only, leaving a theme-free consumer with instant surfaces?
   That is consistent with the tiering, and it means the seven components already below WCAG 2.2 SC
   2.5.8 without the theme are joined by "no motion" on the list of things a replacement theme owns.

## What this produced

Nothing yet. Recommendations 1 to 3 are a natural single milestone — one registry change, one event
shape, one generated-surface pass — and 6 to 7 are a second, stylesheet-only one that depends on the
core-boundary decision in open question 3. Recommendation 5 is small enough to ride along with
either. Recommendation 4 needs a decision before it can be scheduled.

---

Generated by Claude Opus 5
