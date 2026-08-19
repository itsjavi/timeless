---
status: Implemented
---

# Progressive Overlays Plan

## Summary

- Implement the first progressive Web Component behavior layer using `@timelessui/core`.
- Add progressive components in `packages/components`, published as `@timelessui/components`.
- Components should enhance author-owned Light DOM and native platform features.
- Native `dialog`, Popover API, anchor positioning, and Interest API should be preferred where
  available.

## Components

- Tabs
- Collapsible
- Dialog
- Popover
- Hover Card
- Tooltip / Hover Card recipe
- Toast and Toaster

## Contracts

- Root modules stay side-effect free; define entrypoints explicitly register custom elements.
- Components expose ARIA plus `data-ui-state` and documented slots.
- Events use standardized names where practical, such as `ui-change`, `ui-open`, `ui-close`, and
  `ui-dismiss`.
- Focus restoration, Escape handling, outside interaction, and top-layer behavior must be shared
  through core helpers rather than copied per component.
- Browser tests cover real DOM behavior for interactive components.

## Acceptance

- Each progressive component has unit tests for pure behavior and browser tests for platform
  behavior.
- `apps/stories` documents HTML-only fallback and enhanced usage.
- `pnpm -F @timelessui/core run test && pnpm -F @timelessui/components run test && pnpm -F @apps/stories run build`
