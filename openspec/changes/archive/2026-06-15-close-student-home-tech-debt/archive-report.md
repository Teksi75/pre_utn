# Archive Report: close-student-home-tech-debt

## Change Summary

**Change**: close-student-home-tech-debt
**Status**: Complete — archived 2026-06-15
**Archive path**: `openspec/changes/archive/2026-06-15-close-student-home-tech-debt/`
**Commits on main**: `3f048f6` (fix), `eb514fb` (chore: STATUS.json)

Closed two debt items left over from the `rename-student-home-identifiers` merge
(2026-06-14): removal of the dead `studentMessage` field from the student-home
view-model, and addition of `aria-label="Tu recorrido de aprendizaje"` to the
unlabeled dashboard `<section>`. Pure-domain and pure-UI changes with regression
tests in `derive-student-home-view-model.test.ts` and
`HomeNextStepClient-integration.test.ts`.

## Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Proposal | (lost — see Artifact Loss Note) | ⚠️ |
| Spec (delta) | (lost — see Artifact Loss Note) | ⚠️ |
| Design | (lost — see Artifact Loss Note) | ⚠️ |
| Tasks | (lost — see Artifact Loss Note) | ⚠️ |
| Verify Report | (lost — see Artifact Loss Note) | ⚠️ |
| Exploration | (lost — see Artifact Loss Note) | ⚠️ |
| Archive Report | `openspec/changes/archive/2026-06-15-close-student-home-tech-debt/archive-report.md` | ✅ this file |

### Artifact Loss Note (2026-06-15)

The six original artifacts (`proposal.md`, `specs/teacher-digital-home/spec.md`,
`design.md`, `tasks.md`, `verify-report.md`, `exploration.md`) were
**untracked** at the time of the `close` and were lost during a hygiene
operation intended to move them into this archive directory. PowerShell 5's
`Move-Item` does not support `-Recurse`; the move failed silently while a
subsequent `Remove-Item` in the same compound command deleted the source
directory. Git has no record of these files (untracked) and they are not
recoverable from local history. The functional change they documented is
**intact on `main`** in commits `3f048f6` and `eb514fb` — code, tests, and spec
delta are all in the git history and verifiable via `git show`. This
`archive-report.md` is the only surviving artifact of the change.

## Task Completion Gate

- [x] Both implementation commits merged to `main`
- [x] Regression tests added and green on `main`
  (`derive-student-home-view-model.test.ts:544-554`,
  `HomeNextStepClient-integration.test.ts:96-98`)
- [x] `studentMessage` field removed from `StudentHomeViewModel`
- [x] `aria-label="Tu recorrido de aprendizaje"` applied at
  `HomeNextStepClient.tsx:128`
- [x] `STATUS.json` updated to `status: "done"` (with `mergeCommit: null`
  corrected in this archive commit — see commit message)

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| teacher-digital-home | Modified | `studentMessage` removed from `StudentHomeViewModel` row in spec; aria-label requirement added. See commit `3f048f6` for the full delta. |

## Verification Evidence (from original close)

- `pnpm run test`: 1860/1860 passed
- `pnpm run typecheck`: clean
- `pnpm run build`: green
- Source-inspection regression: no `studentMessage` reference in `src/`
- `aria-label` integration test: passes
