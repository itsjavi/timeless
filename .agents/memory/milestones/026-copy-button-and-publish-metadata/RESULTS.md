# Milestone 026 Results

## Baseline

Measured on `main` at commit `27b76e3` on 2026-08-19, before any work. Rows marked **run** were
verified by executing the command, not by reading the source.

| Measure                                                    | Value                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Catalog entries                                            | 47, of which 3 under **Actions**                                               |
| `ui-copy-button` in registry, catalog, or CSS              | Absent from all three                                                          |
| Clipboard code in the library                              | One private path, `color-picker.ts:493-506`, 14 lines, silent `catch`          |
| `COPIED_DURATION`                                          | 1800ms (`color-picker.ts:58`)                                                  |
| `:state(--copied)` CSS idiom                               | Already established, `color-picker.css:163-168`                                |
| Color picker's `--copied` state                            | Declared **non-public** — "Internal; do not author it."                        |
| `check-generated-dom.mjs` allowlist                        | `toast.ts` only                                                                |
| `validate.ts` coverage                                     | Attributes only; never walks `data-ui-part`                                    |
| `pnpm publint`                                             | **run** — "All good!" for both `@timelessui/core` and `@timelessui/components` |
| `pnpm attw`                                                | Covers `@timelessui/components` only; core has no script and no devDependency  |
| attw against core by hand, `--profile esm-only`            | **run** — 🟢 `node16 (from ESM)`, 🟢 `bundler`                                 |
| `repository` / `homepage` / `bugs` / `keywords` / `author` | Missing from both published manifests                                          |
| Install command in `packages/components/README.md`         | Absent. Present in 9 places under `apps/web/src/content`                       |

## Platform behavior confirmed before planning

**Nothing about the Clipboard API was confirmed firsthand.** The plan rests on documented behavior
only — that `navigator.clipboard` is undefined outside a secure context, that `writeText` rejects
without transient user activation in some engines, and that Playwright can grant clipboard
permissions per browser context. Each is a task before implementation, not an assumption to build
on:

- Confirm `navigator.clipboard` is genuinely `undefined` rather than present-and-rejecting in each
  target engine over plain HTTP, because it decides whether `'unsupported'` and `'denied'` are two
  reasons or one.
- Confirm whether WebKit rejects `writeText` when called from a `click` handler that has already
  awaited, since the element's copy path is async.
- Confirm Playwright's clipboard permission grant works in all three engines the suite runs, or the
  copy-path spec is Chromium-only and must say so.

The one fact that **was** confirmed by execution is that `@timelessui/core` passes attw today with
the `esm-only` profile, which is why section 8 is scoped as wiring rather than as a fix.

## Open decisions

**Where does the announcement text come from?** The plan reads the authored `copied` part's text
content, so the string stays author-owned and internationalisable with no new attribute. This breaks
for an icon-only button, which has no text to read.

- **For reading the part:** no new attribute, no English in the library, one obvious source.
- **Against:** an icon-only trigger announces nothing, silently. The alternative is a
  `copied-message` attribute, which adds a third text-ish attribute to a small component and gives
  authors two ways to say the same thing.
- Decide by building the icon-only story first. If it reads badly, the attribute is justified.

**Is `--failed` a state worth declaring?** The plan declares only `--copied` and leaves failure to
the event. A `--failed` state would let CSS show an error affordance without script, which is the
library's usual preference — but a failed copy is rare, and a state nothing in the default
stylesheet uses is contract surface with no proof behind it. `contracts:validate` will reject it if
the CSS never selects it, which is the honest forcing function.

**Should the reveal be opt-in or automatic?** The plan makes it opt-in: the element removes `hidden`
only from a trigger the author marked `hidden`. Automatic hiding — the element hiding a visible
trigger when the Clipboard API is missing — would guarantee no dead control ever renders, but it
means script removing an author's visible UI, which is the kind of thing this library deliberately
does not do. Opt-in leaves an author who forgets with an inert button.

**Two threads in one milestone.** The copy button and the packaging fixes share nothing but their
origin in 007. Splitting them would mean a milestone whose entire content is five manifest fields.
Recorded so the pairing reads as a decision rather than an oversight.

## What moved between the plan and the work

The plan was written on 2026-08-19 at `27b76e3`; the work ran on `main` at `78bb7e1`, three
milestones later. Four baseline rows above had drifted by then, and the plan's shapes changed with
them:

- **Catalog entries: 51, not 47**, still 3 under **Actions**. Copy Button makes 52 and 4.
- **`pnpm attw` already covered two packages**, not one: `@timelessui/color` gained the script after
  the plan was written. Core was still the gap, and the sweep now reports three.
- **`@timelessui/color` is published too**, and was missing the same five manifest fields. The plan
  says "both published manifests"; there are three, and all three got them.
- **Stylesheets are split by tier.** Milestone 028 turned `src/css/<name>.css` into
  `core/<name>.css` plus `themes/atmosphere/<name>.css`, and `check-core-boundary.mjs` now proves
  the split in both directions. The plan's single `src/css/copy-button.css` became two files, which
  changed one decision materially — see the announcement region below.

## Decisions and constraints

### The open decisions, resolved

**Where the announcement text comes from: `copied-message`, then the `copied` part's text.** The
plan left this to be decided by building the icon-only story first, and the icon-only story settles
it — an icon button has no text to read an announcement off, so reading the part alone would make
the most common shape silent, with nothing saying why. The attribute is a fourth free-form attribute
on a small component, which is the cost the plan was avoiding; the two-step chain is what keeps that
cost down. A worded button needs no attribute at all, because `Copied` is already written in the
markup; an icon-only one names the message once. The chain is the same shape as `value` then `from`,
so the component has one precedence idiom rather than two.

**`--failed` is not declared.** As planned. A failed copy is rare, the default stylesheet has
nothing to show for it, and `contracts:validate` would have rejected a state no CSS selects. Failure
travels through `ui-copy`, where a consumer can act on the reason.

**The reveal stays opt-in.** As planned. Script never removes a visible control an author wrote.
Both halves are now asserted in `no-javascript.spec.ts` so the asymmetry is a tested contract rather
than a note.

**Rich clipboard content: a cancelable proposal, not a wider `value`.** Raised in review, and my
first read was that it needed its own milestone — a blob has no attribute representation, so `value`
would have to grow into a union and `CopyDetail.value` would stop being a `string`. That was the
wrong shape. The library already has the mechanism: `ui-before-change` is a cancelable proposal
dispatched before a commit, and cancelling it suppresses the committed event. `ui-before-copy` is
the same pattern, and it carries `respondWith(promise)`.

- `preventDefault()` cancels the copy. Nothing is written and no `ui-copy` follows, which is what
  cancelling a proposal means everywhere else here.
- `respondWith(promise)` hands the write over and implies prevention. The element awaits it and
  drives `--copied`, the announcement, and `ui-copy` from the outcome, so a confirmation never
  claims a copy that did not happen.

`value`, `from`, and the `value` property are untouched, and `CopyDetail.value` is still the string
the element resolved — for an image copy it is whatever `value` or `from` gave, which is what the
listener saw and chose to replace. The proposal is dispatched **before** the outcome table rather
than after it, so a button whose payload exists only in script is reachable: with no `value` and no
`from` the element would otherwise report `empty` and never ask.

One reason was added rather than reused. A rejected `respondWith` promise reports `rejected`, not
`denied`, because the first thing the probe hit was a `DataError` from a malformed image — calling
that a denial would send an author to check permissions. Verified end to end in Chromium: a 1x1 PNG
through `respondWith` lands on the real clipboard as `image/png`, `ui-copy` reports `copied`, and
the announcement fires; an undecodable blob reports `rejected` with no confirmation.

**`ClipboardItem` takes a promised blob, and that is the difference between working and not.**
`respondWith` has to be called synchronously to keep the click's transient user activation, which
reads like it forces the author to have the blob in hand. It does not:
`new ClipboardItem({ 'image/png': blobPromise })` lets `write` start immediately while the data
resolves. Awaiting the fetch first and then calling `write` is the version that loses activation.
The registry description and the story both show the working shape, because the broken one is the
obvious one.

### Constraints found during the work

**A theme cannot hide the announcement region, and core cannot size it.** The plan says the
stylesheet visually hides `status`. Post-028 that is two files: `position` is core-owned and
forbidden in a theme, while `inline-size` and `block-size` are sizes and forbidden in core.
Splitting it the way `color-picker`'s `input-label` is split would leave a theme-free consumer with
the confirmation absolutely positioned at full size, painted over their layout — worse than either
extreme. What makes the region invisible is `clip-path: inset(50%)`, which the boundary checker
classifies as neither cosmetic nor sizing, so it belongs in core on its merits: it is what makes
that element an announcement channel rather than visible content. The 1px box stays in the theme,
where it only stops a long confirmation widening a scroll container. Confirmed by screenshot with
the theme removed: the swap works, and the status text does not render.

**`hidden` on the trigger did nothing, and only a browser said so.** `.ui-button` sets
`display: inline-flex`, and the UA's `[hidden] { display: none }` loses to any author rule at all —
so the button authored `hidden` was on screen the whole time and the reveal had nothing to reveal.
Neither `contracts:validate` nor `core:validate` nor any unit test can see this; the e2e reveal case
failed on the first run and named it. `core/copy-button.css` now carries the explicit `[hidden]`
rule that `core/options.css` already carries for every part the library hides that way. The lesson
generalises: any part whose `display` something else sets needs its own `[hidden]` rule.

**The element class is not unit-testable, so the outcome table was made a function.** The package
runs vitest with `environment: 'node'`, so there is no DOM for a custom element to connect to.
Rather than build a fake window, `performCopy(value, clipboard)` holds the whole decision table and
returns exactly one detail per call — which makes "one `ui-copy` per activation, on every path"
structural rather than something the element remembers to do, and unit-testable against plain
objects. The class-level guarantees moved to `apps/e2e`, where they are observable.

**`unsupported` and `denied` really are two reasons.** Measured, not assumed: on `localhost` — a
secure context — `navigator.clipboard` is an object while
`navigator.permissions.query({ name: 'clipboard-write' })` reports `denied` and `writeText` rejects
with `NotAllowedError`. Presence and permission are independent, so collapsing them into one reason
would have hidden the difference between "this browser cannot" and "this browser would not".

**A story's route id comes from a filename table, not its title.**
`apps/stories/.storylite/config.ts` maps story filenames to catalog domains in `resolveStoryId`. A
story with the correct `Library/Actions/Copy Button` title still routed as `copy-button--default`
until `copy-button` was added to that table — and `write-route-catalog.mjs` does not catch it,
because the id has no implementation-oriented prefix either.
`.agents/skills/author-component-story/SKILL.md` says the route reads from the title, which is half
the story.

### Trade-offs

- **`revert-layer` rather than a named display.** The `copied` part is a `<span>` in a worded button
  and an `<svg>` in an icon-only one, so no single `display` value is right for both. Hiding
  unconditionally and reverting from the state also degrades in the safer direction: where
  `:state()` is unsupported the show rule is dropped and only the idle label renders, rather than
  both at once.
- **The canonical example shows `from`, not `value`.** One preview, and `from` is the half a
  consumer cannot guess: the snippet exists once, in the markup the reader is already looking at.
  The literal `value` shape is in the story, next to the icon-only one.
- **The CI attw step is the root sweep now.** The plan said to add core to the step. Naming
  `pnpm attw` instead of a third filtered package means the next published package is covered the
  day it lands rather than the day someone remembers.

## Summary

**Copy Button.** `ui-copy-button` wraps a native button and copies `value`, or the text of the
element `from` names — `.value` for an `input`, `textarea`, or `select`, text for anything else,
with `value` winning on presence the way `listboxOptionValue` does. Every activation dispatches
exactly one `ui-copy` carrying `status`, the resolved `value`, and a `reason` of `empty`,
`unsupported`, or `denied`. `--copied` is public, and lasts `feedback-duration`, default 1800ms,
alongside the announcement written into the authored `status` region; both clear together, so
copying the same value twice is announced twice. There is no fallback for an absent Clipboard API
and no polyfill: the element reports `unsupported` and leaves the authored markup alone, and a
trigger the author marked `hidden` is revealed only once the API is there.

Every element in the anatomy is author-owned, the live region included, because
`check-generated-dom.mjs` forbids this package from creating elements — and the constraint is right
here, since it makes the announcement text author-supplied. The trigger keeps one accessible name
throughout and the two labels are decorative, so no screen reader has to cope with a button renamed
while it holds focus.

**Packaging.** `repository` with `directory`, `homepage`, `bugs`, `keywords`, and `author` on all
three published manifests. `@timelessui/core` has an `attw` script and the devDependency, and CI
runs the root sweep. `packages/components/README.md` opens with the install command.

**Prose the new component made wrong.** Two claims said Context Menu was the only component with no
pre-registration shell — `README.md` and `reference/browser-support.mdx` — and Context Menu's own
catalog `authoring` said the same. Copy Button is the second, so the fact moved out of prose and
into a declared `beforeJavaScript` field on the catalog entry, which the reference page now renders
in place of its generic "the markup above is complete and usable on its own" paragraph. That
paragraph was a binary on whether the component had a custom element, and it was already wrong for
Context Menu. `DESIGN.md` called `:state()` private-state-only, which `--copied` is the first
exception to; the `:state()` row in `browser-support.mdx` named three components and now names four;
and `docs/index.mdx` counted the catalog by hand, which now interpolates.

**Two agent-facing references this milestone proved stale**, both by following them and hitting the
gap: `author-component/SKILL.md` still described one stylesheet at `src/css/<name>.css` with no
mention of `core:validate`, the two aggregates, or the two hand-written entries a new element needs
before `exports:validate` and `performance:check` can pass; and both skills plus `validators.md`
attributed StoryLite route ids to the story title.

**Files.** 52 changed. New: `src/copy-button.ts` and its test, `src/css/core/copy-button.css`,
`src/css/themes/atmosphere/copy-button.css`, `src/define/ui-copy-button.ts` (generated),
`packages/examples/src/copy-button.html.ts`, and the story with its factory re-export.

## Validation results

`pnpm qa` passes, exit 0: typecheck, `format:check`, build, 357 unit tests across four workspaces,
52 canonical examples, 6 platform claims and 8 house rules, 47 component and 19 guide Markdown
routes, `contracts:check`, `publint` for three packages, `attw` for three packages, and 415
end-to-end tests.

Verified along the way rather than only at the end:

- `generate:check`, `contracts:validate` (59 contracts, 23 elements, 199 documented values),
  `manifest:validate`, `exports:validate`, `generated-dom:check` with its allowlist untouched, and
  `core:validate` (274 declarations, 41 core stylesheets).
- `pnpm attw` before and after: two packages, then three, with core 🟢 on `node16 (from ESM)` and
  `bundler`.
- The real clipboard, read back with `navigator.clipboard.readText()` after a click with
  `clipboard-read` and `clipboard-write` granted. Chromium only, which is no restriction: the specs
  that need it run under `stories-chromium` alone, and the file says so.
- The three new StoryLite routes through the existing axe and reflow sweep.
- Screenshots of the swap in light and dark, and with the theme stripped to `tokens.css` plus every
  `core/*.css`, which is where the `clip-path` decision was confirmed rather than argued.

**The performance baseline was re-measured twice**, both times for a correctness fix, in a component
whose baseline was introduced in this same milestone:

- The first figures came from a stylesheet still missing the `[hidden]` rule — `cssGzipBytes` 1304 →
  1483, `cssRawBytes` 2617 → 3102, JS unchanged. One rule and its comment.
- Scoping the part lookups pulled `parts.js` into the closure — `gzipBytes` 3748 → 4484, `rawBytes`
  12211 → 13966, CSS unchanged. It is the shared module every other multi-part element already
  loads, so a page that renders any of them pays nothing for this.
- `ui-before-copy` and `respondWith` added `gzipBytes` 4484 → 4710 and `rawBytes` 13966 → 14754, CSS
  unchanged. Inside the 10% tolerance, so the check would have passed on the old figures;
  re-baselined anyway, because a component's first release should not spend the next change's
  headroom.

## Follow-ups, recorded rather than done

- **Migrate `ui-color-picker`'s copy control to `ui-copy-button`.** Out of scope by the plan, and
  still is: the picker's copy button is nested inside a larger contract and consolidating the two is
  milestone 021's kind of work. The duplication is now two implementations of the same behavior, one
  of them with a silent `catch`, which is a stronger argument for doing it than before.
- **Teach `validate.ts` about parts.** It walks attributes only, so a copy button with no `status`
  region — announcing nothing — cannot be reported. Extending it changes a shared module for one
  component's benefit.
- **Rich clipboard content is now supported**, and it did not need the contract change I first
  expected. See the decision above; nothing is left over. Long or dynamic text needed nothing at
  all: `from` is read at activation, so a 50,000-character source resolves with nothing duplicated
  into an attribute. Verified in the browser, and the `from` description now says so.
- **Nothing compares the StoryLite route ids to the catalog.** `apps/web/src/lib/stories.ts` builds
  the documentation's "Open in StoryLite" link as `library-${domain}-${id}--${story}` from the
  catalog, while `resolveStoryId` builds the real ids from filenames. A missing `storyDomains` entry
  is a silent 404 on a documentation page. Asserting every non-recipe example's `storyUrl` against
  `apps/stories/story-routes.json` in `validate-docs.mjs` would replace three prose claims with a
  build failure. The prose is corrected here; the check is not written.
- **The preview definition loader is hand-maintained.** `apps/web/src/scripts/preview-runtime.ts`
  maps each tag to a dynamic import and nothing compares it to the manifest, so a new element throws
  `Missing preview definition loader` in the browser after passing every validator. The map needs
  literal specifiers for the bundler, so the fix is to generate the file from the registry rather
  than to check it.
- **Pre-existing drift the docs audit surfaced, deliberately left alone.** Not caused by this work
  and too large to fold in: ten getting-started and framework MDX snippets import a component's
  theme stylesheet without `themes/atmosphere/tokens.css` or its `core/` sibling, so every token in
  them resolves to nothing — milestone 028 fallout, and the highest-value item;
  `reference/packages.mdx` omits `core.css` and `core/<component>.css` from the entrypoints table
  and lists 37 of 39 value arrays; `AGENTS.md` still gives `CSS Primitives/Button` as a story title
  and names a `pnpm test:coverage` that exists nowhere; `generated-files.md` omits
  `scripts/performance-baselines.json` and `apps/stories/story-routes.json`; `browser-support.mdx`
  attributes the Safari floor to `:state()` at 17.5 where its own table says 17.4; and three shipped
  CSS comments still name the deleted `theme-atmosphere.css`.

---

Generated by Claude Opus 5 - High reasoning

Implemented by Claude Opus 5 - High reasoning
