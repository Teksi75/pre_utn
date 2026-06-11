# Archive Report — unit-2-factorizacion-slice

**Status**: success
**Date**: 2026-06-10
**Change**: unit-2-factorizacion-slice
**Archivist**: orchestrator + sdd-archive-chinos
**Status**: done
**Mode**: hybrid (openspec + engram)

---

## 1. Why this change was archived

This change implemented the second pedagogical slice of Unidad 2 from the canonical UTN Mendoza curriculum PDF, covering **factorización** (7 cases, cap. 13) and **Teorema de Gauss** for rational roots (caps. 12–13). Two skills were implemented: **mat.u2.factorizacion** with 4 exercises covering 4 of the 7 canonic cases (factor común, trinomio cuadrado perfecto, diferencia de cuadrados, trinomio de segundo grado), and **mat.u2.gauss** with 4 exercises progressing from identifying p/q candidates to complete factorization combining Gauss + Ruffini + trinomio.

A new **gauss-routing-helper** domain module was built with strict TDD to handle order-insensitive rational root comparison with fraction-aware parsing, deduplication, and tolerance-based equivalence. Two new error tags (`u2_signo_factorizacion`, `u2_caso_incorrecto`) with detection patterns were added to the error taxonomy, and the `rufffini_resto` prerequisite was wired into the skill dependency graph for `mat.u2.factorizacion`.

Pedagogically, this slice represents the **algebraic heart** of U2: students can now identify and apply the 7 factoreo cases through theory/example/exercise, and find rational roots of polynomials using the Gauss theorem. The dependency chain is now complete: `polinomios_basico → operaciones_polinomios → ruffini_resto → factorizacion → gauss → mcm_mcd_polinomios`.

What was deferred: U2-Aplicaciones (mcm_mcd de polinomios + ecuaciones fraccionarias), refactor of monolithic exercises.json, and 3 factoreo cases (grupos, cuatrinomio cubo perfecto, potencias de igual grado) as standalone exercises — covered as sub-bloques in the TheoryNode but without specific exercises, defensible for MVP.

---

## 2. Implementation summary

| Phase | Branch | Merge commit | Lines | Tests added | Subject |
|-------|--------|-------------|-------|-------------|---------|
| PR-1 (domain) | feat/unit-2-factorizacion-domain | `a22e58b` | 1030 | 57 | gauss-helper + 2 error tags + 2 patterns + ruffini_resto dep + regression |
| PR-2 (content) | feat/unit-2-factorizacion-content | `0ca1105` | 415 | 12 | 2 theory nodes + 4 examples + 3 feedback + 8 exercises + ex.u2.gauss.1 re-creation + shape tests |
| **Total** | — | — | **1445** | **69** | — |

---

## 3. Verification summary

From `verify-report.md`:

| Metric | Value |
|--------|-------|
| Spec scenarios | 25/25 PASS |
| CRITICAL findings | 0 |
| WARNING findings | 2 (GGA bypassed on Windows, exercises.json monolithic) |
| SUGGESTION findings | 1 (3 factoreo cases without specific exercises, defensible for MVP) |
| Final gate | 1342 tests, typecheck clean, build green |
| Pedagogical verdict | PASS |

**WARNING details:**
- **V-001 (WARNING)**: GGA not executed on either PR due to Windows limitation (Codex CLI not available). Code passes typecheck + 1342 tests + build but lacks adversarial review. User must run GGA on Linux before final sign-off.
- **V-002 (WARNING)**: `exercises.json` contains 105 exercises (monolithic file). The factorizacion/Gauss exercises are correctly implemented, but the monolithic structure grows with each slice. Consider splitting by unit in a future refactor.
- **V-003 (SUGGESTION)**: 3 factoreo cases (factor común por grupos, cuatrinomio cubo perfecto, suma/diferencia de potencias de igual grado) are covered in the TheoryNode sub-bloques but lack independent exercises. Defensible for MVP — U2-Aplicaciones could add them if diagnosis shows need.

---

## 4. Spec promotion

| Spec | Action | Implementation file | Test file |
|------|--------|-------------------|-----------|
| `math-exercise-catalog/spec.md` | **DELTA applied** — U2 Factorización + Gauss Requirements (3 requirements + 9 scenarios merged in) | `content/matematica/exercises.json` (8 new/updated exercises) | `src/domain/__tests__/exercises-u2-shape.test.ts` (18 shape tests) |
| `math-error-taxonomy/spec.md` | **DELTA applied** — U2 Factorización Tags (3 requirements + 4 scenarios merged in) | `src/domain/error-taxonomy/index.ts` (2 new entries: u2_signo_factorizacion, u2_caso_incorrecto) | `src/domain/__tests__/error-taxonomy.test.ts` (16 tests) |
| `math-answer-evaluator/spec.md` | **DELTA applied** — U2 Factorización Evaluation Paths (4 requirements + 8 scenarios merged in) | `src/domain/evaluator/gauss-routing-helper.ts`, `src/domain/evaluator/error-tagging.ts` (2 new detectors), `src/domain/evaluator/index.ts` (gauss routing wire) | `src/domain/__tests__/gauss-routing-helper.test.ts` (30 tests), `src/domain/__tests__/error-tagging-u2-factorizacion.test.ts` (8 tests), `src/domain/__tests__/u1-regression.test.ts` (35 tests) |
| `math-skill-model/spec.md` | **DELTA applied** — U2 Factorización Skill Catalog Edits (2 requirements + 4 scenarios merged in) | `src/domain/models/skill-catalog.ts` (line 115: added ruffini_resto prerequisite) | `src/domain/__tests__/skill-catalog-factorizacion-deps.test.ts` (3 tests) |
| **No new full spec** | gauss-routing-helper is a thin internal module (documented as design decision ADR-002 in design.md). No top-level spec needed. | — | — |

---

## 5. Pedagogical impact (post-implementation)

### mat.u2.factorizacion
- **Theory node** (`theory-factorizacion`): 7 conceptBlocks covering all 7 factoreo cases (factor común, grupos, TCP, cubo perfecto, diferencia de cuadrados, potencias de igual grado, trinomio segundo grado). Each block includes definition, formula, example, and common error warning. PDF references to cap. 13, págs. 9–14.
- **Examples**: 2 worked examples (diferencia de cuadrados step-by-step, TCP with explicit double-product verification).
- **Exercises**: 4 exercises (difficulty 2→4): identify TCP vs trinomio 2do grado (MC), diferencia de cuadrados (MC), factor común máximo (numerical), trinomio a≠1 completo (symbolic via polynomial-evaluator). Distractors map to `u2_signo_factorizacion`, `u2_caso_incorrecto`, `u2_factorizacion_incompleta`.

### mat.u2.gauss
- **Theory node** (`theory-gauss`): 3 conceptBlocks (enunciado del teorema, algoritmo p/q paso a paso, ejemplo trabajado). PDF references to caps. 12–13, págs. 9, 14.
- **Examples**: 2 worked examples (cúbico con 3 raíces vía Gauss+Ruffini+trinomio, cuártico bicuadrático con 4 raíces enteras mostrando ruta alternativa por sustitución).
- **Exercises**: 4 exercises (difficulty 2→4): identificar raíces racionales de cúbico (MC), identificar candidatos p/q (MC), calcular raíces de polinomio grado 4 (numerical, two inputs), factorización completa combinando Gauss + trinomio (symbolic).

**Reference**: `material_canonico/Matemática/UNIDAD2_matemática.pdf`, caps 12–13.

---

## 6. Roadmap for U2 remaining topics

| Future slice | Skills | Depends on | Estimated effort |
|--------------|--------|------------|------------------|
| U2-Aplicaciones | mcm_mcd_polinomios, ecuaciones_fraccionarias | factorizacion (now done) | ~400-500 lines, 1-2 PRs |

---

## 7. Open follow-ups

- **GGA review on Linux**: User must run GGA on CachyOS Linux to validate the 2 PRs that were bypassed on Windows. If GGA flags real issues, file a follow-up change.
- **exercises.json monolithic**: Currently 105 exercises in a single file. Consider splitting by unit in a future refactor. Out of scope for this slice.
- **3 factoreo cases without specific exercises**: factor común por grupos, cuatrinomio cubo perfecto, suma/diferencia de potencias de igual grado. Defensible for MVP. U2-Aplicaciones or a future slice could add them if diagnosis shows pedagogical need.

---

## 8. References

### Specs (now in `openspec/specs/`)
- `openspec/specs/math-exercise-catalog/spec.md`
- `openspec/specs/math-error-taxonomy/spec.md`
- `openspec/specs/math-answer-evaluator/spec.md`
- `openspec/specs/math-skill-model/spec.md`

### Original delta specs (in archive)
- `openspec/changes/archive/2026-06-10-unit-2-factorizacion-slice/specs/math-exercise-catalog/spec.md`
- `openspec/changes/archive/2026-06-10-unit-2-factorizacion-slice/specs/math-error-taxonomy/spec.md`
- `openspec/changes/archive/2026-06-10-unit-2-factorizacion-slice/specs/math-answer-evaluator/spec.md`
- `openspec/changes/archive/2026-06-10-unit-2-factorizacion-slice/specs/math-skill-model/spec.md`

### SDD artifacts (in archive)
- `openspec/changes/archive/2026-06-10-unit-2-factorizacion-slice/exploration.md`
- `openspec/changes/archive/2026-06-10-unit-2-factorizacion-slice/proposal.md`
- `openspec/changes/archive/2026-06-10-unit-2-factorizacion-slice/design.md`
- `openspec/changes/archive/2026-06-10-unit-2-factorizacion-slice/tasks.md`
- `openspec/changes/archive/2026-06-10-unit-2-factorizacion-slice/verify-report.md`
- `openspec/changes/archive/2026-06-10-unit-2-factorizacion-slice/archive-report.md`

### Merge commits
- PR-1: `a22e58b` — feat(domain): add gauss-routing-helper, factorizacion error tags, detectors, and skill-catalog dep
- PR-2: `0ca1105` — feat(content): add U2 factorizacion and gauss theory, examples, feedback, and 8 exercises

### Canonical reference
- `material_canonico/Matemática/UNIDAD2_matemática.pdf` (caps 12–13)

---

## 9. Task Completion Gate verification

- All tasks in `tasks.md` are checked `[x]` — no stale unchecked implementation tasks.
- 2 PRs merged, all acceptance criteria met.
- Verify report confirms 25/25 spec scenarios PASS.
- 0 CRITICAL findings in verify report.

## 10. Status result

```yaml
status: done
completedAt: 2026-06-10
mergedTo: main
mergeCommit: 0ca1105
lastAudit: 2026-06-10T23:30:00-03:00
```

---

*Report generated by sdd-archive-chinos during the archive phase of unit-2-factorizacion-slice.*
