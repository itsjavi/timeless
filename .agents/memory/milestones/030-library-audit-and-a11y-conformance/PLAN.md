---
status: Proposed
---

# Milestone 030 Plan: End-to-End Audit and WCAG 2.2 AA Conformance

## Goal

Close the twenty-six findings from the end-to-end audit of the published library, and close the four
gates whose absence let the worst of them ship green. The audit consumed
`@timelessui/components@0.1.0` from npm in a real Vite build, authored every page from the published
documentation rather than from the repository, and drove all forty-seven documented components
through their interactive states in both colour schemes, with and without the Atmosphere theme.

Two findings are large enough to state on their own. Following the published registration
instructions registers nothing, so every custom element a consumer authors stays inert. And
`--ui-accent` is the only colour token in the theme with no `light-dark()` pair, so accent text
measures 2.6–3.4:1 on dark surfaces where AA requires 4.5:1.

## Context

The repository was green at `705ea85` before the audit and green after it: 422 Playwright tests, 362
unit tests, every contract validator, `publint`, `attw`, and the agent-surface validator. Nothing
below was found by loosening a gate. It was found by doing the one thing the suite does not do —
installing the published tarball and following the published instructions — and by varying the two
axes the suite holds fixed: the colour scheme, and whether a control is being used rather than
merely rendered.

That is the shape of this milestone. Most findings are not rescues of broken components; the
components are unusually well built, and light-mode axe across all forty-seven pages is clean at
zero violations. They are places where a documented claim outran the code, or where a state nobody
automated turned out to be the failing one.

### The audit's method, because the findings depend on it

The harness is a throwaway consumer, not a fixture in this repository:

1. `npm pack` the three published tarballs, install `@timelessui/components@0.1.0` from the registry
   into a bare Vite project with no workspace link.
2. Fetch all forty-nine `/docs/components/<name>.md` routes from `timeless.build` and generate one
   page per component from each page's own `## Markup` fence and `## Install` fence — so the
   consumer's markup and imports are literally what the documentation prescribes, and any mismatch
   between prose and package surfaces as a build or runtime failure rather than as an opinion.
3. Run a production `vite build`, serve it, and drive every page.

Step 2 is what makes the register-nothing finding unavoidable rather than arguable: the generator
copies the Install block verbatim, so twenty-three of forty-nine pages produced a bundle with no
`customElements.define` call anywhere in it.

### What the audit confirmed rather than faulted

Recorded so it is not re-litigated:

- Light-scheme axe over all forty-seven components, in the states the pages render, is **zero**
  violations at `wcag2a` through `wcag22aa`.
- No console error, no page error, and no failed request on any page.
- Every documented CSS import except the four belonging to unpublished components resolves in the
  published tarball.
- Every `ui-*` tag in every documented markup fence has a matching `define/` entry point, upgrades,
  and reports a real constructor rather than `HTMLElement`.
- Dropping the theme leaves all forty-seven upgraded, with every anchored popover surface still
  opening beside its trigger.
- Roving focus, `Home`/`End`, orientation, and disabled-item handling are correct in Tabs, Toolbar,
  Listbox, Toggle Group, Menu, and Radio Group.
- No hard WCAG 2.2 SC 2.5.8 failure in the themed build.

## Scope

Six workstreams, sequenced so that the two consumer-blocking findings land first and the gates that
would have caught them land immediately after — a fix without its gate is the same finding waiting
to recur.

### 1. Registration, and the prose that describes it

`dist/define/ui-*.js` exports `defineXElement()` and has no module-level side effect, so a bare
`import '@timelessui/components/define/ui-tabs'` registers nothing. `installation.mdx` frames that
bare import as _the_ registration mechanism and contrasts it with the class entry point that "gives
you the class and helpers **without** registering anything", so the documented intent is clear and
the module does not honour it.

Two ways to reconcile them, and the choice is the milestone's first open decision — see
`RESULTS.md`. Whichever wins, the generated Install block, `installation.mdx`, `quick-start.mdx`,
`concepts/index.mdx`, the six framework guides, `reference/packages.mdx`, the packaged skill, and
`context7.json` rule 10 must all agree with it, and a test must consume the published surface the
way the docs describe.

### 2. The dark scheme

`--ui-accent: #0064d8` carries no `light-dark()` pair while `--ui-fg`, `--ui-fg-muted`,
`--ui-success`, `--ui-warning`, `--ui-danger`, and `--ui-accent-soft` all do. Accent-coloured _text_
therefore keeps a mid-blue on dark surfaces. Measured, with the page surface painted so axe can see
it: Tabs selected tab 2.87:1, Listbox selected option 2.62:1, Menu checked items 2.87:1, Card link
3.18:1, inline link 3.44:1.

`--ui-focus` is `color-mix(in oklab, var(--ui-accent), transparent 25%)`, so the focus ring inherits
the same non-adapting hue and needs checking against SC 1.4.11's 3:1 for non-text contrast.
`--ui-accent-hover` and `--ui-accent-active` are darker than the base, which is the wrong direction
on a dark surface and also unpaired.

The fix is small. The gate is the point: the axe sweep must run both schemes.

### 3. Focus preservation and timing

Three failures share one cause — the library hides or disables an element that currently holds
focus, and the browser drops focus to `<body>`:

- Toast auto-dismisses after 5000 ms with a timer that never pauses on hover or focus. Reaching for
  its own Dismiss button does not stop it. That is SC 2.2.1 as well as SC 2.4.3.
- Number Stepper sets `button.disabled = true` at the bounds, so activating Decrease at `min` ejects
  the keyboard user to the top of the document. Menu's own accessibility note already argues for the
  `aria-disabled` treatment that would prevent this; Number Stepper does not use it.

### 4. Declared keyboard contracts that are not implemented

`COLLECTION_KEYS` declares a `Page Up / Page Down` row for Toolbar, Radio Group, Checkbox Group,
Listbox, and Toggle Group. `collectionNavigationTarget` handles `Home`, `End`, and the four arrows
and returns `null` for everything else. `gridCollectionNavigationTarget` does implement the Page
keys and no component calls it. Checkbox Group additionally has no `keydown` handler at all, so its
whole declared table — arrows, `Home`/`End`, and the Page keys — is fiction.

These rows are not merely on a web page. They are in `contracts.ts`, in `llms-full.txt`, and in the
contract table shipped inside the package's agent skill, which is exactly the surface a model treats
as authoritative.

So the remedy is a decision per row — implement it or delete it — plus the gate that makes a third
occurrence impossible: no declared key without a test that presses it.

### 5. Contracts that describe the wrong thing

- Toggle Group declares the APG **Button** pattern and links readers to it, while rendering
  `role="toolbar"` with roving tabindex, `Home`/`End`, and one tab stop. That is the **Toolbar**
  pattern.
- Menu deletes an author's `disabled` attribute and writes `aria-disabled="true"` in its place. The
  treatment is right; doing it by mutation is not, because the documented markup then differs from
  the shipped markup, the pre-JavaScript state is a genuinely unfocusable item, and consumer CSS
  keyed on `:disabled` stops matching after upgrade. Toolbar, meanwhile, keeps real `disabled` and
  skips the item.
- Thirty-eight of sixty-one roots carry no `accessibility()` block, so their reference page renders
  only the generic paragraph. Defensible for Separator; not for Number Stepper (Spinbutton), Color
  Picker, Toast and Toaster (a live region with a time limit), Switch, or Alert.
- `COLLECTION_KEYS` builds its plural by appending `s`, so the published contract for Checkbox Group
  reads "Jump ten checkboxs at a time".

### 6. Documentation reach and release coupling

- `ui-textarea` is a public, styled root listed in the packaged skill's contract table and named on
  no documentation page, in no `llms.txt` entry, and in no catalog entry.
- The skill and `context7.json` both tell agents to fetch `/docs/components/<component>.md`. That
  route is keyed by catalog id, not by root, so `ui-input` and `ui-textarea` 404 — and the contract
  table gives no mapping from the root it lists to the page that documents it.
- `context7.json` indexes `apps/web/src/content/docs`, where zero component pages live: all
  forty-nine are generated at build time from the registry. The richest agent surface in the project
  is invisible to the integration the project advertises for agents.
- gh-pages deploys on every push to `main`; npm publishes only on a tag. Breadcrumb and Pagination
  are documented live, with Install blocks importing four stylesheets absent from 0.1.0. A consumer
  following those pages gets a Rollup resolution failure, which is how this was found.

## Constraints

- **The audit harness is throwaway; the gates are not.** Findings were produced by a scratch
  consumer, but every gate this milestone adds must live in `apps/e2e` or
  `packages/components/scripts` and run under `pnpm qa`.
- **`--ui-bg-accent` must stay scheme-independent.** It is a fill behind a light foreground, and
  pairing it would break the primary button. Only the tokens used as _foreground_ need a dark
  branch.
- **Sizing stays in the theme.** `check-core-boundary.mjs` rule 2 forbids a size in a core
  stylesheet, and the rule's own preamble records the bug that motivated it. The core-only Combobox
  surface measuring 63px instead of matching its trigger is that rule working as designed, so the
  remedy is either a named `core-exempt:` for `min-inline-size: anchor-size(width)` or a more
  precise README claim — not a quiet widening of the boundary.
- **Do not add ARIA to fix a focus bug.** Both focus-loss findings are fixed by not removing the
  focused element from the focus order, which means `aria-disabled` over `disabled` and a paused
  timer over a shorter one.
- **A deleted keyboard row is a valid fix.** Checkbox Group's arrow navigation is arguably wrong to
  add: native checkboxes are each a tab stop, which is the APG treatment. Deleting the declaration
  is then the correct change and the note should say why.

## Sequencing

1. Registration and its prose, with a published-surface test.
2. `--ui-accent` and the two-scheme axe sweep.
3. Focus preservation in Toast and Number Stepper, with a focus-survival helper both use.
4. The keyboard-contract decisions, with the gate that proves a declared key.
5. The contract corrections: Toggle Group's pattern, Menu's mutation, the missing `accessibility()`
   blocks, the plural.
6. Documentation reach: Textarea, the root-to-page mapping, context7's folders, and the
   docs-versus-npm coupling.

## Acceptance criteria

- A test installs or packs the published component surface, follows the documented registration
  instructions verbatim, and asserts every element upgrades.
- `validateTimelessMarkup()` runs over markup containing an inline `<svg>` without throwing, proven
  by a unit test using real DOM rather than the plain-object stand-in.
- The `apps/e2e` axe sweep runs every StoryLite route in both `light` and `dark`, over a painted
  surface, and is clean.
- No component removes or disables the element holding focus without moving focus somewhere
  deliberate; asserted for Toast dismissal and for Number Stepper at both bounds.
- Every key in every `accessibility().keys` table is exercised by a test, enforced by a script that
  fails when a declared key has no corresponding assertion.
- Every public root in the registry is named on a documentation page, enforced by
  `validate-agent-surfaces.mjs`.
- `pnpm qa` passes, and the guide pages join the axe sweep.

## Out of scope

- Adding hover treatments to `.ui-checkbox`, `.ui-radio`, `.ui-switch`, and `.ui-range`. Recorded as
  a finding; it is a design decision for the theme owner, not a conformance fix.
- Raising checkbox, radio, and colour-picker slider targets to 24 px. They pass today through the SC
  2.5.8 spacing exemption. Worth documenting so a consumer who tightens the gap knows what they
  lose, but changing the theme's density is a separate decision.
- The `publint` suggestion to write `repository.url` as `git+https://…` on the three manifests. A
  one-line fix, not worth a milestone step; do it in passing.

---

Generated by Claude Opus 5 (High)
