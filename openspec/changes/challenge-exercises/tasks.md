# Tasks: Challenge Exercises

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900–1100 (15 new files + 2 modified) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 4 stacked PRs: data layer → loader → UI → integration |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Advanced store types + schema + addChallengeAttempt + loadAdvancedProgress | PR 1 | Base for all later units; isolated from catalog |
| 2 | Challenge loader + queryChallengesBySkill + hasChallengesForSkill + validation | PR 2 | Depends on PR 1 types |
| 3 | Challenge JSON content (U1 + U2) for pilot skills | PR 3 | Content-only; validates against PR 2 loader schema |
| 4 | ChallengeOptInBlock + ChallengeExercisePhase + ChallengeFeedbackPhase + ChallengeDonePhase | PR 4 | Depends on PR 1+2; standalone UI module |
| 5 | Integration: mount ChallengeOptInBlock in practice/page.tsx complete phase + useChallengeFlow | PR 5 | Depends on PR 1+2+4; final wiring |

---

## Phase 1: Infrastructure (Advanced Store)

- [x] 1.1 Define `ChallengeSourceUse` union type in `src/domain/catalog/challenges/types.ts`
- [x] 1.2 Define `ChallengeCanonicalTrace` interface (4 fields: path, section, sourceUse, pedagogicalIntent)
- [x] 1.3 Define `ChallengeExercise` interface extending base Exercise with `challengeSection: true`, `category: "desafio"`, `tags: ["desafio", "integrador"]`, `canonicalTrace: readonly ChallengeCanonicalTrace[]`
- [x] 1.4 Create `src/lib/advanced-practice-progress.ts` with `AdvancedPracticeProgress` schema, `ChallengeAttempt` interface, `addChallengeAttempt()`, `loadAdvancedProgress()`, `computeAdvancedReadiness()` — separate localStorage key `pre-utn.advanced-practice.v1`
- [x] 1.5 Write RED test: `src/lib/__tests__/advanced-practice-progress.test.ts` — test addChallengeAttempt records attempt, test loadAdvancedProgress returns it, test readiness null when no attempts, test readiness score when attempts exist (accuracy formula)
- [x] 1.6 GREEN: implement advanced-practice-progress.ts to pass tests

---

## Phase 2: Challenge Catalog Loader

- [x] 2.1 Create `src/domain/catalog/challenges/loader.ts` — `loadChallengesForSkill(skillId)`, `validateChallengeEntry()`, `ChallengeSourceUse` type, validation rules (canonicalTrace ≥1, all 4 fields, sourceUse ∈ union, category === "desafio", tags include "desafio" + "integrador", difficulty ∈ {4,5})
- [x] 2.2 Create `src/domain/catalog/challenges/index.ts` — `queryChallengesBySkill()`, `hasChallengesForSkill()`, re-export types
- [x] 2.3 Write RED test: `src/domain/catalog/challenges/__tests__/loader.test.ts` — test loader parses valid JSON, test rejects missing canonicalTrace, test rejects unknown sourceUse, test queryChallengesBySkill returns only challenges, test hasChallengesForSkill returns boolean
- [x] 2.4 GREEN: implement loader.ts and index.ts to pass tests

---

## Phase 3: Challenge Content (Pilot Skills)

- [ ] 3.1 Create `content/matematica/challenges/unit-1.json` — challenges for `mat.u1.complejos` (≥2), `mat.u1.valor_absoluto` (≥2) with valid canonicalTrace per entry
- [ ] 3.2 Create `content/matematica/challenges/unit-2.json` — challenges for `mat.u2.ecuaciones_fraccionarias` (≥2) with valid canonicalTrace per entry
- [ ] 3.3 Verify: loadChallengesForSkill for each pilot skill returns ≥2 challenges

---

## Phase 4: Challenge UI Components

- [x] 4.1 Create `src/components/practice/challenges/ChallengeOptInBlock.tsx` — shows challenge count, copy: "Terminaste la práctica base. Hay N ejercicios de desafío disponibles para profundizar. Son opcionales y no afectan tu avance de la práctica." Actions: "Intentar desafíos" / "Finalizar por ahora"
- [x] 4.2 Create `src/components/practice/challenges/ChallengeExerciseCard.tsx` — renders challenge prompt + inputs using exercise-phase patterns
- [x] 4.3 Create `src/components/practice/challenges/ChallengeFeedback.tsx` — shows correct/incorrect + pedagogical note
- [x] 4.4 Create `src/components/practice/challenges/ChallengeDoneSummary.tsx` — summary after all challenges, shows readiness score, "Volver al selector" CTA
- [x] 4.5 Write tests for each component — verify ChallengeOptInBlock shows count, verify ChallengeDoneSummary shows readiness, verify callbacks fire

---

## Phase 5: Integration

- [ ] 5.1 Mount ChallengeFlow in PracticeCompletePhase — import `queryChallengesBySkill`, `hasChallengesForSkill` from challenges/index; in `PracticeCompletePhase`, render `<ChallengeFlow />` when `hasChallengesForSkill(currentSkillId)` is true; wire callbacks
- [ ] 5.2 Verify: base PracticePhase union unchanged, no "challenges" case added
- [ ] 5.3 Verify: no import of advanced-practice-progress.ts in base practice-progress.ts

---

## Dependency Graph

```
Phase 1 (PR 1)                  Phase 2 (PR 2)              Phase 3 (PR 3)     Phase 4 (PR 4)              Phase 5 (PR 5)
─────────────────────────────    ────────────────────────    ──────────────    ──────────────────────       ─────────────────────
advanced-practice-progress.ts →  challenges/loader.ts   ←        ──────   →  ChallengeOptInBlock.tsx  →  usePracticeFlow.ts
ChallengeAttempt type        →    queryChallengesBySkill         ──────   →  ChallengeExerciseStep.tsx →  page.tsx wiring
addChallengeAttempt()        →    validation                      ──────   →  ChallengeFeedbackStep.tsx
loadAdvancedProgress()                                                            ChallengeDoneStep.tsx
                                                                                        │
                                                                         Phase 3 JSON content ← shared validation schema
```

---

## Rollback Checklist

After deleting challenge module, verify:
- `pnpm run test` passes
- `pnpm run typecheck` passes
- Base practice flow works unchanged
- `pre-utn.practice.v1` localStorage intact
- `PracticePhase` union unchanged

---

**.engram/ disclaimer**: `.engram/` no participa del flujo de intentos de desafío ni de ningún otro flujo de progreso del alumno.
