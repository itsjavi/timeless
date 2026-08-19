# Timeless UI

Timeless UI is a framework-agnostic UI library built on the modern web platform. It is not published
yet, while the primitives settle.

| Surface                                                        | Lives in              |
| -------------------------------------------------------------- | --------------------- |
| Website and reference documentation                            | `apps/web`            |
| Component catalog and development workbench                    | `apps/stories`        |
| The library itself: CSS, custom elements, contracts, utilities | `packages/components` |
| Internal custom-element authoring layer                        | `packages/core`       |
| Canonical consumer examples shared by the documentation apps   | `packages/examples`   |

## Vision

Most Timeless components are plain CSS over native HTML and need no JavaScript at all. The rest are
custom elements, used only where keyboard coordination, focus management, or state synchronisation
cannot be expressed accessibly in CSS. Either way the markup you author is the markup that ships:
the initial shell is useful before JavaScript runs, so pages avoid layout shifts, unstyled flashes,
and framework-specific boot requirements.

The library targets Baseline 2025 browsers and builds on these platform features today:

- CSS anchor positioning, for popover, menu, select, and combobox surfaces
- Popovers and native `<dialog>`, for top-layer, light dismiss, and Escape handling
- Cascade layers (`ui.tokens`, `ui.components`, `ui.utilities`), so consumer CSS wins without
  specificity fights
- `light-dark()` and `color-scheme`, so tokens follow the platform without a runtime
- `color-mix()` in OKLab, plus OKLCH, LCH, HWB, Display-P3, and Rec. 2020 color parsing
- `ElementInternals` custom states, exposed to CSS through `:state()`
- Invoker Commands (`command` and `commandfor`), so an authored dialog or modal sheet trigger opens
  and closes before any script runs
- Light-DOM web components, so consumer CSS and markup stay inspectable

Container queries, container style queries, and Declarative Shadow DOM are compatible with this
approach but are not used by any current component. They are candidates, not claims.

There is no CSS framework and no component framework runtime. Consumers use the same primitives from
plain HTML, React, Preact, Vue, Svelte, Solid, Astro, or any other environment that can render
custom elements.

## Component catalog

Components are grouped as Foundations, Actions, Forms, Navigation, Content, Feedback, Overlays, and
Color. The catalog is declared once in `packages/examples/src/catalog.ts`, which drives the
documentation sidebar, the component index at `/docs/components/`, the live previews, and the
StoryLite route ids — so the count and the grouping are never restated by hand.

Each component's reference page is generated from
`packages/components/scripts/component-registry.mjs` — the single declaration of every public root,
configuration attribute and its permitted values, authored part, public state, CSS custom property,
and event. `pnpm build` proves those values against the stylesheets in both directions, so a
documented value is a value the CSS implements.

Colour utilities are published separately from `@timelessui/components/color`.

What Timeless deliberately does not ship — and why, per component — is written down at
`/docs/reference/scope/`. Aspect Ratio, Scroll Area, and Carousel are declarations the platform
already provides; Chart, Data Table, and Tree View are libraries rather than primitives; sidebars,
chat surfaces, and command palettes are composition. Date Picker is deferred rather than refused.

## The enhancement model, by example

Popover shows the pattern every enhanced component follows. Author this:

```html
<ui-popover>
  <button type="button" data-ui-part="trigger" popovertarget="menu">Menu</button>
  <div id="menu" popover="auto">The content</div>
</ui-popover>
```

`popovertarget` and the `popover` attribute mean the browser already opens, closes, light-dismisses,
and Escape-handles the surface before any JavaScript loads. Registration then adds what the platform
does not: `aria-controls`, `aria-expanded`, a default `aria-haspopup`, a surface `role` (`dialog`
unless you choose otherwise), and anchored positioning.

If the browser lacks the Popover API, enhancement reports an unsupported result and leaves the
authored markup untouched. No public diagnostic attribute is added and no polyfill is loaded.

### Accessibility expectations

- Use a native trigger, preferably `<button type="button">`.
- Choose the surface semantics intentionally. `role` defaults to `dialog`; set `menu`, `listbox`, or
  `tooltip` when the interaction calls for it.
- Supply your own accessible names. Timeless wires relationships, never content — a `role="dialog"`
  surface still needs `aria-labelledby`.
- Native light dismiss, Escape handling, and top-layer behavior come from the Popover API.

Each component page documents its ARIA Authoring Practices pattern, the keys it implements, and what
the platform handles instead.

## Development

```bash
pnpm install
pnpm dev          # website on :6339 and the component catalog on :1992
pnpm build:site   # compose apps/web and apps/stories into dist-site
pnpm test:full-qa # typecheck, format, build, unit tests, and e2e
```

The website links to the catalog at `/stories/`, which only exists after `pnpm build:site`. In
development those links resolve to the catalog dev server instead; override the base with
`PUBLIC_STORIES_BASE_URL`.

## Planning

This README describes project intent and current behavior. Implementation order, pending work, and
phase status live in [`.agents/memory/milestones/`](.agents/memory/milestones/). Agent-facing
conventions live in [AGENTS.md](AGENTS.md) and the design language in
[`.agents/memory/DESIGN.md`](.agents/memory/DESIGN.md).
