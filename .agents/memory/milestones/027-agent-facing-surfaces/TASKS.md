# Milestone 027 Tasks

## 0. Baseline, measured before any change

- [x] Confirm `componentContracts` holds 57 entries, 36 `kind: 'css'` and 21
      `kind: 'custom-element'`
- [x] Confirm `custom-elements.json` declares 21 `tagName` values, and record which 36 contracts
      have no manifest representation
- [x] Confirm `examples` holds 50 entries, 45 with `domain !== 'recipes'`
- [x] Confirm zero files matching `llms` exist outside `.agents/research/`
- [x] Record `pnpm -F @apps/web run build` wall-clock time as the baseline for the phase 1.4
      decision

## 1. Markdown reachability

- [x] Create `apps/web/src/lib/component-markdown.ts` exporting `componentMarkdown(example)`, built
      on `documentedContracts`, `declarationsFor`, and `stylingFor`
- [x] Confirm `componentMarkdown` calls no derivation `[slug].astro` does not also call — one
      source, two renderers
- [x] Emit the canonical markup from `renderExample(example)`, not a hand-written snippet
- [x] Create `apps/web/src/pages/docs/components/[slug].md.ts` with `getStaticPaths` mirroring
      `[slug].astro`, including the `domain !== 'recipes'` filter
- [x] Confirm the endpoint returns `Content-Type: text/markdown; charset=utf-8`
- [x] Verify `starlight-dot-md` supports Starlight 0.41 and Astro 7 — it does; adopted, and the
      hand-written fallback endpoint was not needed
- [x] Establish what the guide `.md` output actually contains: normalised frontmatter and raw MDX,
      including import statements and unexpanded component tags. Deviation recorded in RESULTS.md
- [x] Create `apps/web/src/pages/llms.txt.ts` with the authored grammar preamble plus the generated
      index grouped by `ExampleGroup`
- [x] Confirm every `llms.txt` component link points at the `.md` route, not the HTML route
- [x] Measure the `llms.txt` token count and set the budget constant the validator asserts
- [x] Decide `llms-full.txt` on the measured build-time delta — shipped: the memo in
      `component-markdown.ts` holds the route to 3ms and the file to ~71k tokens
- [x] Add the Starlight `PageTitle` override rendering the "View as Markdown" link
- [x] Confirm the override reaches both MDX guides and the `StarlightPage`-based component routes,
      and is absent on the component index, which has no twin
- [x] Write `content/docs/reference/agents.mdx` covering the `.md` convention, `/llms.txt` and its
      token count, the skill install command, MCP status from phase 3, and the `AGENTS.md` block
- [x] Publish the token counts from a component that measures them, rather than hardcoding a number
- [x] Confirm the page appears in the Reference sidebar group with no `astro.config` change
- [x] Confirm `robots.txt` blocks no AI user-agent, and leave it otherwise unchanged

## 2. The consumer skill

- [x] Create `packages/components/skills/using-timeless-ui/SKILL.md` with `name` and `description`
      frontmatter
- [x] Confirm the authored prose names no attribute, permitted value, or root name — every such fact
      lives in the generated reference
- [x] Cover the two-kind split, boolean presence, `data-ui-part`, never-authored
      `data-ui-internal-*`, import paths, per-element registration, and where to fetch a full
      contract
- [x] Teach `generate-elements.mjs` to write `skills/using-timeless-ui/reference/contracts.md` from
      the registry, through a new `emit-agent-skill.mjs`
- [x] Confirm the generated reference lists names and value-set references only, not full value
      lists
- [x] Confirm `pnpm generate:check` fails when the generated reference is stale
- [x] Add both files to `.agents/reference/generated-files.md`, the generated one to the table and
      the authored one to the do-not-generate list
- [x] Add `skills` to `packages/components/package.json#files`
- [x] Add the `aiAgentSkill` field and the `ai-agent-skill` keyword
- [x] Confirm `pnpm publint` and `pnpm attw` still pass with `skills/` in the published files
- [x] Confirm the packed tarball contains `skills/using-timeless-ui/SKILL.md` and its reference
- [ ] Submit the skills.sh listing so `npx skills add itsjavi/timeless` resolves — external, manual,
      needs the maintainer's account. The docs page deliberately documents `npx skills-npm` instead,
      which works today from the published package

## 3. MCP spike

- [x] Run `cem` against `packages/components/custom-elements.json`
- [x] Record which questions it answers correctly for the 21 custom elements
- [x] Record precisely where the 36 CSS contracts leave holes
- [x] Record the unexpected finding: `cem validate` rejects the manifest over `timeless:parts`
- [x] Record the first-party server design — `list_components`, `get_component_contract`,
      `get_example_markup`, `validate_markup` — as a decision for the next milestone, not built here
- [x] Record the open decision on whether the markup checker becomes public API or stays internal

## 4. Index presence

- [x] Create `context7.json` at the repository root with `projectTitle`, `description`, `folders`,
      `excludeFolders`, and `rules` carrying the grammar statements
- [ ] Submit at `context7.com/add-library` and record the resulting library id — external, manual,
      needs the maintainer's account
- [ ] Confirm the submitted id resolves and returns Timeless content — blocked on the submission

## 5. Validation

- [x] Create `apps/web/scripts/validate-agent-surfaces.mjs` and add it to `apps/web`'s `test` script
- [x] Assert every documented example emits a reachable `.md` route with a Markup section
- [x] Assert every `/llms.txt` link resolves to an emitted file
- [x] Assert `/llms.txt` stays under its declared token budget
- [x] Assert `SKILL.md` and its generated reference exist, and that `skills` and `aiAgentSkill` are
      declared in the manifest
- [x] Confirm the validator catches a broken link — it caught one in its own route mapping on the
      first run, before any component was missing
- [x] Write the markup checker as a plain function with unit tests
- [x] Confirm the checker rejects `<ui-button variant="primary">`, `data-ui-*` on an element host,
      and a value on a presence-based attribute
- [x] Add the canonical-example sweep in `packages/examples/scripts/validate.mjs`, where the
      dependency direction is legal
- [x] Create `scripts/eval-agent-markup.mjs`, skipped without `ANTHROPIC_API_KEY`
- [x] Confirm the eval is absent from `pnpm qa` and documented as advisory
- [ ] Record the first eval score in RESULTS.md as a starting point, not a gate — needs an API key,
      which this environment has none of. The harness is ready and skips cleanly

## 6. Closing

- [x] Run `pnpm -F @timelessui/components run generate:check`
- [x] Run `pnpm -F @apps/web run build` and confirm 45 component `.md`, 19 guide `.md`, `llms.txt`,
      and `llms-full.txt` in `dist`
- [x] Fetch `.md` routes and `/llms.txt` from the dev server and check content type and body
- [x] Verify the "View as Markdown" link in the browser, in both themes and at mobile width
- [x] Run `pnpm qa` and record what it said
- [x] Confirm the `research/llm-support.md` row in the `.agents/README.md` research table still
      describes what the milestone produced
- [x] Document the agent surfaces in `README.md` so the repository's own prose does not go stale
- [ ] Run `audit-docs-drift` — not run. A targeted manual sweep replaced it; see RESULTS.md
- [x] Record decisions, trade-offs, and results in RESULTS.md

---

Generated by Claude Opus 5 (High)
