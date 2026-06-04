# Matematica Content Conventions

## Exercise ID Scheme

For expanded practice banks within a skill, new exercises use a slug-based ID scheme:

```
ex.u{unit}.{skill_slug}.{bank_code}-{NN}
```

### Bank Code Prefixes (mat.u1.conjuntos_numericos)

| Prefix | Category |
|--------|----------|
| `cn-per-NN` | Pertenencia/inclusion |
| `cn-cla-NN` | Clasificacion de numeros |
| `cn-rvi-NN` | Racionales vs irracionales |
| `cn-dec-NN` | Decimales (finitos, periodicos, no periodicos) |
| `cn-map-NN` | Mapa de inclusion entre conjuntos |
| `cn-err-NN` | Errores comunes conceptuales |

Example: `ex.u1.conjuntos_numericos.cn-per-01`

### Legacy IDs

Existing exercises retain their original numeric suffixes (e.g. `.1`, `.2`, `.3`).
Both formats are valid; the `ExerciseId` regex accepts `[a-z0-9-]+` as the final segment.

## N-sin-cero Convention

Natural numbers (ℕ) are defined WITHOUT zero: ℕ = {1, 2, 3, ...}.

- 0 is NOT a natural number.
- 0 belongs to ℤ, ℚ, and ℝ.
- Any exercise involving 0 must reflect this convention in its feedback.

## Answer-Type Selection Criteria

When creating or converting exercises, choose the answer type that produces **reliable automated evaluation**. The diagnostic and practice flows depend on deterministic grading.

### Decision Table

| Answer Shape | Recommended Type | Rationale |
|--------------|-----------------|-----------|
| Single numeric value (`42`, `3.14`, `-7`) | `numerical` | Evaluator applies tolerance; works for decimal answers. |
| Multi-value set (`x = -2, x = 2`) | `multiple-choice` | Free-text matching cannot reliably parse set notation. Convert to MC with the correct set and plausible distractors. |
| System of equations (`x = 3, y = 2`) | `multiple-choice` | Ordered-pair text matching is brittle (spacing, comma placement). MC guarantees deterministic grading. |
| Exact symbolic expression (`(x-2)(x-3)`) | `symbolic` | Exact trimmed match. Use when the answer has one canonical text representation. |
| Boolean statement | `true-false` | Evaluator handles Spanish/English aliases (`v/f`, `verdadero/falso`, `true/false`). |
| Unbounded free-form response | `fill-blank` | Case-insensitive match. Use only when the expected answer has a short, unambiguous form. |

### Rules

1. **`numerical` answers MUST parse as a finite number** after minus-sign normalization. If the expected answer contains commas, variable assignments, or set notation, it is NOT a valid `numerical` exercise.
2. **`multiple-choice` options MUST include the expected answer** and SHOULD have ≥3 options. Distractors SHOULD derive from `commonErrorTags` or known misconceptions.
3. **`symbolic` answers are case-sensitive and whitespace-sensitive** (trimmed). Use only when the answer has one canonical representation that students will type consistently.
4. **Diagnostic exercises MUST use types with reliable automated evaluation.** The `isExerciseReliable` check in `src/domain/diagnostic/index.ts` enforces this at runtime. Exercises that fail the check are excluded from diagnostic assessment.
5. **When in doubt, prefer `multiple-choice`** over `symbolic` or `fill-blank` for multi-part or notation-heavy answers. MC eliminates formatting ambiguity and enables option shuffling for fairness.
