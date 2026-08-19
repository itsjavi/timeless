# Validators, and what a failure means

Most of AGENTS.md is machine-proven. Before reasoning about a rule, check whether a script already
decides it — and if one does, run the script instead of arguing from the source.

## The full gate

```bash
pnpm qa
```

That is `typecheck` → `format:check` → `build` → `test` → `publint` → `attw` → `test:e2e`. `build`
in `packages/components` runs `generate:check`, `contracts:validate`, and `manifest:validate` before
`tsdown`, so a registry mistake fails the build rather than shipping.

## Failure → remedy

| Failure                                                        | What it means                                                                                                           | Remedy                                                                                                            |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `Generated element contracts are stale. Run pnpm generate.`    | A generated file no longer matches the registry — usually a hand-edit, sometimes a registry change without regeneration | `pnpm -F @timelessui/components run generate`                                                                     |
| `<component> root <name> is absent from <stylesheet>`          | The registry declares a root the stylesheet never selects                                                               | Add the selector, or fix the root name in the registry                                                            |
| `<stylesheet> selects uncatalogued public class ui-x`          | CSS uses a `.ui-*` root with no registry entry                                                                          | Declare the component, or rename the class                                                                        |
| `<stylesheet> selects undeclared value`                        | CSS matches a `data-ui-*` value missing from the referenced `valueSets` entry                                           | Add the value to the set, or drop the selector                                                                    |
| declared value is never selected                               | A `valueSets` value no CSS implements, and not the attribute default                                                    | Implement it, or remove it from the set                                                                           |
| `Attribute <x> references the undeclared value set <y>`        | Thrown by the registry itself at load                                                                                   | Add the set to `valueSets`, spelling included                                                                     |
| `pnpm manifest:validate` names a missing type                  | An event `detail` type that is not exported                                                                             | Export it, or name the type the element really dispatches                                                         |
| `"<claim>" is now implemented; move it from planned to proofs` | A landing-page claim graduated                                                                                          | Move the entry in `apps/web/scripts/validate-claims.mjs`, and retract "planned" prose in `README.md` and the docs |
| `"<claim>" is advertised but <pattern> matches nothing`        | Landing-page copy outran the library                                                                                    | Remove the tin, or implement the feature                                                                          |
| `Undocumented custom elements: <tags>`                         | An element with no catalog entry                                                                                        | Add it to `packages/examples/src/catalog.ts`                                                                      |
| `Undocumented CSS exports: <files>`                            | A stylesheet no example references                                                                                      | Add it to an example's `styles`                                                                                   |
| `Implementation-oriented StoryLite routes remain`              | A story title still uses an implementation group                                                                        | Retitle to `Library/<Group>/<Component>`                                                                          |
| `The StoryLite catalog has no Library routes.`                 | Titles are wrong, or the build produced no stories                                                                      | Check `title` on the affected `meta`                                                                              |
| `published packages cannot depend on @timelessui/examples`     | `packages/core` or `packages/components` imported the examples package                                                  | Invert the dependency                                                                                             |
| `source cannot import from the ignored .local directory`       | An import reaches into `.local/`                                                                                        | Remove it                                                                                                         |

## Scoped commands

```bash
pnpm -F @timelessui/components run generate          # regenerate from the registry
pnpm -F @timelessui/components run generate:check    # fail if generated files are stale
pnpm -F @timelessui/components run contracts:validate
pnpm -F @timelessui/components run manifest:validate
pnpm -F @timelessui/components run exports:validate
pnpm -F @timelessui/components run generated-dom:check
pnpm -F @timelessui/components run performance:check
pnpm -F @timelessui/components run test
pnpm -F @timelessui/core run test
pnpm boundaries:check
pnpm test:e2e
```

## What no script checks

These are the rules a reviewer or an audit skill has to carry. See
`.agents/skills/audit-component-contracts/SKILL.md`.

- Visual declarations written from component JS.
- `data-ui-*` used as configuration on a `ui-*` custom-element host.
- Boolean attributes carrying string values.
- Value lists hand-copied into `argTypes.options`, a factory, or a test.
- `data-ui-internal-*` reaching copyable story source.
- ARIA substituting for missing DOM behavior, or Shadow DOM where Light DOM would do.
- Prose in `README.md`, `AGENTS.md`, MDX docs, and catalog `guidance` drifting from the source.
