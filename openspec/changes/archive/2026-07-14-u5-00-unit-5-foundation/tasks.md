# Tasks: Unit 5 Foundation — U5-00

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1100–1200 (802 authored in bundle + 7 STATUS + ~300–350 tasks.md + source-receipts.json creation + handoff artifact) |
| 800-line budget risk | **High** — bundle (802) + STATUS (7) = 809 authored lines already exceeds 800-line threshold |
| Chained PRs recommended | Yes — U5-01 through U5-11 are independent future PRs, one per slice |
| Decision needed before apply | **Yes** — maintainer must decide: compress/split the docs-only packet, or explicitly approve a `size:exception` |

Decision needed before apply: **Yes** — forecast (809+ authored lines) exceeds the 800-line budget; orchestrator must ask the maintainer whether to (a) compress or split this planning foundation packet, or (b) approve a documented `size:exception` for this docs-only foundational packet before `sdd-apply` proceeds
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
800-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|---------------------|-----------------|-------------------|
| 1 | U5-00 planning foundation: source receipts creation, retirement inventory verification, traceability evidence, migration design, structured-answer architecture, U5-01→U5-11 roadmap | PR 1 (single; size:exception required) | whitespace audit on each untracked file via `git diff --no-index --check /dev/null <file>`, JSON parse receipts, spec cross-check | N/A (docs-only) | Revert commit; all 11 future slices remain unimplemented |

---

## Phase 1: Source Receipts — Create/Finalize

- [x] 1.1 Create `openspec/changes/u5-00-unit-5-foundation/source-receipts.json` with exactly **four logical source IDs**: `mat.u5.theory`, `mat.u5.practice` (two observed copies with identical SHA-256), `mat.exam.theme1`, `mat.exam.theme2`. Schema per design decision: `[{logicalSourceId, observedFilename, pageCount, sha256, materialEvidence, use}]`. The second `mat.u5.practice` entry is for duplicate verification only. No PDF content embedded; `materialEvidence` must be repository-relative paths only.
- [x] 1.2 Validate the created JSON by parsing it; must yield an array of 5 receipt objects (4 unique logical IDs, second `mat.u5.practice` modeled as a duplicate-verification observation).
- [x] 1.3 Verify `materialEvidence` fields contain no absolute paths inside the JSON DATA: zero matches inside `openspec/changes/u5-00-unit-5-foundation/source-receipts.json`. Verify no embedded PDF/binary content: `file openspec/changes/u5-00-unit-5-foundation/source-receipts.json` must report `JSON` (or `ASCII text`).
- [x] 1.4 Confirm the second `mat.u5.practice` entry has `use: "Duplicate verification only"` and identical SHA-256 to the first copy (matches `exploration.md` line 19 wording).

## Phase 2: Retirement Inventory — Live vs. Archive vs. Synthetic

- [x] 2.1 Confirm `exploration.md` (lines 33–43) ENUMERATES the exact six provisional skill IDs and five exercise IDs, and `design.md` (line 12) REFERENCES that allowlist via the phrase "Exact six provisional `mat.u5.*` and five `ex.u5.*.1` allowlists are in `exploration.md`." Six skills enumerated: `mat.u5.angulos`, `mat.u5.radianes`, `mat.u5.circunferencia_trigonometrica`, `mat.u5.identidades`, `mat.u5.ecuaciones_trigonometricas`, `mat.u5.complejos_forma_polar`. Five exercises enumerated: `ex.u5.angulos.1`, `ex.u5.radianes.1`, `ex.u5.circunferencia_trigonometrica.1`, `ex.u5.identidades.1`, `ex.u5.ecuaciones_trigonometricas.1`. (Design references; exploration enumerates.)
- [x] 2.2 Confirm `exploration.md` (lines 52–80) distinguishes live surfaces (skill-catalog.ts, index.ts, FocusSelector.tsx, exercises.json, error-taxonomy, test files, active specs, pedagogy maps) from the immutable archive path `openspec/changes/archive/2026-06-08-add-complex-numbers-skill/**`. No U5-00 artifact modifies that archive (`git diff origin/main -- openspec/changes/archive/` is empty).
- [x] 2.3 Confirm synthetic identifiers (`mat.u5.trigonometria_basica`, `ex.u5.bad.1`, `ex.u5.good.1`) are labeled as test-only fixtures in `exploration.md` line 69 and are NOT in the retirement allowlist.
- [x] 2.4 Confirm `design.md` line 14 names marker `pre-utn.u5-retirement.v1` with `retired-v1` semantics and that `mat.u5.ecuaciones_trigonometricas` is documented as reused normatively post-retirement.

## Phase 3: Traceability Matrix — 22 Items (22.b excluded, 22.a retained)

- [x] 3.1 Confirm `exploration.md` traceability matrix (lines 129–153) covers 22 rows: items 1–21 and 22.a. Item 22.b is excluded (`Excluded deliberately` at line 153); no other items are excluded.
- [x] 3.2 Confirm every admitted row in `traceability.md` maps to exactly one of the nine normative skill IDs in `specs/math-skill-model/spec.md` (lines 11–19): 1→medicion, 2→medicion, 3→medicion, 4→relaciones, 5→razones, 6→razones, 7→notables, 8→identidades, 9→identidades, 10→ecuaciones, 11→ecuaciones, 12→identidades, 13→ecuaciones, 14→ecuaciones, 15→complejos_form, 16→complejos_form, 17→complejos_form, 18→rotaciones, 19→rotaciones, 20→complejos_form, 21→potencias, 22.a→complejos_form.
- [x] 3.3 Confirm five pedagogical corrections are recorded: items 5/6 (sign/±/sqrt(cos²)=|cos|), item 11 (complete bounded solution set), items 15/20 (atan2 quadrant-safe argument), item 18 (modulus preservation), item 21 (De Moivre/n-th roots). Cross-check `exploration.md` lines 159–175 against `specs/math-exercise-catalog/spec.md` lines 43–49. The traceability row MUST name the correction (not just the topic).
- [x] 3.4 Confirm subitem families are preserved (1.a–1.d, 5.a–5.e, 10.a–10.c, 11.a–11.d, 12.a–12.e, three subitems for item 13, 14.a–14.d). Verify `specs/math-exercise-catalog/spec.md` line 53 requires subitem survival.

## Phase 4: Migration Design — Marker, Idempotence, Preservation, Parity, Rollback

- [x] 4.1 Confirm local marker key `pre-utn.u5-retirement.v1` with absent=`pending` and JSON shape `{version:"retired-v1",students:{[studentId]:{completedAt:string}}}` per `design.md` line 14 (Local marker row). The spec (`specs/unit-5-foundation/spec.md`) MUST require one durable per-student marker that covers the student's related snapshots, explicitly allowing/requiring the sidecar map (not a marker physically embedded in every snapshot); the corrected spec wording is `specs/unit-5-foundation/spec.md` Revision R1 (line 35, see apply-progress evidence).
- [x] 4.2 Confirm write gate in `src/lib/persistence/local-adapter.ts` or `adapter-config.ts` blocks writes when marker is `pending` (per `design.md` line 14). U5-01 has no content; U5-02+ release only after the gate. (Phase 4 confirms the DESIGN specifies the gate; U5-01 implements it under TDD.)
- [x] 4.3 Confirm Supabase column `student_progress_snapshots.u5_retirement_version text NOT NULL` with `retired-v1` semantics, one-time ordered migration, null/empty rows complete, upserts preserve default (per `design.md` line 15 — Remote marker row).
- [x] 4.4 Confirm idempotence: second load does NOT re-filter `mat.u5.ecuaciones_trigonometricas`. Verify `specs/unit-5-foundation/spec.md` lines 37–41 (idempotence scenario) and `specs/math-skill-model/spec.md` lines 70–74 (reused-ID scenario).
- [x] 4.5 Confirm no-data behavior per `specs/unit-5-foundation/spec.md` line 35: "No-data operation MUST return unchanged state and still persist the marker." (Phase 4.5 references the requirement text on line 35, where no-data is actually specified; the prior line ref `45–47` was a stale reference to the local/remote parity scenario. Corrected.)
- [x] 4.6 Confirm rollback = pre-migration backup restore; fix-forward = marker-aware new version per `design.md` line 15 (Remote marker row carries the rollback/fix-forward language; line 35 in design.md is a Mermaid diagram and was a stale ref — corrected) and `design.md` line 89 (Testing and Rollout references backup/fix-forward evidence).
- [x] 4.7 Confirm U1/U2/U3/U4/U6 preserved byte-for-byte per `specs/unit-5-foundation/spec.md` line 35 requirement text (the prior line ref `45–47` was stale — those lines are the local/remote parity scenario, not the preservation requirement. Corrected to line 35 of the same spec.)

## Phase 5: Structured-Answer Design — Seven Variants, No Implementation

- [x] 5.1 Confirm `specs/math-exercise-model/spec.md` lines 19–27 enumerate all seven variants: `angle-dms`, `exact-number`, `angular-solution-set`, `six-ratio-table`, `numeric-tuple`, `complex-number`, `root-list` — each with canonical payload and equivalence rule.
- [x] 5.2 Confirm `specs/math-answer-evaluator/spec.md` lines 23–41 codifies: angular-set and root-list use set equality (order-insensitive, duplicates collapse, multiplicity not preserved); `numeric-tuple` preserves order and arity (NOT a set).
- [x] 5.3 Confirm `specs/math-exercise-model/spec.md` lines 42–55 requires versioned pure codec (round-trip, no React/Next.js/Supabase/DOM), codec version tag in serialized strings.
- [x] 5.4 Confirm `specs/math-answer-evaluator/spec.md` lines 43–51 requires deterministic `configuration_error` for shape mismatches.
- [x] 5.5 Confirm `specs/math-answer-evaluator/spec.md` lines 54–62 requires marker-aware evaluation (evaluator does NOT filter by retired-skill IDs).
- [x] 5.6 Confirm no free-form structured math permitted per `specs/math-exercise-model/spec.md` lines 57–65.

## Phase 6: U5-01→U5-11 Roadmap — Boundaries, Acceptance, Stop Condition

- [x] 6.1 Confirm `design.md` lines 70–84 defines eleven slices U5-01 through U5-11 with ownership scope and split condition. Each stacked-to-main, independently green, splits above 800 authored lines.
- [x] 6.2 Confirm U5-00 acceptance gate (`specs/unit-5-foundation/spec.md` lines 69–79): artifact audit proves all 22 items covered, 22.b excluded only, nine-skill DAG present, no U3 edits, STATUS entry registered.
- [x] 6.3 Confirm stop condition (`specs/unit-5-foundation/spec.md` lines 51–57): after U5-01 merges, system MUST NOT begin U5-02 without explicit orchestrator instruction.
- [x] 6.4 Confirm `exploration.md` lines 270–275 defines optional mate-explorer handoff: Priority 1 (trigonometric circle; complex polar plane and rotations), Priority 2 (trig equations via graph intersections; angular conversion, arcs, coterminal angles). pre_utn owns all required controls; mate-explorer is non-blocking.
- [x] 6.5 Confirm `design.md` line 85: eleven slices (U5-01 through U5-11) is final; no further count correction pending.
- [x] 6.6 Confirm `proposal.md` lines 35–36 lists eleven slices in forced chained order: 01 retirement → 02 angles → 03 ratios → 04 reductions → 05 notable angles → 06 identities → 07 equations → 08 complex forms → 09 rotations → 10 roots → 11 diagnosis/coverage QA.

## Phase 7: Artifact Consistency — Cross-Check

- [x] 7.1 Whitespace audit (no whitespace diagnostics) on every U5-00 file. Tracked: `git -C "$REPO_ROOT" diff origin/main -- openspec/changes/STATUS.json | git -C "$REPO_ROOT" diff --check` must exit 0. Untracked: `git -C "$REPO_ROOT" diff --no-index --check /dev/null "$REPO_ROOT/<file>"` for each U5-00 file must exit with no whitespace diagnostic. Plain `git diff --check` does NOT cover untracked files and is explicitly insufficient (plain exit 0 is reported in apply-progress evidence and noted as covered-only-tracked).
- [x] 7.2 Verify no embedded absolute paths in JSON DATA or MD DATA: `grep -c '"/home/' openspec/changes/u5-00-unit-5-foundation/source-receipts.json` must return 0. Note: `tasks.md` and `apply-progress.md` MENTION `"/home/` literally as the `grep` PATTERN (template documentation of the verification command itself); those are LITERAL VERIFICATION COMMAND STRINGS, not embedded absolute paths.
- [x] 7.3 Confirm `git -C "$REPO_ROOT" diff origin/main -- openspec/changes/STATUS.json` reports `+14 -0` entirely inside the new U5-00 entry block (`size`, `branch`, `startedAt`, `delivery`, `sizeException{approved, approvedBy, approvedAt, scope, reason}`, `summary`, plus opening/closing braces); no pre-existing entries modified.
- [x] 7.4 Confirm no U5-00 artifact modifies anything under `openspec/changes/archive/2026-06-08-add-complex-numbers-skill/`. The archive path may appear as a FORBIDDEN reference only. Verified: `git diff origin/main -- openspec/changes/archive/` is empty.
- [x] 7.5 Confirm all five spec files are internally consistent on: nine skill IDs (count: 9 from `specs/math-skill-model/spec.md` lines 11-19), zero U4 edges (the single `mat.u4.*` mention on `math-skill-model` line 48 is a scenario text, not an edge), seven structured variants (count: 7 from `specs/math-exercise-model/spec.md` lines 19-27), idempotence scenarios, 22.b excluded/22.a retained.
- [x] 7.6 Verify STATUS.json entry: `status: "in-progress"`, branch `sdd/u5-00-spec-sources-traceability`, date `2026-07-13`, `delivery` field present, AND `sizeException` block present (approved for THIS U5-00 docs-only foundation packet only; does NOT carry to U5-01+).
- [x] 7.7 Confirm `proposal.md` and `exploration.md` agree on the four logical source IDs and their SHA-256 values. `proposal.md` line 11 (inline governance) and `exploration.md` table at lines 15-21 must reference the same four 64-hex SHA-256 values; `exploration.md` carries the duplicate-practice hash (the second copy is the duplicate-verification observation also present in `source-receipts.json`).

## Phase 8: Documentation Verification Commands

- [x] 8.1 JSON parse: `node -e "JSON.parse(require('fs').readFileSync('$REPO_ROOT/openspec/changes/u5-00-unit-5-foundation/source-receipts.json'))"` must exit 0 (run from a shell whose CWD is the repo root, OR with `$REPO_ROOT` expanded).
- [x] 8.2 Markdown headings: each of the 11 intended markdown files (5 spec files + 6 top-level files in the U5-00 bundle) MUST have ≥ 3 top-level headings. Intended file list: `proposal.md`, `design.md`, `exploration.md`, `tasks.md`, `apply-progress.md`, `traceability.md`, `specs/unit-5-foundation/spec.md`, `specs/math-skill-model/spec.md`, `specs/math-exercise-model/spec.md`, `specs/math-answer-evaluator/spec.md`, `specs/math-exercise-catalog/spec.md`. The original `grep -c "^#" proposal.md design.md exploration.md specs/*/spec.md` was incomplete — it omitted `tasks.md`, `apply-progress.md`, and `traceability.md`; corrected list above.
- [x] 8.3 `git -C "$REPO_ROOT" diff origin/main -- openspec/changes/STATUS.json | git -C "$REPO_ROOT" diff --check` must exit 0 for the tracked STATUS change. Plain `git diff --check` and `git diff --cached --check` exit 0 but only cover the empty staging area (no tracked change to inspect at this stage).
- [x] 8.4 Branch audit (pre-push state): local branch `sdd/u5-00-spec-sources-traceability` MUST exist (it does); remote U5-00 branches MUST be ABSENT (expected pre-push state — the branch has not been pushed yet); no zombie U5 branches exist anywhere. Corrected expectation: before push the remote state must be empty of `u5-00` / `unit-5-foundation` refs.
- [x] 8.5 App test/typecheck/build marked NOT RUN during docs-only apply. `.github/workflows/ci.yml` runs `pnpm install + typecheck + test + build` with no docs-only path; per docs-only scope and the apply instructions, the app gates are deferred to `sdd-verify`. Final `sdd-verify` OWNS the repository-required pnpm gates; this apply run does not claim final verification.

---

## Delivery checklist outside SDD task completion

The following delivery actions are owned by the parent orchestrator AFTER post-apply validation and review. They are NOT SDD tasks and are NOT counted in the 43/43 SDD task total.

1. Issue-First PR Preparation
   - Confirm an approved issue exists for U5-00 in `Teksi75/pre_utn` with `status:approved` label before opening the draft PR.
   - Verify the issue number; needed for `Closes #<issue-number>` in the PR body.
2. Commit and Push
   - Stage: `git add openspec/changes/u5-00-unit-5-foundation/ openspec/changes/STATUS.json`.
   - Commit with concise subject: `git commit -m "docs(u5): add foundation planning"` (subject ≤72 characters; detail goes in PR body).
   - Push: `git push origin sdd/u5-00-spec-sources-traceability`.
3. GitHub Verification
   - Verify commit at `https://github.com/Teksi75/pre_utn/commits/sdd/u5-00-spec-sources-traceability`: correct message, diff stats match expected authored lines.
   - Confirm no unintended files in the commit (STATUS.json only + U5-00 directory).
4. Draft PR
   - Open draft PR `sdd/u5-00-spec-sources-traceability` → `main` at `https://github.com/Teksi75/pre_utn/pulls`. Use the branch-PR skill template. PR body MUST contain `Closes #<issue-number>`, `type:docs` label, changed-line summary from `git diff origin/main --stat`, and a clear note that `size:exception` was APPROVED (not pending) for THIS U5-00 packet only.
5. Handoff Record
   - Record handoff in the PR body (not a separate file): U5-00 PR number/URL, total authored lines, `size:exception` already approved with scope language, completed objective, pending work (U5-01 through U5-11), and the explicit STOP instruction.
6. **STOP**: after PR opens, do NOT auto-start U5-01. Reassess local time and remote/verification state before beginning any next work unit. Handoff deadline 14:30 local, no next slice after 13:30, push by 14:25.

## Stop Gate

**After U5-00 push/PR/handoff: STOP. Do not auto-start U5-01.**
Reassess local time (handoff deadline 14:30, reserve final 60 minutes, no next slice after 13:30, push by 14:25) and remote/verification state before beginning any next work unit.
