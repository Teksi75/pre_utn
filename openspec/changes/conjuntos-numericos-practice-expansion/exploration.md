# Exploration: conjuntos-numericos-practice-expansion

## Current State

### Current Practice Inventory (skill `mat.u1.conjuntos_numericos`)

5 exercises in `content/matematica/exercises.json`:

| # | ID | Type | Difficulty | Concept | Render Status |
|---|-----|------|------------|---------|---------------|
| 1 | `ex.u1.conjuntos_numericos.1` | multiple-choice | 1 | belongs-to: smallest set for 7 (ℕ) | OK |
| 2 | `ex.u1.conjuntos_numericos.2` | multiple-choice | 1 | belongs-to: smallest set for -4 (ℤ) | OK |
| 3 | `ex.u1.conjuntos_numericos.3` | multiple-choice | 1 | belongs-to: 3/5 ∈ ℚ | OK |
| 4 | `ex.u1.conjuntos_numericos.4` | multiple-choice | 2 | √2 is irrational + real | **BUG — root has no top bar** |
| 5 | `ex.u1.conjuntos_numericos.5` | multiple-choice | 2 | √(−4) not in ℝ | OK |

All 5 exercises are `multiple-choice`, difficulty 1–2 only. No `numerical`, `symbolic`, `fill-blank`, `matching`, `ordering`, `true-false`, `free-response`, or `graphical` types represented. No difficulty 3–5 exercises.

---

### Root-Rendering Bug Analysis

**Affected exercise**: `ex.u1.conjuntos_numericos.4` (line 46 of `exercises.json`)

**Offending fragment in `prompt`**:
```
"prompt": "¿Qué afirmación es correcta sobre √2?"
```

**Offending fragment in `options`** (line 48):
```
"options": ["Es racional", "Es irracional y real", "Es entero", "No pertenece a los reales"]
```

**Root cause**: The raw text `√2` appears WITHOUT dollar-delimiter math wrapping. The prompt is plain text; `√` is a literal Unicode character (U+221A) rendered outside KaTeX, so it has no top bar.

The parser in `src/components/math/rich-text-parser.ts` uses `/\$([^$]+)\$/g` — it only processes `$...$` delimiters. Any math symbol outside `$...$` is treated as plain text and lands in a `<span>` (from `RichText.tsx` line 24), NOT inside `KaTeXBlock`.

Compare with the correctly written exercises in `mat.u1.potencias_raices`:
- Line 120: `"prompt": "Calcula $\\sqrt{9} + 2^2$"` ✅ wrapped in `$...$` — KaTeX renders `\sqrt{9}` properly
- Line 132: `"prompt": "Calcula $2^3$"` ✅
- Line 144: `"prompt": "Calcula $(-3)^2$"` ✅
- Line 181: `"prompt": "¿Qué resultado tiene $\\sqrt{-4}$ en los números reales?"` ✅

Note: `√` without its bar also appears in `ex.u1.conjuntos_numericos.5` prompt (`"¿Qué ocurre con √(-4)..."`), which has the same pattern as `.4` — a literal `√` that would fail to render correctly. Both `.4` and `.5` have this issue.

**Suggested fix** (do NOT apply in explore): wrap affected math in `$...$` using KaTeX-safe syntax:
- Prompt: `"¿Qué afirmación es correcta sobre $\\√2$?"` or `"¿Qué afirmación es correcta sobre $\sqrt{2}$?"`
- Prompt: `"¿Qué ocurre con $\sqrt{-4}$ dentro de los números reales?"`

Note: In the existing feedback entry for `u1_toda_raiz_irracional`, the math is correctly wrapped: `$\sqrt{9} = 3$` (line 18 of `unit-1.json` feedback), confirming the rendering pipeline works when math is properly delimited.

---

### Spec Landscape

Relevant specs and constraints for this change:

| Spec | Path | Key Constraints |
|------|------|-----------------|
| math-exercise-model | `openspec/specs/math-exercise-model/spec.md` | Exercise ID format `ex.u{1-6}.{slug}.{index}`; difficulty 1–5; 9 supported types |
| math-exercise-catalog | `openspec/specs/math-exercise-catalog/spec.md` | ≥30 total exercises, ≥5 per unit; catalog querying by skill/difficulty |
| math-skill-model | `openspec/specs/math-skill-model/spec.md` | Skill ID format `mat.u{1-6}.{slug}` |
| math-answer-evaluator | `openspec/specs/math-answer-evaluator/spec.md` | Tag assignment bounded to exercise's declared `commonErrorTags`; error tag format `u{1-6}_{slug}` |
| math-error-taxonomy | `openspec/specs/math-error-taxonomy/spec.md` | Error tags follow `u{1-6}_{slug}`; minimum 2 per unit |
| guided-practice | `openspec/specs/guided-practice/spec.md` | Feedback without exposing full solution steps |
| openspec/config.yaml | (project root) | TDD `true`; test command `pnpm run test`; domain layer must not import React/Next/Supabase |

**Note**: no `pedagogical-feedback` spec exists under `openspec/specs/`. Feedback mappings live in `content/matematica/feedback/unit-1.json` and are resolved via `src/domain/feedback/index.ts` (`FeedbackMapping` interface).

---

### Pedagogical Gap Map

Current 5 exercises cover:

| Category | Covered by | Gap |
|----------|-----------|-----|
| **Pertenencia / inclusion** (belongs-to smallest set) | ex.1 (7∈ℕ), ex.2 (-4∈ℤ), ex.3 (3/5∈ℚ) | Good basic coverage; no ℝ-only or I-only membership questions |
| **Clasificación** (classify number types) | ex.3 (fraction = ℚ), ex.4 (√2 = irrational+real) | Partial; no pure classification like "clasifica 0.333…" or "clasifica π" without confound |
| **Racionales vs irracionales** | ex.3 (fraction), ex.4 (√2) | Partial; no decimal periodic vs irrational; no classic non-repeating non-terminating examples |
| **Decimales** (decimal representation) | **NONE** | **MISSING** — no exercises on decimal expansions, periodic vs non-periodic, conversion fraction↔decimal |
| **Mapa de inclusion** (ℕ⊂ℤ⊂ℚ⊂ℝ) | **NONE** | **MISSING** — no exercises asking "¿Cuál es la relación entre ℕ y ℤ?", inclusion chain ordering |
| **Errores comunes** (common mistakes) | ex.2 (confuses ℕ/ℤ), ex.3 (confuses ℚ/Irracional), ex.4 (every root is irrational), ex.5 (negative root) | Partially covered; missing: "0 ∈ ℕ" convention debate, complex numbers at basic level, "ℝ = ℚ ∪ I" partition |

**Difficulty distribution gap**: All 5 exercises are difficulty 1–2. No difficulty 3–5 exercises to prepare students for exams.

**Type distribution gap**: All 5 are `multiple-choice`. No variety in response format — students don't practice typed answers, ordering, matching, or graphical representation.

**New exercise target**: ≥40 exercises for this skill — the 6 categories above plus difficulty/type expansion are the primary gaps to fill.

---

### Render-Component Capabilities and Limits

**Markup accepted**: The `RichText` component (`src/components/math/RichText.tsx` + `rich-text-parser.ts`) processes text through the pipeline:

1. **Delimiters**: `$...$` is the only math delimiter. No `\(` ... `\)`, no `\[...\]`, no raw LaTeX.
2. **Parser**: `parseRichTextSegments` splits on `/\$([^$]+)\$/g`. Unclosed or empty `$` delimiters become plain text (not errors).
3. **Renderer**: Math segments are passed to `katex.render(expression, container, {throwOnError: false, displayMode})` inside `KaTeXBlock`. Plain text segments are wrapped in `<span>`.
4. **KaTeX behavior**: `throwOnError: false` suppresses parse errors silently; the component renders the expression or an error placeholder. Square root (`\sqrt{...}`) renders WITH its top bar. Unicode `√` outside math mode renders WITHOUT the top bar (OS-level glyph rendering).
5. **Display mode**: `displayMode: false` (default) — inline rendering. Set to `true` for `$$...$$` block mode.
6. **Decimal comma**: Use `{,}` in KaTeX math mode per project convention (already established, e.g., in feedback messages).

**At-risk patterns**:
- Literal Unicode characters for math symbols (`√`, `×`, `÷`, `∞`) outside `$...$` will not be rendered by KaTeX.
- `\sqrt{x}` inside `$...$` works fine.
- LaTeX fractional syntax `\frac{a}{b}` inside `$...$` works fine.
- The KaTeXBlock test (`katex-rendering.test.ts`) confirms `\sqrt{x+y}` and `\sqrt[3]{8}` render correctly.

---

### Risks and Open Questions

1. **Render bug scope**: Only `ex.u1.conjuntos_numericos.4` was flagged in the session preflight, but `ex.u1.conjuntos_numericos.5` has the same pattern with literal `√`. Both should be fixed atomically.
2. **Error tag gap**: New exercises will need new `commonErrorTags`. The error taxonomy (`math-error-taxonomy/spec.md`) requires tags in `u{1-6}_{slug}` format. Currently only unit-1 tags exist. New tags for unit-1 concepts (decimals, inclusion mapa, complex basics) need to be added before exercises reference them.
3. **Feedback for new tags**: `content/matematica/feedback/unit-1.json` must have entries for any new error tags referenced by new exercises. Without a feedback entry, the fallback retry message is used.
4. **Domain layer immutability**: `src/domain/` must stay side-effect free. New exercises added to `content/matematica/exercises.json` — no domain code changes needed for exercise addition.
5. **Difficulty 3+ exercises**: No current exercises at difficulty 3–5. The spec allows up to 5. New harder exercises testing deep understanding or composite concepts (e.g., "given a number, list all sets it belongs to") are needed.
6. **Type variety**: Spec supports 9 exercise types; only `multiple-choice` is currently used. `fill-blank`, `matching`, `ordering`, `true-false`, `symbolic` could diversify practice without changing the architecture.
7. **Catalog coverage spec vs new focus**: `math-exercise-catalog/spec.md` requires ≥5 per unit across all 6 units. This change is focused only on `mat.u1.conjuntos_numericos`. The existing 5 exercises already cover unit-1's minimum, but the session preflight says target is ≥40 for this skill alone.
8. **Skill ID validation**: `validateExercise` in `src/domain/models/exercise.ts` checks skillId against `knownSkillIds`. The set must include `mat.u1.conjuntos_numericos` for new exercises to pass validation.
