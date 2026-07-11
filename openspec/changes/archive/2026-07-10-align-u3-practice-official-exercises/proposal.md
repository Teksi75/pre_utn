# Proposal: Align U3 Practice with Official Exercises

## Intent

Align U3 practice with `03_ej_utn.pdf`, prioritizing canonical coverage over exercise count. Fulfills #84; preserves #82/#83 ownership and ADR-006/ADR-007.

## Scope

### In Scope
- Add P34 classification, graph, solution-set interpretation and P37 expansion before P38.
- Introduce `mat.u3.ecuaciones_valor_absoluto` and `mat.u3.inecuaciones_producto_cociente` with catalog, pedagogy, feedback, and detectable errors.
- Extend seven affected U3 skills with base coverage (difficulty 1–4) and exactly nine new multiple-choice challenges (difficulty exactly 5).
- Enforce valid trace paths; correct legacy `u2_*` U3 tags; preserve IDs, progress, and both `fortalecer-u3-lenguaje-modelizacion-transferencia` challenges.
- Deliver 16 autonomous slices ≤400 changed lines (forecast ≥5230 post-split).

### Out of Scope
- #82 definitively owns P7, P10, P13–P19, and P31.
- #83 definitively owns P22, P23, and P30.
- No changes to `traduccion_lenguaje_verbal` or its two existing challenges.

## Capabilities

### New Capabilities
- `u3-absolute-value-equations-skill`: P8 absolute-value equation practice.
- `u3-product-quotient-inequalities-skill`: P9p–w sign-chart inequality practice.

### Modified Capabilities
- `math-skill-model`, `math-exercise-catalog`, `practice-coverage`, `difficulty-progression`, `challenge-exercises`, `math-error-taxonomy`: support U3 skills, traceable content, 1–4/5 policy, challenge compatibility, corrected tags.

## Approach

Add traceable MC content; test challenge membership/difficulty, prohibited answer shapes, trace-path existence, and compatibility. Verified PDF path only. Plan 16 slices in `sdd-tasks` (forecast ≥5230 post-split). S0 → **S0a** trace type/parser; **S0b** repository-root trace audit; **S0c** U3 log metadata/comparator; **S0d** loader type rejection + inert scoped audit + fixtures. S1 → **S1a** lineales (canonical P1l root `√10/5`); **S1b** cuadraticas. Each slice ≤400 lines. **S11 alone turns the exact-nine/no-bleed/trace/compatibility audit GREEN.**

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `content/matematica/` | Modified | U3 exercises, theory, examples, feedback, challenges |
| `src/domain/models/skill-catalog.ts` | Modified | Two U3 skills, pilot accessibility |
| `src/domain/error-taxonomy/` | Modified | U3 tags and detectors |
| `src/domain/catalog/` | Modified | Catalog/trace compatibility tests |
| `openspec/specs/` | Modified/New | Capability deltas |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Slice or scope bleed | Med | Enforce ≤400 lines; reject #82/#83 families. |
| Math/trace regression | Med | Test verified expressions, enums, and existing PDF path. |
| Progress regression | Low | Preserve IDs/storage; run catalog and challenge compatibility tests. |

## Rollback Plan

Revert the affected slice, restoring its content/catalog and tests; U3 IDs, progress, and `fortalecer-u3` challenges remain intact.

## Dependencies

- Issue #84; registered companions #82 and #83; verified `03_ej_utn.pdf`.

## Success Criteria

- [ ] P34, P37, both new skills, and all in-scope families are covered.
- [ ] Exactly nine new structured MC challenges have difficulty 5; new base content is 1–4.
- [ ] Every new trace path exists; legacy U3 tags and compatibility checks pass.
- [ ] Each slice ≤400 lines; `pnpm run test`, `typecheck`, `build` pass.
