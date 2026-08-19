# Milestone 019 Tasks

## Baseline and inventory

- [x] Confirm milestone 018 is complete and the worktree is clean.
- [x] Record the starting commit, package versions, and runtime in `RESULTS.md`.
- [x] Create `PLAN.md`, `TASKS.md`, and `RESULTS.md`.
- [x] Inventory all 47 exported unions and map each to its registry attribute and stylesheet values.
- [x] Record every value that appears in CSS but in no union, and every union value with no CSS
      selector, as the initial reconciliation list.

## Registry value sets

- [x] Add named, shared value sets to the registry for both `data-ui-*` and custom-element
      attributes, including defaults.
- [x] Generate the `as const` arrays and union types into the generated contracts module.
- [x] Re-export every existing public type name from its current module without renaming.
- [x] Replace the hand-authored arrays in `src/primitives.ts`, `src/button.ts`, and siblings.
- [x] Import the generated unions in component sources so accessor types and contract types are one
      declaration, starting with `TabsOrientation` in `src/tabs.ts`.
- [x] Confirm `@timelessui/examples` still type-checks against the unchanged type names.

## Value validation against CSS

- [x] Extend `validate-contracts.mjs` to capture the attribute value it already parses.
- [x] Fail on stylesheet values that are not declared in the registry.
- [x] Fail on declared values that are neither selected nor allowlisted as unstyled defaults.
- [x] Record the allowlist with a reason per entry. None was needed: every declared value is either
      selected by CSS or is the attribute default, which is the stylesheet's base rule.
- [x] Verify the check fails on a deliberately introduced bad value before landing it.

## Custom Elements Manifest

- [x] Emit union type text, defaults, and descriptions for every attribute and field.
- [x] Emit `cssStates` and `cssProperties` from the contracts. Parts ship as `timeless:parts` with
      their real selector rather than `cssParts`, which would claim a `::part()` contract this
      library does not have. `validate-manifest.mjs` now rejects `cssParts`.
- [x] Emit per-element event names with their detail types.
- [x] Decide and record whether CSS-only components appear in the manifest or only in the editor
      data files.
- [ ] Validate the manifest against the published CEM JSON schema in `manifest:validate`. Not done:
      the schema has no vocabulary for `timeless:parts`, and `manifest:validate` already proves the
      shape, the tag set, the dispatched events, the named detail types, and the absence of private
      hooks. Revisit if a downstream tool needs schema conformance.
- [x] Confirm no `data-ui-internal-*` hook appears anywhere in the manifest.

## Framework typings

- [x] Replace the `data-${string}` catch-all with generated explicit `data-ui-*` members plus a
      loose index signature escape hatch.
- [x] Emit both kebab attribute names and camelCase property names per element.
- [x] Add the missing global attributes to the shared props type.
- [x] Emit per-element event handler props with real detail types.
- [x] Add the Preact and Solid emitters. Qwik is omitted: its JSX module name changed between majors
      and its custom-event prop convention could not be verified, so no declaration ships rather
      than one that might be wrong. Stated on `packages.mdx`.
- [x] Add the Vue emitter targeting `@vue/runtime-dom` `GlobalComponents`.
- [x] Add the Svelte emitter targeting `svelteHTML.IntrinsicElements`.
- [x] Add the new subpath exports and keep the export map ordered and validated.

## Editor support for plain HTML

- [x] Generate `vscode.html-custom-data.json` with tags, attributes, values, and descriptions.
- [x] Generate `vscode.css-custom-data.json` for public custom properties and custom states.
- [x] Generate `web-types.json` and add the `web-types` package field.
- [x] Add all three to the package `files` array.
- [x] Wire `html.customData` and `css.customData` in `.vscode/settings.json`. Local only:
      `.gitignore` re-ignores that file, so the documented setup page is what reaches consumers.
- [x] Verify completion manually in a scratch `.html` file for a tag, an attribute, and a value.

## Authoring helpers

- [x] Add the typed attribute helper for class-based components as an opt-in subpath export.
- [x] Add the opt-in dev-mode validator that warns on unknown public `data-ui-*` values.
- [x] Adopt the helper in `@timelessui/examples` factories.
- [x] Confirm neither helper is reachable from the default entrypoint and that the performance
      baselines are unchanged.

## Documentation

- [x] Update the React, Vue, Svelte, Solid, Astro, and vanilla framework guides in
      `apps/web/src/content/docs/docs/frameworks/` so each one names the typing import for its
      framework, or says plainly that none exists.
- [x] Give Preact its own guide at `frameworks/preact.mdx`. Qwik has no shipped target to document.
- [x] Document the React 19 event and attribute boundary and the Angular limitation.
- [x] Add the new typing and editor-data subpaths to the entrypoint table in
      `docs/reference/packages.mdx`.
- [x] Reconcile every existing claim on `docs/reference/packages.mdx` with what shipped: the
      manifest union types, defaults, event detail types, custom properties, and custom states, and
      the bidirectional stylesheet proof. Make each claim true or correct it.
- [x] Update the hand-written list of exported value arrays on that page with any new value-set
      names.
- [x] Add an editor-setup page under `docs/reference/` covering VS Code `html.customData` and
      `css.customData` and the JetBrains `web-types` field, with an `order` in its frontmatter.
- [x] Document the class-based completion limitation and the helper that compensates for it on that
      page.
- [x] Confirm the component reference pages render the enriched manifest, with no `unknown` member
      type and no bare `CustomEvent` event detail left on any page.
- [x] Update the package README and the repository authoring rules.

## Stories

- [x] Replace hand-copied contract value lists in `argTypes.options` with the generated arrays,
      starting with sheet `position` and menu-button `placement`, which already have exports.
- [x] Export value sets for dialog `kind`, toolbar `orientation`, and collapsible `density`, which
      are declared in `contracts.ts` today with no array to import, then use them in those stories.
- [x] Confirm the stories that already import value arrays keep working unchanged: `button`,
      `range`, `select`, `progress`, `alert`, `separator`, `field`, `choice-group`, `avatar`,
      `spinner`, `badge`, `tabs`, and `large-dataset`.
- [x] Confirm copied story source is unchanged by the typed attribute helper, with no helper output
      or internal hook leaking into the copy surface.
- [x] Run the `apps/stories` typecheck and build as the proof that no public export name moved.
- [x] Check whether `button.stories.md` needs a note about the typed authoring surface, and leave it
      alone if it does not.

## Verification and completion

- [x] Add type-level fixtures per framework with `@ts-expect-error` assertions on bad values, in
      `src/framework-types.test.ts`. They assert the generated props types rather than each
      framework's own JSX pipeline, which would need five toolchains installed.
- [x] Wire the fixture type checks into CI.
- [x] Add `attw` alongside the existing strict `publint`.
- [x] Run the full gate set: type checks, unit tests, generation, contracts, manifest, exports,
      boundaries, performance, `publint`, `attw`, builds, and browser suites.
- [x] Confirm `apps/e2e/tests/apps/web/component-reference.spec.ts` still passes on every reference
      page after the manifest enrichment.
- [x] Record decisions, trade-offs, and results in `RESULTS.md`.
