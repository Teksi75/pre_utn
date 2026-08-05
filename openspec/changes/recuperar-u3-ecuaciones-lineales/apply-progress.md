# Apply Progress: Recover U3 Ecuaciones Lineales — PR1

**Change**: `recuperar-u3-ecuaciones-lineales`
**Project**: `pre_utn`
**Mode**: Strict TDD (RED → GREEN → REFACTOR per task; worktree: `C:\dev\pre_utn-worktrees\recuperar-u3-ecuaciones-lineales-pr1`; branch: `feat/u3-ecuaciones-lineales-pr1`; base: `origin/main` @ `e81af3f54b1bfb9d833c1a9d00a55d086f6ea60b`)
**Date**: 2026-07-17
**Status**: PR1 implementation complete (3/3 tasks); raw planning provenance restored; independent review and publication have not started; PR2 remains pending per the approved chained-PR plan.
**Approved planning authority**: checkpoint `5bc5df7285289062a4c3b0231eecb0237f861be8`; lineage `review-465197662e993db6`; ref `origin/sdd/u3-linear-equations-planning-checkpoint` (ref re-confirmed at the checkpoint before remediation).
**Approved planning artifacts**: contractual bytes frozen at the approved checkpoint. A fresh verifier disproved the earlier 08:02 SHA-256 assertion (0/7 raw matches before this remediation). All seven files were subsequently restored directly from their Git blobs and verified with `git hash-object --no-filters` (7/7 raw matches; see "Planning Artifact Raw Provenance" below):
- `openspec/changes/recuperar-u3-ecuaciones-lineales/proposal.md`
- `openspec/changes/recuperar-u3-ecuaciones-lineales/exploration.md`
- `openspec/changes/recuperar-u3-ecuaciones-lineales/design.md`
- `openspec/changes/recuperar-u3-ecuaciones-lineales/tasks.md` (Phase 1 tasks 1.1-1.3 still `- [ ]`; completion recorded here, NOT in the planning artifact, per orchestrator directive "do not mark task checkboxes inside the approved planning artifact")
- `openspec/changes/recuperar-u3-ecuaciones-lineales/specs/math-exercise-catalog/spec.md`
- `openspec/changes/recuperar-u3-ecuaciones-lineales/specs/math-error-taxonomy/spec.md`
- `openspec/changes/recuperar-u3-ecuaciones-lineales/specs/challenge-exercises/spec.md`

---

## PR1 Scope (what this apply actually implemented)

Goal: make the existing `isU3AislamientoIncorrectoError` MC-only detector reachable from real catalog content for `mat.u3.ecuaciones_lineales`, without widening the 12-tag U3 baseline, without introducing new tags/detectors/feedback, and without writing any `canonicalTrace` (per the U3LIN-CAT-004 / U3LIN-CHAL-004 PR1-autonomous guarantee).

Concrete deliverables:
- 2 new MC items in `content/matematica/exercises/unit-3.json` declaring `u3_aislamiento_incorrecto`.
- 5 new tests across 3 test files proving the detector is reachable end-to-end through the live catalog.
- 1 baseline bump in `catalog-split-equivalence.test.ts` so the safety-net snapshot reflects the 2 new items.
- 0 changes to `src/domain/error-taxonomy/`, `src/domain/evaluator/error-tagging.ts`, or any other U3/U4/U5/U6 content (12-tag baseline + detector + dispatch preserved exactly).

PR2 (P1l canonical exercise + `u3_racionalizacion_irracional` tag + U3 challenge) is **explicitly excluded** from this apply; the .6 ID is reserved and guarded against by test.

## Workload / PR Boundary

- **Delivery strategy (from `tasks.md`)**: chained PRs; `stacked-to-main`.
- **Forecast (PR1 row)**: ≤210 lines | 400-line risk Low | focused test cmd `pnpm run test:run src/domain/__tests__/u3-exercise-shape.test.ts src/domain/__tests__/content-loaders-u3.test.ts src/domain/__tests__/evaluator-index.test.ts`.
- **Actual (PR1 apply)**: 195 changed lines (189 insertions, 6 deletions) across 5 files; well under the 400-line review budget. **No `size:exception` required.**
- **Rollback boundary**: revert the 5 tracked files (2 MC items in `unit-3.json`, 4 new tests across 3 test files, 1 baseline bump in `catalog-split-equivalence.test.ts`). U3 12-tag baseline + 4 legacy numerical `ex.u3.ecuaciones_lineales.2-5` + the .6 P1l reservation are all preserved on revert.

## Completed Tasks (Strict TDD, RED → GREEN → REFACTOR per task)

### Phase 1 — PR1 `feat/u3-ecuaciones-lineales-base` → main

- [x] **1.1 RED** — shape + content-loaders-u3 + evaluator integration: MC declares `u3_aislamiento_incorrecto` AND `loadExercisesForSkill` + `evaluateAnswer(wrongOption)` → tag = `u3_aislamiento_incorrecto`
- [x] **1.2 GREEN `exercises/unit-3.json`** — added `.7` + `.8` MC isolation (difficulty 2-3, 4 options, no free-text, `commonErrorTags: ["u3_aislamiento_incorrecto"]`); `.6` reserved for P1l
- [x] **1.3 REFACTOR** — 12-tag unchanged; focused cmd green; then `pnpm run test && pnpm run typecheck && pnpm run build` all green; merge `--no-ff` (commit pending; apply batch is uncommitted per the launch directive)

### Phase 2 — PR2 `feat/u3-ecuaciones-lineales-p1l` → PR1 (EXCLUDED from this apply)

All Phase 2 tasks remain unchecked. The 11 Phase 2 rows (2.0 BASE GATE through 2.10 REFACTOR) are documented in `tasks.md` and tracked in this artifact's "PR2 Exclusions" section below for audit. PR2 will be a separate apply pass after PR1 merges, gated on the canonical-trace base-gate 2.0 (e553648 is already on `origin/main`, so PR2 can proceed once PR1 lands).

---

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1.a | `src/domain/__tests__/u3-exercise-shape.test.ts` (1st new test) | Domain (catalog reachability) | ✅ 15/15 pre-existing tests in file | ✅ Wrote first: `mat.u3.ecuaciones_lineales catalog contains an MC exercise that declares u3_aislamiento_incorrecto` — FAILED (0 MC items, got 0) | ✅ Test passes after GREEN 1.2 added `.7` + `.8` | ➖ Single reachability assertion (binary: ≥1 MC item exists with the tag); the next test (1.1.b) covers the "only on MC" guard | ➖ Test is clean as written |
| 1.1.b | `src/domain/__tests__/u3-exercise-shape.test.ts` (2nd new test) | Domain (declared-only guard) | ✅ Pre-existing catalog of 12 declared `u3_*` tags | ✅ Wrote first: `u3_aislamiento_incorrecto is declared only on MC items` — PASSED vacuously (no items declare it yet) | ✅ Test still passes after GREEN 1.2 (2 MC items declare it, both are MC) | ➖ Single guard assertion | ➖ N/A |
| 1.1.c | `src/domain/__tests__/content-loaders-u3.test.ts` (1st new test, `U3LIN-CAT-001` catalog) | Domain (loader contract) | ✅ 64/64 pre-existing tests in file | ✅ Wrote first: `U3LIN-CAT-001: mat.u3.ecuaciones_lineales loads at least one MC exercise that declares u3_aislamiento_incorrecto` — FAILED (0) | ✅ Test passes after GREEN 1.2 | ✅ Multi-assertion: ≥1 MC item + ≥4 options + expectedAnswer in options (covers both isolated and full reachability) | ➖ Test is clean |
| 1.1.d | `src/domain/__tests__/content-loaders-u3.test.ts` (2nd new test, `U3LIN-CAT-001` source) | Domain (raw source + .6 reservation) | ✅ Pre-existing | ✅ Wrote first: `U3LIN-CAT-001: unit-3.json source declares u3_aislamiento_incorrecto on at least one MC item (no alias on numerical items)` — FAILED (0) | ✅ Test passes after GREEN 1.2; .6 reservation guard trivially satisfied (.6 doesn't exist) | ➖ Single source + reservation | ➖ N/A |
| 1.1.e | `src/domain/__tests__/evaluator-index.test.ts` (1st new test, evaluateAnswer integration) | Domain (dispatcher integration) | ✅ 40/41 pre-existing tests in file | ✅ Wrote first: `evaluateAnswer on an MC isolation catalog item returns u3_aislamiento_incorrecto for the post-subtraction distractor` — FAILED (catalog item not found) | ✅ Test passes after GREEN 1.2; verifies the full path: find catalog item → correct answer evaluates `correct: true` with no tag → wrong distractor (intermediate = `c - b`) evaluates `correct: false` with `errorTag: "u3_aislamiento_incorrecto"` | ✅ End-to-end integration: 3 assertions cover (a) catalog finds the item, (b) correct path is clean, (c) wrong path fires the tag | ➖ Test is clean |
| 1.2 | (no test file — production change) | Content (`unit-3.json`) | ✅ 5 RED tests from 1.1 above | ➖ N/A — content change is the GREEN | ✅ Added `ex.u3.ecuaciones_lineales.7` (3x + 4 = 19, post-subtraction distractor = "x = 15") and `ex.u3.ecuaciones_lineales.8` (-2x + 7 = 1, post-subtraction distractor = "x = -6") | ➖ N/A | ➖ N/A |
| 1.3 | (full suite + typecheck + build) | Validation suite | ✅ 3341/3341 pre-existing | N/A | ✅ `pnpm run test` 3346/3346, `pnpm run typecheck` clean, `pnpm run build` 11/11 routes | ➖ Single full-suite run | ➖ Baseline bump in `catalog-split-equivalence.test.ts` (223→225, unit-3 42→44) is the only refactor — documented inline in that file's header comment with a "+2 PR1 of recuperar-u3-ecuaciones-lineales" line |

### RED count (sum): **4 of 5 new tests** failed against the unchanged production content.

- 1.1.a FAILED (got 0 MC items)
- 1.1.b PASSED (vacuously; no item declares the tag yet, so the "only on MC" guard is trivially satisfied)
- 1.1.c FAILED (got 0)
- 1.1.d FAILED (got 0)
- 1.1.e FAILED (catalog item not found)

The vacuous pass on 1.1.b is intentional: it locks the design invariant (the MC-only detector must never see a numerical item) so a future regression (someone adds a numerical `exercises/unit-3.json` entry declaring `u3_aislamiento_incorrecto`) is caught immediately. The test is a regression guardrail, not a discoverable failure.

### GREEN count (sum): **5 of 5 new tests** pass after the `.7` + `.8` content addition. The single content production change flipped all 4 REDs to GREEN while keeping the vacuous guard GREEN.

---

## Test-by-test RED → GREEN evidence

| Test | RED (pre-edit) | GREEN (post-edit, after `.7` + `.8` added) |
|------|----------------|---------------------------------------------|
| `u3-exercise-shape > isolation detector reachability (PR1) > mat.u3.ecuaciones_lineales catalog contains an MC exercise that declares u3_aislamiento_incorrecto` | ❌ FAIL — `expected 0 to be greater than or equal to 1` (catalog had only 4 numerical items) | ✅ PASS (catalog now has 2 MC items declaring the tag) |
| `u3-exercise-shape > isolation detector reachability (PR1) > u3_aislamiento_incorrecto is declared only on MC items` | ✅ PASS (vacuous; no item declared the tag) | ✅ PASS (2 items declare the tag, both `type: multiple-choice`) |
| `content-loaders-u3 > U3LIN-CAT-001 > mat.u3.ecuaciones_lineales loads at least one MC exercise that declares u3_aislamiento_incorrecto` | ❌ FAIL — `expected ≥1 MC isolation exercise in mat.u3.ecuaciones_lineales, got 0` | ✅ PASS; secondary assertions (≥4 options, expectedAnswer in options) also GREEN |
| `content-loaders-u3 > U3LIN-CAT-001 > unit-3.json source declares u3_aislamiento_incorrecto on at least one MC item (no alias on numerical items)` | ❌ FAIL — `unit-3.json must carry an MC isolation item for mat.u3.ecuaciones_lineales` | ✅ PASS; .6 reservation guard trivially satisfied (no `.6` exists yet) |
| `evaluator-index > U3 aislamiento_incorrecto integration via evaluateAnswer (PR1) > evaluateAnswer on an MC isolation catalog item returns u3_aislamiento_incorrecto for the post-subtraction distractor` | ❌ FAIL — `catalog must contain an MC ecuaciones_lineales item declaring u3_aislamiento_incorrecto` | ✅ PASS; correct path: `correct: true, errorTag: undefined`; wrong distractor path: `correct: false, errorTag: "u3_aislamiento_incorrecto"` |

---

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `content/matematica/exercises/unit-3.json` | Modified | +32 lines: added `ex.u3.ecuaciones_lineales.7` (3x + 4 = 19, multiple-choice, difficulty 2, 4 options, `commonErrorTags: ["u3_aislamiento_incorrecto"]`) and `ex.u3.ecuaciones_lineales.8` (-2x + 7 = 1, multiple-choice, difficulty 3, 4 options, `commonErrorTags: ["u3_aislamiento_incorrecto"]`). Both carry post-subtraction distractors that fire the existing `isU3AislamientoIncorrectoError` detector. `ex.u3.ecuaciones_lineales.6` deliberately NOT added — reserved for PR2 P1l canonical exercise. |
| `src/domain/__tests__/u3-exercise-shape.test.ts` | Modified | +34 lines: new `describe("U3 exercise shape — isolation detector reachability (PR1)")` with 2 tests (catalog reachability + declared-only-on-MC guard). |
| `src/domain/__tests__/content-loaders-u3.test.ts` | Modified | +55 lines: new `describe("U3LIN-CAT-001 — u3_aislamiento_incorrecto reachability (PR1)")` with 2 tests (loader contract on `loadExercisesForSkill` + raw source assertion on `UNIT_EXERCISE_FILES[3]` with .6 reservation guard). |
| `src/domain/__tests__/evaluator-index.test.ts` | Modified | +60 lines: new `describe("U3 aislamiento_incorrecto integration via evaluateAnswer (PR1)")` with 1 end-to-end test (find catalog item → correct path clean → wrong distractor fires `u3_aislamiento_incorrecto` via the existing detector). |
| `src/domain/__tests__/catalog-split-equivalence.test.ts` | Modified | +8/-6 lines: baseline bump (`BASELINE_TOTAL` 223→225, `BASELINE_UNIT_3` 42→44) to reflect the 2 new MC items. Header comment updated with `+2 PR1 of recuperar-u3-ecuaciones-lineales` line. This is the safety-net snapshot test; the bump is required for the existing `expect(results.length).toBe(BASELINE_UNIT_3)` assertion to pass. |

**New files created** (this PR1 apply batch):
- `openspec/changes/recuperar-u3-ecuaciones-lineales/apply-progress.md` — this file (the canonical apply-progress evidence artifact, per SDD apply skill Step 6 + orchestrator directive).

**Planning artifacts** (contractual content restored from approved checkpoint `5bc5df7`):
- `openspec/changes/recuperar-u3-ecuaciones-lineales/{proposal,exploration,design,tasks,specs/*/spec}.md` — 7 files. The initial worktree copies were not byte-identical; focused remediation restored each file directly from its checkpoint blob. The final `git hash-object --no-filters` comparison is 7/7 (see "Planning Artifact Raw Provenance" below).

---

## Deviations from Design

**None** — implementation matches `design.md` PR1 plan exactly:
- `design.md` table lists `src/domain/__tests__/u3-exercise-shape.test.ts` (PR1) "Assert isolation reachability" — done (2 new tests).
- `design.md` lists `src/domain/__tests__/content-loaders-u3.test.ts` (PR1) "Assert catalog/readiness loading" — done (2 new tests).
- `design.md` lists `content/matematica/exercises/unit-3.json` (PR1) "Add isolation MC items" — done (`.7` + `.8`).
- `design.md` does NOT list `evaluator-index.test.ts` in the PR1 file-changes table, but the spec `U3LIN-CAT-001` mandates the evaluateAnswer integration for the spec's "u3_aislamiento_incorrecto is reachable in the catalog" scenario. The `evaluator-index.test.ts` test is the implementation of that scenario's "WHEN evaluateAnswer runs" clause; it does not add code, only an integration assertion on the existing `evaluateAnswer` + `tagError` machinery.
- 12-tag baseline (8 originals + 3 modeling tags + legacy `u3_direccion_desigualdad` = 12) preserved — no taxonomy change.
- `ErrorTag` contract (`{ id, unit, description, examples }`, no `label`) preserved — no model widening.
- `canonicalTrace` is not touched; PR1 has no `parseOptionalCanonicalTrace` / `auditU3TraceSourceUse` dependency.

---

## Issues Found

**1 issue found during apply** (corrected in-place; does not affect final state):
- **Voice convention drift** (caught during REFACTOR 1.3): my first draft of the two new `pedagogicalNote` strings used Rioplatense voseo ("restá 4 en ambos miembros", "dividís por 3") because the agent persona's user-facing language is voseo. The existing U3 pedagogical notes in the same file (e.g. `ex.u3.ecuaciones_lineales.2` "Aísla el término con x restando 4 en ambos lados y luego divide por 3") consistently use *tú* imperatives ("resta", "divide"), not voseo. I corrected the two new notes to *tú* form before declaring GREEN. This is a per-repo convention distinct from the agent's user-facing voseo; captured in Engram observation `obs-2766b3bb59d8cd30` (topic: `u3-content-voice-tú-not-voseo`) so future content authors don't repeat the drift.

---

## Key Discoveries

1. **Catalog content + declared-tag guard + MC-only detector = three-way contract.** None of the three is enough alone. The new tests 1.1.a/c/d prove the catalog has the item; 1.1.b proves the item type matches the detector's input domain (MC); 1.1.e proves the integration end-to-end. A future change that silently broke any one of the three (e.g. by swapping an MC item for numerical, or by removing the tag from `commonErrorTags`) would trip at least one of these tests, not just the original `error-tagging-u3.test.ts` unit tests.
2. **Detector's "intermediate = c − b" pattern is parameterised on the prompt's `ax ± b = c` form.** The new tests 1.1.e parses the prompt at test-time and computes the expected intermediate, so the test stays correct if the prompt constants change (e.g. the orchestrator decides difficulty 2.5 should swap constants). The test is bound to the detector's *contract*, not to the specific constants in the production content.
3. **The .6 reservation guard in 1.1.d is a forward-looking test.** It will become meaningful when PR2 adds `ex.u3.ecuaciones_lineales.6`; until then it trivially passes. The guard's job is to fail loudly if PR1 accidentally claimed `.6` (it didn't) or if a future PR1 re-scope tried to push PR2 content into this slice.

---

## PR2 Exclusions (explicit, per the approved chained-PR plan)

The following Phase 2 tasks are NOT implemented in this apply batch and are tracked in `tasks.md` (still `- [ ]`). They are out of scope for PR1 and will be a separate apply pass after PR1 merges:

| Task | What it does (per `tasks.md`) | Why excluded from PR1 |
|------|--------------------------------|------------------------|
| 2.0 | BASE GATE: verify `e553648` is an ancestor of base OR `parseOptionalCanonicalTrace` + `auditU3TraceSourceUse` are importable | PR1 is autonomous — no `canonicalTrace` write, no dependency on those symbols |
| 2.1 | RED `error-tagging-u3.test.ts`: (i) retained irrational denominator fires tag; (ii) correct rationalization undefined; (iii) declared-only guard | PR2 introduces the `u3_racionalizacion_irracional` detector — PR1 does not need it |
| 2.2 | RED `error-taxonomy-u3.test.ts`: U3 = 12 + new tag = 13; `ErrorTag` contract preserved | PR2 introduces the 13th U3 tag — PR1 keeps the 12-tag baseline |
| 2.3 | RED `loader.test.ts`: CHAL-001 + CHAL-002 + `traduccion_lenguaje_verbal` keeps 2 | PR2 introduces the U3 challenge — PR1 has no challenge |
| 2.4 | RED integration `error-tagging-u3.test.ts`: load `.6` + challenge; `evaluateAnswer` wrong option → tag; `generateFeedback` → new `recoveryTarget` | PR2-specific (depends on the new tag + challenge) |
| 2.5 | RED `content-loaders-u3.test.ts`: CAT-002 — `.6` `canonicalTrace[0].path` within repo; `sourceUse ∈ {adapted, reinforcement, reference}` (NO `alignment`); feedback 11 → 12; `recoveryTarget` → example id | PR2-specific (P1l exercise + feedback growth) |
| 2.6 | GREEN `error-taxonomy/index.ts` + `error-tagging.ts`: append `u3_racionalizacion_irracional` + `U3_RACIONALIZACION_IRRACIONAL_TAGS` set + safe-first predicate | PR2 introduces the new tag and detector |
| 2.7 | GREEN `exercises/unit-3.json`: add `.6` P1l (MC, difficulty 4, 4 options, `commonErrorTags=[new tag]`, `canonicalTrace[0].path=...`, `sourceUse=adapted`) | PR2 introduces the canonical P1l exercise — `.6` is RESERVED for PR2 (test 1.1.d guards this) |
| 2.8 | GREEN `challenges/unit-3.json`: add `.desafio-01` (MC, difficulty 5, 4 options, `challengeSection: true`, `category: "desafio"`, `tags: ["desafio","integrador"]`, `commonErrorTags=[new tag]`, CHALLENGE `sourceUse`) | PR2 introduces the U3 challenge at difficulty 5 |
| 2.9 | GREEN `feedback/unit-3.json` + `u3-exercise-shape.test.ts`: add rationalization feedback + extend declared catalog 12 → 13 | PR2-specific (new tag + feedback growth) |
| 2.10 | REFACTOR: focused cmd green; then full suite; `traduccion_lenguaje_verbal` keeps 2 challenges; merge `--no-ff` | PR2 closeout |

**Other PR2-only items from the design/proposal** (not in `tasks.md` rows but equally out of scope for PR1):
- `u3_racionalizacion_irracional` taxonomy entry in `src/domain/error-taxonomy/index.ts` — PR2 only.
- `isU3RacionalizacionIrracionalError` predicate in `src/domain/evaluator/error-tagging.ts` — PR2 only.
- `U3_RACIONALIZACION_IRRACIONAL_TAGS` set in the same file — PR2 only.
- `u3_racionalizacion_irracional` feedback mapping in `content/matematica/feedback/unit-3.json` — PR2 only.
- `content/matematica/challenges/unit-3.json` modifications — PR2 only (PR1 does not touch challenges).
- Any change to `ErrorTag` model or `error-tag.ts` — explicitly preserved (no `label` field, no model widening).

**Out-of-scope per design (regardless of PR)** (not even PR2): U2, free-text answers, "profe digital" copy, personalization, persistence, theory schema, `feat/align-u3-practice-official-exercises`, read-only `0f79d63`, archived `-fundacion-minima` and `-traza`, `validateTracePath`, `useChallengeFlow`. None touched in PR1.

---

## Verification (commands + exact results)

All commands run from `C:\dev\pre_utn-worktrees\recuperar-u3-ecuaciones-lineales-pr1`. The pre-edit RED results are listed in the "TDD Cycle Evidence" table above (4 of 5 new tests failed; 1 vacuous guard passed).

### Focused test command (from `tasks.md` PR1 row)

```bash
pnpm run test:run src/domain/__tests__/u3-exercise-shape.test.ts \
                   src/domain/__tests__/content-loaders-u3.test.ts \
                   src/domain/__tests__/evaluator-index.test.ts
```

Result: `Test Files 3 passed (3) | Tests 124 passed (124) | Duration 1.26s | exit 0`

### Catalog-safety-net test (baseline bump regression guard)

```bash
pnpm run test:run src/domain/__tests__/catalog-split-equivalence.test.ts
```

Result: `Test Files 1 passed (1) | Tests 11 passed (11) | Duration 0.97s | exit 0`

### Error-tagging suite (12-tag baseline regression)

```bash
pnpm run test:run src/domain/__tests__/error-tagging-u3.test.ts \
                   src/domain/__tests__/error-taxonomy-u3.test.ts
```

Result: `Test Files 2 passed (2) | Tests 58 passed (58) | exit 0`

### Brand-voice gate

```bash
pnpm run test:run src/domain/__tests__/copy-strings-acceptance.test.ts
```

Result: `Test Files 1 passed (1) | Tests 97 passed (97) | exit 0`

### Full test suite

```bash
pnpm run test
```

Result: `Test Files 199 passed (199) | Tests 3346 passed (3346) | Duration 21.40s | exit 0`

### Typecheck

```bash
pnpm run typecheck
```

Result: `tsc --noEmit` → 0 errors, exit 0.

### Build

```bash
pnpm run build
```

Result: Compiled successfully in 5.6s; TypeScript phase finished in 12.3s; 11/11 Next.js routes built (1 middleware proxy), exit 0.

Non-blocking warnings observed across the validation run: Node `DEP0205` (`module.register()` deprecation), Node localStorage experimental availability, and Next.js middleware-to-proxy deprecation. No warning changed command exit status.

### Worktree state (reconfirmed during focused provenance remediation on 2026-07-17)

- HEAD: `e81af3f54b1bfb9d833c1a9d00a55d086f6ea60b`, exactly matching freshly fetched `origin/main`; merge-base is the same commit.
- Branch: `feat/u3-ecuaciones-lineales-pr1`; the apply batch remains uncommitted and unpublished.
- Tracked modified: the 5 pre-existing PR1 implementation files plus the minimum portable lifecycle update to `openspec/changes/STATUS.json`.
- Untracked change artifact directory: 7 planning files restored byte-for-byte from the checkpoint plus this `apply-progress.md` evidence artifact.
- Independent review, commit, push, and PR publication have not started.
- Protected original checkout `C:\dev\pre_utn` remains untouched; only the specified PR1 worktree was mutated.

### Protected checkout guard

- `C:\dev\pre_utn` was NOT modified.
- Worktree: `C:\dev\pre_utn-worktrees\recuperar-u3-ecuaciones-lineales-pr1` only.

---

## Planning Artifact Raw Provenance

### Disproved prior assertion and exact mismatch cause

The earlier 08:02 claim that all seven files were byte-identical was false. A fresh Git-object-aware comparison resolved each checkpoint blob with `git ls-tree`, hashed each working file with `git hash-object --no-filters`, and found **0/7 matches**.

The raw bytes identify one exact transformation for all seven pre-remediation files:

```text
("\r\n".join(checkpoint_blob.decode("cp850").splitlines()) + "\r\n").encode("utf-8")
```

That transformation reproduces every pre-remediation worktree file byte-for-byte. In other words, UTF-8 checkpoint bytes were decoded as CP850 and then re-encoded as UTF-8 (mojibake such as `—` → `ÔÇö`, `→` → `ÔåÆ`, and the `tasks.md` UTF-8 BOM → `´╗┐`), LF endings were rewritten as CRLF, and a final CRLF was forced even where the checkpoint had no trailing newline.

| File | Checkpoint blob | Checkpoint bytes | Pre-remediation raw hash | Pre-remediation bytes | Precise mismatch manifestation |
|------|-----------------|-----------------:|--------------------------|----------------------:|--------------------------------|
| `proposal.md` | `5ef4d4a969ad2388aedf146a0d6f0b76eb33d3e7` | 4410 | `b89ceb3a30081a9ec37d1af0b7ef9dbaf0dc6b20` | 4499 | CP850 mojibake for `—`, `→`, and `≤`; LF→CRLF; final CRLF added. |
| `exploration.md` | `2ef6bee71caf1a752bce4252cf34e7a2878ab7b6` | 5333 | `11dd6fefa0c61e96ab102f344cbe25723a102e63` | 5434 | CP850 mojibake for dashes and accented path text; LF→CRLF. |
| `design.md` | `47fec83a0cdb3e3eeddcd1a8de485965ee807c5b` | 6297 | `ca0a0f476e52fe122a4e1be55a1b3dde5b67e106` | 6380 | CP850 mojibake for em dashes; LF→CRLF. |
| `tasks.md` | `9be0218a8ee90be96f96e51f34e108f7b4b24a0a` | 4477 | `bfcb2065626388f698c6e13636ddb4ba5a880230` | 4579 | UTF-8 BOM corrupted to visible `´╗┐`; mathematical/directional symbols mojibaked; LF→CRLF; final CRLF added. |
| `specs/math-exercise-catalog/spec.md` | `516286b5cf99f558d678cc8a99da0c276fa0d931` | 6114 | `034285aebe903abeb59ca21e9f55e75855f094c3` | 6221 | CP850 mojibake for ellipsis and em dashes; LF→CRLF. |
| `specs/math-error-taxonomy/spec.md` | `ebbcf7e54063463fe414f0fa39b360b694234e46` | 4231 | `a132b5156d9389d82880e60fa26f25db387b1db9` | 4332 | CP850 mojibake for em dashes and `√`; LF→CRLF. |
| `specs/challenge-exercises/spec.md` | `b2ffd35a040b6507fdfe3351422ac9ed715c9635` | 5839 | `d6b528f86cdc9263c5c05c7cfe4f0dea08b4ac04` | 5968 | CP850 mojibake for em dashes, `∈`, and `≥`; LF→CRLF. |

### Binary-safe restoration and final proof

Each path was resolved to its checkpoint blob with `git ls-tree`. `git cat-file blob <blob>` then streamed raw stdout directly into a binary temporary file, followed by an atomic `os.replace`; no PowerShell text redirection, text decoding, working-tree filter, or line-ending conversion was involved.

The exact post-restore check used `git hash-object --no-filters -- <path>` and required both the raw object hash and file size to match:

| File | Checkpoint blob | Checkpoint bytes | Worktree raw hash | Worktree bytes | Result |
|------|-----------------|-----------------:|-------------------|---------------:|--------|
| `proposal.md` | `5ef4d4a969ad2388aedf146a0d6f0b76eb33d3e7` | 4410 | `5ef4d4a969ad2388aedf146a0d6f0b76eb33d3e7` | 4410 | match |
| `exploration.md` | `2ef6bee71caf1a752bce4252cf34e7a2878ab7b6` | 5333 | `2ef6bee71caf1a752bce4252cf34e7a2878ab7b6` | 5333 | match |
| `design.md` | `47fec83a0cdb3e3eeddcd1a8de485965ee807c5b` | 6297 | `47fec83a0cdb3e3eeddcd1a8de485965ee807c5b` | 6297 | match |
| `tasks.md` | `9be0218a8ee90be96f96e51f34e108f7b4b24a0a` | 4477 | `9be0218a8ee90be96f96e51f34e108f7b4b24a0a` | 4477 | match |
| `specs/math-exercise-catalog/spec.md` | `516286b5cf99f558d678cc8a99da0c276fa0d931` | 6114 | `516286b5cf99f558d678cc8a99da0c276fa0d931` | 6114 | match |
| `specs/math-error-taxonomy/spec.md` | `ebbcf7e54063463fe414f0fa39b360b694234e46` | 4231 | `ebbcf7e54063463fe414f0fa39b360b694234e46` | 4231 | match |
| `specs/challenge-exercises/spec.md` | `b2ffd35a040b6507fdfe3351422ac9ed715c9635` | 5839 | `b2ffd35a040b6507fdfe3351422ac9ed715c9635` | 5839 | match |

Final raw provenance result: **7/7 matches**.

### SDD checkbox rule resolution

The generic `sdd-apply` OpenSpec rule normally marks completed task checkboxes in `tasks.md`. This focused remediation has stricter explicit authority: the approved planning checkpoint is contractual and must remain frozen byte-for-byte. Marking tasks 1.1–1.3 as `[x]` would recreate provenance drift and violate that authority. Therefore `tasks.md` remains exactly at checkpoint bytes with unchecked planning rows, while factual PR1 completion and TDD evidence are maintained only in this separate `apply-progress.md` post-apply artifact. This is an explicit conflict resolution, not a silent omission.

---

## Gate Failure Remediation Evidence

| Gate failure | Remediation | Verification |
|--------------|-------------|--------------|
| 1. All seven planning artifacts failed raw checkpoint provenance | Diagnosed the exact CP850→UTF-8 mojibake + CRLF + forced-final-newline transformation, then restored every file from its checkpoint Git blob through a binary stream and atomic replace. | Checkpoint blob IDs and sizes equal worktree `git hash-object --no-filters` hashes and sizes for all seven files: 7/7 matches. |
| 2. Strict TDD evidence absent from portable OpenSpec status | Maintained `openspec/changes/recuperar-u3-ecuaciones-lineales/apply-progress.md` with cumulative TDD evidence, test-by-test RED/GREEN evidence, files changed, deviations, PR2 exclusions, validation results, and corrected raw provenance evidence. | This artifact records completed PR1 work without mutating the frozen checkpoint `tasks.md`. |
| 3. Active U3 change absent from portable status | Added only the `recuperar-u3-ecuaciones-lineales` entry to the current `origin/main` version of `openspec/changes/STATUS.json`. | Entry distinguishes approved planning checkpoint, implemented-but-unreviewed/unpublished PR1, and pending PR2; existing U3/U5 entries remain untouched. |

---

## Update history

- 2026-07-17 ~07:45 — Initial apply batch: RED tests added (4/5 failed against unchanged production); GREEN content (`exercises/unit-3.json` `.7` + `.8`); REFACTOR (baseline bump). All 5 files modified; 195-line diff.
- 2026-07-17 ~07:51 — Voice drift caught and corrected (voseo → *tú* in 2 new pedagogical notes; brand-voice gate re-verified clean).
- 2026-07-17 ~07:53 — Marked tasks 1.1-1.3 as `[x]` in `tasks.md` (planning artifact). This was the first provenance drift and was later reverted.
- 2026-07-17 ~08:00–08:04 — First remediation attempted a text-mode checkpoint restore and recorded a 7/7 SHA-256 byte-match claim. That claim was false: the reported hashes described the corrupted worktree copies, not raw equality with checkpoint Git blobs.
- 2026-07-17 ~08:12 — Fresh verification used checkpoint blob IDs plus `git hash-object --no-filters` and proved 0/7 matches; lifecycle work stopped.
- 2026-07-17 — Focused remediation reproduced the exact CP850→UTF-8 + CRLF + forced-final-newline transformation for all seven mismatches, restored every file through a raw `git cat-file blob` binary stream, and required 7/7 `git hash-object --no-filters` matches.
- 2026-07-17 — Reconfirmed branch/base, corrected this evidence artifact, and added the minimum truthful `STATUS.json` entry. Full test, typecheck, and build validation was rerun before closeout.

---

## Status

3/3 PR1 tasks are implemented and validated. Planning provenance is restored at 7/7 raw matches. PR1 has **not** been independently reviewed, committed, pushed, or published; those lifecycle steps remain pending and were intentionally not started in this remediation. PR2 (P1l + challenge + new tag/detector/feedback) remains pending as a separate follow-up after PR1 publication/merge, with base-gate 2.0 preserved in the frozen `tasks.md`.
## PR2 — Phase 2 TDD evidence (tasks.md 2.0–2.10; worktree `C:\dev\pre_utn-worktrees\u3-ecuaciones-lineales-pr2`, branch `feat/u3-ecuaciones-lineales-pr2`, base `origin/main @ f5b800d2`). All 11 PR2 tasks GREEN; BASE GATE 2.0 (`git merge-base --is-ancestor e553648079cd7b6f9864683d4ab4d694b4f6a8e7 HEAD`) exit 0. P1l `.6` + `.desafio-01` (adapted canonicalTrace); additive `u3_racionalizacion_irracional` ErrorTag + MC-only detector + dispatch; feedback `example-ecuaciones-lineales-1`; declared U3 12→13; feedback 11→12; baseline 225→226; unit-3 challenges 2→3; **4 new loader-level rejection rules** + 4 RED-first negative tests. **Verification:** focused 215/215 (6 files), full 3365/3365 (199 files), `tsc --noEmit` clean, `next build` 11/11 routes, coverage 93.23% lines, `git diff --check HEAD` exit 0, BASE GATE 2.0 exit 0, 7/7 frozen planning artifacts byte-identical to checkpoint `5bc5df7`.
| Task | Test file(s) | Layer | Safety Net | RED (observed) | GREEN (observed) | REFACTOR | Triangulation |
|------|--------------|-------|------------|----------------|------------------|----------|---------------|
| 2.0 BASE GATE | (gate only) | Infra | N/A | N/A — gate is the verification itself | ✅ `git merge-base --is-ancestor e553648079cd7b6f9864683d4ab4d694b4f6a8e7 HEAD` exit 0 | N/A | N/A (gate is binary; single ancestor-check exit code) |
| 2.1 detector RED | `error-tagging-u3.test.ts` new `describe("u3_racionalizacion_irracional — detector + P1l integration (PR2)")` (4 tests) | Domain (detector + dispatch) | ✅ 33/33 pre-existing | ✅ 3 RED (revert observed): `fires on every option retaining √5; declared-only guard...`; `evaluateAnswer fires the tag end-to-end...`; `feedback mapping is wired to a real example id...` — all failed because `isU3RacionalizacionIrracionalError` predicate + dispatch absent. Test #2 (MC-only) is vacuous in RED (predicate returns false; no MC fires yet — vacuous-pass recorded truthfully) | ✅ All 4 pass once predicate + `U3_RACIONALIZACION_IRRACIONAL_TAGS` dispatch wired in `tagError` | ➖ minimal | ✅ 4 cases: (a) fires on retained √5 over 3 distinct distractors + (b) declared-only guard prevents firing when tag absent + (c) MC-only guard (vacuous-pass in RED) + (d) feedback mapping wired to real example id |
| 2.2 taxonomy RED | `error-taxonomy-u3.test.ts` new `describe("U3 error taxonomy — PR2 u3_racionalizacion_irracional (additive, 12 → 13)")` (3 tests) | Domain (taxonomy) | ✅ 26/26 pre-existing | ✅ 3 RED (revert observed): `u3_racionalizacion_irracional has the canonical ErrorTag contract`; `U3 taxonomy contains exactly 13 declared u3_* tags after PR2`; `ErrorTag contract preserved (U3-TAG-002): NO 'label' property...` | ✅ All 3 pass once `u3_racionalizacion_irracional` appended to `TAXONOMY`; 13 declared total | ➖ verbatim 13-tag list locks the additive guarantee | ✅ 3 contract assertions: (a) ErrorTag shape `{id, unit, description, examples}` for the 13th tag + (b) exact count 12→13 additive + (c) NO `label` property on any declared U3 tag |
| 2.3 loader RED | `loader.test.ts` new `describe("loadChallengesForSkill — mat.u3.ecuaciones_lineales (PR2 P1l challenge)")` (3 tests) + `describe("U3 LIN-CHAL spec scenario coverage (PR2)")` (4 positive catalog assertions) | Domain (loader) | ✅ 47/47 pre-existing | ✅ 5 RED (revert observed in `challenges/unit-3.json`): `returns unit 3 modeling-transfer challenges...`; `U3LIN-CHAL-001..003: challenge at d=5...`; `U3LIN-CHAL-006: Unit 3 challenge total grows from 2 to 3`; `U3LIN-CHAL-002 (positive): P1l sourceUse is NOT canonical-source`; `Non-Spanish fragment (positive): P1l pedagogical fields...` | ✅ All 5 pass once `.desafio-01` added (adapted sourceUse, 4-option MC, new tag, Spanish PedNote + Intent) | ➖ test names list spec scenario IDs | ✅ 7 cases: (a) unit-3 modeling-transfer + P1l challenge count 2→3 + (b) P1l challenge at d=5, 4 opts, desafio + (c) sourceUse=adapted (NOT canonical-source) + (d) unit-3 challenge total grows 2→3 + (e) P1l pedagogical fields carry Spanish markers + (f) U3 challenge commonErrorTags resolves in taxonomy + (g) every U3 challenge is MC |
| 2.4 integration RED | (covered by 2.1's `evaluateAnswer fires the tag end-to-end` + `feedback mapping is wired...`) | Domain (integration) | (same as 2.1) | (same as 2.1) — load `.6` + challenge; `evaluateAnswer` wrong option → tag; `generateFeedback` → new `recoveryTarget` (`example-ecuaciones-lineales-1`) | (same as 2.1) | ➖ same as 2.1 | ✅ Same as 2.1 triangulation: 2 RED integration paths (`evaluateAnswer` end-to-end + `generateFeedback` recoveryTarget mapping) covered by 2.1's 4 test cases |
| 2.5 catalog RED | `content-loaders-u3.test.ts` new `describe("U3LIN-CAT-002 — P1l canonical exercise (PR2)")` (1 test) + extended `loadFeedbackContent('unit-3')` (2 tests modified) | Domain (catalog loader) | ✅ 64/64 pre-existing | ✅ 3 RED (revert observed): `loadFeedbackContent('unit-3') returns 12 mappings`; `loadFeedbackContent('unit-3') covers declared u3_* tags...`; `P1l loads as 4-option MC with adapted canonicalTrace` | ✅ All 3 pass once `.6` P1l + 12th feedback mapping added | ➖ PedNote rewritten to *tú* form (PR1 lesson re-applied) | ✅ 3 cases: (a) feedback count 11→12 + (b) feedback covers declared u3_* tags + new tag + (c) P1l loads as 4-option MC with adapted canonicalTrace (no verbatim, no alignment) |
| 2.6 GREEN taxonomy + detector | `error-taxonomy/index.ts` + `error-tagging.ts` (append 13th U3 tag + safe-first predicate + dispatch) | Domain | ✅ 59/59 pre-existing (2.1 ∪ 2.2 union) | (covered by 2.1: 3 RED + 2.2: 3 RED = 6 RED total; revert observed) | ✅ Append `u3_racionalizacion_irracional` ErrorTag + `U3_RACIONALIZACION_IRRACIONAL_TAGS` set + `isU3RacionalizacionIrracionalError` predicate + dispatch in `tagError`. 2.1 (4 tests) + 2.2 (3 tests) flip to GREEN | ➖ verbatim 13-tag list locks additive; safe-first predicate + set dispatch | ✅ 2.1 fires on retained √5 (3 distractors) + declared-only guard (4 RED cases); 2.2 covers ErrorTag shape + exact 13 + no `label` (3 contract cases) |
| 2.7 GREEN P1l `.6` exercise | `content/matematica/exercises/unit-3.json` (add `.6` MC d=4 P1l) | Content | ✅ 64/64 pre-existing (covered by 2.5) | (covered by 2.5: 3 RED; revert observed) | ✅ Added `ex.u3.ecuaciones_lineales.6` (MC, d=4, 4 options, `commonErrorTags=["u3_racionalizacion_irracional"]`, `canonicalTrace[0].path="material_canonico/.../03_ej_utn.pdf"`, `sourceUse="adapted"`). 2.5 (1 new + 2 modified = 3 tests) flip to GREEN | ➖ PedNote rewritten to *tú* form (PR1 lesson re-applied) | ✅ 2.5 covers MC type + 4 options + adapted canonicalTrace + declared tag + within-repo path (5 fields asserted) |
| 2.8 GREEN P1l `.desafio-01` challenge | `content/matematica/challenges/unit-3.json` (add `.desafio-01` MC d=5 desafio) | Content | ✅ 47/47 pre-existing (covered by 2.3) | (covered by 2.3: 5 RED; revert observed) | ✅ Added `ex.u3.ecuaciones_lineales.desafio-01` (MC, d=5, 4 options, `challengeSection: true`, `category: "desafio"`, `tags: ["desafio","integrador"]`, `commonErrorTags=["u3_racionalizacion_irracional"]`, `sourceUse="adapted"`). 2.3 (3+4=7 tests) flip to GREEN | ➖ test names list spec scenario IDs | ✅ 2.3 covers challenge shape (d=5, 4 opts, desafio, integrador) + sourceUse=adapted + Spanish PedNote + Spanish Intent + unit-3 total 3 (7 cases) |
| 2.9 GREEN feedback + declared catalog | `feedback/unit-3.json` (add 12th mapping) + `u3-exercise-shape.test.ts` (extend declared catalog 12→13) | Content + Test | ✅ 64/64 pre-existing (covered by 2.5) | (covered by 2.5: 2 modified tests RED; revert observed) | ✅ Added `u3_racionalizacion_irracional` feedback mapping (`recoveryTarget: "example-ecuaciones-lineales-1"`); `loadFeedbackContent('unit-3')` returns 12 mappings; declared U3 catalog extended 12→13 (additive). 2.5 (3 RED) flip to GREEN | ➖ verbatim 13-tag list | ✅ 2.5 covers feedback count + tag coverage + P1l loading (3 cases); PedNote rewritten to *tú* form |
| 2.10 REFACTOR | (full validation suite) | Validation | ✅ 215/215 pre-refactor | N/A | ✅ Focused 215/215; full 3365/3365; `tsc --noEmit` clean; `next build` 11/11; `git diff --check HEAD` exit 0; baseline bump 225→226; `traduccion_lenguaje_verbal` keeps 2 | ✅ header compaction in `catalog-split-equivalence.test.ts`; verbatim 13-tag list; loader comments; JSON escape fix in STATUS.json | ✅ Full validation suite (5 distinct gates): focused 215/215 + full 3365/3365 + `tsc --noEmit` clean + `next build` 11/11 + `git diff --check HEAD` exit 0 — covers all paths exercised by tasks 2.0–2.9 |
| # | Test | Fixture (key field) | RED (loader.ts reverted to HEAD; backup kept in `/tmp/loader.ts.green`) | GREEN |
|---|---|---|---|---|
| 1 | `U3LIN-CHAL-002: canonical-source on canonical P1l PDF path is REJECTED` | `{ prompt: "Resolver (3+√5)·x = 14 + 6√5, hallar x." (literal canonical P1l prompt), sourceUse: "canonical-source", path: "material_canonico/.../03_ej_utn.pdf" }` | ❌ FAIL — verbatim-P1l guard absent | ✅ PASS — throws `/canonical-source\|verbatim\|adapt/` |
| 2 | `free-text root rejected: type='numerical' is REJECTED (AGENTS.md)` | `{ type: "numerical" }` | ❌ FAIL — `type !== "multiple-choice"` guard absent | ✅ PASS — throws `/multiple-choice\|type/` |
| 3 | `unknown error tag rejected: undeclared commonErrorTag for U3 is REJECTED by taxonomy` | `{ skillId: "mat.u3.ecuaciones_lineales", commonErrorTags: ["u3_esta_tag_no_existe_en_taxonomy"] }` | ❌ FAIL — U3-scoped taxonomy-resolve guard absent | ✅ PASS — throws `/taxonomy\|undeclared\|commonErrorTag/` |
| 4 | `non-Spanish fragment rejected: pedagogical fields without Spanish markers are REJECTED` | `{ pedagogicalNote: "Rationalize the coefficient.", canonicalTrace: [{ ..., pedagogicalIntent: "Adapt P1l PDF item for app." }] }` | ❌ FAIL — `SPANISH_MARKER` guards absent | ✅ PASS — throws `/spanish\|non-spanish\|marker/` |
