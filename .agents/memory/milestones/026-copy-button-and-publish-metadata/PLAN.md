---
status: Implemented
---

# Milestone 026 Plan: Copy Button and Publish Metadata

## Goal

Ship the one component milestone 007 never built — a public copy-to-clipboard button — and close the
publish-metadata gaps that the same milestone opened and no linter catches. Two unrelated threads in
one milestone because both are small, both are inherited from 007, and neither justifies a number of
its own.

## Context

Milestone 007 was rejected on 2026-08-19 at commit `27b76e3`. Its results file maps every item to
where it landed. Four survived, and this milestone carries them.

Clipboard copying already exists in the library, but only as private behavior inside one component.
`ui-color-picker` reads the raw input, calls `navigator.clipboard.writeText`, and flips a `--copied`
custom state for 1800ms ([color-picker.ts:493-506](packages/components/src/color-picker.ts:493)). It
is not reusable, it emits no event, and its `catch` block returns silently — a copy that fails is
indistinguishable from one that never ran. 007 specified an event on success **and** failure, which
is the part worth generalising.

The component is also unclaimed in either direction. It is absent from the catalog's 47 entries, no
milestone from 020 to 025 plans it, and it is not in milestone 021's "Not shipping" table
([021 PLAN.md:390](.agents/memory/milestones/021-surface-consolidation/PLAN.md:390)) — so it is
currently neither shipped nor refused. This milestone ships it.

### The constraint that shapes the design

`check-generated-dom.mjs` fails the build if any `src/*.ts` other than `toast.ts` contains
`createElement`, `insertAdjacentHTML`, or `innerHTML =`. A copy button wants a polite live region to
announce success, and it may not create one. So **every element in the anatomy is author-owned**,
including the live region, and the element writes text into it rather than building it. This is not
a workaround — it is the same rule that keeps the rest of the library inspectable, and it makes the
announcement text author-supplied, which is what internationalisation needs anyway.

### What the platform owns

Activation, focus, and the accessible name come from a native `<button>`. `navigator.clipboard` is
undefined outside a secure context, and `writeText` rejects without transient user activation in
some engines. There is no fallback: `document.execCommand('copy')` is deprecated, and reviving it
would need generated DOM the gate forbids. The element therefore follows the Popover precedent —
report the unsupported result, leave the authored markup untouched, load no polyfill.

## Plan

### 1. Contract

One new custom element in `component-registry.mjs`, declared through `customElement()`:

| Field          | Value                          |
| -------------- | ------------------------------ |
| `name`         | `copyButton`                   |
| `tag`          | `ui-copy-button`               |
| `module`       | `copy-button`                  |
| `classExport`  | `UICopyButtonElement`          |
| `factory`      | `createCopyButtonElementClass` |
| `defineExport` | `defineCopyButtonElement`      |
| `stylesheet`   | `copy-button.css`              |

The host wraps a native button rather than being one. Autonomous custom elements cannot be buttons,
and customized built-ins are not available across the target engines — the same reason `ui-dialog`
and `ui-number-stepper` wrap their triggers.

**Attributes**, plain on the host, per the custom-element rule in AGENTS.md:

| Attribute           | Type   | Notes                                                                                                             |
| ------------------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| `value`             | string | Literal text to copy. Free-form, no value set                                                                     |
| `from`              | string | Id of the element to read instead. `input`, `textarea`, `select` give `.value`; anything else gives `textContent` |
| `feedback-duration` | string | Milliseconds the copied state persists. Defaults to `1800`, matching the color picker                             |

`value` wins when both are present, mirroring the "value, then `data-ui-value`, then the element id"
precedence the collection elements already document. No `valueSets` entry is added: all three take
free-form input.

**Parts**, authored, `data-ui-part` token list:

| Part      | Required | Purpose                                                                         |
| --------- | -------- | ------------------------------------------------------------------------------- |
| `trigger` | yes      | The native `<button>`. Owns the accessible name, and it must not change on copy |
| `idle`    | no       | Shown while not copied. Decorative; author `aria-hidden="true"`                 |
| `copied`  | no       | Shown while copied. Decorative, and its text is the announcement source         |
| `status`  | no       | The author's `role="status"` region. Without it, nothing is announced           |

**State**: `--copied`, declared **public** — unlike the color picker's, which is internal — so
consumers can style `ui-copy-button:state(--copied)` themselves.

**Event**: `ui-copy`, carrying a `CopyDetail` exported from `src/copy-button.ts`, following the
`ToastDismissDetail` precedent ([toast.ts:8](packages/components/src/toast.ts:8)) rather than
`UITransitionDetail` — this is not a value transition.

```ts
export type CopyFailureReason = 'unsupported' | 'denied' | 'empty'

export type CopyDetail = {
  readonly status: 'copied' | 'failed'
  readonly value: string
  readonly reason: CopyFailureReason | null
}
```

One event with a discriminator, not two events. `manifest:validate` fails if `CopyDetail` is not
exported, so the barrel export is part of the same change.

**Accessibility**: pattern `button`, with no keys of its own — the platform owns activation. The
notes must say what the contract actually requires: the trigger's accessible name stays stable
across the copy, the visual swap between `idle` and `copied` is decorative and hidden from assistive
technology, and the announcement travels through the authored `status` region. A button whose name
changes while it holds focus is announced inconsistently across screen readers, which is the whole
reason the state and the announcement are separated.

### 2. Behavior

`src/copy-button.ts`, in the shape `number-stepper.ts` establishes: exported pure helpers, then
`createCopyButtonElementClass(targetWindow?)` returning an `@element`-decorated class using
`@listen` and `observeParts`.

- `resolveCopyValue(host)` — `value`, then `from`, then empty. Exported and unit-tested against
  plain objects, no DOM required, like every other module here.
- Click on the trigger reads the value, `await navigator.clipboard.writeText(value)`, sets
  `--copied` through `setCustomState`, writes the `copied` part's text into the `status` region with
  `textContent`, and clears the state after `feedback-duration`.
- Every path dispatches exactly one `ui-copy`. An absent `navigator.clipboard` is
  `reason: 'unsupported'`, a rejected write is `'denied'`, an empty resolved value is `'empty'` and
  skips the write entirely.
- **Progressive enhancement**: if the author marked the trigger `hidden`, the element removes it
  once registration succeeds _and_ `navigator.clipboard` exists. A control that cannot work is never
  revealed. Setting `hidden` is explicitly a behavior attribute under AGENTS.md, and this stays
  opt-in — a trigger not authored `hidden` is left alone.

No `createElement`, no `insertAdjacentHTML`, no `innerHTML`. `generated-dom:check` proves it.

### 3. Stylesheet

`src/css/copy-button.css`, in the `ui.components` layer, selecting `ui-copy-button`. It owns the
`idle`/`copied` swap entirely through `:state(--copied)`, the way
[color-picker.css:163-168](packages/components/src/css/color-picker.css:163) already does, and
visually hides the `status` region. No visual declaration is written from TypeScript.

`contracts:validate` proves the declared root against this file in both directions.

### 4. Generation and the gates

`pnpm -F @timelessui/components run generate` rewrites `src/contracts.ts`, `src/define.ts`,
`src/define/ui-copy-button.ts`, the five framework typings, `custom-elements.json`,
`vscode.html-custom-data.json`, and `web-types.json`. None of them is edited by hand. The full list
is in `.agents/reference/generated-files.md`.

### 5. Examples, catalog, and story

- `packages/examples/src/copy-button.html.ts` — a typed `createCopyButton` factory emitting the
  public anatomy, escaping author values with the shared helpers.
- A catalog entry under **Actions**, which takes it from three components to four. Without one,
  `Undocumented custom elements: ui-copy-button` fails the build; the entry's `styles` must
  reference `copy-button.css` or `Undocumented CSS exports` fails instead.
- The catalog entry is also what generates the reference page —
  `apps/web/src/pages/docs/components/[slug].astro` builds one page per entry, so no MDX is written
  by hand.
- A StoryLite story titled `Library/Actions/Copy Button`. The copyable `source` must be the factory
  output, never the demo wrapper.

### 6. End-to-end

Playwright grants clipboard permissions per context, so the real path is testable rather than
mocked. Add to the existing specs rather than creating a suite:

- `no-javascript.spec.ts` — a trigger authored `hidden` stays hidden with JavaScript disabled.
- `a11y.spec.ts` — the new story is already swept by the axe pass; confirm it is picked up.
- One focused spec for the copy path: click, assert clipboard content, assert `ui-copy` fired with
  `status: 'copied'`, assert the trigger's accessible name did not change.

### 7. Publish metadata

Both published manifests lack `repository`, `homepage`, `bugs`, `keywords`, and `author`. `publint`
does not check these and passes without them; npm needs `repository` for provenance and source
links, and renders the README as the package page. Mirror the root manifest — homepage
`https://timeless.build`, repository `https://github.com/itsjavi/timeless.git`, MIT — adding
`repository.directory` so each package points at its own folder.

### 8. attw for core

`@timelessui/core` is published, not private, and has no `attw` script and no
`@arethetypeswrong/cli` devDependency, so the root `pnpm attw` skips it via `--if-present` and CI
runs it only for components ([pr-quality.yml:47](.github/workflows/pr-quality.yml:47)). Add the
devDependency and the script with the same `--pack --profile esm-only` flags components uses, and
add core to the CI step. This is wiring, not a fix: running attw against core by hand on `27b76e3`
already reports green on both `node16 (from ESM)` and `bundler`.

### 9. Package README install line

`packages/components/README.md` opens with CSS imports and never says how to install. Add the
`pnpm add @timelessui/components` line, matching `reference/packages.mdx`. `packages/core/README.md`
is left alone — core is documented as a package you do not install directly, and adding install
instructions would contradict `reference/packages.mdx`.

### 10. Out of scope

- **Migrating `ui-color-picker` to the new element.** Its copy button is nested inside a larger
  contract and consolidating the two is milestone 021's kind of work, not this one's. Record it as a
  follow-up rather than doing it here.
- **Teaching `validate.ts` about parts.** It walks attributes only, so a missing `status` region
  cannot be reported today. Extending it changes a shared module for one component's benefit.
- **Time Picker and Date Picker.** Dropped from the 007 carry-over. Date Picker already has a home
  in milestone 021's boundary table; Time Picker is not being recorded at all.

## Verification

1. `pnpm -F @timelessui/components run generate:check`, `contracts:validate`, `manifest:validate`,
   `exports:validate`, `generated-dom:check`, `performance:check`.
2. `pnpm -F @timelessui/components run test` with new `copy-button.test.ts`.
3. `pnpm publint` and `pnpm attw` — the latter must now report two packages, not one.
4. `pnpm test:e2e`.
5. `pnpm qa` end to end.

## Acceptance

- `ui-copy-button` copies from both `value` and `from`, and dispatches exactly one `ui-copy` per
  activation on success and on every failure path.
- The trigger's accessible name is unchanged by copying, and the announcement reaches the authored
  `status` region.
- A trigger authored `hidden` is revealed only when the Clipboard API is available, and stays hidden
  with JavaScript disabled.
- No visual declaration and no generated DOM in `copy-button.ts`; `generated-dom:check` passes with
  its allowlist untouched.
- Both package manifests carry `repository`, `homepage`, `bugs`, `keywords`, and `author`.
- `pnpm attw` covers `@timelessui/core`, and CI runs it.
- `packages/components/README.md` shows the install command.
- `pnpm qa` is green.

---

Generated by Claude Opus 5 - High reasoning
