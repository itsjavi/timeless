# Milestone 030 Results

## Baseline

Audited at `705ea85` (`feat: the navigation set (milestone 025) (#14)`), Node 24.19.0, pnpm 11.22.0,
macOS 25.6.0. Published packages under test: `@timelessui/components@0.1.0`,
`@timelessui/core@0.1.0`, `@timelessui/color@0.1.0`, all published 2026-08-21.

The tree was green before the audit and green after it. Nothing below came from relaxing a gate:

| Gate                          | Result                                                    |
| ----------------------------- | --------------------------------------------------------- |
| `pnpm build`                  | pass, 126 website pages                                   |
| `pnpm typecheck`              | pass, 0 errors                                            |
| `pnpm format:check`           | pass, 583 files                                           |
| `pnpm test`                   | pass, 362 tests over 50 files                             |
| `pnpm contracts:check`        | pass, all four scripts                                    |
| `pnpm -F @apps/web test:dist` | pass, 49 component and 19 guide routes, 69 llms.txt links |
| `pnpm publint` / `pnpm attw`  | pass, one suggestion each on `repository.url`             |
| `pnpm test:e2e`               | pass, 422 tests across Chromium, Firefox, and WebKit      |

Registry at `705ea85`: 61 public roots, 38 CSS components and 23 custom elements. 23 roots carry an
`accessibility()` block; 38 do not.

**The tree moved mid-audit.** The session opened at `af23bc3`; an external `git pull` (visible in
`git reflog show main` as `pull --rebase=false … Fast-forward`, not run by the audit) advanced
`main` to `705ea85`. The first build and e2e run were against `af23bc3` and were discarded; every
number above and every finding below is from `705ea85`.

## Method, and why it matters

The harness is a throwaway consumer outside the repository:

1. `npm pack` each published tarball; install `@timelessui/components@0.1.0` from the registry into
   a bare Vite project with no workspace link.
2. Fetch all 49 `/docs/components/<name>.md` routes from `timeless.build` and generate one page per
   component from that page's own `## Markup` fence and `## Install` fence. The consumer's markup
   and imports are therefore literally what the documentation prescribes.
3. Production `vite build`, `vite preview`, then drive every page.

Step 2 is load-bearing. Copying the Install block verbatim is what turned F1 from an opinion into a
bundle with no `customElements.define` call in it. Deriving the pages from the repository instead
would have hidden every finding in section "Documented but not true".

Where axe is cited, the tag set is `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22a`,
`wcag22aa`, scoped to the authored markup.

## What the audit confirmed rather than faulted

Recorded so it is not re-litigated:

- **Light-scheme axe over all 47 published components: zero violations.** Over a painted surface, in
  the states the documented markup renders.
- **No console error, no page error, no failed request** on any of the 47 pages.
- **Every documented CSS and `define/` import resolves in the published tarball**, except the four
  belonging to the two unpublished components in F3.
- **Every `ui-*` tag in every documented markup fence upgrades** — `:defined`, a real constructor,
  never `HTMLElement` — once registration is written the way that works.
- **Dropping the theme leaves all 47 upgraded**, with Popover, Menu Button, Select, and Hover Card
  still opening beside their trigger. Combobox too, whose surface is an authored wrapper rather than
  the listbox.
- **Roving focus is correct** in Tabs, Toolbar, Listbox, Toggle Group, Menu, and Radio Group: one
  tab stop, `Home`/`End` working, orientation respected, `aria-disabled` items reachable and real
  `disabled` items skipped.
- **No hard SC 2.5.8 failure in the themed build.** 16 targets measure under 24 px in one dimension
  and all 16 clear the spacing exemption; see F11 for the fragility that leaves.
- The published tarball carries `skills/using-timeless-ui`, `custom-elements.json`,
  `web-types.json`, both VS Code data files, and the two CSS entry points. 371 files, 449 kB.
- `timeless.build` serves `/llms.txt`, `/llms-full.txt`, `/docs/getting-started/agents/`,
  `/stories/`, and every `<component>.md` route with a 200. context7 has the project indexed at 285
  snippets, refreshed within the day, trust score 9.3.

## Findings

Twenty-five, grouped by what is wrong rather than by component. Severity is the consumer's, not the
maintainer's: **Blocking** stops a consumer following the documentation, **AA** is a WCAG 2.2 Level
A or AA failure, **Contract** is a documented claim the code does not honour, **Gap** is missing
coverage, **Polish** is a judgement call.

### Documented but not true

**F1 · Blocking · Every custom element's documented registration is a no-op.** `dist/define/ui-*.js`
exports `defineXElement()` and has no module-level side effect, so
`import '@timelessui/components/define/ui-tabs'` registers nothing. Proven twice: in Node with a
stubbed `customElements`, where a bare import leaves the registration list empty and the module's
only export is `defineTabsElement`; and in a production Vite build of 23 pages, where no output
chunk contains `customElements.define` and every `ui-*` element stays un-upgraded.

The documented intent is unambiguous. `installation.mdx` presents the bare import under "Register
the elements you use" and contrasts it with the class entry point, which "gives you the class and
helpers **without** registering anything". `reference/packages.mdx` states that
`@timelessui/components/define/ui-{element}` "Calls `customElements.define`".

Affected: the generated Install block on all 23 custom-element pages, `installation.mdx`,
`quick-start.mdx`, `concepts/index.mdx` (`await import(…)` for its own sake), the six framework
guides, `reference/packages.mdx`, and `context7.json` rule 10. Only
`apps/web/src/content/docs/docs/styling/utility-css.mdx` shows the working named-import form, and
`apps/web/src/scripts/preview-runtime.ts` is the only code in the repository that registers
correctly — which is why the website's own previews work while the instructions do not.

The compounding detail: the packaged skill tells an agent that "a custom element that never upgrades
is almost always a missing `define/` import". An agent debugging this symptom is pointed at the
import it already has.

**F2 · Blocking · `validateTimelessMarkup()` throws on any inline SVG.**
`packages/components/src/validate.ts:161` reads `element.className.split(/\s+/)`. On an
`SVGElement`, `className` is an `SVGAnimatedString`, so the walker throws
`TypeError: className.split is not a function`. It crashes on the library's own documented markup
for Color Picker, Sheet, and Toast — the three of 47 pages whose markup fence contains an `<svg>`.
The unit tests pass because they use the plain-object `ValidatableElement` stand-in, whose
`className` is a string.

**F3 · Blocking · The deployed documentation promises components the published package lacks.**
gh-pages deploys on every push to `main`; npm publishes only on a `*.*.*` tag. Breadcrumb and
Pagination shipped to the site with milestone 025 and are not in 0.1.0. Their Install blocks import
`css/core/breadcrumb.css`, `css/themes/atmosphere/breadcrumb.css`, `css/core/pagination.css`, and
`css/themes/atmosphere/pagination.css`, none of which exist in the tarball. A consumer following
`/docs/components/breadcrumb.md` gets
`Rollup failed to resolve import "@timelessui/components/css/core/breadcrumb.css"`. Those four are
the only unresolvable imports across all 49 pages.

**F4 · Contract · `ui-textarea` is documented nowhere.** It is a public root with `data-ui-size`
(`formControlSizes`), styled in `core/forms.css` and `themes/atmosphere/forms.css` with both
`:hover` and `:focus-visible`, and listed twice in the packaged skill's `reference/contracts.md`. It
is named on none of the 49 documentation pages, appears in no `llms.txt` entry, and is claimed by no
catalog entry. Of 61 roots it is the only one absent from every page.

**F5 · Contract · The advertised documentation URL does not resolve for a root name.** The skill and
`context7.json` both instruct: fetch `https://timeless.build/docs/components/<component>.md`. That
route is keyed by catalog id, not by root, so an agent that reads `ui-textarea` or `ui-input` out of
`contracts.md` and follows the convention gets a 404 (verified for `textarea.md`, `textarea/`, and
`input.md`). `contracts.md` lists the root and gives no mapping to the page that documents it.

**F6 · Gap · context7 cannot see any component contract.** `context7.json` indexes
`apps/web/src/content/docs` and `packages/components/skills`. All 49 component pages are generated
at build time by `apps/web/src/pages/docs/components/[slug].astro` and `[slug].md.ts` from the
registry — there are zero component `.mdx` files under `content/docs`. So the integration the
project advertises for agents indexes the guides and the skill and none of the attribute tables,
permitted values, events, keyboard contracts, or canonical markup.

### WCAG 2.2 Level A and AA

**F7 · AA · SC 1.4.3 Contrast (Minimum) fails throughout the dark scheme.**
`themes/atmosphere/tokens.css:37` declares `--ui-accent: #0064d8` with no `light-dark()` pair, while
`--ui-fg`, `--ui-fg-muted`, `--ui-fg-subtle`, `--ui-line`, `--ui-success`, `--ui-warning`,
`--ui-danger`, and `--ui-accent-soft` all carry one. Accent-coloured _text_ therefore stays a
mid-blue on dark surfaces. Measured with the page surface painted:

| Component     | Element               | Measured | Required |
| ------------- | --------------------- | -------- | -------- |
| Listbox       | selected option       | 2.62:1   | 4.5:1    |
| Menu          | checked checkbox item | 2.87:1   | 4.5:1    |
| Menu          | checked radio item    | 2.87:1   | 4.5:1    |
| Tabs          | selected tab          | 2.87:1   | 4.5:1    |
| Card          | action link           | 3.18:1   | 4.5:1    |
| Text and code | inline link           | 3.44:1   | 4.5:1    |

Light scheme, same 47 pages, same tags: **zero** violations. The failure is entirely the missing
dark branch.

`--ui-focus` is `color-mix(in oklab, var(--ui-accent), transparent 25%)`, so the focus ring inherits
the same non-adapting hue and needs measuring against SC 1.4.11's 3:1 for non-text contrast — likely
a second failure from the same root cause, not yet measured.

An artefact worth writing down, because it will recur: on a page that paints no background, axe
blends dark-scheme text over the white it assumes and reports contrast in the 1.09:1 range for
almost everything. Those are false. The library deliberately leaves `html` and `body` unpainted, so
the real canvas comes from `color-scheme: light dark`, which axe cannot see. Painting a surface
before scanning collapsed 9 components of noise down to the 6 real failures above — and no
documented Install block tells a consumer to paint one, so a consumer running their own audit will
meet the same noise.

**F8 · AA · SC 2.2.1 Timing Adjustable — Toast auto-dismisses in 5 s and the timer never pauses.**
`duration` defaults to `5000`. `packages/components/src/toast.ts:118` sets one `setTimeout` and
clears it only on dismissal; there is no `pointerenter`, `focusin`, or `pause` handling anywhere in
the file. There is no way to turn the limit off, extend it, or adjust it other than authoring
`persistent` or `duration="0"` per toast, and the Toast page does not mention the criterion.

**F9 · A · SC 2.4.3 Focus Order — dismissing a Toast destroys focus.** Reproduced against the
documented markup: at load, `Tab` moves focus to the toast's own "Dismiss notification" button; 5 s
after load the toast hides itself and `document.activeElement` becomes `<body>`. A keyboard user
reaching for the dismiss control is ejected to the top of the document by the control they were
reaching for.

**F10 · A · SC 2.4.3 Focus Order — Number Stepper ejects focus at the bounds.**
`packages/components/src/number-stepper.ts:35-36` sets `decrement.disabled` and `increment.disabled`
from the value. With `value="2" min="1"`, focusing Decrease and pressing `Enter` once takes the
value to `1`, disables the button, and drops `document.activeElement` to `<body>`; three further
presses do nothing because focus is gone. Menu's own accessibility note already argues for the
treatment that prevents this: "Disabled items stay reachable with the arrow keys, which is the APG
treatment."

**F11 · AA · Dropping the theme introduces SC 2.5.8 target-size violations.** Rebuilt all 47 pages
with `tokens.css` plus `core/*` and no theme. axe reports `target-size` (serious) on Color Picker (1
node) and Number Stepper (3 nodes); the themed build reports none.
`apps/e2e/tests/apps/web/core-only.spec.ts:355` compares themed against core-only axe results for
`select`, `listbox`, `menu-button`, and `dialog` only, so neither component is covered.

**F12 · Polish · Several targets clear SC 2.5.8 only through the spacing exemption.** Checkbox and
radio rows measure 1264 × 18 px (via their `<label>`) with a 17 px nearest-target gap; colour-picker
channel sliders measure 216 × 10 px with a 29 px gap. All pass today. A consumer who tightens the
row gap — an ordinary density decision — drops below the exemption and fails AA, and nothing
documents that the compliance depends on the gap rather than on the target.

### Declared contracts the code does not honour

**F13 · Contract · `Page Up` / `Page Down` is documented for five components and implemented by
none.** `COLLECTION_KEYS` in `component-registry.mjs:95` emits a "Page Up / Page Down — Jump ten X
at a time" row for Toolbar, Radio Group, Checkbox Group, Listbox, and Toggle Group.
`collection.ts:23-46` handles `Home`, `End`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, and `ArrowRight`,
and returns `null` for everything else. Pressed against all five, and against Menu, focus does not
move.

`gridCollectionNavigationTarget` (`collection.ts:246`) does implement `PageUp` and `PageDown`, and
no component calls it — its only reference outside its own file is the re-export in `index.ts:51`.
So the one implementation in the package is unreachable from every claim that describes it.

These rows are not only on a web page: they are in the generated `contracts.ts` (five occurrences),
in `llms-full.txt` (six), and in the contract table shipped inside the package's agent skill.

**F14 · Contract · Checkbox Group declares a keyboard contract it has none of.** Its page documents
arrow keys, `Home`/`End`, and `Page Up`/`Page Down`. `UICheckboxGroupElement` in
`choice-group.ts:208` has no `keydown` handler at all — only `change`, and `syncOrientation`.
Verified: `tabindex` is unset on all four checkboxes, `Tab` visits each in turn, and `ArrowDown`,
`End`, `Home`, and `PageDown` all leave focus where it is. Radio Group, by contrast, implements
`Home` and `End` for real and inherits arrow navigation from native radios.

Each checkbox being its own tab stop is the APG treatment, so the implementation is likely right and
the declaration wrong.

**F15 · Contract · Toggle Group declares the APG Button pattern and implements Toolbar.** The
rendered host is `role="toolbar"` with `aria-label`, roving `tabindex` (`0`/`-1`/`-1`), one tab
stop, `Home`/`End`, and `aria-pressed` per button — the Toolbar pattern. The registry declares
`accessibility('button', 'Button', …)`, so the page tells the reader to follow
`https://www.w3.org/WAI/ARIA/apg/patterns/button/`.

**F16 · Contract · Menu rewrites the author's `disabled` into `aria-disabled`.** `menu.md`'s own
markup fence, line 17, is `<button role="menuitem" type="button" disabled>Delete</button>`. After
upgrade the same element is
`<button role="menuitem" type="button" aria-disabled="true" tabindex="-1">` — the `disabled`
attribute is gone. With scripting off it is still a real `disabled` button, unfocusable and
therefore unreachable by the arrow keys the note promises.

The treatment is correct; arriving at it by mutation is not. It contradicts "The markup you author
is the markup that ships", it makes the "Before JavaScript runs — authored ARIA is already correct"
section untrue for this case, and it silently breaks any consumer CSS keyed on `:disabled` for menu
items. Toolbar, meanwhile, documents a real `disabled` button and skips it, so the two components
take opposite positions on the same question without either note acknowledging the other.

**F17 · Contract · 38 of 61 roots have no `accessibility()` block**, so their reference page renders
only the generic three-line paragraph — no pattern link, no keyboard table, no notes. Defensible for
Separator, Badge, or Skeleton. Not for the four interactive custom elements in that set —
`ui-toaster`, `ui-toast`, `ui-number-stepper`, `ui-color-picker` — where the page says nothing about
a live region, a 5 s time limit, spinbutton keys, or four labelled sliders. Among the CSS roots the
same applies to `ui-switch` (the APG Switch pattern), `ui-alert`, `ui-progress`, `ui-meter-field`,
and `ui-table`.

**F18 · Contract · The published contract reads "Jump ten checkboxs at a time".** `COLLECTION_KEYS`
builds its plural as `${subject}s`. Present in the live page, `llms-full.txt`, `contracts.ts`, and
the packaged skill.

### Coverage gaps that let the above ship green

**F19 · Gap · The axe sweep runs one colour scheme.** `apps/e2e/tests/apps/stories/a11y.spec.ts`
never sets `prefers-color-scheme` or `data-theme`, so every one of its per-route scans runs in the
default scheme. That is the direct reason F7 shipped. The website spec does check both themes, but
only on `/docs/components/button/`, and Button uses no accent text.

**F20 · Gap · Nothing in the repository consumes the published package.** No test packs or installs
the tarball, and no test follows the documented install path. The website's previews register
through `preview-runtime.ts` and the catalog registers through `defineTimelessElements`, so both
bypass the instructions a consumer reads. That is the direct reason F1 shipped, and it is the gap
most worth closing: it is the only gate that would have caught a publishing-shaped bug.

**F21 · Gap · No gate proves a declared key is implemented.** `validate-contracts.mjs` proves
attribute values against the stylesheets in both directions and `validate-manifest.mjs` proves event
detail types, but nothing connects `accessibility().keys` to a test that presses the key. F13 and
F14 are both instances.

**F22 · Gap · The guide pages are not scanned.** Website axe covers `/`, `/404.html`,
`/docs/components/button/` in two themes, and every component reference page. The 19 guide routes
under `/docs/getting-started/`, `/docs/frameworks/`, `/docs/styling/`, `/docs/reference/`, and
`/docs/concepts/` are not scanned at all.

### Theme consistency and prose precision

**F23 · Polish · Hover is inconsistent across the form controls.**
`themes/atmosphere/forms.css:141-144` gives `:hover` to `.ui-input`, `.ui-textarea`, `.ui-select`,
and `.ui-file`. `.ui-checkbox`, `.ui-radio`, `.ui-switch`, and `.ui-range` have no `:hover` rule
anywhere in core or the theme, confirmed by computed-style deltas across 90 controls.
`:focus-visible`, by contrast, covers all eight. Not a conformance failure — hover affordance is not
required — but four form controls react to the pointer and four do not.

**F24 · Polish · `--ui-accent-hover` and `--ui-accent-active` get darker.** `#0045b7` and `#005cd7`
against a `#0064d8` base, both unpaired. On a dark surface a hover that moves toward the background
is the wrong direction.

**F25 · Polish · Anchored surfaces lose their trigger-matched width without the theme.**
`min-inline-size: anchor-size(width)` lives at `themes/atmosphere/options.css:249`, because
`check-core-boundary.mjs` rule 2 forbids a size in a core stylesheet. Measured: the Combobox surface
opens at 1262 × 148 px themed and 63 × 54 px core-only. Placement is core and survives; the
anchor-derived sizing does not. The README's "every component is positioned, structurally intact,
and operable while looking like nothing in particular" is imprecise for these surfaces.

Recorded rather than fixed, because the boundary script's own preamble documents the bug that
motivated rule 2 — a `min-inline-size` split across two files silently rendering every Select at 14
rem — so widening the rule casually is exactly what it exists to prevent.

**F26 · Polish · `publint` suggests `repository.url` should be a full git URL.**
`https://github.com/itsjavi/timeless.git` rather than `git+https://…`, on all three publishable
manifests.

## Platform behavior confirmed before planning

Confirmed by direct execution in Chromium 1.62.1 via Playwright, not from specification:

- **A bare ESM import of a module whose only export is a function has no side effect**, so it cannot
  register a custom element. Confirmed in Node with a stubbed `customElements` registry, and in a
  Rollup production build where the import is dropped entirely.
- **`SVGElement.className` is an `SVGAnimatedString`**, which has no `split`. Real DOM throws where
  the plain-object test stand-in does not.
- **Hiding or disabling the element that holds focus moves `document.activeElement` to `<body>`.**
  Chromium does not restore focus to a sibling, a parent, or the previously focused element.
  Confirmed twice, on Toast dismissal and on Number Stepper reaching `min`.
- **axe-core cannot see the UA canvas.** With `color-scheme: light dark` on the root and no painted
  background, dark-scheme text is blended over white and reported at around 1.09:1. axe-core 4.13.0
  does implement a `target-size` rule under the `wcag22aa` tag, so SC 2.5.8 is partly automatable —
  SC 2.2.1, SC 2.4.3, SC 2.4.11, and focus-indicator contrast are not.
- **`popover` on the Combobox surface is the authored wrapper, not the listbox**, and the surface
  opens on `ArrowDown` rather than on clicking the input. A selector aimed at `[role=listbox]`
  reports the surface as closed while it is open, which is worth knowing before writing an assertion
  about it.

## Decisions taken on the open questions

The plan left four questions open. Each was decided before the work that depended on it.

**Registration: a new `register/*` tier, not either option the plan offered.** The plan framed it as
self-registering `define/*` versus teaching the call. The answer was neither: `define/*` keeps its
current contract exactly — a function, no side effect, safe to import while server rendering — and a
sibling `register/*` tier carries the side effect.
`import '@timelessui/components/register/ui-tabs'` registers; `@timelessui/components/register`
registers everything.

That is better than both. Self-registering `define/*` would have made the same module both a
function and a side effect, and `targetWindow` — the reason the function exists — unreachable from
the documented path. Teaching the call everywhere would have left every consumer who already copied
a bare import silently broken, and it makes the common case wordier than it needs to be. Two tiers
name the two things: `register/` is "make this work", `define/` is "I will decide when".

The cost is one more entry point per element, so `sideEffects` now lists `./dist/register.js` and
`./dist/register/*.js`, and the tier is generated rather than written 23 times.
`register/browser.ts` is the only hand-written file in it, and it holds the one decision worth
stating: a `register/*` import is inert on the server. Which has a consequence the docs now say out
loud — an import that only ever runs on the server registers nothing.

**The dark accent: `#66b0ff`, and the light one moved too.** The first attempt paired `--ui-accent`
as `light-dark(#0064d8, #5aa9ff)`, checked against the four surface tokens and `--ui-accent-soft`
over each. That was not enough, and the sweep said so: an accent link inside a _danger_ alert
measured 4.35:1. A foreground has to clear every fill it can land on, not the fill named after it —
a link is a link inside any alert variant, and so is a muted description.

Re-derived against all four soft fills over all four surfaces, three tokens needed to move:
`--ui-accent` to `light-dark(#0056bd, #66b0ff)`, `--ui-fg-muted` to `light-dark(#5c6069, #a5a7b0)`,
and the dark `--ui-danger` to `#f98080`, which had been sitting on 4.498:1 against its own soft
fill. The semantic foregrounds are held to the fills they can actually meet — plain surfaces and
their own soft — because "danger text on a warning fill" is a combination no component produces and
a consumer's own call.

**`Page Up` / `Page Down`: deleted, all five rows.** The APG asks for it in none of the five
patterns, `collectionNavigationTarget` never implemented it, and implementing it would have meant
new keyboard behavior in five components to satisfy a row nobody had asked for.
`gridCollectionNavigationTarget` keeps its export rather than being deleted with the claims: it is a
legitimate helper on the public `./collection` path for a consumer building a grid, and its
docstring now says that it is intentionally uncalled and that page keys belong in the linear helper
if a component ever needs them.

Checkbox Group's whole table went the same way, for the same reason in reverse: each checkbox being
its own tab stop _is_ the APG treatment, so the implementation was right and the declaration was
wrong. The note now says so, and points at Listbox with `multiple` for the case that wants one tab
stop.

**Docs versus npm: release 0.2.0.** The drift exists because the navigation set shipped to the site
and never to npm, and this milestone's fixes need a release to reach anyone regardless. Gating the
gh-pages deploy on a tag was rejected: it would hold every prose fix until the next release, which
is a worse failure than the one being fixed. Marking unpublished components on their page was
rejected as solving a problem that only exists between a merge and a release.

## Constraints found during the audit

- **The audit harness stays out of the repository.** It is 500 lines of scratch code whose value was
  in being written from the outside. What belongs in the repository is the four gates it justifies
  (F19–F22), each of which must fail on `705ea85` before it is considered done.
- **Pixel diffing is not enough for state verification.** Comparing default against hover
  screenshots flagged Combobox, Range Field, Switch, and Tabs as having no hover state; re-checking
  with computed style deltas across 90 controls showed Tabs and Combobox were fine (the sampled
  control was the already-selected tab), and that the real answer was F23's four unstyled controls.
  Both passes were needed: the pixel diff found the candidates, the computed-style pass told the
  truth about them.
- **Disabled controls legitimately have no states.** Toolbar's "Comment" and Menu's "Delete"
  reported no hover, focus, or active change and no `:focus-visible`; both are disabled in the
  documented markup. Anything auditing states has to exclude them or it reports noise.
- **`--ui-bg-accent` must not be paired.** It is a fill behind a light foreground; pairing it would
  break the primary button in dark mode. Only tokens used as foreground need a dark branch, which is
  the distinction `--ui-accent` did not draw for itself, and the token file now says so.

## Constraints found during implementation

**A comment in a shared module is shipped bytes.** `check-performance.mjs` failed on seven
entrypoints at once after a ten-line docstring went into `collection.ts` — every collection imports
it. The stylesheet comments were the same: four lines of prose in
`themes/atmosphere/number-stepper.css` grew that component's gzipped CSS by 19%. Both were trimmed
to a line, with the reasoning kept in the registry notes and here. Toast's remaining +18% is real
code — five listeners, a focus-return path, and the sibling walk — and the baseline moved to record
it, which is what the gate's own docstring asks for.

**A shallow gate needs the right scope.** `check-keyboard-contracts.mjs` began by collecting every
key pressed anywhere in the suite, which would have missed the Checkbox Group drift completely:
arrows are pressed constantly, by Radio Group and Toolbar and Listbox. Scoping evidence to files
that name the component fixed that but over-fired eleven times, because the e2e specs address
components through story routes and `getByRole` rather than by tag. The version that shipped keeps
the generous scope for the press check and adds a second, precise one: a component declaring
navigation keys must have a `keydown` handler in its module. Two checks, one loose and one tight,
catch what neither does alone.

**Painting the surface is not optional for a colour-contrast sweep.** With
`color-scheme: light dark` and nothing painted, Chromium draws a dark canvas and axe assumes white —
119 dark-scheme routes failed identically at 1.09:1, all artifact. Painting `--ui-bg-page` before
scanning removed all 119 and uncovered two real failures the artifact had been hiding, both in the
light scheme, both composites over a tinted fill. So the artifact was not merely noisy; it was
masking.

**Not every accessibility number is core's to fix.** Seven components fall under SC 2.5.8's 24×24
once the theme's sizing is gone. Putting a floor in core would fix the number and impose a layout
decision on exactly the consumer core exists to serve — a dense tool that satisfies 2.5.8 through
the spacing exemption instead. The set is recorded in `core-only.spec.ts` and the assertion is about
the eighth component; the README and the CSS guide say plainly that target size leaves with the
theme.

## Summary

Twenty-six findings, all closed, plus five more the new gates found while closing them.

**Registration.** A third `register/*` entry-point tier, generated per element plus an aggregate,
with the side effect and the server guard that `define/*` deliberately does not have. `define/*` is
unchanged. `check-exports.mjs` now imports every module of both tiers under a fabricated window and
asserts that one registers and the other does not — the gate that would have caught the original
bug, and it fails against a `register/` module that registers nothing. The generated Install block,
nine guides, `reference/packages.mdx`, the packaged skill, and `context7.json` all say the same
thing, and `custom-elements.json` carries a `timeless:registration` block so the documentation
renderer reads the export name rather than rebuilding it from a tag.

**Colour.** Three foreground tokens re-derived against every fill they can land on: `--ui-accent`,
`--ui-fg-muted`, and the dark `--ui-danger`. The axe sweep runs both colour schemes over a painted
surface, which is what makes the numbers real, and the guide pages joined the website sweep — where
they immediately found a 4.48:1 inline `code` inside a link and a horizontally scrolling table with
no keyboard access, both live on the site and both fixed.

**Focus.** Toast pauses its dismiss timer while hovered or focused and hands focus to a surviving
toast or back where it came from; Number Stepper, Select, and Combobox mark their controls
`aria-disabled` rather than disabling the element the user is pressing. Four e2e assertions cover
the two shapes.

**Contracts.** Five `Page Up / Page Down` rows and Checkbox Group's whole table deleted as fiction;
Menu Button's two arrow keys implemented, because the APG asks for them and the platform does not
provide them; Toggle Group's pattern corrected from Button to Toolbar; Menu no longer rewrites an
author's `disabled`; six new `accessibility()` blocks, and a reference page with no block now says
what its absence means instead of ending on three generic lines. `check-keyboard-contracts.mjs`
proves all 49 declared rows against a test that presses them, and refuses a component that declares
navigation keys with no `keydown` handler.

**Documentation reach.** `ui-textarea` has a home on the Field page, and `validate-docs.mjs` fails
on any public root no catalog entry claims. The skill's contract reference gained every value set —
40 of them, 1.8 kB — so an agent reading it offline or through context7 can enumerate permitted
values without fetching a URL, and it now says outright that a root name is not a page slug, which
is what sent agents to `/docs/components/textarea.md`.

The audit harness was re-run against the fixed tree, from the freshly built documentation with the
Install blocks taken verbatim and nothing rewritten. Light and dark are both clean at zero
violations across all 49 components, the markup validator no longer throws on the three pages whose
own markup contains an SVG, and focus survives both the toast timeout and the stepper bound.

## Validation results

`pnpm qa` green end to end, in one run:

| Gate                          | Before (`705ea85`)       | After                                                      |
| ----------------------------- | ------------------------ | ---------------------------------------------------------- |
| `pnpm test:e2e`               | 422 passed               | **599** passed — 114 dark-scheme axe scans, 19 guide pages |
| `pnpm test`                   | 362 passed               | **364** passed                                             |
| `pnpm typecheck`              | 0 errors                 | 0 errors                                                   |
| `pnpm format:check`           | pass, 583 files          | pass, 612 files                                            |
| `pnpm contracts:check`        | 4 scripts                | 4 scripts, plus `keyboard:validate` in the package build   |
| `pnpm -F @apps/web test:dist` | 49 component routes      | 49 component and 19 guide routes, 69 llms.txt links        |
| `pnpm publint`                | 1 suggestion per package | **All good** on all three                                  |
| `pnpm attw`                   | pass                     | pass                                                       |

New gates, each confirmed to fail on `705ea85` before being accepted:

| Gate                                                   | Catches                                                         | Proven by                                                            |
| ------------------------------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------- |
| `check-exports.mjs` registration probe                 | a `register/*` module that registers nothing, and the inverse   | emptying `dist/register/ui-tabs.js` — fails                          |
| `check-keyboard-contracts.mjs`                         | a declared key no test presses; navigation keys with no handler | restoring both drifts — fails on all five Page rows                  |
| `a11y.spec.ts` in both schemes, over a painted surface | a colour token with one value                                   | un-pairing `--ui-accent` — fails on 8 dark routes                    |
| `validate-docs.mjs` unclaimed-root check               | a public root no page documents                                 | removing `textarea` from the Field entry — fails                     |
| `website.spec.ts` guide sweep                          | the 19 guides, in both themes                                   | found 2 live failures on first run                                   |
| `core-only.spec.ts` over every example                 | a component that stops being usable without the theme           | found Colour Picker and Number Stepper, which the 4-item list missed |

Re-run of the audit harness against the fixed tree, generated from the freshly built documentation
with the Install blocks taken verbatim:

| Check                                   | Before                           | After                                                     |
| --------------------------------------- | -------------------------------- | --------------------------------------------------------- |
| Production `vite build` of every page   | failed to resolve 4 stylesheets  | builds, 49 pages                                          |
| Custom elements upgraded                | 0 of 23 following the docs       | 23 of 23                                                  |
| `validateTimelessMarkup()`              | threw on 3 pages                 | no throw                                                  |
| axe, light scheme, painted surface      | 0 violations                     | 0 violations                                              |
| axe, dark scheme, painted surface       | 6 violations across 5 components | 0 violations                                              |
| Focus after Toast timeout with focus in | `<body>`                         | still on the dismiss control, and the toast is still open |
| Focus after Number Stepper hits `min`   | `<body>`                         | still on the step button                                  |

One number moved the wrong way and was accepted: `performance-baselines.json` records Toast at +18%
gzipped, for the timer pause and the focus return. The comment-driven growth that came with it was
trimmed rather than baselined — see the constraints above.

---

Generated by Claude Opus 5 (High)

Implemented by Claude Opus 5 (High)
