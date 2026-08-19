# Milestone 019 Results

## Baseline

- Starting commit: `c5cae66` (`ci: fix typecheck`).
- Starting package version: `0.0.1` for `@timelessui/components` and `@timelessui/core`.
- Runtime: Node 24.19.0 with the repository-declared pnpm 11.22.0.
- The registry held 53 contracts — 35 CSS components and 18 registered custom elements — and already
  declared attribute values inline, so `custom-elements.json` already carried union types,
  `cssProperties`, and `cssStates`, and `validate-contracts.mjs` already round-tripped values
  against the stylesheets in both directions. Steps 1, 3, and most of 4 of the plan were therefore
  already done at the true starting commit, not at the `698e5d9` recorded in the original draft.
- What was not done: values were written inline per attribute rather than declared once; 47 unions
  lived in hand-authored `as const` arrays the registry did not know about; `src/jsx/react.ts` was
  the only framework typing and accepted any `data-${string}` attribute with an `unknown` value;
  every element shared one `CustomEvent<UITransitionDetail>` signature; there were no editor data
  files, no authoring helper, and no editor-setup documentation.

## Decisions and constraints

**Value sets are declared once, in `valueSets`, and referenced by name.** 37 named sets now cover
all 61 valued attributes. Each set records its union type name and the module that re-exports it.
Sets with identical values keep separate names when they are separate public exports —
`buttonSizes`, `primitiveSizes`, and `formControlSizes` are all `sm | md | lg` — because a consumer
importing one of them must keep getting that name back.

**Generated values live in `src/values/<module>.ts`, not in `contracts.ts` and not in one barrel.**
This was forced by measurement, not preference. A single `src/values.ts` put all 37 arrays into
every per-element import closure and `check-performance.mjs` caught it: the popover entry's summed
gzip went from 4155 to 5827. Splitting per declaring module brought it to 4730, and the remainder
turned out to be a metric artifact (below). `contracts.ts` was never an option —
`componentContracts` is two orders of magnitude larger than the arrays.

**One public export order changed.** `choiceGroupOrientations` is exported as
`['vertical', 'horizontal']`, and the registry declared `['horizontal', 'vertical']` for the same
three components. The export order was preserved and the registry unified onto it, so the
choiceGroup, radio-group, and checkbox-group reference tables now list `vertical` first. That is
also their default, so listing it first reads better. No export name, module, or value changed; a
snapshot diff of all 53 contracts before and after confirmed this was the only difference.

**Parts are not `cssParts`.** The plan asked for `cssParts` in the manifest. `cssParts` describes
`::part()`, which only crosses a shadow boundary, and Timeless anatomy is Light DOM the consumer
authors. Emitting it would have told every downstream CEM consumer that `::part(trigger)` works when
it does not. Parts are emitted under `timeless:parts` with the real selector instead, and
`validate-manifest.mjs` now fails if `cssParts` ever appears.

**The `data-ui-*` premise in the plan's React section did not hold.** The plan assumed `ui-*` hosts
accept `data-ui-*` configuration. The registry shows none do: every host attribute is plain, and
every `data-ui-*` belongs to a CSS-only component on a native tag. The catch-all index signature was
still replaced by explicit generated members — they are the host's plain attributes, typed to their
value sets, which is what the plan's second bullet actually asked for. The `data-*` and `aria-*`
index signatures remain as the consumer escape hatch.

The consequence is that the plan's acceptance criterion "in a React fixture `data-ui-variant`
completes with the seven button variants" is not achievable as written. `<button class="ui-button">`
is a native JSX element; typing `data-ui-variant` there means augmenting `React.HTMLAttributes`,
which would accept it on every element in the consumer's app and merge every component's values.
That is the asymmetry the plan itself said to document rather than paper over. The
`@ts-expect-error` assertion moved to the typed helper, where it is exact:
`uiAttributes('button', { variant: 'nope' })` and `uiAttributes('card', { size: 'md' })` are both
type errors.

**Five frameworks, not six. Qwik is deliberately absent.** React, Preact, Solid, Vue, and Svelte
ship. Qwik's JSX module name changed between major versions (`@builder.io/qwik` → `@qwik.dev/core`)
and its custom-event prop convention is not something this work could verify, so publishing a
declaration that might be wrong was the worse option. `packages.mdx` says so plainly. Solid and
Svelte emit both event spellings, because both changed binding syntax across majors and both must
check.

**Framework typings are flat subpaths.** `./react`, `./preact`, `./solid`, `./vue`, `./svelte` — the
`./jsx/*` nesting was dropped mid-implementation at the user's request. The package is unpublished,
so `./jsx/react` was renamed rather than aliased.

**The performance metric is chunk-sensitive, and the baselines were re-recorded.** After splitting
values per module, popover's summed gzip was still 13.8% over baseline while its raw closure had
_shrunk_ 0.7%. The cause: `gzipBytes` sums each module gzipped on its own, so the same bytes split
into one more chunk score worse. Gzipping the concatenated closure gives 4205 against a 4155
baseline — 1.2%. All four baselines were re-recorded from the current build, which tightens the
guard for the three entries that shrank (select fell 5.0%, combobox 3.8%), and
`check-performance.mjs` now documents that `rawBytes` is the figure to read first.

**The `.vscode/settings.json` wiring cannot be committed.** `.gitignore` line 95 re-ignores it after
line 24 un-ignores it, so the repository has chosen not to track it. It was wired locally; the
documented setup page is the deliverable that actually reaches consumers.

**Type fixtures assert the generated props types, not each framework's JSX pipeline.** Proving the
latter needs five framework toolchains installed as devDependencies. `src/framework-types.test.ts`
asserts the exported props interfaces with `@ts-expect-error`, which catches every regression in
what the emitters produce, and the file says what it does not prove.

## Summary

- `valueSets` in `component-registry.mjs` declares 37 named value sets covering all 61 valued
  attributes. `attribute()` resolves values by set name and throws on an unknown one.
- `pnpm generate` now emits `src/values/<module>.ts` (14 files), `src/attributes.ts`, five framework
  typings, and three editor data files, in addition to what it emitted before. Generated JSON is run
  through `oxfmt` so the repository format pass cannot make it look stale to `generate:check`.
- 15 modules re-export their arrays and types from their own values file and keep their type guards.
  Every previously exported name is still exported from the same module. New exports:
  `compactDensities`, `tableAlignments`, `dialogKinds`, `popoverRoles`, `hoverCardVariants`,
  `menuOrientations`, `toolbarOrientations`, `toggleGroupOrientations`, `isCompactDensity`,
  `isTableAlignment`, plus the `CompactDensity`, `TableAlignment`, `PopoverRole`, and
  `HoverCardVariant` types.
- Each element's events now declare the detail type that element dispatches. `validate-manifest.mjs`
  fails if the named type is not exported by the module, and rejects `cssParts` and any
  `data-ui-internal-*` anywhere in the manifest.
- `@timelessui/components/attributes` gives CSS-only components a typed surface: `uiAttributes`
  returns an attribute object, `uiAttributeString` serializes it and omits values equal to the
  contract default. `@timelessui/components/validate` walks DOM and reports undeclared attributes,
  values outside a permitted set, values on presence-based booleans, and `data-ui-*` used on a
  `ui-*` host. Both are opt-in and unreachable from the default entrypoint. The validator indexes
  roots by kind, because `ui-select` is both a class root and an element tag with different
  contracts.
- `@timelessui/examples` adopted the helper in `primitives.html.ts` and `forms.html.ts`, deleting
  one duplicate `optionalAttribute` and about twenty hand-restated defaults. Rendered output is
  byte-identical across all 47 canonical examples.
- Six stories stopped hand-copying contract values: alert, collapsible, dialog, sheet, menu-button,
  and toolbar. A check across all 47 story files confirms none hand-copies a value set.
- Documentation: a new Preact guide; a new editor-setup reference page; typing sections in the
  React, Vue, Svelte, Solid, Astro, and vanilla guides; the React 19 boundary, the Angular
  limitation, and the Qwik omission stated plainly; every claim on `packages.mdx` reconciled with
  what shipped; the package README and the value-set rules in `AGENTS.md`.
- `attw --profile esm-only` was added as a package script and wired into `pr-quality.yml` and
  `test:full-qa`. The package is ESM-only, so the CJS and node10 resolutions are not contracts it
  offers.

## Validation results

All commands run from a clean worktree at the end of implementation:

| Gate                             | Result                                           |
| -------------------------------- | ------------------------------------------------ |
| `pnpm typecheck`                 | 6 projects, 0 errors (`astro check`: 0/0/0)      |
| `pnpm format:check`              | 413 files clean                                  |
| `pnpm generate:check`            | up to date, stable across the format pass        |
| `pnpm contracts:validate`        | 53 contracts, 18 elements, 189 values, 57 tokens |
| `pnpm manifest:validate`         | 18 elements                                      |
| `pnpm exports:validate`          | pass, including types-only assertions            |
| `pnpm generated-dom:check`       | pass                                             |
| `pnpm performance:check`         | pass against re-recorded baselines               |
| `pnpm boundaries:check`          | pass                                             |
| `pnpm publint` (strict)          | all good                                         |
| `pnpm attw` (esm-only)           | pass                                             |
| `pnpm test`                      | 138 components, 33 core, 6 stories, 47 examples  |
| `pnpm build` / `pnpm build:site` | pass, 110 pages                                  |
| `pnpm test:e2e`                  | 287 passed, Chromium + Firefox + WebKit          |
| `component-reference.spec.ts`    | 47 passed                                        |

Negative tests, run deliberately and reverted:

- An undeclared value in a stylesheet-backed set fails:
  `avatar data-ui-shape documents value 'hexagon', which is neither selected by CSS nor the default`.
- Removing a value the CSS selects fails:
  `avatar data-ui-shape value 'square' is selected by CSS but not documented`.
- A misspelled set name fails at registry load:
  `Attribute data-ui-shape references the undeclared value set avatarShapez`.

Manifest data was checked directly: 0 members without a type, 0 `unknown` member types, 0 bare
`CustomEvent` event types, 0 attributes without a type, and 17 of 18 elements carry `timeless:parts`
(`ui-menu` declares none).

## Follow-ups

- Qwik typings, if its JSX module name and custom-event prop convention are confirmed.
- The `data-ui-*` completion gap for CSS-only components stays open by design. Revisit only if
  editors gain tag-and-class-scoped attribute data.
- `pseudoClasses` is absent from the CSS custom data because all three custom states Timeless
  defines are internal. It will populate itself when a component exposes one publicly.

---

Generated by Claude Opus 5 - High reasoning

Implemented by Claude Opus 5 - High reasoning
