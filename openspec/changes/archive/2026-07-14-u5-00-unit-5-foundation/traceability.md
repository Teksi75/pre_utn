# U5-00 Canonical Traceability Matrix

This file is the formal Unit 5 traceability artifact for U5-00. It is the deliverable form required by `design.md` (decision: Receipt placement). The canonical evidence receipts and full exploration context live in `exploration.md` under the section `Canonical evidence receipt` and `Initial source-to-exercise-to-skill traceability`. This file is the binding artifact: it is the only place that defines the admitted Unit 5 practice scope, the per-row target skill, and the pedagogical corrections required by the implementation slices.

## Scope rule

The catalog MUST admit practice items 1 through 22 except item 22.b, which is editorially malformed and excluded by product decision. Item 22.a is retained. Subitem families (1.a-1.d, 5.a-5.e, 10.a-10.c, 11.a-11.d, 12.a-12.e, three subitems under item 13, 14.a-14.d) are preserved as admitted subitems and MUST NOT be collapsed into eleven exam-like questions.

## Sources

- `mat.u5.theory` -> `UNIDAD5_matemática.pdf`, 20 pages.
- `mat.u5.practice` -> `05_ej_utn.pdf`, 7 pages (two observed copies, identical SHA-256; the second copy is a duplicate verification observation).
- `mat.exam.theme1` -> `TEMA I RESOLUCIÓN.pdf`, 6 pages.
- `mat.exam.theme2` -> `TEMA II RESOLUCIÓN.pdf`, 7 pages.

See `source-receipts.json` for the four logical source IDs, observed filenames, page counts, SHA-256 values (informational), repository-relative `materialEvidence` pointers, and `use` for each receipt.

## Normative skill IDs

| # | Skill ID |
|---|---|
| 1 | `mat.u5.medicion_angulos_y_arcos` |
| 2 | `mat.u5.razones_trigonometricas_y_signos` |
| 3 | `mat.u5.relaciones_angulares_y_reduccion` |
| 4 | `mat.u5.angulos_notables_y_valores_exactos` |
| 5 | `mat.u5.identidades_trigonometricas` |
| 6 | `mat.u5.ecuaciones_trigonometricas` |
| 7 | `mat.u5.complejos_modulo_argumento_y_formas` |
| 8 | `mat.u5.complejos_rotaciones_y_transformaciones` |
| 9 | `mat.u5.potencias_y_raices_de_complejos` |

Difficulty is an initial calibration (1-5), not a claim printed by the source. Target answer type is the canonical interaction contract for the consuming implementation slice; existing or structured variants are introduced only when first consumed under TDD.

## Required pedagogical corrections (must surface in catalog audit)

- Items 5 and 6: introduce `±` and select by quadrant from `sin²`/`cos²`; `sqrt(cos² α) = |cos α|`, not `cos α`, unless a sign restriction is established.
- Item 11: complete bounded solution set including axes and endpoints (no principal-only answer).
- Items 15 and 20: `atan2`-equivalent quadrant-aware argument; axis cases defined explicitly.
- Item 18: modulus preservation through polar-to-exponential conversion.
- Item 21: De Moivre and n-th complex roots taught before item 21.

## Admitted rows (22 items: 1-21 plus 22.a; 22.b excluded)

| Item / subitem | Theory pages | Skill | Difficulty (1-5) | Answer kind | Errors to cover | Exam relation |
|---|---|---|---:|---|---|---|
| 1.a-1.d (α1-α4 table: degrees ↔ radians) | Sexagesimal/radial correspondence, pp. 7-9 | `mat.u5.medicion_angulos_y_arcos` | 1-2 | `exact-number` table (exact fractions of π + decimal form) | invert 180/π; lose π; decimal/exact confusion | indirect DMS fluency in geometry exams |
| 2 (arc 6 cm, radius 30 cm; radians + DMS) | Radial system and arc measure, pp. 8-9 | `mat.u5.medicion_angulos_y_arcos` | 2 | `exact-number` (radians as exact fraction of π + decimal form) **and** `angle-dms` (sexagesimal degrees/minutes/seconds with explicit unit) | use r/s; invalid minutes/seconds; premature rounding; mixing radians/DMS units | DMS appears in both exam themes, geometry item 7 |
| 3 (minute hand, 12 cm, 20 minutes) | Arc measure, p. 9 | `mat.u5.medicion_angulos_y_arcos` | 2 | `exact-number` | full circumference; wrong time fraction; omit π/radius | no direct U5 exam item |
| 4 (π/2 shifts, π shifts, opposite angles; all listed ratios) | Reduction relations, pp. 10-14 | `mat.u5.relaciones_angulares_y_reduccion` | 2-3 | relation matching / table (which identity holds after a given angle shift; student maps each row to the reduced ratio form) | wrong cofunction; wrong parity/sign; quadrant ignored | supports T1/T2 identity and equation items 1/8 |
| 5.a-5.e (derive all six ratios from one ratio + quadrant) | Signs, fundamental relation, one-ratio derivations, pp. 5-10 | `mat.u5.razones_trigonometricas_y_signos` | 2-4 | `six-ratio-table` (exact values or `undefined`) | omit ± after square root; choose wrong quadrant; reciprocal error; treat undefined as zero | supports both themes' equation item 8 (pedagogical correction: quadrant + ±) |
| 6.a-6.e (existence/range true-false) | Unit circle/signs, pp. 3-7; notable values, p. 14 | `mat.u5.razones_trigonometricas_y_signos` | 1-2 | boolean with reason | sine outside [-1, 1]; assume tangent bounded; miss undefined tangent; **drop `±` when reducing from `sin²`/`cos²` and choose sign from stated quadrant (not silent quadrant default); `sqrt(cos² α) = |cos α|`, NOT `cos α`, unless an explicit sign restriction is established** | T1 handwritten solution explicitly rejects `sin x = 2` pattern (pedagogical correction: ±/quadrant sign reasoning + `sqrt(cos²)=|cos|` absent sign restriction) |
| 7.a-7.e (exact notable-angle expressions) | Notable-angle table, p. 14 | `mat.u5.angulos_notables_y_valores_exactos` | 1-3 | `exact-number` | decimalize radicals; wrong notable value; operation precedence | foundation for T1/T2 items 1/8 |
| 8 (complementary acute angles identity) | Fundamental relation/notable angles, pp. 9, 14 | `mat.u5.identidades_trigonometricas` | 2 | multiple-choice | confuse α+β=90°; interchange sine/cosine incorrectly | directly aligned with identity item 1 style |
| 9 (identity among tan, sec, sin, cos) | Pitagorean identities, p. 9 | `mat.u5.identidades_trigonometricas` | 2-3 | multiple-choice | wrong rearrangement; square omitted; reciprocal confusion | directly aligned with T1/T2 item 1 |
| 10.a-10.c (first-quadrant simple equations) | Equations, p. 16; notable values, p. 14 | `mat.u5.ecuaciones_trigonometricas` | 1-2 | `angle-dms` | ignore sign/range; inverse-function misuse; 10.a has no first-quadrant solution | simpler precursor to T1/T2 item 8 |
| 11.a-11.d (all solutions in 0 < x < 2π) | Fundamental relation and equations, pp. 9, 16 | `mat.u5.ecuaciones_trigonometricas` | 3-4 | `angular-solution-set` (set equality, no multiplicity) | return principal value only; miss quadrants; include out-of-range/endpoints; invalid root retained | direct alignment with T1/T2 item 8 (pedagogical correction: complete bounded solution set including axes and endpoints) |
| 12.a-12.e (identity verification) | Fundamental/derived identities and sum/difference, pp. 9, 15 | `mat.u5.identidades_trigonometricas` | 3-4 | ordered steps / detect-error / MC equivalence | transform both sides inconsistently; divide by potentially zero expression; algebra/sign error | T1/T2 item 1 and handwritten reasoning |
| 13 (three subitems: `sin x`, `tan 2x`, `sin(x/3)`) | Reduction and equations, pp. 10, 16 | `mat.u5.ecuaciones_trigonometricas` | 2-3 | `angle-dms` or `angular-solution-set` per subitem | calculator mode; principal value only; fail to solve outer factor (2x or x/3) | supports exam equation solving |
| 14.a-14.d (compound equations on 0..2π) | Double-angle/identities and equations, pp. 15-16 | `mat.u5.ecuaciones_trigonometricas` | 4-5 | `angular-solution-set` (set equality, no multiplicity) | incomplete factorization; extraneous roots; miss periodic solutions; wrong double-angle formula | at/above T1/T2 item 8 complexity |
| 15 (z1-z6: module, argument, trigonometric and polar forms) | Complex module/argument/forms, pp. 17-19 | `mat.u5.complejos_modulo_argumento_y_formas` | 2-4 | `complex-number` (with polar metadata) + `angle-dms` | use `atan(b/a)` without quadrant/axes; wrong modulus; omit form components | T1/T2 item 2 assesses complex fluency, though not polar conversion (pedagogical correction: `atan2` quadrant-safe argument) |
| 16 (z7-z11: trigonometric to binomial and graph) | Polar-to-binomial conversion, pp. 17-19 | `mat.u5.complejos_modulo_argumento_y_formas` | 2-3 | `complex-number` + point | sign by quadrant; decimal where exact expected; swap real/imaginary | supports exam complex item 2 |
| 17 (locus \|z\|=3, figure, area, perimeter) | Module as distance, p. 17 | `mat.u5.complejos_modulo_argumento_y_formas` | 2-3 | multiple-choice figure + `numeric-tuple` (area, perimeter) | confuse disk/circle; radius/diameter; wrong area/perimeter | no direct selected exam item |
| 18 (rotate affix 2+i by 90° counter-clockwise) | Euler/exponential interpretation, pp. 18-19 | `mat.u5.complejos_rotaciones_y_transformaciones` | 2 | `numeric-tuple` or `complex-number` | clockwise sign; rotate components incorrectly; ignore modulus preservation | supports complex reasoning beyond exam item 2 (pedagogical correction: modulus preservation) |
| 19 (four square vertices from (0,-2)) | Euler rotations, pp. 18-19 | `mat.u5.complejos_rotaciones_y_transformaciones` | 3 | `root-list` (unordered, no multiplicity) | return one vertex; wrong rotation direction; duplicate points | no direct selected exam item |
| 20 (conjugate pair from real-part sum 6 and modulus sum 10; binomial and polar) | Module/argument/forms, pp. 17-19 | `mat.u5.complejos_modulo_argumento_y_formas` | 4 | `complex-number` pair + polar pair | derive only real part; wrong ± imaginary component; wrong quadrant | supports T1/T2 item 2 complex constraints (pedagogical correction: `atan2` quadrant-safe argument) |
| 21 (all complex numbers whose cube is `8(cos(π/2) + i sin(π/2))`; polar and binomial) | Euler, pp. 18-19; De Moivre/root theory is missing from theory | `mat.u5.potencias_y_raices_de_complejos` | 5 | `root-list` (set equality, no multiplicity) | return one root; divide argument without `2kπ`; wrong cube root of modulus; duplicates | extension beyond selected exam pair; canonical practice remains authoritative (pedagogical correction: De Moivre and n-th roots taught before item 21) |
| 22.a (conjugate and opposite of 14+4i in polar/trigonometric forms) | Complex forms, pp. 17-19 | `mat.u5.complejos_modulo_argumento_y_formas` | 3 | `complex-number` (with polar/trig metadata) | conjugate vs opposite confusion; argument sign/quadrant; modulus changed | supports complex item 2 |
| 22.b (printed `2−2 + 2i` is editorially malformed) | N/A | excluded deliberately | — | — | — | not admitted |

## Exam signals

`mat.exam.theme1` and `mat.exam.theme2` provide priority signals for sequencing but MUST NOT reduce canonical coverage or override the 22.b exclusion. Prompt text and worked reasoning inform item shaping; the highlighted answer sheet for Theme I item 8 MUST NOT be used as an answer oracle because it is internally inconsistent with the printed domain (`0 ≤ x ≤ π/2`).
