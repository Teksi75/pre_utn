# Archive Report — unit-2-pedagogical-slice

**Status**: success
**Date**: 2026-06-10
**Change**: unit-2-pedagogical-slice
**Archivist**: orchestrator + sdd-archive-chinos
**Status**: done
**Mode**: hybrid (openspec + engram)

---

## 1. Why this change was archived

This change implemented the first pedagogical slice of Unidad 2 (Polinomios) from the canonical UTN Mendoza curriculum PDF. Three skills were implemented: **polinomios_basico** (caps 1–8), **operaciones_polinomios** (cap 9), and **ruffini_resto** (caps 10–11). Each skill includes a theory node, 2 worked examples, and 4 exercises with progression from difficulty 1 to 4. A new **polynomial-evaluator** domain module was built with strict TDD to verify polynomial equivalence across expanded, factored, and coefficient-array forms.

The slice adds 12 new exercises, 6 new `u2_*` error tags with detection patterns, 3 content JSON files (theory, examples, feedback), skill dependency corrections, and a U1 regression guard. It was delivered across 3 chained PRs totaling ~930 lines of diff and 148 new tests, raising the test count from 1119 to 1267.

Pedagogically, this means caps 1–11 of the U2 PDF now have structured digital support: students can practice identifying degree, classifying monomials/binomials/trinomials, evaluating P(3), normalizing coefficients, adding/subtracting/multiplying polynomials, and applying Ruffini's rule and the remainder theorem — all with immediate corrective feedback mapped to specific `u2_*` error tags.

What was deferred: factorización (7 cases), mcm_mcd de polinomios, ecuaciones fraccionarias, and long division as interactive exercise. These are planned for subsequent U2 slices (U2-Factorización, U2-Aplicaciones, U2-Interactividad).

---

## 2. Implementation summary

| Phase | PR | Branch | Merge commit | Lines | Tests added | Subject |
|-------|----|--------|-------------|-------|-------------|---------|
| PR-1 (domain) | feat/unit-2-domain | `e3dae59` | 350 | 79 | polynomial-evaluator + types + TDD |
| PR-2 (content) | feat/unit-2-content | `be45a68` | 480 | 45 | 12 exercises + 6 tags + JSON |
| PR-3 (integration) | feat/unit-2-integration | `1464f07` | 100 | 24 | U1 regression + QA |
| **Total** | — | — | **930** | **148** | — |

---

## 3. Verification summary

From `verify-report.md`:

| Metric | Value |
|--------|-------|
| Spec scenarios | 32/32 PASS |
| CRITICAL findings | 0 |
| WARNING findings | 2 (GGA bypassed on Windows, zombie branch pre-existing) |
| SUGGESTION findings | 1 (tangential tag on ruffini_resto.5) |
| Final gate | 1267 tests, typecheck clean, build green |
| Pedagogical verdict | PASS |

**WARNING details:**
- **V-001 (WARNING)**: GGA not executed on any of the 3 PRs due to Windows limitation (Codex CLI not available). Code passes typecheck + 1267 tests + build but lacks adversarial review. User must run GGA on Linux before sign-off.
- **V-002 (WARNING)**: Pre-existing zombie branch `setup-gga-gate` detected by audit script. Out of scope for this change; user should clean up separately.
- **V-003 (SUGGESTION)**: `u2_signo_operacion` on `ex.u2.ruffini_resto.5` is tangential for a Ruffini factorization exercise. Defensible as-is.

---

## 4. Spec promotion

| Spec | Action | Implementation file | Test file |
|------|--------|-------------------|-----------|
| `polynomial-evaluator` | **NEW** — copied to `openspec/specs/polynomial-evaluator/spec.md` | `src/domain/evaluator/polynomial-evaluator.ts` | `src/domain/__tests__/polynomial-evaluator.test.ts` + `polynomial-evaluator.edge-cases.test.ts` |
| `math-answer-evaluator` | **DELTA applied** — U2 evaluation paths (5 requirements + 9 scenarios appended) | `src/domain/evaluator/index.ts`, `src/domain/evaluator/error-tagging.ts` | `src/domain/__tests__/evaluator-index.test.ts`, `evaluator-error-tagging-u2.test.ts`, `u1-regression.test.ts` |
| `math-error-taxonomy` | **DELTA applied** — U2 error tags (3 requirements + 4 scenarios appended) | `src/domain/error-taxonomy/index.ts` | `src/domain/__tests__/error-taxonomy.test.ts` |
| `math-exercise-catalog` | **DELTA applied** — U2 exercise catalog (6 requirements + 7 scenarios appended) | `content/matematica/exercises.json` | `src/domain/__tests__/exercises-u2-shape.test.ts` |
| `math-skill-model` | **No spec change needed** — data-only edit to SKILL_DEPENDENCIES | `src/domain/models/skill-catalog.ts` | `src/domain/__tests__/skill-catalog-u2-deps.test.ts` |

---

## 5. Pedagogical impact (post-implementation)

### polinomios_basico
- **Theory node**: Covers definition, degree, numerical value, roots, ordering, equality, and opposites (caps 1–8). PDF references are precise.
- **Examples**: 2 worked examples (degree/coefficients, numerical value with positive/negative).
- **Exercises**: 4 exercises (difficulty 1→3): identify degree (MC), classify (MC), evaluate P(3) (numerical), normalize coefficients (symbolic). Distractors map to `u2_grado_incorrecto`, `u2_signo_operacion`, `u2_termino_faltante`.

### operaciones_polinomios
- **Theory node**: Covers addition, subtraction, multiplication, and long division (cap 9). Long division is presented as procedure with worked example, no interactive exercise (by design).
- **Examples**: 2 worked examples (subtraction with sign distribution, product of binomials).
- **Exercises**: 4 exercises (difficulty 2→4): sum (MC), subtraction (MC), coefficient product (numerical), binomial product (symbolic).

### ruffini_resto
- **Theory node**: Covers Ruffini's rule and remainder theorem (caps 10–11). Clear explanation of `a` sign and step-by-step procedure.
- **Examples**: 2 worked examples (remainder theorem, complete Ruffini with coefficient table).
- **Exercises**: 4 exercises (difficulty 2→4): remainder theorem (MC), evaluate P(−1) (numerical), quotient via Ruffini (MC), factor verification + product (symbolic). Tag `u2_ruffini_signo_a` correctly assigned.

**Reference**: `material_canonico/Matemática/UNIDAD2_matemática.pdf`, caps 1–11.

---

## 6. Roadmap for U2 remaining topics

| Future slice | Skills | Depends on | Estimated effort |
|--------------|--------|------------|------------------|
| U2-Factorización | factorizacion (7 cases), gauss | ruffini_resto (now done) | ~500-700 lines, possibly 2 PRs |
| U2-Aplicaciones | mcm_mcd_polinomios, ecuaciones_fraccionarias | factorizacion | ~400-500 lines, 1-2 PRs |
| U2-Interactividad División Larga | (extension) | operaciones_polinomios | ~200-300 lines, 1 PR (optional) |

---

## 7. Open follow-ups

- **GGA review on Linux**: User must run GGA on CachyOS Linux to validate the 3 PRs that were bypassed on Windows. If GGA flags real issues, file a follow-up change.
- **Zombie branch `setup-gga-gate`**: Pre-existing, 74 commits behind, 2 ahead. Out of scope for this archive. User should clean up separately with `pnpm run audit:branches --fix`.
- **SUGGESTION on `ex.u2.ruffini_resto.5`**: The `u2_signo_operacion` error tag is tangential for a factorization exercise. Defensible but worth a future review. Low priority.

---

## 8. References

### Specs (now in `openspec/specs/`)
- `openspec/specs/polynomial-evaluator/spec.md`
- `openspec/specs/math-exercise-catalog/spec.md`
- `openspec/specs/math-error-taxonomy/spec.md`
- `openspec/specs/math-answer-evaluator/spec.md`
- `openspec/specs/math-skill-model/spec.md`

### Original delta specs (in archive)
- `openspec/changes/archive/2026-06-10-unit-2-pedagogical-slice/specs/polynomial-evaluator/spec.md`
- `openspec/changes/archive/2026-06-10-unit-2-pedagogical-slice/specs/math-exercise-catalog/spec.md`
- `openspec/changes/archive/2026-06-10-unit-2-pedagogical-slice/specs/math-error-taxonomy/spec.md`
- `openspec/changes/archive/2026-06-10-unit-2-pedagogical-slice/specs/math-answer-evaluator/spec.md`
- `openspec/changes/archive/2026-06-10-unit-2-pedagogical-slice/specs/math-skill-model/spec.md`

### SDD artifacts (in archive)
- `openspec/changes/archive/2026-06-10-unit-2-pedagogical-slice/exploration.md`
- `openspec/changes/archive/2026-06-10-unit-2-pedagogical-slice/proposal.md`
- `openspec/changes/archive/2026-06-10-unit-2-pedagogical-slice/design.md`
- `openspec/changes/archive/2026-06-10-unit-2-pedagogical-slice/tasks.md`
- `openspec/changes/archive/2026-06-10-unit-2-pedagogical-slice/qa-report.md`
- `openspec/changes/archive/2026-06-10-unit-2-pedagogical-slice/verify-report.md`

### Merge commits
- PR-1: `e3dae59` — feat(domain): add polynomial evaluator module with TDD
- PR-2: `be45a68` — feat(content): add U2 theory, examples, feedback, exercises, and catalog extensions
- PR-3: `1464f07` — chore(sdd): integrate U2 slice, regression guard, archive

### Canonical reference
- `material_canonico/Matemática/UNIDAD2_matemática.pdf` (caps 1–11)

---

## 9. Task Completion Gate verification

- All tasks in `tasks.md` are checked `[x]` — no stale unchecked implementation tasks.
- 3 PRs merged, all acceptance criteria met.
- Verify report confirms 32/32 spec scenarios PASS.
- 0 CRITICAL findings in verify report.

## 10. Status result

```yaml
status: done
completedAt: 2026-06-10
mergedTo: main
mergeCommit: 1464f07
lastAudit: 2026-06-10T22:30:00-03:00
```

---

*Report generated by sdd-archive-chinos during the archive phase of unit-2-pedagogical-slice.*
