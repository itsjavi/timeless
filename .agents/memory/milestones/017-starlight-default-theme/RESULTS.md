# Milestone 017 Results

## Summary

The documentation shell now uses Starlight's complete default theme. The custom Timeless docs
stylesheet and its Google font import, warm palettes, display fonts, branded title, focus treatment,
and content overrides were removed. Component preview iframes retain their independent light and
dark canvas styling.

## Decisions and constraints

- The docs shell will use the complete default Starlight theme rather than a replacement custom
  neutral palette.
- Iframe preview styling remains outside the theme reset.
- The preview chrome keeps its local structural styles and consumes Starlight's default variables.
- The existing randomized 404 test now asserts the stable `not found` heading contract instead of a
  single random subject.

## Validation results

- Astro type checking passed for 17 files with zero errors, warnings, or hints.
- Documentation validation passed for 46 examples, 18 elements, and 37 CSS exports.
- The Astro and Starlight production build generated 106 pages and completed its Pagefind index.
- Generated documentation contains no Google Fonts URL, Yellowtail, Cooper Black, or removed warm
  background color reference.
- The focused Chromium suite passed all 4 tests. It verifies default shell fonts, no Google Fonts
  request, light and dark backgrounds, accessibility, overflow, iframe content, and iframe theme
  switching.
- Light and dark screenshots were inspected at 1440 by 1000. Both use the default Starlight shell,
  and the settled iframe content remains unchanged in both modes.
- Formatting and diff hygiene checks passed after the milestone files and browser test were
  formatted.

## Remaining manual review

None for this milestone.
