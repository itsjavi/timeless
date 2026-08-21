---
status: Implemented
---

# Milestone 031 Plan: Declare the `data-ui-*` Families

## Goal

A census of every `data-ui-*` attribute in the library found twenty-one distinct names in four
families, and found that the boundaries between those families are learned rather than declared:

| Family                       | Names | Selected by CSS | Read or written by JS |
| ---------------------------- | ----- | --------------- | --------------------- |
| Configuration                | 12    | yes             | never                 |
| Anatomy (`data-ui-part`)     | 1     | yes             | yes                   |
| Per-item data                | 2     | never           | yes                   |
| Private hooks (`-internal-`) | 6     | four of six     | yes                   |

The configuration family is fully declared, generated, and proven in both directions by
`validate-contracts.mjs`. The per-item family is not declared at all, and two of the private hooks
are not carrying their weight. This milestone closes both gaps and writes the families down, so the
answer to "does a stylesheet select this?" is generated rather than remembered.

## Scope

### 1. Declare the per-item family

`data-ui-value` and `data-ui-label` are public authoring surface — a consumer writes them on an
option or a tab, and the library reads them to resolve a submitted form value and a filterable
label. They are declared nowhere. They exist only inside three part _description_ strings, which
means:

- They are absent from `custom-elements.json`, the framework typings, and the editor data, so no
  editor completes them and no type checks them.
- `check-markup.mjs` cannot see them. Its `undeclared-attribute` finding fires only on elements
  carrying a root class or a host tag, and an option carries neither — so `data-ui-valeu` on an
  option is silent, while `data-ui-varaint` on a root is caught.
- `validate-contracts.mjs` carries `name === 'data-ui-value'` as a hardcoded literal in its
  uncatalogued-attribute check. No stylesheet selects it, so the literal is dead, but it is the
  shape of the problem: a name the validator has to know about because nothing declares it.
- `data-ui-value` on the `tab` part is undocumented entirely. The `tab` description says to give the
  tab a `value`; `resolveTabValue` falls back to `data-ui-value` and nothing says so.

The fix is to declare them where they live, which is on a part rather than on a root. `part()` gains
a fifth positional field for attributes, threaded through generation into
`ComponentPartContract.attributes`, `custom-elements.json`, the reference page, the `.md`
agent-facing output, and the packaged skill. Then the two validators derive what they currently
hardcode or miss.

### 2. Retire two private hooks

- `data-ui-internal-placement` is write-only. `applyFloatingPosition` stamps it and
  `clearFloatingPosition` removes it; no stylesheet selects it and no module reads it. Only
  `floating.test.ts` asserts it, which is a test asserting its own subject into existence. Remove
  it.
- `data-ui-internal-paged` is a pure membership test — `applyOptionWindow` asks whether the pager is
  the thing that hid a given option. A `WeakSet` answers that without mutating the DOM. Moving it
  removes a DOM write per option per keystroke on a paged Combobox.

Both are private, so neither is a breaking change. That takes the private family from six names to
four, and every one of the four is then justified by a stylesheet selector that can be pointed at.

### 3. Write the families down

The four families go in `AGENTS.md`, keyed by the question asked at the callsite — _does a
stylesheet select this?_ — rather than by the mechanism. This is the part that reduces the cognitive
load; the declaration work above is what keeps the table true.

## Non-goals

The census also weighed renaming `data-ui-part` to `data-part` and the per-item pair to `data-value`
/ `data-label`, and moving the twelve configuration attributes to modifier classes such as
`ui-size--sm`. All are rejected, and the reasoning is recorded here so the question is not reopened
from scratch:

- **Configuration as classes.** The twelve are enumerated dimensions. An attribute holds one value
  and the DOM enforces it; `class="ui-size--sm ui-size--lg"` is legal and resolves by stylesheet
  order. It would also delete the typing layer that makes `data-ui-size="xs"` an error across
  `custom-elements.json`, the framework typings, and the editor data, and it would leave
  `validate-contracts.mjs` unable to tell a value class from a root class or a `ui.utilities` class.
  There are currently zero `.ui-*--*` selectors in the eighty-seven stylesheets: `class` answers
  _what is this_ and `data-ui-*` answers _how is it configured_, and that split is worth keeping.
- **`data-ui-part` to `data-part`.** `data-part` is Zag.js and Ark UI's convention. A consumer with
  both installed would have two libraries stamping the same attribute and two stylesheets selecting
  it on each other's anatomy. The `ui` infix is what makes a collision impossible.
- **`data-ui-value` to `data-value`.** Same collision risk against a far worse failure mode: this
  attribute decides a submitted form value, and it is read from author-supplied children, so a
  consumer already using `data-value` on list items for their own reasons would have it silently
  hijacked.

## Sequencing

Registry first, then generation, then the validators that read the generated output, then the
private-hook removals, then the prose. Generated files are never hand-edited; every step that
changes a contract runs `pnpm generate` before the next.

## Acceptance criteria

- `data-ui-value` and `data-ui-label` appear in `custom-elements.json`, `contracts.ts`, the
  reference page, the `.md` output, and the packaged skill, attributed to the parts that accept
  them.
- `check-markup.mjs` reports `undeclared-attribute` for a misspelled per-item attribute on a part,
  with a test covering it.
- `validate-contracts.mjs` derives the per-item names from the registry, with no attribute name
  written as a literal.
- No occurrence of `data-ui-internal-placement` or `data-ui-internal-paged` remains.
- `AGENTS.md` carries the four-family table.
- `pnpm qa` is green.

---

Generated by Claude Opus 5 (High)
