# Milestone 018 Annex: Authoring Contract Research

## Conclusion

Timeless needs two authoring forms because native HTML and behavioral custom elements solve
different platform problems. It does not need multiple overlapping styling and anatomy dialects. The
refactor therefore keeps native class roots and registered behavioral roots while assigning one
canonical syntax to configuration, anatomy, public state, and private runtime state.

## Findings

### The three syntaxes have legitimate platform roles

- `.ui-*` classes opt semantic native HTML into Timeless styling without requiring JavaScript.
- Registered `<ui-*>` elements provide behavior, lifecycle, properties, and events.
- `data-ui-*` can carry configuration or Light DOM data on native and arbitrary elements.

Data attributes are valid HTML and CSS selector targets. See
[MDN: Use data attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/Use_data_attributes).

Repository evidence: the canonical split is encoded by the CSS and custom-element roots in the
[component registry](../../../../packages/components/scripts/component-registry.mjs) and taught in
the [package README](../../../../packages/components/README.md).

### The current data namespace is overloaded

The baseline scan found 133 distinct `data-ui-*` names across component source, examples, stories,
and tests. The same namespace currently represents visual configuration, anatomy, behavior
selection, public state, internal runtime state, diagnostics, fallback identities, and domain
values. Consumers cannot infer ownership or stability from the syntax.

Repository evidence: the 133-name baseline is recorded in [RESULTS.md](./RESULTS.md), while the new
classifier and enforcement live in
[validate-contracts.mjs](../../../../packages/components/scripts/validate-contracts.mjs) and the
[example validator](../../../../packages/examples/scripts/validate.mjs).

### Several components expose multiple public dialects

- Button combines `.ui-button` with `data-ui-variant` and `data-ui-size`.
- Dialog combines `<ui-dialog>`, `.ui-dialog`, and `data-ui-dialog`.
- Popover accepts generic and component-specific trigger hooks, then class and attribute surface
  hooks.
- Listbox accepts a custom-element root or attribute fallback, then roles or data hooks for options.
- Tooltip appears as a Hover Card variant, a tooltip class, and tooltip-specific data hooks.

These aliases multiply documentation, CSS branches, tests, and uncertainty about canonical markup.

Repository evidence: the clean-break outcomes and negative alias assertions are covered by the
[Dialog tests](../../../../packages/components/src/dialog.test.ts),
[Popover tests](../../../../packages/components/src/popover.test.ts),
[Listbox tests](../../../../packages/components/src/listbox.test.ts), and
[Toast tests](../../../../packages/components/src/toast.test.ts). The pre-refactor dialects are from
starting commit `4d10ceb76400b1182772705fba36a89df4ae8ac9`.

### Separator violates the intended boundary

`<ui-separator>` is public in examples but is not registered and adds no behavior. It duplicates
`.ui-separator` with a different attribute dialect and generic custom-element semantics.

Autonomous custom elements do not inherit native button, separator, form, or other semantics. See
[WHATWG: Custom elements](https://html.spec.whatwg.org/dev/custom-elements.html).

Repository evidence: the registered element list comes from the
[component registry](../../../../packages/components/scripts/component-registry.mjs), while the
[separator example](../../../../packages/examples/src/primitives.html.ts) and
[separator CSS](../../../../packages/components/src/css/separator.css) now use native roots only.

### Public state and diagnostics collide

`data-ui-invalid` means visible form validation on CSS primitives and malformed anatomy on
behavioral hosts. Disabled, active, dismissed, unsupported, floating, and contextual state have
similar ownership ambiguity.

Platform and ARIA state should remain authoritative. `ElementInternals.states` and `:state()` are
available for custom host state. See
[MDN: ElementInternals states](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals/states).

Repository evidence: custom state is centralized in
[UIElement](../../../../packages/core/src/ui-element.ts) and exercised by
[UIElement tests](../../../../packages/core/src/ui-element.test.ts). Toast and Color Picker consume
that policy in [toast.ts](../../../../packages/components/src/toast.ts) and
[color-picker.ts](../../../../packages/components/src/color-picker.ts).

### An all-custom-element API conflicts with Timeless goals

Web Awesome demonstrates a coherent API such as `<wa-button variant="brand">`. See
[Web Awesome: Button](https://webawesome.com/docs/components/button).

Applying that model throughout Timeless would require more JavaScript, native-control wrapping,
form-associated custom elements, generated anatomy, or Shadow DOM. It would weaken the native HTML,
CSS-first, Light DOM, and no-JavaScript fallback goals.

Repository evidence: the native-first constraints remain explicit in
[AGENTS.md](../../../../AGENTS.md), while canonical native and behavioral examples are maintained in
the [example catalog](../../../../packages/examples/src/catalog.ts).

### A native-first hybrid can remain consistent

GOV.UK and USWDS demonstrate native HTML enhanced through stable classes and behavior hooks. See
[GOV.UK: Button](https://design-system.service.gov.uk/components/button/) and
[USWDS: Developer documentation](https://designsystem.digital.gov/documentation/developers/).

The unification target is one syntax per responsibility, not one HTML construct for every component.

Repository evidence: the hybrid grammar is generated from the
[component registry](../../../../packages/components/scripts/component-registry.mjs), documented in
the [concepts guide](../../../../apps/web/src/content/docs/docs/concepts/index.mdx), and enforced by
the [contract validator](../../../../packages/components/scripts/validate-contracts.mjs).

## Adopted decisions

- Make a clean break while the package remains at version `0.0.1`.
- Keep native visual configuration in contract-declared `data-ui-*` attributes.
- Use `data-ui-part` for authored anatomy that native semantics cannot identify.
- Export one unified public component contract catalog.
- Perform platform-first runtime-state cleanup in the same milestone.
- Do not adopt modifier classes, permanent aliases, or an all-custom-element architecture.
