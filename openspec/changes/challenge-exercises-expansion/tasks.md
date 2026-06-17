# Tasks: Challenge Exercises Expansion

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~960 total across 4 PRs (~160/160/320/320) |
| 400-line budget risk | Low (each PR ≤ 320) |
| Chained PRs recommended | Yes |
| Suggested split | PR 0 (micro) → PR A → PR B → PR C → PR D (stacked to main) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 0 | Typo fix micro-PR | PR 0 (micro) | Fix `来源于` in `complejos.desafio-01`; audit other 5 entries for foreign fragments; base=main |
| A | U1 early skills | PR A | Append 4 challenges (potencias_raices, racionalizacion) to unit-1.json; base=main |
| B | U1 middle skills | PR B | Append 4 challenges (intervalos, logaritmos) to unit-1.json; base=main (after A merged) |
| C | U1 remaining + U2 early | PR C | Append 8 challenges (conjuntos_numericos, propiedades_operaciones_reales to unit-1.json; polinomios_basico, operaciones_polinomios to unit-2.json); base=main (after B merged) |
| D | U2 final skills | PR D | Append 8 challenges (ruffini_resto, factorizacion, gauss, mcm_mcd_polinomios) to unit-2.json; base=main (after C merged); update STATUS.json to done |

---

## Phase 0: Hygiene micro-PR (prerequisite, separate from batches)

- [ ] 0.1 Branch `fix/challenge-complejos-typo` from main. Read `content/matematica/challenges/unit-1.json`, locate `ex.u1.complejos.desafio-01.pedagogicalIntent`, replace the `来源于` fragment with Spanish text that preserves the original intent.
- [ ] 0.2 Audit the other 5 existing challenge entries for non-Spanish fragments; fix any found.
- [ ] 0.3 Run `pnpm run test` + `pnpm run typecheck`; merge micro-PR to main with `--no-ff`.

---

## Phase 1: Batch A — U1 early skills (potencias_raices, racionalizacion)

- [ ] 1.1 Branch `feat/challenge-exercises-expansion-batch-a` from main (after Phase 0 merged).
- [ ] 1.2 Author `ex.u1.potencias_raices.desafio-01` (signs/parenthesization/precedence; MC 4 options; difficulty 4; canonicalTrace UNIDAD1 + Resolución TEMA 2; commonErrorTags from real taxonomy) and append to `content/matematica/challenges/unit-1.json`.
- [ ] 1.3 Author `ex.u1.potencias_raices.desafio-02` (rational exponent equivalence; MC 4 LaTeX options `$a^{...}$`; difficulty 4; canonicalTrace UNIDAD1 + calibrated-from-exam).
- [ ] 1.4 Author `ex.u1.racionalizacion.desafio-01` (conjugate of `√3+√2`; MC 4 LaTeX options; difficulty 4; canonicalTrace UNIDAD1).
- [ ] 1.5 Author `ex.u1.racionalizacion.desafio-02` (conjugate of `√3-1`; MC 4 LaTeX options; difficulty 4).
- [ ] 1.6 Run `pnpm run test` + `pnpm run typecheck` + `pnpm run build` (loader validates at init).
- [ ] 1.7 Verify each distractor maps to a real `commonErrorTag` (manual content audit).
- [ ] 1.8 Open PR A; merge to main with `--no-ff` after review.

---

## Phase 2: Batch B — U1 middle skills (intervalos, logaritmos)

- [ ] 2.1 Branch `feat/challenge-exercises-expansion-batch-b` from main (after Batch A merged).
- [ ] 2.2 Author `ex.u1.intervalos.desafio-01` (union `[-2,4) ∪ (1,6]`; MC 4 interval options; difficulty 4; canonicalTrace UNIDAD1).
- [ ] 2.3 Author `ex.u1.intervalos.desafio-02` (reverse-engineer B from `A ∩ B` and A; MC 4 options; difficulty 4).
- [ ] 2.4 Author `ex.u1.logaritmos.desafio-01` (`log_2 x + log_4 x + log_8 x = 11`; MC 4 options; difficulty 4; canonicalTrace UNIDAD1 + TEMA 1 Q3 calibrated-from-exam).
- [ ] 2.5 Author `ex.u1.logaritmos.desafio-02` (express `log 12` in terms of `a=log2, b=log3`; MC 4 options; difficulty 4).
- [ ] 2.6 Run `pnpm run test` + `pnpm run typecheck` + `pnpm run build`.
- [ ] 2.7 Manual content audit: distractor→commonErrorTag mapping; no verbatim exam copy.
- [ ] 2.8 Open PR B; merge to main with `--no-ff`.

---

## Phase 3: Batch C — U1 remaining + U2 early (4 skills, 8 challenges, ~320 lines)

- [ ] 3.1 Branch `feat/challenge-exercises-expansion-batch-c` from main (after Batch B merged).
- [ ] 3.2 Author `ex.u1.conjuntos_numericos.desafio-01` (classify `∛(-8)`; MC 4 set options ℕ/ℤ/ℚ/ℝ; difficulty 4; canonicalTrace UNIDAD1).
- [ ] 3.3 Author `ex.u1.conjuntos_numericos.desafio-02` (set builder with quantifier; MC 4 set-description options; difficulty 4).
- [ ] 3.4 Author `ex.u1.propiedades_operaciones_reales.desafio-01` (identify false property; MC 4 options; difficulty 4).
- [ ] 3.5 Author `ex.u1.propiedades_operaciones_reales.desafio-02` (binary op `a*b = a+b-ab`; MC 4 numeric options; difficulty 4).
- [ ] 3.6 Append the 4 U1 entries to `content/matematica/challenges/unit-1.json`.
- [ ] 3.7 Author `ex.u2.polinomios_basico.desafio-01` (`P(3)-P(-2)`; MC 4 numeric options; difficulty 4; canonicalTrace UNIDAD2).
- [ ] 3.8 Author `ex.u2.polinomios_basico.desafio-02` (Vieta sum of roots; MC 4 numeric options; difficulty 4).
- [ ] 3.9 Author `ex.u2.operaciones_polinomios.desafio-01` (coefficient of x in product; MC 4 options; difficulty 4).
- [ ] 3.10 Author `ex.u2.operaciones_polinomios.desafio-02` (sum of polynomials, find `a+b`; MC 4 options; difficulty 4).
- [ ] 3.11 Append the 4 U2 entries to `content/matematica/challenges/unit-2.json`.
- [ ] 3.12 Run `pnpm run test` + `pnpm run typecheck` + `pnpm run build`.
- [ ] 3.13 Manual content audit (distractors, no-copy, Spanish pedagogicalNote).
- [ ] 3.14 Open PR C; merge to main with `--no-ff`.

---

## Phase 4: Batch D — U2 final skills (4 skills, 8 challenges, ~320 lines)

- [ ] 4.1 Branch `feat/challenge-exercises-expansion-batch-d` from main (after Batch C merged).
- [ ] 4.2 Author `ex.u2.ruffini_resto.desafio-01` (Ruffini quotient coefficients; MC 4 comma-list options; difficulty 4; canonicalTrace UNIDAD2).
- [ ] 4.3 Author `ex.u2.ruffini_resto.desafio-02` (Remainder Theorem `P(-2)`; MC 4 numeric options; difficulty 4).
- [ ] 4.4 Author `ex.u2.factorizacion.desafio-01` (common factor with mixed powers; MC 4 LaTeX options; difficulty 4).
- [ ] 4.5 Author `ex.u2.factorizacion.desafio-02` (nested difference of squares `x⁴-81`; MC 4 LaTeX options; difficulty 4).
- [ ] 4.6 Author `ex.u2.gauss.desafio-01` (full factorization via Gauss+Ruffini+TCP; MC 4 LaTeX options; difficulty 4; canonicalTrace UNIDAD2 + calibrated-from-exam).
- [ ] 4.7 Author `ex.u2.gauss.desafio-02` (rational root candidate set; MC 4 set options; difficulty 4).
- [ ] 4.8 Author `ex.u2.mcm_mcd_polinomios.desafio-01` (MCM of factored polys; MC 4 LaTeX options; difficulty 4).
- [ ] 4.9 Author `ex.u2.mcm_mcd_polinomios.desafio-02` (MCD of factored polys; MC 4 LaTeX options; difficulty 4).
- [ ] 4.10 Append the 8 entries to `content/matematica/challenges/unit-2.json`.
- [ ] 4.11 Run `pnpm run test` + `pnpm run typecheck` + `pnpm run build`.
- [ ] 4.12 Manual content audit (distractors, no-copy, Spanish, real tags).
- [ ] 4.13 Open PR D; merge to main with `--no-ff`.

---

## Phase 5: Closeout

- [ ] 5.1 Update `openspec/changes/STATUS.json`: add entry for `challenge-exercises-expansion` with `status: "done"`, `mergedTo: "main"`, `branch: null`.
- [ ] 5.2 Commit STATUS.json update.
- [ ] 5.3 Run `sdd-verify` against the 5 spec requirements + 14 scenarios.
- [ ] 5.4 Run `sdd-archive` to sync delta specs to `openspec/specs/challenge-exercises/`.
- [ ] 5.5 Delete all 4 batch feature branches (local + remote) per AGENTS.md branch policy.

---

## Per-Task Authoring Rubric (reference)

Every authored challenge MUST satisfy: `type: "multiple-choice"`, exactly 4 `options` (LaTeX-rendered), `difficulty: 4`, `challengeSection: true`, `category: "desafio"`, `tags: ["desafio","integrador"]`, `canonicalTrace` ≥1 entry with `sourceUse` ∈ {`canonical-source`,`adapted`,`calibrated-from-exam`,`solution-pattern`}, `commonErrorTags` from `src/domain/error-taxonomy/`, `pedagogicalNote` in Spanish explaining reasoning + what each distractor traps, `id` matching `ex.u{unit}.{slug}.desafio-{01|02}`.

---

## Dependency Graph

```
Phase 0 (PR 0 micro) ──► Phase 1 (PR A) ──► Phase 2 (PR B) ──► Phase 3 (PR C) ──► Phase 4 (PR D) ──► Phase 5 (closeout)
  fix typo                  4 challenges       4 challenges        8 challenges         8 challenges          STATUS.json
  unit-1.json               unit-1.json        unit-1.json         unit-1.json +        unit-2.json           sdd-verify
                                               unit-2.json         unit-2.json                                sdd-archive
                                                                                                                branch cleanup
```

---

## Rollback Checklist

After rolling back any batch:
- `pnpm run test` passes (no regression)
- `pnpm run typecheck` passes
- `pnpm run build` passes (loader validates at init)
- Previously merged batches remain intact (stacked-to-main pattern)
- `openspec/changes/STATUS.json` reflects actual merged state
