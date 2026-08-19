# Actions And Release Readiness Results

Status: Rejected. This milestone was never run. By the time it was reviewed, on 2026-08-19 at commit
`27b76e3`, most of it had already been delivered under later numbers and the rest had aged out.

## Where each item landed

| 007 item                           | Outcome                                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Segmented Control                  | Delivered as `ui-toggle-group` with `attached` and `selection`, catalogued and storied                                                     |
| Copy Button / Clipboard            | Never built. Moved to milestone 026                                                                                                        |
| React JSX type support             | Delivered by milestone 019, alongside Preact, Vue, Svelte, and Solid typings                                                               |
| Custom Elements Manifest           | Delivered as `custom-elements.json` plus `manifest:validate`, VS Code custom data, and `web-types.json`                                    |
| Export and side-effect audit       | Delivered as `exports:validate`, `boundaries:check`, and a declared `sideEffects`. `publint --strict` passes for both packages             |
| Package metadata audit             | Incomplete. Both package manifests still lack `repository`, `homepage`, `bugs`, `keywords`, and `author`. Moved to milestone 026           |
| README and usage docs              | Delivered on the documentation site by milestones 016 and 017, not in the package READMEs. The remaining README gap moved to milestone 026 |
| Postponed: Color Picker            | No longer postponed. Shipped in milestone 009                                                                                              |
| Postponed: Data Table, Date Picker | Superseded by milestone 021, which publishes the boundary as a reasoned decision rather than a list of absences                            |
| Postponed: Time Picker             | Dropped. Not carried forward                                                                                                               |
| `pnpm test:full-qa` acceptance     | Superseded. The gate is continuous — CI runs it per pull request, so it is no longer a milestone acceptance criterion                      |

## Decisions and constraints

**`apps/stories` is no longer a documentation surface.** 007 required install, CSS import, and
define-entrypoint patterns in `apps/stories` usage docs. Milestones 016 and 017 moved documentation
to `apps/web`, where those patterns now live in `getting-started/installation.mdx`,
`reference/packages.mdx`, and the seven `frameworks/*.mdx` pages. The requirement was met somewhere
other than where 007 expected it.

**The segmented control did not need its own component.** 007 specified native buttons plus a hidden
native input for form submission. What shipped is `ui-toggle-group[attached]`, which carries state
in `aria-pressed` and dispatches a change event, and has no form-submission story at all. Nothing
has asked for one since, so the gap is recorded rather than carried forward — a segmented control
that must submit is a radio group with different styling.

**Release readiness stopped being milestone-shaped.** 007 treated publishing as a single gated
event. The checks it asked for became continuous instead: `pnpm qa` chains them, `pr-quality.yml`
runs them per pull request, and `build` fails on a stale registry before `tsdown` runs. What remains
is the metadata a linter does not check, which is why milestone 026 is scoped to those specific
fields rather than to another audit.
