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
