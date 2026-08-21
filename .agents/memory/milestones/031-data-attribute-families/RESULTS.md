# Milestone 031 Results

## What changed

The library's twenty-one `data-ui-*` names were four families held together by convention. They are
now four families held together by the registry: 12 configuration, 1 anatomy, 2 per-item, 4 private
hooks — down from six private hooks.

### Per-item attributes are declared where they live

`part()` takes a fifth positional field for attributes, and `data-ui-value` and `data-ui-label` are
declared on the `option` part through one shared `OPTION_DATA_ATTRIBUTES()` helper, with
`data-ui-value` also declared on the `tab` part. They flow into `ComponentPartContract.attributes`,
`custom-elements.json`'s `timeless:parts`, the reference page, the `.md` output, and the packaged
skill's contract table, which now names a part's own attributes inline as
`` `option`* (data-ui-value, data-ui-label) ``.

Declaring them on the part rather than on the component was the whole point. Putting them in
`attributes` on the host would have generated a DOM property and a plain-attribute contract for
input that is authored on a child element, and would have made `check-markup.mjs` report
`configuration-on-host` for correct markup.

### Two validators stopped guessing

`validate-contracts.mjs` carried `name === 'data-ui-value'` as a literal in its
uncatalogued-attribute sweep. It now derives that set from the declared part attributes, and asserts
the new part shape — including a refusal to declare permitted _values_ on a part attribute, because
no stylesheet selects one and the two-way proof would have nothing to prove it against.

`check-markup.mjs` gained a check for `data-ui-*` on an element carrying `data-ui-part`. Its two
existing loops key off a root class or a host tag, and an option has neither, so `data-ui-valeu` on
an option was silent while `data-ui-varaint` on a root was caught. The new check distinguishes a
misplaced attribute (`data-ui-label` on a `tab`, which names the part) from one nothing reads at
all, and it also catches root configuration stranded on a part that is not a root — dead markup that
previously passed. Eight cases cover it.

The subtlety is an element that is a part _and_ a root —
`<div class="ui-card" data-ui-part="option">` — where each loop has to know what the other owns.
Resolving the part's declarations before either loop runs fixes both halves: the root loop stops
reporting a valid part attribute its own contract does not declare, and the part loop leaves the
genuinely-unknown case to the root loop rather than reporting it twice. Two of the eight cases pin
that down.

### Two private hooks retired

`data-ui-internal-placement` was written by `applyFloatingPosition` and removed by
`clearFloatingPosition`, and nothing read it: no stylesheet selects it, no module reads it, and
`applyFloatingPosition` already _returns_ the same placement, which is what its tests were already
asserting. Removing it and its three assertions lost no coverage.

`data-ui-internal-paged` became a module-level `WeakSet<OptionLike>`. `WeakSet.delete` returns
whether the key was present, so the `hasAttribute`/`removeAttribute` pair collapsed into
`if (hiddenByPager.delete(option)) option.hidden = false`. This removes a DOM write per option per
keystroke on a paged Combobox.

All four surviving hooks now have both a code reference and a stylesheet that selects them, which is
the bar the milestone set.

### The families are written down

`AGENTS.md` opens the attribute rules with a four-family table keyed by _does a stylesheet select
this?_, plus a rule line for the per-item family beside the existing anatomy rule. The authoring
grammar gained a matching rule, so the family reaches `context7.json`, `/llms.txt`,
`/llms-full.txt`, the agents page, and the packaged skill from the one declaration that already
feeds all five.

## Constraints found during the work

- **`OptionLike` lost a required member.** `removeAttribute` existed on it only for the paged
  attribute. Removing it narrows an exported type, which is safe in the direction that matters — the
  type is a structural parameter bound, so every real element still satisfies it — but it is a
  type-level change to a published package, not a pure internal refactor.
- **The `WeakSet` does not survive a fresh module instance adopting live paged DOM.** The attribute
  did. That instance then treats a consumer-hidden option and a pager-hidden one alike, which is
  what it already does on the first render of any paged collection, so the trade was worth taking.
  It is recorded in the comment beside the set rather than left to be rediscovered.
- **A part attribute must not declare permitted values.** `validate-contracts.mjs` proves declared
  values against the stylesheets in both directions, and there is no CSS behind a per-item
  attribute. Rather than special-casing the proof, the shape assertion now refuses the declaration,
  so the family cannot grow a set that nothing can check.
- **`apps/web` typechecks against `dist`, not `src`.** Adding a field to `ComponentPartContract` and
  consuming it in an Astro page fails `astro check` until `@timelessui/components` is rebuilt. Not a
  new constraint, but it bites any contract change that a documentation surface reads in the same
  commit.
- **The gaps this milestone closed were both papered over rather than unknown.** The validator
  literal and the three part _description_ strings naming `data-ui-value` were each a place where
  someone had noticed the attribute and written prose instead of a declaration.

## Trade-offs not taken

The census that started this milestone also weighed renaming `data-ui-part` to `data-part` and the
per-item pair to `data-value` / `data-label`, and moving the twelve configuration attributes to
modifier classes such as `ui-size--sm`. All three were rejected; `PLAN.md` records the reasoning so
the question does not get reopened from scratch. The short version: the configuration attributes are
enumerated dimensions whose mutual exclusion, typing, and two-way proof all depend on being
attributes with a closed value set, and the shorter `data-*` names collide with a convention another
headless library already ships — for `data-value` against a failure mode that submits a wrong form
value rather than mis-styling something.

## Verification

`pnpm typecheck`, `pnpm format:check`, `pnpm build`, `pnpm test` (310 component + 15 stories +
core), `pnpm -F @apps/web test:dist`, `pnpm contracts:check`, `pnpm publint`, `pnpm attw`, and the
four component validators are green. `audit-component-contracts` over the diff was clean on every
check; the missing grammar rule for the per-item family was its one observation, and it is fixed
above.

---

Generated by Claude Opus 5 (High)

Implemented by Claude Opus 5 (High)
