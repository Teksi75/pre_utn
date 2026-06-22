# Tasks: Challenge Attempt Student Identity

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250–350 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-forecast |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Rationale: one bounded concern (advanced-practice localStorage adapter), same shape/topology, no adapter boundary, no remote/Supabase.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Student-scoped storage + isolation + hook compat + fixture | PR 1 | Base = main; tests with behavior; rollback-safe (additive `studentId`) |

## Phase 1: RED — `src/lib/__tests__/advanced-practice-progress.test.ts`

- [x] 1.1 `addChallengeAttempt` persists with `studentId === getActiveStudentId()` (profile seeded via `pre-utn.profiles.v1`).
- [x] 1.2 No active profile → `{ ok:false, reason:"missing-active-profile" }`; `pre-utn.advanced-practice.v1` untouched.
- [x] 1.3 Legacy anonymous attempts (no `studentId`) load without throwing; remain in `challengeAttempts`.
- [x] 1.4 `loadAdvancedProgress` filters to `studentId === activeStudentId`; anonymous + other-student excluded.
- [x] 1.5 `computeAdvancedReadiness` ignores cross-student + anonymous — A active, mixed A/B/legacy → readiness reflects A only.
- [x] 1.6 `setItem` throws (mock quota) → `{ ok:false, reason:"storage-error" }`, no partial write.
- [x] 1.7 Idempotency: re-loading after blocked write is no-op; after successful write preserves stamped attempts verbatim.

## Phase 2: GREEN — `src/lib/advanced-practice-progress.ts`

- [x] 2.1 Add `readonly studentId: string` to `ChallengeAttempt`; parser accepts legacy records with optional `studentId`.
- [x] 2.2 Import `getActiveStudentId` from `src/lib/student-profile-storage`; gate `addChallengeAttempt` on active profile.
- [x] 2.3 Stamp active id on writes; on read, filter `challengeAttempts` to active id; recompute `readinessBySkill` from filtered slice; preserve legacy rows in persisted JSON.
- [x] 2.4 Return type `ChallengePersistenceResult` union: `missing-active-profile | storage-error`.

## Phase 3: Hook compatibility — `src/components/practice/challenges/`

- [x] 3.1 RED: `useChallengeFlow` advances exercise → feedback even when injected `addChallengeAttempt` returns a blocked result.
- [x] 3.2 GREEN: align injected signature in `useChallengeFlow.ts` with `ChallengePersistenceResult`; no behavior change otherwise.

## Phase 4: Fixture + verification

- [x] 4.1 Update `tests/e2e/fixtures/advanced-practice.ts`: builder accepts optional `studentId` per attempt; legacy anonymous fixtures still build.
- [x] 4.2 RED: legacy anonymous fixture round-trips through parser without data loss.
- [x] 4.3 Gates: `pnpm run test`, `pnpm run typecheck`, `pnpm run build`.
- [x] 4.4 Rollback smoke: replay persisted JSON through old code — extra `studentId` ignored, no crash.

## Critical Fix: Stale readinessBySkill isolation

**Found during reliability review.** `loadAdvancedProgress()` returned persisted `readinessBySkill` unchanged, and `addChallengeAttempt()` spread the old map then only recomputed the affected skill. Both leaked stale cross-student or anonymous readiness entries.

### Fix

- Extracted `recomputeAllReadiness()` pure helper that derives `readinessBySkill` from a filtered attempts slice.
- `loadAdvancedProgress()` now calls `recomputeAllReadiness(filtered)` instead of returning `progress.readinessBySkill`.
- `addChallengeAttempt()` now calls `recomputeAllReadiness(activeStudentAttempts)` instead of spreading `parsed?.readinessBySkill`.
- Updated existing test "tolerates null values in readinessBySkill" to match corrected behavior (no attempts → no entry).

### TDD Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| Critical fix | `src/lib/__tests__/advanced-practice-progress.test.ts` | Unit | ✅ 30/30 | ✅ 5 tests written | ✅ 35/35 | ✅ 5 cases | ✅ Extracted pure helper |
