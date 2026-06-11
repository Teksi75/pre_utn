# Post-U2 next options

Unit 2 is complete and archived. The next session can continue in either of two directions.

## Option A — Post-U2 follow-ups

Small technical/pedagogical improvements detected during verification. They are not blockers for Unit 3.

- Add strict per-skill difficulty progression tests.
- Scope `validatePracticeBank` category diagnostics so Unit 2 skills do not inherit Unit 1 minimums globally.
- Strengthen `u2_denominador_cero` detection for denominators beyond `(x-a)`, such as `(2x-4)`, if future exercises require it.
- Add explicit tests that fractional-equation multiple-choice exercises include domain-exclusion distractors.
- Consider splitting the monolithic `content/matematica/exercises.json` later.

## Option B — Start Unit 3

Recommended first Unit 3 slice: `unit-3-fundamentos-slice`.

Initial scope:

- `mat.u3.ecuaciones_lineales`
- `mat.u3.ecuaciones_cuadraticas`
- `mat.u3.inecuaciones_lineales`

Rationale: these are the foundation for later Unit 3 work such as recta, systems, absolute-value inequalities, exponentials, and logarithmics.

## Recommendation

Start with Option B unless the team wants a short cleanup pass first. The follow-ups are useful, but they do not block the main pedagogical chain.
