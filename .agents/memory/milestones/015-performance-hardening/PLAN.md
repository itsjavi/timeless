---
status: Implemented
---

# Milestone 015: Performance and Hardening

## Objective

Enforce deterministic registration and identifiers, stable browser testing, bounded DOM and mutation
costs, and per-element dependency isolation.

## Scope

- Make duplicate registration idempotent for one constructor and explicit for conflicts.
- Allocate generated identifiers per document and verify cross-realm isolation.
- Add a deterministic animation-settling browser helper.
- Check in DOM, mutation, layout-read, layout-shift, and bundle baselines with a 10 percent budget.
- Enforce zero generated visual nodes during normal enhancement, except the Toast helper.
- Enforce paging or virtualization and direct option nodes in the synthetic dataset fixture.
- Prove one-element imports do not load unrelated heavy components.

## Constraints

- Baseline updates require an explicit justification beside the changed metric.
- Performance tests must await observable settling conditions, not fixed sleeps.
- Measurements run against production builds with deterministic fixture data.

## Acceptance criteria

- Aggregate and per-element define paths share identical registration behavior.
- Generated IDs do not collide within a document and remain isolated across realms.
- The readiness fixture stays within its fixed DOM and mutation budgets with zero layout shift.
- Representative metrics fail above 110 percent of their checked-in baseline.
- A single-element import has no dependency path to unrelated element modules.
