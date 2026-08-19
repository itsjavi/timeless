# Generated files

Everything listed here is written by `packages/components/scripts/generate-elements.mjs` from two
declarations: `packages/components/scripts/component-registry.mjs` for the component facts, and
`packages/components/scripts/authoring-grammar.mjs` for the authoring grammar. Editing any output by
hand is reverted by the next `pnpm generate`, and `pnpm generate:check` fails the build in the
meantime.

To change any of this content, edit the registry and run:

```bash
pnpm -F @timelessui/components run generate
```

## Inside `packages/components`

| Path                                                 | Holds                                                                                                                                                       |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/values/<module>.ts`                             | One `as const` value array plus its union type per `valueSets` entry, grouped by the set's `module`                                                         |
| `src/contracts.ts`                                   | The full `componentContracts` record: roots, attributes, parts, states, variables, events, accessibility                                                    |
| `src/attributes.ts`                                  | `uiAttributes()` and `uiAttributeString()`, the typed root-attribute builders                                                                               |
| `src/define.ts`                                      | The aggregate `defineTimelessElements()` plus every per-element re-export                                                                                   |
| `src/define/<tag>.ts`                                | One `define<Name>Element()` entrypoint per custom element                                                                                                   |
| `src/react.ts`                                       | React JSX intrinsic element typings                                                                                                                         |
| `src/preact.ts`                                      | Preact JSX intrinsic element typings                                                                                                                        |
| `src/solid.ts`                                       | Solid JSX intrinsic element typings                                                                                                                         |
| `src/vue.ts`                                         | Vue `GlobalComponents` typings                                                                                                                              |
| `src/svelte.ts`                                      | Svelte element typings                                                                                                                                      |
| `custom-elements.json`                               | Custom Elements Manifest                                                                                                                                    |
| `vscode.html-custom-data.json`                       | Editor completion for tags and attributes                                                                                                                   |
| `vscode.css-custom-data.json`                        | Editor completion for CSS custom properties, built from `src/tokens.ts`                                                                                     |
| `web-types.json`                                     | JetBrains web-types                                                                                                                                         |
| `skills/using-timeless-ui/reference/contracts.md`    | Every root, its kind, its configuration attributes and the value set each names, its parts, and its stylesheets. From the registry                          |
| `skills/using-timeless-ui/reference/grammar.md`      | The authoring grammar as prose, summary blockquote included. `apps/web` reads this file for the `/llms.txt` and `/llms-full.txt` preamble. From the grammar |
| `skills/using-timeless-ui/reference/agents-block.md` | The same grammar as imperative one-liners, for a consumer's own `AGENTS.md`. Rendered on the agents page by `AgentsBlock.astro`. From the grammar           |
| `skills/using-timeless-ui/SKILL.md`                  | The consumer agent skill: frontmatter, the grammar, and the verification checklist. From the grammar                                                        |

## Outside `packages/components`

| Path            | Holds                                                                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context7.json` | Context7's indexing configuration. Its `rules` array is the authoring grammar in imperative form, which is why it is generated rather than authored at the root |

## Not generated — edit these directly

- `src/css/*.css` — the stylesheets. `validate-contracts.mjs` proves them against the registry in
  both directions.
- `src/tokens.ts` — `atmosphereTokenGroups` is authored TypeScript. `generate-elements.mjs` reads it
  as _text_ to build the CSS editor data, so keep the `atmosphereTokenGroups = { ... } as const`
  shape parseable.
- `src/<module>.ts` — the component behavior modules, and their colocated `*.test.ts`.
- `scripts/authoring-grammar.mjs` — the single declaration of the authoring grammar. Edit this to
  change what every agent-facing artifact says about how Timeless markup is authored. It states no
  component, attribute, or value; those come from the registry.
- `scripts/check-markup.mjs` — the contract checker, and its colocated `check-markup.test.mjs`.
  Reads the registry at runtime rather than being generated from it.
- `src/index.ts` — the public barrel.

## Gotcha

There is no `src/values.ts`. Values are emitted per module into `src/values/<module>.ts`, one file
per distinct `module` field in `valueSets`. A module that already exports a value array re-exports
it from its `src/values/<module>.ts` and keeps its own type guards.
