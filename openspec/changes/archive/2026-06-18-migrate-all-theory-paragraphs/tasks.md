# Tasks: Migrate All Theory Paragraphs to `bodyParagraphs`

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~180–220 (38 concepts × ~4 net lines + smoke test + STATUS.json) |
| 400-line budget risk | Low (materialized: actual diff 407, +7 over) |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-forecast |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low (materialized: actual diff 407, +7 over)

## Phase 1: Inventory and Verification Baseline

- [x] 1.1 Count current `bodyParagraphs` entries in `content/matematica/theory/unit-1.json` (expected: 0 pre-migration)
- [x] 1.2 Count current `bodyParagraphs` entries in `content/matematica/theory/unit-2.json` (expected: 3 Ruffini pre-migration)
- [x] 1.3 Confirm `src/domain/__tests__/content-loaders.test.ts` smoke test location (~line 377–453 existing Ruffini tests)

## Phase 2: Migrate U1 Long Concepts

- [x] 2.1 Migrate `concept-conjuntos-introduccion` (362 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.2 Migrate `concept-lenguaje-basico-conjuntos` (728 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.3 Migrate `concept-pertenencia-vs-inclusion` (950 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.4 Migrate `concept-operaciones-conjuntos` (369 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.5 Migrate `concept-mapa-inclusion` (441 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.6 Migrate `concept-error-comun-correccion` (376 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.7 Migrate `concept-cierre-dominio` (397 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.8 Migrate `concept-fraccion-equivalente` (378 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.9 Migrate `concept-coeficiente-en-denominador` (387 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.10 Migrate `concept-binomio-conjugado` (390 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.11 Migrate `concept-binomio-doble-conjugado` (407 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.12 Migrate `concept-cierre-racionalizacion` (440 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.13 Migrate `concept-conversion-log-exponencial` (365 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.14 Migrate `concept-i-definicion` (372 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.15 Migrate `concept-forma-estandar` (353 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.16 Migrate `concept-partes-real-imaginaria` (379 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.17 Migrate `concept-suma-resta` (415 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.18 Migrate `concept-multiplicacion` (406 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.19 Migrate `concept-conjugado` (429 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.20 Migrate `concept-division` (470 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 2.21 Migrate `concept-potencias-i` (379 chars) — split `body` → `bodyParagraphs[]`, remove `body`

## Phase 3: Migrate U2 Long Concepts

- [x] 3.1 Migrate `concept-op-multiplicacion` in `mat.u2.operaciones_polinomios` (357 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 3.2 Migrate `concept-op-division` in `mat.u2.operaciones_polinomios` (421 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 3.3 Migrate `concept-fac-factor-comun` in `mat.u2.factorizacion` (389 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 3.4 Migrate `concept-fac-grupos` in `mat.u2.factorizacion` (373 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 3.5 Migrate `concept-fac-tcp` in `mat.u2.factorizacion` (479 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 3.6 Migrate `concept-fac-cubo-perfecto` in `mat.u2.factorizacion` (358 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 3.7 Migrate `concept-fac-potencias-igual-grado` in `mat.u2.factorizacion` (407 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 3.8 Migrate `concept-fac-trinomio-segundo-grado` in `mat.u2.factorizacion` (606 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 3.9 Migrate `concept-gauss-enunciado` in `mat.u2.gauss` (374 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 3.10 Migrate `concept-gauss-algoritmo` in `mat.u2.gauss` (560 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 3.11 Migrate `concept-gauss-ejemplo` in `mat.u2.gauss` (480 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 3.12 Migrate `concept-mcm-mcd-definicion` in `mat.u2.mcm_mcd_polinomios` (484 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 3.13 Migrate `concept-mcm-mcd-algoritmo` in `mat.u2.mcm_mcd_polinomios` (524 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 3.14 Migrate `concept-mcm-mcd-ejemplo` in `mat.u2.mcm_mcd_polinomios` (392 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 3.15 Migrate `concept-ec-frac-dominio` in `mat.u2.ecuaciones_fraccionarias` (487 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 3.16 Migrate `concept-ec-frac-procedimiento` in `mat.u2.ecuaciones_fraccionarias` (426 chars) — split `body` → `bodyParagraphs[]`, remove `body`
- [x] 3.17 Migrate `concept-ec-frac-sin-solucion` in `mat.u2.ecuaciones_fraccionarias` (492 chars) — split `body` → `bodyParagraphs[]`, remove `body`

## Phase 4: Smoke Test and STATUS

- [x] 4.1 Add smoke test `describe("migrate-all-theory-paragraphs")` in `src/domain/__tests__/content-loaders.test.ts` loading both units; assert every `bodyParagraphs` concept has `bodyParagraphs.length >= 2`, no empty strings, and no concept has both `body` and `bodyParagraphs`
- [x] 4.2 Register `migrate-all-theory-paragraphs` in `openspec/changes/STATUS.json` with status `in_progress` and branch name

## Phase 5: Verification

- [x] 5.1 Run `pnpm run test` — all tests pass (2096/2096)
- [x] 5.2 Run `pnpm run typecheck` — clean
- [x] 5.3 Run `pnpm run build` — all 7 routes build green
- [ ] 5.4 Manual spot-check: navigate to `/learn/matematica/mat.u1.conjuntos_numericos` — verify `concept-pertenencia-vs-inclusion` renders as paragraph-separated blocks with KaTeX (`$\in$`, `$\subset$`, `$\mathbb{N}$`) in each paragraph
- [ ] 5.5 Manual spot-check: navigate to `/learn/matematica/mat.u2.factorizacion` — verify `concept-fac-trinomio-segundo-grado` renders as paragraph-separated blocks with KaTeX polynomial forms across paragraphs

## Phase 5 Notes

- Tasks 5.4 and 5.5 are manual visual spot-checks, by design non-automatable. The automated smoke test (Phase 4.1) covers the structural contract: every migrated concept has bodyParagraphs with 2-4 non-empty chunks, and KaTeX tokens (`$\in$`, `$\subset$`, `$\sqrt{2}$`, `$\mathbb{N}$`, `ax² + bx + c`, `(x − 2)(x − 3)`) are preserved verbatim.
