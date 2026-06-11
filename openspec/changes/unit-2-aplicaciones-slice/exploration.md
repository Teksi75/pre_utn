# Exploration: unit-2-aplicaciones-slice

> **Status:** Complete
> **Date:** 2026-06-10
> **Depends on:** unit-2-factorizacion-slice (archived), unit-2-pedagogical-slice (archived), polynomial-evaluator-input-validation (archived)

---

## Current State

### U2 chain status
The U2 main chain is fully implemented across two prior slices:

```
polinomios_basico → operaciones_polinomios → ruffini_resto → factorizacion → gauss
                                                                       ↓
                                                         mcm_mcd_polinomios (EMPTY)
                                                         ecuaciones_fraccionarias (EMPTY)
```

- **23 U2 exercises** across 5 skills: 5 polinomios_basico, 5 operaciones_polinomios, 4 ruffini_resto, 4 factorizacion, 4 gauss
- **0 exercises** for mcm_mcd_polinomios and ecuaciones_fraccionarias
- **SKILL_DEPENDENCIES** already declares both as depending on `mat.u2.factorizacion` (lines 117-118 of skill-catalog.ts)
- **8 u2_* error tags** in taxonomy: u2_signo_operacion, u2_termino_semejante, u2_ruffini_signo_a, u2_grado_incorrecto, u2_termino_faltante, u2_factorizacion_incompleta, u2_signo_factorizacion, u2_caso_incorrecto
- **7 error tag detectors** for U2 in error-tagging.ts: isU2LikeTermError, isU2RuffiniSignoAError, isU2DegreeError, isU2MissingTermError, isU2IncompleteFactorError, isU2SignoFactorizacionError, isU2CasoIncorrectoError

### Infrastructure available (reuse, no new domain modules needed)

| Component | File | Reuse for this slice |
|---|---|---|
| polynomial-evaluator | `src/domain/evaluator/polynomial-evaluator.ts` | ✅ REUSE. Both skills produce polynomial/factored answers. Symbolic type exercises route through `areEquivalent()`. |
| gauss-routing-helper | `src/domain/evaluator/gauss-routing-helper.ts` | ✅ REUSE for numerical root comparison if needed for domain checking in ecuaciones. |
| evaluator routing guard | `src/domain/evaluator/index.ts` line 83 | ✅ REUSE. The guard `exercise.type === "symbolic" && /^mat\.u2\./.test(exercise.skillId)` already covers all U2 skills. |
| evaluator gauss numerical guard | `src/domain/evaluator/index.ts` line 67 | ✅ REUSE. `mat.u2.gauss` with type numerical already routes through gauss-routing-helper. |
| content-loaders | `src/domain/catalog/content-loaders.ts` | ✅ REUSE. REGISTRY already wired for unit-2 theory/examples/feedback. |
| theory/unit-2.json | `content/matematica/theory/unit-2.json` | ⚠️ EXTEND. Currently 5 TheoryNodes (polinomios_basico, operaciones_polinomios, ruffini_resto, factorizacion, gauss). Need 2 more. |
| examples/unit-2.json | `content/matematica/examples/unit-2.json` | ⚠️ EXTEND. Currently 10 WorkedExamples. Need 4–6 new. |
| feedback/unit-2.json | `content/matematica/feedback/unit-2.json` | ⚠️ EXTEND. Currently 7 FeedbackMappings. Need 2–4 new. |

---

## Affected Areas

- `content/matematica/exercises.json` — add 6–10 exercises (3–5 for mcm_mcd + 3–5 for ecuaciones_fraccionarias)
- `content/matematica/theory/unit-2.json` — add 2 TheoryNodes (mcm_mcd + ecuaciones_fraccionarias)
- `content/matematica/examples/unit-2.json` — add 4–6 WorkedExamples (2–3 per skill)
- `content/matematica/feedback/unit-2.json` — add 2–4 FeedbackMappings for new error tags if created
- `src/domain/error-taxonomy/index.ts` — add 1–2 error tags (e.g., `u2_denominador_cero` for domain exclusion violations)
- `src/domain/evaluator/error-tagging.ts` — add 1–2 detectors for new tags
- `src/domain/__tests__/` — add test files for new detectors and exercise shape tests
- `src/domain/models/skill-catalog.ts` — NO CHANGE (deps already declared)

### Files that MUST NOT change

| File | Reason |
|---|---|
| `src/domain/evaluator/polynomial-evaluator.ts` | Stable, bug-fixed (1342 tests). No new polynomial forms needed. |
| `src/domain/evaluator/index.ts` | Routing guards already cover all U2 skills. |
| `src/domain/evaluator/gauss-routing-helper.ts` | Stable. Only reused, not modified. |
| `src/domain/catalog/content-loaders.ts` | REGISTRY already wired; only JSON content extends. |

---

## Topic-by-topic analysis

### mat.u2.mcm_mcd_polinomios — MCM/MCD de polinomios

**Canonical reference**: Capítulo 14 (págs. 14-15) of UNIDAD2_matemática.pdf — "Mínimo común múltiplo y máximo común divisor de polinomios".

**Definition**:
- **MCD**: producto de los factores comunes con su menor exponente
- **MCM**: producto de los factores comunes y no comunes con su mayor exponente

**Prerequisite**: `mat.u2.factorizacion` — the student must first factor each polynomial, then extract common/uncommon factors with min/max exponent rules.

**Exercise types**:
- **multiple-choice**: Given 2–3 factorized polynomials, choose the correct MCM/MCD from options
- **symbolic**: Write the MCM/MCD as a product; polynomial-evaluator verifies equivalence
- **numerical**: For simple cases, ask for the coefficient or a specific factor

**Evaluation**: Both MC and symbolic exercises route through the existing evaluator infrastructure — no new domain code needed:
- MC exercises: exact string match against options
- Symbolic exercises: polynomial-evaluator via the U2 guard (expands and compares coefficients)

**Key pedagogical points**:
- MCD is about COMMON factors only (no non-common factors)
- MCM includes ALL factors, common and non-common
- The rules parallel those for integers but applied to polynomial factors
- Error cases: confusing MCD with MCM, forgetting a factor, choosing wrong exponent

### mat.u2.ecuaciones_fraccionarias — Ecuaciones fraccionarias

**Canonical reference**: Capítulo 15 (págs. 15-16) of UNIDAD2_matemática.pdf — "Ecuaciones fraccionarias".

**Definition**: Equations where the variable appears in a denominator. Solving involves:
1. Determine domain restrictions (denominators ≠ 0, solve for excluded values)
2. Clear denominators by multiplying both sides by the MCM of all denominators
3. Solve the resulting polynomial equation
4. Verify solutions are not excluded by domain restrictions

**Prerequisite**: `mat.u2.factorizacion` — needed to factor denominators, find MCM, and solve resulting polynomial equations.

**Exercise types**:
- **numerical**: Solve and give x = value (with domain already checked by the student)
- **multiple-choice**: Choose the correct solution set (with distractors including excluded values)
- **symbolic**: Write the factored solution expression (polynomial-evaluator)

**Critical design constraint — domain checking**:
For numerical exercises, the expected answer is a single x value. But the exercise must verify the student hasn't given an excluded value. There are two approaches:

1. **MC-based**: Use multiple-choice for domain-sensitive equations. Distractors include the "excluded value" as a trap. This doesn't require new domain code — the correct answer is simply the option without the excluded value.

2. **Numerical single-solution**: For equations with exactly one non-excluded solution, use numerical type. The exercise design ensures that if the student gives the excluded value, the equation prompt forces them to recognize it (no evaluator-level domain check needed).

**Recommendation**: Use MC for exercises where domain exclusions are the pedagogical focus. Use numerical for equations where the domain restriction is simple and the solution is unambiguous. NO new evaluator module needed for domain checking at this stage — exercise design handles it.

**Potential error tag**: `u2_denominador_cero` — student gives a solution that makes a denominator zero. Detectable in MC exercises if the selected option matches an excluded value pattern. For numerical, the evaluator can't detect this without extra context, so rely on MC distractors.

---

## Approaches

### Approach A: Domain code minimal — MC-heavy with no new evaluators (RECOMMENDED)

**Description**: Both skills are implemented entirely via content (theory, examples, feedback, exercises). No new domain evaluator modules. All evaluation uses existing MC and symbolic routes. Domain checking for ecuaciones is handled via MC distractors.

| Pros | Cons | Complexity |
|------|------|------------|
| Zero new domain code — pure content work | Less automated error detection for domain violations | **Low** |
| Reuses all existing infrastructure | Ecuaciones MC exercises may feel "easier" than free-response | |
| Fastest path to completion (2 PRs) | Domain checking isn't automated beyond MC distractors | |
| Follows exactly the factorizacion-slice pattern | | |

**Estimated diff**: ~500–700 lines (2 PRs: domain/taxonomy + content/integration)

### Approach B: Add domain check for ecuaciones_fraccionarias

**Description**: Create an `ecuaciones-fraccionarias-evaluator.ts` in `src/domain/evaluator/` that: (a) parses the exercise's domain exclusions (a new `excludedValues` field on exercises), (b) checks the student's answer against excluded values, (c) returns `correct: false` with a specific error tag. Add a routing guard for `mat.u2.ecuaciones_fraccionarias` + `numerical` type.

| Pros | Cons | Complexity |
|------|------|------------|
| Automated domain checking for numerical exercises | New domain module + tests (~150 lines) | **Medium** |
| Catches excluded-value errors programmatically | Changes Exercise model or adds metadata field | |
| Better pedagogical feedback | More files to maintain | |

**Estimated diff**: ~800–1000 lines (2–3 PRs: domain evaluator + taxonomy + content + integration)

### Approach C: Single-skill slices (mcm_mcd only first)

**Description**: Split into two separate changes: first `mcm_mcd_polinomios`, then `ecuaciones_fraccionarias` in a later slice.

| Pros | Cons | Complexity |
|------|------|------------|
| Each slice is smaller, lower review risk | 2 full SDD cycles (2× proposal, spec, design, tasks, apply, verify, archive) | **Low per slice** |
| | mcm_mcd is pedagogically simpler and could feel "thin" alone | |
| | ecuaciones depends on mcm_mcd for clearing denominators | |

**Verdict**: Rejected. The overhead of 2 SDD cycles outweighs the benefit. These are the last 2 U2 skills and form a natural pair.

---

## Recommendation

**Approach A — Domain code minimal, MC-heavy.** 

Rationale:
1. The polynomial-evaluator and gauss-routing-helper already handle all evaluation paths needed for both skills. No new domain evaluator modules are required.
2. The factorizacion-slice established a proven 2-PR pattern (domain extension + content + integration/QA) that this slice can replicate directly.
3. MCM/MCD answers are polynomial products — symbolic type with polynomial-evaluator verification handles this perfectly.
4. Ecuaciones domain checking is pedagogically better handled via MC distractors (teaching the student to recognize excluded values) than via automated rejection. The exercise DESIGN enforces the domain check, not the evaluator.
5. Estimated ~500–700 lines diff, well within the 2-PR budget.

**Error tag proposal**: 1–2 new tags:
- `u2_denominador_cero`: student selects/suggests a solution that makes a denominator zero (detectable in MC via distractor matching)
- `u2_confunde_mcm_mcd`: student confuses MCM with MCD or vice versa (MC-based detection)

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Domain checking for ecuaciones is weak without evaluator support**: a student could enter an excluded value as numerical answer and the evaluator wouldn't catch it. | **Medium** | Use MC for exercises where domain exclusion is the learning objective. Use numerical only when there's a single unambiguous solution and the denominator zero-case is pedagogically obvious. |
| **mcm_mcd exercises may feel repetitive**: the skill is thin — factor, then pick min/max exponents. 3–4 exercises may feel like enough. | **Low** | Vary exercise types (MC for MCD, symbolic for MCM) and polynomial complexity to keep engagement. |
| **Ecuaciones fraccionarias complexity**: equations with multiple denominators, quadratic results, or two solutions can be tricky to design as MC without giving away the answer. | **Medium** | Start with 3 simple equations (1 denominator, linear result) and 1–2 complex ones. Numerical type for single-solution equations. |
| **Volume of new JSON content**: 2 TheoryNodes + 4–6 WorkedExamples + 2–4 FeedbackMappings + 6–10 exercises. The factorizacion-slice handled similar volume. | **Low** | Content creation is well-practiced from prior slices. |

---

## Ready for Proposal

**Yes** — The exploration is sufficient to launch `sdd-propose`. Both skills are well-understood, the infrastructure is in place, and the 2-PR pattern from the factorizacion-slice provides a proven template.

The orchestrator should:
1. Confirm scope: `mat.u2.mcm_mcd_polinomios` + `mat.u2.ecuaciones_fraccionarias` in a single slice
2. Confirm approach: domain-code-minimal (Approach A) with MC-based domain checking for ecuaciones
3. Confirm error tags: `u2_denominador_cero` and `u2_confunde_mcm_mcd` (or alternatives)
4. Confirm exercise volume: 3–5 per skill (6–10 total)
5. Confirm delivery: 2 chained PRs (domain extension + content + integration/QA)
6. Launch `sdd-propose` with this exploration as context

---

## SDD Result Envelope

**Status**: success
**Summary**: Both `mcm_mcd_polinomios` and `ecuaciones_fraccionarias` build on the completed U2 factorization infrastructure. No new domain evaluator modules are needed — the polynomial-evaluator and existing routing guards handle all evaluation paths. MCM/MCD answers are polynomial products verified via symbolic equivalence. Ecuaciones fraccionarias domain checking is handled through MC distractors rather than automated evaluator logic, keeping the implementation light. The proven 2-PR pattern from the factorizacion-slice maps directly onto this work. Estimated 500–700 lines diff, 1–2 new error tags, 6–10 exercises, 2 TheoryNodes, 4–6 WorkedExamples, and 2–4 FeedbackMappings.
**Artifacts**: `openspec/changes/unit-2-aplicaciones-slice/exploration.md` | Engram `sdd/unit-2-aplicaciones-slice/explore`
**Next**: sdd-propose
**Risks**: (1) MEDIUM — domain checking for ecuaciones_fraccionarias numerical exercises is not automated; relies on MC distractors; (2) LOW — mcm_mcd may feel thin with only 3–4 exercises.
**Skill Resolution**: paths-injected — 2 skills (sdd-explore, _shared)
