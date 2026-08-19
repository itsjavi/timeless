---
status: Accepted
---

# Milestone 025 Plan: The Navigation Set

## Goal

Add the three navigation components every application has and Timeless does not: Breadcrumb,
Pagination, and Navigation Menu. Two of the three are CSS over native markup with no JavaScript at
all, which makes this the cheapest milestone in the sequence by a wide margin — and the one where
the library's CSS-first thesis is easiest to demonstrate.

## Context

shadcn/ui ships all three. Base UI ships only Navigation Menu, because Breadcrumb and Pagination
need no behavior and a behavior-only library has nothing to contribute. Timeless is a CSS-first
library, so the two shadcn has and Base UI does not are precisely the two Timeless should find
easiest.

### What the study found

**1. None of the three exists.** A repo-wide grep for "breadcrumb" returns one hit, an unrelated
string in `apps/web/src/scripts/not-found.ts:40`. "pagination" and "navigation menu" return zero.

**2. `aria-current` appears exactly once in the entire repository** — `menu.css:75` — and is written
by no JavaScript. All three of these components depend on it: a breadcrumb's last crumb is
`aria-current="page"`, a pagination's current page is `aria-current="page"`, and a navigation menu's
active link is too. It must be declared as a state with `state('current', 'aria', true, …)` and
selected as `[aria-current='page']`, because `validate-contracts.mjs`'s
`IGNORED_SELECTOR_ATTRIBUTES` (lines 23-37) does not list it and nothing sets it automatically. It
stays author-supplied — the library does not know which page you are on.

**3. Menubar is already covered, so Navigation Menu needs justifying.** `ui-menu` supports
`role="menubar"` and `ui-menu-button` provides a triggered surface. Before adding an element, prove
that composition does not already cover the requirement. The real gap is narrower than "a navigation
menu":

- A menu of **links** must not use `role="menu"`. APG menus are for commands; a nav of links wants
  `<nav>` with a plain list, and arrow-key roving focus is wrong there because links are
  individually tabbable. Getting this wrong is the single most common navigation-accessibility
  mistake, and both peers document it.
- The behavior worth having is the **shared panel**: several triggers, one surface, and the pointer
  moving between triggers without closing and reopening.

**4. Spacing tokens stop at `--ui-space-5` (1rem).** The ladder is 0.25, 0.375, 0.5, 0.75, 1rem.
Every gap here must come from it, or a token is added to **both** `tokens.css` and `src/tokens.ts` —
the build checks they agree.

**5. `.ui-group[data-ui-attached]` already exists** and does what a pagination control strip needs,
so Pagination should reuse it rather than re-declaring adjacency and border-radius joining.

**6. The catalog's `domain` and `group` are already decoupled, and messier than expected.**
`domain: 'navigation'` currently holds eight entries — `checkbox-group`, `combobox`, `listbox`,
`menu`, `menu-button`, `radio-group`, `select`, and `toolbar` — while `tabs` is `domain: 'overlays'`
with `group: 'Navigation'`. So `domain` is a legacy route segment and `group` is the sidebar. New
components must pick both deliberately, and the three-way naming contract must hold: the story
`meta.title` is `Library/<Domain>/<Component>` where the slugified domain equals the catalog
`domain` and the slugified component equals the catalog `id`. A mismatch surfaces only as
`Missing internal site targets:` during `pnpm build:site`.

### Decisions taken

1. **Breadcrumb is CSS-only.** `<nav>` + `<ol>` + `<li>` + `<a>`, with the current crumb as
   `aria-current="page"` and not a link. No element, no script.
2. **Pagination is CSS-only.** `<nav>` + `<ul>` of links, reusing `.ui-group`. Page _links_ are
   links — they navigate, they are shareable, they work with middle-click and browser history. A JS
   pagination element that swallows clicks would be strictly worse.
3. **The separator is a CSS pseudo-element, not authored markup.** A breadcrumb separator is
   decoration and must not be announced. `::after` on the `li` with `content` and `aria-hidden`
   semantics-by-construction beats an authored `<span aria-hidden="true">/</span>` the consumer has
   to remember. Offer a `data-ui-separator` value set for the glyph.
4. **Navigation Menu is a custom element, `ui-nav-menu`, and only because of the shared panel.** If
   a prototype shows `ui-popover` composition covers it, do not add the element — record that and
   stop. The bar for a new element here is the shared-panel behavior, nothing else.
5. **Pagination's parts are named to avoid colliding with milestone 022.** 022 gives the collection
   surfaces a `pager` part for paging _options_; this milestone's component paginates _pages_.
   Reserve `ui-pagination` and its `page`, `previous`, `next`, and `ellipsis` parts, and never reuse
   `pager` here.

## Architecture

- Breadcrumb and Pagination are `css()` registry entries with a `.ui-*` root and `data-ui-*`
  configuration. They add no JavaScript, no `define/` entrypoint, no `package.json` subpath, and no
  `preview-runtime.ts` loader.
- Truncation in both is a CSS-only affair. A long breadcrumb collapses with `overflow`,
  `text-overflow`, and `min-inline-size: 0` on the middle crumbs; the first and last stay legible.
  Do not measure anything in JavaScript.
- Pagination's ellipsis is authored content with `aria-hidden`, because "…" between page 3 and page
  40 is a real gap a screen-reader user should not hear as a page.
- `ui-nav-menu`, if it survives step 3's prototype, enhances authored `<nav>` markup: triggers stay
  `<button>`, panels stay authored, and it manages `aria-expanded`, the shared-panel switching, and
  the intent delay. It writes no visual declarations and generates no elements.
- `aria-current` is author-supplied everywhere. The library declares and styles the state; it never
  decides which page you are on.

## Constraints

- **`aria-current` must be a declared state.** `validate-contracts.mjs`'s
  `IGNORED_SELECTOR_ATTRIBUTES` does not cover it, so a CSS selector on `[aria-current='page']`
  without a matching `state()` declaration will not pass — and a declared state with no selector
  will not either.
- **Every gap must come from `--ui-space-1..5`.** Adding a token means editing `tokens.css` **and**
  `src/tokens.ts`, or `contracts:validate` throws `tokens.css declares undocumented public tokens`.
- **Every declared `data-ui-*` value needs a CSS selector, or must be the attribute default**, in
  the same commit.
- **`contracts.test.ts` asserts a non-empty description for every attribute, part, state, variable,
  and event, and that every default is a member of its own value set.** Placeholders fail
  `pnpm test`.
- **`packages/examples/scripts/validate.mjs`** rejects any example using an undeclared part token,
  public attribute, or uncatalogued class. Registry, generate, examples — in that order.
- Every new stylesheet needs an `@import` in the hand-maintained
  `packages/components/src/css/components.css` and a reference from at least one catalog example's
  `styles`, or `Undocumented CSS exports` fires.
- A CSS-only component still needs its value re-exports wired by hand: `pnpm generate` writes
  `src/values/<module>.ts`, but nothing makes it public. The behavior or primitives module must
  re-export it and `src/index.ts` must export that, or the only signal is a TypeScript error in
  whichever story imports the name.
- `ui-nav-menu`, if added, is the full 16-step element sequence including the `./nav-menu`
  `package.json` subpath (`check-exports.mjs` derives it as `./${tag.slice(3)}`), the tag in
  `define.test.ts`, and the `preview-runtime.ts` loader.
- `apps/web/src/content/docs/docs/index.mdx` carries a **hardcoded component count** with no
  validator. Update it, or better, derive it from `examples.length` and close the gap permanently.
- `apps/stories/story-routes.json` is generated by `pnpm build:stories` and committed;
  `a11y.spec.ts` creates one axe test per route. Regenerate and commit it.
- `pnpm qa` omits `exports:validate`, `generated-dom:check`, `performance:check`,
  `boundaries:check`, `pnpm -F @timelessui/examples test`, and `pnpm -F @apps/web test`. Run them
  and name them.
- **Do not add `ui-pagination` as a custom element.** It is listed here explicitly because it is the
  obvious wrong turn: page navigation is links, and a component that intercepts them loses history,
  middle-click, and shareable URLs.

## Implementation sequence

### 1. Breadcrumb — CSS only

Registry:
`css('breadcrumb', 'ui-breadcrumb', 'breadcrumb.css', attributes, parts, states, variables, a11y)`.

- Attributes: `data-ui-separator` against a new `breadcrumbSeparators` set — `['chevron', 'slash']`
  is enough; do not ship a glyph zoo. Plus `data-ui-density` from the existing `compactDensities`.
- Parts: `item`, `link`, and `current`. The separator is a pseudo-element, not a part.
- State: `current`, via `state('current', 'aria', true, …)`, selected as `[aria-current='page']`.
- Accessibility: `<nav>` with an accessible name, an `<ol>`, the last item carrying
  `aria-current="page"` and **not** wrapped in an `<a>`. There is no APG "breadcrumb pattern" as
  such — it is under Landmarks and the `aria-current` guidance — so set `accessibility()` to that
  composition and check it against `.agents/skills/verify-apg-conformance/SKILL.md` rather than
  inventing anything.
- Stylesheet: the separator via `li + li::before` or `li:not(:last-child)::after`, so it is
  generated content and inaudible by construction. Truncation for long chains with
  `min-inline-size: 0` and `text-overflow: ellipsis` on the middle crumbs.
- The example factory must emit the accessible name on the `<nav>`, the `<ol>`, and the
  `aria-current="page"` on an unlinked final crumb — that is the copyable source, and getting it
  wrong ships the mistake to every consumer.

### 2. Pagination — CSS only

Registry: `css('pagination', 'ui-pagination', 'pagination.css', …)`.

- Attributes: `data-ui-size` from the existing `formControlSizes` or `buttonSizes` — reuse an
  existing set rather than declaring a fourth `sm | md | lg`; AGENTS.md permits separate names only
  when they are separate public exports, and this is not.
- Parts: `item`, `link`, `previous`, `next`, `ellipsis`. **Not** `pager` — milestone 022 owns that
  name for paging options inside a collection surface.
- State: `current`, selected as `[aria-current='page']`.
- Accessibility: `<nav>` with an accessible name, a list of links, the current page as
  `aria-current="page"` and not a link, previous and next as links with accessible names that say
  what they do rather than "‹" and "›", and the ellipsis `aria-hidden`.
- Reuse `.ui-group[data-ui-attached]` for the joined strip rather than re-declaring adjacency and
  border-radius joining.
- Disabled previous or next at the boundary: because these are links, "disabled" means **absent or
  not a link**, not `aria-disabled` on an `<a>`. A disabled link is a contradiction. Render the
  boundary control as a non-link `<span>` and document that.

### 3. Navigation Menu — prototype before committing

**Prove the element is necessary before adding it.** Build a `<nav>` composed from `ui-popover`
triggers and check whether it covers the requirement. Two outcomes, both acceptable:

- **Composition suffices** → write a documented recipe, add no element, and record the decision.
  This is the better outcome and should be genuinely hoped for.
- **The shared panel needs coordination** → add `ui-nav-menu`.

If the element is added:

- Anatomy: `<nav>` host, `<button>` triggers as a `trigger` part, authored panels as a `panel` part,
  and a `link` part inside them.
- It manages `aria-expanded` on triggers, `aria-controls` to panels, opening on hover with an intent
  delay and on focus, closing on Escape and outside interaction via core's dismissable-layer
  controller, and moving between triggers **without** closing and reopening — that last behavior is
  the entire justification for the element.
- **No `role="menu"` and no arrow-key roving focus.** These are links; `Tab` is the correct
  traversal and the panels are regions, not menus. State this in the contract and in the docs,
  because it is the mistake this component exists to prevent.
- Full 16-step element sequence.

### 4. Documentation and the boundary

- Milestone 021 published the "will not ship" page. Add nothing to it here, but check that
  Breadcrumb and Pagination were not listed on it — if they were, the page needs correcting rather
  than contradicting.
- Update the hardcoded component count in `apps/web/src/content/docs/docs/index.mdx`, or derive it
  from `examples.length` so it stops being a manual step for every future milestone.
- Pick `domain` and `group` deliberately for all three. `group: 'Navigation'` for all; `domain`
  decides the StoryLite route and therefore the story `meta.title`. Note that `tabs` sits in
  `domain: 'overlays'` with `group: 'Navigation'`, so there is precedent for the two differing — but
  do not add to the mess without a reason.

### 5. Milestone records

`RESULTS.md` records whether `ui-nav-menu` was added or composition sufficed and why, the truncation
approach and how it behaves at narrow widths, the boundary-control decision for Pagination, and
whether the component count was hardcoded again or derived.

## Verification

1. **No-JavaScript is the primary test, not a footnote.** Breadcrumb and Pagination must be fully
   functional in `no-javascript.spec.ts`: every link navigable, the current page marked, the
   separator present. If they are not, they were built wrong.
2. **Accessibility** — `a11y.spec.ts` over the new routes, plus `verify-apg-conformance`.
   Specifically assert: the `<nav>` landmarks have accessible names; the breadcrumb's final crumb is
   not a link and is `aria-current="page"`; the separator is **not** in the accessibility tree;
   pagination's ellipsis is `aria-hidden`; previous and next have names that describe them.
3. **Truncation** — an E2E at a narrow viewport with a deep breadcrumb, asserting the first and last
   crumbs stay legible and the container does not scroll horizontally.
4. **Navigation Menu, if added** — E2E for hover-open with the intent delay, focus-open, Escape,
   outside dismissal, and moving between triggers without a close-reopen flicker. Assert **no**
   `role="menu"` and that `Tab` traverses the links.
5. **Contracts** — `contracts:validate` must prove `aria-current` is both declared and selected, and
   every `data-ui-*` value likewise. `pnpm test` covers the description and default assertions.
6. **CI-only gates, run locally and named in `RESULTS.md`** — `exports:validate` (after
   `build:packages`), `generated-dom:check`, `performance:check`, `boundaries:check`,
   `pnpm -F @timelessui/examples test`, `pnpm -F @apps/web test`.
7. **Full gate** — `pnpm qa`.

```bash
pnpm qa
```

## Acceptance

- `.ui-breadcrumb` and `.ui-pagination` exist as CSS-only contracts with no JavaScript module, no
  `define/` entrypoint, no `package.json` subpath, and no `preview-runtime.ts` loader.
- Both are fully functional with scripting disabled, proven by `no-javascript.spec.ts`.
- `aria-current` is a declared state on both, selected as `[aria-current='page']`, and
  author-supplied.
- A breadcrumb's final crumb is `aria-current="page"` and is not a link; its separator is generated
  content and is absent from the accessibility tree; a deep breadcrumb truncates without horizontal
  page scrolling at a narrow viewport.
- Pagination reuses `.ui-group[data-ui-attached]`, names its parts `item`, `link`, `previous`,
  `next`, and `ellipsis` — never `pager` — renders its ellipsis `aria-hidden`, gives previous and
  next descriptive accessible names, and renders a boundary control as a non-link rather than a
  disabled link.
- Either `ui-nav-menu` exists and its justification is the shared-panel behavior, or it does not
  exist and a documented composition recipe replaced it. Whichever happened is recorded with the
  reasoning.
- If `ui-nav-menu` exists: it uses no `role="menu"`, no arrow-key roving focus, `Tab` traverses its
  links, moving between triggers does not close and reopen the panel, and the contract says so
  explicitly.
- Every gap comes from `--ui-space-1..5`, or a new token was added to both `tokens.css` and
  `src/tokens.ts`.
- No fourth `sm | md | lg` value set was declared; an existing one is reused.
- Every new attribute, part, state, and variable has a real description, and every default belongs
  to its own value set.
- The component count in `docs/index.mdx` is correct, and ideally derived from `examples.length`
  rather than hardcoded again.
- `story-routes.json` is regenerated and committed, and the axe sweep count grew by the number of
  routes added.
- Every CI-only gate was run locally and is named in `RESULTS.md`.
- `pnpm qa` is green.

---

Generated by Claude Opus 5 - High reasoning
