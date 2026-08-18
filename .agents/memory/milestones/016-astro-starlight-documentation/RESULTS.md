# Milestone 016 Results

## Summary

Milestone 016 replaces the static Vite website with an Astro 7 application, adds Starlight as the
canonical documentation surface, reorganizes StoryLite around consumer-facing domains, and composes
all three surfaces into one static `dist-site/` artifact. A new private `@timelessui/examples`
package supplies the canonical markup, granular CSS, explicit element definitions, stable IDs, and
source used by both Starlight previews and StoryLite.

## Decisions and constraints

- Milestones 012 through 015 are complete and their package and browser gates remain authoritative.
- The initial tree was clean at commit `4a169d0`.
- The initial runtime was Node 24.19.0 with pnpm 11.22.0. Astro 7.2.2 and Starlight 0.41.7 were
  selected from the current package registry.
- Astro and Starlight remain a fully static deployment.
- `apps/web` remains the public-site package. Its original page CSS was relocated without
  refactoring during the parity stage.
- Starlight uses a dedicated stylesheet so its global shell does not inherit marketing-page
  selectors.
- Documentation previews use isolated static iframes. They do not compile user code and do not
  depend on an external sandbox.
- React support remains direct React 19 custom-element usage with opt-in JSX declarations. No
  runtime wrapper package was introduced.

## Visual parity evidence

- Baseline and migrated screenshots were captured in the same Chromium process at 1440 by 1100 and
  390 by 844 viewports. Random selection was fixed to `0`, local storage was cleared, fonts and
  images were awaited, and transitions were allowed to settle.
- Homepage and 404 layout dimensions match at both viewports. Visual inspection found no visible
  change before the intentional navigation update.
- The migrated site stylesheet is byte-identical to the original with SHA-256
  `fc3dd1f2426eec8521fe2414f5dee8a9998a3df735b01553d1581fb8f27fddef`. The migrated 404 stylesheet is
  byte-identical with SHA-256 `20c97a4e47e29541975a3f5df71a6957d084a429046eb916e83afd47f88035a8`.
- Strict raster comparison still measured small antialiasing differences: 0.167 percent for desktop
  home, 0.129 percent for mobile home, 0.591 percent for desktop 404, and 0.926 percent for
  mobile 404. The literal zero-pixel acceptance check therefore remains open instead of being
  overstated.
- After the parity capture, the public navigation gained Docs and Stories, the primary action became
  Get started, StoryLite points to `/stories/`, and the 404 page gained consistent Docs and Stories
  access.

## Documentation coverage

- The shared catalog contains 46 canonical examples and 43 component references. All 46 examples
  have static preview routes and stable StoryLite deep links.
- Documentation validation covers 18 public custom elements and 37 component CSS exports. It rejects
  missing pages, missing examples, duplicate stable IDs, unknown elements, unknown CSS entrypoints,
  and invalid documented imports.
- The launch set includes overview, installation, quick start, browser support, CSS and registration
  guidance, package entrypoints, six framework guides, concepts, component references, and public
  API conventions.
- Component pages render Custom Elements Manifest attributes, properties, methods, and events. They
  also include extracted CSS variables and state selectors, anatomy, accessibility, progressive
  enhancement, fallback behavior, canonical source, and StoryLite links.
- The accessibility page records automated WCAG 2.2 A and AA evidence without claiming complete
  conformance.

## Deployment verification

- `pnpm build:site` produced 106 Astro pages plus StoryLite in `dist-site/`. The artifact contains
  `index.html`, `404.html`, `docs/`, `stories/`, `_astro/`, and `assets/`.
- The composition step fails for missing required entrypoints, file collisions, an incorrect
  StoryLite base, or broken generated root-relative internal links.
- GitHub Pages uploads `dist-site/`, matching the Docker deployment input.
- nginx is configured for clean directory URLs, a custom HTTP 404, permanent `/ui` and `/ui/`
  redirects to `/stories/`, immutable caching only for content-hashed assets, non-cacheable HTML,
  existing compression, and existing security headers. It has no SPA fallback.
- The composed artifact browser suite passed all 6 route checks for `/`, `/docs/`, a documentation
  preview, `/stories/`, a StoryLite deep link, and `/404.html`, with no console errors or missing
  assets.
- A local Docker and nginx runtime check was not possible because the Docker daemon socket was
  unavailable and no standalone nginx binary was installed.

## Validation results

- Formatting passed for 371 files, and `git diff --check` passed.
- Monorepo type checking passed with zero Astro errors, warnings, or hints.
- Unit tests passed: 30 core tests, 95 component tests, and 6 StoryLite tests.
- Package builds, manifest validation, export validation, dependency boundaries, generated-file
  freshness, generated DOM policy, component performance budgets, and strict `publint` passed.
- Shared-example validation passed for 46 examples. Documentation coverage passed for 46 examples,
  18 custom elements, and 37 CSS exports.
- Astro, Starlight, StoryLite, and composite artifact builds passed.
- The StoryLite Chromium suite passed 217 tests across a generated 87-route catalog. The Firefox and
  WebKit matrix passed 8 tests.
- The website and documentation Chromium suite passed 4 tests covering navigation, skip links,
  previews, copy and theme controls, StoryLite deep links, light and dark axe checks, and the
  custom 404.
- The final composed artifact suite passed 6 tests.

## Remaining manual review

- Decide whether byte-identical CSS, matching geometry, and sub-1-percent antialiasing differences
  satisfy the parity gate, or recapture a new approved visual baseline in the deployment browser.
- Start the production Docker image, run `nginx -t`, and verify `/`, `/docs/`, `/stories/`, `/ui/`,
  `/404.html`, and an unknown route over HTTP when a Docker daemon is available.
- Complete release keyboard, forced-colors, 200-percent zoom, and assistive-technology review. These
  checks remain necessary before making a complete WCAG conformance claim.
