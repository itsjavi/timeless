# Milestone 027 Tasks

## 0. Baseline, measured before any change

- [ ] Confirm `componentContracts` holds 57 entries, 36 `kind: 'css'` and 21
      `kind: 'custom-element'`
- [ ] Confirm `custom-elements.json` declares 21 `tagName` values, and record which 36 contracts
      have no manifest representation
- [ ] Confirm `examples` holds 50 entries, 45 with `domain !== 'recipes'`
- [ ] Confirm zero files matching `llms` exist outside `.agents/research/`
- [ ] Record `pnpm -F @apps/web run build` wall-clock time as the baseline for the phase 1.4
      decision

## 1. Markdown reachability

- [ ] Create `apps/web/src/lib/component-markdown.ts` exporting `componentMarkdown(example)`, built
      on `documentedContracts`, `declarationsFor`, and `stylingFor`
- [ ] Confirm `componentMarkdown` calls no derivation `[slug].astro` does not also call — one
      source, two renderers
- [ ] Emit the canonical markup from `example.render(example.defaultArgs)`, not a hand-written
      snippet
- [ ] Create `apps/web/src/pages/docs/components/[slug].md.ts` with `getStaticPaths` mirroring
      `[slug].astro`, including the `domain !== 'recipes'` filter
- [ ] Confirm the endpoint returns `Content-Type: text/markdown; charset=utf-8`
- [ ] Verify `starlight-dot-md` supports Starlight 0.41 and Astro 7; if not, write
      `apps/web/src/pages/docs/[...slug].md.ts` over `getCollection('docs')` and record the decision
- [ ] Confirm guide `.md` output strips frontmatter and import statements and leaves component tags
- [ ] Create `apps/web/src/pages/llms.txt.ts` with the authored grammar preamble plus the generated
      index grouped by `ExampleGroup`
- [ ] Confirm every `llms.txt` component link points at the `.md` route, not the HTML route
- [ ] Measure the `llms.txt` token count and set the budget constant the validator asserts
- [ ] Decide `llms-full.txt` on the measured build-time delta; ship with its token count published,
      or record it as dropped in RESULTS.md
- [ ] Add the Starlight `PageTitle` override rendering the "View as Markdown" link
- [ ] Confirm the override reaches both MDX guides and the `StarlightPage`-based component routes
- [ ] Write `content/docs/reference/agents.mdx` covering the `.md` convention, `/llms.txt` and its
      token count, the skill install command, MCP status from phase 3, and the `AGENTS.md` block
- [ ] Confirm the page appears in the Reference sidebar group with no `astro.config` change
- [ ] Confirm `robots.txt` blocks no AI user-agent, and leave it otherwise unchanged

## 2. The consumer skill

- [ ] Create `packages/components/skills/using-timeless-ui/SKILL.md` with `name` and `description`
      frontmatter
- [ ] Confirm the authored prose names no attribute, permitted value, or root name — every such fact
      lives in the generated reference
- [ ] Cover the two-kind split, boolean presence, `data-ui-part`, never-authored
      `data-ui-internal-*`, import paths, per-element registration, and where to fetch a full
      contract
- [ ] Teach `generate-elements.mjs` to write `skills/using-timeless-ui/reference/contracts.md` from
      the registry
- [ ] Confirm the generated reference lists names and value-set references only, not full value
      lists, and stays under a few kilobytes
- [ ] Confirm `pnpm generate:check` fails when the generated reference is stale
- [ ] Add the new file to `.agents/reference/generated-files.md`
- [ ] Add `skills` to `packages/components/package.json#files`
- [ ] Add the `aiAgentSkill` field and the `ai-agent-skill` keyword
- [ ] Confirm `pnpm publint` and `pnpm attw` still pass with `skills/` in the published files
- [ ] Confirm the packed tarball contains `skills/using-timeless-ui/SKILL.md` and its reference
- [ ] Submit the skills.sh listing so `npx skills add itsjavi/timeless` resolves — external, manual

## 3. MCP spike

- [ ] Run `cem mcp` against `packages/components/custom-elements.json`
- [ ] Record which questions it answers correctly for the 21 custom elements
- [ ] Record precisely where the 36 CSS contracts leave holes
- [ ] Record the first-party server design — `list_components`, `get_component_contract`,
      `get_example_markup`, `validate_markup` — as a decision for the next milestone, not built here
- [ ] Record the open decision on whether the markup checker becomes public API or stays internal

## 4. Index presence

- [ ] Create `context7.json` at the repository root with `projectTitle`, `description`, `folders`,
      `excludeFolders`, and `rules` carrying the grammar statements
- [ ] Submit at `context7.com/add-library` and record the resulting library id — external, manual
- [ ] Confirm the submitted id resolves and returns Timeless content

## 5. Validation

- [ ] Create `apps/web/scripts/validate-agent-surfaces.mjs` and add it to `apps/web`'s `test` script
- [ ] Assert every documented example emits a reachable `.md` route
- [ ] Assert every `/llms.txt` link resolves to an emitted file
- [ ] Assert `/llms.txt` stays under its declared token budget
- [ ] Assert `SKILL.md` exists and `skills` is present in `package.json#files`
- [ ] Confirm the validator fails when a component is added to the catalog without a `.md` route
- [ ] Write the markup checker as a plain function with unit tests in `packages/components`
- [ ] Confirm the checker rejects `<ui-button variant="primary">`, `data-ui-*` on an element host,
      and `invalid="true"` on a boolean attribute
- [ ] Create `scripts/eval-agent-markup.mjs`, skipped without `ANTHROPIC_API_KEY`
- [ ] Confirm the eval is absent from `pnpm qa` and documented as advisory
- [ ] Record the first eval score in RESULTS.md as a starting point, not a gate

## 6. Closing

- [ ] Run `pnpm -F @timelessui/components run generate:check`
- [ ] Run `pnpm -F @apps/web run build` and confirm 45 component `.md`, 18 guide `.md`, and
      `llms.txt` in `dist`
- [ ] Fetch three `.md` routes and `/llms.txt` from the preview server and check content type and
      body
- [ ] Run `pnpm qa` and record what it said
- [ ] Confirm the `research/llm-support.md` row in the `.agents/README.md` research table still
      describes what the milestone produced
- [ ] Run `audit-docs-drift` and confirm no prose still describes Timeless as having no agent
      surfaces
- [ ] Record decisions, trade-offs, and results in RESULTS.md

---

Generated by Claude Opus 5 - High reasoning
