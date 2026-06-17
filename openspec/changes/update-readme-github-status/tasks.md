# Tasks: Update README to reflect current project state

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~60–80 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Update README.md: U1/U2 status, U2 table, U2 path, Fuente de verdad, recent changes | PR 1 | Single commit; verify rendered README + gates |

## Phase 1: Estado real del MVP — U1/U2 as complete

- [ ] 1.1 Remove "Unidad 1 está en construcción" and "Física queda para una segunda fase" stale copy
- [ ] 1.2 Fix U1 skills table: add missing `Complejos | Listo` row (8 rows total)
- [ ] 1.3 Add U2 skills table: polinomios_basico, operaciones_polinomios, ruffini_resto, factorizacion, gauss, mcm_mcd_polinomios, ecuaciones_fraccionarias — all "Listo"
- [ ] 1.4 Update "Temas de Unidad 1 que todavía faltan completar" to reflect U1 complete (or remove subsection)

## Phase 2: Camino actual — add Unidad 2 path

- [ ] 2.1 Verify "Camino actual de Unidad 1" has 8 rows (Complejos included) matching the U1 table in Phase 1
- [ ] 2.2 Add "Camino actual de Unidad 2" section: 7-row table in pedagogical order (polinomios_basico → operaciones_polinomios → ruffini_resto → factorizacion → gauss → mcm_mcd_polinomios → ecuaciones_fraccionarias), all "Listo", column shape matching U1 path table

## Phase 3: Fuente de verdad + Recent changes

- [ ] 3.1 Add `openspec/changes/STATUS.json` as the portable state source for SDD changes (multi-PC sync) to the Fuente de verdad table
- [ ] 3.2 Add recent changes note (≤5 lines): student identity (local persistence + switcher), visual redesign sprint v4, catalog readiness UI

## Phase 4: Verification

- [ ] 4.1 `git diff --stat` — confirm <150 changed lines on README.md
- [ ] 4.2 `wc -l README.md` — confirm ≤150 lines total
- [ ] 4.3 Read rendered README — verify U1 table (8 rows, Complejos included), U2 table (7 rows), U2 path table, recent changes note, STATUS.json reference visible
- [ ] 4.4 `grep "en construcción" README.md` — confirm U1/U2 no longer referenced
- [ ] 4.5 Run existing gates: `pnpm run test && pnpm run typecheck && pnpm run build` (no new tests needed; documentation-only)
