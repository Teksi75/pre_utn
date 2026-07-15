# Tasks: U5-01 — Provisional Unit 5 Static Retirement

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~280 net deletions (400+ gross) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR — all phases are deletions and independent |
| Delivery strategy | auto-forecast |
| Chain strategy | not-applicable |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: not-applicable
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|---------------------|-----------------|-------------------|
| 1 | Retire U5 skill catalog and dependency edges | PR 1 | `pnpm test -- --grep "UNIT_5_SKILLS\|catalog" --run` | `pnpm run build` | `src/domain/models/skill-catalog.ts` revert |

## Phase 1: Skill Catalog Retirement

- [x] 1.1 Reduce `UNIT_5_SKILLS` to empty collection in `src/domain/models/skill-catalog.ts` (export retained per active spec `openspec/specs/unit-5-foundation/spec.md:11`; six provisional IDs removed)
- [x] 1.2 Remove `...UNIT_5_SKILLS` from `ALL_SKILLS` array spread (line 92)
- [x] 1.3 Remove U5 dependency rows from `SKILL_DEPENDENCIES`: `mat.u5.ecuaciones_trigonometricas` and `mat.u5.complejos_forma_polar` (lines 130–131)
- [x] 1.4 Verify `KNOWN_SKILL_IDS`, `ALL_SKILLS`, and `SKILL_DEPENDENCIES` contain no U5 IDs after removal

## Phase 2: Content and Threshold Contract

- [x] 2.1 Remove five U5 placeholder exercises from `content/matematica/exercises.json`: `ex.u5.angulos.1`, `ex.u5.radianes.1`, `ex.u5.circunferencia_trigonometrica.1`, `ex.u5.identidades.1`, `ex.u5.ecuaciones_trigonometricas.1` (lines 133–202)
- [x] 2.2 Add `UNIT_THRESHOLDS["unit-5"] = 0` in `src/domain/catalog/content-loaders.ts` to permit empty U5 without threshold failure
- [x] 2.3 Verify `ex.u6.funcion_concepto.1` (line 204) remains intact after JSON deletion

## Phase 3: Error Taxonomy Retirement

- [x] 3.1 Remove `u5_cuadrante_angulo` error tag from `src/domain/error-taxonomy/index.ts` (lines 986–996)
- [x] 3.2 Remove `u5_identidad_pitagorica` error tag from `src/domain/error-taxonomy/index.ts` (lines 997–1006)
- [x] 3.3 Verify `loadTaxonomy()` unit coverage check passes for units 1–4 and 6 (Unit 5 intentionally has 0 tags)

## Phase 4: Documentation and Reference Cleanup

- [x] 4.1 Remove six U5 skill IDs from `utn-ingreso-app-spec/docs/pedagogy/06-skill-map.md` (lines 89–94)
- [x] 4.2 Remove two U5 dependency rows from `utn-ingreso-app-spec/docs/pedagogy/06-skill-map.md` (lines 159–160)

## Phase 5: Test Retirement and Verification

- [x] 5.1 Update `src/domain/__tests__/catalog.test.ts` — remove U5 skill assertions from `UNIT_5_SKILLS` checks
- [x] 5.2 Update `src/domain/__tests__/per-unit-thresholds.test.ts` — add `expect(UNIT_THRESHOLDS["unit-5"]).toBe(0)` assertion
- [x] 5.3 Update `src/domain/__tests__/diagnostic.test.ts` — remove any U5 provisional skill/exercise references
- [x] 5.4 Update `src/domain/__tests__/evaluator-index.test.ts` — remove U5 references
- [x] 5.5 Update `src/domain/__tests__/catalog-answer-contract.test.ts` — remove U5 references
- [x] 5.6 Update `src/domain/__tests__/complejos-domain.test.ts` — remove `mat.u5.complejos_forma_polar` reference
- [x] 5.7 Update `src/domain/__tests__/error-taxonomy.test.ts` — remove U5 tag coverage assertions
- [x] 5.8 Run `pnpm run test` and `pnpm run typecheck` to verify all phases integrated (the historical failing test run is retained in `apply-progress.md`; a later clean checkpoint run passed 187 files / 3188 tests; `pnpm run typecheck` passed with `tsc --noEmit`)

## Active Spec Retirement (canonical-embodiment requirement)

- [x] 6.1 Rewrite `openspec/specs/unit-5-foundation/spec.md` to describe post-retirement state without prior migration/sidecar exposure
- [x] 6.2 Update `openspec/specs/math-exercise-catalog/spec.md` to allow empty Unit 5 coverage
- [x] 6.3 Update `openspec/specs/complex-numbers-skill/spec.md` to remove `mat.u5.complejos_forma_polar` downstream edge reference

## Out-of-Scope Reminders

- Do NOT modify U3, U5-02, archived U5-00, canonical U5 content, SQL, or persistence
- Do NOT add migration, sidecar, marker, write gate, or adapter changes
- Do NOT add aliases or compatibility layers for `mat.u5.ecuaciones_trigonometricas`
- Synthetic fixtures `mat.u5.trigonometria_basica`, `ex.u5.bad.1`, `ex.u5.good.1` are retained

## Out-of-Scope Reminders

- Do NOT modify U3, U5-02, archived U5-00, canonical U5 content, SQL, or persistence
- Do NOT add migration, sidecar, marker, write gate, or adapter changes
- Do NOT add aliases or compatibility layers for `mat.u5.ecuaciones_trigonometricas`
- Synthetic fixtures `mat.u5.trigonometria_basica`, `ex.u5.bad.1`, `ex.u5.good.1` are retained
