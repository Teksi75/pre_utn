## Verification Report

**Change**: challenge-exercises
**Version**: N/A (delta spec)
**Mode**: Standard

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 22 |
| Tasks complete | 16 (checked) / 22 (implemented) |
| Tasks incomplete (unchecked) | 6 (Phase 3: 3 tasks, Phase 5: 3 tasks) — all implemented but not marked |

### Build & Tests Execution

**Build**: ✅ Passed
```
> next build
✓ Compiled successfully in 4.1s
✓ Generating static pages using 9 workers (7/7) in 1262ms
```

**Tests**: ✅ 2041 passed / ❌ 0 failed / ⚠️ 0 skipped
```
122 test files passed
2041 total tests passed
```

**Typecheck**: ✅ Passed (zero errors)

**Coverage**: ➖ Not available (no coverage script configured for this project)

### Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Challenge File Location | challenges load from per-unit file | `loader.test.ts > loadChallengesForSkill loads and returns challenges for a valid skillId` | ✅ COMPLIANT |
| Challenge File Location | challenges loader is structurally isolated | Source audit: no import from `src/domain/catalog/index.ts` | ✅ COMPLIANT |
| Challenge Exercise Schema | standard query excludes challenges | Source audit: loader filters on `challengeSection` | ✅ COMPLIANT |
| Challenge Exercise Schema | challenge query returns only challenges | `loader.test.ts > queryChallengesBySkill returns only challenges for that skillId` | ✅ COMPLIANT |
| Complete canonicalTrace | challenge with complete canonicalTrace passes | `loader.test.ts > validateChallengeEntry valid entry passes validation` | ✅ COMPLIANT |
| Complete canonicalTrace | challenge with missing canonicalTrace field is rejected | `loader.test.ts > rejects canonicalTrace entry missing 'path'/'section'/'sourceUse'/'pedagogicalIntent'` | ✅ COMPLIANT |
| Complete canonicalTrace | challenge with unknown sourceUse is rejected | `loader.test.ts > rejects unknown sourceUse value` | ✅ COMPLIANT |
| Pilot Skills | pilot challenges exist for the three declared skills | `loader.test.ts > loadChallengesForSkill loads... for each pilot skill` (2+ each) | ✅ COMPLIANT |
| Advanced Store Module | advanced store is keyed separately | `advanced-practice-progress.test.ts > does NOT read or write pre-utn.practice.v1` | ✅ COMPLIANT |
| Advanced Store Module | deleting the advanced store does not affect base progress | `advanced-practice-progress.test.ts > uses separate versioned key from base practice` | ✅ COMPLIANT |
| Challenge Attempt API | challenge attempt is recorded | `advanced-practice-progress.test.ts > addChallengeAttempt appends a challenge attempt to the store` | ✅ COMPLIANT |
| Per-Skill Numeric Readiness | no attempts → null score | `advanced-practice-progress.test.ts > computeAdvancedReadiness returns null when no attempts exist for the skill` | ✅ COMPLIANT |
| Per-Skill Numeric Readiness | attempts exist → numeric score | `advanced-practice-progress.test.ts > computeAdvancedReadiness returns rounded accuracy percentage` | ✅ COMPLIANT |
| No Global or Blocking Effects | base mastery ignores challenge performance | Source audit: `computeMasteryLevel` never reads advanced store | ✅ COMPLIANT |
| No Global or Blocking Effects | challenge failures do not regress base mastery | Source audit: `addChallengeAttempt` writes only to `pre-utn.advanced-practice.v1` | ✅ COMPLIANT |
| ChallengeOptInBlock | opt-in block is mounted at complete phase | `challenge-integration.test.ts > renders ChallengeFlow when skill has challenges` | ✅ COMPLIANT |
| ChallengeOptInBlock | opt-in block is hidden when no challenges exist | `challenge-integration.test.ts > renders PracticeCompletePhase when skill has NO challenges` | ✅ COMPLIANT |
| Neutral Copy | (spec) — no tutor voice, no personalization | `ChallengeOptInBlock.test.ts > copy is neutral (no tutor voice)` + `ChallengeDoneSummary.test.ts` | ✅ COMPLIANT |
| Visual Extension Point | user accepts the challenge (opt-in → exercise) | `useChallengeFlow.test.ts > startChallenges transitions from opt-in to exercise` | ✅ COMPLIANT |
| Visual Extension Point | user skips the challenge (skip → done) | `useChallengeFlow.test.ts > skipChallenges transitions from opt-in to done` | ✅ COMPLIANT |
| Visual Extension Point | base phase machine is unchanged | `challenge-integration.test.ts > page does not add challenges phase to PracticePhase union` | ✅ COMPLIANT |
| Skill Completion | skill completion is driven by standard exercises only | Source audit: `phases.ts` has no "challenges" member | ✅ COMPLIANT |
| .engram/ Disclaimer | challenge attempts do not touch engram | Source audit: no `engram` import in challenge modules | ✅ COMPLIANT |
| Rollback | full rollback preserves base progress | Source audit: base modules never import challenge modules | ✅ COMPLIANT |
| Rollback | full rollback does not break existing practice tests | 2041 tests pass including all pre-existing tests | ✅ COMPLIANT |

**Compliance summary**: 25/25 scenarios compliant

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| Challenge JSON (unit-1.json) | ✅ Implemented | 4 challenges: 2 complejos, 2 valor_absoluto |
| Challenge JSON (unit-2.json) | ✅ Implemented | 2 challenges: 2 ecuaciones_fraccionarias |
| 6 pilot challenges total | ✅ Implemented | 4 (U1) + 2 (U2) = 6 |
| canonicalTrace ≥1 per entry | ✅ Implemented | All 6 entries have 1 or 2 trace entries |
| 4 fields per trace | ✅ Implemented | path, section, sourceUse, pedagogicalIntent all present |
| sourceUse ∈ controlled values | ✅ Implemented | Only canonical-source, calibrated-from-exam, solution-pattern used |
| challengeSection: true | ✅ Implemented | All entries |
| category: "desafio" | ✅ Implemented | All entries |
| tags include "desafio" + "integrador" | ✅ Implemented | All entries |
| difficulty ∈ {4, 5} | ✅ Implemented | All entries are 4 |
| Loader validation | ✅ Implemented | `validateChallengeEntry()` rejects all malformed variants |
| Advanced store key | ✅ Implemented | `pre-utn.advanced-practice.v1` |
| addChallengeAttempt() | ✅ Implemented | Records attempt + recomputes readiness |
| loadAdvancedProgress() | ✅ Implemented | Tolerates corrupt/empty storage |
| computeAdvancedReadiness() | ✅ Implemented | null → no attempts, 0–100 → with attempts |
| Deduplication (last per exerciseId) | ✅ Implemented | Same pattern as base progress |
| ChallengeOptInBlock rendered at complete | ✅ Implemented | Conditional on `hasChallengesForSkill()` |
| ChallengeFlow state machine | ✅ Implemented | opt-in → exercise → feedback → (next exercise | done) |
| ChallengeExerciseCard | ✅ Implemented | Badges, counter, prompt, answer input |
| ChallengeFeedback | ✅ Implemented | Correct/incorrect + pedagogical note |
| ChallengeDoneSummary | ✅ Implemented | Score display + "Volver al selector" |
| PracticePhase union unchanged | ✅ Implemented | No "challenges" member |
| Base flow unmodified | ✅ Implemented | `usePracticeFlow.ts` imports only `@/lib/practice-progress` |
| No base import from challenge modules | ✅ Implemented | No cross-imports found |

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| Separate JSON files per unit | ✅ Yes | `content/matematica/challenges/unit-{1,2}.json` |
| Advanced progress key `pre-utn.advanced-practice.v1` (design says `pre-utn.advanced.v1`) | ⚠️ Minor deviation | Implementation uses `pre-utn.advanced-practice.v1` (design said `pre-utn.advanced.v1`). The implementation's longer key is more consistent with base key naming (`pre-utn.practice.v1`). Acceptable variation. |
| Flow coupling: render inside PracticeCompletePhase | ✅ Yes | `<ChallengeFlow />` inside `phase === "complete"` block |
| Challenge loader location: `src/domain/catalog/challenges/` | ✅ Yes | Self-contained module |
| ChallengeSourceUse union | ✅ Yes | 4 values: canonical-source, adapted, calibrated-from-exam, solution-pattern |
| Readiness scope: per-skill numeric, no global | ✅ Yes | `readinessBySkill: Record<SkillId, number \| null>` |
| ChallengeExercise interface with `challengeSection: true` | ✅ Yes | Types match design contract |
| Rollback plan documented | ✅ Yes | 7-step plan in design.md |
| UI encapsulated in `src/components/practice/challenges/` | ✅ Yes | 6 files: OptInBlock, Flow, ExerciseCard, Feedback, DoneSummary, useChallengeFlow |
| Visual integration only in page.tsx | ✅ Yes | Only `src/app/practice/page.tsx` imports from challenge modules |
| .engram disclaimer honored | ✅ Yes | No .engram references in challenge code |

### Issues Found

**CRITICAL**: None

**WARNING**:
1. **Tasks tracking incomplete**: Phase 3 tasks (3.1, 3.2, 3.3) and Phase 5 tasks (5.1, 5.2, 5.3) are all implemented but not checked off in `tasks.md`. Update the checkbox state.
2. **Advanced readiness not propagated to UI**: `computeAdvancedReadiness()` works correctly and `addChallengeAttempt()` persists scores to localStorage. However, `ChallengeFlow` never reads the computed readiness back from the store to display it in `ChallengeDoneSummary`. The `state.advancedReadiness` field in `useChallengeFlow` remains `null` throughout the entire flow because `onNext` only loads progress from the store but never sets it on state. Result: the "Nivel de preparación en desafíos" section in `ChallengeDoneSummary` is always hidden (conditional `advancedReadiness !== null` never triggers). The data layer is correct; the UI propagation needs wiring.

**SUGGESTION**:
1. **timeMs not tracked**: `ChallengeFlow` passes `timeMs: 0` when creating `ChallengeAttempt`. The comment says "Time tracking not implemented in this PR". Add a `startTime` ref to track elapsed time per exercise.
2. **attemptIndex always 1**: `useChallengeFlow.onAnswer` hardcodes `attemptIndex: 1` for every attempt. The `ChallengeAttempt` interface has `attemptIndex` for tie-breaking (per design), but the hook never increments it on retries. Currently not an issue since there's no explicit retry mechanism in the challenge flow, but worth noting for future retry support.
3. **Storage key name divergence**: Design says `pre-utn.advanced.v1`, implementation uses `pre-utn.advanced-practice.v1`. The implementation's name is arguably better (consistent with `pre-utn.practice.v1`), but the design should be updated for consistency.
4. **ChallengeFeedback `exerciseId` prop unused**: The `exerciseId` prop is declared in the interface but not rendered in any user-visible element. Remove or add to aria attributes for accessibility.

### Verdict

**PASS WITH WARNINGS**

The implementation is structurally sound, all specs are met at the data/contract layer, all 2041 tests pass (including 122 test files with 0 failures), typecheck and build are clean, and rollback isolation is verified. The only meaningful issue is the readiness score propagation gap in the ChallengeFlow UI — the data is correctly computed and persisted, but not displayed. This is a WARNING rather than CRITICAL because the readiness metric is visible in localStorage (available for future consumption) and the ChallengeDoneSummary gracefully degrades by hiding the section rather than showing incorrect data.

### Recommendation

**Merge** after fixing the WARNING (advanced readiness UI propagation). The other SUGGESTION items can be addressed in a follow-up PR.

### Modified Files Summary

| File | Status | Lines |
|------|--------|-------|
| `content/matematica/challenges/unit-1.json` | Created | 160 |
| `content/matematica/challenges/unit-2.json` | Created | 82 |
| `src/domain/catalog/challenges/types.ts` | Created | 70 |
| `src/domain/catalog/challenges/loader.ts` | Created | 212 |
| `src/domain/catalog/challenges/index.ts` | Created | 52 |
| `src/domain/catalog/challenges/__tests__/loader.test.ts` | Created | 348 |
| `src/lib/advanced-practice-progress.ts` | Created | 188 |
| `src/lib/__tests__/advanced-practice-progress.test.ts` | Created | 323 |
| `src/components/practice/challenges/ChallengeOptInBlock.tsx` | Created | 55 |
| `src/components/practice/challenges/ChallengeFlow.tsx` | Created | 123 |
| `src/components/practice/challenges/useChallengeFlow.ts` | Created | 236 |
| `src/components/practice/challenges/ChallengeExerciseCard.tsx` | Created | 84 |
| `src/components/practice/challenges/ChallengeFeedback.tsx` | Created | 80 |
| `src/components/practice/challenges/ChallengeDoneSummary.tsx` | Created | 82 |
| `src/components/practice/challenges/__tests__/ChallengeOptInBlock.test.ts` | Created | 88 |
| `src/components/practice/challenges/__tests__/ChallengeDoneSummary.test.ts` | Created | 84 |
| `src/components/practice/challenges/__tests__/ChallengeExerciseCard.test.ts` | Created | ~50 |
| `src/components/practice/challenges/__tests__/ChallengeFeedback.test.ts` | Created | ~50 |
| `src/components/practice/challenges/__tests__/useChallengeFlow.test.ts` | Created | 403 |
| `src/app/practice/page.tsx` | Modified | +16 lines (ChallengeFlow import + conditional rendering) |
| `src/app/practice/__tests__/challenge-integration.test.ts` | Created | 175 |
| **Total** | **21 files** | **~2,860 lines** |
