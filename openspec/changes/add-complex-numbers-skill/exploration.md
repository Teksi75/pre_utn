## Exploration: Add Complex Numbers as Unit 1 Pilot Skill

### Current State

The codebase has **44 math skills** defined across 6 units. Seven are currently activated as **pilot skills** in Unit 1: `conjuntos_numericos` through `logaritmos`. Each pilot skill has the full content pipeline: theory, worked examples, exercises, feedback mappings, and error taxonomy tags.

**`mat.u1.complejos`** is fully declared in the skill catalog infrastructure:
- Listed in `UNIT_1_SKILLS` and `ALL_SKILLS` (skill-catalog.ts:19)
- Has dependency `{ skillId: "mat.u1.complejos", prerequisites: ["mat.u1.reales_operaciones"] }` (skill-catalog.ts:111)
- Exists in `KNOWN_SKILL_IDS` for validation (skill-catalog.ts:96)
- `mat.u5.complejos_forma_polar` depends on it: `prerequisites: ["mat.u1.complejos", "mat.u5.radianes"]` (skill-catalog.ts:127)
- Math theme "complex" (blue color scheme) and topic map `["complejos", "complejo", "complex"] → "complex"` already exist (topic-map.ts:13)
- Conventions doc references ℂ in the number set family (conventions.md)

**But it is deliberately excluded from the pilot**:
- NOT in `PILOT_SKILLS` array (pilot-skills.ts:9-45)
- Tests confirm it returns `ready: false` with missing `theory`, `examples`, `exercises`, `feedback` components (catalog-readiness.test.ts:80-113)
- Listed as a "downstream not-ready skill" in recommendation safety tests (catalog-readiness.test.ts:148-155)
- **Zero content exists**: no theory, no examples, no exercises, no feedback, no error tags

The catalog validation test (`catalog.test.ts:42`) already includes `mat.u1.complejos` in the known skill IDs set, and the unit coverage requirement (≥5 per unit) is met by exercises from other skills in Unit 1.

### Affected Areas

- **`src/domain/catalog/pilot-skills.ts`** — Must add `mat.u1.complejos` entry with `unitKey: "unit-1"` and its label. This activates the skill in the learn/practice flow.
- **`src/domain/error-taxonomy/index.ts`** — Must add ~6-8 error tags (u1_complejo_*) for common complex number misconceptions.
- **`content/matematica/theory/unit-1.json`** — Must add a TheoryNode with 8-12 concepts covering: imaginary unit i, standard form a+bi, real/imaginary parts, equality, addition/subtraction (combined separately), multiplication (distributive + i²=-1), complex conjugate, division, and powers of i.
- **`content/matematica/examples/unit-1.json`** — Must add ≥5 WorkedExample objects for complex number operations.
- **`content/matematica/exercises.json`** — Must add ≥12 exercises with types `multiple-choice`, `true-false`, `numerical`. Free-form `a+bi` text input is PROHIBITED by AGENTS.md. Numerical exercises can ask for real or imaginary part separately.
- **`content/matematica/feedback/unit-1.json`** — Must add FeedbackMapping entries for each error tag.
- **`src/domain/__tests__/catalog-readiness.test.ts`** — Must update tests: `mat.u1.complejos` should return `ready: true`, removed from "downstream not-ready" list, added to PILOT_SKILL_IDS integration tests.
- **`src/domain/__tests__/complejos-domain.test.ts`** — New file (mirrors valor-absoluto-domain.test.ts pattern) validating pilot order, prerequisites, readiness, content loading, exercise count, error taxonomy coverage.
- **`src/domain/evaluator/`** — No evaluator change needed. Existing `evaluateNumeric` (real/imag part inputs), `evaluateExact` (MC answers), `evaluateBoolean` (T/F) already cover the permitted exercise types for this skill.
- **`src/domain/evaluator/error-tagging.ts`** — May need new error-tagging patterns if complex-specific detectable mistakes are added beyond the pattern-based system.
- **`src/components/`** — Minimal/no changes. MathThemePlate and topic map already support "complex" theme.

### Approaches

1. **Full pilot skill activation (recommended)** — Add `mat.u1.complejos` as the 8th pilot skill following the exact pattern of `valor_absoluto` and `logaritmos`. Includes all 5 components (theory, examples, exercises with ≥12 items, feedback, error tags), domain tests, and readiness integration.
   - Pros: Complete UX for students; leverages all existing infrastructure; no dead references; clear precedent from other pilot skills; satisfies the `mat.u5.complejos_forma_polar` prerequisite chain.
   - Cons: Higher content creation effort (~12 exercises, ~8 theory concepts, ~5 worked examples, ~6 error tags); requires careful pedagogical design per UTN Ingreso material.
   - Effort: Medium

2. **Minimal pilot with reduced exercises** — Add the skill with only 6-8 exercises, 4-5 theory concepts, and minimal feedback. Mark as "beta" or "coming soon" in UI.
   - Pros: Faster to implement; tests fewer edge cases.
   - Cons: Lower pedagogical value; may trigger the catalog `≥4` exercise minimum but not the richness expectations from `validatePracticeBank`; readiness checks may pass but content would feel thin compared to other skills.
   - Effort: Low-Medium

3. **Add exercises without pilot activation** — Create exercises and content under `mat.u1.complejos` but do NOT add it to PILOT_SKILLS. It would exist in the catalog but be unreachable through the current learn/practice flow.
   - Pros: Content is built; can be activated later with a one-line change.
   - Cons: No student-facing value in MVP; would require a separate activation change later.
   - Effort: Low

### Recommendation

**Approach 1: Full pilot skill activation.** The infrastructure is mature and well-tested. The pattern is proven by 7 existing pilot skills. The pedagogical value is clear: complex numbers are the logical conclusion of Unit 1's number set journey (ℕ → ℤ → ℚ → ℝ → ℂ), and the theory content for `conjuntos_numericos` already references ℂ as "coming later" in concept 11 ("Complejos básicos") and concept 14 ("Lo que tenés que dominar").

The exercise design constraint from AGENTS.md (no free-form `a+bi` text) is not a blocker — multiple-choice and numerical inputs (real part separate, imaginary part separate) effectively test complex number understanding without ambiguous parsing.

### Risks

- **Content scope creep for Unit 1**: Complex numbers in UTN Ingreso cover basic operations (+, -, ×, ÷) and powers of i, NOT polar form or advanced topics. Scope must be clearly bounded to avoid overlapping with `mat.u5.complejos_forma_polar`.
- **Exercise type limitation**: The prohibition on `a+bi` text input means no direct "type the complex number" exercises. This must be compensated with MC questions, true/false statements, and separate real/imaginary part inputs. Verify this covers sufficient pedagogical ground.
- **Test update cascade**: `catalog-readiness.test.ts` has hardcoded assertions that `mat.u1.complejos` is NOT ready. These must be inverted. The PILOT_SKILL_IDS integration tests (tests for all pilot skills) will automatically pick up the new skill.
- **Error taxonomy size**: Unit 1 already has ~30 error tags. Adding 6-8 more keeps it proportional but increases the taxonomy file size (~689 lines currently).

### Ready for Proposal

**Yes.** The change scope is well-defined. The only open question is the exact pedagogical scope — which complex number operations to cover and how many exercises per category. The `sdd-propose` phase should define:
1. Exact theory concept list (8-12 concepts)
2. Exercise count and category structure
3. Error tag inventory
4. Rollback plan (remove from PILOT_SKILLS if content quality is insufficient)
