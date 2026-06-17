# Design: Challenge Exercises

## Technical Approach

Challenges live in a **parallel module tree** (`src/domain/catalog/challenges/`) that the base practice flow never imports. The only coupling point is a visual extension at the `complete` phase: `PracticeCompletePhase` renders `<ChallengeOptInBlock />` when challenges exist for the completed skill. The advanced progress store (`src/lib/advanced-practice-progress.ts`) is a separate localStorage key that base progress never reads.

**Pilot skills:** `mat.u1.complejos`, `mat.u1.valor_absoluto`, `mat.u2.ecuaciones_fraccionarias`

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Challenge storage | Separate JSON files `content/matematica/challenges/unit-{N}.json` | Reuse exercises.json with marker field | Zero coupling to base catalog; rollback = delete files |
| Advanced progress key | `pre-utn.advanced.v1` in localStorage | Extend `PracticeProgress` interface | Base progress schema untouched; independent lifecycle |
| Flow coupling | Render `<ChallengeOptInBlock />` inside `PracticeCompletePhase` | New phase in `PracticePhase` union | Adding a phase to the union changes the state machine contract; a component-level opt-in keeps the phase machine identical |
| Challenge loader location | `src/domain/catalog/challenges/loader.ts` | Extend `content-loaders.ts` | Self-contained module; `content-loaders.ts` already has 930 lines |
| SourceUse for challenges | New union `ChallengeSourceUse` | Reuse existing `SourceUse` | Existing values (`adapted`, `reinforcement`, `reference`) don't cover `canonical-source`, `calibrated-from-exam`, `solution-pattern` |
| Readiness scope | Per-skill numeric score, no global | Global cross-skill readiness | Premature to aggregate; per-skill is the pedagogical unit |

## Data Flow

```
Base flow (unchanged):
  select → theory → example → exercise → feedback → recovery → complete
                                                                │
                                              ┌─────────────────┘
                                              ▼
                               PracticeCompletePhase
                                      │
                          has challenges for skill?
                                     / \
                                   yes   no → resetToSelect()
                                    │
                                    ▼
                          ChallengeOptInBlock
                           /              \
                       accept            skip → resetToSelect()
                        │
                        ▼
               challenge exercise → challenge feedback → challenge done
                        │                    │
                        ▼                    ▼
               advanced-practice-progress  (localStorage)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `content/matematica/challenges/unit-1.json` | Create | Challenge exercises for U1 pilot skills |
| `content/matematica/challenges/unit-2.json` | Create | Challenge exercises for U2 pilot skills |
| `src/domain/catalog/challenges/loader.ts` | Create | `loadChallengesForSkill()`, validation, `ChallengeSourceUse` type |
| `src/domain/catalog/challenges/index.ts` | Create | Public API: `queryChallengesBySkill()`, `hasChallengesForSkill()` |
| `src/domain/catalog/challenges/__tests__/loader.test.ts` | Create | Unit tests for loader and validation |
| `src/lib/advanced-practice-progress.ts` | Create | `AdvancedPracticeProgress` schema, `addChallengeAttempt()`, `computeAdvancedReadiness()` |
| `src/lib/__tests__/advanced-practice-progress.test.ts` | Create | Unit tests for advanced progress store |
| `src/components/practice/ChallengeOptInBlock.tsx` | Create | Opt-in card rendered inside complete phase |
| `src/components/practice/ChallengeExercisePhase.tsx` | Create | Challenge exercise renderer (reuses ExercisePhase patterns) |
| `src/components/practice/ChallengeFeedbackPhase.tsx` | Create | Challenge feedback renderer |
| `src/components/practice/ChallengeDonePhase.tsx` | Create | Challenge completion summary |
| `src/app/practice/page.tsx` | Modify | Add challenge sub-flow state in `PracticeCompletePhase` |
| `src/app/practice/usePracticeFlow.ts` | Modify | Add challenge state (`challengePhase`, `challengeExercises`, etc.) |

## Interfaces / Contracts

```ts
// src/domain/catalog/challenges/loader.ts

type ChallengeSourceUse =
  | "canonical-source"
  | "adapted"
  | "calibrated-from-exam"
  | "solution-pattern";

interface ChallengeCanonicalTrace {
  readonly path: string;
  readonly section: string;
  readonly sourceUse: ChallengeSourceUse;
  readonly pedagogicalIntent: string;
}

interface ChallengeExercise {
  readonly id: string;               // ex.u1.desafio.complejos-1
  readonly skillId: SkillId;
  readonly type: ExerciseType;
  readonly difficulty: 4 | 5;        // challenges are always hard
  readonly prompt: string;
  readonly expectedAnswer: string;
  readonly commonErrorTags: readonly string[];
  readonly pedagogicalNote: string;
  readonly category: "desafio";
  readonly tags: readonly ["desafio", "integrador"];
  readonly canonicalTrace: readonly ChallengeCanonicalTrace[]; // REQUIRED, ≥1
  readonly options?: readonly ExerciseOption[];
}
```

```ts
// src/lib/advanced-practice-progress.ts

interface AdvancedPracticeProgress {
  readonly challengeAttempts: readonly ChallengeAttempt[];
  readonly readinessBySkill: Record<SkillId, number | null>; // 0–100 or null
}

interface ChallengeAttempt {
  readonly exerciseId: string;
  readonly skillId: SkillId;
  readonly correct: boolean;
  readonly answeredAt: string;
  readonly timeMs: number;
}
```

## Readiness Formula

```
readinessBySkill[skillId] =
  no challenge attempts → null (state: "not-started")
  with attempts → round(accuracy * 100)
    where accuracy = correct_deduplicated / total_deduplicated
    deduplication: last attempt per exerciseId (same as base)
```

No global cross-skill readiness. No blocking, no gating, no base mastery modification.

## Validation Rules

Every challenge JSON entry MUST pass:
1. `canonicalTrace` array length ≥ 1
2. Every trace has all 4 fields: `path`, `section`, `sourceUse`, `pedagogicalIntent`
3. `sourceUse` ∈ `ChallengeSourceUse` union
4. `category` === `"desafio"`
5. `tags` includes `"desafio"` and `"integrador"`
6. `difficulty` ∈ {4, 5}

Loader throws at parse time if any rule fails (same pattern as `applyExerciseDefaults`).

## .engram Disclaimer

`.engram/` no participa del flujo de intentos de desafío ni de ningún otro flujo de progreso del alumno.

## Rollback Plan

1. Delete `content/matematica/challenges/` directory
2. Delete `src/domain/catalog/challenges/` directory
3. Delete `src/lib/advanced-practice-progress.ts` + tests
4. Delete `src/components/practice/ChallengeOptInBlock.tsx` + children
5. Revert `src/app/practice/page.tsx` — remove challenge rendering in `PracticeCompletePhase`
6. Revert `src/app/practice/usePracticeFlow.ts` — remove challenge state
7. Run `pnpm run test` — base tests must pass (no base import was touched)

## Open Questions

- [ ] Should challenge attempts also persist via the base `addAttempt()` for unified history, or only in the advanced store? Design assumes advanced-only.
- [ ] Should `ChallengeOptInBlock` show challenge count before accepting?
