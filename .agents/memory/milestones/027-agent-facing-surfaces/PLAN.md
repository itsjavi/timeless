---
status: Proposed
---

# Milestone 027 Plan: Agent-Facing Surfaces

## Goal

Make Timeless usable by a coding agent working in someone else's project. Ship Markdown reachability
for every documentation page, a consumer-facing skill that states the attribute grammar, and the
index-presence files that let agents find either one — all generated from the contract registry and
gated, so no agent-facing claim can drift from the CSS.

## Context

The research behind this milestone is [`research/llm-support.md`](../../../research/llm-support.md)
(2026-08-19). Its conclusion, restated because it sets the priority order:

**The problem is not discovery. It is prior interference.** An agent writing UI code carries a large
React-and-Tailwind prior and no prior at all for "class root plus `data-ui-*` configuration, with a
registered custom element only where keyboard coordination demands it". Left alone it writes
`<ui-button variant="primary">` rather than `<button class="ui-button" data-ui-variant="primary">`,
puts configuration attributes on element hosts, and invents `data-ui-invalid="true"` where the
contract wants bare `invalid`. `AGENTS.md` legislates all three for contributors. Nothing states
them for consumers.

So the ranking is not which channel attracts crawlers. It is which channel puts the shortest correct
statement of the grammar into context at the moment markup is written.

### Measured baseline

Read from the working tree at `4b890ee` (`feat/023-form-completeness`):

| Fact                                               | Value                                               |
| -------------------------------------------------- | --------------------------------------------------- |
| `componentContracts` entries                       | 57 — 36 `kind: 'css'`, 21 `kind: 'custom-element'`  |
| Root kinds across those contracts                  | 35 `class`, 21 `element`, 1 `selector`              |
| Contracts carrying an `accessibility` block        | 19                                                  |
| Catalog examples                                   | 50 total, 45 documented, 5 `domain: 'recipes'`      |
| `custom-elements.json`                             | CEM 2.1.0, 100,794 bytes, 21 `tagName` declarations |
| MDX files under `apps/web/src/content/docs/`       | 18                                                  |
| Component reference pages with a Markdown source   | 0                                                   |
| Files matching `llms` anywhere outside `research/` | 0                                                   |

Two numbers set the whole shape of this plan.

**21 of 57.** The Custom Elements Manifest describes 37% of the library. The 36 CSS contracts have
no CEM representation — there is no manifest concept for "a `.ui-card` class root configured by
`data-ui-density`". Every CEM-consuming tool (`cem mcp`, `cem lsp`, `vscode-web-components-ai`) is
therefore blind to the majority of Timeless and to the half an agent is most likely to get wrong.
Anything that claims to describe the library must generate from `componentContracts`, never from the
manifest.

**45 and 0.** The 18 guides under `content/docs/` are MDX and have a Markdown source. The 45
component reference pages are not files at all — `pages/docs/components/[slug].astro` builds each
one at request time from `examples`/`getExample` plus `lib/component-docs`. So the pages carrying
the contract an agent needs are the exact pages with nothing to serve as Markdown.

### The constraint that shapes the design

This repository gates its factual claims. `validate-contracts.mjs` proves every declared value
against the stylesheets in both directions. `validate-docs.mjs` fails on an undocumented custom
element or CSS export. `validate-claims.mjs` fails when the landing page advertises a platform
feature the source does not use. `packages/examples/scripts/validate.mjs` has 17 throw conditions.

A hand-written `llms.txt` or a hand-written attribute table inside a skill would be the first
unvalidated public claim in the repository, and the first that no gate can catch. So:

**Every agent-facing artifact is generated from `componentContracts` or `examples`, or it is
authored prose that states no attribute, value, or root name.** Nothing in between. Where prose must
name a value, it links to a generated file instead of restating it — the pattern `.agents/skills/`
already uses with `.agents/reference/`.

### What the platform and the existing pipeline already own

`src/contracts.ts` exports `componentContracts` as typed TypeScript, with `kind` discriminating CSS
from custom element and `ComponentRoot` discriminating `class` from `element` from `selector`. That
is precisely the distinction agents get wrong, already machine-readable, already proven against the
CSS. Nothing needs to be parsed and nothing needs to be inferred — the grammar reference is a
projection.

`apps/web/src/lib/component-docs.ts` already exposes `documentedContracts`, `declarationsFor`,
`stylingFor`, `inlineCode`, and `inlineMarkdown`. The Markdown endpoint reads the same functions the
HTML page reads, so the two cannot disagree.

`example.render(example.defaultArgs)` returns the canonical consumer markup — the same string
StoryLite offers for copying. That string, not prose about it, is the highest-value payload in this
milestone.

## Plan

### 1. Markdown reachability

#### 1.1 Component reference pages

`apps/web/src/lib/component-markdown.ts` — a new module exporting
`componentMarkdown(example): Promise<string>`, built on the existing `component-docs` functions. It
emits, in the order the HTML page uses:

title and description, the install block (the same `imports` string `[slug].astro` composes),
`guidance` and `authoring` when present, the canonical markup from `example.render`, the anatomy
table, the attribute tables with permitted values and defaults, the element API for each
declaration, public state, styling, accessibility, the before-JavaScript note, and related
compositions.

`apps/web/src/pages/docs/components/[slug].md.ts` — a static endpoint whose `getStaticPaths` mirrors
`[slug].astro` exactly, including the `domain !== 'recipes'` filter, returning
`Content-Type: text/markdown; charset=utf-8`.

Extracting the derivation into a module rather than duplicating it in the endpoint is the point: one
source, two renderers.

#### 1.2 Guide pages

`starlight-dot-md` serves `.md`, `.mdx`, and `.mdoc` pages as raw Markdown at `<page>.md`. Verify it
supports Starlight 0.41 and Astro 7 before adopting it.

If it does not, write `apps/web/src/pages/docs/[...slug].md.ts` over `getCollection('docs')` and
emit `entry.body` with the import statements stripped. Around twenty lines, no dependency, and it
strips frontmatter and imports deliberately rather than incidentally. Component tags such as
`<Aside>` and `<Code>` are left in place — they are readable, and rewriting MDX into prose would be
a translation this milestone does not need.

Either route covers only the 18 MDX guides. The 45 component pages come from 1.1.

#### 1.3 `/llms.txt`

`apps/web/src/pages/llms.txt.ts`. Two parts:

- An authored preamble stating the grammar in as few lines as possible: the two component kinds,
  `data-ui-*` on class roots versus plain attributes on element hosts, boolean attributes by
  presence and never `="true"`, `data-ui-part` token lists, `data-ui-internal-*` as never-authored,
  and the `@timelessui/components/css/<file>` and `/define/<tag>` import paths.
- A generated index: the guides, then the 45 documented examples grouped by `ExampleGroup`, each
  line `- [Title](https://timeless.build/docs/components/<id>.md): description`, pointing at the
  `.md` route rather than the HTML one.

Budget: under 5,000 tokens, asserted by the validator in phase 5. Nuxt UI's `/llms.txt` sits at
roughly that size and its own documentation tells readers to prefer it over the full file.

#### 1.4 `/llms-full.txt`

`apps/web/src/pages/llms-full.txt.ts`, concatenating every emitted `.md`. Ship it only if it costs
nothing beyond the concatenation, and publish its measured token count beside the link so nobody
feeds a million tokens to a model by accident. If build time moves materially, drop it — 1.1 and 1.3
already cover the need and this file is the one Nuxt UI attaches a warning to.

#### 1.5 "View as Markdown"

A Starlight `PageTitle` component override rendering a link to the current page's `.md` sibling,
applied through `starlight({ components: { … } })` so it reaches both the MDX guides and the
`StarlightPage`-based component routes. This is Base UI's pattern and it is what makes the Markdown
routes discoverable by a human who is about to paste a URL into a chat.

#### 1.6 The agents documentation page

`content/docs/reference/agents.mdx` — "Using Timeless with AI agents". The `reference/` sidebar
group is autogenerated, so it appears without a config change. It carries: the `.md` URL convention,
`/llms.txt` and its token count, the skill install command, the current MCP status from phase 3, and
a copy-pasteable `AGENTS.md` block for the majority of consumers who will never install a skill
runner.

`robots.txt` is left alone. There is no standard directive for advertising `llms.txt`, and inventing
one would be a claim with no reader. Confirm only that no AI user-agent is blocked — the current
file allows all agents except `/docs/_preview/`, which is already correct. Discovery happens through
1.5, 1.6, and the sidebar, the way Base UI does it.

### 2. The consumer skill

`packages/components/skills/using-timeless-ui/SKILL.md`, with `name` and `description` frontmatter
per the Agent Skills specification.

**It does not live in `.agents/skills/`, and that is deliberate.** That tree holds contributor
procedures for this repository, symlinked into `.claude/skills` and `.codex/skills`. This skill is a
published product artifact, versioned and released with the package, aimed at agents working in
consumer projects. Same file format, different audience, different lifecycle. Do not consolidate
them.

Authored content, stating no attribute value:

- the two-kind split, and that mixing them is the most common failure;
- boolean attributes by presence;
- `data-ui-part` token lists, and that `data-ui-internal-*` is never authored;
- import paths, and that registration is per-element;
- that most components need no JavaScript at all;
- where to fetch a full contract — the phase 1.1 `.md` URLs.

**Generated companion:** `skills/using-timeless-ui/reference/contracts.md`, written by
`generate-elements.mjs` from the registry. One row per contract — name, kind, root name and root
kind, attribute names and the value set each references — and a pointer to the `.md` URL for the
rest. Names and value-set references only, not full value lists, so the file stays a few kilobytes.

Writing it from `generate-elements.mjs` buys `generate:check` coverage for free: the skill's factual
half cannot drift from the CSS without failing the build. Add it to
[`reference/generated-files.md`](../../../reference/generated-files.md).

Distribution, all cheap once the file exists:

- `skills` added to `package.json#files`, plus `aiAgentSkill` pointing at the directory and the
  `ai-agent-skill` keyword, following antfu's `skills-npm` proposal — the convention `skills-npm`,
  `npm-skills`, and `@netresearch/agent-skill-coordinator` all read.
- A skills.sh listing, so `npx skills add itsjavi/timeless` works. External and manual.
- The `AGENTS.md` block on the phase 1.6 page, for everyone else.

### 3. MCP: a spike, not a build

`bennypowers/cem` ships `cem mcp`, an MCP server over Custom Elements Manifests — element summaries,
accessibility patterns, HTML validation, attribute suggestions. The manifest here is already valid
CEM 2.1.0, so this is worth an hour before anyone writes MCP code.

Run it against `packages/components/custom-elements.json` and record in `RESULTS.md` what it answers
correctly, and precisely where the 36 CSS contracts leave holes. That measurement is the
deliverable.

A first-party server is **not** in this milestone. It has the narrowest reach per unit of effort of
anything in the research — every consumer must configure it before it helps — and it should follow
the artifacts that need no installation. What this milestone records is the design it would
implement, so the next milestone starts from a decision rather than a blank page: `list_components`,
`get_component_contract`, `get_example_markup`, and `validate_markup`.

`validate_markup` is the one capability no competitor can offer. Given a full contract of permitted
attributes, values, parts, and states, an agent can submit markup and get back "`ui-menu` has no
`data-ui-variant`; configuration on an element host uses plain attributes". Every other library's
MCP server can only describe. This one could check. Whether the checker becomes public API or stays
internal is an open decision recorded in `RESULTS.md`, not settled here.

### 4. Index presence

`context7.json` at the repository root: `projectTitle`, `description`, `folders`
(`apps/web/src/content/docs`), `excludeFolders`, and `rules` carrying the grammar statements from
1.3's preamble. Context7 parses `.md` and `.mdx`, so phase 1 improves what it can index.

Then the two external submissions — `context7.com/add-library` and the skills.sh listing. Both are
manual, neither is gated, and both belong in `TASKS.md` so they are not forgotten.

### 5. Validation

`apps/web/scripts/validate-agent-surfaces.mjs`, added to `apps/web`'s `test` script alongside
`validate-claims.mjs` and `validate-docs.mjs`. It asserts:

- every documented example emits a reachable `.md` route;
- every link in `/llms.txt` resolves to a file that was actually emitted;
- `/llms.txt` stays under its declared token budget, failing when it grows past it;
- `skills/using-timeless-ui/SKILL.md` exists and `skills` is present in `package.json#files`.

The generated contracts reference needs no assertion here — `generate:check` already owns it.

**The agent eval is explicitly not a gate.** An LLM call is nondeterministic and needs an API key,
so it cannot sit in `pnpm qa` without making the suite flaky and credential-dependent. Instead:

- `scripts/eval-agent-markup.mjs` — prompts a model with only `/llms.txt` and the skill in context,
  asks for markup for N components, and reports how much of the output the contract checker accepts.
  Skipped without `ANTHROPIC_API_KEY`. Advisory, run by hand or on a schedule.
- The deterministic half — the checker that decides whether a markup string satisfies a contract —
  is a plain function with unit tests in `packages/components`. That part is gated, and it is also
  the prototype for `validate_markup` in phase 3.

This split is the honest version of the research's "turn LLM support into a CI number": the checker
regresses deterministically, the model score moves for reasons outside this repository.

### 6. Out of scope

- **A first-party MCP server.** Phase 3 measures and designs; it does not build.
- **HTTP content negotiation** (`Accept: text/markdown`). The site builds static and composes into
  `dist-site`; edge conversion is a hosting change, not a repository change.
- **Rewriting the 18 MDX guides into agent-shaped prose.** The raw source is good enough, and
  rewriting it is a documentation milestone, not this one.
- **Any change to a component contract**, value set, stylesheet, or public export. This milestone
  adds readers of the registry, never writers. If a component's contract turns out to be wrong for
  agents, that is a finding for `RESULTS.md` and a separate milestone.
- **`llms-full.txt`** if it moves build time materially. Recorded as dropped rather than silently
  omitted.

## Verification

1. `pnpm -F @timelessui/components run generate:check` — proves the generated contracts reference is
   current.
2. `pnpm -F @apps/web run build`, then confirm `dist` holds 45 component `.md` files, 18 guide `.md`
   files, `llms.txt`, and `llms-full.txt` if shipped.
3. `pnpm -F @apps/web run test` — the three validators, including the new one.
4. `pnpm -F @timelessui/components run test` — the markup checker's unit tests.
5. `pnpm publint` and `pnpm attw` — confirm `skills/` ships and neither tool objects to it.
6. Fetch three `.md` routes and `/llms.txt` from the preview server and confirm the content type and
   the body.
7. `pnpm qa` end to end.

## Acceptance

- Every one of the 45 documented components answers at `/docs/components/<id>.md` with its contract
  and its canonical markup, generated from the same functions the HTML page uses.
- All 18 guides answer at `<page>.md`.
- `/llms.txt` is generated, under 5,000 tokens, and every link in it resolves.
- Every page carries a "View as Markdown" link.
- `packages/components` ships `skills/using-timeless-ui/SKILL.md`, its generated contracts reference
  is covered by `generate:check`, and the package declares it through `files`, `aiAgentSkill`, and
  the `ai-agent-skill` keyword.
- No agent-facing artifact restates an attribute, value, or root name that is not generated from
  `componentContracts`.
- `context7.json` is committed; the Context7 and skills.sh submissions are recorded as done or
  explicitly deferred.
- `cem mcp` has been run against the manifest and `RESULTS.md` records what it covers and what the
  36 CSS contracts leave uncovered.
- The markup checker is unit-tested and gated; the model eval exists, is opt-in, and is documented
  as advisory.
- `pnpm qa` is green.

---

Generated by Claude Opus 5 - High reasoning
