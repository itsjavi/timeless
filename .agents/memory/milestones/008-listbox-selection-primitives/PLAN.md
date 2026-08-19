---
status: Implemented
---

# 008 Listbox and Selection Primitives Plan

## Objective

Add shared selection primitives that extend the 006 collection/navigation foundation without
changing the library's Light DOM-first contract.

## Scope

- Add `ui-radio-group` and `ui-checkbox-group` controllers for authored native inputs.
- Add a `ui-listbox` controller and shared listbox helper functions.
- Reuse listbox state in `ui-select` and `ui-combobox` so option semantics, active state, and
  disabled behavior are consistent.
- Add StoryLite stories for the new primitives.
- Add focused e2e coverage for listbox and selection groups.

## Constraints

- Use plain attributes on `ui-*` hosts and reserve `data-ui-*` for authored anatomy and internal
  state.
- Keep style selectors low-specificity with `:where()`.
- Do not generate visual DOM from component JavaScript.
- Preserve native form behavior for radio, checkbox, select, and combobox inputs.

## Acceptance Criteria

- New custom elements are exported and included in `defineTimelessElements`.
- Listbox supports roving focus, selected state, disabled option skipping, typeahead, and
  `ui-change`.
- Radio group supports arrow-key movement and native checked state.
- Checkbox group emits `ui-change` with the checked values while keeping native checkbox behavior.
- Select and Combobox use shared listbox helpers for option state.
- Focused package tests, stories checks, and e2e coverage pass.
