---
model: Claude Opus 5
date: 2026-08-19
---

# LLM support and discovery for Timeless UI

Research into how a component library makes itself usable by coding agents in 2026, and which of
those mechanisms are worth building on an Astro + Starlight site with a generated contract registry.

Sources are listed at the end. Repository facts were read from the working tree at
`feat/023-form-completeness`.

## Headline

Timeless's problem is **not discovery. It is prior interference.**

Every agent writing UI code carries an enormous React-and-Tailwind prior and almost no prior for
"CSS class root plus `data-ui-*` configuration, with a separate registered custom element only where
keyboard coordination demands it". Left to its priors an agent will write
`<ui-button variant="primary">` instead of `<button class="ui-button" data-ui-variant="primary">`,
put `data-ui-*` configuration on a custom-element host, and invent `data-ui-invalid="true"` where
the contract wants bare `invalid`. Those are the exact failure modes `AGENTS.md` already legislates
for contributors — and no consumer-facing equivalent exists.

So the ranking is not "which channel gets the most crawler traffic". It is "which channel puts the
shortest correct statement of the attribute grammar into an agent's context at the moment it writes
markup". That reorders the options substantially.

A second, structural point: Timeless already ships a real Custom Elements Manifest
(`custom-elements.json`, schemaVersion 2.1.0, 100 KB, descriptions on every attribute and member).
That is a machine-readable public API surface no React library can produce, and existing third-party
tooling consumes it today. Two thirds of the library is invisible to it, though — see
[The CEM gap](#the-cem-gap).

## What the landscape actually looks like

### llms.txt is dead as SEO and alive as a developer artifact

The two claims get conflated constantly and the distinction matters.

As a **crawler signal** it has failed. Across a 90-day window of over 500M AI bot visits, only 408
requests targeted `/llms.txt` directly; GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot crawl
HTML instead. No major model provider has committed to reading it, and Google's Gary Illyes stated
publicly that Google does not support it and does not plan to. Astro deleted its own `llms.txt` in
April 2026, citing "little uptake recently in usage — these files get very little traffic", and
redirected effort to an MCP server.

As a **thing developers paste and tools reference** it is still working, and that is a different job
with different telemetry. Base UI links `llms.txt` from its Handbook sidebar for exactly this
reason. Nuxt UI documents `/llms.txt` (~5K tokens) and `/llms-full.txt` (1M+ tokens) and explicitly
tells readers to start with the small one. Atlassian Design ships one. shadcn/ui ships one that
doubles as a table of contents pointing at its skills and MCP pages.

Practical reading: build it, keep it small, generate it, do not measure it by bot user-agent, and do
not expect it to do anything on its own.

### Per-page Markdown is the mechanism that actually gets used

This is where the ecosystem converged. Coding agents fetch URLs. A page that returns HTML costs a
large multiple of the tokens its Markdown source costs and arrives full of navigation chrome.

- Cloudflare serves a Markdown version of any docs page at `<page>/index.md`, publishes an AI
  consumability style guide, and additionally offers HTTP content negotiation — an agent sending
  `Accept: text/markdown` gets Markdown converted at the edge.
- Base UI puts a "View as Markdown" link at the top of every page.
- For Starlight specifically, `starlight-dot-md` serves `.md`, `.mdx` and `.mdoc` pages as raw
  Markdown at `<page>.md`. `starlight-md-txt` does the same at `.md.txt`.

Cheap, boring, no adoption story required, works with every agent that can fetch.

### Skills are where the quality-per-token is

shadcn/ui ships three things for agents — `llms.txt`, an MCP server, and **skills** — and describes
the skill as "deep shadcn/ui knowledge for AI assistants like Claude Code". It installs with
`pnpm dlx skills add shadcn/ui`, activates on detecting `components.json`, then shells out to
`shadcn info --json` to inject real project context before generating code.

Distribution has consolidated faster than expected:

- **skills.sh** is a cross-agent skill directory, installed with `npx skills add <owner/repo>`,
  claiming 22+ supported agents (Claude Code, Cursor, Codex, Copilot, Windsurf, Gemini, Zed,
  Cline…).
- **npm-shipped skills** are becoming a convention. antfu's `skills-npm` proposes a `skills/`
  directory at package root, one subdirectory per skill each containing a `SKILL.md` (Agent Skills
  spec — Markdown plus YAML frontmatter), `skills` added to `package.json#files`, and consumers
  running `npx skills-npm` to scan `node_modules/**/skills/*/SKILL.md` and symlink into
  `.cursor/skills/` and friends. Competing implementations (`@netresearch/agent-skill-coordinator`,
  `npm-skills`) add a `postinstall` that writes a managed block into the consumer's `AGENTS.md`, and
  an `aiAgentSkill` field plus `ai-agent-skill` keyword for npm search.

The convention is not settled, but the **format** is: `SKILL.md` with frontmatter. Writing one costs
nothing extra whichever distributor wins, and it is the artifact that directly attacks the prior-
interference problem.

### MCP has the highest ceiling and a real install cliff

An MCP server can answer questions and validate output rather than dumping prose. Chakra UI's
exposes `list_components`, `get_component_props`, `get_component_example`. Astro replaced its
`llms.txt` with `withastro/docs-mcp`. `starlight-mcp` gives any Starlight site `search_docs`,
`get_doc` and `list_docs` over stateless streamable HTTP.

The cost is that every consumer must configure a server before it helps, which is why the article
responding to Astro's removal argues MCP does not replace `llms.txt` — they serve different
populations at different capability levels. Do not treat MCP as a substitute for Markdown; treat it
as an addition for the subset of users who will install it.

**Timeless has an unusually cheap route here.** `bennypowers/cem` is a standards-based Web
Components multitool whose `cem mcp` command starts an MCP server over Custom Elements Manifests —
resources for schemas, package discovery, element summaries and accessibility patterns; tools for
HTML validation, attribute suggestions, HTML generation and CSS integration guidance; and
design-system compliance features. It discovers manifests automatically, including across packages.
Timeless's manifest is already valid CEM 2.1.0, so this is worth trying before writing a line of MCP
code.

## What this means for Timeless specifically

### The CEM gap

`componentContracts` holds 57 contracts: 36 `kind: 'css'` and 21 `kind: 'custom-element'`. Only the
21 appear in `custom-elements.json`. The missing 36 are the CSS-only ones — which is to say the
majority of the library and the centre of its stated philosophy. CEM has no representation for "a
`.ui-card` class root configured by `data-ui-density`".

Consequence: CEM-based tooling (`cem mcp`, `cem lsp`, `vscode-web-components-ai`) gives real value
for free, but only over the enhanced half. Any artifact that claims to describe Timeless must be
generated from `component-registry.mjs`, which covers all 57 contracts, and not from the manifest.

### The component reference pages have no Markdown source

`apps/web/src/pages/docs/components/[slug].astro` renders through `StarlightPage` from
`examples`/`getExample` plus `lib/component-docs`. The 18 files under `content/docs/` are MDX; the
45 component reference pages are not files at all.

So `starlight-dot-md` covers the guides and cannot cover the component reference. That is a feature
rather than a problem: the component pages should emit Markdown from the same registry data the HTML
page reads, through a sibling endpoint. Generated Markdown from a validated single source of truth
is strictly better than Markdown scraped from rendered MDX.

### The validation culture is the differentiator nobody else has

`validate-contracts.mjs` proves every declared value against the stylesheets in both directions.
`validate-docs.mjs` fails the build on an undocumented custom element or an undocumented CSS export.
`apps/web/scripts/validate-claims.mjs` exists. `packages/examples/scripts/validate.mjs` has 17 throw
conditions.

Two things follow.

1. Every LLM artifact must be generated and gated, or it will drift and quietly break the strongest
   property the project has — that a documented value is a value the CSS implements. A hand-written
   `llms.txt` would be the first unvalidated public claim in the repository.
2. Timeless can offer a `validate_markup` capability that no competitor can. Given a full contract
   of permitted attributes, values, parts and states, an agent can submit markup and get back
   "`ui-menu` has no `data-ui-variant`; configuration on a custom-element host uses plain
   attributes". Every other library's MCP server can only _describe_. This one can _check_. That is
   the single most differentiated thing on this list.

## Recommendation

Ordered by leverage per unit of work. Nothing here should be hand-maintained.

### Tier 0 — Markdown reachability

1. **`starlight-dot-md`** for the 19 MDX guides. Configuration only.
2. **A `.md` endpoint for component pages**, generated from `documentedContracts` /
   `declarationsFor` / `stylingFor` — the same functions `[slug].astro` already calls. Emit install
   block, anatomy, attribute tables, element API, state, styling, accessibility, and the canonical
   markup. This is the artifact agents most need and it does not exist in any form today.
3. **"View as Markdown" in the page header** (Base UI's pattern) via a Starlight component override,
   on both page types.
4. **`/llms.txt`**, generated: a short hand-written preamble stating the attribute grammar, then the
   component index from `catalog.ts` with `.md` links. Target a few thousand tokens. Add
   `/llms-full.txt` if it is free to generate, publish its token count next to the link, and point
   readers at the small one first the way Nuxt UI does.
5. **`robots.txt`**: add the `llms.txt` reference. Confirm no AI user-agent is being blocked
   accidentally — the current file allows all agents except `/docs/_preview/`, which is correct.

### Tier 1 — the consumer skill

`.agents/skills/` holds seven skills today and all seven are contributor-facing (`author-component`,
`audit-docs-drift`, …). There is no skill for the far larger population: an agent in someone else's
project trying to use Timeless.

Write `using-timeless-ui` as a `SKILL.md` covering, in this order:

- the two-kind split — `.ui-*` class root with `data-ui-*` configuration, versus registered `ui-*`
  element with plain attributes — and that mixing them is the most common error;
- boolean attributes by presence, never `="true"`;
- `data-ui-part` token lists for authored anatomy, and that `data-ui-internal-*` is never authored;
- import paths: `@timelessui/components/css/<file>` and `@timelessui/components/define/<tag>`;
- that most components need no JavaScript, and registration is per-element;
- where to fetch the per-component contract (the Tier 0 `.md` URLs).

Then distribute it three ways, all cheap once the file exists:

- **In the npm package** — `skills/using-timeless-ui/SKILL.md`, `skills` added to
  `package.json#files`, plus the `aiAgentSkill` field and `ai-agent-skill` keyword. Works with
  `skills-npm` and the coordinator implementations.
- **On skills.sh**, installable as `npx skills add itsjavi/timeless`.
- **As a docs page** — a copy-pasteable `AGENTS.md` block, for the majority who will never install a
  skill runner.

Generate the attribute-grammar sections from the registry so the skill cannot contradict the CSS.

### Tier 2 — MCP, cheapest path first

1. **Try `cem mcp`** against the existing manifest and document the result. If it works, the
   enhanced half of the library gets an MCP server, an LSP and VS Code integration for the price of
   a docs page.
2. **`starlight-mcp`** for docs search, if the Markdown endpoints prove insufficient.
3. **Only then**, a first-party server generated from `component-registry.mjs`: `list_components`,
   `get_component_contract`, `get_example_markup`, and `validate_markup`. The last is the reason to
   build it at all.

### Tier 3 — index presence

- `context7.json` at the repository root — `projectTitle`, `description`, `folders`
  (`apps/web/src/content/docs`), `excludeFolders`, and `rules` carrying the attribute-grammar
  statement. Context7 parses `.md`/`.mdx`, so the Tier 0 endpoints improve what it can index.
- Submit at `context7.com/add-library`.
- List on skills.sh and in `awesome-starlight` once the plugins are in place.

### What not to do

- Do not frame any of this as SEO or AEO, and do not judge it by AI-bot user-agent counts. Coding
  agents fetch with ordinary HTTP clients; measure by **path** (`/llms.txt`, `*.md`), not by UA.
- Do not make `llms-full.txt` the primary artifact. Nuxt UI's own 1M-token file comes with a warning
  attached.
- Do not build a first-party MCP server before Tier 0 and Tier 1 ship. It has the narrowest reach
  per unit of effort and the highest maintenance cost.
- Do not hand-write any of it.

## Measuring it

Server-log counts on `/llms.txt` and `*.md` paths are the availability metric, not the quality one.

The quality metric worth building, and the one that fits this repository's culture: **an agent eval
in `apps/e2e`.** Prompt a model with only the `llms.txt` and skill in context, ask for markup for N
components, then run the output through the same contract checks `validate-contracts.mjs` uses. That
turns "LLM support" into a number that regresses in CI when an artifact drifts — and it directly
measures the prior-interference problem this document opens with. No UI library appears to be doing
this.

---

## Sources

**llms.txt reality check**

- [llms.txt: What the 2026 Data Actually Shows](https://geojacker.com/llms-txt)
- [The State of llms.txt in 2026 — aeo.press](https://www.aeo.press/ai/the-state-of-llms-txt-in-2026)
- [Astro removed its llms.txt — Dachary Carey](https://dacharycarey.com/2026/05/04/astro-removed-llms-txt/)

**Per-page Markdown and content negotiation**

- [AI consumability — Cloudflare Style Guide](https://developers.cloudflare.com/style-guide/how-we-docs/ai-consumability/)
- [Markdown for Agents — Cloudflare](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/)
- [Making your documentation AI-friendly — DeployHQ](https://www.deployhq.com/blog/making-your-documentation-ai-friendly-serving-markdown-to-ai-coding-assistants)

**Astro / Starlight tooling**

- [starlight-llms-txt](https://github.com/delucis/starlight-llms-txt) ·
  [docs](https://delucis.github.io/starlight-llms-txt/configuration/)
- [starlight-dot-md](https://github.com/morinokami/starlight-dot-md)
- [awesome-starlight](https://github.com/trueberryless-org/awesome-starlight)
- [Starlight plugins and integrations](https://starlight.astro.build/resources/plugins/)

**What other libraries ship**

- [shadcn/ui llms.txt](https://ui.shadcn.com/llms.txt) · [Skills](https://ui.shadcn.com/docs/skills)
  · [MCP Server](https://ui.shadcn.com/docs/mcp)
- [Nuxt UI — LLMs.txt](https://ui.nuxt.com/docs/getting-started/ai/llms-txt)
- [Chakra UI — MCP Server](https://chakra-ui.com/docs/get-started/ai/mcp-server)
- [Base UI — Quick start](https://base-ui.com/react/overview/quick-start)
- [Atlassian Design llms.txt](https://atlassian.design/llms.txt)

**Web Components metadata as an agent surface**

- [bennypowers/cem](https://github.com/bennypowers/cem)
- [vscode-web-components-ai](https://github.com/d13/vscode-web-components-ai)
- [Your Design System Needs An MCP Server](https://dev.to/jamesives/your-design-system-needs-an-mcp-server-4c7a)
- [Custom Elements Manifest: Web Component Discovery](https://dzone.com/articles/custom-elements-manifest-web-component-discovery)

**Skill distribution**

- [skills.sh](https://skills.sh)
- [antfu/skills-npm — PROPOSAL.md](https://github.com/antfu/skills-npm/blob/HEAD/PROPOSAL.md)
- [netresearch/node-agent-skill-coordinator](https://github.com/netresearch/node-agent-skill-coordinator)

**Context7**

- [Adding Libraries — Context7](https://context7.com/docs/adding-libraries)
- [Add Library](https://context7.com/add-library)

## What this produced

[Milestone 027 — Agent-Facing Surfaces](../memory/milestones/027-agent-facing-surfaces/PLAN.md),
which takes Tier 0, Tier 1, and Tier 3 in full, reduces Tier 2 to a measured spike over the existing
Custom Elements Manifest, and splits the proposed eval into a gated deterministic checker plus an
advisory model score.

Two corrections were made to this document when that milestone was opened: the contract and
component counts above were inherited from `library-comparison.md` rather than measured, and were
stale by one milestone. The measured baseline is recorded in
[027's RESULTS.md](../memory/milestones/027-agent-facing-surfaces/RESULTS.md).

---

Generated by Claude Opus 5 (High)
