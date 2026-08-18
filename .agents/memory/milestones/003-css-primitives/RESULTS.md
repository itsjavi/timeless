# CSS Primitives Results

Status: Complete.

## Summary

- Formalized Atmosphere token groups for surfaces, control fills, radii, shadows, semantic colors,
  typography, spacing, and motion.
- Added CSS-only primitive contracts for Alert, Avatar, Badge, Separator, Card, Skeleton, Progress,
  Link, Kbd, Code, Group, List, Table, native details/summary Disclosure, and Spinner.
- Added side-effect-free TypeScript metadata for primitive class names, public data attributes,
  token groups, variant values, and type guards.
- Added StoryLite anatomy examples in `apps/stories` with reusable HTML factories and smoke coverage
  for the new stories.

## Notes

- StoryLite raw CSS parameters need direct component CSS imports. Injecting `components.css?raw`
  only provided unresolved `@import` statements, so the primitives story imports each package CSS
  file directly while the package still exposes `components.css` for normal CSS consumers.
- Disclosure stays CSS-first by using native `details` and `summary`; no custom element or behavior
  controller was introduced.
- Flat primitives intentionally avoid the tactile Button shadow treatment. Depth remains reserved
  for controls and later overlays.

## Verification

- `pnpm -F @timelessui/components run typecheck`
- `pnpm -F @timelessui/components run build`
- `pnpm -F @timelessui/components run test`
- `pnpm -F @apps/stories run typecheck`
- `pnpm -F @apps/stories run test`
- `pnpm -F @apps/stories run build`
- Browser QA at `http://localhost:1992/#/story/css-primitives--badge` and
  `http://localhost:1992/#/story/css-primitives--disclosure`: page rendered, no framework overlay,
  no console warnings/errors, Badge styling applied, Disclosure toggle opened the second native
  panel, and a 390px-wide viewport pass showed no obvious overlap.
- Final browser QA at `http://localhost:1993/#/canvas/css-primitives-alert--default`,
  `http://localhost:1993/#/canvas/css-primitives-avatar--default`, and
  `http://localhost:1993/#/canvas/css-primitives-spinner--default`: each primitive rendered with
  non-zero dimensions and no console warnings/errors.

## Remaining

- None.
