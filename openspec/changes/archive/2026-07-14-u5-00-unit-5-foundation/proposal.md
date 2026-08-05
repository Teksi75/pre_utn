# Proposal: Unit 5 Foundation

## Intent and pedagogical outcome

Establish the auditable Unit 5 foundation for complete canonical trigonometry/complex-numbers practice through valid structured interactions and nine interpretable skills. Planning only; no implementation.

## Scope

### In Scope
- Seven deliverables: specification; source receipts; 1–22 traceability (only malformed 22.b excluded); retirement inventory; migration design; structured-answer design; U5-00→U5-11 roadmap.
- Source governance: `mat.u5.theory`/`UNIDAD5_matemática.pdf`/20p (`75255244e1c6fbd99813b4a34d7910df8fea30713d07852c928f3940064e3cd6`); `mat.u5.practice`/`05_ej_utn.pdf`/7p (`49b8dd5c671cec28398bc58d3a6132368cb11476a6a619e384d9fe1f50628575`); `mat.exam.theme1`/`TEMA I RESOLUCIÓN.pdf`/6p (`7395cc96f55c39820a29f51c3021f3c09321756cae3b1312eec0d77365a51c3e`); `mat.exam.theme2`/`TEMA II RESOLUCIÓN.pdf`/7p (`94c0531e1c6cc7f5b03c7c0cccb5420b92b462ce6f655154adda984257661be9`). SHA is informational/non-blocking; compare material content and stop for material conflict.
- Exact map/graph: `mat.u5.medicion_angulos_y_arcos` → `mat.u5.razones_trigonometricas_y_signos` → `{mat.u5.relaciones_angulares_y_reduccion, mat.u5.angulos_notables_y_valores_exactos}`; `{mat.u5.razones_trigonometricas_y_signos, mat.u5.angulos_notables_y_valores_exactos}` → `mat.u5.identidades_trigonometricas`; `{mat.u5.relaciones_angulares_y_reduccion, mat.u5.angulos_notables_y_valores_exactos, mat.u5.identidades_trigonometricas}` → `mat.u5.ecuaciones_trigonometricas`; `{mat.u1.complejos, mat.u5.medicion_angulos_y_arcos, mat.u5.razones_trigonometricas_y_signos}` → `mat.u5.complejos_modulo_argumento_y_formas` → `{mat.u5.complejos_rotaciones_y_transformaciones, mat.u5.potencias_y_raices_de_complejos}`. No U4 dependency; theory may later contain one non-blocking `Useful prior knowledge` note.
- Canonical breadth is every practice exercise 1–22 except 22.b; exams weight priorities but never reduce practice. Record corrections: quadrant-safe arguments, ±/absolute-value reasoning, preserved polar modulus, complete bounded equation sets, and De Moivre/roots before item 21.

### Out of Scope / Non-goals
- Application code, tests, content, migrations, PDFs, U3 artifacts/status/branches, other changes, and U5-01+ work.
- Aliases or semantic migration of provisional results; `pre_utn` remains self-contained. Mate-explorer is optional.

## Capabilities

### New Capabilities
- `unit-5-foundation`: source-governed planning contract and vertical delivery boundaries.

### Modified Capabilities
- `math-skill-model`, `math-exercise-model`, `math-answer-evaluator`, `math-exercise-catalog`: future delta requirements for the normative graph, structured answers, deterministic evaluation, and canonical coverage.

## Approach and decisions

Freeze exploration as binding. Retire exactly `mat.u5.angulos`, `mat.u5.radianes`, `mat.u5.circunferencia_trigonometrica`, `mat.u5.identidades`, `mat.u5.ecuaciones_trigonometricas`, `mat.u5.complejos_forma_polar` and `ex.u5.angulos.1`, `ex.u5.radianes.1`, `ex.u5.circunferencia_trigonometrica.1`, `ex.u5.identidades.1`, `ex.u5.ecuaciones_trigonometricas.1` by exact allowlist, including taxonomy review. U5-01 uses a versioned marker: remove only historical keys/attempts; never map scores; preserve unrelated data and empty snapshots; never re-delete newly written reused `mat.u5.ecuaciones_trigonometricas`. Roll back from export/backup; fix forward only with marker-aware migration.

Define additive `structured` + discriminated `answerSpec`, pure versioned JSON codec, and incremental DMS, exact-number, angular-set, six-ratio-table, numeric-tuple, complex-number, root-list variants. No free-form structured mathematics; domain remains framework-free. TDD is RED→GREEN→REFACTOR with codec/equivalence/idempotence/accessibility/persistence regressions; GGA and full gates apply before push.

## Delivery, risks, and assumptions

Forced chained, stacked-to-main; independent change/branch/draft PR, session-sized, green before push, ≤800 authored lines: U5-01 retirement; 02 angles; 03 ratios; 04 reductions; 05 notable angles; 06 identities; 07 equations; 08 complex forms; 09 rotations; 10 roots; 11 diagnosis/coverage QA. Risks: destructive reuse, local/remote drift, answer-platform growth, source defects, breadth erosion, review load. Assumptions non-blocking. Optional mate-explorer: Priority 1 trigonometric circle; complex polar plane and rotations. Priority 2 trig equations through graph intersections; angular conversion, arcs, coterminal angles.

## Dependencies and acceptance

Reference `docs/sdd/13-adr-foundation.md` (ADR-005/006/007/008). Accept only when the seven artifacts preserve the exact inventory/graph, all admitted rows, migration marker safety, structured principles, roadmap, and untouched boundaries. The U5-00 entry in `openspec/changes/STATUS.json` is required and allowed by repository policy; every pre-existing STATUS entry, especially U3, must remain unchanged.
