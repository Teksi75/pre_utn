# Exploration: add-valor-absoluto-skill

> **Status:** Complete
> **Date:** 2026-06-04
> **Change:** `add-valor-absoluto-skill`

---

## Current State

`mat.u1.valor_absoluto` is partially scaffolded but **not traversable**. It exists in:

| Layer | File | Status |
|-------|------|--------|
| Skill catalog | `src/domain/models/skill-catalog.ts` line 17 | Defined in `UNIT_1_SKILLS` |
| Prerequisites | `src/domain/models/skill-catalog.ts` line 117 | No prereqs; is a prereq for `mat.u3.inecuaciones_valor_absoluto` |
| Exercises | `content/matematica/exercises.json` line 477 | **1 exercise only** (`ex.u1.valor_absoluto.1`, numerical, difficulty 2) |
| Pilot skills | `src/domain/catalog/pilot-skills.ts` | **NOT listed** — skill is invisible to practice routing |
| Theory | `content/matematica/theory/unit-1.json` | **Missing** — no theory node |
| Examples | `content/matematica/examples/unit-1.json` | **Missing** — no worked examples |
| Feedback | `content/matematica/feedback/unit-1.json` | **Missing** — no feedback mappings |
| UI hint | `src/components/diagnostic/DiagnosticQuestion.tsx` line 18 | Maps to `"absolute"` icon |
| README | `README.md` line 64 | Listed as "Pendiente" |

Readiness check (`isSkillReady`) would return `ready: false` with missing: `theory`, `examples`, `feedback` (and `exercises` would fail the ≥4 threshold).

---

## Affected Areas

- `content/matematica/theory/unit-1.json` — Add theory node for valor_absoluto
- `content/matematica/examples/unit-1.json` — Add 3-5 worked examples
- `content/matematica/feedback/unit-1.json` — Add error tag → feedback mappings
- `content/matematica/exercises.json` — Add 4+ more exercises (currently 1, need ≥5 for catalog, ≥4 for readiness)
- `src/domain/catalog/pilot-skills.ts` — Add entry to `PILOT_SKILLS` (between intervalos and logaritmos)
- `README.md` — Update valor_absoluto from "Pendiente" to "Listo"

No domain model changes needed — `TheoryNode`, `WorkedExample`, `FeedbackMapping`, and `Exercise` models already support all required fields. No new evaluators needed — existing `evaluateExact` and `evaluateBoolean` cover the exercise types this skill uses.

---

## Approaches

### 1. **Single content-file approach** — Add all content to existing unit-1 JSON files

- **Pros**: Follows the exact pattern of intervalos, logaritmos, racionalizacion. No new files, no registry changes. Content loaders already import `unit-1.json` for theory/examples/feedback.
- **Cons**: Unit-1 JSON files grow larger (currently 485 lines theory, 444 examples, 248 feedback).
- **Effort**: Low

### 2. **Per-skill file approach** — Create dedicated `valor-absoluto.json` files

- **Pros**: Mirrors the conjuntos-numericos pattern (separate `exercises/conjuntos-numericos.json`, `feedback/unit-1-conjuntos-numericos.json`). Keeps files small.
- **Cons**: Requires changes to `content-loaders.ts` registry and `catalog/index.ts` PER_SKILL_SKILL_IDS. More moving parts for a single skill addition.
- **Effort**: Medium

### Recommendation

**Approach 1** — single content-file approach. The valor_absoluto content is modest (definition, properties, inequalities intro) and fits naturally alongside the existing unit-1 content. The per-skill file pattern was used for conjuntos_numericos because it had 40+ exercises; valor_absoluto needs only 5-8. No code changes to loaders or catalog — only JSON content additions and one pilot-skills entry.

---

## Content Design Guidance

### Theory concepts (following intervalos/logaritmos pattern)

1. Definition: |a| = a if a ≥ 0, |a| = -a if a < 0
2. Geometric interpretation: distance from zero on the number line
3. Properties: |a| ≥ 0, |a| = 0 ↔ a = 0, |ab| = |a||b|, |a/b| = |a|/|b|
4. Triangle inequality: |a + b| ≤ |a| + |b|
5. Solving |x| = k (two cases)
6. Common mistakes: confusing |−a| with −|a|, forgetting the two-case split

### Exercise categories (per AGENTS.md pedagogical criteria)

Per AGENTS.md: "No usar respuesta libre para expresiones matemáticas estructuradas." Use:
- **multiple-choice** for classification/conceptual (e.g., "¿Cuál es |−5|?")
- **numerical** for single-value computation (e.g., "|−3| + |7| = ?")
- **multiple-choice** for error detection (e.g., "Un alumno dice que |−3| = −3. ¿Qué error cometió?")
- **multiple-choice** for property identification

### Error tags to create

- `u1_va_confunde_signo` — Confuses |−a| with −|a|
- `u1_va_distancia_cero` — Doesn't interpret |a| as distance
- `u1_va_dos_casos` — Forgets to split |x| = k into two cases
- `u1_va_propiedad_producto` — Misapplies |ab| = |a||b|

### Prerequisites

The skill-map spec (`06-skill-map.md`) lists no prerequisites for `mat.u1.valor_absoluto`. The existing `SKILL_DEPENDENCIES` confirms this. Pedagogically, it only requires understanding of real numbers and order (covered by reales_operaciones and intervalos), but the spec treats it as independent.

---

## Risks

- **Low**: Content quality depends on canonical material (`UNIDAD1_matemática.pdf` section on valor absoluto). Must verify section exists before writing theory.
- **Low**: One existing exercise (`ex.u1.valor_absoluto.1`) has no `relatedTheoryIds` or `relatedExampleIds`. Should be updated when theory/examples are added.
- **Medium**: The `CATEGORY_MINIMUMS` in `content-loaders.ts` defines category minimums (pertenencia: 8, clasificacion: 12, etc.). If valor_absoluto exercises use categories, they must meet those minimums — or the exercises should use categories that already exist with capacity, or no category at all (defaults to `"clasificacion"`).

---

## Ready for Proposal

**Yes** — The exploration is sufficient to launch `sdd-propose`.

The orchestrator should:
1. Confirm single content-file approach (Approach 1)
2. Define exact exercise count target (recommend 5-8)
3. Confirm canonical material section for valor_absoluto exists
4. Launch `sdd-propose` with this exploration as context

---

## SDD Result Envelope

**Status**: success
**Summary**: `mat.u1.valor_absoluto` is scaffolded in the skill catalog and has 1 exercise, but is not traversable — missing theory, examples, feedback, and pilot-skills entry. Single content-file approach recommended: add content to existing unit-1 JSON files + pilot-skills entry. No domain model or loader changes needed.
**Artifacts**: Engram `sdd/add-valor-absoluto-skill/explore` | `openspec/changes/add-valor-absoluto-skill/exploration.md`
**Next**: sdd-propose
**Risks**: Low — content quality depends on canonical material verification; existing exercise needs theory/example linkage update
**Skill Resolution**: paths-injected — 2 skills (sdd-explore, cognitive-doc-design)
