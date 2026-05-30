# Tasks: Math Domain Foundations

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1100–1500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Delivery strategy | auto-forecast |
| Suggested split | PR 1 → PR 2 → PR 3 |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain models + error taxonomy | PR 1 | ~400 lines; types, validation, skill catalog, error tags |
| 2 | Evaluator dispatch + comparison modules | PR 2 | ~300 lines; depends on PR 1 |
| 3 | Catalog loader + `exercises.json` + barrel | PR 3 | ~500 lines; ~350 are JSON data content |

## Phase 1: Domain Types (TDD RED → GREEN)

- [x] 1.1 RED: `result.test.ts` — `ok()` wraps value, `err()` wraps error, discriminated union
- [x] 1.2 GREEN: `src/domain/models/result.ts` — `Result<T,E>` with `ok()` / `err()` constructors
- [x] 1.3 RED: `skill.test.ts` — valid/invalid IDs (`mat.u1.numeros_reales`), unit 7 rejected, prereq cycle (spec: math-skill-model)
- [x] 1.4 GREEN: `src/domain/models/skill.ts` — `SkillId`, `Skill`, `validateSkill()` (spec: math-skill-model §Identity, §Prerequisites)
- [x] 1.5 GREEN: `src/domain/models/skill-catalog.ts` — 37 skill constants from spec 06; used by exercise validation
- [x] 1.6 RED: `error-tag.test.ts` — valid/invalid IDs (`u1_signo_racionalizacion`), unit 7, missing description (spec: math-error-taxonomy §Identity)
- [x] 1.7 GREEN: `src/domain/models/error-tag.ts` — `ErrorTagId`, `ErrorTag`, `validateErrorTag()`
- [x] 1.8 RED: `exercise.test.ts` — all 9 types accepted, invalid refs/skillId, diff 0/6, missing prompt (spec: math-exercise-model)
- [x] 1.9 GREEN: `src/domain/models/exercise.ts` — `ExerciseId`, `ExerciseType`, `Difficulty`, `Exercise`, `validateExercise()` (spec: math-exercise-model §Identity, §Type)

## Phase 2: Evaluator (TDD RED → GREEN)

- [x] 2.1 RED: `evaluator-numeric.test.ts` — tolerance boundary (3.1405 vs 3.14), exact match, out-of-tolerance (spec: math-answer-evaluator §Numerical)
- [x] 2.2 GREEN: `src/domain/evaluator/numeric.ts` — `Math.abs(a-b) < 0.01`
- [x] 2.3 RED: `evaluator-exact.test.ts` — whitespace trimming, case insensitivity (spec: §Type-Specific Matching)
- [x] 2.4 GREEN: `src/domain/evaluator/exact.ts` — trimmed lowercase comparison
- [x] 2.5 RED: `evaluator-boolean.test.ts` — all aliases: `v`/`verdadero`/`true`/`sí` and `f`/`falso`/`false`/`no` (spec: §Boolean Aliases)
- [x] 2.6 GREEN: `src/domain/evaluator/boolean.ts` — Spanish/English alias resolution
- [x] 2.7 RED: `evaluator-index.test.ts` — dispatch to correct module; unsupported types → manual-review (spec: §Unsupported)
- [x] 2.8 GREEN: `src/domain/evaluator/index.ts` — `evaluateAnswer()`, `EvaluationResult`, manual-review for free-response/graphical/matching/ordering

## Phase 3: Error Taxonomy + Catalog (TDD RED → GREEN)

- [ ] 3.1 RED: `error-taxonomy.test.ts` — ≥2 tags/unit, duplicates fail, lookup by ID, filter by unit (spec: math-error-taxonomy §Coverage, §Lookup)
- [ ] 3.2 GREEN: `src/domain/error-taxonomy/index.ts` — `loadTaxonomy()`, `lookupTag()`, `filterByUnit()`, coverage validation
- [ ] 3.3 Create `content/matematica/exercises.json` — ~30 exercises (5×6 units), original content only, each with: id, skillId, type, difficulty, prompt, expectedAnswer, commonErrorTags, pedagogicalNote (spec: math-exercise-catalog §Coverage, §Transformed)
- [ ] 3.4 RED: `catalog.test.ts` — coverage ≥5/unit, query ordering (diff asc → id asc), no-match empty, prereq cycles caught (spec: math-exercise-catalog §Querying)
- [ ] 3.5 GREEN: `src/domain/catalog/index.ts` — `loadCatalog()`, `queryByUnit()`, `queryBySkill()`, prerequisite cycle detection at load

## Phase 4: Integration + Cleanup

- [ ] 4.1 Update `src/domain/index.ts` barrel — export all models, evaluator, catalog, error-taxonomy; keep PROJECT_PHASE/SCOPE
- [ ] 4.2 Run `pnpm run test` — all tests pass; fix failures
- [ ] 4.3 Run `pnpm run typecheck` — strict mode, zero `any`; fix errors
- [ ] 4.4 REFACTOR: verify test coverage vs spec scenarios; ensure zero React/Next.js/Supabase imports in `src/domain/`
