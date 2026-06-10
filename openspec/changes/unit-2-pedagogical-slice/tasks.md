# Tasks: unit-2-pedagogical-slice

**Change:** unit-2-pedagogical-slice
**Date:** 2026-06-10
**Author:** orchestrator + sdd-tasks-chinos
**Status:** ready-for-apply
**TDD mode:** strict (RED → GREEN → REFACTOR)

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~930 (domain ~180 + tests ~450 + JSON ~250 + modifications ~50) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (domain + tests ~350) → PR 2 (content + catalog ~480) → PR 3 (integration ~100) |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | polynomial-evaluator module + types + TDD tests | PR 1 (~350 lines) | `feat/unit-2-domain` → `main`; standalone, all tests pass |
| 2 | Content JSON + taxonomy + catalog + exercises + routing | PR 2 (~480 lines) | `feat/unit-2-content` → `main`; depends on PR 1 types |
| 3 | Integration wiring + regression + QA | PR 3 (~100 lines) | `feat/unit-2-integration` → `main`; depends on PR 2 |

---

## PR-1: Domain Module (polynomial-evaluator)

**Branch:** `feat/unit-2-domain` → `main`
**Merge:** `--no-ff`
**Acceptance:** tasks 1.1–1.9 ✅, `pnpm run test` green, `pnpm run typecheck` clean
**Rollback:** `git revert --no-edit <merge-commit>`

**Dependency order:** 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7 → 1.8 → 1.9

### Task 1.1: Polynomial type + error classes

- **Spec:** U2-POLY-006, U2-POLY-007
- **Type:** domain code (strict TDD)
- **Files:**
  - NEW: `src/domain/evaluator/polynomial-types.ts`
  - NEW: `src/domain/__tests__/polynomial-evaluator.test.ts` (skeleton)
- **Steps:**
  1. RED: write tests asserting `Polynomial` shape, `PolynomialParseError.position/reason`, `UnsupportedPolynomialFormError.formType/reason`. Run `pnpm run test` — must fail (module missing).
  2. GREEN: create `polynomial-types.ts` with `Polynomial` interface, both error classes. Tests pass.
  3. REFACTOR: add JSDoc, ensure `readonly` constraints. Tests still pass.
- **Done when:** `pnpm run test -- polynomial-evaluator` green; `pnpm run typecheck` clean
- **Estimated lines:** ~20 (code) + ~30 (tests) = ~50

### Task 1.2: parsePolynomial — coefficient array form

- **Spec:** U2-POLY-003, U2-POLY-009
- **Type:** domain code (strict TDD)
- **Files:**
  - NEW: `src/domain/evaluator/polynomial-evaluator.ts` (skeleton with `parsePolynomial`)
  - MODIFY: `src/domain/__tests__/polynomial-evaluator.test.ts`
- **Steps:**
  1. RED: test `parsePolynomial([1, 0, -4])` → `{ coefficients: [1, 0, -4], degree: 2 }`. Must fail.
  2. GREEN: implement array branch of `parsePolynomial`. Test passes.
  3. REFACTOR: extract normalization helper (strip leading zeros).
- **Done when:** array-form tests green; coverage ≥ 90% branch for array path
- **Estimated lines:** ~25 (code) + ~25 (tests) = ~50

### Task 1.3: parsePolynomial — expanded monomial form

- **Spec:** U2-POLY-001
- **Type:** domain code (strict TDD)
- **Files:** MODIFY: `polynomial-evaluator.ts`, `polynomial-evaluator.test.ts`
- **Steps:**
  1. RED: test `parsePolynomial("2x^2 - 5x + 1")` → `{ coefficients: [2, -5, 1] }`. Must fail.
  2. GREEN: implement tokenizer + parser for expanded form. Test passes.
  3. REFACTOR: extract `tokenizeExpanded()` helper.
- **Done when:** expanded-form tests green (≥4 variants: with/without variable, negatives, constants)
- **Risks:** unicode minus `−` vs `-`, superscript digits `²` vs `^2`
- **Estimated lines:** ~40 (code) + ~30 (tests) = ~70

### Task 1.4: parsePolynomial — factored form

- **Spec:** U2-POLY-002
- **Type:** domain code (strict TDD)
- **Files:** MODIFY: `polynomial-evaluator.ts`, `polynomial-evaluator.test.ts`
- **Steps:**
  1. RED: test `parsePolynomial("(x-2)(x+3)")` → `{ coefficients: [1, 1, -6] }`. Must fail.
  2. GREEN: implement factored parser (extract roots, multiply binomials). Test passes.
  3. REFACTOR: extract `multiplyBinomials()` helper.
- **Done when:** factored-form tests green (≥3 variants: commutativity, repeated roots, constant factors)
- **Estimated lines:** ~35 (code) + ~25 (tests) = ~60

### Task 1.5: expand to canonical form

- **Spec:** U2-POLY-004 (partial)
- **Type:** domain code (strict TDD)
- **Files:** MODIFY: `polynomial-evaluator.ts`, `polynomial-evaluator.test.ts`
- **Steps:**
  1. RED: test `expand(parsePolynomial("(x-2)(x-3)"))` → `{ coefficients: [1, -5, 6] }`. Must fail.
  2. GREEN: implement `expand()` using coefficient multiplication. Test passes.
  3. REFACTOR: ensure idempotency (`expand(expand(p)) === expand(p)`).
- **Done when:** expand tests green (products of binomios, constant scaling)
- **Estimated lines:** ~20 (code) + ~20 (tests) = ~40

### Task 1.6: polynomialsEqual + areEquivalent

- **Spec:** U2-POLY-004, U2-POLY-005, U2-POLY-010
- **Type:** domain code (strict TDD)
- **Files:** MODIFY: `polynomial-evaluator.ts`, `polynomial-evaluator.test.ts`
- **Steps:**
  1. RED: test `areEquivalent("(x-2)(x+3)", "x^2 + x - 6")` → `true`; `areEquivalent("x^2+x-6", "x^2+x+6")` → `false`. Must fail.
  2. GREEN: implement `polynomialsEqual` (compare coefficients) and `areEquivalent` (parse + expand + compare). Tests pass.
  3. REFACTOR: add tolerance for floating-point comparison if needed.
- **Done when:** equivalence tests green (≥3 scenarios including conmutatividad)
- **Estimated lines:** ~15 (code) + ~25 (tests) = ~40

### Task 1.7: Edge cases — zero poly, leading zeros, MAX_SAFE_INTEGER

- **Spec:** U2-POLY-008, U2-POLY-009
- **Type:** domain code (strict TDD)
- **Files:**
  - NEW: `src/domain/__tests__/polynomial-evaluator.edge-cases.test.ts`
- **Steps:**
  1. RED: write 7 edge-case tests (zero poly `[0]`, leading zeros `[0,0,3,1]→[3,1]`, MAX_SAFE_INTEGER, negatives, constant, linear). Must fail.
  2. GREEN: update `parsePolynomial` normalization to handle all cases. Tests pass.
  3. REFACTOR: no changes needed if 1.2 already handles normalization.
- **Done when:** all 7 edge-case tests green
- **Estimated lines:** ~10 (code fixes) + ~40 (tests) = ~50

### Task 1.8: Error model — parse errors + unsupported forms

- **Spec:** U2-POLY-006, U2-POLY-007
- **Type:** domain code (strict TDD)
- **Files:** MODIFY: `polynomial-evaluator.ts`, `polynomial-evaluator.test.ts`
- **Steps:**
  1. RED: test `parsePolynomial("x^2 + *3")` throws `PolynomialParseError` with position; `parsePolynomial("x*y + 3")` throws `UnsupportedPolynomialFormError("multivariate")`. Must fail.
  2. GREEN: add validation in parser for invalid tokens and multivariate detection. Tests pass.
  3. REFACTOR: ensure error messages are descriptive.
- **Done when:** error-model tests green (≥3 scenarios)
- **Estimated lines:** ~15 (code) + ~20 (tests) = ~35

### Task 1.9: Export from evaluator barrel

- **Spec:** U2-EVAL-001 (partial)
- **Type:** domain code
- **Files:** MODIFY: `src/domain/evaluator/index.ts` (add polynomial routing guard)
- **Steps:**
  1. RED: write test in `evaluator-index.test.ts` — exercise with `type: "symbolic"` + `skillId: "mat.u2.operaciones_polinomios"` routes to polynomial evaluator. Must fail.
  2. GREEN: add guard before switch: `if (exercise.type === "symbolic" && /^mat\.u2\./.test(exercise.skillId))` → delegate to `areEquivalent`. Tests pass.
  3. REFACTOR: extract `isPolynomialExercise()` helper.
- **Done when:** routing test green; all U1 evaluator tests still pass
- **Estimated lines:** ~15 (code) + ~20 (tests) = ~35

---

## PR-2: Content + Catalog Extensions

**Branch:** `feat/unit-2-content` → `main`
**Merge:** `--no-ff`
**Acceptance:** tasks 2.1–2.12 ✅, `pnpm run test` green, `pnpm run typecheck` clean
**Rollback:** `git revert --no-edit <merge-commit>`
**Depends on:** PR-1 (polynomial-evaluator types)

**Dependency order:** 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7 → 2.8 → 2.9 → 2.10 → 2.11 → 2.12

### Task 2.1: U2 error taxonomy — 6 tags

- **Spec:** U2-TAG-001, U2-TAG-002, U2-TAG-003, U2-TAG-004
- **Type:** domain data + tests (strict TDD)
- **Files:**
  - MODIFY: `src/domain/error-taxonomy/index.ts` (+6 entries)
  - MODIFY: `src/domain/__tests__/error-taxonomy.test.ts` (+assertions for u2_* tags)
- **Steps:**
  1. RED: add tests asserting 6 `u2_*` tags exist with metadata, no duplicates, filterable by unit 2. Must fail. ✅
  2. GREEN: add 6 tag entries to TAXONOMY array. Tests pass. ✅
  3. REFACTOR: verify tag ordering and descriptions. ✅
- **Done when:** `pnpm run test -- error-taxonomy` green ✅ (16/16)

### Task 2.2: U2 error tagging patterns

- **Spec:** U2-EVAL-004, U2-EVAL-005
- **Type:** domain code (strict TDD)
- **Files:**
  - MODIFY: `src/domain/evaluator/error-tagging.ts` (+6 `isU2*Error` functions + tag sets)
  - NEW: `src/domain/__tests__/evaluator-error-tagging-u2.test.ts`
- **Steps:**
  1. RED: write 12 tests (2 per tag: positive match + negative when not declared). Must fail.
  2. GREEN: implement 6 pattern functions + dispatch in `tagError()`. Tests pass.
  3. REFACTOR: extract shared helpers if patterns overlap.
- **Done when:** `pnpm run test -- evaluator-error-tagging-u2` green
- **Estimated lines:** ~50 (code) + ~60 (tests) = ~110

### Task 2.3: Theory content — unit-2.json

- **Spec:** U2-CAT-006 (partial)
- **Type:** content data
- **Files:** NEW: `content/matematica/theory/unit-2.json` (3 TheoryNodes)
- **Steps:**
  1. Create 3 TheoryNodes: `polinomios_basico` (caps 1-8), `operaciones_polinomios` (cap 9), `ruffini_resto` (caps 10-11).
  2. Each node: `skillId`, `concepts[]`, `canonicalTrace` referencing PDF pages.
  3. Verify JSON schema matches U1 theory format.
- **Done when:** JSON valid; `loadTheoryContent("unit-2")` returns 3 nodes
- **Estimated lines:** ~80

### Task 2.4: Worked examples — unit-2.json

- **Spec:** U2-CAT-006 (partial)
- **Type:** content data
- **Files:** NEW: `content/matematica/examples/unit-2.json` (4-6 WorkedExamples)
- **Steps:**
  1. Create ≥5 WorkedExamples: valor numérico, suma/resta, multiplicación, Ruffini, teorema del resto, división larga (worked only).
  2. Each: `skillId`, `solutionSteps[]`, `canonicalTrace`.
  3. Verify JSON schema matches U1 examples format.
- **Done when:** JSON valid; `loadExampleContent("unit-2")` returns ≥5 examples
- **Estimated lines:** ~70

### Task 2.5: Feedback mappings — unit-2.json

- **Spec:** U2-TAG-001 (partial)
- **Type:** content data
- **Files:** NEW: `content/matematica/feedback/unit-2.json` (6 FeedbackMappings)
- **Steps:**
  1. Create 1 FeedbackMapping per `u2_*` tag: `errorTag`, `type: "corrective"`, `message`, `recoveryTarget`.
  2. Verify JSON schema matches U1 feedback format.
- **Done when:** JSON valid; `loadFeedbackContent("unit-2")` returns 6 mappings
- **Estimated lines:** ~40

### Task 2.6: Exercises — polinomios_basico (4 new)

- **Spec:** U2-CAT-001, U2-CAT-002, U2-CAT-003, U2-CAT-004, U2-CAT-005
- **Type:** content data
- **Files:** MODIFY: `content/matematica/exercises.json` (+4 exercises)
- **Steps:**
  1. Add `ex.u2.polinomios_basico.{2-5}`: grado (MC), clasificación (MC), P(3) (numerical), completar ceros (symbolic/MC).
  2. Difficulty 1→3, each with `commonErrorTags` from `u2_*` set, `pedagogicalNote` referencing PDF.
  3. No free-text for polynomial answers.
- **Done when:** exercises load; shape tests pass
- **Estimated lines:** ~30

### Task 2.7: Exercises — operaciones_polinomios (4 new)

- **Spec:** U2-CAT-001 through U2-CAT-006
- **Type:** content data
- **Files:** MODIFY: `content/matematica/exercises.json` (+4 exercises)
- **Steps:**
  1. Add `ex.u2.operaciones_polinomios.{2-5}`: suma (MC), resta (MC), multiplicación (numerical), combinada (symbolic/MC).
  2. Difficulty 1→4, `commonErrorTags` include `u2_signo_operacion`, `u2_termino_semejante`.
- **Done when:** exercises load; shape tests pass
- **Estimated lines:** ~30

### Task 2.8: Exercises — ruffini_resto (4 new)

- **Spec:** U2-CAT-001 through U2-CAT-006
- **Type:** content data
- **Files:** MODIFY: `content/matematica/exercises.json` (+4 exercises)
- **Steps:**
  1. Add `ex.u2.ruffini_resto.{2-5}`: teorema del resto (numerical), cociente+resto (symbolic/MC), verificar raíz (MC), reconstruir (symbolic/MC).
  2. Difficulty 2→4, `commonErrorTags` include `u2_ruffini_signo_a`.
- **Done when:** exercises load; shape tests pass
- **Estimated lines:** ~30

### Task 2.9: Relocate ex.u2.gauss.1

- **Spec:** U2-CAT-007
- **Type:** content data fix
- **Files:** MODIFY: `content/matematica/exercises.json` (change skillId)
- **Steps:**
  1. Change `ex.u2.gauss.1` skillId from `mat.u2.gauss` to `mat.u3.sistemas`.
  2. Update any tests referencing the old skillId.
- **Done when:** `ex.u2.gauss.1.skillId === "mat.u3.sistemas"`; catalog tests pass
- **Estimated lines:** ~3 (data) + ~5 (test fixes) = ~8

### Task 2.10: Skill catalog dependencies

- **Spec:** U2-SKILL-001, U2-SKILL-002
- **Type:** domain data + tests (strict TDD)
- **Files:**
  - MODIFY: `src/domain/models/skill-catalog.ts` (+2 entries in SKILL_DEPENDENCIES)
  - NEW: `src/domain/__tests__/skill-catalog-u2-deps.test.ts`
- **Steps:**
  1. RED: write tests asserting gauss←ruffini_resto, mcm_mcd←factorizacion, no cycles, mcm_mcd not ready. Must fail.
  2. GREEN: add 2 dependency entries. Tests pass.
  3. REFACTOR: verify chain linearity.
- **Done when:** `pnpm run test -- skill-catalog-u2-deps` green
- **Estimated lines:** ~5 (data) + ~30 (tests) = ~35

### Task 2.11: Content loaders — register unit-2

- **Spec:** U2-CAT-007 (partial)
- **Type:** domain code (strict TDD)
- **Files:**
  - MODIFY: `src/domain/catalog/content-loaders.ts` (import + register unit-2 JSON)
  - MODIFY: `src/domain/__tests__/content-loaders.test.ts` (+unit-2 tests)
- **Steps:**
  1. RED: write tests for `loadTheoryContent("unit-2")`, `loadExampleContent("unit-2")`, `loadFeedbackContent("unit-2")`, `loadExercisesForSkill` for 3 U2 skills. Must fail.
  2. GREEN: add static imports + REGISTRY entries. Tests pass.
  3. REFACTOR: no changes needed.
- **Done when:** `pnpm run test -- content-loaders` green
- **Estimated lines:** ~15 (code) + ~30 (tests) = ~45

### Task 2.12: Exercise shape validation tests

- **Spec:** U2-CAT-001 through U2-CAT-007
- **Type:** tests
- **Files:** NEW: `src/domain/__tests__/exercises-u2-shape.test.ts`
- **Steps:**
  1. Write tests: 12 exercises exist, unique IDs, type distribution (6 MC + 3 num + 3 sym), difficulty progression per skill, no free-text, commonErrorTags non-empty, gauss.1 relocated.
  2. All tests must pass against content from tasks 2.6–2.9.
- **Done when:** `pnpm run test -- exercises-u2-shape` green
- **Estimated lines:** ~50

---

## PR-3: Integration + QA

**Branch:** `feat/unit-2-integration` → `main`
**Merge:** `--no-ff`
**Acceptance:** tasks 3.1–3.7 ✅, full suite green, GGA clean
**Rollback:** `git revert --no-edit <merge-commit>`
**Depends on:** PR-2

**Dependency order:** 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 3.7

### Task 3.1: U1 regression test

- **Spec:** U2-EVAL-009
- **Type:** verification
- **Files:** MODIFY: `src/domain/__tests__/evaluator-index.test.ts` (add regression describe block)
- **Steps:**
  1. Add explicit regression tests: all U1 evaluator patterns (numeric, exact, boolean, error-tagging) still pass after U2 changes.
  2. Run full suite — confirm no regressions.
- **Done when:** `pnpm run test` green with all U1 tests passing
- **Estimated lines:** ~15

### Task 3.2: Full verification gate

- **Type:** verification
- **Steps:**
  1. `pnpm run test` — all tests green (1117+ existing + ~80 new)
  2. `pnpm run typecheck` — clean
  3. `pnpm run build` — clean
- **Done when:** all three commands pass
- **Estimated lines:** 0

### Task 3.3: Pedagogical QA

- **Type:** manual review
- **Steps:**
  1. Cross-reference each TheoryNode with PDF canónico caps 1-11 (pages 3-9).
  2. Verify WorkedExamples match canonical solution methods.
  3. Verify error messages in feedback are pedagogically correct.
- **Done when:** no content errors found
- **Estimated lines:** 0

### Task 3.4: GGA pre-commit review

- **Type:** quality gate
- **Steps:**
  1. Run GGA on all modified/new files.
  2. Fix any flagged issues.
- **Done when:** GGA clean
- **Estimated lines:** 0

### Task 3.5: Update AGENTS.md if needed

- **Type:** documentation (conditional)
- **Steps:**
  1. Review if new conventions emerged during implementation.
  2. Update AGENTS.md only if needed (usually no for content slices).
- **Done when:** AGENTS.md reflects current state
- **Estimated lines:** 0–5

### Task 3.6: Branch audit

- **Type:** housekeeping
- **Steps:**
  1. `pnpm run audit:branches` — informational, no zombies expected.
- **Done when:** audit clean
- **Estimated lines:** 0

### Task 3.7: Archive + STATUS.json update

- **Type:** SDD housekeeping
- **Steps:**
  1. Update `openspec/changes/STATUS.json`: `unit-2-pedagogical-slice` → `status: "done"`, `branch: null`, `mergedTo: "main"`.
  2. Archive specs to `openspec/changes/archive/`.
- **Done when:** STATUS.json updated; archive complete
- **Estimated lines:** ~10

---

## Verification Matrix

| Task | Spec Scenarios | Test File(s) | Done When |
|------|---------------|--------------|-----------|
| 1.1 | U2-POLY-006, 007 | `polynomial-evaluator.test.ts` | `pnpm run test -- polynomial-evaluator` |
| 1.2 | U2-POLY-003, 009 | `polynomial-evaluator.test.ts` | array-form tests green |
| 1.3 | U2-POLY-001 | `polynomial-evaluator.test.ts` | expanded-form tests green |
| 1.4 | U2-POLY-002 | `polynomial-evaluator.test.ts` | factored-form tests green |
| 1.5 | U2-POLY-004 | `polynomial-evaluator.test.ts` | expand tests green |
| 1.6 | U2-POLY-004, 005, 010 | `polynomial-evaluator.test.ts` | equivalence tests green |
| 1.7 | U2-POLY-008, 009 | `polynomial-evaluator.edge-cases.test.ts` | edge-case tests green |
| 1.8 | U2-POLY-006, 007 | `polynomial-evaluator.test.ts` | error-model tests green |
| 1.9 | U2-EVAL-001, 002 | `evaluator-index.test.ts` | routing test green; U1 tests pass |
| 2.1 | U2-TAG-001..004 | `error-taxonomy.test.ts` | u2_* tag assertions green |
| 2.2 | U2-EVAL-004, 005 | `evaluator-error-tagging-u2.test.ts` | 12 pattern tests green |
| 2.3 | U2-CAT-006 | `content-loaders.test.ts` | theory loads (3 nodes) |
| 2.4 | U2-CAT-006 | `content-loaders.test.ts` | examples load (≥5) |
| 2.5 | U2-TAG-001 | `content-loaders.test.ts` | feedback loads (6 mappings) |
| 2.6 | U2-CAT-001..005 | `exercises-u2-shape.test.ts` | polinomios_basico exercises valid |
| 2.7 | U2-CAT-001..006 | `exercises-u2-shape.test.ts` | operaciones_polinomios exercises valid |
| 2.8 | U2-CAT-001..006 | `exercises-u2-shape.test.ts` | ruffini_resto exercises valid |
| 2.9 | U2-CAT-007 | `exercises-u2-shape.test.ts` | gauss.1 relocated |
| 2.10 | U2-SKILL-001, 002 | `skill-catalog-u2-deps.test.ts` | dependency tests green |
| 2.11 | U2-CAT-007 | `content-loaders.test.ts` | unit-2 loader tests green |
| 2.12 | U2-CAT-001..007 | `exercises-u2-shape.test.ts` | all shape tests green |
| 3.1 | U2-EVAL-009 | `evaluator-index.test.ts` | full suite green |
| 3.2 | — | — | test + typecheck + build green |

---

## Commit Strategy

Follow `work-unit-commits` skill: one commit per logical work unit. Each commit must pass `pnpm run test` and `pnpm run typecheck`.

**PR-1 commits (expected 4–6):**
1. `feat(domain): add polynomial types and error classes`
2. `feat(domain): implement parsePolynomial for array, expanded, and factored forms`
3. `feat(domain): implement expand and polynomial equivalence`
4. `test(domain): add polynomial evaluator edge cases and error model tests`
5. `feat(domain): route U2 symbolic exercises to polynomial evaluator`

**PR-2 commits (expected 6–8):**
1. `feat(taxonomy): add 6 u2_* error tags for polynomial misconceptions`
2. `feat(domain): add U2 error tagging patterns in error-tagging.ts`
3. `feat(content): add unit-2 theory, examples, and feedback JSON`
4. `feat(content): add 12 U2 exercises for polinomios, operaciones, ruffini`
5. `fix(content): relocate ex.u2.gauss.1 to mat.u3.sistemas`
6. `feat(domain): add U2 skill dependencies and content loader registration`

**PR-3 commits (expected 2–3):**
1. `test(domain): add U1 regression guard for evaluator chain`
2. `chore(sdd): mark unit-2-pedagogical-slice done, update STATUS.json`

---

## PR Boundaries

### PR-1: Domain Module

- **Branch:** `feat/unit-2-domain`
- **Base:** `main`
- **Merge:** `git merge --no-ff feat/unit-2-domain`
- **Title:** `feat(domain): add polynomial evaluator module with TDD`
- **Acceptance:** tasks 1.1–1.9 ✅
- **Rollback:** `git revert --no-edit <merge-commit>`

### PR-2: Content + Catalog

- **Branch:** `feat/unit-2-content`
- **Base:** `main` (stacked-to-main)
- **Merge:** `git merge --no-ff feat/unit-2-content`
- **Title:** `feat(content): add U2 theory, examples, feedback, exercises, and catalog extensions`
- **Acceptance:** tasks 2.1–2.12 ✅
- **Rollback:** `git revert --no-edit <merge-commit>`

### PR-3: Integration + QA

- **Branch:** `feat/unit-2-integration`
- **Base:** `main` (stacked-to-main)
- **Merge:** `git merge --no-ff feat/unit-2-integration`
- **Title:** `chore(sdd): integrate U2 slice, regression guard, archive`
- **Acceptance:** tasks 3.1–3.7 ✅
- **Rollback:** `git revert --no-edit <merge-commit>`
