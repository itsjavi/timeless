# Milestone 016 Tasks

## Milestone setup

- [x] Create `PLAN.md`, `TASKS.md`, and `RESULTS.md`.
- [x] Record dependencies on completed milestones 012 through 015.
- [x] Record the initial clean-tree and dependency state.

## Baseline and Astro migration

- [x] Record current metadata, behavior, links, and responsive contracts.
- [x] Capture deterministic homepage and 404 visual baselines.
- [x] Configure Astro and Starlight.
- [x] Port the site into Astro layouts and components.
- [x] Port hero and 404 behavior into typed client scripts.
- [x] Pass the visual parity gate and record evidence. Accepted on byte-identical CSS and matching
      geometry, both recorded in `RESULTS.md`. The literal zero-pixel check never passed, measuring
      0.129 to 0.926 percent antialiasing, and the baseline predates the approved navigation change
      and milestone 017, so it can no longer be recaptured.
- [x] Add the intentional Docs, Stories, and Get Started links.

## Documentation infrastructure

- [x] Create private `@timelessui/examples`.
- [x] Move reusable factories and escaping helpers into it.
- [x] Validate examples against public manifests and exports.
- [x] Extend dependency-boundary checks.
- [x] Implement documentation coverage validation.
- [x] Build static preview routes and controls.
- [x] Verify granular definition and CSS loading.

## StoryLite

- [x] Apply the `Library/*` domain taxonomy.
- [x] Add Team Presence, Account Form, and Popover Color Picker recipes.
- [x] Move Menubar into Menu and remove the architecture story.
- [x] Regenerate the route catalog and update focused E2E paths.
- [x] Confirm every generated route remains covered.

## Documentation content

- [x] Implement branded light and dark Starlight themes.
- [x] Write overview and getting-started documentation.
- [x] Write Vanilla, React 19, Astro, Svelte, Vue, and Solid guides.
- [x] Write the concepts section.
- [x] Write every component reference page.
- [x] Document utilities, events, tokens, manifests, JSX types, and entrypoints.
- [x] Add previews, snippets, accessibility guidance, and StoryLite links.
- [x] Pass public API documentation coverage.

## Build and deployment

- [x] Add unified artifact composition and root commands.
- [x] Update Docker and nginx.
- [x] Update GitHub Pages and deployment documentation.
- [x] Extend CI with separate package, site, and browser responsibilities.

## Final verification

- [x] Run formatting, type checking, unit tests, and package builds.
- [x] Run manifest, export, boundary, generated-file, performance, and `publint` checks.
- [x] Build Astro, Starlight, StoryLite, and `dist-site`.
- [x] Run documentation coverage and internal-link validation.
- [x] Run the existing browser matrix and new docs checks.
- [x] Build and smoke-test the production Docker image and nginx routes. Dropped, not run: the
      Docker and nginx deployment was removed in `053a6fb`, leaving GitHub Pages as the only deploy
      target.
- [x] Record final evidence and remaining manual review in `RESULTS.md`.
- [ ] Complete release keyboard, forced-colors, 200-percent zoom, and assistive-technology review,
      which a complete WCAG conformance claim still requires.
