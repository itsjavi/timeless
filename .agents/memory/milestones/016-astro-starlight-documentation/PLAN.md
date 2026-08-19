---
status: Implemented
---

# Milestone 016 Plan: Astro and Starlight Documentation Site

## Goal

Replace the static Vite website with an Astro application, publish Starlight documentation at
`/docs/`, publish StoryLite at `/stories/`, and deploy both from one static artifact without
changing the existing homepage or 404 presentation during the migration.

## Architecture

- Keep `apps/web` as the public site and use Astro static output with Starlight.
- Preserve the existing marketing page and 404 markup, CSS, assets, metadata, analytics, and client
  behavior while splitting their structure into Astro layouts and components.
- Add the Docs, Stories, and Get Started navigation only after the parity port.
- Create private `@timelessui/examples` for canonical consumer markup shared by Starlight and
  StoryLite. Keep story controls and documentation prose in their respective apps.
- Treat `custom-elements.json` and package exports as generated API truth. Use curated docs for
  anatomy, accessibility, progressive enhancement, and framework guidance.
- Generate isolated static preview routes under `/docs/_preview/{example-id}/` with granular CSS and
  explicit element definition entrypoints.
- Reorganize StoryLite under user-facing `Library/*` domains and a separate `Recipes/*` hierarchy.
- Compose Astro and StoryLite output into `dist-site/`, which is the only artifact copied into the
  nginx image or uploaded to GitHub Pages.

## Documentation

The launch set contains overview, installation, quick start, browser support, package entrypoints,
Vanilla, React 19, Astro, Svelte, Vue, and Solid guides, core concepts, every current component
family, and public utility and package contracts. The docs use the marketing palette and display
font while retaining Starlight body and code typography. Light and dark themes must remain
accessible.

API coverage validation must fail for undocumented public elements or CSS exports, invalid imports,
unknown example requirements, duplicate IDs, and missing preview references. The Custom Elements
Manifest populates API facts but does not generate the explanatory pages.

## Constraints

- Preserve the completed accessibility, component-contract, packaging, and performance gates from
  milestones 012 through 015.
- Keep published packages independent from the private examples package.
- Do not add runtime framework wrappers, an embedded editor, or an external sandbox.
- Do not claim WCAG conformance from automated checks alone.
- Keep the site fully static and retain the project's native HTML, Light DOM, and CSS-first rules.

## Acceptance

- `/`, `/docs/`, `/stories/`, and `/404.html` are present in the composed artifact.
- `/ui/` permanently redirects to `/stories/` in nginx.
- The Astro marketing pages preserve the original presentation, apart from the approved navigation
  additions made after the port.
- Every public component family has documentation, canonical markup, and a working isolated preview.
- StoryLite clearly separates library contracts from multi-component recipes.
- Docker and GitHub Pages consume the same static artifact.
- Existing package and browser gates plus the new site, preview, link, and deployment checks pass.
