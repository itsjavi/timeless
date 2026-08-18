# Milestone 018 Tasks

## Baseline and inventory

- [x] Confirm milestone 017 is complete and the worktree is clean.
- [x] Record the starting commit and current package maturity.
- [x] Create `PLAN.md`, `TASKS.md`, `RESULTS.md`, and `ANNEX.md`.
- [x] Record the complete selector classification and retired-name inventory.

## Unified contracts

- [x] Create the canonical build-time component registry.
- [x] Generate the typed `componentContracts` catalog.
- [x] Generate element definitions, JSX declarations, and the Custom Elements Manifest from the same
      registry.
- [x] Replace grouped public contract exports with the unified catalog.
- [x] Add generated-file, public-selector, part, and registration validation.

## CSS primitives and forms

- [x] Convert public anatomy to scoped `data-ui-part` tokens.
- [x] Replace invalid, disabled, required, and unavailable data state with native or ARIA state.
- [x] Remove the unregistered `ui-separator` contract and migrate every example.
- [x] Preserve visual output, low specificity, CSS exports, and no-JavaScript behavior.

## Behavioral components

- [x] Add protected custom-state support to `@timelessui/core`.
- [x] Convert collections, Tabs, Menu, Toolbar, Listbox, Select, and Combobox.
- [x] Convert Dialog, Sheet, Popover, Hover Card, Menu Button, and floating behavior.
- [x] Convert Toast, Number Stepper, and Color Picker.
- [x] Remove anatomy aliases and migrate unavoidable runtime hooks to `data-ui-internal-*`.
- [x] Preserve keyboard, focus, form, transition, replacement-observation, and nested ownership
      behavior.

## Consumers and documentation

- [x] Migrate all canonical example factories and recipes.
- [x] Migrate StoryLite stories, sources, demo CSS, and smoke assertions.
- [x] Migrate Starlight component pages, previews, framework guides, and CSS contract output.
- [x] Update the package README, repository authoring rules, and design guide.
- [x] Update E2E selectors and contract expectations.

## Verification and completion

- [x] Pass core and component type checks and unit tests.
- [x] Pass generation, manifest, export, boundary, performance, and `publint` checks.
- [x] Pass canonical example and documentation validation.
- [x] Pass StoryLite, Starlight, composed-site, no-JavaScript, accessibility, and browser checks.
- [x] Run the retired-selector and unregistered-element audits.
- [x] Record final decisions, results, and remaining manual review in `RESULTS.md`.
