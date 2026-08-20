---
name: audit-component-contracts
allowed-tools: Bash, Read, Grep, Glob
description:
  Audit Timeless UI source, stories, and examples against the AGENTS.md authoring rules no validator
  script enforces — visual styling written from component JS, data-ui-* used as configuration on
  custom-element hosts, boolean attributes carrying string values, hand-copied value lists, private
  runtime hooks in copyable source, ARIA substituting for native behavior, and Shadow DOM.
  Read-only. Use for requests like "check the conventions", "does this follow AGENTS.md", or "review
  this before I open the PR", on a diff or repo-wide. Not for correctness bugs, and not for anything
  a validator already proves.
---

# Audit component contracts

Read-only. Report findings; do not fix them unless asked.

Most of AGENTS.md is already machine-proven — see `.agents/reference/validators.md`. Do not re-check
any of it by reading source. Run the script, or trust that CI did. This audit covers only the rules
no script can express.

## Scope

Default to the current diff:

```bash
git diff --stat HEAD && git status --short
```

For a repo-wide sweep, cover `packages/components/src`, `packages/core/src`,
`packages/examples/src`, and `apps/stories/src`.

## The checks

Each grep is a **candidate finder**, not a verdict. Resolve every hit by reading the code. The known
false-positive shapes are listed because the current tree is clean and produces exactly those.

### 1. Visual declarations written from component JS

Consumer-facing styling belongs in CSS. JS may not write colors, spacing, borders, shadows, layout,
position, inset, transforms, or animation.

```bash
grep -rnE "\.style\.(color|background|padding|margin|border|boxShadow|transform|inset|top|left|right|bottom|width|height|opacity|transition|animation)\s*=" packages/*/src --include='*.ts' | grep -v '\.test\.ts'
grep -rn "setProperty(" packages/*/src --include='*.ts' | grep -v '\.test\.ts' | grep -vE "setProperty\('--"
grep -rn "cssText\|insertRule\|<style" packages/*/src --include='*.ts' | grep -v '\.test\.ts'
```

Permitted: `setProperty` on a `--ui-*` custom property for a **measured** value. Resolve constants
before judging — `floating.ts` calls `setProperty(FLOATING_ANCHOR_PROPERTY, …)`, and those constants
are `--ui-floating-*`, so they pass. TS may use tokens or custom properties in inline styles only
when there is no reasonable CSS-only alternative, and must keep it minimal; the CSS file still owns
how the hook renders.

Also flag: a visual class name created in JS. JS may set `id`, `hidden`, `popover`, `aria-*`,
`tabindex`, `role`, and `data-ui-internal-*` — not `.ui-*` classes.

### 2. `data-ui-*` as configuration on a `ui-*` host

```bash
grep -rnoE "<ui-[a-z-]+[^>]*data-ui-[a-z-]+" packages/examples/src apps/stories/src
grep -rnE "ui-[a-z-]+\[data-ui-" packages/components/src/css
```

Public host configuration is a plain attribute:
`<ui-tabs orientation="vertical" activation="manual">`. CSS and JS for public host state target the
plain attribute, as `ui-menu[orientation='horizontal']`.

Permitted: `data-ui-part` on a `ui-*` element when that element is anatomy of an enclosing component
— `<ui-color-picker data-ui-part="…">` inside a popover is correct, because the part is owned by the
nearest component root, which is the popover.

Also flag the inverse: a native `.ui-*` root taking plain-attribute configuration where the contract
declares `data-ui-*`.

### 3. Boolean attributes carrying string values

```bash
grep -rnE 'data-ui-[a-z-]+=["'"'"']?(true|false)' packages apps --include='*.ts' --include='*.css' --include='*.mdx' --include='*.astro'
grep -rnE "(invalid|wrap|attached|disabled|modal|multiple)=[\"']?(true|false)" packages/examples/src apps/stories/src
```

Booleans are presence/absence. `invalid`, not `data-ui-invalid="true"`. `wrap`, not
`data-ui-wrap="false"` — and note that `="false"` is the worse bug, because presence-based parsing
reads it as true.

### 4. Hand-copied value lists

```bash
grep -rn "options: \[" apps/stories/src | grep -v "\.\.\."
grep -rnE "\[\s*'(sm|md|lg)'\s*,|\[\s*'(primary|secondary|outline|ghost)'" packages apps --include='*.ts'
```

Every permitted value list is declared once in `valueSets` and exported. `argTypes.options`, example
factories, and tests import the array — `options: [...buttonVariants]`. A retyped list drifts
silently, and no script catches it.

### 5. Private runtime hooks in copyable source

```bash
grep -rn "data-ui-internal-" packages/examples/src apps/stories/src
```

Must be empty. `data-ui-internal-*` is private; copied source must never contain it, nor a generated
id. Also confirm any story whose `render` adds demo wrappers declares an explicit `source` — see
`author-component-story`.

```bash
grep -rln "render:" apps/stories/src/stories | xargs grep -Ln "source:"
```

Each file that lists is a candidate: check whether its `render` is pure consumer markup. If it wraps
anything in a demo `<main>`, grid, or heading, it needs a `source`.

### 6. Native semantics and ARIA

```bash
grep -rnE "role=['\"](button|checkbox|link|heading|list)" packages/examples/src apps/stories/src packages/components/src
grep -rn "attachShadow\|ShadowRoot\|shadowrootmode" packages/*/src apps/*/src
grep -rn "setAttribute('role'" packages/components/src
```

Prefer native HTML semantics before ARIA; add ARIA only to complete a native contract, never to
replace missing DOM behavior. Prefer Light DOM over Shadow DOM. Prefer anchor positioning, native
`popover`, and native `<dialog>` over JS equivalents.

For anything with semantics or interaction, hand the component to `verify-apg-conformance` rather
than judging its keyboard contract here.

### 7. Diagnostics leaking into the public surface

```bash
grep -rn "data-ui-" packages/components/src --include='*.ts' | grep -vE "data-ui-internal-|data-ui-part"
```

Runtime state and diagnostics are never exposed through public `data-ui-*`. Public state uses native
attributes, ARIA, platform pseudo-classes, or `ElementInternals.states` with `:state()`.

### 8. Components without the Atmosphere theme

Confirm the component is still usable, and still carries its semantics, with its
`themes/atmosphere/<component>.css` absent — consumers must be able to drop the theme and style the
public anatomy with their own CSS or utility classes. This is a reading check, not a grep.

Note the boundary: `tokens.css` and `core/<component>.css` are _required_, because core is behavior
rather than appearance. `check-core-boundary.mjs` proves which declarations may live in each half,
and `apps/e2e/tests/apps/web/core-only.spec.ts` proves the theme-free rendering still works. What is
left for a reader is whether the component still _reads_ correctly without the theme.

## Reporting

Rank by severity: broken public contract first, then rule violations, then risks. For each finding
give the file and line, the rule from AGENTS.md, what the code does instead, and the smallest fix.

Say plainly when a check found nothing. "Clean on 1–5, two findings in 6" is more useful than a list
padded with non-findings. Do not report a hit you could not confirm by reading the code — say it
needs a human instead.
