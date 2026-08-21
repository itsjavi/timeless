# Validators, and what a failure means

Most of AGENTS.md is machine-proven. Before reasoning about a rule, check whether a script already
decides it — and if one does, run the script instead of arguing from the source.

## The full gate

```bash
pnpm qa
```

That is `typecheck` → `format:check` → `build` → `test` → `pnpm -F @apps/web test:dist` →
`contracts:check` → `publint` → `attw` → `test:e2e`. `build` in `packages/components` runs
`generate:check`, `contracts:validate`, `core:validate`, and `manifest:validate` before `tsdown`, so
a registry mistake fails the build rather than shipping. `test:dist` is
`validate-agent-surfaces.mjs`, which reads the emitted site: one Markdown route per documented
component, the `llms.txt` token budget, and the packaged agent skill. `contracts:check` is
`boundaries:check`, `exports:validate`, `generated-dom:check`, and `performance:check`, and the CI
job runs that same aggregate — so a green `pnpm qa` means a green job. It did not always: those four
ran only in CI, which is how a `createElement` in a component reached a pull request past a green
local gate.

## Failure → remedy

| Failure                                                        | What it means                                                                                                           | Remedy                                                                                                            |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `Generated element contracts are stale. Run pnpm generate.`    | A generated file no longer matches the registry — usually a hand-edit, sometimes a registry change without regeneration | `pnpm -F @timelessui/components run generate`                                                                     |
| `<component> root <name> is absent from <stylesheets>`         | None of the contract's stylesheets selects the root it declares                                                         | Add the selector, or fix the root name in the registry                                                            |
| `<stylesheet> selects uncatalogued public class ui-x`          | CSS uses a `.ui-*` root with no registry entry                                                                          | Declare the component, or rename the class                                                                        |
| `<stylesheet> selects undeclared value`                        | CSS matches a `data-ui-*` value missing from the referenced `valueSets` entry                                           | Add the value to the set, or drop the selector                                                                    |
| declared value is never selected                               | A `valueSets` value no CSS implements, and not the attribute default                                                    | Implement it, or remove it from the set                                                                           |
| `Attribute <x> references the undeclared value set <y>`        | Thrown by the registry itself at load                                                                                   | Add the set to `valueSets`, spelling included                                                                     |
| `pnpm manifest:validate` names a missing type                  | An event `detail` type that is not exported                                                                             | Export it, or name the type the element really dispatches                                                         |
| `"<claim>" is now implemented; move it from planned to proofs` | A landing-page claim graduated                                                                                          | Move the entry in `apps/web/scripts/validate-claims.mjs`, and retract "planned" prose in `README.md` and the docs |
| `"<claim>" is advertised but <pattern> matches nothing`        | Landing-page copy outran the library                                                                                    | Remove the tin, or implement the feature                                                                          |
| `Undocumented custom elements: <tags>`                         | An element with no catalog entry                                                                                        | Add it to `packages/examples/src/catalog.ts`                                                                      |
| `Undocumented CSS exports: <files>`                            | A stylesheet no example references                                                                                      | Add it to an example's `styles`                                                                                   |
| `Implementation-oriented StoryLite routes remain`              | A story filename is missing from `storyDomains`, so `resolveStoryId` fell back to a directory-derived id                | Add the filename to `storyDomains` in `apps/stories/.storylite/config.ts`. The story `title` does not decide this |
| `The StoryLite catalog has no Library routes.`                 | The same table, or the build produced no stories at all                                                                 | Check `storyDomains` first, then that the story files built                                                       |
| `published packages cannot depend on @timelessui/examples`     | `packages/color`, `packages/core`, or `packages/components` imported the examples package                               | Invert the dependency                                                                                             |
| `@timelessui/color cannot depend on components or core`        | `packages/color` imported a sibling package; the colour model is a leaf                                                 | Invert the dependency, or move the code into `components`                                                         |
| `source cannot import from the ignored .local directory`       | An import reaches into `.local/`                                                                                        | Remove it                                                                                                         |
| `<id> uses unknown part <token>`                               | An example authored a `data-ui-part` token no contract declares                                                         | Declare the part in the registry and regenerate, **before** the example emits it                                  |
| `<id> uses unknown public attribute <name>`                    | Same, for a `data-ui-*` attribute                                                                                       | Declare the attribute, or use a plain attribute on the custom-element host                                        |
| `<id> authors private runtime hook <name>`                     | A `data-ui-internal-*` attribute reached copyable example source                                                        | Let the component write it at runtime instead                                                                     |
| `<id> renders unregistered element <tag>`                      | An example renders a `ui-*` tag with no manifest entry                                                                  | Register the element, or drop the tag                                                                             |
| `<id> renders <tag> without declaring its definition`          | The tag is registered but missing from the example's `definitions`                                                      | Add it to `definitions`                                                                                           |
| `<id> documents <name> but does not import its stylesheet <f>` | A contract's `css` array grew and the example's `styles` did not                                                        | Add the stylesheet to the example's `styles`                                                                      |
| `<id> uses uncatalogued public class <name>`                   | An example uses a `.ui-*` class no contract declares                                                                    | Declare the component, or add it to `demoOnlyClasses`                                                             |
| `<entry> <metric> grew from <a> to <b>`                        | A size budget moved by more than 10%                                                                                    | Justify the growth and re-baseline with `--measure`, recording before and after                                   |
| `Missing performance baseline for <entry>`                     | A new element module has no entry in `scripts/performance-baselines.json`, which is hand-written                        | Add one from `performance:check -- --measure`                                                                     |
| `Missing class entrypoint ./<tag>`                             | A new element has no `exports` subpath in `packages/components/package.json`                                            | Add `./<tag-without-the-ui-prefix>` beside its siblings                                                           |
| `Core stylesheets crossed the theme boundary`                  | A core file declared a colour, radius, shadow, type property, or size, or a theme file kept a property core owns        | Move the declaration to the other tier, or mark it `core-exempt:` with a reason                                   |
| `core/<file> parsed to zero declarations`                      | `check-core-boundary.mjs` could not parse a core stylesheet, and fails loudly rather than passing an unchecked file     | Fix the stylesheet, or the parser in that script                                                                  |

`packages/examples/scripts/validate.mjs` is the strictest gate in the repository and the one most
likely to reject a change: it imports the registry, renders every canonical example, and throws on
seventeen distinct conditions. That forces the ordering for any new part or attribute — **registry
first, `pnpm generate` second, examples third.** Reversing it fails the build rather than warning.

`performance:check` covers every element module, derived from the registry rather than listed in the
script, so a new element is measured the day it lands. Read the numbers for what they are: the
library ships unminified and the check gzips each module separately, so the figures are always
larger than what a consumer ships. Select's closure is around 30KB in the check's units and around
13.5KB bundled and minified, and a page with both Select and Combobox pays around 16KB rather than
the sum, because the two share the Listbox, options, popover, and anchoring modules. When a figure
moves, read `rawBytes` first, and re-baseline with `--measure` rather than shrinking real code to
satisfy an artifact.

## Scoped commands

```bash
pnpm -F @timelessui/components run generate          # regenerate from the registry
pnpm -F @timelessui/components run generate:check    # fail if generated files are stale
pnpm -F @timelessui/components run contracts:validate
pnpm -F @timelessui/components run core:validate      # the core/theme boundary, both directions
pnpm -F @timelessui/components run manifest:validate
pnpm -F @timelessui/components run exports:validate
pnpm -F @timelessui/components run generated-dom:check
pnpm -F @timelessui/components run performance:check
pnpm -F @timelessui/components run performance:check -- --measure  # print current figures
pnpm -F @timelessui/examples run test                # renders and validates every example
pnpm -F @timelessui/components run test
pnpm -F @timelessui/core run test
pnpm boundaries:check
pnpm test:e2e
```

```bash
pnpm contracts:check   # the four checks that used to run only in CI
```

## What no script checks

These are the rules a reviewer or an audit skill has to carry. See
`.agents/skills/audit-component-contracts/SKILL.md`.

- Visual declarations written from component JS. `generated-dom:check` decides the narrower rule
  that a component may not create elements at all — only Toast may, and everything else clones
  authored markup or enhances it in place.
- `data-ui-*` used as configuration on a `ui-*` custom-element host.
- Boolean attributes carrying string values.
- Value lists hand-copied into `argTypes.options`, a factory, or a test.
- `data-ui-internal-*` reaching copyable story source.
- ARIA substituting for missing DOM behavior, or Shadow DOM where Light DOM would do.
- Prose in `README.md`, `AGENTS.md`, MDX docs, and catalog `guidance` drifting from the source.
