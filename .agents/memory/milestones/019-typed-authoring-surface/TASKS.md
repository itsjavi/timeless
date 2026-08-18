# Milestone 019 Tasks

## Baseline and inventory

- [ ] Confirm milestone 018 is complete and the worktree is clean.
- [ ] Record the starting commit, package versions, and runtime in `RESULTS.md`.
- [ ] Create `PLAN.md`, `TASKS.md`, and `RESULTS.md`.
- [ ] Inventory all 47 exported unions and map each to its registry attribute and stylesheet values.
- [ ] Record every value that appears in CSS but in no union, and every union value with no CSS
      selector, as the initial reconciliation list.

## Registry value sets

- [ ] Add named, shared value sets to the registry for both `data-ui-*` and custom-element
      attributes, including defaults.
- [ ] Generate the `as const` arrays and union types into the generated contracts module.
- [ ] Re-export every existing public type name from its current module without renaming.
- [ ] Replace the hand-authored arrays in `src/primitives.ts`, `src/button.ts`, and siblings.
- [ ] Import the generated unions in component sources so accessor types and contract types are one
      declaration, starting with `TabsOrientation` in `src/tabs.ts`.
- [ ] Confirm `@timelessui/examples` still type-checks against the unchanged type names.

## Value validation against CSS

- [ ] Extend `validate-contracts.mjs` to capture the attribute value it already parses.
- [ ] Fail on stylesheet values that are not declared in the registry.
- [ ] Fail on declared values that are neither selected nor allowlisted as unstyled defaults.
- [ ] Record the allowlist with a reason per entry.
- [ ] Verify the check fails on a deliberately introduced bad value before landing it.

## Custom Elements Manifest

- [ ] Emit union type text, defaults, and descriptions for every attribute and field.
- [ ] Emit `cssParts`, `cssStates`, and `cssProperties` from the contracts.
- [ ] Emit per-element event names with their detail types.
- [ ] Decide and record whether CSS-only components appear in the manifest or only in the editor
      data files.
- [ ] Validate the manifest against the published CEM JSON schema in `manifest:validate`.
- [ ] Confirm no `data-ui-internal-*` hook appears anywhere in the manifest.

## Framework typings

- [ ] Replace the `data-${string}` catch-all with generated explicit `data-ui-*` members plus a
      loose index signature escape hatch.
- [ ] Emit both kebab attribute names and camelCase property names per element.
- [ ] Add the missing global attributes to the shared props type.
- [ ] Emit per-element event handler props with real detail types.
- [ ] Add the Preact, Solid, and Qwik emitters.
- [ ] Add the Vue emitter targeting `@vue/runtime-dom` `GlobalComponents`.
- [ ] Add the Svelte emitter targeting `svelteHTML.IntrinsicElements`.
- [ ] Add the new subpath exports and keep the export map ordered and validated.

## Editor support for plain HTML

- [ ] Generate `vscode.html-custom-data.json` with tags, attributes, values, and descriptions.
- [ ] Generate `vscode.css-custom-data.json` for public custom properties and custom states.
- [ ] Generate `web-types.json` and add the `web-types` package field.
- [ ] Add all three to the package `files` array.
- [ ] Wire `html.customData` and `css.customData` in the repository `.vscode/settings.json`.
- [ ] Verify completion manually in a scratch `.html` file for a tag, an attribute, and a value.

## Authoring helpers

- [ ] Add the typed attribute helper for class-based components as an opt-in subpath export.
- [ ] Add the opt-in dev-mode validator that warns on unknown public `data-ui-*` values.
- [ ] Adopt the helper in `@timelessui/examples` factories.
- [ ] Confirm neither helper is reachable from the default entrypoint and that the performance
      baselines are unchanged.

## Documentation

- [ ] Update the React, Vue, Svelte, Solid, Astro, and vanilla framework guides in
      `apps/web/src/content/docs/docs/frameworks/` so each one names the typing import for its
      framework, or says plainly that none exists.
- [ ] Give the new Preact and Qwik targets a documented home rather than leaving them export-only.
- [ ] Document the React 19 event and attribute boundary and the Angular limitation.
- [ ] Add the new typing and editor-data subpaths to the entrypoint table in
      `docs/reference/packages.mdx`.
- [ ] Reconcile every existing claim on `docs/reference/packages.mdx` with what shipped: the
      manifest union types, defaults, event detail types, custom properties, and custom states, and
      the bidirectional stylesheet proof. Make each claim true or correct it.
- [ ] Update the hand-written list of exported value arrays on that page with any new value-set
      names.
- [ ] Add an editor-setup page under `docs/reference/` covering VS Code `html.customData` and
      `css.customData` and the JetBrains `web-types` field, with an `order` in its frontmatter.
- [ ] Document the class-based completion limitation and the helper that compensates for it on that
      page.
- [ ] Confirm the component reference pages render the enriched manifest, with no `unknown` member
      type and no bare `CustomEvent` event detail left on any page.
- [ ] Update the package README and the repository authoring rules.

## Stories

- [ ] Replace hand-copied contract value lists in `argTypes.options` with the generated arrays,
      starting with sheet `position` and menu-button `placement`, which already have exports.
- [ ] Export value sets for dialog `kind`, toolbar `orientation`, and collapsible `density`, which
      are declared in `contracts.ts` today with no array to import, then use them in those stories.
- [ ] Confirm the stories that already import value arrays keep working unchanged: `button`,
      `range`, `select`, `progress`, `alert`, `separator`, `field`, `choice-group`, `avatar`,
      `spinner`, `badge`, `tabs`, and `large-dataset`.
- [ ] Confirm copied story source is unchanged by the typed attribute helper, with no helper output
      or internal hook leaking into the copy surface.
- [ ] Run the `apps/stories` typecheck and build as the proof that no public export name moved.
- [ ] Check whether `button.stories.md` needs a note about the typed authoring surface, and leave it
      alone if it does not.

## Verification and completion

- [ ] Add type-level fixtures per framework with `@ts-expect-error` assertions on bad values.
- [ ] Wire the fixture type checks into CI.
- [ ] Add `attw` alongside the existing strict `publint`.
- [ ] Run the full gate set: type checks, unit tests, generation, contracts, manifest, exports,
      boundaries, performance, `publint`, `attw`, builds, and browser suites.
- [ ] Confirm `apps/e2e/tests/apps/web/component-reference.spec.ts` still passes on every reference
      page after the manifest enrichment.
- [ ] Record decisions, trade-offs, and results in `RESULTS.md`.
