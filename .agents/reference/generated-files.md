# Generated files

Everything listed here is written by `packages/components/scripts/generate-elements.mjs` from two
declarations: `packages/components/scripts/component-registry.mjs` for the component facts, and
`packages/components/scripts/authoring-grammar.mjs` for the authoring grammar. Two outputs read a
third input, noted in the table below: `src/tokens.ts`, and the version in
`packages/components/package.json`. Editing any output by hand is reverted by the next
`pnpm generate`, and `pnpm generate:check` fails the build in the meantime.

To change any of this content, edit the registry and run:

```bash
pnpm -F @timelessui/components run generate
```

## Inside `packages/components`

| Path                                                 | Holds                                                                                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/values/<module>.ts`                             | One `as const` value array plus its union type per `valueSets` entry, grouped by the set's `module`                                                           |
| `src/contracts.ts`                                   | The full `componentContracts` record: roots, attributes, parts, states, variables, events, accessibility                                                      |
| `src/attributes.ts`                                  | `uiAttributes()` and `uiAttributeString()`, the typed root-attribute builders                                                                                 |
| `src/define.ts`                                      | The aggregate `defineTimelessElements()` plus every per-element re-export                                                                                     |
| `src/define/<tag>.ts`                                | One `define<Name>Element()` entrypoint per custom element                                                                                                     |
| `src/react.ts`                                       | React JSX intrinsic element typings                                                                                                                           |
| `src/preact.ts`                                      | Preact JSX intrinsic element typings                                                                                                                          |
| `src/solid.ts`                                       | Solid JSX intrinsic element typings                                                                                                                           |
| `src/vue.ts`                                         | Vue `GlobalComponents` typings                                                                                                                                |
| `src/svelte.ts`                                      | Svelte element typings                                                                                                                                        |
| `custom-elements.json`                               | Custom Elements Manifest                                                                                                                                      |
| `vscode.html-custom-data.json`                       | Editor completion for tags and attributes                                                                                                                     |
| `vscode.css-custom-data.json`                        | Editor completion for CSS custom properties, built from `src/tokens.ts`                                                                                       |
| `web-types.json`                                     | JetBrains web-types. Carries `@timelessui/components`'s version, so a release bump makes this file stale — `pnpm release:bump` regenerates it for that reason |
| `skills/using-timeless-ui/reference/contracts.md`    | Every root, its kind, its configuration attributes and the value set each names, its parts, and its stylesheets. From the registry                            |
| `skills/using-timeless-ui/reference/grammar.md`      | The authoring grammar as prose, summary blockquote included. `apps/web` reads this file for the `/llms.txt` and `/llms-full.txt` preamble. From the grammar   |
| `skills/using-timeless-ui/reference/agents-block.md` | The same grammar as imperative one-liners, for a consumer's own `AGENTS.md`. Rendered on the agents page by `AgentsBlock.astro`. From the grammar             |
| `skills/using-timeless-ui/SKILL.md`                  | The consumer agent skill: frontmatter, the grammar, and the verification checklist. From the grammar                                                          |

## Outside `packages/components`

| Path            | Holds                                                                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context7.json` | Context7's indexing configuration. Its `rules` array is the authoring grammar in imperative form, which is why it is generated rather than authored at the root |

One more file is machine-written and committed, by a script other than `generate-elements.mjs`, so
`pnpm generate` neither writes nor checks it:

| Path                             | Written by                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `apps/stories/story-routes.json` | `apps/stories/scripts/write-route-catalog.mjs`, during `pnpm -F @apps/stories build`. The axe sweep reads it |

## Not generated — edit these directly

- `src/css/core/*.css` and `src/css/themes/atmosphere/*.css` — the two tiers of every component
  stylesheet, plus the hand-authored aggregates `src/css/core.css` and
  `src/css/themes/atmosphere.css` and the layer-order file `src/css/tokens.css`. Nothing sits at
  `src/css/<component>.css` any more. `validate-contracts.mjs` proves them against the registry in
  both directions, and `check-core-boundary.mjs` — `pnpm core:validate` — decides which of the two
  tiers a given declaration may live in, also in both directions.
- `scripts/performance-baselines.json` — hand-written, one entry per element module.
  `check-performance.mjs` throws `Missing performance baseline` for a new element until you add one
  from `performance:check -- --measure`.
- `src/tokens.ts` — `uiTokenGroups` is authored TypeScript. `generate-elements.mjs` reads it as
  _text_ to build the CSS editor data, so keep the `uiTokenGroups = { ... } as const` shape
  parseable.
- `src/<module>.ts` — the component behavior modules, and their colocated `*.test.ts`.
- `scripts/authoring-grammar.mjs` — the single declaration of the authoring grammar. Edit this to
  change what every agent-facing artifact says about how Timeless markup is authored. It states no
  component, attribute, or value; those come from the registry.
- `scripts/check-markup.mjs` — the contract checker, and its colocated `check-markup.test.mjs`.
  Reads the registry at runtime rather than being generated from it. It also reads
  `ACTIVE_DESCENDANT_ROLES` out of `src/listbox.ts` as _text_, so the checker and the runtime cannot
  disagree about which roles carry `aria-activedescendant`; renaming that constant throws rather
  than checking against nothing.
- `src/index.ts` — the public barrel.

## Gotcha

There is no `src/values.ts`. Values are emitted per module into `src/values/<module>.ts`, one file
per distinct `module` field in `valueSets`. A module that already exports a value array re-exports
it from its `src/values/<module>.ts` and keeps its own type guards.
