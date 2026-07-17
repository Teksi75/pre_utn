# Tasks: Recover U3 Ecuaciones Lineales

PR1 autonomous; PR2 verifies `e553648` ancestry or `parseOptionalCanonicalTrace` + `auditU3TraceSourceUse` importability before any `canonicalTrace` write. Runtime: N/A.

## Review Workload Forecast

| Field | PR1 isolation MC + integration | PR2 P1l + challenge + tag/detector/feedback |
|---|---|---|
| Changed lines | ≤210 | ≤400  |
| 400-line risk | Low | Med |
| Delivery / chain | stacked-to-main → main | (PR2: post-PR1) |
| Focused test cmd | `pnpm run test:run src/domain/__tests__/u3-exercise-shape.test.ts src/domain/__tests__/content-loaders-u3.test.ts src/domain/__tests__/evaluator-index.test.ts` | `pnpm run test:run src/domain/__tests__/error-tagging-u3.test.ts src/domain/__tests__/error-taxonomy-u3.test.ts src/lib/challenges/__tests__/loader.test.ts src/domain/__tests__/content-loaders-u3.test.ts src/domain/__tests__/u3-exercise-shape.test.ts` |
| Rollback | Revert PR1; 4 nums + 12-tag baseline | Revert PR2; PR1 stays; 12-tag + 2 challenges |

Decision needed: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

## Phase 1 — PR1 `feat/u3-ecuaciones-lineales-base` → main

- [ ] 1.1 RED: shape + content-loaders-u3 + evaluator integration — MC declares `u3_aislamiento_incorrecto` AND `loadExercisesForSkill` + `evaluateAnswer(wrongOption)` → tag = `u3_aislamiento_incorrecto`
- [ ] 1.2 GREEN `exercises/unit-3.json`: add `.7` + `.8` MC isolation (difficulty 2-3, 4 options, no free-text, `commonErrorTags: ["u3_aislamiento_incorrecto"]`); `.6` reserved for P1l
- [ ] 1.3 REFACTOR: 12-tag unchanged; focused cmd green; then `pnpm run test && pnpm run typecheck && pnpm run build` all green; merge `--no-ff`

## Phase 2 — PR2 `feat/u3-ecuaciones-lineales-p1l` → PR1

- [ ] 2.0 BASE GATE: `git merge-base --is-ancestor e553648079cd7b6f9864683d4ab4d694b4f6a8e7 HEAD` returns 0 OR symbols importable from `src/domain`; STOP otherwise
- [ ] 2.1 RED `error-tagging-u3.test.ts`: (i) retained irrational denominator fires tag; (ii) correct rationalization undefined; (iii) declared-only guard
- [ ] 2.2 RED `error-taxonomy-u3.test.ts`: U3 = 12 + new tag = 13; `ErrorTag` = `{ id, unit, description, examples }`, `examples: readonly string[]` (≥1 wrong + ≥1 correct), NO `label`
- [ ] 2.3 RED `loader.test.ts`: CHAL-001 (`difficulty: 5`, 4 options, CHALLENGE `sourceUse`); CHAL-002 (verbatim P1l rejected, adapted `sourceUse`, Spanish-neutral `pedagogicalIntent`); `traduccion_lenguaje_verbal` keeps 2; existing generic negatives verified, not duplicated
- [ ] 2.4 RED integration `error-tagging-u3.test.ts`: load `.6` + challenge; `evaluateAnswer` wrong option → tag = `u3_racionalizacion_irracional`; `generateFeedback` → new `recoveryTarget`
- [ ] 2.5 RED `content-loaders-u3.test.ts`: CAT-002 — `.6` `canonicalTrace[0].path` within repo; `sourceUse ∈ {adapted, reinforcement, reference}` (NO `alignment`); `commonErrorTags` includes new tag; feedback 11 → 12; `recoveryTarget` → example id
- [ ] 2.6 GREEN `error-taxonomy/index.ts` + `error-tagging.ts`: append `u3_racionalizacion_irracional` `ErrorTag` + add `U3_RACIONALIZACION_IRRACIONAL_TAGS` set + safe-first predicate (declared-only); fires iff MC + keeps irrational denom OR non-matching conjugate
- [ ] 2.7 GREEN `exercises/unit-3.json`: add `.6` P1l (MC, difficulty 4, 4 options, commonErrorTags=[new tag], canonicalTrace[0].path=`material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf`, sourceUse=`adapted`)
- [ ] 2.8 GREEN `challenges/unit-3.json`: add `.desafio-01` (MC, difficulty 5, 4 options, `challengeSection: true`, `category: "desafio"`, `tags: ["desafio","integrador"]`, commonErrorTags=[new tag], CHALLENGE `sourceUse`)
- [ ] 2.9 GREEN `feedback/unit-3.json` + `u3-exercise-shape.test.ts`: add rationalization feedback (recoveryTarget `example-ecuaciones-lineales-1`) + extend declared catalog 12 → 13 (additive) so `.6` passes
- [ ] 2.10 REFACTOR: focused cmd green; then `pnpm run test && pnpm run typecheck && pnpm run build` all green; `traduccion_lenguaje_verbal` keeps 2; merge `--no-ff`

## Exclusions / Rollback

Revert PR2 then PR1; STATUS abandoned if delivery stops Do NOT touch: U2, free-text, "profe digital", personalization, persistence, theory schema, `feat/align-u3-practice-official-exercises`, read-only `0f79d63`, archived -fundacion-minima/-traza, `validateTracePath`, `useChallengeFlow`. Threat matrix N/A; isolation by 2.0+2.6.