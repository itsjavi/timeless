# Milestone 019 Plan: Typed Authoring Surface

## Goal

Make every public Timeless authoring surface typed and discoverable from one source of truth, so
that attribute names, attribute values, parts, and events complete and type-check in React, Vue,
Svelte, Solid, Preact, Astro, and plain HTML, without adding a framework runtime dependency or
changing any component behavior.

## Problem

Milestone 018 made `scripts/component-registry.mjs` the canonical inventory, but it only records
attribute _names_. The permitted _values_ for those attributes are declared three separate times,
and nothing reconciles them:

| Declaration              | Location                                   | Knows values |
| ------------------------ | ------------------------------------------ | ------------ |
| Public TypeScript unions | `src/primitives.ts`, `src/button.ts`, etc. | Yes          |
| CSS selectors            | `src/css/*.css`                            | Yes          |
| Build-time registry      | `scripts/component-registry.mjs`           | No           |
| Custom Elements Manifest | `custom-elements.json`                     | No           |
| React JSX declarations   | `src/jsx/react.ts`                         | No           |

Consequences today:

- 47 exported unions exist but never reach the manifest, the JSX types, or any editor.
- The manifest types all 36 custom-element attributes as `string`.
- `src/jsx/react.ts` declares `[name: \`data-${string}\`]: unknown`, so every `data-ui-*` attribute
  is accepted, uncompletable, and unchecked.
- The JSX props derive from `Partial<Omit<TElement, keyof HTMLElement>>`, which is the _property_
  surface, so authored attribute names such as `value` on `ui-tabs` are not typed.
- Every element shares one `CustomEvent<UITransitionDetail<unknown>>` event signature.
- Only React is generated. Vue, Svelte, Solid, Preact, and plain HTML have no typings at all,
  although `apps/web` ships guides for all of them.
- `validate-contracts.mjs` already parses `[data-ui-variant='secondary']` out of the stylesheets and
  discards the captured value, so the one available proof of correctness is unused.

## Architecture

- The registry becomes the single declaration of every public attribute value set. Value sets are
  named so they can be shared, e.g. `primitiveSize`, `primitiveDensity`.
- Generation emits the `as const` arrays and union types that `src/primitives.ts` and siblings
  declare by hand today. The existing public type names are re-exported unchanged.
- CSS is the proof of the value sets. Value-level validation runs in both directions: every value a
  stylesheet selects must be declared, and every declared value must be selected or explicitly
  marked as an unstyled default.
- The Custom Elements Manifest becomes the interchange format. It carries union types, defaults,
  descriptions, parts, custom states, custom properties, and per-element event detail types.
- Every framework typing is generated from the manifest. No framework typing is hand-maintained.
- Editor data files cover plain HTML where no type system reaches.
- Class-based components get an opt-in typed attribute helper and an opt-in dev-mode validator,
  because editors have no completion hook for `.ui-*` class plus `data-ui-*` on a native tag.

## Generation targets

| Target                                     | Consumer                                     |
| ------------------------------------------ | -------------------------------------------- |
| `src/contracts.ts` value sets and unions   | TypeScript consumers, `@timelessui/examples` |
| `custom-elements.json`                     | Interchange, editors, downstream generators  |
| `src/jsx/react.ts`                         | React 19+                                    |
| `src/jsx/preact.ts`, `solid.ts`, `qwik.ts` | JSX-family frameworks                        |
| `src/vue.ts`                               | `@vue/runtime-dom` `GlobalComponents`        |
| `src/svelte.ts`                            | `svelteHTML.IntrinsicElements`               |
| `vscode.html-custom-data.json`             | VS Code HTML, Astro, Vue, Svelte templates   |
| `vscode.css-custom-data.json`              | VS Code CSS                                  |
| `web-types.json`                           | JetBrains HTML, Vue, JSX                     |

Generate the framework typings in `generate-elements.mjs` rather than adopting the third-party
`custom-element-*-integration` packages. The existing React emitter is already a template in that
file, the emitters are small, and the explicit `data-ui-*` member trick below is the point of the
milestone and is not something an off-the-shelf emitter produces. Revisit only if the emitter count
grows past what one file can hold.

## React typing fixes

These are the specific defects to correct while regenerating:

- Replace the catch-all `data-${string}` index signature with generated explicit optional members,
  e.g. `'data-ui-variant'?: ButtonVariant`, intersected with a loose index signature. Explicit
  members drive completion and checking; the index signature stays as the escape hatch for
  consumer-authored data attributes.
- Emit both kebab-case attribute names and camelCase property names, so authored markup and
  imperative property assignment are both typed.
- Add the missing global attributes: `key`, `tabIndex`, `hidden`, `dir`, `lang`, `inert`, `popover`,
  `part`, `exportparts`, `dangerouslySetInnerHTML`, `suppressHydrationWarning`.
- Emit per-element event detail types instead of one shared `UITransitionDetail<unknown>`.
- Document, do not fake, the React version boundary: `on*` custom-element event props and non-string
  attribute values require React 19. Angular has no type-level element checking beyond
  `CUSTOM_ELEMENTS_SCHEMA`, and the guide should say so.

## Documentation and stories

Generated types are invisible until the guides say how to switch them on, and two documentation
surfaces already describe this milestone's target state as if it had shipped. Both belong to the
milestone rather than to a follow-up.

- The framework guides in `apps/web/src/content/docs/docs/frameworks/` are where a consumer learns
  which typing import to use, and only `react.mdx` names one today. Vue, Svelte, Solid, Astro, and
  vanilla need the equivalent paragraph, and the new Preact and Qwik targets need a home.
- `docs/reference/packages.mdx` already claims the manifest "declares attributes with union types
  and defaults ... events with their detail types, CSS custom properties, and custom states", and
  that "the build proves every documented value against the stylesheets in both directions". The
  first is partly true today and the second is not true at all. Each claim either becomes true here
  or gets corrected, and the entrypoint table plus the hand-written list of exported value arrays
  both need the new names.
- Editor setup has no page at all. The shipped `vscode.html-custom-data.json`,
  `vscode.css-custom-data.json`, and `web-types.json` are useless to a consumer who is never told to
  register them, and that page is also where the class-based completion limit gets stated plainly.
  `docs/reference/` is autogenerated into the sidebar, so a new page needs frontmatter and an order
  and no change to `astro.config.mjs`.
- Component reference pages render the manifest directly. `apps/web/src/pages/docs/components/`
  falls back to `unknown` for a member type and to a bare `CustomEvent` for an event detail, so
  enrichment is a visible documentation improvement, not only an internal one.
- Stories are the second consumer of the value sets, and several already show the pattern: the
  `range`, `select`, `progress`, `alert`, `separator`, and `button` stories import
  `formControlSizes`, `primitiveSizes`, `alertVariants`, and siblings straight into
  `argTypes.options`. The ones that cannot are the tell — dialog `kind`, toolbar `orientation`, and
  collapsible `density` are declared in `contracts.ts` and exported as no array at all, so those
  stories hand-copy the list and can drift from the contract they demonstrate. Sheet `position` and
  menu-button `placement` hand-copy lists that do exist. All of them become imports once the
  registry owns the value sets.
- `apps/stories` type-checks against the same exports a consumer uses, so its typecheck is the
  cheapest proof that no public name moved.

## Implementation sequence

1. Record the baseline, inventory all 47 unions, and map each one to the registry attribute and the
   stylesheet values it corresponds to.
2. Add named value sets to the registry, generate the unions, and re-export the existing public type
   names from their current modules so the public surface is unchanged.
3. Extend `validate-contracts.mjs` to round-trip attribute values against the stylesheets, with an
   explicit allowlist for unstyled defaults.
4. Enrich the manifest with union types, defaults, descriptions, parts, custom states, custom
   properties, and event detail types, and validate it against the published CEM schema.
5. Regenerate the React typings with the fixes above, then add the Preact, Solid, Qwik, Vue, and
   Svelte emitters and their subpath exports.
6. Generate the VS Code custom data and JetBrains web-types files, ship them in the package, wire
   `.vscode/settings.json`, and document consumer setup.
7. Add the opt-in typed attribute helper and the opt-in dev-mode value validator, and adopt the
   helper in `@timelessui/examples` so it is exercised by real consumers.
8. Add per-framework type-level test fixtures, wire them into CI, and add `attw`.
9. Do the documentation and stories work above: the framework guides, the reconciled claims in
   `reference/packages.mdx`, the new editor-setup page, the story control lists, the package README,
   and the repository authoring rules.

## Constraints

- No behavior, visual, accessibility, event, SSR, or no-JavaScript change. This milestone is types,
  metadata, and generation only.
- Every currently exported type name keeps its name, module, and meaning. Consumers importing
  `ButtonVariant` or `PrimitiveSize` must not need to change anything.
- No framework becomes a runtime or peer dependency. Framework typings are types-only subpath
  exports; framework packages appear only as devDependencies of the type-test fixtures.
- The typed attribute helper and the dev validator are opt-in subpath exports and must not enter the
  default entrypoint or affect the performance baselines.
- Generation stays deterministic and `--check` gated, and generated files stay formatted by the
  existing `oxfmt` pass.
- Editor data files describe only the public grammar. No `data-ui-internal-*` hook may appear in the
  manifest, the editor data, the web-types, or any framework typing.
- Accept the asymmetry honestly: editors can complete `ui-*` tags, their attributes, and their
  attribute values in plain HTML, but they have no reliable hook for `.ui-*` class-based components
  on native tags. Document that limit rather than shipping a fragile workaround.

## Acceptance

- The registry declares every public attribute value set exactly once, and every public union type
  in the package is generated from it.
- `pnpm contracts:validate` fails when a stylesheet selects an undeclared attribute value, and when
  a declared value is neither selected nor allowlisted as an unstyled default.
- `custom-elements.json` types every attribute as a union or a documented primitive, carries
  defaults, parts, custom states, and per-element event detail types, and validates against the CEM
  schema.
- React, Preact, Solid, Qwik, Vue, and Svelte typings are generated, exported as subpaths, and
  covered by a compiling fixture per framework.
- In a React fixture, `data-ui-variant` completes with the seven button variants, and
  `data-ui-variant="nope"` is a type error asserted with `@ts-expect-error`.
- In a plain `.html` file with the shipped custom data configured, `<ui-tabs orientation="` offers
  `horizontal` and `vertical`.
- The typed attribute helper is exported, used by `@timelessui/examples`, and the dev validator
  warns on an unknown `data-ui-*` value without being reachable from the default entrypoint.
- `attw` and strict `publint` pass, and existing generation, manifest, export, boundary, and
  performance checks pass.
- Every framework guide names the typing import for its framework or says plainly that none exists,
  including the React 19 and Angular caveats, and the package README matches.
- No claim on `reference/packages.mdx` describes behavior this milestone did not deliver.
- A consumer can register the editor data files by following one documented page, which also states
  the class-based completion limit.
- No component reference page renders `unknown` for a member type or a bare `CustomEvent` for an
  event detail.
- No `.stories.ts` file hand-copies a contract value list into `argTypes.options`, and
  `apps/stories` type-checks and builds unchanged.
