# Tasks: Recover U3 Canonical Trace Compatibility

Source 0f79d63; base 08da4b2f; gate PASS. U2 not migrated; ChallengeExercise independent; general ExerciseSourceUse accepts alignment; U3-only audit narrows.

## Review Workload Forecast

| Field | PR1 contracts | PR2 parser + U3 audit |
|---|---|---|
| Estimated changed lines | ≤400 | ≤246 |
| 400-line budget risk | Low | Low |
| Delivery strategy | chained, no size exception | chained, no size exception |
| Chain strategy | stacked-to-main | stacked-to-main |
| Rollback boundary | Revert restores ChallengeExercise extends Exercise + casts `evaluateAnswer` calls back to `Exercise`; loader untouched | Revert removes parser/audit, drops canonicalTrace from KNOWN_FIELDS; PR1 contracts remain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

## Phase 1 — PR1 Contracts

Branch: feat/u3-traza-canonica-contracts ← main (08da4b2f).

- [x] 1.1 RED: ExerciseSourceUse is 4-value; Exercise extends ExerciseBaseShape; canonicalTrace optional
- [x] 1.2 RED: ChallengeExercise assignable to ExerciseBaseShape, rejected by Exercise
- [x] 1.3 RED: canonical-source rejected by ExerciseCanonicalTrace.sourceUse; alignment accepted
- [x] 1.4 GREEN: add ExerciseBaseShape, ExerciseCanonicalTrace, four-literal ExerciseSourceUse to exercise.ts; Exercise extends ExerciseBaseShape with optional canonicalTrace
- [x] 1.5 GREEN: re-export the three new symbols from src/domain/index.ts
- [x] 1.6 GREEN: ChallengeExercise extends ExerciseBaseShape in src/domain/catalog/challenges/types.ts; trace types unchanged
- [x] 1.7 GREEN: widen ExerciseCardProps.exercise and ExerciseAnswerInputProps.exercise to ExerciseBaseShape; no JSX change
- [x] 1.8 GREEN: add `EvaluableExercise` structural contract + re-export; retype `evaluateAnswer`/`tagError` to it; remove `as unknown as Exercise` cast in `ChallengeFlow.tsx`
- [x] 1.9 REFACTOR: pnpm run typecheck + test:run + build; ChallengeExerciseCard compiles unchanged
- [ ] 1.10 Commit proposal + model/challenge specs + design + STATUS delta (pr1.status=ready)
- [ ] 1.11 Mark PR1 reviewed; post-apply lifecycle (merge to main) is outside the apply phase

PR1 line accounting: actual `git diff --shortstat` additions+deletions ≤400 (no size exception).

## Phase 2 — PR2 Parser + U3 Audit

Branch: feat/u3-traza-canonica-parser ← main (post-PR1).

- [ ] 2.1 RED: four absence expressions (undefined, null, [], {}) on parseOptionalCanonicalTrace return null, no throw
- [ ] 2.2 RED: single non-empty entry and non-empty array parse into typed ExerciseCanonicalTrace[] in input order
- [ ] 2.3 RED: alignment accepted; challenge-only or unknown sourceUse literals throw with literal named
- [ ] 2.4 RED: non-object primitive raw, missing path, missing pedagogicalIntent each throw; legacy JSON loads with no trace attached
- [ ] 2.5 GREEN: parseOptionalCanonicalTrace(raw: unknown, id: string): readonly ExerciseCanonicalTrace[] | null in content-loaders.ts; export from catalog/index.ts
- [ ] 2.6 GREEN: add canonicalTrace to KNOWN_FIELDS in applyExerciseDefaults; spread only when non-null
- [ ] 2.7 GREEN: auditU3TraceSourceUse(exercises): readonly U3TraceAuditViolation[] in new src/domain/catalog/u3-trace-audit.ts; filter unit-3 skillId; flag alignment; U2 returns [] without inspection
- [ ] 2.8 RED: U3 alignment produces violation; U2 alignment produces zero violations and is not inspected; U3 adapted/reinforcement/reference produce zero
- [ ] 2.9 REFACTOR: typecheck + build; verify U1/U2 legacy entries load with no trace attached
- [ ] 2.10 Commit catalog spec + STATUS delta (pr2.status=ready; change remains in-progress)
- [ ] 2.11 Mark PR2 reviewed; post-apply lifecycle (merge to main) is outside the apply phase

PR2 line accounting: parser+audit 78-96 + tests 72-88 + artifacts 62 = ≤246.

## Exclusions / Rollback

Revert PR2 then PR1; STATUS abandoned only if delivery stops. Do NOT migrate U2, change validateTracePath, touch useChallengeFlow, persistence, content JSON, challenge loader/store/readiness, or read-only source 0f79d63. Threat matrix N/A (design); U3 audit isolation enforced by 2.8 (ii).