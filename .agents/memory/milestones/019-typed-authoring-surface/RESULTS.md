# Milestone 019 Results

## Baseline

- Starting commit: `698e5d900a46d8f9e2612c7e64b5edb49b238559`.
- Starting package version: `0.0.1` for `@timelessui/components` and `@timelessui/core`.
- Runtime: Node 24.19.0 with the repository-declared pnpm 11.22.0.
- The registry holds 53 contracts: 35 CSS components and 18 registered custom elements.
- The registry declares 36 custom-element attributes and 11 distinct `data-ui-*` names, none of
  which carry values.
- The package exports 47 union types derived from hand-authored `as const` arrays that the registry
  does not know about.
- `custom-elements.json` contains 18 modules and types every attribute as `string`.
- `src/jsx/react.ts` is the only framework typing and accepts any `data-${string}` attribute with an
  `unknown` value.
- `apps/web` ships framework guides for React, Vue, Svelte, Solid, Astro, and vanilla, so six
  documented consumption paths currently have one typed path between them.
- `docs/reference/packages.mdx` already documents the manifest as declaring union types, defaults,
  event detail types, custom properties, and custom states, and describes the build as proving every
  documented value against the stylesheets in both directions. Both describe this milestone's target
  state rather than the baseline commit, so the page is ahead of the code.
- There is no documentation page for editor setup, so the editor data files this milestone generates
  would ship with no consumer-facing instructions.
- Story controls are a second declaration site for the same value sets. The `button`, `range`,
  `select`, `progress`, `alert`, and `separator` stories import the exported arrays; sheet
  `position` and menu-button `placement` hand-copy arrays that exist; dialog `kind`, toolbar
  `orientation`, and collapsible `density` hand-copy values that `contracts.ts` declares and no
  module exports.

## Baseline drift since the recorded commit

The worktree has moved past `698e5d9` without a commit. `custom-elements.json` and `contracts.ts`
already carry attribute union types, `cssProperties`, and `cssStates`, so part of the manifest
enrichment in this plan is already done and the `packages.mdx` reconciliation has less to make true
than the baseline above implies. Re-measure the manifest before starting step 4 instead of trusting
these numbers.

## Open decisions

- Whether CSS-only components appear in the Custom Elements Manifest or only in the editor data
  files. The manifest schema is element-oriented; the editor data files are not.
- Whether the generated unions live in `src/contracts.ts` or a sibling generated module, given that
  the existing public type names must keep their current import paths either way.
- Which declared attribute values are legitimately unstyled defaults and belong in the validation
  allowlist rather than being treated as drift.
- Whether Preact and Qwik get their own framework guides or a shared section for other JSX
  frameworks, given that `apps/web` currently has one page per documented framework.
- Whether editor setup belongs on its own `docs/reference/` page or inside the existing packages
  reference, and whether the class-based completion limit is documented there or in the vanilla
  guide.

## Decisions and constraints

Pending implementation.

## Summary

Pending implementation.

## Validation results

Pending implementation.
