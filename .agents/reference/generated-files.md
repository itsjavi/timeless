# Generated files

Everything listed here is written by `packages/components/scripts/generate-elements.mjs` from
`packages/components/scripts/component-registry.mjs`. Editing any of them by hand is reverted by the
next `pnpm generate`, and `pnpm generate:check` fails the build in the meantime.

To change any of this content, edit the registry and run:

```bash
pnpm -F @timelessui/components run generate
```

## Inside `packages/components`

| Path                           | Holds                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `src/values/<module>.ts`       | One `as const` value array plus its union type per `valueSets` entry, grouped by the set's `module`      |
| `src/contracts.ts`             | The full `componentContracts` record: roots, attributes, parts, states, variables, events, accessibility |
| `src/attributes.ts`            | `uiAttributes()` and `uiAttributeString()`, the typed root-attribute builders                            |
| `src/define.ts`                | The aggregate `defineTimelessElements()` plus every per-element re-export                                |
| `src/define/<tag>.ts`          | One `define<Name>Element()` entrypoint per custom element                                                |
| `src/react.ts`                 | React JSX intrinsic element typings                                                                      |
| `src/preact.ts`                | Preact JSX intrinsic element typings                                                                     |
| `src/solid.ts`                 | Solid JSX intrinsic element typings                                                                      |
| `src/vue.ts`                   | Vue `GlobalComponents` typings                                                                           |
| `src/svelte.ts`                | Svelte element typings                                                                                   |
| `custom-elements.json`         | Custom Elements Manifest                                                                                 |
| `vscode.html-custom-data.json` | Editor completion for tags and attributes                                                                |
| `vscode.css-custom-data.json`  | Editor completion for CSS custom properties, built from `src/tokens.ts`                                  |
| `web-types.json`               | JetBrains web-types                                                                                      |

## Not generated — edit these directly

- `src/css/*.css` — the stylesheets. `validate-contracts.mjs` proves them against the registry in
  both directions.
- `src/tokens.ts` — `atmosphereTokenGroups` is authored TypeScript. `generate-elements.mjs` reads it
  as _text_ to build the CSS editor data, so keep the `atmosphereTokenGroups = { ... } as const`
  shape parseable.
- `src/<module>.ts` — the component behavior modules, and their colocated `*.test.ts`.
- `src/index.ts` — the public barrel.

## Gotcha

There is no `src/values.ts`. Values are emitted per module into `src/values/<module>.ts`, one file
per distinct `module` field in `valueSets`. A module that already exports a value array re-exports
it from its `src/values/<module>.ts` and keeps its own type guards.
