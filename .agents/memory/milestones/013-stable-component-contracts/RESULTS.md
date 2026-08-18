# Milestone 013 Results

Milestone 013 is complete.

## State and forms

Tabs, Radio Group, Listbox, Select, and Combobox now distinguish the authored `value` attribute from
the live `value` property. The attribute supplies initial and reset state. Direct property writes
change live state silently and do not rewrite the attribute. Select and Combobox retain authored
native inputs, so form ownership and no-JavaScript behavior remain inspectable and framework-free.

Timeless did not adopt `ElementInternals` for these controls. The current native inputs already own
submission, labels, reset, disabled behavior, and browser restoration. A future domain element can
still choose `ElementInternals` while composing the public helpers.

## Events and collection utilities

User-driven selection dispatches cancelable `ui-before-change`, then non-cancelable `ui-change`
after commit. Typed detail includes `value`, `previousValue`, `source`, `reason`, and
`originalEvent`. Both events bubble and are composed. A browser contract test verifies cancellation
before mutation and proves that a direct `value` assignment emits no change event.

Cached `Intl.Collator` matching handles locale and composed or decomposed text. Public grid
navigation handles uneven rows, retained columns, paging keys, and disabled items. Side-effect-free
entrypoints expose collection helpers, transition contracts, and `ValueState` for future domain
packages.

## Migration examples

Live control changes from `element.setAttribute('value', next)` to `element.value = next`. Reset
defaults remain authored as `<ui-listbox value="initial">`. Consumers that need to veto user changes
listen to `ui-before-change` and call `preventDefault()`. Consumers observe committed changes with
`ui-change`.
