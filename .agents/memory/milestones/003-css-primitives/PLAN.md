# CSS Primitives Plan

## Summary

- Implement the CSS-only and mostly CSS component layer in `packages/components`, published as
  `@timelessui/components`.
- Components are native elements or authored Light DOM styled through `.ui-*` classes and namespaced
  `data-ui-*` attributes.
- No custom elements should be introduced here unless a primitive has unavoidable behavior.

## Components

- Accordion / Disclosure
- Badge
- Card
- Alert
- Avatar
- Separator
- Skeleton
- Progress
- Link
- Kbd
- Code
- Static Table
- List and List Item
- Group
- Spinner

Button is excluded because it is introduced in the rewrite bootstrap milestone.

## Contracts

- Prefer native HTML first: `details`, `summary`, `a`, `kbd`, `code`, `progress`, table elements,
  lists, buttons, and images where applicable.
- Use `.ui-*` classes as component identity hooks.
- Use namespaced `data-ui-*` attributes for variants, size, state, density, orientation, and slots.
- Keep CSS in `@layer ui.tokens`, `ui.components`, and `ui.utilities`.
- Export one CSS file per component plus a component bundle CSS file.
- Document HTML-only usage, public anatomy, custom properties, and Tailwind/custom CSS usage in
  `apps/stories`.

## Acceptance

- `@timelessui/components` builds with declarations and copied CSS.
- Each component has a StoryLite anatomy example in `apps/stories`.
- Unit tests cover exported token/type contracts where a TypeScript API exists.
- Smoke tests assert story rendering for representative default and variant states.
- `pnpm -F @timelessui/components run typecheck && pnpm -F @timelessui/components run build && pnpm -F @timelessui/components run test && pnpm -F @apps/stories run build`
