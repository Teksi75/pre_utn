# Design: U5-01 Provisional Retirement and Selector Availability

## Decision

Keep the completed static retirement and make its empty Unit 5 state safe in `FocusSelector`. The provisional catalog was never practicable for users, so no stored state needs migration or protection.

## Decisions

| Topic | Decision |
|---|---|
| Static retirement | The verified exact 6-skill/5-exercise inventory was removed; `UNIT_5_SKILLS` remains an empty export and the Unit 5 threshold is `0`. |
| Availability | `FocusSelector` derives availability from each unit's live skill count. No per-unit flag exists. |
| Empty unit | Keep it visible as disabled `Unidad N — Próximamente`, with native, ARIA, muted, and cursor semantics. |
| Defensive selection | The change handler clears an unavailable value. |
| Live changes | Per-render catalog, readiness, and effective-selection derivations prevent an empty listbox; a repopulated unit is enabled again. |
| Excluded recovery | No unit URL, stored unit selection, persistence behavior, banner, or external recovery contract. |

## Selector Flow

```text
live UNIT_*_SKILLS -> availability and readiness
selected unit + live count -> effective selection -> listbox gate
unavailable change -> no selection
```

`FocusSelector` owns unit state and only emits a selected skill. Its per-render derivations use the current catalog, so a unit emptied between renders is displayed as unselected without mutating state; when skills return, normal selection works again.

## Completed Evidence

PR #107 (`f9e667f`) implemented the selector correction in three files:

- `FocusSelector.tsx`: live availability, readiness, defensive selection, and effective-selection derivations.
- `FocusSelector.test.tsx`: five rendered cases for disabled U5, ordinary selection, live removal, re-enable with a usable skill, and the pure availability helper.
- `FocusSelector.test.ts`: removed source-inspection assertions superseded by rendered behavior coverage.

## Boundaries

Do not modify U3, U4, U5-02, archived U5-00, canonical U5 content, SQL, persistence, or the existing `?skill=` flow. The historical static-retirement record remains valid; this slice adds only the selector behavior required by its intentionally empty catalog.
