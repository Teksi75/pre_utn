## Exploration: Unit 5 foundation, canonical sources, traceability, and retirement design

### Current State

Unit 5 is not implemented as a pedagogical route. The repository contains a provisional six-skill catalog, five placeholder exercises in the legacy monolithic catalog, two generic U5 error tags, and tests or specifications that characterize those provisional identifiers. There are no U5 theory, worked-example, feedback, per-unit exercise, or challenge files.

The five placeholders are loadable and can enter the balanced diagnostic. Consequently, historical U5 identifiers may exist inside local or remote practice, diagnostic, and study-plan snapshots even though U5 is not a pilot unit. The replacement must retire those identifiers without mapping their meaning or scores to the new skills.

The canonical 2025 practice guide contains exercises 1–22 over all of Unit 5. Preliminary practice scope therefore remains the complete admitted guide, not only the topics observed in exams. Exercise 22.b is the sole deliberate exclusion because its printed expression is editorially malformed; 22.a remains admitted.

#### Canonical evidence receipt

Versioned artifacts must use the logical source IDs below and observed filenames only. PDFs remain read-only external evidence and must not be copied into the repository.

| Logical source ID | Observed filename | Pages | SHA-256 | Use |
|---|---|---:|---|---|
| `mat.u5.theory` | `UNIDAD5_matemática.pdf` | 20 | `75255244e1c6fbd99813b4a34d7910df8fea30713d07852c928f3940064e3cd6` | Canonical U5 concepts and terminology |
| `mat.u5.practice` | `05_ej_utn.pdf` | 7 | `49b8dd5c671cec28398bc58d3a6132368cb11476a6a619e384d9fe1f50628575` | Canonical breadth, progression, and exercise structure |
| `mat.u5.practice` (second observed copy) | `05_ej_utn.pdf` | 7 | `49b8dd5c671cec28398bc58d3a6132368cb11476a6a619e384d9fe1f50628575` | Duplicate verification only |
| `mat.exam.theme1` | `TEMA I RESOLUCIÓN.pdf` | 6 | `7395cc96f55c39820a29f51c3021f3c09321756cae3b1312eec0d77365a51c3e` | Mathematics Theme I, 25/10/23: examinable prompts plus handwritten reasoning |
| `mat.exam.theme2` | `TEMA II RESOLUCIÓN.pdf` | 7 | `94c0531e1c6cc7f5b03c7c0cccb5420b92b462ce6f655154adda984257661be9` | Mathematics Theme II, 25/10/23: examinable prompts plus handwritten reasoning |

The two observed practice copies are materially identical: same title, seven-page structure, content, metadata, file size, and SHA-256. SHA-256 corroborates rather than replaces the content comparison.

The selected exam pair is preferable to answer-only papers because both selected files contain the full ten-question Mathematics Theme I/II papers and worked handwritten resolutions. Other observed Mathematics candidates belong to different sittings (`Resolución TEMA 1.pdf`, `Resolución TEMA 2.pdf`, `TEMA 1 RESPUESTAS.pdf`, and `TEMA 2 RESPUESTAS.pdf`) and are useful supplementary evidence, but they must not be conflated with the selected 25/10/23 pair under the same logical source identity.

#### Exact provisional retirement inventory

**Discovered catalog facts**

| Kind | Exact identifier | Current surface |
|---|---|---|
| Skill | `mat.u5.angulos` | `UNIT_5_SKILLS`; placeholder `ex.u5.angulos.1` |
| Skill | `mat.u5.radianes` | `UNIT_5_SKILLS`; placeholder `ex.u5.radianes.1` |
| Skill | `mat.u5.circunferencia_trigonometrica` | `UNIT_5_SKILLS`; placeholder `ex.u5.circunferencia_trigonometrica.1` |
| Skill | `mat.u5.identidades` | `UNIT_5_SKILLS`; placeholder `ex.u5.identidades.1` |
| Skill | `mat.u5.ecuaciones_trigonometricas` | `UNIT_5_SKILLS`; placeholder `ex.u5.ecuaciones_trigonometricas.1` |
| Skill | `mat.u5.complejos_forma_polar` | `UNIT_5_SKILLS`; no exercise |
| Exercise placeholder | `ex.u5.angulos.1` | Legacy `content/matematica/exercises.json`; incorrectly asks the U4-style triangle-angle-sum question and uses `u4_suma_angulos` |
| Exercise placeholder | `ex.u5.radianes.1` | Legacy catalog; 180° to π multiple choice |
| Exercise placeholder | `ex.u5.circunferencia_trigonometrica.1` | Legacy catalog; quadrant of 300° multiple choice |
| Exercise placeholder | `ex.u5.identidades.1` | Legacy catalog; fundamental identity scalar answer |
| Exercise placeholder | `ex.u5.ecuaciones_trigonometricas.1` | Legacy catalog; two-angle solution multiple choice |

`ALL_SKILLS` and `KNOWN_SKILL_IDS` derive all six skill references from `UNIT_5_SKILLS`. The only declared provisional U5 dependency edges are:

- `mat.u5.ecuaciones_trigonometricas <- mat.u5.identidades`
- `mat.u5.complejos_forma_polar <- mat.u1.complejos, mat.u5.radianes`

Two U5 taxonomy IDs also exist: `u5_cuadrante_angulo` and `u5_identidad_pitagorica`. They are not attached to the five placeholders but are provisional U5 reference surfaces and should be reconsidered or replaced by the future skill-specific taxonomy, not silently treated as canonical.

**Exact repository reference surfaces later retirement must address**

- `src/domain/models/skill-catalog.ts` — six IDs, derived global sets, and two dependency entries.
- `src/domain/index.ts` — exports `UNIT_5_SKILLS`; the export remains but its members change.
- `src/components/practice/FocusSelector.tsx` — consumes `UNIT_5_SKILLS`; no literal IDs.
- `content/matematica/exercises.json` — all five placeholder records.
- `src/domain/error-taxonomy/index.ts` — the two provisional U5 tags.
- `src/domain/__tests__/catalog.test.ts` — exact six-skill list.
- `src/domain/__tests__/complejos-domain.test.ts` — exact old downstream polar dependency.
- `src/domain/__tests__/diagnostic.test.ts` — exact references to three real placeholders and diagnostic-selection behavior.
- `src/domain/__tests__/evaluator-index.test.ts` — exact references to three real placeholders.
- `src/domain/__tests__/catalog-answer-contract.test.ts` — exact references to the identity and equation placeholders.
- `openspec/specs/complex-numbers-skill/spec.md` — active source-of-truth requirement names the old polar skill.
- `utn-ingreso-app-spec/docs/pedagogy/06-skill-map.md` — provisional six-skill map and old dependencies.
- `utn-ingreso-app-spec/docs/pedagogy/05-math-content-map.md` — topic-level U5 map; it needs alignment but contains no provisional IDs.
- `openspec/changes/archive/2026-06-08-add-complex-numbers-skill/**` — historical references only. These are immutable audit records and MUST NOT be edited during retirement.

`mat.u5.trigonometria_basica`, `ex.u5.bad.1`, and `ex.u5.good.1` occur only as synthetic diagnostic-test fixtures. They are discovered test-only identifiers, not live provisional catalog records. They should be renamed only if a later test-cleanup slice needs to prevent confusion; they are not historical data migration keys.

**Inferred persisted cleanup targets (not literal catalog declarations)**

The exact six provisional skill IDs and five exact exercise IDs can be embedded in:

- `pre-utn.practice.v1`: `attempts[].skillId`, `attempts[].exerciseId`, `accuracyBySkill`, `trendBySkill`, `lastPracticedBySkill`, embedded `diagnosticResult`, and embedded `studyPlan`.
- `pre-utn.diagnostic.v1`: `estimates[].skillId` and `suggestions[].skillId`.
- `pre-utn.study-plan.v1`: nested diagnostic estimates/suggestions and `skillPriorities[].skillId` (the persisted practice foci/references).
- Supabase `student_progress_snapshots`: `practice_progress`, `diagnostic_result`, and `study_plan` JSONB columns with the same shapes.

Home suggestions, next-step links, roadmap state, mastery, readiness, and focus-selector availability are derived from catalog plus the snapshots above; they are not separate persisted stores. `pre-utn.advanced-practice.v1` currently has no U5 challenge records and is not a cleanup target unless later evidence finds an exact provisional ID in that store.

#### Normative nine-skill map and dependency graph

The user supplied the following exact normative identifiers:

1. `mat.u5.medicion_angulos_y_arcos`
2. `mat.u5.razones_trigonometricas_y_signos`
3. `mat.u5.relaciones_angulares_y_reduccion`
4. `mat.u5.angulos_notables_y_valores_exactos`
5. `mat.u5.identidades_trigonometricas`
6. `mat.u5.ecuaciones_trigonometricas`
7. `mat.u5.complejos_modulo_argumento_y_formas`
8. `mat.u5.complejos_rotaciones_y_transformaciones`
9. `mat.u5.potencias_y_raices_de_complejos`

Exact normative edges:

```text
mat.u5.medicion_angulos_y_arcos                         (root; no prerequisite)
  -> mat.u5.razones_trigonometricas_y_signos
       -> mat.u5.relaciones_angulares_y_reduccion
       -> mat.u5.angulos_notables_y_valores_exactos

mat.u5.razones_trigonometricas_y_signos
  + mat.u5.angulos_notables_y_valores_exactos
  -> mat.u5.identidades_trigonometricas

mat.u5.relaciones_angulares_y_reduccion
  + mat.u5.angulos_notables_y_valores_exactos
  + mat.u5.identidades_trigonometricas
  -> mat.u5.ecuaciones_trigonometricas

mat.u1.complejos
  + mat.u5.medicion_angulos_y_arcos
  + mat.u5.razones_trigonometricas_y_signos
  -> mat.u5.complejos_modulo_argumento_y_formas
       -> mat.u5.complejos_rotaciones_y_transformaciones
       -> mat.u5.potencias_y_raices_de_complejos
```

There is zero dependency on Unit 4. U5 theory may contain one brief, non-blocking section titled `Useful prior knowledge` that mentions triangle ratios, Pythagoras, and sine/cosine laws as useful context only. It must not affect readiness or prerequisites.

`mat.u5.ecuaciones_trigonometricas` is intentionally reused as a normative identifier, but historical provisional data under that identifier remains invalid and must be removed before the new skill is released. Identifier reuse does not authorize semantic score or attempt migration.

#### Initial source-to-exercise-to-skill traceability

Difficulty is an initial calibration (1–5), not a claim printed by the source. Answer types are target interaction contracts, not current repository types. `T1`/`T2` refer to the selected exam receipts above.

| Practice item | Admitted subitems / evidence | Theory section/pages | New skill | Diff. | Target answer type | Common errors to cover | Exam relation |
|---|---|---|---|---:|---|---|---|
| 1 | α1–α4 table: degrees ↔ radians | Sexagesimal/radial correspondence, pp. 7–9 | `mat.u5.medicion_angulos_y_arcos` | 1–2 | exact-angle table (exact fractions/π plus decimal) | invert 180/π; lose π; decimal/exact confusion | Indirect DMS fluency in geometry exams |
| 2 | Arc 6 cm, radius 30 cm; radians and DMS | Radial system and arc measure, pp. 8–9 | `mat.u5.medicion_angulos_y_arcos` | 2 | angle pair: exact/decimal radians + DMS | use r/s; invalid minutes/seconds; premature rounding | DMS appears in both exam themes' geometry item 7 |
| 3 | Minute hand, 12 cm, 20 minutes | Arc measure, p. 9 | `mat.u5.medicion_angulos_y_arcos` | 2 | exact length | use full circumference; wrong time fraction; omit π/radius | No direct U5 exam item |
| 4 | π/2 shifts, π shifts, opposite angles; all listed ratios | Reduction relations, pp. 10–14 | `mat.u5.relaciones_angulares_y_reduccion` | 2–3 | relation matching/table | wrong cofunction; wrong parity/sign; quadrant ignored | Supports T1/T2 identity and equation items 1/8 |
| 5 | a–e, derive all six ratios from one ratio plus quadrant/sign conditions | Signs, fundamental relation, one-ratio derivations, pp. 5–10 | `mat.u5.razones_trigonometricas_y_signos` | 2–4 | six-ratio table with exact values/undefined | omit ± after square root; choose wrong quadrant; reciprocal error; treat undefined as zero | Supports both themes' equation item 8 |
| 6 | a–e existence/range true-false statements | Unit circle/signs, pp. 3–7 and notable values p. 14 | `mat.u5.razones_trigonometricas_y_signos` | 1–2 | true-false with reason selection | sine outside [-1,1]; assume tangent bounded; miss undefined tangent | T1 handwritten solution explicitly rejects `sin x = 2` pattern |
| 7 | a–e exact notable-angle expressions | Notable-angle table, p. 14 | `mat.u5.angulos_notables_y_valores_exactos` | 1–3 | exact number / numeric expression result | decimalize radicals; wrong notable value; operation precedence | Foundation for T1/T2 items 1/8 |
| 8 | One multiple-choice relation for complementary acute angles | Fundamental relation/notable angles, pp. 9, 14 | `mat.u5.identidades_trigonometricas` | 2 | multiple choice | confuse α+β=90°; interchange sine/cosine incorrectly | Directly aligned with identity item 1 style |
| 9 | One multiple-choice identity among tan, sec, sin, cos | Pitagorean identities, p. 9 | `mat.u5.identidades_trigonometricas` | 2–3 | multiple choice | wrong rearrangement; square omitted; reciprocal confusion | Directly aligned with T1/T2 item 1 |
| 10 | a–c, first-quadrant simple equations | Equations, p. 16; notable values p. 14 | `mat.u5.ecuaciones_trigonometricas` | 1–2 | exact angle | ignore sign/range; inverse-function misuse; Q10.a has no first-quadrant solution | Simpler precursor to T1/T2 item 8 |
| 11 | a–d, all solutions in 0<x<2π | Fundamental relation and equations, pp. 9, 16 | `mat.u5.ecuaciones_trigonometricas` | 3–4 | angular solution set | return principal value only; miss quadrants; include out-of-range/endpoints; invalid root retained | Direct alignment with T1/T2 item 8 |
| 12 | a–e identity verification | Fundamental/derived identities and sum/difference, pp. 9, 15 | `mat.u5.identidades_trigonometricas` | 3–4 | ordered steps / detect-error / MC equivalence | transform both sides inconsistently; divide by potentially zero expression; algebra/sign error | T1/T2 item 1 and handwritten reasoning |
| 13 | Three inverse-relation calculations (`sin x`, `tan 2x`, `sin(x/3)`) | Reduction and equations, pp. 10, 16 | `mat.u5.ecuaciones_trigonometricas` | 2–3 | angle or angular solution set, per subitem | calculator mode; principal value only; fail to solve outer factor (2x or x/3) | Supports exam equation solving |
| 14 | a–d, compound equations on 0..2π | Double-angle/identities and equations, pp. 15–16 | `mat.u5.ecuaciones_trigonometricas` | 4–5 | angular solution set | incomplete factorization; extraneous roots; miss periodic solutions; wrong double-angle formula | At/above T1/T2 item 8 complexity |
| 15 | z1–z6; module, argument, trigonometric and polar forms | Complex module/argument/forms, pp. 17–19 | `mat.u5.complejos_modulo_argumento_y_formas` | 2–4 | structured complex + angle pair/table | use `atan(b/a)` without quadrant/axes; wrong modulus; omit form components | T1/T2 item 2 assesses complex fluency, though not polar conversion |
| 16 | z7–z11; trigonometric to binomial and graph | Polar-to-binomial conversion, pp. 17–19 | `mat.u5.complejos_modulo_argumento_y_formas` | 2–3 | structured complex number + point | sign by quadrant; decimal where exact expected; swap real/imaginary | Supports exam complex item 2 |
| 17 | Locus |z|=3, figure, area, perimeter | Module as distance, p. 17 | `mat.u5.complejos_modulo_argumento_y_formas` | MC figure + exact numeric pair | confuse disk/circle; radius/diameter; wrong area/perimeter | No direct selected exam item |
| 18 | Rotate affix 2+i by 90° counter-clockwise | Euler/exponential interpretation, pp. 18–19 | `mat.u5.complejos_rotaciones_y_transformaciones` | 2 | numeric pair / structured complex | clockwise sign; rotate components incorrectly; ignore modulus preservation | Supports complex reasoning beyond exam item 2 |
| 19 | Four square vertices from (0,-2) | Euler rotations, pp. 18–19 | `mat.u5.complejos_rotaciones_y_transformaciones` | 3 | unordered root/point list | return one vertex; wrong rotation direction; duplicate points | No direct selected exam item |
| 20 | Conjugate pair from real-part sum 6 and modulus sum 10; binomial and polar | Module/argument/forms, pp. 17–19 | `mat.u5.complejos_modulo_argumento_y_formas` | 4 | structured complex pair + polar pair | derive only real part; wrong ± imaginary component; wrong quadrant | Supports T1/T2 item 2 complex constraints |
| 21 | All complex numbers whose cube is `8(cos(π/2)+i sin(π/2))`; polar and binomial | Euler pp. 18–19; De Moivre/root theory is missing | `mat.u5.potencias_y_raices_de_complejos` | 5 | unordered root list with polar/binomial views | return one root; divide argument without `2kπ`; wrong cube root of modulus; duplicates | Extension beyond selected exam pair; canonical practice remains authoritative |
| 22.a | Conjugate and opposite of 14+4i in polar/trigonometric forms | Complex forms, pp. 17–19 | `mat.u5.complejos_modulo_argumento_y_formas` | 3 | structured complex/polar tuple | conjugate vs opposite confusion; argument sign/quadrant; modulus changed | Supports complex item 2 |
| 22.b | Printed `2−2 + 2i` is editorially malformed | N/A | Excluded deliberately | — | — | — | Not admitted |

The matrix covers every admitted canonical item 1–22 and preserves subexercise families. A later content spec should assign one or more app exercise IDs per admitted subitem; it must not collapse this matrix into eleven exam-like questions.

#### Required pedagogical corrections

The implementation specs must correct, rather than reproduce, these source weaknesses:

1. Solving from `sin² α` or `cos² α` MUST introduce `±` and then select signs from the stated quadrant. In particular, `sqrt(cos² α)=|cos α|`, not `cos α`, unless a sign restriction is already established.
2. Complex arguments MUST use `atan2`-equivalent quadrant-aware reasoning and define axis cases explicitly. The theory's bare `arctan(b/a)` formula is insufficient and undefined on the imaginary axis.
3. Polar/trigonometric to exponential conversion MUST preserve and verify the modulus. Theory p. 18 prints a modulus-2 trigonometric number and then drops the factor 2 in exponential form; the app must teach and test `ρe^{iθ}`.
4. Trigonometric equations MUST produce every solution in the requested domain, including axis values and endpoint rules, rather than only the inverse-function principal value.
5. De Moivre and all n-th complex roots MUST be taught before canonical item 21. The source practice asks for cube roots while the theory does not provide a sufficient De Moivre/root section.

#### Material source conflicts and gaps

- Practice item 22.b is malformed and excluded by product decision. Item 22.a is retained.
- Theory p. 9 suppresses the `±` branch in square-root consequences of the fundamental identity.
- Theory p. 17's argument formula is not quadrant/axis safe.
- Theory p. 18 drops modulus 2 in an exponential-form example.
- Theory has no adequate De Moivre/complex-root development for practice item 21.
- Theme I item 8 is internally inconsistent: the printed domain is `0 ≤ x ≤ π/2`, the highlighted answer sheet marks incompatible alternatives, while the handwritten resolution correctly derives only `x=π/2` for that printed domain. Use the prompt and reasoning as exam-shape evidence, not the highlight as an answer oracle.
- Practice item 10.a has no solution in the stated first-quadrant domain because `-2 sin x` cannot equal positive `sqrt(2)` there. Retain it as an intentional contradiction/no-solution exercise unless proposal review finds a clearer official correction; do not silently flip the sign.

### Affected Areas

- `openspec/specs/math-skill-model/spec.md` — new nine-skill identity and no-U4 dependency contract.
- `openspec/specs/math-exercise-model/spec.md` — structured-answer discriminator and canonical serialization contract.
- `openspec/specs/math-answer-evaluator/spec.md` — deterministic structured evaluators and equivalence rules.
- `openspec/specs/math-exercise-catalog/spec.md` — admitted canonical coverage and traceability.
- `src/domain/models/skill-catalog.ts` — later replacement of provisional skills and dependency graph.
- `content/matematica/exercises.json` — later removal of exactly five placeholders.
- `src/domain/models/exercise.ts` and `src/domain/catalog/content-loaders.ts` — minimal schema/parser seam for structured answer specifications.
- `src/domain/evaluator/` — pure structured codecs, normalization, and evaluators.
- `src/components/exercises/ExerciseAnswerInput.tsx` — variant-specific controls; no free-form structured mathematics.
- `src/components/exercises/SubmittedAnswerDisplay.tsx` and `src/app/practice/previous-snapshot.ts` — decode/display the same canonical structured submission.
- `src/lib/practice-progress.ts`, `src/lib/diagnostic-storage.ts`, `src/lib/persistence/supabase-adapter.ts`, and `supabase/migrations/` — versioned retirement across local and remote snapshots.
- `src/domain/diagnostic/index.ts` and `src/domain/student-home/index.ts` — estimates, suggestions, priorities, and derived recommendations after stale U5 removal.
- `content/matematica/{theory,examples,feedback,exercises}/` — later one-skill vertical content slices; no content is changed by U5-00.

### Approaches

1. **Exact retirement, then one-skill vertical slices with incremental structured inputs** — freeze sources/traceability, retire provisional data in an isolated migration slice, then introduce only the structured-answer variants required by each consuming pedagogical slice.
   - Pros: honors no-alias/no-semantic-mapping decisions; makes every later slice testable end to end; protects other units; keeps review scope explicit.
   - Cons: the migration lands before students see new content; later slices must maintain one coherent structured-answer architecture while implementing it incrementally.
   - Effort: High overall, Medium per slice.

2. **Content-first with multiple-choice substitutes, defer structured architecture** — ship skills using existing MC/numerical types and retrofit richer inputs later.
   - Pros: earlier visible content; fewer initial schema changes.
   - Cons: weakens the canonical tasks, encourages answer-shape workarounds, duplicates content, and risks permanently reducing U5 to exam-style MC. It does not satisfy the structured-answer requirement.
   - Effort: Medium initially, High rework.

3. **Alias/migrate provisional scores into new skills** — map old IDs to nearest new concepts.
   - Pros: preserves apparent progress.
   - Cons: explicitly rejected; the five placeholders do not measure the new skill semantics, so mapped mastery would be pedagogically false.
   - Effort: Medium and unacceptable.

#### Structured-answer architecture

Recommend one additive `structured` exercise type with a discriminated `answerSpec`, while retaining the existing `evaluateAnswer(exercise, userAnswer: string)` and `onSubmit(answer: string)` boundaries. A pure codec serializes structured drafts to canonical, versioned JSON strings. This keeps existing attempt persistence compatible (attempts do not store submitted answers), preserves the session-only previous-answer snapshot, and avoids DOM/framework dependencies in evaluation.

Minimum variants:

| Variant | Canonical payload/equivalence | UI control |
|---|---|---|
| `angle-dms` | sign/degrees plus minutes and seconds normalized with `0≤m,s<60`; explicit degree/radian unit | separate numeric fields and unit selector |
| `exact-number` | reduced rational plus optional radical terms; normalize signs, gcd, radical factors, and term order | integer fields, fraction/radical chips, sign selectors |
| `angular-solution-set` | unit, bounded-domain metadata, normalized/sorted/deduplicated exact angles; optional periodic family | angle chips/list editor, domain shown read-only |
| `six-ratio-table` | named `sin/cos/tan/cot/sec/csc` cells containing exact numbers or explicit `undefined` | six labeled structured cells |
| `numeric-tuple` | fixed arity and ordered values; pair is arity 2 | separate labeled numeric fields |
| `complex-number` | exact real and imaginary parts; polar views remain display/answer-spec metadata | separate real/imaginary exact-number controls |
| `root-list` | unordered, deduplicated list of exact numbers, complex numbers, or exact angles according to spec | repeatable structured rows; no text list |

Domain/schema seams: `ExerciseType`, `ExerciseBaseShape`, `answerSpec`, loader parsing/validation, codec types, canonicalization, and evaluator dispatch. UI seams: `ExerciseAnswerInput`, submit eligibility helpers, submitted-answer mapper, accessibility labels, and previous-answer rendering. Persistence seam: canonical strings pass through current submit/snapshot APIs; no new answer column is required. If future telemetry stores submitted values, it must store the codec version with the payload.

TDD obligations:

- RED tests per variant for valid/invalid shapes, canonical serialization, equivalent forms, order/deduplication, boundaries, undefined ratios, axes, and empty submissions.
- Property-style invariants: encode/decode round trip, idempotent normalization, deterministic equality, and permutation invariance only where mathematically appropriate.
- Regression tests for all existing answer types, option shuffle, diagnostic reliability, previous-answer display, U1–U3 evaluators, and unsupported/manual-review types.
- Component behavior/accessibility tests per structured control; no source-text-only assertions.
- Persistence tests proving old snapshots load, structured submission strings survive session snapshots, and no framework imports enter `src/domain/`.

#### Migration design

Use a named, versioned retirement migration with a pure transformation shared by local and remote test fixtures. Do not add aliases and do not map old skills or scores to any new skill. Because `mat.u5.ecuaciones_trigonometricas` is reused by the normative map, idempotence MUST be controlled by an explicit per-student migration-version marker rather than by repeatedly filtering identifiers. The migration marks both changed and already-empty snapshots as complete; once marked, later loads MUST NOT filter newly created normative U5 data.

For every student snapshot:

1. Remove base `PracticeAttempt` records only when `exerciseId` is one of the five exact placeholders or `skillId` is one of the six exact provisional skills.
2. Remove all six exact keys from `accuracyBySkill`, `trendBySkill`, and `lastPracticedBySkill` because those values are exclusively derived from removed attempts.
3. Filter all six exact IDs from every `DiagnosticResult.estimates` and `DiagnosticResult.suggestions` occurrence, both standalone and nested in `PracticeProgress`/`StudyPlan`.
4. Filter all six exact IDs from `StudyPlan.skillPriorities`; remove their weak-concept references with the containing priority. Re-number remaining priorities deterministically from 1 without changing their relative order.
5. Preserve timestamps, versions, and every U1/U2/U3/U4/U6 record byte-for-byte in semantic value. Preserve unrelated U5-looking synthetic or future IDs because cleanup is allowlist-based, not prefix-based.
6. Return unchanged empty/null state when no historical data exists.

Local path: before any new U5 content is released, inspect every known student entry in the three existing student maps. For each unmarked student, transform the snapshots, then persist the migration marker even when no historical data existed; future profiles receive the marker before their first U5 write. Remote path: an ordered, one-time Supabase SQL migration updates only the three JSONB columns in `student_progress_snapshots`, guarded by exact identifier membership and safe for null/missing arrays/objects; the database migration ledger prevents replay. Adapter characterization tests must prove local/remote output parity, marker behavior, and that a second load preserves newly written normative `mat.u5.ecuaciones_trigonometricas` data. Rollback is restoration from pre-migration database backup or local export; semantic rollback into new skills is intentionally unsupported.

#### Ordered vertical slices and acceptance boundaries

Delivery is forced chained PRs. Recommend **stacked-to-main**, because each slice can land independently behind catalog readiness and no feature-wide integration branch is required. Keep authored review load at or below the supplied 800-line budget per PR; split a slice further if it cannot be reviewed in approximately one hour.

| Slice | Session-sized boundary | Acceptance tests |
|---|---|---|
| U5-00 | Specification, sources, traceability, and exact retirement inventory; complete migration and structured-answer architecture design only | Artifact review proves all 22 items addressed, 22.b excluded only, exact normative graph present, no U3 edits, STATUS registration |
| U5-01 | Provisional retirement and versioned idempotent migration only; no structured-answer platform or U5 content | Exact allowlist removal, durable marker, idempotence, preservation, no-data, nested snapshot, local/remote parity, and reused-ID post-migration preservation tests |
| U5-02 | `mat.u5.medicion_angulos_y_arcos`: theory/examples/feedback/practice for items 1–3; introduce only the DMS/exact-angle answer seams first consumed here | degree-radian exactness, DMS bounds/rounding, arc-length tests, canonical trace coverage, structured-input TDD |
| U5-03 | `mat.u5.razones_trigonometricas_y_signos`: unit circle, signs, six ratios, items 5–6; add six-ratio/exact-value controls minimally | six-ratio table, ±/quadrant, undefined axes, `sqrt(cos²)=|cos|` tests |
| U5-04 | `mat.u5.relaciones_angulares_y_reduccion`: item 4 and reduction relations | π/2/π/opposite/coterminal relation tests across all quadrants and axes |
| U5-05 | `mat.u5.angulos_notables_y_valores_exactos`: item 7 and exact notable values | exact fraction/radical equivalence, no decimal-only answer contract, progression tests |
| U5-06 | `mat.u5.identidades_trigonometricas`: items 8, 9, 12 | identity-equivalence/step tests, forbidden division/domain pitfalls, Theme I/II alignment |
| U5-07 | `mat.u5.ecuaciones_trigonometricas`: items 10, 11, 13, 14; add angular-solution-set controls when first consumed | full bounded solution sets, endpoints, no-solution cases, extraneous-root rejection, exam-calibrated items |
| U5-08 | `mat.u5.complejos_modulo_argumento_y_formas`: items 15–17, 20, 22.a; add structured complex/tuple controls when first consumed | `atan2` axes/quadrants, modulus, conjugate/opposite, structured complex conversions, 22.b absence |
| U5-09 | `mat.u5.complejos_rotaciones_y_transformaciones`: items 18–19 | modulus-preservation checks, rotations, tuple/list determinism, binomial↔exponential round trips |
| U5-10 | `mat.u5.potencias_y_raices_de_complejos`: De Moivre and item 21; add root-list controls when first consumed | all n roots, modulus root, `2kπ`, uniqueness/order normalization, polar/binomial verification |
| U5-11 | Diagnosis, exam coverage, and integral Unit 5 validation: pilot activation, readiness, trace/feedback/coverage audit, E2E sample route, and final pedagogical QA | normative nine-skill graph/no-U4 guard, all admitted canonical rows covered, full gates, exam samples without reducing practice scope |

Optional, non-blocking `mate-explorer` handoff priorities:

1. **Priority 1**: trigonometric circle; complex polar plane and rotations.
2. **Priority 2**: trig equations through graph intersections; angular conversion, arcs, coterminal angles.

No `mate-explorer` dependency may block `pre_utn`; `pre_utn` must own a complete minimal implementation of every required control.

### Recommendation

Proceed with approach 1 and the exact U5-00 → U5-11 order. Keep U5-01 strictly limited to provisional retirement and its idempotent migration tests. Preserve the complete structured-answer architecture in U5-00, but implement each answer variant minimally and incrementally in its first consuming pedagogical slice under TDD. Use stacked-to-main PRs, each independently green and within the 800-line review budget.

Do not initiate implementation or any later U5 slice from this exploration. Do not touch pending U3 branches, statuses, artifacts, or content.

### Risks

- **Destructive migration and identifier reuse**: exact U5 historical data is intentionally deleted, while `mat.u5.ecuaciones_trigonometricas` is reused normatively. A prefix-based filter or an unversioned repeated cleanup would be dangerous; exact allowlists plus a durable migration marker are mandatory.
- **Local/remote drift**: three local maps and three remote JSONB columns duplicate nested diagnostic/study-plan data; parity and idempotence tests are mandatory.
- **Structured-answer scope**: seven variants can exceed a session if built monolithically. Implement variants only in their first consuming pedagogical slices, under the architecture defined here and one coherent contract.
- **Source defects**: theory sign/argument/modulus gaps and Theme I answer conflict must not leak into answer keys.
- **Canonical breadth**: exam weighting can bias implementation toward identities/equations/complex arithmetic. The 22-item practice matrix is the minimum preliminary scope and cannot be reduced to exam-only coverage.
- **Review load**: content JSON plus tests can exceed 800 lines per pedagogical skill; split by independently usable content/evaluator work units rather than accepting polluted oversized diffs.
- **Legacy active spec**: `complex-numbers-skill` names the retired polar ID and must be modified in a future delta; archived change records remain untouched.

### Ready for Proposal

Yes. The exact normative skill IDs and dependency graph, source receipts, admitted practice scope, provisional retirement keys, migration behavior, structured-answer seams, pedagogical corrections, delivery order, and material conflicts are ready for proposal/specification.
