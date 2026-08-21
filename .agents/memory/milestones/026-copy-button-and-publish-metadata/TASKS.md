# Milestone 026 Tasks

## 0. Baseline, measured before any change

- [x] Confirm `ui-copy-button` appears in no catalog entry, no registry entry, and no stylesheet on
      `main`
- [x] Record `performance:check` output as the baseline budget
- [x] Confirm `pnpm attw` currently reports one package, and record which — it reports **two**,
      `@timelessui/color` and `@timelessui/components`; `@timelessui/color` gained the script after
      the plan was written

## 1. Contract

- [x] Add the `copyButton` `customElement()` entry to `component-registry.mjs` with tag
      `ui-copy-button`, module `copy-button`, stylesheet `copy-button.css` — split as
      `core/copy-button.css` and `themes/atmosphere/copy-button.css`, per milestone 028
- [x] Declare `value`, `from`, and `feedback-duration` as plain host attributes with no `set`, and
      confirm no `valueSets` entry was added
- [x] Declare `copied-message` as well, resolving the open decision on where the announcement text
      comes from
- [x] Declare the `trigger`, `idle`, `copied`, and `status` parts, with only `trigger` required
- [x] Declare `--copied` as a **public** custom state, and confirm it reads as public in the
      generated contract
- [x] Declare the `ui-copy` event as `CustomEvent<CopyDetail>`
- [x] Declare accessibility as pattern `button` with no keys, and notes covering the stable
      accessible name, the decorative label swap, and the authored `status` region

## 2. Behavior

- [x] Create `src/copy-button.ts` with `createCopyButtonElementClass(targetWindow?)`, following the
      `number-stepper.ts` shape
- [x] Export `CopyDetail` and `CopyFailureReason`, and re-export both from `src/index.ts`
- [x] Implement `resolveCopyValue`: `value`, then `from`, then empty; `from` reads `.value` for
      `input`, `textarea`, and `select`, and `textContent` otherwise
- [x] Implement the copy path: `writeText`, set `--copied`, write the announcement into the `status`
      region, clear after `feedback-duration` (default 1800)
- [x] Dispatch exactly one `ui-copy` per activation on every path, including `unsupported`,
      `denied`, and `empty` — made structural by `performCopy`, which returns one detail per call
- [x] Implement the opt-in reveal: remove `hidden` from the trigger only when registration succeeds
      and `navigator.clipboard` exists
- [x] Create `src/copy-button.test.ts` covering value precedence and all three failure reasons
- [x] The single-dispatch guarantee and the absent `status` region moved to `apps/e2e`. The unit
      environment is `environment: 'node'`, so the element class has no DOM to run in; every other
      element module in the package is unit-tested through its exported helpers for the same reason
- [x] Confirm `copy-button.ts` contains no `createElement`, `insertAdjacentHTML`, or `innerHTML`,
      and that `check-generated-dom.mjs` was not given a new allowlist entry

## 3. Stylesheet

- [x] Create `src/css/core/copy-button.css` in the `ui.components` layer selecting `ui-copy-button`
- [x] Create `src/css/themes/atmosphere/copy-button.css`, and add both to the two aggregates
- [x] Implement the `idle`/`copied` swap through `:state(--copied)` only, and visually hide `status`
      — `clip-path` in core so a theme-free consumer sees no duplicate confirmation, the 1px box in
      the theme because sizing is the theme's tier
- [x] Add the explicit `[hidden]` rule for the trigger. Found by the e2e reveal case: `.ui-button`
      sets `display: inline-flex`, and the UA's `[hidden]` rule loses to any author rule
- [x] Confirm no visual declaration is written from `copy-button.ts`
- [x] `core:validate` holds: 274 declarations across 41 core stylesheets

## 4. Generation

- [x] Run `pnpm -F @timelessui/components run generate`
- [x] Confirm `src/define/ui-copy-button.ts`, the five framework typings, `custom-elements.json`,
      and both editor data files were rewritten, and that none was hand-edited
- [x] Run `generate:check`, `contracts:validate`, `manifest:validate`, `exports:validate`
- [x] Add the `./copy-button` subpath export, which `check-exports.mjs` requires per element
- [x] Add the `copy-button` entry to `performance-baselines.json`, which fails on a missing baseline

## 5. Examples, catalog, and story

- [x] Create `packages/examples/src/copy-button.html.ts` exporting a typed `createCopyButton`, using
      the shared escaping helpers, plus `createCopySnippet` for the `from` shape
- [x] Add the catalog entry under **Actions**, referencing both stylesheets in its `styles`
- [x] Confirm the build no longer reports `Undocumented custom elements` or
      `Undocumented CSS exports`
- [x] Add the story titled `Library/Actions/Copy Button` with a `Default` export
- [x] Add `copy-button` to the filename table in `apps/stories/.storylite/config.ts`, which is what
      actually derives a route id — the title alone left it at `copy-button--default`
- [x] Confirm the copyable `source` is factory output and contains no `data-ui-internal-*` and no
      demo wrapper — asserted in `apps/stories/src/smoke.test.ts`
- [x] Confirm the generated reference page renders at `/docs/components/copy-button`

## 6. End-to-end

- [x] Extend `no-javascript.spec.ts`: a trigger authored `hidden` stays hidden without JavaScript,
      and one the author left visible still renders
- [x] Add the copy-path spec: click, assert clipboard content, assert `ui-copy` fired with
      `status: 'copied'`, assert the accessible name did not change
- [x] Add the `empty` case and the no-Clipboard-API reveal case
- [x] Confirm the three new stories are swept by the existing axe pass in `a11y.spec.ts`

## 7. Publish metadata

- [x] Add `repository` with `directory`, `homepage`, `bugs`, `keywords`, and `author` to
      `packages/components/package.json`
- [x] Add the same to `packages/core/package.json`
- [x] Add the same to `packages/color/package.json`, which is published too and was not in the plan
- [x] Confirm `pnpm publint` still passes for all three

## 8. attw for core

- [x] Add `@arethetypeswrong/cli` to `packages/core` devDependencies
- [x] Add `"attw": "attw --pack --profile esm-only"` to `packages/core` scripts
- [x] Point the attw step in `.github/workflows/pr-quality.yml` at the root `pnpm attw` rather than
      one filtered package, so a future package with the script is covered when it lands
- [x] Confirm `pnpm attw` now reports three packages: color, components, core

## 9. README

- [x] Add the `pnpm add @timelessui/components` install line to `packages/components/README.md`
- [x] Confirm `packages/core/README.md` was left alone, and that nothing now contradicts
      `reference/packages.mdx`

## 10. Close

- [x] Run `pnpm qa` and record the output
- [x] Record the color-picker migration as a follow-up rather than doing it here
- [x] Record decisions, trade-offs, and results in `RESULTS.md`

---

Generated by Claude Opus 5 - High reasoning
