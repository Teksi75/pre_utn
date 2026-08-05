# U5-00 Apply Progress

## Change

- Change ID: `u5-00-unit-5-foundation`
- Branch: `sdd/u5-00-spec-sources-traceability`
- Strategy: force-chained; stacked-to-main
- Mode: Standard (no TDD cycle applies because no executable behavior changed in this docs-only foundation packet)

## Approved size exception (this packet only)

The maintainer explicitly approved `size:exception` for THIS U5-00 docs-only foundation packet only (forecast ~1100–1200 lines). It does NOT carry to U5-01+; each future slice (U5-01..U5-11) must independently stay within the 800 authored line review budget or request its own `size:exception`. The exception is recorded in two places:

1. `openspec/changes/STATUS.json` — `changes.u5-00-unit-5-foundation.sizeException` block (`approved: true`, `approvedBy: "maintainer"`, `approvedAt: "2026-07-13"`, scoped to U5-00 only).
2. This apply-progress artifact — verifying-artifact confirmation.

Every pre-existing `STATUS.json` entry, especially U3 (`recuperar-u3-fundacion-minima`, `implement-unit-3-mathematics`, `fortalecer-u3-lenguaje-modelizacion-transferencia`, `align-u3-practice-official-exercises`, `recuperar-u3-traza-canonica-ejercicios`), remains byte-for-byte unchanged. The STATUS diff is `+14` insertions, `0` deletions, all additions inside the new U5-00 entry block.

## Changed paths (this apply run)

| File | Action | Purpose |
|---|---|---|
| `openspec/changes/u5-00-unit-5-foundation/source-receipts.json` | Created | Design-required source receipt artifact (4 logical IDs; second `mat.u5.practice` modeled as a duplicate-verification observation) |
| `openspec/changes/u5-00-unit-5-foundation/traceability.md` | Created | Design-required canonical traceability matrix (22 items: 1-21 + 22.a; 22.b explicitly excluded) |
| `openspec/changes/u5-00-unit-5-foundation/tasks.md` | Modified | `[ ]` → `[x]` for all 43 native SDD tasks in Phases 1-8; the separate delivery checklist remains pending outside SDD task completion |
| `openspec/changes/STATUS.json` | Modified | Added `u5-00-unit-5-foundation` entry with `sizeException` block; pre-existing entries preserved byte-for-byte |

No application code, executable tests, content catalog, migration SQL, or PDF binaries were added.

## Deliverables

### 1. `source-receipts.json`

```text
Total receipts: 5
Logical IDs (unique): mat.u5.theory, mat.u5.practice, mat.exam.theme1, mat.exam.theme2
mat.u5.practice entries: 2 (use="Canonical breadth..."; use="Duplicate verification only")
Distinct SHAs across practice entries: 1 (49b8dd5c... appears twice)
Schema per-receipt: OK (logicalSourceId, observedFilename, pageCount, sha256, materialEvidence, use)
JSON parse: exit=0
No absolute paths in receipts content: confirmed
File type: "JSON text data"
```

All SHA-256 values match `exploration.md` lines 17-21 byte-for-byte (`75255244e1c6fbd99813b4a34d7910df8fea30713d07852c928f3940064e3cd6`, `49b8dd5c671cec28398bc58d3a6132368cb11476a6a619e384d9fe1f50628575` ×2, `7395cc96f55c39820a29f51c3021f3c09321756cae3b1312eec0d77365a51c3e`, `94c0531e1c6cc7f5b03c7c0cccb5420b92b462ce6f655154adda984257661be9`). `materialEvidence` is a `string[]` of repository-relative paths (pointers into this change bundle; PDFs remain external). `observedFilename` matches `exploration.md` Unicode exactly (`UNIDAD5_matem\u00e1tica.pdf`, `TEMA I RESOLUCI\u00d3N.pdf`, `TEMA II RESOLUCI\u00d3N.pdf`).

### 2. `traceability.md`

22-row canonical artifact with the design-required columns (item/subitem, theory pages, skill, difficulty, answer kind, errors, exam relation). 22.b is documented as `excluded deliberately`. Item 22.a is retained. The five pedagogical corrections for items 5/6, 11, 15/20, 18, 21 are surfaced in row context. Subitem families (1.a-1.d, 5.a-5.e, 10.a-10.c, 11.a-11.d, 12.a-12.e, three subitems under item 13, 14.a-14.d) are preserved in the row text.

### 3. STATUS.json entry

```json
"u5-00-unit-5-foundation": {
  "status": "in-progress",
  "branch": "sdd/u5-00-spec-sources-traceability",
  "startedAt": "2026-07-13",
  "delivery": "force-chained; stacked-to-main; review budget 800 lines",
  "sizeException": { "approved": true, "approvedBy": "maintainer", "approvedAt": "2026-07-13", "scope": "...", "reason": "..." },
  "summary": "U5-00 exploration only: ..."
}
```

### 4. Engram receipt

Apply progress is persisted in Engram project `pre_utn`, topic `sdd/u5-00-unit-5-foundation/apply-progress`, observation `#385`.

## Native SDD task accounting

43 of 43 native SDD tasks complete; 0 pending. See the 43 `[x]` marks in `tasks.md` Phases 1-8. The delivery actions below are not SDD tasks and are not included in this accounting.

| Phase | Range | Items complete |
|---|---|---:|
| 1 | Source Receipts — Create/Finalize | 4 of 4 |
| 2 | Retirement Inventory — Live vs. Archive vs. Synthetic | 4 of 4 |
| 3 | Traceability Matrix — 22 Items | 4 of 4 |
| 4 | Migration Design — Marker, Idempotence, Preservation, Parity, Rollback | 7 of 7 |
| 5 | Structured-Answer Design — Seven Variants, No Implementation | 6 of 6 |
| 6 | U5-01→U5-11 Roadmap — Boundaries, Acceptance, Stop Condition | 6 of 6 |
| 7 | Artifact Consistency — Cross-Check | 7 of 7 |
| 8 | Documentation Verification Commands | 5 of 5 |

## Delivery checklist outside SDD task completion

The following 10 delivery actions remain pending. They are operational handoff work owned outside native SDD task completion and are intentionally not marked complete:

| ID | Pending delivery action | Boundary |
|---|---|---|
| D1 | Confirm an approved U5-00 issue exists with the required label | No issue action in this repair |
| D2 | Verify the issue number for `Closes #<issue-number>` | No issue action in this repair |
| D3 | Stage the authorized packet | Do not stage or use intent-to-add in this repair |
| D4 | Commit the authorized packet | No commit in this repair |
| D5 | Push the U5-00 branch | No push in this repair |
| D6 | Verify the remote commit and diff statistics | Blocked until commit/push |
| D7 | Confirm the remote commit contains no unintended files | Blocked until commit/push |
| D8 | Open the draft PR with issue linkage and size-exception context | No PR creation or update in this repair |
| D9 | Record the U5-00 handoff in the PR body | Blocked until the PR exists |
| D10 | Stop after PR/handoff and do not auto-start U5-01 | Preserved delivery boundary |

The local-time constraints in `tasks.md` Stop Gate remain preserved for delivery: handoff deadline 14:30, reserve final 60 minutes, no next slice after 13:30, push by 14:25.

## Verification outputs

| Check | Command | Result |
|---|---|---|
| 1.2 JSON parse | `node -e "JSON.parse(require('fs').readFileSync('openspec/changes/u5-00-unit-5-foundation/source-receipts.json'))"` | exit 0 |
| 1.3 absolute paths in receipts | `grep -rn '"/home/' openspec/changes/u5-00-unit-5-foundation/source-receipts.json` | zero matches |
| 1.3 file type | `file openspec/changes/u5-00-unit-5-foundation/source-receipts.json` | `JSON text data` |
| 1.4 duplicate verification | second `mat.u5.practice` use + SHA | `use: "Duplicate verification only"`; SHA matches first copy |
| 2.1 retirement IDs | grep exploration.md lines 33-43 | 6 skills + 5 exercises declared identically |
| 2.2 archive immutability | `git diff origin/main -- openspec/changes/archive/` | empty (no archive changes) |
| 4.1-4.7 marker design + idempotence | grep design.md and specs/unit-5-foundation/spec.md | all sections present and consistent |
| 5.1-5.6 seven structured variants | grep specs/math-exercise-model/spec.md and specs/math-answer-evaluator/spec.md | all seven variants + equivalence rules + versioned codec + configuration_error + marker-aware eval + no free-form captured |
| 6.1-6.6 roadmap | grep design.md lines 70-85, proposal.md lines 35-36, spec/unit-5-foundation | eleven slices U5-01..U5-11 with acceptance gate, stop condition, mate-explorer handoff |
| 7.1 whitespace audit | Tracked STATUS: `git diff --check -- openspec/changes/STATUS.json`. Every current untracked U5-00 file: `git diff --no-index --check /dev/null <file>` without staging or intent-to-add. | STATUS exit 0. All 12 untracked files emitted no whitespace diagnostic; each no-index check exited 1 only because the file content differs from `/dev/null`. |
| 7.2 no absolute machine paths in evidence/data | recursive literal scan for `/home/` in the U5-00 bundle | The command literal `"/home/` occurs only in `tasks.md` and `apply-progress.md` as verification documentation. No absolute machine path is stored as source evidence or artifact data; receipts use repository-relative `materialEvidence`. |
| 7.3 STATUS.json diff scope | `git diff origin/main -- openspec/changes/STATUS.json` | only U5-00 entry block added (`+14` insertions, 0 deletions) |
| 7.4 archive untouched | `git diff origin/main -- openspec/changes/archive/` | empty diff |
| 7.5 spec consistency | grep specs/math-{skill-model,exercise-model,answer-evaluator,exercise-catalog}/spec.md and spec/unit-5-foundation/spec.md | nine skill IDs, zero U4 edges, seven variants, idempotence, 22.b excluded/22.a retained |
| 7.6 STATUS entry fields | node JSON.parse of STATUS.json | status="in-progress", branch="sdd/u5-00-spec-sources-traceability", startedAt="2026-07-13", delivery field present, sizeException.approved=true |
| 7.7 SHA agreement | hash-count comparison proposal.md vs exploration.md | both documents contain the same 4 distinct 64-hex SHA-256 values; exploration.md contains the duplicate practice hash |
| 8.1 JSON parse | node parse | exit 0 |
| 8.2 markdown headings | count lines beginning with `#` in the exact intended set: six top-level files (`proposal.md`, `design.md`, `exploration.md`, `tasks.md`, `apply-progress.md`, `traceability.md`) plus five delta specs (`unit-5-foundation`, `math-skill-model`, `math-exercise-model`, `math-answer-evaluator`, `math-exercise-catalog`) | all 11 Markdown files have ≥ 3 headings; actual counts are 11, 8, 16, 13, 17, 7, 17, 11, 14, 15, 17 respectively |
| 8.3 whitespace evidence | tracked STATUS check plus one non-index-mutating no-index check for each current untracked U5-00 file | tracked exit 0; 12/12 untracked files have no whitespace diagnostics (exit 1 means content differs from `/dev/null`, not a whitespace failure) |
| 8.4 branch audit | `git branch -r | grep -i "u5\|unit-5"` | zero remote U5 zombies |
| 8.5 app gates deferred | `.github/workflows/ci.yml` inspection | CI defines the `pnpm` test/typecheck/build gates with no docs-only path. They were NOT RUN here and remain pending for independent `sdd-verify`; this apply report does not claim final verification. |

## TDD applicability

No TDD cycle applies because no executable behavior changed in this docs-only foundation packet. The `strict-tdd.md` module was intentionally NOT loaded; per the sdd-apply protocol, "If Strict TDD Mode is not active, ZERO TDD instructions are loaded." All U5-01..U5-11 implementation slices will consume the spec contracts defined here under TDD on a per-slice basis.

## Work Unit Evidence (this docs-only packet)

| Evidence | Value |
|---|---|
| Focused test command and exact result | Receipts JSON parse → exit 0; tracked STATUS `git diff --check -- openspec/changes/STATUS.json` → exit 0; all 12 current untracked U5-00 files checked individually with `git diff --no-index --check /dev/null <file>` → exit 1 with no whitespace diagnostic (content differs from `/dev/null`) |
| Runtime harness command/scenario and exact result | N/A — no runtime boundary exists for a docs-only packet (no executable code, no fixtures, no migrations). All checks are static artifact audits (JSON parse, file type, grep patterns, git diff, marker presence). |
| Rollback boundary | Revert the four-path changeset: `source-receipts.json` (delete), `traceability.md` (delete), `tasks.md` (revert checkboxes), `STATUS.json` (remove the U5-00 entry block). No U3 branches, archives, content, or other units are touched. Reverting this packet leaves all 11 future slices still unimplemented and the foundation acceptance gate unfulfilled. |

## Exact stop boundary

Stop here. This apply run is complete and bounded to the U5-00 planning/documentation packet only. The following are deliberately NOT done in this apply phase:

1. No commit (`git commit`).
2. No push (`git push`).
3. No issue creation (`gh issue create`).
4. No PR creation (`gh pr create`).
5. No PR update (`gh pr edit`).
6. No bounded review start.
7. No auto-start of U5-01 or any future slice.

The 10-item delivery checklist remains pending and is explicitly outside native SDD task completion. The handoff deadline 14:30 local, no next slice after 13:30, and push by 14:25 apply to the parent orchestrator's delivery phase, not to this apply phase.

## Deviations from design

None. Implementation matches `design.md` exactly:

- `source-receipts.json` schema matches the `Receipt placement` decision (`[{logicalSourceId,observedFilename,pageCount,sha256,materialEvidence,use}]`).
- `traceability.md` schema matches `trace rows hold item/subitem, theory pages, skill, difficulty, answer kind, errors, exam relation`.
- STATUS.json `sizeException` block uses the established repo schema (`approved`, `approvedBy`, `approvedAt`, `scope`, `reason`) consistent with prior precedent (`feat-practice-attempt-timing-and-retry`, `i-21`).
- Both PDFs and U3 untouched (zero diff on `openspec/changes/archive/`).
- No free-form structured math permitted per spec; this applies to the consuming slices U5-01..U5-11, not to U5-00 planning.

## Issues found

None in this apply run. One documentation-only factual consistency observation already corrected: the `observedFilename` strings in `source-receipts.json` were initially written with ASCII transliteration (`UNIDAD5_matematica.pdf`, `TEMA I RESOLUCION.pdf`, `TEMA II RESOLUCION.pdf`); these were corrected to match `exploration.md` Unicode exactly (`UNIDAD5_matem\u00e1tica.pdf`, `TEMA I RESOLUCI\u00d3N.pdf`, `TEMA II RESOLUCI\u00d3N.pdf`). This was a within-scope documentation consistency fix per the apply instructions.
