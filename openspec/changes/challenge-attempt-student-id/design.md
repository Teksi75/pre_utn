# Design: Challenge Attempt Student Identity

## Technical Approach

Keep I-21 inside the existing advanced-practice localStorage adapter. `src/lib/advanced-practice-progress.ts` will read `pre-utn.profiles.v1` through the existing `getActiveStudentId()` helper, stamp every new `ChallengeAttempt` with that active `studentId`, and return a blocked result when no active profile exists. Reads will expose only the active student's challenge attempts for readiness; legacy anonymous attempts remain parseable and preserved, but excluded from student readiness unless a future explicit recovery flow assigns them.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Active identity source | Import `getActiveStudentId` from `src/lib/student-profile-storage.ts`. | New I-23 adapter boundary / `getActiveProfileId`; Supabase/Auth. | Uses existing local profile/session facilities only and respects the hard boundary. |
| Storage topology | Keep `pre-utn.advanced-practice.v1` and current top-level `{ challengeAttempts, readinessBySkill }`; add `studentId` to new attempts. | Per-student keys; attempt unification with base practice. | Smallest compatible change; existing E2E fixtures and consumers still read the same key/shape. |
| Legacy anonymous data | Preserve anonymous attempts in `challengeAttempts`, parse them as legacy-compatible records, but filter them out of active-student progress/readiness. | Auto-assign anonymous attempts to current active student. | Auto-assignment can leak shared-device history. Preservation avoids data loss; exclusion avoids false readiness. |
| Readiness source | Recompute readiness from active-student attempts on load/write, ignoring persisted legacy `readinessBySkill` values when they could include anonymous or other-student data. | Trust stored readiness map. | Stored maps may be pre-I-21 aggregates; derived readiness is safer and deterministic. |

## Data Flow

```text
ChallengeFlow answer
  └─ addChallengeAttempt(attempt)
       ├─ getActiveStudentId() from profiles.v1
       ├─ missing active profile → { ok:false, reason:"missing-active-profile" }
       ├─ stamp attempt.studentId
       └─ persist advanced store

loadAdvancedProgress()
  └─ parse advanced store → filter studentId === activeStudentId
                       └─ anonymous legacy records preserved in storage, excluded from readiness
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/advanced-practice-progress.ts` | Modify | Add required `studentId` for new `ChallengeAttempt`s, legacy parser compatibility, active-student filtering, blocked writes, readiness recomputation. |
| `src/lib/__tests__/advanced-practice-progress.test.ts` | Modify | RED tests for stamping, blocked writes, multi-student isolation, legacy anonymous compatibility, corrupt JSON, and idempotent preservation. |
| `src/components/practice/challenges/useChallengeFlow.ts` | Modify | Keep injected adapter contract compatible with blocked result; avoid assuming persistence succeeded. |
| `src/components/practice/challenges/__tests__/useChallengeFlow.test.ts` | Modify | Cover blocked adapter result if hook behavior changes; keep tests adapter-injected, not localStorage-coupled. |
| `tests/e2e/fixtures/advanced-practice.ts` | Modify | Fixture builder may accept `studentId` for seeded attempts while still allowing legacy anonymous fixtures. |

## Interfaces / Contracts

```ts
export interface ChallengeAttempt {
  readonly studentId: string;
  readonly exerciseId: string;
  readonly skillId: SkillId;
  readonly correct: boolean;
  readonly answeredAt: string;
  readonly timeMs: number;
  readonly attemptIndex: number;
}

type ChallengePersistenceResult =
  | { ok: true; value: AdvancedPracticeProgress }
  | { ok: false; reason: "missing-active-profile" | "storage-error" };
```

Internally, parsing should allow `studentId` to be absent for legacy records. Public active reads return `AdvancedPracticeProgress` for the active profile only. If no active profile exists, load returns empty progress and writes return `missing-active-profile`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Adapter unit | New attempts stamped from `profiles.v1`; no active profile blocks and writes nothing. | TDD in `src/lib/__tests__/advanced-practice-progress.test.ts` with existing localStorage mock. |
| Migration/read compatibility | Legacy anonymous payload parses, remains stored, and does not contribute to active readiness. Re-running load is idempotent. | Seed raw `pre-utn.advanced-practice.v1`, load for active students, inspect persisted JSON. |
| Integration-light | Challenge hook handles injected blocked result without adding Supabase/profile-boundary coupling. | Existing source/pure hook tests; no E2E required for I-21 unless fixtures break. |

## Migration / Rollout

No destructive migration and no key rename. On read, normalize in memory; on write, persist only the appended stamped attempt plus preserved existing records. Do not delete anonymous attempts, do not silently assign them to a profile, and do not trust old `readinessBySkill` for active-student readiness. Rollback is safe: reverting code leaves the same `pre-utn.advanced-practice.v1` JSON with extra `studentId` fields that older code ignores.

## Open Questions

- [ ] None blocking.
