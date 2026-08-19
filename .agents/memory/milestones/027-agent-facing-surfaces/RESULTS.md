# Milestone 027 Results

## Baseline

Starting commit `4b890ee` on `feat/023-form-completeness`. Astro 7.2.2, `@astrojs/starlight` 0.41.7,
`@astrojs/sitemap` 3.7.3, pnpm workspace, static output composed into `dist-site` by
`scripts/compose-static-site.mjs`.

Measured from the working tree, not read from earlier documents:

| Fact                                              | Value                                               |
| ------------------------------------------------- | --------------------------------------------------- |
| `componentContracts` entries                      | 57 — 36 `kind: 'css'`, 21 `kind: 'custom-element'`  |
| Root kinds                                        | 35 `class`, 21 `element`, 1 `selector`              |
| Contracts with an `accessibility` block           | 19                                                  |
| Catalog examples                                  | 50 total, 45 documented, 5 `domain: 'recipes'`      |
| `custom-elements.json`                            | CEM 2.1.0, 100,794 bytes, 21 `tagName` declarations |
| MDX guides under `apps/web/src/content/docs/`     | 18                                                  |
| Component reference pages with a Markdown source  | 0                                                   |
| Files matching `llms` outside `.agents/research/` | 0                                                   |
| `apps/web` build                                  | 116 pages, 3.26–3.37s, 5.86s wall                   |

Two of these were carried incorrectly into `research/llm-support.md` on first write — it said 53
contracts, 43 documented components, and 19 MDX guides, inherited from
`research/library-comparison.md` rather than measured after milestone 023 landed. Corrected in the
research document when this milestone was opened. `library-comparison.md` was left alone: it is a
dated snapshot whose numbers matched the tree it was written against, and `.agents/README.md`
already says research documents are historical records rather than sources of truth.

### Why the CEM gap is the load-bearing number

21 of 57 contracts appear in `custom-elements.json`, so every CEM-consuming tool sees 37% of the
library. There is no manifest concept for a class root configured by `data-ui-*`, which means these
36 contracts are invisible to `cem mcp`, `cem lsp`, and `vscode-web-components-ai`:

`ui-button`, `ui-toggle`, `ui-alert`, `ui-avatar`, `ui-badge`, `ui-separator`, `ui-card`,
`ui-skeleton`, `ui-progress`, `ui-link`, `ui-kbd`, `ui-code`, `ui-group`, `ui-list`, `ui-table`,
`ui-collapsible`, `ui-spinner`, `ui-empty`, `ui-meter-field`, `ui-color-swatch`, `ui-field`,
`ui-fieldset`, `ui-label`, `ui-description`, `ui-error`, `ui-input`, `ui-textarea`, `ui-select`,
`ui-checkbox`, `ui-radio`, `ui-choice`, `ui-choice-group`, `ui-switch`, `ui-range`, `ui-file`,
`ui-hover-card[variant='tooltip']`.

That is Button, every form control, and every content primitive — the components a consumer reaches
for first. It is what forced every artifact here to generate from `componentContracts` rather than
from the manifest, and what reduced phase 3 from an adoption to a measurement.

## Platform behavior confirmed before planning

Not applicable. This milestone adds readers of the contract registry and documentation routes; it
depends on no browser behavior and changes no component.

Two toolchain behaviors were confirmed by running them rather than assumed, and both changed the
implementation:

- **`starlight-dot-md` 0.2.1 works on Starlight 0.41 and Astro 7**, despite declaring only
  `astro >=5` as a peer and dev-testing against Starlight 0.38.3. All 18 guides emitted. The
  hand-written fallback endpoint in the plan was not needed.
- **`tsc` and Node disagree about sibling import extensions in `packages/components`.** The package
  has no `allowImportingTsExtensions`, so TypeScript requires extensionless sibling imports; Node's
  ESM resolver requires the explicit `.ts`. A module that both `tsc` and a plain `node` script must
  read therefore cannot be TypeScript in this package. This is what moved the markup checker — see
  below.

## Open decisions

**Whether the markup checker becomes public API.** Unresolved, deliberately, and the implementation
keeps both routes open: `scripts/check-markup.mjs` is not in `files`, so it ships in no package and
is not public API today. Exporting it would let consumers write their own lint rules and would let a
future MCP server depend on the published package rather than living in this repository; it would
also add a public surface that must then be versioned. The decision belongs to the milestone that
builds `validate_markup`.

**The `timeless:parts` interop failure.** Recorded below as a finding. Whether to move the data,
drop it, or keep a manifest that strict CEM validators reject is a change to a generated public
artifact and belongs in its own milestone.

## Decisions and constraints

### One source, two renderers

`component-markdown.ts` calls the same `documentedContracts`, `declarationsFor`, and `stylingFor`
that `[slug].astro` calls, and takes its markup from the same `renderExample`. It derives nothing of
its own. The HTML page and the Markdown twin can therefore disagree only by omission, never by fact
— and the Markdown output is _cheaper to produce_, because `inlineCode` and `inlineMarkdown` exist
to convert Markdown into HTML and the Markdown renderer simply does not call them.

Measured: 45 files, 216KB, averaging 4.8KB per component against a rendered page many times that.

### The grammar is declared once and projected

Everything authored by hand here states the _shape_ of the API and never a component, an attribute,
or a permitted value. Every fact of that kind lives in a generated file: the per-component `.md`
routes, or `skills/using-timeless-ui/reference/contracts.md`. That was the only way to add
agent-facing prose without adding the repository's first unvalidated public claim, and it is also
the right split for the reader — the grammar is what a model gets wrong, and it is small enough to
always carry.

**The first implementation got the split right and the storage wrong.** The grammar prose was
written out four times — the `/llms.txt` preamble, `SKILL.md`, `context7.json`'s `rules`, and the
paste-able block on the agents page. Because none of the four named a value, ordinary component work
could not invalidate them, and every gate passed. But a change to the grammar _itself_ — dropping
`data-ui-*` for CSS configuration, renaming `data-ui-part`, changing the boolean-presence convention
— would have left four copies disagreeing with nothing able to catch it. That was the one place in
the milestone where a fact was stored more than once.

It is now declared once in `packages/components/scripts/authoring-grammar.mjs` as structured data —
`summary`, `kinds`, `corrections`, `rules` (each an imperative one-liner plus its detail), and
`lookup` — with two renderers over it: `renderGrammar()` for prose and `grammarRules()` for the
imperative list. `generate-elements.mjs` projects it into four generated files, so `generate:check`
owns every copy:

| Output                               | Shape                                     | Read by                      |
| ------------------------------------ | ----------------------------------------- | ---------------------------- |
| `skills/…/SKILL.md`                  | frontmatter, prose grammar, checklist     | agents, from the npm package |
| `skills/…/reference/grammar.md`      | prose grammar plus the summary blockquote | `apps/web` → both llms files |
| `skills/…/reference/agents-block.md` | imperative one-liners                     | `apps/web` → `AgentsBlock`   |
| `context7.json`                      | the same one-liners as its `rules` array  | Context7                     |

Two consequences worth recording.

**`context7.json` is the only generated file outside `packages/components`.** Context7 requires it
at the repository root, and its `rules` array _is_ the grammar. Generating it there is a small
boundary compromise taken deliberately: the alternative was a hand-written fourth copy, which is the
thing being removed.

**`apps/web` reads the generated files rather than importing the declaration.** `lib/grammar.ts`
reads `grammar.md` and `agents-block.md` from disk, the same way `component-docs.ts` reads the
manifest. Importing the `.mjs` directly would mean telling Vite to serve outside the app root, and
reading a generated artifact is the pattern the app already uses.

**`validate-agent-surfaces.mjs` now proves the wiring, not just the files.** `generate:check` proves
the projections are current, but nothing proved the _website_ served one rather than a stale copy of
its own — the exact failure the single-sourcing exists to prevent. So the validator asserts
`/llms.txt` contains `grammar.md`'s body verbatim, and that the built agents page renders the block.

Verified by probe: appending a marker to one `rule` string in `authoring-grammar.mjs` made
`generate:check` fail, and after `pnpm generate` the marker appeared in `SKILL.md`, `grammar.md`,
`agents-block.md`, and `context7.json`, then in `/llms.txt` and the built agents page after a web
build — with no edit anywhere in `apps/web`.

**`llms-full.txt` now leads with the grammar too.** The probe exposed that it did not: it
concatenated guides and component contracts without a preamble, so an agent handed only that file
would reach the first contract without knowing how either kind of component is configured. It now
opens with the same grammar `/llms.txt` does, which cost ~700 tokens on a ~71,000-token file.

**One regression, accepted.** `/docs/reference/agents.md` previously carried the paste-able block as
literal Markdown, because the block was literal Markdown in the MDX. It is now `<AgentsBlock />`,
which `starlight-dot-md` serves unexpanded — the same MDX limitation already recorded for
`<TokenTable />` on the theming page. The trade is one unexpanded tag on a page _about_ the tooling
against removing a copy of the grammar that nothing could gate. `/llms.txt` and `/llms-full.txt`,
which are the routes agents are pointed at, both carry the grammar in full.

### Generating into the skill buys the gate for free

`reference/contracts.md` is written by `generate-elements.mjs` through a new `emit-agent-skill.mjs`,
alongside the manifest and the editor data. So `pnpm generate:check` — already in
`packages/components`' `build` — fails the moment the skill's facts and the registry disagree. No
new gate was needed for the half of the skill that could drift.

30KB for 57 contracts, which is more than the "few kilobytes" the plan estimated. The excess is
oxfmt's table-column padding, not content; it is kept because the file must stay oxfmt-formatted or
`format:check` and `generate:check` would fight each other.

### The checker had to be JavaScript, and it had to move twice

The plan said "a plain function with unit tests in `packages/components`". Two constraints reshaped
that:

1. **`check-boundaries.mjs` forbids a published package from importing `@timelessui/examples`**, and
   it is right to — `examples` depends on `components`. So the strongest available assertion, that
   `checkMarkup` reports nothing on all 50 canonical examples, cannot live beside the checker. It
   runs in `packages/examples/scripts/validate.mjs`, where the direction is legal.
2. **The `tsc`/Node extension disagreement above.** With the sweep living in a `.mjs` validator run
   by plain `node`, a TypeScript checker in `src/` was unreachable.

Final shape: `packages/components/scripts/check-markup.mjs`, plain JavaScript reading
`component-registry.mjs` — the same cross-package pattern `packages/examples/scripts/validate.mjs`
already uses for the registry. It is testable (`vitest.config.ts` now includes
`scripts/**/*.test.mjs`), importable by any node script, and shipped in nothing.

The first arrangement — `src/markup-check.ts` — is worth recording as a dead end because it looked
correct and passed its own unit tests before either constraint surfaced.

### llms-full.txt ships, because the memo made it free

`componentMarkdown` memoises per example id. `[slug].md.ts` and `llms-full.txt.ts` both render all
45 components in one build process, and without the memo the second would repeat every render
including re-reading each stylesheet in `stylingFor`. With it, Astro reports `/llms-full.txt (+3ms)`
and the build stays at 3.3–3.5s against a 3.26–3.37s baseline.

Astro deleted its own `llms.txt` partly over a 44-second CI cost, which is the outcome this avoids.
Measured sizes: `/llms.txt` ~2,700 tokens, `/llms-full.txt` ~71,000 — usable in a 200K context,
unlike Nuxt UI's 1M-token equivalent.

### The token counts are measured, not written down

`AgentSurfaceSizes.astro` calls the same `buildLlmsTxt` and `buildLlmsFullTxt` the endpoints call
and reports `estimateTokens` of the result. A hardcoded number on that page would have been exactly
the kind of claim `validate-claims.mjs` exists to prevent. This is why the endpoint bodies were
extracted into `lib/llms.ts` rather than left in the route files: three callers need them.

### robots.txt was left alone, against the research

The research suggested advertising `llms.txt` from `robots.txt`. There is no standard directive for
that, so it would have been a line no reader parses. Discovery instead goes through the "View as
Markdown" link, the Reference sidebar, and `README.md`. Confirmed only that no AI user-agent is
blocked; the existing file already allows all agents except `/docs/_preview/`.

### GROUP_ORDER was deduplicated rather than copied

`/llms.txt` presents components in the sidebar's order, so `astro.config.mjs`'s local `GROUP_ORDER`
moved to `src/lib/agent-surfaces.ts` and the config imports it. One order, two readers.

## Findings for other milestones

**`cem validate` rejects our manifest.** 20 declarations carry a `timeless:parts` key — authored
Light-DOM anatomy, which CEM has no field for — and the strict CEM JSON Schema forbids additional
properties on a declaration: `additional properties 'timeless:parts' not allowed`. `cem list`,
`cem search`, and `cem health` all read the manifest anyway, so this is a validation failure rather
than a parse failure, but any strict CEM consumer will reject the file. Out of scope here, since the
manifest is a generated public artifact.

**`cem health` scores the manifest 1255/2100.** The recurring deductions are missing element-level
descriptions (0/25 on several elements, including `ui-tabs`, `ui-range-field`, and `ui-otp-field`),
no demo URLs (0/10 across the board), and event descriptions that do not describe the detail shape.
Every one of those is a registry field that exists and is empty, so the fix is cheap and mechanical
whenever someone wants it.

## Summary

**Markdown reachability.** `component-markdown.ts` renders any example's full contract as Markdown;
`docs/components/[slug].md.ts` serves all 45 at `/docs/components/<id>.md` as `text/markdown`.
`starlight-dot-md` serves the 19 MDX guides at `<page>.md`. A `PageTitle` override adds a "View as
Markdown" link to every page that has a twin, and omits it on the component index, which does not.

**llms.txt.** `lib/llms.ts` builds both files: `/llms.txt` (~2,700 tokens) opens with the authoring
grammar and indexes every guide and component by `.md` link; `/llms-full.txt` (~71,000 tokens)
concatenates everything.

**The consumer skill.** `packages/components/skills/using-timeless-ui/SKILL.md` and its two
`reference/` companions are all generated — `contracts.md` from the registry, `grammar.md` and
`agents-block.md` from `authoring-grammar.mjs`. The package declares the directory through `files`,
`aiAgentSkill`, and the `ai-agent-skill` keyword, and it appears in `npm pack`.

**One grammar, four consumers.** `authoring-grammar.mjs` is the single declaration; the skill,
`context7.json`, `/llms.txt` and `/llms-full.txt`, and the agents page all read a projection of it.

**Documentation.** `docs/reference/agents.mdx` covers the `.md` convention, both llms files with
measured counts, the skill, editor tooling, and MCP status, plus a paste-able `AGENTS.md` block.
`README.md` gained a section so the repository's own prose does not go stale.

**Verification.** `validate-agent-surfaces.mjs` runs in `apps/web`'s `test` script and proves the
routes exist, the links resolve, the budget holds, and the skill ships. `check-markup.mjs` is unit
tested and swept over all 50 canonical examples. `scripts/eval-agent-markup.mjs` measures how much
of a model's output the contracts accept, opt-in and advisory.

**Index presence.** `context7.json` is committed. The two external submissions — Context7 and
skills.sh — need the maintainer's accounts and are left unchecked in `TASKS.md`.

## Validation results

`pnpm qa` exits 0.

| Gate                          | Result                                                             |
| ----------------------------- | ------------------------------------------------------------------ |
| `typecheck`                   | 6 projects, clean                                                  |
| `format:check`                | 496 files, correct                                                 |
| `build`                       | 117 pages; manifest validated for 21 elements                      |
| `apps/web` test               | 6 platform claims; 50 examples, 21 elements, 41 CSS exports        |
| `validate-agent-surfaces.mjs` | 45 component and 19 guide routes, 65 llms.txt links, ~2,703 tokens |
| `packages/examples` test      | 50 canonical examples, all clean under `checkMarkup`               |
| `packages/components` unit    | 38 files, 229 tests                                                |
| `packages/core` unit          | 9 files, 33 tests                                                  |
| `apps/stories` unit           | 1 file, 8 tests                                                    |
| `contracts:check`             | boundaries, exports, generated DOM, performance — clean            |
| `publint` / `attw`            | both packages clean                                                |
| `test:e2e`                    | 354 passed in 55s                                                  |

Manual verification in the dev server: `/docs/components/tabs.md` returns 200 as
`text/markdown; charset=utf-8` (5,499 bytes), `/llms.txt` returns 200 as
`text/plain; charset=utf-8`, and the agents page renders its measured sizes table live. The "View as
Markdown" link was checked on a component page and a guide, in dark and light schemes and at 375px,
with no console errors and no horizontal overflow.

Two tasks in `TASKS.md` are unchecked for lack of credentials — the Context7 and skills.sh
submissions — and one for lack of an API key: the first eval score. The eval harness runs and skips
cleanly without a key. `audit-docs-drift` was not run as an agent; `README.md`, `AGENTS.md`,
`.agents/README.md`, and `.agents/reference/generated-files.md` were checked and updated directly
instead.

---

Generated by Claude Opus 5 (High)

Implemented by Claude Opus 5 (High)
