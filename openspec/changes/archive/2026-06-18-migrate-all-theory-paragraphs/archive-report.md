# Archive Report: Migrate All Theory Paragraphs to `bodyParagraphs`

**Change**: migrate-all-theory-paragraphs
**Archived**: 2026-06-18
**Mode**: hybrid (openspec + engram)
**Verification**: PASS WITH WARNINGS — 2096 tests, clean typecheck, clean build

---

## Spec Sync

| Domain | Action | Details |
|--------|--------|---------|
| theory-paragraph-model | Updated — 5 requirements added | Long-Body Selection Criterion, Content Preservation Invariants, Migration Coverage and Drop-Legacy-Body, Verification — Theory Unit Shape and Visual Spot Checks, Out-of-Scope Bodies |

**Delta spec**: `openspec/changes/archive/2026-06-18-migrate-all-theory-paragraphs/specs/theory-paragraph-model/spec.md`
**Main spec**: `openspec/specs/theory-paragraph-model/spec.md`
**Merge type**: ADDED — all 5 requirements appended to existing Requirements section; no existing requirements modified or removed.

---

## Archive Contents

| Artifact | Status |
|----------|--------|
| proposal.md | ✅ |
| specs/theory-paragraph-model/spec.md | ✅ |
| design.md | ✅ |
| tasks.md | ✅ (47 tasks; 45 automated + 2 manual) |
| verify-report.md | ✅ |
| state.yaml | N/A (not present) |

---

## Task Completion Gate — Reconciliation Note

Tasks 5.4 and 5.5 (manual visual spot-checks for U1 conjuntos_numericos and U2 factorizacion) were unchecked in `tasks.md` at archive time.

**Reconciliation basis**: User confirmed manual visual review was completed and approved. Verify-report shows `PASS WITH WARNINGS` with no CRITICAL issues and explicitly notes tasks 5.4/5.5 were pending manual execution. Orchestrator context confirms automated verification fully passed.

**Resolution**: Tasks 5.4 and 5.5 marked reconciled-complete in this archive record. The tasks artifact reflects the as-built state (45 automated tasks checked, 2 manual spot-checks user-approved). This is exceptional mechanical reconciliation per SDD archive policy — normal checkbox completion is owned by `sdd-apply`.

---

## Changed Files

| File | Change |
|------|--------|
| `openspec/specs/theory-paragraph-model/spec.md` | 5 new requirements appended |
| `openspec/changes/STATUS.json` | `migrate-all-theory-paragraphs` status updated to `done`, `mergedTo: main`, `completedAt: 2026-06-18` |
| `openspec/changes/migrate-all-theory-paragraphs/` | Moved to `openspec/changes/archive/2026-06-18-migrate-all-theory-paragraphs/` |

---

## Delivery Details

- **Diff**: 407 lines (+7 over 400-line budget; SDD docs + test additions drove the overage)
- **De-minimis exception**: Documented and accepted; no chained split performed
- **Review**: Fresh review reported BLOCKER: NONE after fixes
- **Change is on**: `main` (direct merge, no feature branch outstanding)

---

## SDD Cycle Complete

All phases completed: propose → spec → design → tasks → apply → verify → archive.

**Source of truth updated**: `openspec/specs/theory-paragraph-model/spec.md` now includes editorial rules for migrating long-body concepts.

**Next**: Ready for next SDD change.
