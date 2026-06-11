# Tasks: unit-2-factorizacion-slice

**Change:** unit-2-factorizacion-slice
**Date:** 2026-06-10
**Author:** orchestrator + sdd-tasks-chinos
**Status:** in-progress (PR-1 merged, PR-2 pending)
**TDD mode:** strict (RED → GREEN → REFACTOR)
**Estimated total diff:** ~490 lines
**PR strategy:** chained-pr (2 PRs)
**Chain strategy:** stacked-to-main (provisional)

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~490 (domain ~120 + tests ~170 + JSON ~160 + modifications ~40) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (domain helpers + tags + detectors + skill-catalog + tests ~280) → PR 2 (content JSON + 8 exercises + shape tests ~210) |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | gauss-routing-helper + 2 error tags + 2 detectors + skill-catalog dep + regression | PR 1 (~280 lines) | `feat/unit-2-factorizacion-domain` → `main`; standalone, all tests pass |
| 2 | 2 TheoryNodes + examples + feedback + 8 exercises + shape tests | PR 2 (~210 lines) | `feat/unit-2-factorizacion-content` → `main`; depends on PR 1 tags |

---

## PR-1: Domain Helpers + Error Patterns + Skill Catalog

**Branch:** `feat/unit-2-factorizacion-domain` → `main`
**Merge:** `--no-ff`
**Acceptance:** tasks 1.1–1.10 ✅, `pnpm run test` green (1330 tests), `pnpm run typecheck` clean, `pnpm run build` green
**Rollback:** `git revert --no-edit <merge-commit>`

**Dependency order:**
```
1.1 → 1.2 → 1.3 → 1.4
                    ↓
1.5 → 1.6 → 1.7 → 1.8 → 1.9 → 1.10
```

### Task 1.1: gauss-routing-helper — skeleton + parseRationalRoots

- **Spec:** U2FAC-EVAL-006
- **Type:** domain code (strict TDD)
- **Files:**
  - NEW: `src/domain/evaluator/gauss-routing-helper.ts`
  - NEW: `src/domain/__tests__/gauss-routing-helper.test.ts`
- **Steps:**
  1. RED: test `parseRationalRoots("1/2, -3/2, 0.5, 4")` → `[0.5, -1.5, 0.5, 4]`. Must fail (module missing).
  2. GREEN: implement `parseRationalRoots(raw: string): number[]` — tokenize by comma/space, parse each token as `"a/b"` → `a/b`, decimal, or integer.
  3. REFACTOR: extract `parseToken()` helper.
- [x] **Done when:** `pnpm run test -- gauss-routing-helper` green (≥5 parse tests)
- **Estimated lines:** ~25 (code) + ~25 (tests) = ~50

### Task 1.2: normalizeRoots + areEquivalentRoots

- [x] **Spec:** U2FAC-EVAL-006, U2FAC-EVAL-007
- **Type:** domain code (strict TDD)
- **Files:** MODIFY: `gauss-routing-helper.ts`, `gauss-routing-helper.test.ts`
- **Steps:**
  1. RED: test `areEquivalentRoots("1, -3/2, 4", "-3/2, 4, 1")` → `true`; `areEquivalentRoots("1, -3", "1, -3, 2")` → `false`. Must fail.
  2. GREEN: implement `normalizeRoots()` (deduplicate, sort) and `areEquivalentRoots()` (set comparison, tolerance 1e-9).
  3. REFACTOR: add `evaluateGaussRoots(expected, student)` as the public API returning `{ correct: boolean }`.
- [x] **Done when:** equivalence + extra-root + missing-root tests green (≥6 tests)
- **Estimated lines:** ~20 (code) + ~30 (tests) = ~50

### Task 1.3: Edge cases — empty, single, repeated, recurring decimals

- **Spec:** U2FAC-EVAL-006, U2FAC-EVAL-007
- **Type:** domain code (strict TDD)
- **Files:** MODIFY: `gauss-routing-helper.ts`, `gauss-routing-helper.test.ts`
- **Steps:**
  1. RED: test empty string → `[]`; single root `"3"` → `{correct: true}`; repeated roots `"1, 1, 1"` deduplicates; `"1/3"` ≈ `0.333...` within tolerance.
  2. GREEN: add guards for empty input, dedup in normalizeRoots, tolerance in comparison.
  3. REFACTOR: add `GaussParseError` for unparseable tokens.
- [x] **Done when:** all edge-case tests green (≥5 tests)
- **Estimated lines:** ~10 (code) + ~20 (tests) = ~30

### Task 1.4: Wire gauss-routing into evaluator/index.ts

- **Spec:** U2FAC-EVAL-006
- **Type:** domain code (strict TDD)
- **Files:**
  - MODIFY: `src/domain/evaluator/index.ts` (add gauss branch)
  - MODIFY: `src/domain/__tests__/evaluator-index.test.ts` (add routing test)
- **Steps:**
  1. RED: test exercise `{type: "numerical", skillId: "mat.u2.gauss"}` routes to `evaluateGaussRoots`. Must fail.
  2. GREEN: add branch before main switch: `if (exercise.type === "numerical" && exercise.skillId === "mat.u2.gauss")` → delegate.
  3. REFACTOR: no changes needed.
- [x] **Done when:** routing test green; all existing evaluator tests still pass
- **Estimated lines:** ~10 (code) + ~15 (tests) = ~25

### Task 1.5: Error taxonomy — 2 new u2_* tags

- **Spec:** U2FAC-TAG-001, U2FAC-TAG-002, U2FAC-TAG-003, U2FAC-TAG-004
- **Type:** domain data + tests (strict TDD)
- **Files:**
  - MODIFY: `src/domain/error-taxonomy/index.ts` (+2 entries)
  - MODIFY: `src/domain/__tests__/error-taxonomy.test.ts` (+assertions)
- **Steps:**
  1. RED: test `u2_signo_factorizacion` and `u2_caso_incorrecto` exist with metadata; total u2_* tags ≥ 8; no duplicates. Must fail.
  2. GREEN: add 2 tag entries to TAXONOMY array.
  3. REFACTOR: verify descriptions in neutral Spanish.
- [x] **Done when:** `pnpm run test -- error-taxonomy` green
- **Estimated lines:** ~15 (code) + ~10 (tests) = ~25

### Task 1.6: isU2SignoFactorizacionError detector

- **Spec:** U2FAC-EVAL-003, U2FAC-EVAL-005
- **Type:** domain code (strict TDD)
- **Files:**
  - MODIFY: `src/domain/evaluator/error-tagging.ts` (+function + tag set)
  - NEW: `src/domain/__tests__/error-tagging-u2-factorizacion.test.ts`
- **Steps:**
  1. RED: test MC positive (distractor with inverted sign) → `true`; MC negative (correct answer) → `false`; symbolic positive (expansion with sign flip) → `true`; not-declared → `undefined`.
  2. GREEN: implement `isU2SignoFactorizacionError()` — MC: compare option factors with expected; symbolic: expand both, check same absolute coefficients with sign differences.
  3. REFACTOR: extract factor-comparison helper.
- [x] **Done when:** ≥4 tests green (2 positive, 2 negative)
- **Estimated lines:** ~25 (code) + ~20 (tests) = ~45

### Task 1.7: isU2CasoIncorrectoError detector

- **Spec:** U2FAC-EVAL-004, U2FAC-EVAL-005
- **Type:** domain code (strict TDD)
- **Files:** MODIFY: `error-tagging.ts`, `error-tagging-u2-factorizacion.test.ts`
- **Steps:**
  1. RED: test MC positive (student picks wrong case label) → `true`; MC negative (correct case) → `false`; not-declared → `undefined`.
  2. GREEN: implement `isU2CasoIncorrectoError()` — MC where prompt asks "que caso aplica", compare selected option case vs expected case.
  3. REFACTOR: no changes needed.
- [x] **Done when:** ≥3 tests green
- **Estimated lines:** ~15 (code) + ~15 (tests) = ~30

### Task 1.8: Wire 2 new detectors into tagError flow

- **Spec:** U2FAC-EVAL-003, U2FAC-EVAL-004
- **Type:** domain code
- **Files:** MODIFY: `error-tagging.ts` (add dispatch blocks + tag sets)
- **Steps:**
  1. Add `U2_SIGNO_FACTORIZACION_TAGS` and `U2_CASO_INCORRECTO_TAGS` sets.
  2. Add dispatch blocks in `tagError()` after existing U2 patterns.
  3. Verify `pnpm run test` green (existing + new tests).
- [x] **Done when:** all error-tagging tests green; `tagError` dispatches both new tags
- **Estimated lines:** ~10 (code)

### Task 1.9: Skill-catalog — add ruffini_resto to factorizacion prerequisites

- **Spec:** U2FAC-SKILL-001, U2FAC-SKILL-002
- **Type:** domain data + tests (strict TDD)
- **Files:**
  - MODIFY: `src/domain/models/skill-catalog.ts` (line 115)
  - NEW: `src/domain/__tests__/skill-catalog-factorizacion-deps.test.ts`
- **Steps:**
  1. RED: test `factorizacion.prerequisites` includes `mat.u2.ruffini_resto` AND `mat.u2.operaciones_polinomios`; no cycles. Must fail.
  2. GREEN: add `"mat.u2.ruffini_resto"` to prerequisites array.
  3. REFACTOR: verify chain linearity.
- [x] **Done when:** `pnpm run test -- skill-catalog-factorizacion-deps` green (≥3 tests)
- **Estimated lines:** ~1 (code) + ~20 (tests) = ~21

### Task 1.10: Regression test — U1 + U2-Fundamentos + U2-Factorizacion evaluator chain

- **Spec:** U2FAC-EVAL-008
- **Type:** verification
- **Files:** MODIFY: `src/domain/__tests__/u1-regression.test.ts` (extend)
- **Steps:**
  1. Add tests: polynomial-evaluator equivalence still works; U2-Fundamentos error-tagging unchanged; new gauss-helper routes correctly; new tags don't break existing tagError flow.
  2. All tests pass.
- [x] **Done when:** `pnpm run test -- u1-regression` green (≥30 tests total)
- **Estimated lines:** ~25 (tests)

---

## PR-2: Content JSON + Exercises

**Branch:** `feat/unit-2-factorizacion-content` → `main`
**Merge:** `--no-ff`
**Acceptance:** tasks 2.1–2.9 ✅, `pnpm run test` green, `pnpm run typecheck` clean
**Rollback:** `git revert --no-edit <merge-commit>`
**Depends on:** PR-1 (error tags must exist for exercises to reference)

**Dependency order:**
```
2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7 → 2.8 → 2.9
```

### Task 2.1: TheoryNode — factorizacion (7 sub-bloques)

- **Spec:** U2FAC-CAT-003
- **Type:** content data
- **Files:** MODIFY: `content/matematica/theory/unit-2.json` (+1 node)
- **Steps:**
  1. Create TheoryNode `theory-factorizacion` with `skillId: "mat.u2.factorizacion"`, 7 conceptBlocks (one per caso: factor comun, grupos, TCP, cubo perfecto, dif. cuadrados, potencias, trinomio 2do grado).
  2. Each block: title, body (neutral Spanish), canonicalTrace to PDF cap. 13 pages.
  3. Follow pattern from U1 `complejos` (8 conceptBlocks).
- [x] **Done when:** JSON valid; node loads via `loadTheoryContent("unit-2")`
- **Estimated lines:** ~50

### Task 2.2: TheoryNode — gauss

- **Spec:** U2FAC-CAT-005
- **Type:** content data
- **Files:** MODIFY: `content/matematica/theory/unit-2.json` (+1 node)
- **Steps:**
  1. Create TheoryNode `theory-gauss` with `skillId: "mat.u2.gauss"`, conceptBlocks: enunciado del teorema, algoritmo p/q, ejemplo trabajado.
  2. canonicalTrace to PDF cap. 12 + cap. 13 pages.
- [x] **Done when:** JSON valid; node loads correctly
- **Estimated lines:** ~30

### Task 2.3: WorkedExamples — 4 new (2 factorizacion + 2 gauss)

- **Spec:** U2FAC-CAT-003, U2FAC-CAT-005
- **Type:** content data
- **Files:** MODIFY: `content/matematica/examples/unit-2.json` (+4 examples)
- **Steps:**
  1. Add 2 factorizacion examples: diferencia de cuadrados (step-by-step), trinomio 2do grado con a≠1 (via Ruffini).
  2. Add 2 gauss examples: cubico con 1 raiz racional + trinomio residual, cuartico con 2 raices racionales.
  3. Each: `skillId`, `solutionSteps[]`, `canonicalTrace`.
- [x] **Done when:** JSON valid; `loadExampleContent("unit-2")` returns ≥10 examples
- **Estimated lines:** ~40

### Task 2.4: FeedbackMappings — 3 new (for new tags + existing)

- **Spec:** U2FAC-TAG-001
- **Type:** content data
- **Files:** MODIFY: `content/matematica/feedback/unit-2.json` (+3 mappings)
- **Steps:**
  1. Add FeedbackMapping for `u2_signo_factorizacion`: corrective message about sign selection in factors.
  2. Add FeedbackMapping for `u2_caso_incorrecto`: corrective message about pattern recognition.
  3. Add FeedbackMapping for `u2_factorizacion_incompleta` (if not already present): reminder to check irreducibility.
- [x] **Done when:** JSON valid; `loadFeedbackContent("unit-2")` returns ≥9 mappings
- **Estimated lines:** ~20

### Task 2.5: Update ex.u2.factorizacion.1 + recreate ex.u2.gauss.1

- **Spec:** U2FAC-CAT-004, U2FAC-CAT-005
- **Type:** content data fix
- **Files:** MODIFY: `content/matematica/exercises.json`
- **Steps:**
  1. Update `ex.u2.factorizacion.1` commonErrorTags: add `["u2_caso_incorrecto", "u2_signo_factorizacion"]`.
  2. Recreate `ex.u2.gauss.1`: change skillId to `mat.u2.gauss`, prompt to rational roots of a cubic (e.g., `P(x) = 2x³ + 3x² − 8x + 3`), MC type, difficulty 2, commonErrorTags `["u2_ruffini_signo_a", "u2_signo_operacion"]`.
- [x] **Done when:** both exercises valid; `ex.u2.gauss.1.skillId === "mat.u2.gauss"`
- **Estimated lines:** ~15

### Task 2.6: 3 new factorizacion exercises (.2–.4)

- **Spec:** U2FAC-CAT-001, U2FAC-CAT-002, U2FAC-CAT-006, U2FAC-CAT-008, U2FAC-CAT-009
- **Type:** content data
- **Files:** MODIFY: `content/matematica/exercises.json` (+3 exercises)
- **Steps:**
  1. `ex.u2.factorizacion.2`: MC, dificultad 2, diferencia de cuadrados (`x² - 25`), tags `["u2_signo_factorizacion", "u2_factorizacion_incompleta"]`.
  2. `ex.u2.factorizacion.3`: numerical, dificultad 3, factor comun maximo (extraer MCD de coeficientes), tags `["u2_factorizacion_incompleta"]`.
  3. `ex.u2.factorizacion.4`: symbolic, dificultad 4, trinomio 2do grado con a≠1 (`6x² + 7x + 2`), polynomial-evaluator verified, tags `["u2_signo_factorizacion", "u2_signo_operacion"]`.
- [x] **Done when:** exercises load; difficulty progression 2→3→4; no free-text
- **Estimated lines:** ~30

### Task 2.7: 3 new gauss exercises (.2–.4)

- **Spec:** U2FAC-CAT-001, U2FAC-CAT-002, U2FAC-CAT-007, U2FAC-CAT-008, U2FAC-CAT-009
- **Type:** content data
- **Files:** MODIFY: `content/matematica/exercises.json` (+3 exercises)
- **Steps:**
  1. `ex.u2.gauss.2`: MC, dificultad 2, identificar candidatos p/q correctos, tags `["u2_ruffini_signo_a"]`.
  2. `ex.u2.gauss.3`: numerical, dificultad 3, calcular raices racionales de grado 4 (dos inputs numericos), tags `["u2_ruffini_signo_a", "u2_signo_operacion"]`.
  3. `ex.u2.gauss.4`: symbolic, dificultad 4, factorizar completamente usando Gauss + trinomio, polynomial-evaluator verified, tags `["u2_signo_factorizacion", "u2_factorizacion_incompleta"]`.
- [x] **Done when:** exercises load; difficulty progression 2→3→4; no free-text
- **Estimated lines:** ~30

### Task 2.8: Update tests referencing old ex.u2.gauss.1

- **Spec:** U2FAC-CAT-005
- **Type:** test fix
- **Files:** MODIFY: multiple test files (search & replace)
- **Steps:**
  1. Search all tests for `ex.u2.gauss.1` references that assert `skillId === "mat.u3.sistemas"`.
  2. Update `content-loaders.test.ts`: change assertion to expect `mat.u2.gauss`.
  3. Update `exercises-u2-shape.test.ts`: change gauss.1 relocation test to verify correct U2 content.
  4. Update `u1-regression.test.ts`: change gauss.1 assertion.
  5. Update `catalog-answer-contract.test.ts`: verify gauss.1 is in mat.u2.gauss list.
  6. Update `evaluator-index.test.ts`: if needed.
- [x] **Done when:** `pnpm run test` green after content change
- **Estimated lines:** ~15 (modifications across files)

### Task 2.9: Shape tests for 8 new exercises + skill-catalog dep test

- **Spec:** U2FAC-CAT-001 through U2FAC-CAT-009, U2FAC-SKILL-003
- **Type:** tests
- **Files:**
  - MODIFY: `src/domain/__tests__/exercises-u2-shape.test.ts` (extend)
  - MODIFY: `src/domain/__tests__/skill-catalog-factorizacion-deps.test.ts` (extend or create)
- **Steps:**
  1. Add tests: 8 new exercises exist (4 factorizacion + 4 gauss); IDs unique; type distribution (4 MC, 2 numerical, 2 symbolic); difficulty monotonic per skill; commonErrorTags non-empty; ex.u2.gauss.1 skillId is mat.u2.gauss; no free-text.
  2. Add test: `computeReadiness` blocks factorizacion without ruffini_resto.
- [x] **Done when:** `pnpm run test -- exercises-u2-shape` green; `pnpm run test -- skill-catalog-factorizacion-deps` green
- **Estimated lines:** ~30 (tests)

---

## Verification Matrix

| Task | Spec Scenarios | Test File(s) | Done When |
|------|---------------|--------------|-----------|
| 1.1 | U2FAC-EVAL-006 | `gauss-routing-helper.test.ts` | parse tests green |
| 1.2 | U2FAC-EVAL-006, 007 | `gauss-routing-helper.test.ts` | equivalence tests green |
| 1.3 | U2FAC-EVAL-006, 007 | `gauss-routing-helper.test.ts` | edge-case tests green |
| 1.4 | U2FAC-EVAL-006 | `evaluator-index.test.ts` | routing test green |
| 1.5 | U2FAC-TAG-001..004 | `error-taxonomy.test.ts` | tag assertions green |
| 1.6 | U2FAC-EVAL-003, 005 | `error-tagging-u2-factorizacion.test.ts` | signo detector tests green |
| 1.7 | U2FAC-EVAL-004, 005 | `error-tagging-u2-factorizacion.test.ts` | caso detector tests green |
| 1.8 | U2FAC-EVAL-003, 004 | `error-tagging-u2-factorizacion.test.ts` | tagError dispatch green |
| 1.9 | U2FAC-SKILL-001, 002 | `skill-catalog-factorizacion-deps.test.ts` | dep tests green |
| 1.10 | U2FAC-EVAL-008 | `u1-regression.test.ts` | ≥30 regression tests green |
| 2.1 | U2FAC-CAT-003 | `content-loaders.test.ts` | theory loads (5 nodes) |
| 2.2 | U2FAC-CAT-005 | `content-loaders.test.ts` | theory loads (5 nodes) |
| 2.3 | U2FAC-CAT-003, 005 | `content-loaders.test.ts` | examples load (≥10) |
| 2.4 | U2FAC-TAG-001 | `content-loaders.test.ts` | feedback loads (≥9) |
| 2.5 | U2FAC-CAT-004, 005 | `exercises-u2-shape.test.ts` | gauss.1 + factorizacion.1 valid |
| 2.6 | U2FAC-CAT-001..009 | `exercises-u2-shape.test.ts` | factorizacion exercises valid |
| 2.7 | U2FAC-CAT-001..009 | `exercises-u2-shape.test.ts` | gauss exercises valid |
| 2.8 | U2FAC-CAT-005 | multiple test files | all tests green after content change |
| 2.9 | U2FAC-CAT-001..009, SKILL-003 | `exercises-u2-shape.test.ts`, `skill-catalog-factorizacion-deps.test.ts` | shape + dep tests green |

---

## Commit Strategy

Follow `work-unit-commits` skill: one commit per logical work unit. Each commit must pass `pnpm run test` and `pnpm run typecheck`.

**PR-1 commits (expected 4–6):**
1. `feat(domain): add gauss-routing-helper for rational root comparison`
2. `feat(domain): wire gauss numerical routing in evaluator/index.ts`
3. `feat(taxonomy): add u2_signo_factorizacion and u2_caso_incorrecto error tags`
4. `feat(domain): add factorizacion error detectors in error-tagging.ts`
5. `feat(domain): add ruffini_resto as factorizacion prerequisite`
6. `test(domain): extend U1 regression guard for U2-Factorizacion evaluator chain`

**PR-2 commits (expected 4–5):**
1. `feat(content): add factorizacion and gauss theory nodes`
2. `feat(content): add factorizacion and gauss worked examples and feedback`
3. `feat(content): add 8 U2 factorizacion and gauss exercises`
4. `fix(tests): update gauss.1 references for U2 content`
5. `test(content): extend shape tests for 8 new exercises`

---

## PR Boundaries

### PR-1: Domain Helpers + Error Patterns

- **Branch:** `feat/unit-2-factorizacion-domain`
- **Base:** `main`
- **Merge:** `git merge --no-ff feat/unit-2-factorizacion-domain`
- **Title:** `feat(domain): add gauss-routing-helper, factorizacion error tags, detectors, and skill-catalog dep`
- **Description:** PR-1 of 2 (stacked-to-main). Adds gauss-routing-helper module for rational root comparison (order-insensitive, fraction-aware), 2 new u2_* error tags (u2_signo_factorizacion, u2_caso_incorrecto) with pattern detectors, wires gauss numerical routing in evaluator/index.ts, and adds ruffini_resto as factorizacion prerequisite. ~40 new tests.
- **Acceptance:** tasks 1.1–1.10 ✅
- **Rollback:** `git revert --no-edit <merge-commit>`

### PR-2: Content JSON + Exercises

- **Branch:** `feat/unit-2-factorizacion-content`
- **Base:** `main` (stacked-to-main)
- **Merge:** `git merge --no-ff feat/unit-2-factorizacion-content`
- **Title:** `feat(content): add U2 factorizacion and gauss theory, examples, feedback, and 8 exercises`
- **Description:** PR-2 of 2 (stacked-to-main). Adds 2 TheoryNodes (factorizacion with 7 sub-bloques, gauss), 4 WorkedExamples, 3 FeedbackMappings, 8 new exercises (4 factorizacion + 4 gauss), recreates ex.u2.gauss.1 with correct U2 content, updates tests referencing old gauss.1 placeholder. Depends on PR-1 for error tags.
- **Acceptance:** tasks 2.1–2.9 ✅
- **Rollback:** `git revert --no-edit <merge-commit>`
