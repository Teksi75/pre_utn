# Proposal: Challenge Attempt Student Identity

## Intent

Challenge attempts are anonymous in `pre-utn.advanced-practice.v1`, so advanced readiness can mix local students. This closes roadmap I-21: every new challenge attempt belongs to the active student while preserving existing data. Relevant foundation: `docs/sdd/13-adr-foundation.md` adapter discipline and local-first persistence.

## Scope

### In Scope
- Add `studentId` to `ChallengeAttempt` and persist it for every new challenge attempt.
- Migrate/read legacy anonymous challenge data so local progress remains loadable.
- Filter advanced readiness/progress by active student to prevent cross-student leakage.
- Add tests before implementation for storage/domain-adjacent behavior.

### Out of Scope
- I-23 adapter boundary / `getActiveProfileId` extraction.
- Supabase adapter, Auth, RLS, or remote sync.
- Adding `trackId` / `subjectId` or unifying attempt models.
- UI redesign, new challenge content, or changing base practice mastery.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `challenge-exercises`: challenge attempt persistence becomes student-scoped; legacy anonymous data remains readable without readiness leaks.
- `student-local-identity`: anonymous-attempt prohibition extends to challenge attempts.

## Approach

Keep I-21 small. Update advanced practice storage around `ChallengeAttempt`, using existing local profile state to stamp new attempts. Implement idempotent legacy handling: anonymous attempts remain loadable and active-student reads never aggregate another student’s attempts. TDD applies before code for storage, legacy behavior, blocked writes, and readiness filtering.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/advanced-practice-progress.ts` | Modified | Add `studentId`, block anonymous writes, migrate/filter legacy. |
| `src/lib/__tests__/advanced-practice-progress.test.ts` | Modified | RED tests for identity, legacy migration, and cross-student isolation. |
| `openspec/specs/challenge-exercises/spec.md` | Modified | Delta spec will require student-scoped challenge attempts. |
| `openspec/specs/student-local-identity/spec.md` | Modified | Delta spec will extend no-anonymous-attempts coverage. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Legacy challenge data appears lost | Med | Preserve loadability via idempotent migration/read compatibility. |
| Readiness leaks across profiles | Med | Filter computations by active `studentId`; add regression tests. |
| Scope creep into I-23/I-24 | Low | Keep direct local profile read if needed; defer boundary/Supabase. |

## Rollback Plan

Revert this change’s code and delta specs. Existing anonymous data remains in the same storage key; no destructive migration is allowed.

## Dependencies

- Operative roadmap: `docs/strategy/roadmap-ingenium-agentico.md` I-21.
- Existing local identity storage: `pre-utn.profiles.v1`.

## Success Criteria

- [ ] No new challenge attempt is recorded without an active student.
- [ ] New challenge attempts include `studentId`.
- [ ] Legacy anonymous challenge data remains loadable.
- [ ] Advanced readiness/progress does not leak across students.
- [ ] PR stays within review budget (size:exception approved by maintainer — actual diff exceeds 400 lines due to critical readinessBySkill isolation fix).
