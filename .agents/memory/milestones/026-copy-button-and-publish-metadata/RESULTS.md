# Milestone 026 Results

## Baseline

Measured on `main` at commit `27b76e3` on 2026-08-19, before any work. Rows marked **run** were
verified by executing the command, not by reading the source.

| Measure                                                    | Value                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Catalog entries                                            | 47, of which 3 under **Actions**                                               |
| `ui-copy-button` in registry, catalog, or CSS              | Absent from all three                                                          |
| Clipboard code in the library                              | One private path, `color-picker.ts:493-506`, 14 lines, silent `catch`          |
| `COPIED_DURATION`                                          | 1800ms (`color-picker.ts:58`)                                                  |
| `:state(--copied)` CSS idiom                               | Already established, `color-picker.css:163-168`                                |
| Color picker's `--copied` state                            | Declared **non-public** — "Internal; do not author it."                        |
| `check-generated-dom.mjs` allowlist                        | `toast.ts` only                                                                |
| `validate.ts` coverage                                     | Attributes only; never walks `data-ui-part`                                    |
| `pnpm publint`                                             | **run** — "All good!" for both `@timelessui/core` and `@timelessui/components` |
| `pnpm attw`                                                | Covers `@timelessui/components` only; core has no script and no devDependency  |
| attw against core by hand, `--profile esm-only`            | **run** — 🟢 `node16 (from ESM)`, 🟢 `bundler`                                 |
| `repository` / `homepage` / `bugs` / `keywords` / `author` | Missing from both published manifests                                          |
| Install command in `packages/components/README.md`         | Absent. Present in 9 places under `apps/web/src/content`                       |

## Platform behavior confirmed before planning

**Nothing about the Clipboard API was confirmed firsthand.** The plan rests on documented behavior
only — that `navigator.clipboard` is undefined outside a secure context, that `writeText` rejects
without transient user activation in some engines, and that Playwright can grant clipboard
permissions per browser context. Each is a task before implementation, not an assumption to build
on:

- Confirm `navigator.clipboard` is genuinely `undefined` rather than present-and-rejecting in each
  target engine over plain HTTP, because it decides whether `'unsupported'` and `'denied'` are two
  reasons or one.
- Confirm whether WebKit rejects `writeText` when called from a `click` handler that has already
  awaited, since the element's copy path is async.
- Confirm Playwright's clipboard permission grant works in all three engines the suite runs, or the
  copy-path spec is Chromium-only and must say so.

The one fact that **was** confirmed by execution is that `@timelessui/core` passes attw today with
the `esm-only` profile, which is why section 8 is scoped as wiring rather than as a fix.

## Open decisions

**Where does the announcement text come from?** The plan reads the authored `copied` part's text
content, so the string stays author-owned and internationalisable with no new attribute. This breaks
for an icon-only button, which has no text to read.

- **For reading the part:** no new attribute, no English in the library, one obvious source.
- **Against:** an icon-only trigger announces nothing, silently. The alternative is a
  `copied-message` attribute, which adds a third text-ish attribute to a small component and gives
  authors two ways to say the same thing.
- Decide by building the icon-only story first. If it reads badly, the attribute is justified.

**Is `--failed` a state worth declaring?** The plan declares only `--copied` and leaves failure to
the event. A `--failed` state would let CSS show an error affordance without script, which is the
library's usual preference — but a failed copy is rare, and a state nothing in the default
stylesheet uses is contract surface with no proof behind it. `contracts:validate` will reject it if
the CSS never selects it, which is the honest forcing function.

**Should the reveal be opt-in or automatic?** The plan makes it opt-in: the element removes `hidden`
only from a trigger the author marked `hidden`. Automatic hiding — the element hiding a visible
trigger when the Clipboard API is missing — would guarantee no dead control ever renders, but it
means script removing an author's visible UI, which is the kind of thing this library deliberately
does not do. Opt-in leaves an author who forgets with an inert button.

**Two threads in one milestone.** The copy button and the packaging fixes share nothing but their
origin in 007. Splitting them would mean a milestone whose entire content is five manifest fields.
Recorded so the pairing reads as a decision rather than an oversight.

## Decisions and constraints

Pending implementation.

## Summary

Pending implementation.

## Validation results

Pending implementation.

---

Generated by Claude Opus 5 - High reasoning
