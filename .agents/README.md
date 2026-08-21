# .agents

Agent-facing context for Timeless UI. One canonical tree, shared by every coding agent.

```text
.agents/
  memory/         planning artifacts and the design language  — see memory/README.md
  reference/      shared facts the skills link to rather than repeat
  research/       finished research write-ups, kept as a record — not context to load
  skills/         invocable procedures, one directory per skill
  subagents/      Claude Code subagent definitions
```

## Skills

| Skill                       | Use it for                                                  |
| --------------------------- | ----------------------------------------------------------- |
| `author-component`          | Adding or changing a component's public surface, end to end |
| `author-component-story`    | Writing or revising a StoryLite story                       |
| `manage-milestone`          | Opening, advancing, or closing a milestone                  |
| `author-ui-pull-request`    | Opening a PR for a change with a visual delta               |
| `verify-apg-conformance`    | Checking a component against its APG pattern                |
| `audit-component-contracts` | Sweeping for authoring rules no validator enforces          |
| `audit-docs-drift`          | Sweeping prose, and this tree, against their source         |

Each is a directory holding `SKILL.md` with `name` and `description` frontmatter — the format Claude
Code and Codex both read.

## Reference

- `reference/generated-files.md` — every file written by `pnpm generate`, and what is safe to edit.
- `reference/validators.md` — the validator scripts, what each failure message means, and the rules
  no script covers.

Skills link to these rather than restating them, so a fact changes in one place.

## Research

`research/` holds finished research write-ups: competitive comparisons, prior-art studies, and
investigations whose conclusions have already been acted on.

**Do not load these as working context.** They are a historical record, not a source of truth. Each
one is a snapshot of what was true on its `date`, and the code has moved since — a claim here may
have been fixed, reversed, or superseded by the milestones it produced. `reference/` is the place
for facts a skill should rely on; `memory/milestones/` is the place for what is planned or done.

Read a research document when you want to know **why** a decision was made, or to avoid redoing an
investigation someone already finished. Verify anything you intend to act on against the source.

| Document                                                           | Question it answered                                                                                                                      |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [`research/library-comparison.md`](research/library-comparison.md) | Does Timeless ship too much, too little, or the wrong things, measured against Base UI and shadcn/ui? Produced milestones 021 to 025      |
| [`research/llm-support.md`](research/llm-support.md)               | How should a component library make itself usable by coding agents, and which mechanisms suit Astro and Starlight? Produced milestone 027 |

Every document carries `model` and `date` frontmatter naming what produced it and when, and ends
with a section recording what it led to. Add new ones with the same shape and a row in the table
above.

## How each tool discovers this

| Tool          | Path                                      | Mechanism                      |
| ------------- | ----------------------------------------- | ------------------------------ |
| Codex         | `.agents/skills/`                         | Read natively                  |
| Codex         | `.codex/skills` → `../.agents/skills`     | Relative symlink               |
| Claude Code   | `.claude/skills` → `../.agents/skills`    | Relative symlink               |
| Claude Code   | `.claude/agents` → `../.agents/subagents` | Relative symlink               |
| Anything else | `AGENTS.md`                               | The skills section points here |

The symlinks are relative and committed, so a clone wires itself up with no install step. Nothing is
duplicated: editing `.agents/skills/<name>/SKILL.md` changes what every tool reads.

### Agents

The two auditors exist in both tools from the same `SKILL.md`:

- Codex reads `agents/openai.yaml` inside the skill directory, which supplies the display name,
  short description, and default prompt.
- Claude Code reads `.agents/subagents/*.md`, thin definitions that delegate to the same `SKILL.md`
  and restrict the agent to read-only tools.

`audit-docs-drift` sets `allow_implicit_invocation: false` for Codex, because a repo-wide prose
sweep should be asked for rather than triggered. `audit-component-contracts` allows implicit
invocation, since reviewing a diff is the common case.

## Frontmatter, and what is portable

Only five keys are safe in `SKILL.md`. Codex's validator rejects anything else outright, and its
allowlist is the binding constraint:

```python
allowed_properties = {"name", "description", "license", "allowed-tools", "metadata"}
```

- `name` — required. Hyphen-case, must equal the directory name, 64 characters maximum.
- `description` — required. 1024 characters maximum, and **no angle brackets**, which Codex rejects.
- `allowed-tools` — optional. The _key_ is portable; the _values_ are not, since Claude Code and
  Codex name their tools differently. Use it only where a restriction enforces something real: the
  two auditors carry `Bash, Read, Grep, Glob` so "read-only" is a constraint rather than a request.
  The authoring skills stay unrestricted, because they need Write and Edit and a stale list would
  only break them.

There is **no `triggers:` field** in either tool. Nothing does string matching — the `description`
is injected as prose and the model routes on meaning, so quoted phrases in it are illustrative
examples, never literal patterns. Synonyms match a listed phrase perfectly well. What the
description has to be is _discriminating_: enough distinct intents to separate this skill from its
neighbours, plus an explicit boundary naming the sibling skill that owns the adjacent case.
Paraphrases of one intent add nothing and dilute the routing signal against every other description.

`tools:` is a different field, valid only in a Claude Code subagent under `subagents/`. Codex would
reject it in a `SKILL.md`.

Nothing in the build enforces any of this. `audit-docs-drift` check 9 does, mechanically — the
allowlist, the name-to-directory match, the angle brackets, the symlinks, and the tables above — so
run it after editing this tree rather than trusting a review. What it cannot check is whether
Codex's own allowlist still reads as quoted here; that lives outside the repository.

Codex-only configuration goes in `agents/openai.yaml`, whose own allowlist is `display_name`,
`short_description`, `icon_small`, `icon_large`, `brand_color`, `default_prompt`, plus
`dependencies.tools[]` and `policy.allow_implicit_invocation`. Note that `dependencies.tools[]`
declares required MCP servers — what the skill _needs_ — and is unrelated to `allowed-tools`, which
limits what it _may use_.

## Adding a skill

1. Create `.agents/skills/<verb-phrase-name>/SKILL.md`, observing the frontmatter rules above. Spend
   the description on distinct intents and a boundary, not on synonyms.
2. Link shared facts from `reference/` instead of restating them.
3. Add a row to the table above. `AGENTS.md` needs no edit: both Claude Code and Codex list the
   skills automatically, which is why it describes the directory rather than enumerating it.
4. To expose it as a Codex agent, add `agents/openai.yaml`. To expose it as a Claude Code subagent,
   add `.agents/subagents/<name>.md`.

No symlink work is needed — the directories are already linked.
