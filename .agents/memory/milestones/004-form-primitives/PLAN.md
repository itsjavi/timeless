---
status: Implemented
---

# Form Primitives Plan

## Summary

- Implement form styling primitives and native-control recipes in `packages/components`, published
  as `@timelessui/components`.
- Preserve browser form behavior and label/control relationships.
- Use custom elements only when native controls cannot provide the required interaction.

## Components

- Field
- Label
- Description / Help Text
- Error Message
- Input
- Textarea
- Native Select
- Checkbox
- Checkbox List
- Radio
- Radio Group
- Switch
- Range / Slider base
- File Input

Custom Select and Combobox are excluded from this milestone because they depend on popover/list
behavior and are planned separately.

## Contracts

- Prefer native inputs, labels, fieldsets, legends, descriptions, and validation attributes.
- Use `.ui-*` classes for styling identity and `data-ui-*` for variants, invalid state, density,
  orientation, and slots.
- Do not require JavaScript for basic form styling.
- Keep submitted values owned by native form controls.
- Document disabled, readonly, invalid, required, help text, and error text patterns.

## Acceptance

- Form stories demonstrate native submission-friendly anatomy.
- Smoke tests cover labels, descriptions, invalid states, disabled states, and grouped controls.
- No component in this slice requires `ElementInternals`.
- `pnpm -F @timelessui/components run typecheck && pnpm -F @timelessui/components run build && pnpm -F @timelessui/components run test && pnpm -F @apps/stories run test`
