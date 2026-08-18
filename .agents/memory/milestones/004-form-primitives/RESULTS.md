# Form Primitives Results

Status: Complete.

## Summary

- Added CSS-only form contracts for Field, Label, Description, Error, Input, Textarea, native
  Select, Checkbox, Radio, Choice Group, Switch, Range, and File Input.
- Added a side-effect-free `forms.ts` export surface with contract metadata, public token values,
  and type guards.
- Added `forms.css` to style native form controls without custom elements, ElementInternals, or
  JavaScript.
- Added StoryLite anatomy examples under `Form Primitives/` with copyable source snippets for field,
  select, checkbox/radio group, switch, range, and file input patterns.
- Added smoke coverage for labels, descriptions, invalid states, select, checkbox/radio groups,
  switch, range, and file input.

## Notes

- Basic form behavior stays native: submitted values, required fields, reset behavior, labels,
  fieldsets, legends, range sliders, native selects, and file pickers are platform-owned.
- Switch uses a native checkbox with `role="switch"` and CSS styling. No custom element or
  JavaScript state synchronization was introduced.
- Custom Select and Combobox remain out of scope for later popover/listbox milestones.
- Control styling uses a soft framed/inset treatment from Atmosphere tokens, while field layout,
  help text, and errors stay flat.

## Verification

- `pnpm -F @timelessui/components run typecheck`
- `pnpm -F @timelessui/components run build`
- `pnpm -F @timelessui/components run test`
- `pnpm -F @apps/stories run typecheck`
- `pnpm -F @apps/stories run test`
- `pnpm -F @apps/stories run build`
- Browser QA at `http://localhost:1995/#/canvas/form-primitives-field--default`,
  `form-primitives-field--validation`, `form-primitives-select--default`,
  `form-primitives-choice-group--default`, `form-primitives-switch--default`,
  `form-primitives-range--default`, and `form-primitives-file-input--default`: each route rendered
  expected native controls with non-zero document dimensions and no console warnings/errors.

## Remaining

- None.
