# Archive Report: u5-01-provisional-retirement

## Change Metadata

| Field | Value |
|---|---|
| Change | `u5-01-provisional-retirement` |
| Archived to | `openspec/changes/archive/2026-07-16-u5-01-provisional-retirement/` |
| Archived on | 2026-07-16 |
| Status | `done` |
| Branch | `null` (was `docs/u5-availability-contract`) |
| Issue | #108 |
| Archive PR Issue | #105 (open) |
| Delivery PR | #104 |
| Merge commit | `19112e89466223df9db73e9003797db108c1ff7f` |
| Reconciliation receipt | `review-67d786e25189d02c` at `bc50c8da99079711daa48ad8f35cd9bc2f52fa87` |

## Gate Results

### Native Review Receipt Gate
- **Result**: ALLOW — reconciliation checkpoint receipt `review-67d786e25189d02c` approved and committed at `bc50c8da99079711daa48ad8f35cd9bc2f52fa87`
- Approved terminal receipt matched final candidate tree, paths digest, policy, ledger, fix delta, independent verification evidence, mode counters, and base relationship

### Task Completion Gate
- **Result**: PASS — `tasks.md` shows 9/9 tasks complete, no unchecked implementation tasks
- All three sections (Static Retirement, Selector Availability, Reconciliation Scope) fully checked
- No stale checkboxes requiring reconciliation

### Verification Gate
- **Result**: PASS WITH WARNINGS — `verify-report.md` at HEAD `96623d79`
- CRITICAL: 0 (blocked archive would be required; none present)
- Warnings: 1 (test count delta −3 vs orchestrator expectation, below project tolerance, all scenarios covered)
- Requirements: 11/11 compliant
- Scenarios: 9/9 compliant
- typecheck: PASS (exit 0)
- build: PASS (exit 0, 11/11 routes)
- tests: 3176/3176 passed (exit 0)

## Spec Sync Summary

| Domain | Canonical Existed Pre-U5-01 | Sync Action | Details |
|---|---|---|---|
| `unit-5-foundation` | Yes (post-retirement contract already canonical) | No sync needed | Canonical `openspec/specs/unit-5-foundation/spec.md` already reflects 5 post-retirement requirements. Delta spec aligns with canonical. |
| `math-skill-model` | Yes | **ADDED** requirement | Added `Provisional U5 Skill and Edge Retirement` requirement with 1 scenario (6 skill IDs, `UNIT_5_SKILLS = []`, exact string equality) |
| `math-exercise-catalog` | Yes | **MODIFIED** requirement | Extended `Catalog Coverage` body with exact 5 placeholder exercise IDs to remove and no-migration constraint |
| `complex-numbers-skill` | Yes | **ADDED** scenario | Appended delta scenario "active prerequisite graph resolves without the polar skill" to existing `Skill Order and Prerequisites` requirement |

### Specs NOT modified (scope exclusions respected)
- `unit-5-foundation/spec.md` — canonical already post-retirement; no further change
- No sync of migrations, sidecars, SQL, persistence adapters, compatibility layers, U5-02, U3, U4, U5-00 archived artifacts, or PDF content

## Archive Contents

All 7 artifacts preserved:

| Artifact | Path | Status |
|---|---|---|
| `proposal.md` | `archive/proposal.md` | ✅ |
| `exploration.md` | `archive/exploration.md` | ✅ |
| `specs/unit-5-foundation/spec.md` | `archive/specs/unit-5-foundation/spec.md` | ✅ |
| `specs/math-skill-model/spec.md` | `archive/specs/math-skill-model/spec.md` | ✅ |
| `specs/math-exercise-catalog/spec.md` | `archive/specs/math-exercise-catalog/spec.md` | ✅ |
| `specs/complex-numbers-skill/spec.md` | `archive/specs/complex-numbers-skill/spec.md` | ✅ |
| `design.md` | `archive/design.md` | ✅ |
| `tasks.md` | `archive/tasks.md` | ✅ (9/9 complete) |
| `verify-report.md` | `archive/verify-report.md` | ✅ (PASS with warnings) |
| `apply-progress.md` | `archive/apply-progress.md` | ✅ |
| `handoff.md` | `archive/handoff.md` | ✅ |

## Operations NOT performed (scope exclusions)

Per explicit orchestrator instruction, the following were **not** done:
- No resurrection of migrations, sidecars, SQL, persistence, or compatibility surface
- No U5-02 work or canonical U5 content additions
- No U3 or U4 changes
- No changes to archived U5-00 artifacts
- No PDF modifications
- No commit, push, PR creation, or merge to main
- Issue #105 left open for archive PR (not closed by this operation)

## STATUS.json Update

```
u5-01-provisional-retirement:
  status:        "done"
  branch:        null
  completedAt:   "2026-07-16"
  issue:         108
  pr:            104
  archiveIssue:  105
  mergedTo:      "main"
  mergeCommit:   "19112e89466223df9db73e9003797db108c1ff7f"
  archive:       "openspec/changes/archive/2026-07-16-u5-01-provisional-retirement/"
```

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived.
All gate conditions passed. No critical blockers. Archive is the audit trail — immutable.
