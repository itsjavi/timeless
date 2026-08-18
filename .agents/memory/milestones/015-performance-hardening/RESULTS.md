# Milestone 015 Results

Milestone 015 is complete.

## Runtime hardening

Repeated registration with the same realm constructor is idempotent. A conflicting constructor now
throws with the tag and both constructor names. Generated IDs use counters scoped to the owner
document. Focused tests cover independent documents and target-window registration. Browser tests
use animation completion instead of arbitrary delays.

A source gate allows generated visual DOM only in the documented Toast helper. All other normal
enhancement remains author-owned and attribute-only.

## Checked-in measurements

The synthetic load, filter, and paging sequence renders 48 direct options and ends at 206 elements.
It records 1,015 mutation records, zero instrumented public layout reads, and zero observed layout
shift. Every metric has a checked-in baseline and a 10 percent growth ceiling. The no-JavaScript
route retains its native input.

| Entry closure | Raw JS bytes | Gzip JS bytes | Raw CSS bytes | Gzip CSS bytes |
| ------------- | -----------: | ------------: | ------------: | -------------: |
| Popover       |       16,097 |         4,155 |         6,293 |          1,132 |
| Listbox       |       25,117 |         6,254 |         1,391 |            449 |
| Select        |       62,169 |        15,018 |         2,425 |            758 |
| Combobox      |       59,469 |        14,564 |         2,602 |            777 |

The Combobox closure contains its collection, event, floating, listbox, and popover dependencies. It
does not load Color Picker, Dialog, Sheet, or Toast. Earlier representative measurements remain at
21 Popover nodes, 26 Select nodes, 26 Combobox nodes, and 22 Listbox nodes before and after normal
enhancement, with zero added visual nodes.

## Final verification

The final direct validation passed 30 core unit tests, 95 component unit tests, both package
typechecks and builds, both strict `publint` checks, StoryLite and end to end typechecks, manifest
validation, export resolution, generated-file freshness, generated DOM policy, dependency
boundaries, and bundle performance ceilings. The browser matrix passed all 225 tests across its
Chromium route and interaction coverage plus the focused Firefox and WebKit platform projects.

## Evidence limits

The layout-read counter wraps public DOM APIs and cannot observe browser-internal layout work. The
layout-shift observer covers the tested Chromium sequence. Bundle gzip is a deterministic sum of
entry closure files, not a prediction for every application bundler. Baseline changes require an
explicit checked-in justification and review.
