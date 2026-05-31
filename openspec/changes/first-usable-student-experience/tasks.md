# Tasks: First Usable Student Experience

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1: domain tagging (~150) → PR2: practice UI (~300) → PR3: diagnostic (~350) |
| Delivery strategy | auto-forecast |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Error-tag domain rules gated by exercise.commonErrorTags | PR 1 | Base: main; prerequisite for PR2, PR3 |
| 2 | Guided practice page (select→exercise→answer→feedback) | PR 2 | Base: main after PR1 lands; uses PR1 output |
| 3 | Diagnostic selector + UI + weak-area suggestions | PR 3 | Base: main after PR1 lands; optionally links to PR2 |

## Phase 1: Domain Error Tagging (PR1)

- [x] 1.1 RED: Write `src/domain/__tests__/evaluator-error-tagging.test.ts` — declared-tag match, undeclared-tag no-match, unrelated wrong answer no-match, correct-answer never-tagged per spec
- [x] 1.2 GREEN: Create `src/domain/evaluator/error-tagging.ts` — pure `tagError(exercise, userAnswer)` returning declared commonErrorTag match or undefined; deterministic, no side effects
- [x] 1.3 GREEN: Modify `src/domain/evaluator/index.ts` `evaluateAnswer()` — after incorrect supported evaluation, call `tagError()`; merge tag into `EvaluationResult`
- [x] 1.4 REFACTOR: Run `pnpm test` — all existing evaluator tests must pass; fix broken assertions

## Phase 2: Guided Practice UI (PR2)

- [x] 2.1 Create `src/app/practice/page.tsx` "use client" — local state for unit→skill→exercise→answer→feedback loop; uses `queryBySkill`, `evaluateAnswer` from domain
- [x] 2.2 Create `src/components/practice/FocusSelector.tsx` — unit dropdown (1-6) + filtered skill list; excludes Física
- [x] 2.3 Create `src/components/practice/ExerciseCard.tsx` — shows prompt; never exposes expectedAnswer
- [x] 2.4 Create `src/components/practice/AnswerForm.tsx` — text input + submit; disables during evaluation
- [x] 2.5 Create `src/components/practice/FeedbackDisplay.tsx` — correctness + `lookupTag` description when errorTag present; never shows expectedAnswer
- [x] 2.6 Verify: `pnpm typecheck && pnpm build`; manual smoke /practice: select unit→skill, answer, see feedback

## Phase 3: Diagnostic Domain (PR3 — domain slice)

- [ ] 3.1 RED: Write `src/domain/__tests__/diagnostic.test.ts` — balanced selection across units, insufficient catalog report, provisional accuracy ranking, weak-area tag aggregation
- [ ] 3.2 GREEN: Create `src/domain/diagnostic/index.ts` — `selectBalancedSet(catalog)`, `estimateSkills(attempts)`, `suggestPractice(estimates)` per design contracts
- [ ] 3.3 Export diagnostic types and functions from `src/domain/index.ts`

## Phase 4: Diagnostic UI (PR3 — UI slice)

- [ ] 4.1 Create `src/app/diagnostic/page.tsx` "use client" — runs balanced selection, collects answers, computes estimates, shows results
- [ ] 4.2 Create `src/components/diagnostic/DiagnosticQuestion.tsx` — exercise prompt + answer input
- [ ] 4.3 Create `src/components/diagnostic/ResultsDisplay.tsx` — ranked skill estimates + practice links for weakest skills

## Phase 5: Wiring

- [ ] 5.1 Update `src/app/page.tsx` — add nav links to /practice and /diagnostic
