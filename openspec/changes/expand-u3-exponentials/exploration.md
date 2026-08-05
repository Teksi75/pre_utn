# Exploration: expand-u3-exponentials

## Purpose

Increase the quantity, variety, difficulty coverage, and pedagogical reach
of the `mat.u3.exponenciales` practice bank so it matches the breadth of
the canonical UTN 2025 practice guide, while keeping the new content
genuinely reachable and rendered in the student app.

This exploration only investigates. It does not write code, modify
catalog JSON, or touch the `align-u3-practice-official-exercises`
archive.

## Current State

### Canonical benchmark (PDF source of truth)

`material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf`
was read directly. The page-2 index lists "Ecuaciones Exponenciales y
Logarítmicas" starting at PDF page 14. The verified exercise counts are:

- Page 14: Ejercicio 35 (definiciones, 6 ítems), 36 (propiedades, 4
  ítems), 37 (desarrolla, 4 ítems), 38 (agrupa, 3 ítems).
- Page 14–15: Ejercicio 39 — "Resuelve las siguientes ecuaciones
  exponenciales" with sub-items **39a–39q (17 ítems total)**.
- Page 15–16: Ejercicio 40 — "Resuelve las siguientes ecuaciones
  logarítmicas" with sub-items 40a–40o (15 ítems total).

The benchmark target for the focused expansion is **the 17
exponenciales items in P39**, not all of P35–P40. The skill is named
"Ecuaciones exponenciales"; P35–P38 are logarithm-properties build-up
(overlapping with `mat.u1.logaritmos`); P40 belongs to
`mat.u3.logaritmicas` and is intentionally out of scope here.

Canonical sub-item → technique benchmark (verified by direct PDF read,
canonical expressions intentionally not reproduced verbatim; technique
descriptions are the audit-grade evidence the sub-item exists at the
stated count):

| Sub | Technique the canonical guide expects |
|-----|----------------------------------------|
| 39a | Equalize bases via shared power of a small base (radical-to-exponent rewriting) |
| 39b | Substitute a common-base variable so a mixed-base polynomial becomes quadratic |
| 39c | Same substitution, but the original expression is already a quadratic in the substituted variable |
| 39d | Constant RHS forces the exponent to zero |
| 39e | Recognize a sum of distinct powers of one base and factor |
| 39f | Factor a common base-power prefix from a sum |
| 39g | Symmetric substitution: rewrite `a^x + a^(1−x)` in terms of `t + k/t` |
| 39h | Substitution on an `e^x` / `e^(−x)` mixed polynomial (hyperbolic family) |
| 39i | Equalize bases when one member carries a negative exponent |
| 39j | Trivial same-base equalization (single-step) |
| 39k | Different bases on both sides: log both sides (change-of-base) |
| 39l | Factor a common `a^x` prefix from a linear combination |
| 39m | Quadratic in the exponent set equal to 1: factor the exponent |
| 39n | Substitution so the equation becomes a quadratic |
| 39o | Radical bases rewritten as fractional exponents, then equalize |
| 39p | Identity recognition on `e^x + e^(−x)` (cosh family) |
| 39q | Combined bases: rewrite all members in a common base, then equate |

### Current `mat.u3.exponenciales` inventory

`content/matematica/exercises/unit-3.json` currently holds 4 exercises
tagged with `skillId: "mat.u3.exponenciales"` (`.2`, `.3`, `.4`, `.5`):

| ID | Type | Difficulty |
|----|------|------------|
| ex.u3.exponenciales.2 | multiple-choice | 1 |
| ex.u3.exponenciales.3 | multiple-choice | 3 |
| ex.u3.exponenciales.4 | numerical | 1 |
| ex.u3.exponenciales.5 | multiple-choice | 3 |

Measured inventory vs. the canonical benchmark:

- **Quantity:** 4 vs. 17 canonical items. Ratio ≈ 24%.
- **Difficulty spread:** {1, 1, 3, 3}. Missing 2, 4, 5 entirely.
- **Technique spread:** all 4 are "rewrite both sides as the same
  base, equate exponents" (the technique of P39j, P39d, P39a, P39i).
  No substitution-style items (P39b, P39c, P39f, P39g, P39h, P39l,
  P39n), no different-bases (P39k), no identity-based (P39p), no
  quadratic-exponent (P39m), no sum/factoring identities (P39e), no
  radical-base variant (P39o).
- **Type spread:** {3 multiple-choice, 1 numerical}. No true-false,
  matching, ordering, or graphical.
- **Error tags:** all 4 have empty `commonErrorTags` arrays. The U3
  taxonomy in `src/domain/__tests__/error-taxonomy-u3.test.ts`
  defines `u3_igualdad_exponenciales`; none of the 4 exercises
  currently tag it.

### Loading, readiness, and rendering path (verified)

- `src/domain/catalog/content-loaders.ts:678` registers
  `UNIT_EXERCISE_FILES[3] = unit3Exercises` (imported from
  `content/matematica/exercises/unit-3.json`).
- `loadExercisesForSkill("mat.u3.exponenciales")` (line 692) walks
  the unit-3 file plus `exercises.json`, dedupes by ID, and returns
  the composed list with `applyExerciseDefaults` applied.
- `loadSkillBank("mat.u3.exponenciales")` (line 798) wraps that load
  and runs `validatePracticeBank`; `isSkillReady`
  (`catalog/readiness.ts:90`) reports ready when ≥4 exercises are
  loaded for the skill — current state is at the threshold but not
  above it.
- `UNIT_THRESHOLDS["unit-3"] = 24` (`content-loaders.ts:918`) is the
  per-unit floor used by `loadCatalog`; the unit already exceeds it
  thanks to other U3 skills, so adding more exponenciales will not
  push it below the floor.
- Reachability: `/practice?skill=mat.u3.exponenciales` →
  `usePracticeFlow` (`src/app/practice/usePracticeFlow.ts:80`) →
  `loadSkillBank` → `PracticeExercisePhase`
  (`src/components/practice/PracticeExercisePhase.tsx`) →
  `ExerciseCard` (prompt + difficulty + type label) +
  `AnswerForm` → `ExerciseAnswerInput`
  (`src/components/exercises/ExerciseAnswerInput.tsx:63`) handles
  `multiple-choice`, `true-false`, and text-input types
  (numerical / fill-blank). The current 4 exercises render through
  this path with no gaps.
- Coverage is asserted by
  `src/domain/__tests__/content-loaders-u3.test.ts:260`
  (`loadSkillBank("mat.u3.exponenciales").exercises.length >= 3`)
  and the U3 shape test
  (`src/domain/__tests__/u3-exercise-shape.test.ts`).

### Out-of-scope pointers already verified

- `align-u3-practice-official-exercises` is `in-progress` in
  `openspec/changes/STATUS.json` on
  `feat/align-u3-practice-official-exercises`, archived at
  `openspec/changes/archive/2026-07-10-align-u3-practice-official-exercises/`.
  This exploration does not touch it.
- `recuperar-u3-practica-canonica` and its descendants (Engram obs
  #4487) are blocked / archived; they are not modified here.
- Other U3 skills (`traduccion_lenguaje_verbal`,
  `ecuaciones_lineales`, `inecuaciones_*`, `recta`, `sistemas`,
  `logaritmicas`) are intentionally **not** part of this change.
  Exponenciales is first because the gap-to-benchmark ratio is the
  worst in the unit.

## Affected Areas

- `content/matematica/exercises/unit-3.json` — append-only addition
  of new exponenciales entries (no removal of existing entries, no
  edit of non-exponenciales entries).
- `src/domain/__tests__/content-loaders-u3.test.ts:260` — the
  `loadSkillBank('mat.u3.exponenciales')` assertion will need to
  raise its floor to match the new bank size; this is a test-only
  update.
- `src/domain/__tests__/u3-exercise-shape.test.ts` — may grow shape
  assertions for the new entries if the same suite is the convention
  used for past U3 expansions.
- `openspec/changes/STATUS.json` — register the new change as
  `in-progress` on the `sdd/expand-u3-exponentials` branch.
- `openspec/changes/expand-u3-exponentials/exploration.md` — this
  artifact (the only artifact created during the exploration phase).

No domain code, no UI, no theory/examples/feedback files, no
`src/app/practice/*` hooks, and no other skills are touched by this
exploration.

## Recommendation

Append 13 fresh exercises to `mat.u3.exponenciales` to bring the bank
from 4 to ~17 entries (parity with the canonical P39 count), with two
guardrails:

1. **Append-only on `mat.u3.exponenciales`.** Do not delete, edit,
   or rewrite the existing `.2`–`.5` entries. Their IDs must remain
   stable because persisted student progress may already reference
   them.
2. **Technique → exercise is a one-to-one audit, not a one-to-many
   copy.** For each of P39a–q, derive a new exercise that exercises
   the same *technique tag* but uses different values, different
   coefficients, or a different real-world framing. The product brief
   explicitly forbids copying canonical expressions literally.

Measured baseline vs. recommended target:

| Dimension | Baseline (today) | Target (post-change) |
|-----------|------------------|----------------------|
| Bank size | 4 | 17 (±2) |
| Difficulty levels covered | {1, 3} | {1, 2, 3, 4, 5} (≥1 each; ≥2 at d=5) |
| Canonical techniques covered | 1 (same-base equalization) | ≥8 of the 10 P39 techniques |
| Exercise types covered | {multiple-choice, numerical} | {multiple-choice, numerical, true-false, ordering, optional fill-blank / matching} |
| `commonErrorTags` coverage | 0/4 | 17/17 with at least `u3_igualdad_exponenciales` and any new technique-specific tag |
| `loadSkillBank` floor test | `>= 3` | `>= 17` |

## Acceptance Boundaries

The expansion is acceptable when every item below is observable in the
running app, not just present in JSON:

- A logged-in pilot student can open
  `/practice?skill=mat.u3.exponenciales` and see the new bank size
  reflected in the guided-phase machine (≥17 entries across the
  rendered `PracticeExercisePhase`).
- Each new entry's `type` falls within the set the renderer already
  handles (`multiple-choice`, `true-false`, `numerical`,
  `fill-blank`) so the amber "tipo no disponible" fallback at
  `ExerciseAnswerInput.tsx:280` is never reached for this skill.
- Each new entry has a non-empty `commonErrorTags` array whose IDs
  exist in the U3 taxonomy and map to a feedback entry in
  `content/matematica/feedback/unit-3.json`.
- The per-skill monotonic non-decreasing difficulty contract required
  by `openspec/specs/difficulty-progression/spec.md` holds for the
  composed bank (`validateDifficultyProgression` in
  `content-loaders.ts:994`).
- The `loadSkillBank("mat.u3.exponenciales")` readiness verdict
  stays true; `isSkillReady` returns ready and `queryBySkill`
  returns the expanded list.
- No canonical expression from P39a–q appears verbatim in any new
  `prompt` or `expectedAnswer` field. Coverage is audited at the
  *technique tag* level, not at the *literal expression* level.

## Variety Dimensions

The new bank must demonstrate measurable variety along each axis:

- **Difficulty:** at least 1 exercise at each of d = 1, 2, 3, 4 and
  at least 2 at d = 5.
- **Response type:** at least 3 distinct types drawn from the
  renderer-supported set above.
- **Technique tag:** at least 8 of the 10 P39 techniques (each
  sub-item is a separate technique, even when adjacent items share a
  family).
- **Distractor shape:** distractors should be derived from common
  error patterns declared in `commonErrorTags` (not random), per
  `openspec/specs/math-exercise-catalog/spec.md`.
- **Distractor framing:** for multiple-choice entries, at least one
  distractor must be a *near-miss* (correct technique, wrong sign
  / wrong coefficient) rather than a random wrong value.
- **Canonical-exclusion:** no new exercise reproduces a canonical
  expression from P39a–q; the audit compares literal prompt strings
  and literal `expectedAnswer` strings against the canonical set.

## Coverage Matrix

Each new entry must be mappable to a row in this matrix:

| Technique tag | Canonical anchor | Required minimum | Notes |
|---------------|------------------|------------------|-------|
| same-base equalization (radical-to-exponent) | P39a | 1 | rewrite both sides as a common power |
| substitution: mixed-base → quadratic | P39b | 1 | `t = a^x` collapses mixed bases |
| substitution: degree-2 already in `a^x` | P39c | 1 | quadratic in substituted variable |
| constant RHS forces exponent to zero | P39d | 1 | trivial same-base case |
| recognition + factoring of a power sum | P39e | 1 | identify the base then factor |
| factoring a common `a^x` prefix | P39f | 1 | linear combination of one base |
| symmetric `a^x + a^(1−x)` substitution | P39g | 1 | rewrite as `t + k/t` |
| hyperbolic `e^x` substitution | P39h | 1 | mixed signs on `e^x` |
| same-base with negative exponents | P39i | 1 | equalize bases, keep sign |
| trivial same-base | P39j | already covered (existing `.2`, `.4`, `.5`) | no new entry required |
| different bases: log both sides | P39k | 1 | change-of-base family |
| factoring a common `a^x` prefix (linear) | P39l | 1 | `5^(x+2)` rewritten as `25·5^x` |
| quadratic exponent set to 1 | P39m | 1 | factor the exponent polynomial |
| substitution → quadratic in `a^x` | P39n | 1 | canonical `9^x − 2·3^x − 3 = 0` family |
| radical bases rewritten as powers | P39o | 1 | `√5 · (1/5)^(...)` family |
| identity on `e^x + e^(−x)` | P39p | 1 | cosh identity |
| combined bases: all to one base | P39q | 1 | mixed `4`, `8`, `16`, `2` family |

## Risks

- **PDF/OCR drift in secondary artifacts.** Earlier audits reportedly
  miscounted sub-items or transcribed expressions incorrectly (per
  the brief). The counts in this exploration were re-verified by
  reading the rendered PDF directly, not from audit prose. Any future
  authoring step should still re-confirm P39a–q by direct PDF
  inspection before exercising against a specific sub-item.
- **Unsupported-type renderability.** The current `ExerciseAnswerInput`
  falls back to an amber placeholder for types outside its handled
  set. If graphical or matching entries are authored, the renderer
  must be expanded in the same change. Otherwise type diversity is
  capped at the renderer-handled set listed in the acceptance
  boundaries.
- **Distractor contamination.** Mixing exponenciales distractors with
  log-expression answers (e.g. P39o) is easy to mis-author; the
  authoring stage must respect the AGENTS.md "no free-text for
  roots / fractions / logs / dual-solution" rule and the existing
  type / answer-shape audit.
- **Cross-skill contamination.** Mixing distractors from neighboring
  skills (recta, inecuaciones) is also tempting. The `category`
  field on each new entry must keep the family declaration
  consistent with the existing exponenciales entries.
- **Bank-size test regression.** The `loadSkillBank` floor test in
  `content-loaders-u3.test.ts:260` will pass at the new floor only
  if the bank is actually expanded. If a smaller bank is approved
  later, the test floor must be lowered in the same change to avoid
  a flaky gate.
- **Per-skill difficulty ramp.** With 17 items and required
  monotonicity, the difficulty curve must be planned (e.g.
  {1,1,2,2,3,3,3,4,4,4,5,5,...}) rather than improvised per entry.
- **Independence from blocked work.** Several other U3 branches
  (`feat/align-u3-practice-official-exercises`,
  `sdd/recuperar-u3-practica-canonica`, the planning-checkpoint
  branch) are intentionally not touched. The change's diff must
  remain self-contained: only
  `content/matematica/exercises/unit-3.json` (append), its test,
  and `STATUS.json` are in scope.

## Open Decisions

- **Difficulty 5 budget.** Two exercises at d=5 are recommended (the
  symmetric substitution and the different-bases cases). If a 17-item
  bank cannot honor that, the bank should still hit ≥1 at d=5.
- **Error taxonomy surface area.** Whether to add new `u3_*` tags
  (`u3_sustitucion_a_x`, `u3_bases_distintas`,
  `u3_factor_comun_a_x`, `u3_exponente_cuadratico`) in this change
  or in a sibling U3 expansion. One change per new taxonomy tag is
  the recommended discipline.
- **Graphical / matching entries.** Whether to include them. If yes,
  the renderer must be budgeted in the same change. If no, type
  diversity is capped at the renderer-supported set listed above.

## Ready for Proposal

**Yes**, with the guardrails above. The exploration phase has produced
enough measured baseline and target numbers, a defensible approach,
and a list of open decisions that the next phase must answer. No
follow-up clarification is required from the user before proposal
work begins.