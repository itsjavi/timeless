---
name: audit-docs-drift
allowed-tools: Bash, Read, Grep, Glob
description:
  Sweep Timeless UI prose against the source it describes — README.md, AGENTS.md, the MDX
  documentation, catalog guidance, registry descriptions, milestone records, and DESIGN.md — and
  report claims the code no longer supports. Read-only. Use for requests like "check the docs", "are
  the docs still accurate", or "is the README stale", when preparing a release, when closing a
  milestone, and after a change to the public API or the generated pipeline. Reports drift; it does
  not write new documentation.
---

# Audit documentation drift

Read-only. Report findings; do not fix them unless asked.

Two scripts already cover part of this and should be run first rather than reproduced:

```bash
node apps/web/scripts/validate-claims.mjs   # landing-page tin shelf vs library source
node apps/web/scripts/validate-docs.mjs     # element/CSS coverage, routes, framework guides
```

`validate-claims.mjs` proves only the landing page's platform claims. `validate-docs.mjs` proves
only that every element and stylesheet is documented somewhere and that routes are unique.
Everything below is prose neither one reads.

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

Each claim needs proof in `packages/components/src` or `packages/core/src`. README.md's own standard
is the right one: features the library uses are claims; features it merely could use are
"candidates, not claims". Flag any candidate that has been promoted without an implementation.

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

`.agents/memory/README.md` requires all three files per milestone. Report `RESULTS.md` still reading
`Pending implementation.` while its `TASKS.md` is fully checked, and any file missing its
attribution footer — noting that milestones 001 to 018 predate the footer convention and are
explicitly grandfathered.

### 7. Design language

Token names, color values, and rules quoted in `.agents/memory/DESIGN.md` against
`packages/components/src/tokens.ts` and `src/css/tokens.css`. `validate-contracts.mjs` proves
`atmosphereTokenGroups` against `tokens.css`, so check DESIGN.md's prose values, not the token list
itself.

## Reporting

Group by surface. For each finding: file and line, what it claims, what the source says, and the
minimal correction. Separate confirmed drift from things that merely read oddly.

Where prose restates a fact that a script could prove instead, say so — moving a claim under a
validator is worth more than correcting it once.
