# Archive Report: u5-02-medicion-angulos-y-arcos

**Change**: `u5-02-medicion-angulos-y-arcos`
**Archived at**: `openspec/changes/archive/2026-07-17-u5-02-medicion-angulos-y-arcos/`
**Archived by**: `sdd-archive` executor (openspec mode)
**Change branch**: `chore/archive-u5-02-medicion-angulos-y-arcos` (from main `edc240b9ba298dcf07a6ce457634a755bd449093`)
**Implementation branch**: `sdd/u5-02-medicion-angulos-y-arcos` (merged to main `c60fc8e`)
**Verify verdict**: PASS WITH WARNINGS — 0 blocking CRITICAL, 30/30 requirements, 65/65 scenarios, 3341/3341 tests, typecheck+build green

---

## 1. Archive Authorization and Reconciliation Summary

### 1.a Review Gate Limitation

`gentle-ai review validate --gate archive` is unsupported by facade v2.1.6 (`unsupported review gate "archive"`). This executor accepts the constraint and does not launch reviewers or alter product review scope.

**Substitute evidence**: Native 4R receipt lineage `review-9de3ba0190e11fec` approved and PR #112 merged. Pre-commit/pre-push/pre-pr gates were allowed. The functional delivery had full native review. The archive operation is a post-delivery administrative step that does not require an additional review gate.

### 1.b Task Checkbox Reconciliation (Authorized)

**What**: `tasks.md` used header-form task representation (`### X.Y RED — ...`) without markdown checkbox syntax (`- [ ]` / `- [x]`). All 48 implementation tasks (Phases 1–5, tasks 1.1–5.10) were completed and evidenced, but the persisted artifact lacked checkbox markers.

**Evidence**: `apply-progress.md` (WU map: 5/5 Done, commits `950e3f2`, `7dba8f5`, `9d88a84`, `48649f0`, `c8a0eb6`), bounded correction commit `af80afc`, `verify-report.md` (51/51 tasks, 3341/3341 tests), and git log.

**Action**: Mechanical reconciliation — added `- [x] **Status**: Complete (Phase N)` to all 48 tasks in the archived `tasks.md`. This is a documentation-only repair; it does not change any functional history.

**Authority**: Explicit maintainer authorization in the orchestrator's archive instruction.

### 1.c Item 1.d Tolerance Reconciliation — SPEC TEXT ONLY (Authorized)

**What**: The delta spec and canonical `angle-arc-measurement` spec text described item 1.d as having tolerance `0.0001`. The implementation uses the platform-fixed `numeric.ts` tolerance of `0.01`. This is a spec-text-only discrepancy; no product code, tests, or content JSON was changed.

**Evidence**:
- `src/domain/evaluator/numeric.ts` line 7: `TOLERANCE = 0.01` (fixed constant)
- `verify-report.md` C1: "Item 1.d tolerance — spec scenario UNTESTED in the strict sense it describes — the actual covering test asserts the OPPOSITE of the spec scenario"
- `evaluator-numeric-u5-scalar.test.ts` lines 67–75: explicit pinning comment documenting the deviation

**Action** (spec text only):
1. **Canonical `openspec/specs/angle-arc-measurement/spec.md`**: Updated item 1.d tolerance from `0.0001` to `0.01` (line 75 table and line 212 Nearest-Second DMS requirement).
2. **Canonical `openspec/specs/math-answer-evaluator/spec.md`**: Updated scenario text to reflect platform 0.01 tolerance; added `NOTE` pointing to `evaluator-numeric-u5-scalar.test.ts` for explicit pinning.
3. **Delta `openspec/changes/archive/.../specs/angle-arc-measurement/spec.md`**: Same reconciliation.
4. **Delta `openspec/changes/archive/.../specs/math-answer-evaluator/spec.md`**: Same reconciliation.

**Rationale**: Per maintainer authorization, the broader `0.01` tolerance is pedagogically equivalent for U5 entry-level exercises (item 1.d has a single canonical form ± π/2 rad round-trip), avoids a cross-cutting evaluator redesign, and matches existing evaluator behavior. The `evaluator-numeric-u5-scalar.test.ts` test file already explicitly pins the current behavior.

**Authority**: Explicit maintainer authorization in the orchestrator's archive instruction. This is documentation/spec reconciliation ONLY — no `src/`, content JSON, product tests, or numerical evaluator were modified.

### 1.d E2E Helper Follow-Up (Recorded, Not Implemented)

`practice-flow.ts` must gain `pi-rational` and `angle-dms` structured-control drivers before the Playwright e2e spec (`tests/e2e/specs/medicion_angulos_y_arcos.spec.ts`) can run automatically. Currently the spec fails with `TimeoutError` on the `Enviar respuesta` button because the helper cannot drive PiRationalInput/AngleDmsInput. The visible flow is fully covered by rendered vitest behavior tests (`structured-evaluator.test.ts` integration tests). This follow-up is recorded here for future SDD work.

### 1.e Maintainer-Approved `sizeException` Scope

The `sizeException` (approved by user 2026-07-16, scope: U5-02 only, does NOT carry to U5-03+) is preserved verbatim in `STATUS.json` and this archive report. Actual diff was ~3984 insertions (production ~1518 + content JSON ~394 + vitest ~2068 + e2e 87 + SDD docs 102).

---

## 2. Spec Sync Operations

### 2.a New Canonical Spec Created

| Spec | Action | Details |
|------|--------|---------|
| `openspec/specs/angle-arc-measurement/spec.md` | **Created** (delta promoted to canonical) | Full spec for `mat.u5.medicion-angulos-y-arcos` skill: 12 requirements, 23 scenarios. Tolerance reconciled to 0.01. |

### 2.b Canonical Specs Updated

| Spec | Delta section | Action | Details |
|------|-------------|--------|---------|
| `openspec/specs/math-exercise-model/spec.md` | MODIFIED: "Exercise Type and Difficulty" | Updated supported types list to include `structured` | 1 MODIFIED requirement |
| `openspec/specs/math-exercise-model/spec.md` | ADDED: Structured Answer Specification | Appended new section | 4 ADDED requirements |
| `openspec/specs/math-answer-evaluator/spec.md` | ADDED: Structured Answer Dispatch | Prepended before Unit 2 sections | 6 ADDED requirements; tolerance reconciled to 0.01 in 1.d scenario |
| `openspec/specs/unit-5-foundation/spec.md` | MODIFIED: "Unit 5 Catalog State" | Updated from empty-state to live-skill-state | 1 MODIFIED requirement; 4 ADDED requirements |

---

## 3. Archive Contents Verification

| Artifact | Status | Notes |
|----------|--------|-------|
| `proposal.md` | ✅ Present | |
| `specs/` (4 delta specs) | ✅ Present | angle-arc-measurement, math-exercise-model, math-answer-evaluator, unit-5-foundation |
| `design.md` | ✅ Present | |
| `tasks.md` | ✅ Present | 48/48 tasks reconciled with `[x]` markers |
| `apply-progress.md` | ✅ Present | WU map: 5/5 Done |
| `verify-report.md` | ✅ Present (untracked artifact included) | 374-line report |
| `exploration.md` | ✅ Present | |
| `archive-report.md` | ✅ Created | This report |

---

## 4. STATUS.json Entry

Entry `u5-02-medicion-angulos-y-arcos` updated:
- `status`: `"done"` (unchanged — already done)
- `branch`: `null` (unchanged — already null)
- `archive`: `"openspec/changes/archive/2026-07-17-u5-02-medicion-angulos-y-arcos/"` (added)
- `archivedAt`: `"2026-07-17"` (added)
- `archiveIssue`: `113` (added, if appropriate per project convention)
- `summary`, `verify`, `sizeException`, `followUps`: preserved verbatim

---

## 5. SDD Cycle Completion

All SDD phases completed for `u5-02-medicion-angulos-y-arcos`:
- ✅ SDD Init
- ✅ SDD Explore (exploration.md)
- ✅ SDD Propose (proposal.md)
- ✅ SDD Spec (4 delta specs)
- ✅ SDD Design (design.md)
- ✅ SDD Tasks (tasks.md — reconciled at archive)
- ✅ SDD Apply (apply-progress.md, commits on `sdd/u5-02-medicion-angulos-y-arcos`)
- ✅ SDD Verify (verify-report.md, PASS WITH WARNINGS, 3341/3341 tests)
- ✅ SDD Archive (this report, canonical specs synced, change folder archived)

The change has been fully planned, implemented, verified, and archived. Ready for the next change.

---

## 6. Changed Paths

All filesystem paths touched by this archive operation:

**Canonical specs created:**
- `openspec/specs/angle-arc-measurement/spec.md` (new)

**Canonical specs updated:**
- `openspec/specs/math-exercise-model/spec.md`
- `openspec/specs/math-answer-evaluator/spec.md`
- `openspec/specs/unit-5-foundation/spec.md`

**Change folder moved:**
- `openspec/changes/u5-02-medicion-angulos-y-arcos/` → `openspec/changes/archive/2026-07-17-u5-02-medicion-angulos-y-arcos/`

**STATUS.json updated:**
- `openspec/changes/STATUS.json`
