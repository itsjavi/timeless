---
name: audit-docs-drift
allowed-tools: Bash, Read, Grep, Glob
description:
  Sweep Timeless UI prose against the source it describes — README.md, AGENTS.md, the published
  package README, the MDX documentation, catalog guidance, registry descriptions, milestone records,
  DESIGN.md, and the agent-facing surface of context7.json, the llms.txt routes, the packaged
  using-timeless-ui skill, and the .agents tree of skills, subagents, Codex metadata, reference
  files, and launch configuration — and report claims the code no longer supports, including install
  and registration snippets that resolve but do nothing, documented files the published tarball does
  not carry, and public roots documented nowhere. Read-only. Use for requests like "check the docs",
  "are the docs still accurate", "is the README stale", "do the install instructions still work", or
  "do the agent files and skills still match the repo", when preparing a release, when closing a
  milestone, and after a change to the public API, the generated pipeline, or a skill. Reports
  drift; it does not write new documentation.
---

# Audit documentation drift

Read-only. Report findings; do not fix them unless asked.

Four gates already cover part of this and should be run first rather than reproduced:

```bash
node apps/web/scripts/validate-claims.mjs              # landing-page tin shelf vs library source
node apps/web/scripts/validate-docs.mjs                # element/CSS coverage, routes, framework guides
pnpm -F @timelessui/components run generate:check      # every generated agent artifact vs the registry
pnpm -F @apps/web test:dist                            # the built agent routes — needs a site build first
```

What each one settles, so you do not re-read it:

- `validate-claims.mjs` proves only the landing page's platform claims.
- `validate-docs.mjs` proves only that every element and stylesheet is documented somewhere and that
  routes are unique.
- `generate:check` proves the four projections of the authoring grammar are current —
  `context7.json` `rules`, the packaged skill, the `AGENTS.md` block on the agents page, and the
  `/llms.txt` preamble. The grammar is declared once in
  `packages/components/scripts/authoring-grammar.mjs`, so **do not compare those copies to each
  other**; a disagreement is a stale generate, not drift to report.
- `test:dist` reads `apps/web/dist` and proves the agent routes shipped: one `.md` per documented
  component, every `llms.txt` link resolving, the `llms.txt` token budget, the agents page rendering
  the generated block, and the skill being carried in the package `files`.

Everything below is prose or configuration none of the four reads.

## Surfaces

| Surface                                              | Describes                                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| `README.md`                                          | Project intent, the Baseline 2025 feature list, package layout, dev commands |
| `AGENTS.md`                                          | Every authoring rule, and the file paths those rules name                    |
| `apps/web/src/content/docs/docs/**/*.mdx`            | Concepts, getting started, styling, frameworks, reference                    |
| `packages/examples/src/catalog.ts`                   | `guidance` — the only prose for components with no MDX page                  |
| `packages/components/scripts/component-registry.mjs` | Attribute, part, state, event, and accessibility descriptions                |
| `packages/components/README.md`                      | The published package's own documentation                                    |
| `.agents/memory/milestones/*/`                       | Plans, task lists, and results                                               |
| `.agents/memory/DESIGN.md`                           | The Atmosphere design language                                               |

And the agent-facing surface, which describes the repository to other models rather than to a
reader. It is split by who proves it:

| Surface                                         | Describes                                                          | Proven by                     |
| ----------------------------------------------- | ------------------------------------------------------------------ | ----------------------------- |
| `context7.json` `rules`                         | The authoring grammar, imperative                                  | `generate:check`              |
| `context7.json` `folders`, `excludeFolders`     | Which trees Context7 indexes                                       | nothing                       |
| `packages/components/skills/using-timeless-ui/` | The packaged consumer skill and its contract reference             | `generate:check`, `test:dist` |
| `apps/web/src/lib/llms.ts`, `agent-surfaces.ts` | Section order, group order, the site origin, the token budget      | partly `test:dist`            |
| `docs/getting-started/agents.mdx`               | Every agent surface above, in prose, around a generated block      | one spot-check in `test:dist` |
| `AGENTS.md`, `CLAUDE.md`                        | The authoring rules, and where the skills live                     | nothing                       |
| `.agents/README.md`                             | The tree, the skills table, the symlinks, the frontmatter contract | nothing                       |
| `.agents/skills/*/SKILL.md`                     | Each procedure, and every path and command it names                | nothing                       |
| `.agents/skills/*/agents/openai.yaml`           | Codex display metadata and invocation policy                       | nothing                       |
| `.agents/subagents/*.md`                        | The Claude Code auditors, restating their skill's description      | nothing                       |
| `.agents/reference/*.md`                        | Generated files, and validator failure messages                    | nothing                       |
| `.claude/launch.json`                           | The dev servers an agent may start, and their ports                | nothing                       |

The "nothing" rows are the reason this section exists. A model reads them as fact and has no way to
notice they are wrong.

## The checks

### 1. Paths and identifiers that prose names

Every file, directory, script, export, and command named in prose must exist. This is the
highest-yield check, because generated layouts move and prose does not follow.

```bash
grep -rnoE "\`[a-z0-9_@./-]+\.(ts|tsx|mjs|css|json|md|mdx|astro)\`" README.md AGENTS.md packages/components/README.md apps/web/src/content/docs | sort -u
grep -rnoE "\`pnpm [a-z:-]+\`" README.md AGENTS.md packages/components/README.md apps/web/src/content/docs | sort -u
```

Resolve each against the filesystem and against the `scripts` blocks in the root and package
`package.json` files. Pay particular attention to anything under `packages/components/src` — that
tree is largely generated, and `.agents/reference/generated-files.md` is the authority on what is
emitted where.

Three shapes are not findings, and the tree is currently full of all three. Filter them before
reporting, or the real hits drown:

- **A relative path under a stated base.** `.agents/reference/` tables name `src/contracts.ts` and
  `scripts/authoring-grammar.mjs` against a package root the surrounding heading gives. Resolve from
  that base, not the repository root.
- **An illustrative example.** AGENTS.md's `stories/accordion.html.ts` and
  `stories/accordion.stories.css` teach a naming pattern; no such files exist and none should.
  Anything introduced by "e.g." or "for example" is a pattern, not a claim.
- **A negated mention.** `generated-files.md` says there is no `src/values.ts`, and a milestone
  records that one used to exist. A path named in order to deny it is correct precisely because it
  is absent.

The same three apply to commands: `pnpm install`, `pnpm add`, and `pnpm dlx` are package-manager
builtins rather than repository scripts, and `pnpm run format:check` is the same script as
`pnpm format:check`.

### 2. Milestones described as upcoming

A shipped feature still advertised as planned is the drift this repo is most exposed to, because
`validate-claims.mjs` turns it into a build failure.

```bash
grep -rniE "milestone [0-9]{3}|is next|not wired up|not yet|upcoming|planned|will move|candidates, not claims" README.md apps/web/src/content/docs apps/web/scripts packages/examples/src/catalog.ts
```

For each hit, check whether the implementation has landed. Cross-check the `planned` map in
`apps/web/scripts/validate-claims.mjs` against the library source.

### 3. Feature claims

```bash
grep -rniE "baseline|supports|uses|built on|no javascript|framework-agnostic|zero runtime" README.md apps/web/src/content/docs
```

Each claim needs proof in `packages/components/src`, `packages/core/src`, or `packages/color/src`.
README.md's own standard is the right one: features the library uses are claims; features it merely
could use are "candidates, not claims". Flag any candidate that has been promoted without an
implementation.

### 4. Counts, catalogs, and groupings

The component count and grouping are meant to come from `packages/examples/src/catalog.ts` and never
be restated by hand.

```bash
grep -rnE "[0-9]+ components|[0-9]+ primitives|eight groups|grouped as" README.md apps/web/src/content/docs
```

Any hard-coded number here is a finding regardless of whether it currently happens to be right.

### 5. Package surface

Compare the `exports` map in `packages/components/package.json` against what the docs tell consumers
to import — especially `apps/web/src/content/docs/docs/reference/packages.mdx`, the framework
guides, and `packages/components/README.md`. A public export must never change name or module, so a
doc naming a moved export is either stale prose or an unannounced break.

Three failures live here that resolving a specifier does not catch, all three found by milestone
030:

**An import that resolves but does nothing.** A bare `import '@timelessui/components/define/ui-x'`
is only registration if that module has a module-level side effect. Read the module, do not trust
the sentence around it:

```bash
grep -rn "customElements.define\|defineRegisteredElement(" packages/components/src/define/
grep -rn "^import '@timelessui/components/define/" apps/web/src/content/docs packages/components/skills context7.json
```

Every hit in the second command is a claim that the first command has to support. The same question
applies to any snippet whose only job is a side effect.

**A documented file the published package does not carry.** The site deploys on every push to `main`
and npm publishes only on a tag, so documentation can promise a component that no released version
contains. Check the docs against the tarball, not against `dist/`:

```bash
npm pack @timelessui/components --pack-destination /tmp >/dev/null && tar tzf /tmp/timelessui-components-*.tgz | sed 's|^package/||' | sort > /tmp/published.txt
grep -rhoE "@timelessui/components/(css|define)/[a-z0-9/.-]+" apps/web/src/content/docs | sort -u
```

A `css/` specifier maps to `dist/<path>`, a `define/` specifier to `dist/<path>.js`. Anything
missing is a documented install that fails at build time for a consumer on the latest release.

**A public root documented nowhere.** `validate-docs.mjs` proves that documented things have routes,
not that every root is documented, so a root can ship styled and unmentioned:

```bash
node --input-type=module -e '
import { readFileSync } from "node:fs"
const { components } = await import("./packages/components/scripts/component-registry.mjs")
const catalog = readFileSync("packages/examples/src/catalog.ts", "utf8")
const claimed = new Set(
  [...catalog.matchAll(/contracts:\s*\[([^\]]*)\]/g)]
    .flatMap((m) => m[1].split(",").map((s) => s.trim().replace(/[^a-zA-Z]/g, ""))),
)
for (const c of Object.values(components)) {
  if (c.root?.name && !claimed.has(c.name)) console.log("unclaimed root:", c.root.name)
}
'
```

Then check the inverse of the URL convention. The skill and `context7.json` both tell an agent to
fetch `/docs/components/<component>.md`, but that route is keyed by catalog id rather than by root,
so a root name lifted out of `reference/contracts.md` can 404. Every row of that table needs a
reachable page.

### 6. Milestone record integrity

```bash
for d in .agents/memory/milestones/*/; do
  for f in PLAN.md TASKS.md RESULTS.md; do [ -f "$d$f" ] || echo "missing: $d$f"; done
done
grep -rln "Pending implementation" .agents/memory/milestones
grep -H "^status:" .agents/memory/milestones/*/PLAN.md
```

Every `PLAN.md` needs `status:` frontmatter reading exactly `Proposed`, `Accepted`, `Implemented`,
or `Rejected`. Report any status the record contradicts — `Implemented` over a `RESULTS.md` that
still reads `Pending implementation.`, or `Accepted` over a milestone whose work demonstrably
shipped.

`.agents/memory/README.md` requires all three files per milestone, except a `Rejected` one, which
keeps only `PLAN.md`, and `001-kickoff`, which predates the structure. Report `RESULTS.md` still
reading `Pending implementation.` while its `TASKS.md` is fully checked, and any file missing its
attribution footer — noting that milestones 001 to 018 predate the footer convention entirely and
019 and 020 adopted it on `RESULTS.md` only. From 021 on, every file should carry one.

### 7. Design language

Token names, color values, and rules quoted in `.agents/memory/DESIGN.md` against
`packages/components/src/tokens.ts` and `src/css/tokens.css`. `validate-contracts.mjs` proves
`uiTokenGroups` against `tokens.css`, so check DESIGN.md's prose values, not the token list itself.

### 8. The generated agent surface, minus what generation proves

`generate:check` proves the grammar's four projections match
`packages/components/scripts/authoring-grammar.mjs`. It says nothing about the configuration sitting
beside them in the same generators, which is hand-written and unproven.

```bash
node -e 'const c=require("./context7.json"),fs=require("fs");
  for (const k of ["folders","excludeFolders"]) for (const p of c[k]) console.log((fs.existsSync(p)?"ok  ":"MISS")+"  "+k+": "+p)'
```

A missing `folders` entry means Context7 indexes nothing from it; a stale `excludeFolders` entry
means it indexes a tree meant to be hidden. Both are silent. `createContext7Config()` in
`packages/components/scripts/emit-agent-skill.mjs` is where they are declared.

Then read, rather than grep:

- `SITE` and `GROUP_ORDER` in `apps/web/src/lib/agent-surfaces.ts`. `GROUP_ORDER` is thrown against
  by `astro.config.mjs`, so it cannot go stale — `SITE` can, and every `.md` link an agent follows
  is built from it.
- The grammar's illustrative markup in `authoring-grammar.mjs` names real attributes and values.
  Nothing checks them against the registry — see check 4 of `audit-component-contracts`, which owns
  that gap.
- The prose in `docs/getting-started/agents.mdx` **around** the generated block. `test:dist`
  spot-checks one rendered rule; the sections describing editor tooling, MCP, and the `.md` routes
  are ordinary prose and drift like any other.

### 9. The `.agents` tree against itself

`.agents/README.md` documents the tree in four tables and a frontmatter contract, and nothing reads
any of it. These checks are cheap and mechanical — run them whole.

```bash
diff <(grep -oE '^\| `[a-z-]+`' .agents/README.md | tr -d '|` ' | sort -u) <(ls .agents/skills | sort) \
  && echo 'skills table: in sync'

for l in .claude/skills .claude/agents .codex/skills; do
  printf '%-16s -> %-24s %s\n' "$l" "$(readlink "$l")" "$([ -e "$l" ] && echo ok || echo BROKEN)"
done

for d in .agents/skills/*/; do
  n=$(basename "$d"); nm=$(sed -n 's/^name: *//p' "$d/SKILL.md" | head -1)
  [ "$n" = "$nm" ] || echo "name/dirname mismatch: $n vs $nm"
  awk '/^---$/{c++;next} c==1 && /^[a-z-]+:/{sub(/:.*/,"");print}' "$d/SKILL.md" \
    | grep -vE '^(name|description|license|allowed-tools|metadata)$' \
    | sed "s|^|unportable key in $n: |"
  awk '/^---$/{c++;next} c==1' "$d/SKILL.md" | grep -q '[<>]' && echo "angle bracket in $n frontmatter"
done
```

The frontmatter allowlist is Codex's, quoted in `.agents/README.md`: `name`, `description`,
`license`, `allowed-tools`, `metadata`, and nothing else. `name` must equal the directory name and
stay under 64 characters; `description` must stay under 1024 and contain no angle brackets. A
violation is a skill Codex refuses to load, so report it as broken rather than stale. That the
allowlist itself still matches Codex's validator is not checkable from this repository — say so
rather than asserting it.

Also confirm by reading:

- The `reference/` and `research/` tables list exactly the files present, and each research document
  still carries its `model` and `date` frontmatter and its record of what it produced.
- Each `.agents/subagents/*.md` names a `SKILL.md` that exists, and its `tools:` line still matches
  the `allowed-tools` of the skill it delegates to. The README's read-only claim for both auditors
  depends on that line, not on the prose.
- Each `agents/openai.yaml` uses only its own allowlist — the six display keys nested under
  `interface:` (`display_name`, `short_description`, `icon_small`, `icon_large`, `brand_color`,
  `default_prompt`), plus the top-level `dependencies.tools[]` and
  `policy.allow_implicit_invocation` — and its `default_prompt` names a skill that exists.
- Server names in `.claude/launch.json` still resolve to real scripts. Its `port` is injected into
  the process as `PORT`, so an entry whose script reads `${PORT:-…}` binds the declared port rather
  than its own default — the two disagreeing is not a finding. What is a finding is the `web` and
  `storylite` ports disagreeing with what `README.md` advertises for `pnpm dev`.

### 10. Rule enumerations that exist twice

The drift vector unique to this surface: a description that lists rules, kept beside the rules it
lists.

Each subagent restates its skill's `description` in its own words, so an edit to one leaves the
other behind. Print the pairs and read them — they are deliberate paraphrases, so a `diff` between
them is noise and always fails:

```bash
for a in .agents/subagents/*.md; do
  n=$(sed -n 's/^name: *//p' "$a" | head -1)
  echo "=== $n"
  awk '/^description:/{f=1} f&&!/^(tools|allowed-tools):/{print} /^(tools|allowed-tools):/{if(f)exit}' "$a"
done
grep -A9 '^description:' .agents/skills/audit-*/SKILL.md
```

Compare the enumerations, not the wording. `docs-drift-auditor` must name the same surfaces as
`audit-docs-drift`, and `contract-auditor` the same rules as `audit-component-contracts` — which in
turn enumerates AGENTS.md's unenforced rules, so **adding a rule to AGENTS.md silently makes two
descriptions incomplete**. That is the highest-value finding in this check, because an incomplete
description is a skill the model stops routing to.

This is a deduplication candidate rather than a correction: a subagent that carried only a pointer
would have nothing to drift. Report it that way.

## Reporting

Group by surface. For each finding: file and line, what it claims, what the source says, and the
minimal correction. Separate confirmed drift from things that merely read oddly.

Where prose restates a fact that a script could prove instead, say so — moving a claim under a
validator is worth more than correcting it once.
