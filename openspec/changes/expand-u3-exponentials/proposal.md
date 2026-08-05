# Proposal: Expand `mat.u3.exponenciales` Practice Bank

## Intent

`mat.u3.exponenciales` offers 4 exercises in one technique
(same-base equalization) with no error guidance. The bank is too
thin, narrow, and shallow at the top of the difficulty range to
support real practice. Lets a UTN-bound student practice the exam's
technique range with error-classified feedback.

## Current Gap → Target

| Dim | Today | Target |
|-----|-------|--------|
| Bank | 4 | ~17 (±2) |
| Difficulty | {1, 3} | {1, 2, 3, 4, 5}; ≥2 at d=5 |
| Techniques | 1 | ≥8 of 10 P39 families |
| Formats | 2 | ≥3 distinct |
| Error class + feedback | 0/4 | all |

## Scope

### In Scope
- Append ~13 entries; bank ~17 (±2). IDs `.2`–`.5` stay byte-stable.
- `03_ej_utn.pdf` Exercise 39 is the domain/level benchmark; no literal prompt or expression is copied.
- ≥8 distinct exponential technique families.
- Difficulty 1–5 (≥1 each, ≥2 at d=5) and ≥3 distinct response formats already supported by the renderer.
- Correctness, useful guidance, coherent difficulty; each entry traceable to technique, difficulty, format, procedure.
- Each entry carries a valid error classification and useful feedback; no-free-text rule for roots, dual solutions, log expressions, etc.
- In the running app: bank loads, skill is reachable, UI selects it, prompts/options/fields/hints/solutions render correctly, no nearby regression.

### Out of Scope
- New response formats, renderer changes, graphical/matching entries.
- New theory, examples, feedback files, taxonomy tags, or detection patterns.
- Other U3 skills; the blocked/archived `align-u3-practice-official-exercises` and `recuperar-u3-traza-canonica-ejercicios` work and admin files.
- The `u3_igualdad_exponenciales` contract itself; new classifications must still carry useful feedback.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `math-exercise-catalog`: U3 exponenciales coverage ~17 with ≥8 of 10 P39 technique families.
- `practice-coverage`: per-skill bank size mirrors the unit benchmark.
- `math-error-taxonomy`: every new exercise carries a valid error classification with useful feedback.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Literal copy of P39a–q expression | Low | Audit each entry; reject literal matches |
| Difficulty ramp skips levels or omits d=5 | Med | Plan curve; verify ≥2 at d=5 |
| Renderer fallback for an unsupported type | Med | Stay within renderer-supported set |
| Free-text for roots, logs, intervals, complex, dual solutions | Med | Review each entry against the no-free-text rule |
| Cross-skill contamination or nearby regression | Low | Family kept consistent with existing exponenciales; only exponenciales entries are touched |

## Rollback Outcome

The experience returns to the prior 4-exercise bank with byte-stable
IDs `.2`–`.5`, no new techniques or classifications, and the prior
U3 closure/recovery work and admin files untouched.

## Success Criteria

- Bank loads, skill is reachable, UI selects it, every new entry's prompt, expression, options/fields, hints, and solution render correctly.
- Composed bank: ~17 (±2) entries, ≥8 techniques, difficulty {1, 2, 3, 4, 5} with ≥2 at d=5, ≥3 formats.
- Every new entry carries a valid error classification and useful feedback.
- Correctness, useful guidance, coherent difficulty hold.
- No new exercise reproduces a P39a–q literal prompt or expected answer.
