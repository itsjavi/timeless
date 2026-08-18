# Milestone 012 Results

Milestone 012 is complete.

## Shipped

- StoryLite now emits a checked-in catalog with 87 static routes. The Chromium gate runs axe with
  WCAG 2.2 A and AA tags and blocks on every reported violation, regardless of impact label.
- The original 64 affected nodes and three 320 CSS pixel reflow failures were corrected. The final
  run passed 87 axe cases and 87 text-spacing and reflow cases.
- Contrast tokens, checkbox group semantics, hidden Color Picker channels, range target geometry,
  and narrow-screen layout were corrected with native semantics first.
- `UIElement` replays decorated own properties before `connected()` and supplies protected
  `observeParts(enhance)`. Each enhancement receives a renewed realm-owned abort signal, mutation
  bursts coalesce, and reconnects create clean observers and listeners.
- Components with cached Light DOM anatomy now rewire after authored parts are inserted, removed, or
  replaced. Normal enhancement remains attribute-only.

## Browser evidence

The final browser matrix passed all 225 tests. Chromium passed the full 174-case route gate plus the
existing collection, color-control, overlay, contract, no-JavaScript, and performance suites.
Focused native dialog, popover, dynamic Light DOM, and form reset tests passed in Chromium, Firefox,
and WebKit. The WebKit run identified and drove a fix for focus return when `body` remained the
active element after a scripted trigger click.

## Evidence limit

axe and browser automation do not establish WCAG conformance. A release still needs keyboard and
screen reader review with representative browser and assistive technology combinations, plus visual
review for forced colors, zoom, focus obstruction, and reduced motion.
