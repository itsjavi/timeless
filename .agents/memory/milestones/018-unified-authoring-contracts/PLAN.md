---
status: Implemented
---

# Milestone 018 Plan: Unified Component Authoring Contracts

## Goal

Refactor every public Timeless component contract around one predictable grammar while preserving
the current visual design, behavior, accessibility, CSS exports, Light DOM customization, and
no-JavaScript fallback.

## Authoring grammar

| Concern                         | Canonical syntax                                     |
| ------------------------------- | ---------------------------------------------------- |
| Native component identity       | `.ui-*` class                                        |
| Native visual configuration     | Contract-declared `data-ui-*` attributes             |
| Behavioral component identity   | Registered `<ui-*>` element                          |
| Custom-element configuration    | Plain attributes                                     |
| Light DOM anatomy               | Native semantics first, then `data-ui-part`          |
| User-visible state              | Native attributes, ARIA, and platform pseudo-classes |
| Custom host state               | `ElementInternals.states` and `:state()`             |
| Unavoidable child runtime state | Private `data-ui-internal-*` attributes              |

This is a clean break. Old selectors and aliases are removed in this milestone without a runtime
compatibility layer.

## Architecture

- Replace the separate button, primitive, form, and overlay contract objects with one generated,
  typed `componentContracts` catalog.
- Use one build-time registry to generate the public catalog, Custom Elements Manifest, definition
  entrypoints, aggregate registration, and React JSX declarations.
- Keep `.ui-*` roots and their contract-declared visual configuration for native CSS components.
- Permit `ui-*` tags only for registered behavioral custom elements.
- Use semantic selectors before `data-ui-part`; use lowercase whitespace-separated part tokens when
  semantics cannot identify authored Light DOM.
- Use native and ARIA state before custom host state, then private child runtime hooks as a final
  fallback.
- Keep internal hooks out of copied examples, public metadata, and the Custom Elements Manifest.

## Implementation sequence

1. Record the clean baseline and inventory every root, configuration attribute, anatomy hook, state,
   diagnostic, runtime hook, alias, and demo-only selector.
2. Introduce the unified registry, generated catalog, generation checks, and selector validation.
3. Convert CSS-only primitives and form controls to `data-ui-part`, native state, and native
   separator markup.
4. Convert behavioral components to semantic anatomy, canonical parts, custom host states, and
   private child runtime hooks.
5. Migrate canonical examples, StoryLite, Starlight, package documentation, framework guides,
   repository guidance, and E2E selectors.
6. Remove old exports and selectors, run the retired-selector audit, complete all verification, and
   record the results.

## Constraints

- Preserve keyboard behavior, focus handling, accessible names, ARIA relationships, native form
  behavior, transition events, SSR markup, and no-JavaScript fallbacks.
- Preserve the current visual design, tokens, cascade layers, selector specificity, and CSS exports.
- Do not generate visual classes or required visual DOM from component JavaScript.
- Keep public parts scoped to their owning root and prevent nested components from leaking parts to
  ancestors.
- Keep historical milestones unchanged even when they contain retired names.
- Defer package versioning and publication to a separate release decision.

## Acceptance

- `componentContracts` contains every public CSS component and registered custom element exactly
  once and drives all generated public artifacts.
- Every public `ui-*` tag is registered; the unregistered `ui-separator` API is removed.
- Canonical examples, StoryLite, Starlight, package docs, and framework guides use only the new
  grammar.
- Public CSS and examples contain no retired anatomy, alias, diagnostic, or runtime selectors.
- Internal runtime hooks use `data-ui-internal-*` and never appear in public metadata or copied
  source.
- Unit, package, generation, documentation, accessibility, no-JavaScript, build, and browser gates
  pass without an intentional visual redesign.
