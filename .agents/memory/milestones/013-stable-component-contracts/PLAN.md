# Milestone 013: Stable Component Contracts

## Objective

Give selection and disclosure components native-like live state, consistent transition events, and
reusable collection behavior that future domain packages can compose without Timeless styling.

## Scope

- Treat authored `value` attributes as defaults and reset state, then keep `.value` as silent live
  state.
- Retain authored native inputs for form submission, reset, disabled state, validation, labels, and
  external form ownership.
- Add typed cancelable before events and typed non-cancelable committed events.
- Include value, previous value, source, reason, and original event in transition details.
- Add cached locale-aware matching and two-dimensional disabled-aware navigation utilities.
- Keep class factories, structural interfaces, controllers, and pure helpers public and CSS-free.

## Constraints

- Direct property assignments remain silent.
- Canceled before events prevent mutation and prevent committed events.
- Active navigation state stays separate from committed selection.
- No component helper may require generated visual anatomy or Timeless CSS.

## Acceptance criteria

- Selection controls match the documented default, live, active, committed, and reset model.
- Public transition types document propagation, cancellation, source, and reason.
- Locale matching reuses collators and handles composed and decomposed diacritics.
- Grid navigation retains columns, skips disabled entries, and handles uneven final rows.
- Existing native-input form fallbacks remain functional before definition and without JavaScript.
