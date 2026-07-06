# Proposal: Align U2 Practice with Official UTN 2025 Guide (`02_ej_utn.pdf`)

## Intent

The current `content/matematica/exercises/unit-2.json` covers ~20% of the official UTN 2025 guide (`02_ej_utn.pdf`) minimum map: 31 exercises across 7 skills with significant gaps in long division, notable products/powers, the 7 factorization cases, rational expression operations, and varied fractional equations. We need to align U2 practice with the official document to give the student full coverage of what the entrance exam actually asks, while preserving the working catalog architecture and the 7 existing U2 skills.

## Scope

### In Scope
- Add new exercises to `content/matematica/exercises/unit-2.json` only (no removals, no edits to existing 31)
- Create `docs/auditorias/unidad-2/alineacion-02-ej-utn.md` (audit + coverage report)
- Update/extend `src/domain/__tests__/exercises-u2-shape.test.ts` with coverage-floor assertions
- Update `openspec/specs/math-exercise-catalog/spec.md` and `openspec/specs/ecuaciones-fraccionarias/spec.md`
- Add new `u2_*` error tags to `src/domain/error-taxonomy/` as needed
- Use `02_ej_utn_<item>` trace tags + a second `canonicalTrace` source entry for the official PDF
- Rational expression exercises use `skillId: mat.u2.ecuaciones_fraccionarias` + `category: expresiones_racionales`

### Out of Scope
- New U2 skills (rational expressions fold into the existing `mat.u2.ecuaciones_fraccionarias`)
- Catalog loading architecture changes (`unit-{1,2,3}.json` loading is stable, confirmed in exploration)
- Removal or replacement of any existing exercise
- Supabase adapter changes

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `math-exercise-catalog`: extend `Unit 2 Exercise Coverage`, `Unit 2 Input Type Restriction`, and `Unit 2 Exercise Concepts` to require the official family coverage floors (>=3 long division, >=3 notable products/powers, >=10 factorization across cases, >=4 rational expressions, >=4 fractional equations with domain verification).
- `ecuaciones-fraccionarias`: extend `Fractional Equation Exercise Support` to accept the `category: expresiones_racionales` field and add a sibling requirement for rational expression operations (sums, factor+simplify, cocientes).

## Approach

Adopt **Approach A from exploration**: incremental gap-fill per skill in 6 chained content-only slices — `polinomios_basico` → `operaciones_polinomios` → `ruffini_resto` → `factorizacion` → `mcm_mcd_polinomios` → `ecuaciones_fraccionarias`. Each slice is an independent PR (<400 lines), revertable on its own. Type discipline is strict: `multiple-choice` for polynomial/factorization, `numerical` only for single-scalar finite values; double-scalar equations, rational expressions, and algebraic/domain-rich answers use `multiple-choice` / `matching` / `ordering` (or other existing non-numerical types). No free-form symbolic input for algebraic expressions.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `content/matematica/exercises/unit-2.json` | Modified | +30+ exercises across 7 skills (additions only) |
| `docs/auditorias/unidad-2/alineacion-02-ej-utn.md` | New | Coverage audit against `02_ej_utn.pdf` |
| `src/domain/__tests__/exercises-u2-shape.test.ts` | Modified | Coverage floor assertions + canonical-trace tag checks |
| `openspec/specs/math-exercise-catalog/spec.md` | Modified | Extended U2 requirements |
| `openspec/specs/ecuaciones-fraccionarias/spec.md` | Modified | `category: expresiones_racionales` support |
| `src/domain/error-taxonomy/` | Modified | New `u2_*` tags (e.g., `u2_division_larga`, `u2_tcp`, `u2_cubo_perfecto`) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Chained PR diffs exceed 400-line budget | Medium | One PR per skill slice; review budget enforced per `force-chained` |
| `category` field not yet in exercise schema | Medium | Verify schema first; add as additive extension; rational expressions key off `skillId` even if `category` is dropped |
| `canonicalTrace` path conflict (`UNIDAD2_matemática.pdf` vs `02_ej_utn.pdf`) | Low | Add second `canonicalTrace` source entry; document external PDF path in audit doc |
| Double-scalar / domain-rich answers regressed to `numerical` | Medium | Spec-rule: `numerical` only for single-scalar finite values; everything else (double-scalar, algebraic, domain-rich) goes through `multiple-choice` / `matching` / `ordering`; shape test enforces |
| Free-form symbolic answers re-emerge in factorization | Medium | Spec-rule: no free-form symbolic for algebraic expressions; shape test enforces |
| Rational expression exercises dilute `ecuaciones_fraccionarias` scope | Low | `category: expresiones_racionales` keeps them queryable; feedback pathways stay coherent |

## Rollback Plan

Content-only additions. Per-slice revert: `git revert <merge-commit>` restores the prior `unit-2.json`, removes the audit section, and reverts the shape test. No data migration, no schema change unless `category` is extended (additive, safe to drop). Each chained PR is independently revertable.

## Dependencies

- `openspec/specs/math-exercise-catalog/spec.md` — existing U2 requirements
- `openspec/specs/ecuaciones-fraccionarias/spec.md` — existing fractional equation spec
- Official PDF `02_ej_utn.pdf` (external: `~/Documentos/Preuniversitarios/UTN/01 - Matemática/00 - Ejercicios UTN/`)

## Success Criteria

- [ ] `unit-2.json` contains >=5 exercises per U2 skill (>=35 total)
- [ ] >=3 long division exercises in `operaciones_polinomios`
- [ ] >=3 notable products/powers exercises
- [ ] >=10 factorization exercises across the 7 official cases
- [ ] >=4 rational expression exercises under `mat.u2.ecuaciones_fraccionarias` with `category: expresiones_racionales`
- [ ] >=4 fractional equation exercises with domain-exclusion distractor
- [ ] Each new exercise carries a `02_ej_utn_<item>` canonical trace tag
- [ ] Audit doc `docs/auditorias/unidad-2/alineacion-02-ej-utn.md` published
- [ ] `pnpm run test:run`, `pnpm run typecheck`, `pnpm run build` all green