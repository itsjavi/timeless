---
status: Implemented
---

# Milestone 012: Accessibility and Core Extensibility

## Objective

Establish a route-wide WCAG 2.2 A and AA regression gate, fix the verified StoryLite failures, and
make `UIElement` safe for late upgrade and dynamic author-owned Light DOM.

## Scope

- Scan every generated StoryLite route with Playwright and axe, including interactive states.
- Fix all currently verified axe, target-size, contrast, label, and reflow failures.
- Replay decorated pre-upgrade properties before component connection logic.
- Add protected coalesced Light DOM observation with renewable scoped listeners.
- Verify reconnection and owner-window behavior without introducing generated visual anatomy.

## Constraints

- Axe is a regression tool, not a WCAG conformance claim.
- Native semantics, keyboard tests, focus checks, reflow, text spacing, forced colors, and reduced
  motion remain explicit checks.
- Core stays visual-free and framework-agnostic.

## Acceptance criteria

- Every generated StoryLite route passes WCAG 2.2 A and AA axe rules in applicable states.
- The three known 320 CSS pixel reflow failures are fixed.
- Decorated properties assigned before definition replay exactly once before `connected()`.
- `observeParts()` coalesces mutations, aborts stale scoped work, reconnects safely, and uses the
  element owner realm.
- Dynamic anatomy refreshes do not add visual nodes or perform unchanged writes.
