# Tasks: U5-01 Provisional Retirement and Selector Availability

## Delivery Record

| Item | Record |
|---|---|
| Static retirement | Completed before this reconciliation. |
| Selector correction | Merged in PR #107, commit `f9e667f`. |
| Tests | Five rendered `FocusSelector.test.tsx` cases replace the retired source-inspection file. |
| Verification report | Completed by the independent verification report. |

## Completed Static Retirement

- [x] Retire the exact six provisional skills, five placeholder exercises, dependency edges, taxonomy tags, and pedagogy references.
- [x] Retain empty `UNIT_5_SKILLS`, set the Unit 5 threshold to `0`, and update affected canonical specs and tests.
- [x] Keep synthetic diagnostic fixtures test-only; leave persistence, SQL, U5-02, and archived U5-00 unchanged, and preserve U3/U4 product behavior, content, and contracts. The U3-named taxonomy test changes only remove its obsolete cross-U5 assertion.

## Completed Selector Availability

- [x] Replace source-inspection tests with rendered tests for disabled empty-unit semantics and ordinary populated-unit selection.
- [x] Derive availability from live skill count; show disabled, accessible `Próximamente` options and reject unavailable programmatic values.
- [x] Recompute catalog readiness per render so a newly added accessible skill is enabled and selectable.
- [x] Derive effective selection so live removal renders no empty listbox and live restoration re-enables the unit.

## Reconciliation Scope

- [x] Align canonical and delta Unit 5 contracts, design, tasks, and apply progress with PR #107.
- [x] Run independent verification and add its report before archive issue #105 proceeds. Evidence: `verify-report.md` records passing tests, typecheck, build, and the 11/11-requirement, 9/9-scenario compliance matrix at `96623d79`.

Do not add a unit URL, stored unit selection, persistence behavior, banner, aliases, canonical U5 content, U3/U4 changes, U5-02 work, or a state setter for live removal.
