# Milestone 018 Results

## Baseline

- Starting commit: `4d10ceb76400b1182772705fba36a89df4ae8ac9`.
- Starting package version: `0.0.1`.
- Runtime: Node 24.19.0 with the repository-declared pnpm 11.22.0.
- Milestone 017 was complete and the worktree was clean before milestone setup.
- The current public surface contains 18 registered custom elements, 37 component CSS exports, and
  46 canonical examples.
- The initial repository scan found 133 distinct `data-ui-*` names across components, examples,
  stories, and tests.

## Decisions and constraints

- This milestone is a clean break with no compatibility selectors.
- Native visual configuration remains expressed through contract-declared `data-ui-*` attributes.
- Public Light DOM anatomy uses semantic selectors first and `data-ui-part` otherwise.
- Runtime state follows platform, ARIA, custom host state, then private child data in that order.
- The current visual design, public CSS exports, behaviors, and events remain unchanged.

## Summary

Milestone 018 replaces the separate button, primitive, form, and overlay metadata with one
build-time registry and one generated public catalog. The registry contains 53 contracts, split
between 35 CSS components and all 18 registered custom elements. It now drives the public contract
types, Custom Elements Manifest, per-element definition modules, aggregate registration, and React
JSX declarations.

CSS-only components now have one class root. Their visual options remain contract-declared
`data-ui-*` attributes, their authored anatomy uses native semantics or tokenized `data-ui-part`,
and their visible state uses native or ARIA state. The unregistered `ui-separator` tag and anatomy
helper classes such as `ui-range-field`, `ui-table-scroll`, and disclosure subpart classes were
removed.

Behavioral components now use registered hosts without companion surface classes. Collections, tabs,
menus, overlays, selection controls, toast, number stepper, and color picker use semantic anatomy
first. Toast closing and Color Picker contextual mode use custom host state. Floating and
active-option implementation hooks use private `data-ui-internal-*` attributes.

An ownership-aware part query prevents a component from claiming parts below a nested custom element
or nested CSS component root. Canonical examples, StoryLite, Starlight, framework guides, package
documentation, repository guidance, and E2E selectors now use the same grammar.

The build-time registry is the machine-readable canonical inventory. Contract and example validators
classify class roots, registered tags, configuration attributes, parts, state, data, private runtime
hooks, and the three explicit demo-only classes. Migration assertions retain the retired state,
diagnostic, alias, and runtime names only to prove they are no longer emitted.

## Validation results

- Generated catalog freshness, selector validation, manifest validation, export validation,
  generated DOM checks, performance checks, and repository boundary checks pass.
- `@timelessui/core`: type check passed, 9 test files and 33 tests passed, and strict `publint`
  passed.
- `@timelessui/components`: type check passed, 28 test files and 96 tests passed, the package build
  passed, and strict `publint` passed.
- Canonical examples: type check passed and all 46 examples passed registration, export, class,
  configuration, part, and private-hook validation.
- StoryLite: type check passed, 1 test file and 6 smoke tests passed, and the production build
  passed.
- Starlight: Astro check passed with 0 errors, warnings, or hints. Documentation validation covered
  46 examples, 18 elements, and 37 CSS exports. The production build generated 106 pages.
- Chromium StoryLite coverage completed all 218 checks. This includes axe automation, 320 CSS pixel
  reflow, text spacing, no-JavaScript behavior, keyboard and focus flows, forms, overlays,
  performance, and platform behavior.
- The focused platform suite passed 15 checks across Chromium, Firefox, and WebKit, including
  `:state()` rendering, native dialog focus return, popover synchronization, Light DOM replacement,
  and form reset behavior.
- The documentation-site Chromium suite passed 4 checks. The composed deployment suite passed all 6
  routes after the direct StoryLite, Astro, and site-composition steps.
- The retired-selector audit reports only intentional negative migration assertions. Canonical
  examples contain no unregistered `ui-*` tags, uncataloged public classes, unknown parts, or
  consumer-authored `data-ui-internal-*` hooks.

## Remaining manual review

- No intentional visual redesign was made. Automated accessibility, reflow, theme, forced-color,
  interaction, and browser checks passed, but a human pixel-level comparison was not performed.
- The aggregate `pnpm build:site` wrapper produced no output and did not complete in this execution
  environment, so it was interrupted. Its constituent StoryLite build, Astro build,
  `compose-static-site.mjs`, and composed-site Playwright suite all passed directly.
- Package publication and versioning remain outside this milestone.
