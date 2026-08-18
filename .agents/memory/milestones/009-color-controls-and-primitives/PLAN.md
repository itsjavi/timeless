# Milestone 009: Color Controls and Primitives

## Goal

Complete the canonical Timeless component catalog with minimal native markup for Toggle, Toggle
Group, Empty, Meter, Color Swatch, Number Stepper, Range, and Color Picker.

## Approach

- Keep Toggle, Empty, Meter, Color Swatch, and Range CSS-only, using native elements and direct
  anatomy.
- Add behavioral custom elements only for Toggle Group, Number Stepper, and Color Picker.
- Port the Color Picker look from an earlier prototype while reauthoring it for author-owned Light
  DOM, Atmosphere tokens, native events, and Timeless Popover composition.
- Add a dependency-free `@timelessui/components/color` subpath with parsing, serialization,
  conversion, gamut, and contrast utilities informed by the proof of concept and the earlier
  prototype's color engine.
- Add StoryLite documentation, package tests, browser coverage, and repair E2E test discovery.

## Constraints

- Do not add runtime dependencies or import the earlier prototype's packages.
- Do not generate visible component anatomy from JavaScript.
- Keep visual styling in CSS. JavaScript may update semantic state and documented CSS custom
  properties used for measured or computed color values.
- Prefer native semantics and native `input`, `change`, and `click` events over custom events.
- Do not remove the proof-of-concept packages in this milestone.

## Acceptance Criteria

- The package exports and registers the documented APIs without adding a standalone Toggle custom
  element.
- Every interactive control has an accessible name, visible focus, complete keyboard behavior, and a
  usable CSS-free contract.
- Color utilities support the planned CSS color formats, contextual preservation, real Display P3
  conversion, gamut checks, clamping, and WCAG contrast calculation.
- Stories document minimal copyable anatomy and the inline plus popover Color Picker recipes.
- Component tests, StoryLite builds, Playwright discovery and suites, Oxfmt checks, package builds,
  and `git diff --check` pass.
