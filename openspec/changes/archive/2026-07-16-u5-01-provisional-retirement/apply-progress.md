# U5-01 Apply Progress

## Outcome

U5-01 completed the static retirement of unused provisional Unit 5 artifacts. PR #107 (`f9e667f`) then made the resulting empty catalog safe in `FocusSelector`: availability is derived from live skills, empty units remain visible and disabled as `Próximamente`, and no empty skill listbox is reachable.

## Static-Retirement Record

- Retired the exact six provisional skills, five placeholder exercises, two dependency edges, two taxonomy tags, and U5 pedagogy references.
- Preserved `UNIT_5_SKILLS` as an empty export, set the Unit 5 threshold to `0`, and updated affected canonical specs and tests.
- Kept synthetic diagnostic fixtures test-only; did not modify persistence, SQL, U5-02, or archived U5-00. `error-taxonomy-u3.test.ts` changed only to replace its obsolete cross-U5 assertion; U3 product behavior, content, and contracts remain untouched.

## Selector Correction

- The live skill count controls availability; an empty unit is visible, disabled, `aria-disabled`, muted, and labelled `Unidad N — Próximamente`.
- The handler clears unavailable programmatic values.
- Per-render readiness and effective selection handle live removal and re-enable without an empty listbox.
- PR #107 replaced source-inspection tests with five rendered interaction/helper tests.
- No unit URL, stored unit selection, persistence behavior, banner, or external recovery contract was added.

## Reconciliation State

Issue #108 owns this metadata reconciliation. U5-01 remains `in-progress`; archive issue #105 is still pending. `verify-report.md` is intentionally absent from this slice and must be produced by independent verification after reconciliation.
