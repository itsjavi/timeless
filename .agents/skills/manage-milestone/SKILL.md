---
name: manage-milestone
description: Open, advance, or close a milestone under .agents/memory/milestones — PLAN.md, TASKS.md, RESULTS.md, the numbering scheme, the Proposed/Accepted/Implemented/Rejected status frontmatter, and the model attribution footers. Use for requests like "plan this out", "start a milestone", "update the tasks", "write up what we did", "close the milestone", or "reject that one". Only for cross-cutting work: a small localized change needs no milestone unless asked.
---

# Manage a milestone

Milestones live in `.agents/memory/milestones/` and are the project's planning record. Read
`.agents/memory/README.md` first — it is the authority; this skill is the procedure.

## Does the work need one?

Yes for cross-cutting component work, new public APIs, architecture changes, package or app
additions, and anything needing multiple implementation steps. No for small localized changes,
unless the user asks.

When in doubt, ask rather than assume. An unnecessary milestone is clutter; a missing one loses the
constraints discovered during the work.

## Opening

1. `ls .agents/memory/milestones/` and take the next number. Zero-padded to three digits, then a
   short lowercase hyphenated slug: `021-slug-here`.
2. Create all three files: `PLAN.md`, `TASKS.md`, `RESULTS.md`. All three, at creation — a milestone
   folder with only `PLAN.md` is incomplete, and several early ones are.
3. Open `PLAN.md` with `status:` frontmatter — see below.
4. Do the investigation **before** writing `PLAN.md`. The strongest plans in this repo are the ones
   whose baseline was measured first: line counts, duplicate helper counts, which gate will fail and
   with what message, what the platform actually does when tested rather than what the spec says.
5. Footer every file.

### Status

`PLAN.md` opens with YAML frontmatter carrying exactly one status:

```markdown
---
status: Proposed
---

# Milestone 021 Plan: ...
```

| Status        | Means                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| `Proposed`    | Drafted, not yet agreed to run                                            |
| `Accepted`    | Agreed and scheduled, implementation unfinished                           |
| `Implemented` | The work landed and `RESULTS.md` records it                               |
| `Rejected`    | Will not be implemented; the folder stays so numbering remains sequential |

Open at `Proposed` unless the user has already agreed to the work, in which case open at `Accepted`.
Advance it as the decision changes. This frontmatter is the **only** part of `PLAN.md` expected to
change after creation.

A rejected milestone keeps its folder and its number. Say why in the file — 010, 011, and 014 are
one-line stubs that do exactly that.

### PLAN.md

The static implementation plan: intended approach, scope, sequencing, constraints, acceptance
criteria. Write it before implementation.

Apart from the `status` frontmatter, **do not rewrite it to match what happened.** When the plan
turns out wrong, the divergence is a result — it goes in `RESULTS.md`. A plan edited to match the
outcome destroys the only record that the approach changed.

### TASKS.md

The live todo list, grouped under `##` headings that follow the plan's sequence, as Markdown
checkboxes. Add, split, check, and uncheck freely as the work moves. Check a box only when the task
is actually complete.

Tasks worth writing are verifiable: "Confirm the repository has zero `commandfor` usage in
`packages/*/src`" beats "audit the codebase". Include the gate runs as tasks, and end with
`- [ ] Record decisions, trade-offs, and results in RESULTS.md`.

### RESULTS.md

Created with the milestone, filled as the work happens. The section shape that works here:

```markdown
# Milestone 0XX Results

## Baseline

Starting commit, package versions, runtime, and the measured facts the plan rests on.

## Platform behavior confirmed before planning

Only when the milestone depends on browser behavior. Say how it was confirmed — direct execution in
a named browser build beats a specification citation, and say so when the spec or MDN was
incomplete.

## Open decisions

Questions the plan deliberately leaves open, each with the trade-off both ways.

## Decisions and constraints

What was decided and why, including constraints discovered during the work.

## Summary

Concise account of what changed.

## Validation results

Which gates ran, on what, and what they said.
```

Do not restate the plan or the task list. Capture what a future reader could not reconstruct from
the diff: why an approach was rejected, what the browser actually did, which constraint forced a
trade-off.

Sections that are honestly not ready read `Pending implementation.` — that is the correct state for
an open milestone, not a gap to fill with guesses.

## Advancing

Update `TASKS.md` as work lands. Append to `RESULTS.md` while the reasoning is fresh — constraints
recorded a week later are already lossy.

Move `status` from `Proposed` to `Accepted` when the work is agreed, or to `Rejected` when it is
dropped. Otherwise leave `PLAN.md` alone.

## Closing

1. Every task checked, or explicitly unchecked with the reason recorded in `RESULTS.md`.
2. `RESULTS.md` has no `Pending implementation.` left.
3. Set `status: Implemented` in the `PLAN.md` frontmatter.
4. Add the `Implemented by` footer line.
5. Run `pnpm qa` and record what it said under `## Validation results`.
6. Retract any documentation that described the milestone as upcoming. `README.md`, the MDX docs,
   and `apps/web/scripts/validate-claims.mjs` all name milestones by number, and
   `validate-claims.mjs` fails the build the moment an implementation appears while its claim is
   still marked `planned`. Run `audit-docs-drift` if unsure what still points at the milestone.

## Attribution footers

Every milestone file ends with a horizontal rule and an attribution line naming what actually
generated the document, including reasoning effort when the agent exposes one:

```markdown
---

Generated by Claude Opus 5 - High reasoning
```

`RESULTS.md` additionally gets, once implementation has happened:

```markdown
Implemented by Claude Opus 5 - High reasoning
```

- `PLAN.md` and `TASKS.md`: `Generated by` at creation.
- `RESULTS.md`: `Generated by` at creation, `Implemented by` only after implementation. Never fill
  `Implemented by` when scaffolding.
- Name whatever really produced the file — `Generated by Codex GPT-5.6 Sol` is equally valid. If a
  different model finishes the work, correct the line.
- Milestones 001 to 018 predate the convention and stay as they are. Do not backfill them.
