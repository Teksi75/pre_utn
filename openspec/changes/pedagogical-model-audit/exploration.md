# Exploration: pedagogical-model-audit

> **Status:** Complete
> **Date:** 2026-05-31
> **Depends on:** All existing specs and pedagogy docs (01-09)

---

## 1. Executive Summary

The app has a comprehensive pedagogical vision documented across 9 spec files but a thin implementation. The domain layer is clean and testable, but the exercise model diverges from the spec, the evaluator supports only 1 of 12 error patterns, no learning path or recommendation engine exists, and 4 of 6 work modes are unimplemented. The gap between vision and reality is structural, not cosmetic.

---

## 2. Current Pedagogical Model — What Exists vs What's Designed

### 2.1 Work Modes (spec 03 defines 6, app implements 2)

| Mode | Spec Status | Implementation | Gap |
|------|-------------|----------------|-----|
| A. Diagnóstico inicial | Defined (10-15 exercises, skill levels, recommended start) | Shell: balanced selection → accuracy estimation → suggestions | No persistence, no skill levels, no recommended start unit |
| B. Práctica por unidad | Defined (follow class order, interleave prerequisites) | Not implemented | Student can only pick skills, not units |
| C. Práctica por habilidad | Defined (pick a specific skill) | Working: select skill → exercise → feedback | No prerequisite enforcement, no progression |
| D. Repaso inteligente | Defined (system decides what to review) | Not implemented | No recommendation engine |
| E. Simulacro de examen | Defined (10 problems, no feedback until end) | Not implemented | No exam mode |
| F. Revisión de errores | Defined (patterns, not just failed exercises) | Not implemented | No error pattern tracking |

### 2.2 Learning Path — Non-Existent

The spec defines:
- 6 units with sequential progression
- 44 skills with 17 prerequisite dependencies
- Difficulty escalation by evidence (not calendar)
- Spaced review for mastered skills
- Diagnostic → practice → mastery → review cycle

**Implemented**: Nothing. Student picks any skill freely. No prerequisites checked. No mastery tracking. No progression.

### 2.3 Diagnostic — Minimal

**Spec defines**: 10-15 exercises, skill levels (not_attempted/weak/developing/solid/mastered), recommended start unit with reason.

**Implemented**: `selectBalancedSet` picks 2 exercises per unit (12 total). `estimateSkills` computes accuracy per skill. `suggestPractice` returns skills below 70% threshold. No persistence. No skill levels. No recommended start. No time analysis.

### 2.4 Feedback Quality — Tag Only

**Spec 04 defines 5 feedback types**: Correctivo, Conceptual, Procedimental, Metacognitivo, Motivacional.

**Implemented**: `FeedbackDisplay` shows "Correcto" or error tag name. No corrective hints. No conceptual explanations. No procedural guidance. No metacognitive prompts. No motivational messages.

---

## 3. Question/Answer Model — Structural Divergence

### 3.1 Exercise Type Mismatch

**Spec 07 defines 9 types**:
`multiple_choice`, `numeric`, `rational`, `interval`, `complex`, `equation_solution_set`, `line_equation`, `function_analysis`, `photo`

**Implementation defines 9 different types**:
`multiple-choice`, `true-false`, `numerical`, `symbolic`, `fill-blank`, `matching`, `ordering`, `free-response`, `graphical`

**Overlap**: only `multiple-choice` and `numerical`/`numeric`.

**Missing from implementation**: `rational`, `interval`, `complex`, `equation_solution_set`, `line_equation`, `function_analysis`, `photo`.

**Added in implementation**: `true-false`, `symbolic`, `fill-blank`, `matching`, `ordering`, `free-response`, `graphical`.

### 3.2 AnswerPayload Not Implemented

Spec 07 defines `AnswerPayload` as a discriminated union:
```ts
type AnswerPayload =
  | { type: 'multiple_choice'; value: 'A' | 'B' | 'C' | 'D' | 'E' }
  | { type: 'numeric'; value: string; tolerance?: number }
  | { type: 'rational'; numerator: string; denominator: string }
  | { type: 'interval'; value: string }
  | { type: 'complex'; real: string; imaginary: string }
  | { type: 'equation_solution_set'; solutions: string[]; allowUnordered: boolean }
  | { type: 'line_equation'; value: string; form?: 'slope_intercept' | 'general' | 'point_slope' }
  | { type: 'function_analysis'; domain?: string; image?: string; zeros?: string[]; ... }
  | { type: 'photo'; storagePath: string }
```

**Implementation**: `expectedAnswer: string` — a flat string for all types.

### 3.3 Forced Mismatch Example

Exercise `ex.u1.intervalos.1`:
- Prompt: "¿Qué intervalo representa x > 3?"
- Type: `multiple-choice`
- Expected: `"(3, ∞)"`

This works as multiple-choice but the student can't type interval notation. The spec envisions interval exercises where the student enters interval notation directly. The current implementation forces interval questions into multiple-choice.

### 3.4 Evaluator Coverage

| Type | Spec evaluator rule | Implementation |
|------|-------------------|----------------|
| multiple-choice | Compare option | ✅ Exact match |
| numeric | Compare with tolerance | ✅ Numeric tolerance |
| rational | Simplify and compare fractions | ❌ Not implemented |
| interval | Normalize notation and compare | ❌ Not implemented |
| complex | Compare real and imaginary | ❌ Not implemented |
| equation_solution_set | Compare solution sets unordered | ❌ Not implemented |
| line_equation | Normalize to general form | ❌ Not implemented |
| function_analysis | Compare fields with partial credit | ❌ Not implemented |
| photo | Manual review only | ❌ Not implemented (no photo type) |

---

## 4. Error Taxonomy — Thin Implementation

### 4.1 Taxonomy vs Evaluator

**Taxonomy** (`src/domain/error-taxonomy/index.ts`): 12 tags, 2 per unit, with descriptions and examples.

**Evaluator** (`src/domain/evaluator/error-tagging.ts`): 1 pattern matcher — sign errors only (detects `|expected| === |student|` with sign flip). Uses 3 of 12 tags: `u1_signo_racionalizacion`, `u2_signo_al_mover`, `u3_signo_desigualdad`.

**9 taxonomy tags have no matching pattern**:
- `u1_orden_operaciones` — no order-of-operations detection
- `u2_aislamiento_variable` — no variable isolation detection
- `u3_direccion_desigualdad` — no inequality direction detection
- `u4_formula_area` — no formula error detection
- `u4_suma_angulos` — no angle sum detection
- `u5_cuadrante_angulo` — no quadrant detection
- `u5_identidad_pitagorica` — no identity detection
- `u6_dominio_funcion` — no domain restriction detection
- `u6_rango_funcion` — no range detection

### 4.2 Feedback is Generic

When an error tag IS matched, the UI shows the tag ID (e.g., "u1_signo_racionalizacion"). No corrective message, no conceptual explanation, no hint about what to review.

---

## 5. Metrics and Progress Tracking — Non-Existent

### 5.1 What Spec 09 Defines

```ts
interface StudentMetrics {
  globalAccuracyRatio: number;
  readiness: 'not_ready' | 'developing' | 'almost_ready' | 'ready';
  currentUnit: number;
  skillMetrics: SkillMetric[];
  unitMetrics: UnitMetric[];
  frequentErrors: FrequentError[];
}
```

### 5.2 What's Implemented

Nothing. No `SkillMetric` computation. No `UnitMetric` computation. No `readiness` calculation. No `frequentErrors` tracking. No persistence of attempts across sessions.

The diagnostic produces `SkillEstimate[]` but this is discarded when the page unmounts.

### 5.3 What Spec 08 Defines (Recommendations)

10 recommendation actions:
`start_diagnostic`, `continue_current_unit`, `similar_practice`, `lower_difficulty`, `worked_example`, `smart_review`, `spaced_review`, `exam_focus`, `exam_simulation`, `teacher_review`, `assigned_task`

**Implemented**: 0 of 10.

---

## 6. Content Catalog — Thin but Valid

### 6.1 Coverage

30 exercises across 6 units (5 per unit). Minimum viable.

### 6.2 Issues

- No difficulty calibration against real student data
- No exercise variety per skill (most skills have 1 exercise)
- `pedagogicalNote` exists but isn't surfaced to students
- No `sourceReference` to canonical material
- Some exercises have empty `commonErrorTags` despite having plausible error patterns

### 6.3 Canonical Material Gap

The `canonical-math-pedagogy-map` exploration found:
- 14 math PDFs available (6 units + exams + resolutions + diagnostics)
- `content/matematica/` is empty except for `exercises.json`
- No extraction pipeline from canonical material to exercise catalog
- Difficulty calibration against real results (U1 guide, diagnostic) not done

---

## 7. Architectural Assessment

### 7.1 What's Good

- **Domain purity**: `src/domain/` has zero framework imports. Clean hexagonal boundary.
- **Test coverage**: 168 tests passing. TDD discipline is real.
- **Type safety**: Strict TypeScript, discriminated unions, no `any`.
- **Validation**: Every model has a `validate*` function that returns `Result<T, E>`.
- **Catalog validation**: Cycles detection, coverage checks, error tag reference validation.
- **Diagnostic selection**: Deterministic, balanced across units.

### 7.2 What's Missing

| Component | Status | Priority |
|-----------|--------|----------|
| Learning path (units, skills, prerequisites, progression) | Not implemented | CRITICAL |
| Recommendation engine | Not implemented | HIGH |
| Metrics computation | Not implemented | HIGH |
| Persistence (attempts, progress, sessions) | Not implemented | HIGH |
| Feedback generation (5 types from spec 04) | Not implemented | MEDIUM |
| Error pattern matching (12 tags, 1 pattern) | Minimal | MEDIUM |
| Exam simulation mode | Not implemented | MEDIUM |
| Error review mode | Not implemented | LOW |
| Teacher dashboard | Not implemented | LOW |
| AnswerPayload (structured answers) | Not implemented | MEDIUM |
| Exercise type alignment (spec 07 vs implementation) | Diverged | MEDIUM |

---

## 8. Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Exercise type divergence causes confusion | Medium | High | Resolve early: keep implementation types or align to spec 07 |
| No persistence blocks meaningful metrics | High | Certain | Add localStorage or Supabase before metrics work |
| Error tagging too thin for useful feedback | Medium | High | Add 3-5 more pattern matchers incrementally |
| No prerequisite enforcement allows skill skipping | Medium | Medium | Add prerequisite check in practice flow |
| 30 exercises insufficient for adaptive practice | Medium | High | Expand catalog to 60+ with difficulty variants |
| Recommendation engine complexity | High | Medium | Start with 3-4 rules, expand iteratively |

---

## 9. Recommended Next Steps

### Phase 1: Foundation Fixes (1-2 changes)
1. **Resolve exercise type divergence** — Keep implementation types (they're more practical for MVP) but add `interval` and `complex` types with evaluators
2. **Add localStorage persistence** — Store attempts, skill metrics, session history

### Phase 2: Learning Architecture (2-3 changes)
3. **Learning path module** — Unit progression, prerequisite enforcement, mastery tracking
4. **Recommendation engine v1** — 4-5 core rules: diagnostic → practice → review → difficulty adjustment
5. **Metrics computation** — SkillMetric, UnitMetric, readiness calculation

### Phase 3: Feedback and Error Intelligence (1-2 changes)
6. **Feedback generator** — Map error tags to corrective/conceptual/procedural messages
7. **Error pattern expansion** — Add 3-5 more pattern matchers for common errors

### Phase 4: Advanced Modes (2-3 changes)
8. **Exam simulation** — 10 problems, no feedback until end, skill breakdown
9. **Smart review** — Spaced repetition, error-focused practice
10. **Error review mode** — Pattern visualization, repeated error tracking

---

## 10. Ready for Proposal

**Yes** — the orchestrator should:
1. Confirm whether to keep implementation exercise types or align to spec 07 AnswerPayload
2. Decide persistence approach (localStorage MVP vs Supabase)
3. Launch `sdd-propose` for Phase 1 (foundation fixes) as the first change

---

## SDD Result Envelope

**Status**: success
**Summary**: Deep audit of pedagogical model reveals comprehensive vision (9 spec docs) but thin implementation (2 of 6 work modes, no learning path, no recommendations, no metrics, minimal error tagging). Exercise model diverges from spec. Domain layer is clean and testable. Recommended approach: layered MVP extension preserving working code.
**Artifacts**: Engram `sdd/pedagogical-model-audit/explore` | `openspec/changes/pedagogical-model-audit/exploration.md`
**Next**: sdd-propose (define scope for foundation fixes)
**Risks**: Exercise type divergence, no persistence, thin error tagging, no prerequisite enforcement
**Skill Resolution**: paths-injected — 2 skills (cognitive-doc-design, _shared)
