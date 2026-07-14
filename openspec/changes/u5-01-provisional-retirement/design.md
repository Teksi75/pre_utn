# Design: Provisional Unit 5 Static Retirement

## Decision

U5-01 is a static repository retirement. The provisional Unit 5 catalog was never practicable for users, so there is no persisted user state to migrate or protect.

## Retirement Boundary

| Topic | Decision |
|---|---|
| Matching | Use the verified exact 6-skill/5-exercise inventory when removing static references. Do not use prefixes or broad Unit 5 matching. |
| Catalog | Remove the six provisional skills and related active edges; retain an intentionally empty Unit 5 state. |
| Content | Remove the five placeholder exercise objects and obsolete provisional taxonomy/reference material. |
| Contracts | Update active specifications and tests to describe the static empty-state contract. |
| Persistence | No local or remote data migration, sidecar, marker, SQL, write gate, adapter change, or blocking behavior. |

## Retained Inventory

The source-grounded inventory in `exploration.md` is the review reference for the exact six skills, five exercises, active-reference locations, synthetic near-misses, and excluded areas. It is not a migration design.

## Explicitly Discarded Designs

The following earlier proposals are invalid and must not be revived by U5-01 work:

- Per-student local sidecars or completion markers.
- Local write gates, pending/failed states, visible persistence blocking, or persistence return-type changes.
- Remote version columns, SQL migrations, JSONB transforms, adapter marker checks, or upsert changes.
- Retry, crash, parity, backup, restoration, or reused-ID protection contracts tied to data migration.

## Verification Strategy

Verify only static repository retirement: exact inventory removal, intended Unit 5 empty-state behavior, active specification consistency, documentation/reference cleanup, and affected test retirement or replacement. Product persistence behavior is outside this change.

## Exclusions

Do not modify U3, U5-02, archived U5-00, canonical U5 content, SQL, persistence, or product behavior.
