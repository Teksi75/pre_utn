# Unit 5 Foundation Specification

## Purpose

Establish the auditable foundation for Unit 5 (trigonometry and complex numbers): source governance, exact provisional retirement inventory, versioned migration contract, slice roadmap, and pedagogical impact. U5-00 is planning only; later slices U5-01 through U5-11 implement the contracts here.

## Requirements

### Requirement: Logical Source Registry and Material Conflict

The system MUST register exactly four logical source IDs: `mat.u5.theory`, `mat.u5.practice`, `mat.exam.theme1`, `mat.exam.theme2`. Each receipt MUST carry observed filename, page count, and SHA-256 (informative only; comparison MUST be against material content). On material conflict the implementation MUST stop and escalate. The system MUST NOT copy PDFs into the repository and MUST NOT persist versioned absolute paths.

#### Scenario: material conflict blocks the slice

- GIVEN a registered logical source whose observed material differs from the receipt in content
- WHEN the receipt is validated
- THEN validation fails and the implementing slice stops until the receipt is corrected

### Requirement: Exact Provisional Retirement Inventory

U5-01 MUST retire exactly six provisional skill IDs (`mat.u5.angulos`, `mat.u5.radianes`, `mat.u5.circunferencia_trigonometrica`, `mat.u5.identidades`, `mat.u5.ecuaciones_trigonometricas`, `mat.u5.complejos_forma_polar`) and five exercise IDs (`ex.u5.angulos.1`, `ex.u5.radianes.1`, `ex.u5.circunferencia_trigonometrica.1`, `ex.u5.identidades.1`, `ex.u5.ecuaciones_trigonometricas.1`) by exact allowlist. No aliases. No score/attempt migration. The archived folder `openspec/changes/archive/2026-06-08-add-complex-numbers-skill/**` is an immutable audit record and MUST NOT be edited during retirement.

#### Scenario: allowlist is exact and archive is immutable

- GIVEN a snapshot whose references include only the eleven allowlisted IDs
- WHEN the migration runs
- THEN only those eleven references are removed and no other U5-looking identifier is filtered

- GIVEN any file under `openspec/changes/archive/2026-06-08-add-complex-numbers-skill/`
- WHEN U5-01 modifies it
- THEN the build rejects the modification with an archive-immutability error

### Requirement: Versioned Idempotent Migration

U5-01 MUST persist a per-student migration-version marker that covers the student's related snapshots. The local and remote markers MUST produce semantically identical output for the same student.

**Local marker**: the local marker MUST be stored in a sidecar map (NOT physically embedded in any snapshot) under storage key `pre-utn.u5-retirement.v1` with JSON shape `{version:"retired-v1", students:{[studentId]:{completedAt:string}}}`. ONE durable sidecar entry per student covers ALL of that student's local snapshots (`pre-utn.practice.v1`, `pre-utn.diagnostic.v1`, `pre-utn.study-plan.v1`); the sidecar MUST be created (even for no-data students) before any new U5 content is released.

**Remote marker**: the remote marker MUST be column `student_progress_snapshots.u5_retirement_version text NOT NULL`. New rows default to `retired-v1`. A one-time ordered migration transforms existing rows' JSONB columns and marks each row `retired-v1`.

Once the marker for a student is `retired-v1` in either local sidecar (via `students[studentId]`) or remote per-row column, the migration MUST NOT re-filter normative data whose ID matches a retired ID (`mat.u5.ecuaciones_trigonometricas` is reused). Local and remote adapters MUST produce semantically identical output. U1/U2/U3/U4/U6 records MUST be preserved byte-for-byte. No-data operation MUST return unchanged state and still create/persist the marker for the student. Nested snapshots MUST be traversed recursively. Rollback MUST be restoration from pre-migration backup; fix-forward MUST be marker-aware.

#### Scenario: local sidecar marker blocks re-filtering of reused ID

- GIVEN a student's local sidecar entry exists at `pre-utn.u5-retirement.v1.students[studentId]`
- AND a snapshot under that student contains new `mat.u5.ecuaciones_trigonometricas` records
- WHEN a second load runs the migration
- THEN the new normative records are preserved and the sidecar entry is unchanged

#### Scenario: remote column marker blocks re-filtering of reused ID

- GIVEN a `student_progress_snapshots` row already with `u5_retirement_version = 'retired-v1'`
- AND the row's JSONB columns contain new `mat.u5.ecuaciones_trigonometricas` records
- WHEN a second load runs the migration
- THEN the new normative records are preserved and the column value is unchanged

#### Scenario: local/remote parity

- GIVEN an identical pre-migration snapshot set for the same student in both stores
- WHEN both adapters run the migration for that student
- THEN post-migration outputs are semantically identical and both stores reflect the marker as `retired-v1` for that student (sidecar entry present in local, column set on every snapshot row in remote)

### Requirement: Pedagogical Corrections and Slice Roadmap

Implementation specs MUST correct five source defects: (1) introduce `±` and select by quadrant from `sin²`/`cos²`; `sqrt(cos² α) = |cos α|`, not `cos α`, unless a sign restriction is established; (2) use `atan2`-equivalent reasoning for complex arguments and define axis cases; (3) preserve and verify modulus when converting polar/trigonometric to exponential form; (4) trigonometric equations MUST return every solution in the requested domain including axes and endpoints; (5) De Moivre and n-th complex roots MUST be taught before canonical item 21. U5 MUST be delivered as eleven independent slices U5-01 through U5-11, each on its own branch and draft PR, green before push. Each slice MUST stay within an authored review budget of 800 changed lines and MUST be split if it cannot be reviewed in roughly one hour. Strategy is stacked-to-main: only one PR lands at a time, parent is `main`, and no slice MAY auto-start the next. U5-01 is restricted to retirement and migration only; later slices introduce structured-answer variants only when first consumed.

#### Scenario: next slice does not auto-start

- GIVEN U5-01 merged to `main`
- WHEN the U5-01 workflow reports done
- THEN the system MUST NOT begin U5-02 without explicit orchestrator instruction

#### Scenario: square root preserves sign restriction

- GIVEN an item that derives `cos α` from `cos² α`
- WHEN the implementation evaluates it
- THEN the solution carries `±` and selects sign from the stated quadrant, never silently dropping it

### Requirement: Mate-Explorer Handoff and Pedagogical Impact

A separate `mate-explorer` change MAY consume these foundations as non-blocking handoff. Priority 1: trigonometric circle; complex polar plane and rotations. Priority 2: trigonometric equations via graph intersections; angular conversion, arcs, coterminal angles. The handoff MUST NEVER block `pre_utn`, and `pre_utn` MUST own a complete minimal implementation of every required control. The foundation MUST serve the learner, who practices with auditable canonical material, and the future teacher (a separate product, out of scope here), who can interpret any learner record via the canonical trace and skill prerequisites.

### Requirement: U5-00 Acceptance Gate

U5-00 is acceptable only when the proposal, source receipts, traceability matrix, retirement inventory, migration design, structured-answer design, and slice roadmap are present and internally consistent, the nine-skill normative graph is recorded with zero U4 dependency, the 22-item coverage with 22.b excluded and 22.a retained is documented, and no U3 branch, artifact, or content has been modified. The `openspec/changes/STATUS.json` file MAY and SHALL be updated to register the U5-00 entry as required by repository policy; every pre-existing entry, especially every U3 entry, MUST remain semantically and byte-for-byte unchanged outside the U5-00 entry.

#### Scenario: acceptance invariant — U3 and pre-existing STATUS entries untouched

- GIVEN the U5-00 branch is staged for merge
- WHEN the U5-00 entry in `openspec/changes/STATUS.json` is diffed against the actual branch base (the merge-base against `origin/main`, not a potentially stale local `main`) and the U3 artifact paths are inspected
- THEN the diff on `STATUS.json` is confined to the added/updated U5-00 entry
- AND every pre-existing STATUS entry (especially every U3 entry) is semantically and byte-for-byte unchanged
- AND there is zero diff on any U3 branch, artifact, or content path