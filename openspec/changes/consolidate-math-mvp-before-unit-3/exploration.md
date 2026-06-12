# Exploration: consolidate-math-mvp-before-unit-3

> **Status:** Complete (diagnostic only, no code changes)
> **Date:** 2026-06-12
> **Change:** consolidate-math-mvp-before-unit-3
> **Depends on:** 13 archived OpenSpec changes (Unit 1 + Unit 2 + Teacher Home), pedagogical-model-audit exploration, U1-r2 audit (`docs/auditorias/unidad-1/`)

---

## 1. Current State (verified 2026-06-12)

The Math MVP consolidates 8 Unit 1 skills + 7 Unit 2 skills behind a single Teacher Digital Home dashboard. Gates are GREEN right now: 1584/1584 tests pass (83 test files, ~8.6s), `tsc --noEmit` clean, `next build` clean. No active branches, no zombie branches, no critical issues open.

### What works well

| Area | Evidence |
|------|----------|
| **Domain purity** | `src/domain/` has zero React/Next/Supabase imports (verified by inspection). All math logic is pure TS, fully TDD-covered. |
| **Per-skill guided practice** | `usePracticeFlow.ts` runs a 6-phase machine (select → theory → example → exercise → feedback → recovery → complete) with blocked-skill banner, previous-snapshot, retry timing, attempt index. |
| **Prerequisite enforcement** | `accessibility.ts` blocks skills whose prerequisites are below 70% accuracy. `analyzeRequestedSkill` covers `unknown-skill`, `no-content`, `missing-prerequisite`. |
| **Error taxonomy + detectors** | 12+ `u2_*` tags (signo, termino_semejante, ruffini_signo_a, grado_incorrecto, factorizacion_incompleta, signo_factorizacion, caso_incorrecto, denominador_cero, confunde_mcm_mcd, etc.) with TDD detectors. |
| **Polynomial evaluator** | TDD module with `parseExpanded`, `parseFactored`, `parseCoefficientArray`, `areEquivalent`. 3 GGA-confirmed bugs fixed in `polynomial-evaluator-input-validation` slice. |
| **Teacher Digital Home** | `deriveTeacherHomeViewModel` is pure, drives 4 dumb UI panels (Hero, MathRoute, StudentSituation, DecisionBoard). 27 domain tests cover 11 spec scenarios. |
| **Persistence** | `lib/practice-progress.ts` is a versioned localStorage adapter with backward-compat normalization. |

### What was deferred / known fragile

From verify reports of unit-2-pedagogical-slice, unit-2-factorizacion-slice, unit-2-aplicaciones-slice, teacher-digital-home, and U1-r2 audit:

| # | Finding | Source | Severity |
|---|---------|--------|----------|
| F-01 | `content/matematica/exercises.json` is monolithic (1484 lines, ~106 exercises U1 + ~39 U2). | U2-factorización verify #SUGGESTION | Important |
| F-02 | `validatePracticeBank` category minimums (e.g. `pertenencia >= 8`) are U1-specific but apply globally — false-positive diagnostics on U2 skills. | U2-aplicaciones verify #WARNING | Important |
| F-03 | `parseSkillUnit` duplicated in `src/domain/next-step/index.ts` (L10-13) and `src/domain/teacher-home/index.ts` (L412-415). | teacher-home verify #WARNING | Improvement |
| F-04 | Spec-design type mismatch in `teacher-home`: spec defines 4-field `TeacherHomeInput` (with `isReady`), design uses 3-param `deriveHomeNextStep`. | teacher-home verify #WARNING | Improvement |
| F-05 | `mcm_mcd_polinomios` difficulty monotonicity is partial (range only, not strictly monotonic). | U2-aplicaciones verify #WARNING | Improvement |
| F-06 | GGA bypassed on Windows (Codex CLI not available) for unit-2-pedagogical-slice, unit-2-factorizacion-slice, polynomial-evaluator-input-validation, unit-2-aplicaciones-slice. `chore(gga): use opencode provider` (d9dffab) just landed but no re-validation. | All 4 U2 verify reports | Important |
| F-07 | `setup-gga-gate` entry in STATUS.json is a "recovery" (recovered via merge on 2026-06-10). Branch is gone; status reads "done" but the audit script still flags it. | STATUS.json + audit script | Improvement |
| F-08 | `pedagogicalNote` is populated for `conjuntos_numericos` exercises but absent in the other 7 U1 skills. Inconsistency: the "voz del docente" lives in some content and not others. | U1-r2 audit H-05 | Important |
| F-09 | 5/5 MC of `valor_absoluto` + 10/10 exercises of `logaritmos` lack `relatedTheoryIds`/`relatedExampleIds` — pattern, not isolated case. | U1-r2 audit H-02 | Important |
| F-10 | No coverage tooling. `vitest.config.ts` has no `--coverage` provider. We can count tests but cannot see *what code is exercised*. The project relies on triangulation + assertion quality audits, not coverage gates. | Every verify report | Critical |
| F-11 | `mat.u1.intervalos` has only 4 exercises; the domain supports `IntervalRepresentation` with union/intersection/complement that is not exercised. | U1-r2 audit H-03 | Important |
| F-12 | `mat.u1.reales_operaciones` (now `propiedades_operaciones_reales`) has 4 exercises, all numerical on order-of-operations + grouping signs. Missing: distributiva explícita, comparación de reales, fracciones como operandos. | U1-r2 audit H-04 | Important |
| F-13 | `H-22` from U1-r2 (resolved by `feat-practice-attempt-timing-and-retry`). PedagogyEvent still deferred. | U2 verify (this slice) | Improvement |
| F-14 | `mcm_mcd_polinomios` and `factorizacion` have 3 factoreo cases without specific exercises (defensible for MVP, but the gap will show in U3 prerequisites). | U2-factorización verify #SUGGESTION | Improvement |
| F-15 | `feedbackMappings` for `u2_*` tags exist in `feedback/unit-2.json` (4 mappings for 12+ tags). Coverage is `mappings/tags_referenciados` = 1.0 (every used tag has a mapping), but unused tags (e.g. `u2_aislamiento_variable`) have no detector and no mapping. | domain inspection | Improvement |
| F-16 | Difficulty `1-5` is freeform (no calibration against real U1 diagnostic data or guide results). | U1 canonical material | Improvement |
| F-17 | `specs/natural-numbers-convention` exists, content follows it; not yet enforced as a runtime check on exercises that reference 0 in a `N`-context. | U1-r2 audit | Improvement |
| F-18 | `specs/code-review-gate` and `specs/pre-commit-hooks` exist (from `setup-gga-gate` recovery) but no automated check enforces the review budget (400 lines). | specs/ inspection | Improvement |
| F-19 | No CI workflow file (`.github/workflows/`) is committed. The GGA pre-commit is local-only. Multi-PC work relies on GGA per machine + local discipline. | repo inspection | Important |
| F-20 | `Bank-validator-pr4.test.ts` (U1 only) does not cover U2 skills. Per-skill bank validation is asymmetric. | tests inspection | Improvement |

### Pedagogical depth (already excellent, do not regress)

- **Diagnostic shell** at `/diagnostic`: `selectBalancedSet` (deterministic, balanced across units) → `estimateSkills` (per-skill accuracy) → `suggestPractice` (below 70%). Persisted to localStorage as `DiagnosticResult`.
- **Recovery phase** in practice flow shows `feedbackMappings[*].message` + `recoveryTarget` link to theory.
- **Variety enforcement**: `exercise-option-shuffle.ts` randomizes MC options to avoid positional bias.

---

## 2. Affected Areas

### Files that will likely change in a consolidation change

| Path | Why it could move |
|------|-------------------|
| `vitest.config.ts` | Add `@vitest/coverage-v8` provider + threshold (F-10). |
| `content/matematica/exercises.json` | Split into per-skill/per-unit files (F-01). |
| `src/domain/catalog/index.ts` | Adapt loader to per-skill composition (F-01). |
| `src/domain/catalog/content-loaders.ts` | Per-skill/per-unit registry pattern already in place for `conjuntos_numericos`; extend it (F-01). |
| `src/domain/catalog/content-loaders.ts` (`validatePracticeBank`) | Scope category minimums per-unit (F-02). |
| `src/domain/shared/` (new) | Extract `parseSkillUnit` to a shared module (F-03). |
| `src/domain/next-step/index.ts` + `src/domain/teacher-home/index.ts` | Import from shared (F-03). |
| `src/domain/catalog/content-loaders.ts` + `src/domain/__tests__/validate-practice-bank.test.ts` | Extend tests to cover U2 skills (F-20). |
| `src/domain/__tests__/exercises-u2-shape.test.ts` (or new file) | Add strict per-skill difficulty monotonicity test (F-05, F-16). |
| `content/matematica/exercises.json` (U1 subset) | Backfill `pedagogicalNote` for 7 skills (F-08). |
| `content/matematica/exercises.json` (U1 subset) | Backfill `relatedTheoryIds` + `relatedExampleIds` for `valor_absoluto` and `logaritmos` (F-09). |
| `openspec/changes/STATUS.json` | Annotate `setup-gga-gate` as `branch: null, recovery: true` (F-07). |
| `openspec/specs/teacher-digital-home/spec.md` | Update spec to match implemented 3-param design (F-04). |
| `.github/workflows/ci.yml` (new) | Run `pnpm test:run` + `typecheck` + `build` + GGA on PRs (F-19). |

### Files that MUST NOT change in a consolidation change

| Path | Reason |
|------|--------|
| `src/domain/evaluator/polynomial-evaluator.ts` | TDD-bugfixed in `polynomial-evaluator-input-validation`. Stable. |
| `src/domain/evaluator/index.ts` (routing guards) | U1 + U2 routing stable. |
| `src/domain/error-taxonomy/index.ts` | Tag set is stable. Consolidation is about packaging, not taxonomy. |
| `src/app/practice/usePracticeFlow.ts` | Working state machine; only the loader boundary should change. |
| `src/components/practice/*.tsx` | UI works. |
| `src/app/page.tsx`, `src/components/home/HomeNextStepClient.tsx` | Teacher Digital Home just landed. |

### Tests to extend (TDD-first, before any change)

- `src/domain/__tests__/validate-practice-bank.test.ts` — add cases for U2 skills (F-02, F-20).
- `src/domain/__tests__/exercises-u2-shape.test.ts` — add strict difficulty monotonicity (F-05).
- New `src/domain/__tests__/difficulty-monotonicity.test.ts` — covers all 15 pilot skills (F-16).
- `src/domain/__tests__/catalog-content.test.ts` — add `pedagogicalNote` non-empty for all U1 skills except `conjuntos_numericos` (already covered) (F-08).
- `src/domain/__tests__/catalog-answer-contract.test.ts` — add `relatedTheoryIds`/`relatedExampleIds` non-empty for `valor_absoluto` and `logaritmos` (F-09).

---

## 3. Approaches

### Approach A — Diagnostic-first consolidation (RECOMMENDED)

A single OpenSpec change composed of 3-4 chained PRs, each autonomous, each <400 lines:

1. **PR-1 — Safety net (TDD only)**: Add strict per-skill difficulty monotonicity test + backfill `pedagogicalNote` and `relatedTheoryIds`/`relatedExampleIds` on the existing exercises. RED → GREEN by backfilling, no schema change. F-05, F-08, F-09.
2. **PR-2 — Coverage tooling + CI**: Add `@vitest/coverage-v8`, configure v8 provider in `vitest.config.ts`, set a soft floor (e.g. 60% on `src/domain/`), add `.github/workflows/ci.yml` that runs test/typecheck/build/coverage on every push. F-10, F-19.
3. **PR-3 — Content file split (per-unit JSON)**: Split `exercises.json` into `exercises/unit-1.json` + `exercises/unit-2.json`, update `content-loaders.ts` registry, scope `validatePracticeBank` minimums per-unit. F-01, F-02, F-20.
4. **PR-4 — Tech debt cleanup (small)**: Extract `parseSkillUnit` to `src/domain/shared/skill-id.ts`, update `next-step` and `teacher-home` imports. Update `teacher-digital-home` spec to match design. Annotate STATUS.json `setup-gga-gate` entry. Re-run GGA on Linux for the 4 U2 PRs that bypassed. F-03, F-04, F-06, F-07.

| Pros | Cons | Effort |
|------|------|--------|
| Each PR is reviewable in isolation (<400 lines) | 4 PRs = 4 PR-cycles | Low per PR (Medium total) |
| Coverage comes BEFORE more U3 content is added | Coverage threshold is a guess; may need tuning | |
| Content split prevents merge conflicts on the now-1500-line file during U3 work | Per-unit PR is a refactor; needs careful re-verification | |
| Tech-debt cleanup is a clean "shakedown" before U3 | | |
| GGA re-validation closes a documented process gap | | |

**Estimated total diff**: 800-1200 lines across 4 PRs, 100-150 new tests, no behavior change. Strict TDD: every new test fails before code, passes after.

### Approach B — Broad refactor in a single change

Single mega-PR touching exercises.json split, coverage, monotonicity, pedagogicalNote backfill, parseSkillUnit extraction, GGA re-validation, spec updates.

| Pros | Cons | Effort |
|------|------|--------|
| One change to review | 1200+ lines diff = review budget violation (E from sdd-phase-common) | High |
| No multi-PR coordination | Hard to roll back partially if one part fails | |
| | Single point of failure for U3 timeline | |

**Verdict**: Rejected. Violates the 400-line review budget and complicates rollback.

### Approach C — Skip consolidation, start Unit 3 directly

Proceed to `unit-3-fundamentos-slice` (recommended U3 first slice per `2026-06-11-post-u2-next-options.md`).

| Pros | Cons | Effort |
|------|------|--------|
| Forward motion | Builds U3 on a foundation with 4 known important gaps (F-01, F-02, F-10, F-19) and 9 improvements | Low |
| | Coverage gap means we won't know if U3 evaluators are well-tested | |
| | exercises.json will keep growing (now ~1500 lines, +U3 exercises → 2200+ lines) | |
| | GGA process gap means U3 PRs may also bypass review | |

**Verdict**: Rejected. User explicitly said "prefiiero consolidar antes, qué propones" on 2026-06-12. The known gaps will compound during U3.

### Approach D — Parallel: pre-create U3 branch + apply safety net to main

| Pros | Cons | Effort |
|------|------|--------|
| No serialization | Multi-PC sync cost: U3 branch must rebase when main advances | High coordination |
| | Two active branches violate STATUS.json source-of-truth model | |
| | Each PC needs to track both branches | |

**Verdict**: Rejected. The project is multi-PC (per AGENTS.md §"Gestión de ramas SDD (multi-PC)"); parallel branches amplify sync risk.

---

## 4. Recommendation

**Approach A — Diagnostic-first consolidation, 4 chained PRs.**

Rationale (in order of weight):

1. **F-10 (no coverage) is a process gap, not just a tooling gap.** Without coverage, every U3 PR is reviewed blind. Adding coverage tooling + a soft floor *before* U3 means reviewers can require coverage on new code in U3.
2. **F-01 (monolithic exercises.json) compounds fast.** U3 will add ~40-50 exercises, theory, examples, and feedback. Doing the split now is ~50% of the work of doing it during U3 (when the file would be ~2200 lines).
3. **F-02 (validatePracticeBank U1 bias) is a U2 regression risk.** Every time someone runs validation for U2 skills today, they get false-positive diagnostics. A new contributor will spend time chasing them. Fixing the per-unit scoping closes a "noise" gap.
4. **F-19 (no CI) is a single-PC risk.** The project is multi-PC. CI on PR is the only way to know a PR doesn't break main on a machine you don't have.
5. **F-08 + F-09 (pedagogicalNote + relatedTheoryIds backfill) are content debt, easy to close.** Strict TDD: write the test, see it fail, backfill the content, see it pass.
6. **F-03, F-04, F-05, F-07 are small tech-debt items** that are easier to clean up now than after U3 lands.
7. **F-06 (GGA re-validation)** is a single PC pass on Linux; closes a documented process gap.

### Out of scope (do NOT do in this change)

- **F-11, F-12 (U1 exercise content gaps in `intervalos` / `propiedades_operaciones_reales`)** — these are content authoring, not consolidation. Belong in a separate `expand-u1-coverage` change. Out of scope here.
- **F-13 (PedagogyEvent deferred)** — already tracked. Not a consolidation item.
- **F-14, F-15 (unused error tags, factoreo cases without exercises)** — defensible for MVP. Not a blocker.
- **F-16 (difficulty calibration against real data)** — requires running a real cohort; out of engineering scope.
- **F-17 (N-without-zero runtime check)** — conventions doc covers it; runtime check can wait.
- **F-18 (automated 400-line review budget)** — design consideration, not a code change.

### Sequencing detail (for sdd-propose)

```
PR-1 (Safety net, TDD-only)
  - Add tests for: difficulty monotonicity per skill, pedagogicalNote coverage,
    relatedTheoryIds/relatedExampleIds coverage
  - Backfill content to make them pass
  - ~150 lines diff (test + content)
  - No schema change
  - 0 new domain code

PR-2 (Coverage + CI)
  - pnpm add -D @vitest/coverage-v8
  - vitest.config.ts: add coverage provider + soft floor
  - .github/workflows/ci.yml: new file
  - ~80 lines diff (config + yaml)

PR-3 (Content file split + per-unit validator)
  - Move exercises.json entries to per-unit files
  - Update content-loaders registry
  - Scope validatePracticeBank minimums per-unit
  - Extend validate-practice-bank.test.ts to cover U2
  - ~400 lines diff (mostly mechanical)

PR-4 (Tech debt + GGA re-validation)
  - New src/domain/shared/skill-id.ts (parseSkillUnit)
  - Update next-step/index.ts and teacher-home/index.ts imports
  - Update teacher-digital-home spec to match design (3-param)
  - Annotate STATUS.json setup-gga-gate entry
  - Run gga on Linux for the 4 U2 PRs that bypassed
  - ~120 lines diff
```

Total: ~750 lines, 4 PRs, no behavior change. All gates remain green throughout.

---

## 5. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Coverage threshold blocks legitimate new code on edge cases** | Low | Use a soft floor (60% on `src/domain/`), warn-only at first; tighten later when stable. |
| **Content split changes load order subtly** | Medium | TDD: write a test that asserts the per-unit composition produces the same exercise count per skill; if it changes, fail loud. |
| **GGA re-validation on Linux surfaces new issues in already-merged U2 PRs** | Medium | Acceptable — open a follow-up change per finding, do not roll back U2. The point of re-validation is *learning*, not regression-policing. |
| **Per-skill difficulty monotonicity test fails on existing content** | High | Audit first; the test is RED at the start of PR-1, GREEN at the end. If a skill has non-monotonic difficulty, re-order (don't remove) exercises by ID-suffix. |
| **Coverage tool adds significant test runtime** | Low | v8 provider is fast. Run coverage only in CI, not on watch mode. |
| **4-PR chain stretches the U3 timeline** | Low | Each PR is small enough to ship in one session. Total wall-clock ~1-2 days. Better than discovering the gaps during U3 review. |
| **Multi-PC sync: PR-1 must be on a single PC first** | Low | Per AGENTS.md: pre-commit hook serializes; STATUS.json is the single source of truth. |
| **CI workflow needs secrets for branch protection** | Low | For first iteration, run CI as informational only; do not require status checks. |

---

## 6. Ready for Proposal

**Yes** — the exploration is sufficient to launch `sdd-propose` on this same change name (`consolidate-math-mvp-before-unit-3`).

The orchestrator should confirm with the user:

1. **Scope**: The 4-PR chain above (F-10 + F-01 + F-02 + F-19 + F-03/04/05/07/08/09/20 closure).
2. **Out of scope**: U1 content gaps (F-11, F-12), difficulty calibration (F-16), N-without-zero runtime check (F-17), 400-line automated gate (F-18).
3. **Delivery**: 4 chained PRs to main, each autonomous, each <400 lines, each verifiable independently.
4. **Pre-conditions**: No active branches (verified ✓). `main` is clean (verified ✓). All gates green (verified ✓: 1584/1584 tests).
5. **Next change after this**: `unit-3-fundamentos-slice` (per `2026-06-11-post-u2-next-options.md`).

The orchestrator should also surface the user's earlier preference (`prefiiero consolidar antes, qué propones` 2026-06-12 10:28 + `totally agree, let's go with diagnostic SDD` 2026-06-12 10:30) as the binding intent.

---

## 7. SDD Result Envelope

**Status**: success
**Summary**: Math MVP is in a green, solid, well-tested state (1584/1584 tests, typecheck + build clean, 0 active branches, 0 critical issues). 20 follow-up findings catalogued across 13 archived verify reports and the U1-r2 audit, classified by severity. Recommended approach: 4-PR diagnostic-first consolidation (coverage tooling + CI, per-unit content split + per-unit validator, content backfill tests, tech-debt cleanup) totaling ~750 lines and ~150 new tests, with no behavior change. Approach leaves U1 content gaps and difficulty calibration explicitly out of scope.
**Artifacts**: Engram `sdd/consolidate-math-mvp-before-unit-3/explore` | `openspec/changes/consolidate-math-mvp-before-unit-3/exploration.md`
**Next**: sdd-propose (define 4-PR scope and acceptance criteria for each PR)
**Risks**: Coverage-tool blocking legitimate code (Low); content split load-order subtle change (Medium); GGA Linux re-validation surfacing new U2 findings (Medium — accepted as learning); per-skill monotonicity test failing on existing content (High — handled by re-order, not removal)
**Skill Resolution**: paths-injected — 4 skills (sdd-explore, cognitive-doc-design, web-design-guidelines, vercel-react-best-practices)
