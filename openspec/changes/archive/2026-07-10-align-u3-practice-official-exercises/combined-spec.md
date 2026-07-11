# Combined Specs: align-u3-practice-official-exercises (corrective rerun)

Change: `align-u3-practice-official-exercises`
Artifact mode: hybrid (filesystem + Engram)
Source-of-truth PDF: `material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf`

This artifact concatenates the 8 specs (2 NEW, 6 DELTA) for the change. Each section preserves the contract verified by the PASS exploration: P34/P37 mandatory, exactly nine MC challenges at difficulty === 5, base policy 1-4, prohibition of free-form input TYPES (math notation in MC option values remains valid structured representation), trace path existence and valid enums, alignment invalid on every surface, exact companion ownership #82/#83, progress/ID compatibility, legacy tag correction, verified math facts, per-slice <=400 policy, and immutable compatibility baselines (pre-change U3 IDs, both translation desafios, populated pre-utn.practice.v1 as full student-scoped envelope, advanced-practice records with verified ChallengeAttempt fields).

v3 corrects final-spec gate findings: fixture paths are four exact literal paths under `tests/fixtures/compatibility/`; `ChallengeAttempt` fields are the ACTUAL runtime fields (`studentId, exerciseId, skillId, correct, answeredAt, timeMs, attemptIndex`); `readinessBySkill: Record<SkillId, number | null>`; base `pre-utn.practice.v1` fixture is the FULL student-scoped envelope `{ students, activeStudentId }`. All frozen fixtures MUST be `as const` and MUST NOT import from runtime catalog/progress modules. Expected values MUST NOT be derived from the post-change catalog.

v4 corrective update: adds MODIFIED `Catalog Querying` requirement block to `math-exercise-catalog` delta. Resolves silent conflict between the legacy difficulty-then-ID ordering contract and the new P37/P38 progression metadata ordering. The new contract preserves legacy difficulty-then-ID ordering for all entries EXCEPT when both entries share a non-empty `progressionFamily` value AND both carry a finite numeric `progressionOrder` (same family). In that case, the comparator orders by ascending `progressionOrder`. Entries lacking metadata, with different families, or with non-finite `progressionOrder` retain legacy ordering. The previously-added `P37 ordered before P38 by progression metadata` scenario is removed from the ADDED U3 Aligned Exercise Coverage block because it contradicted the new contract; the MODIFIED Catalog Querying block now owns the ordering rules with full original scenarios plus two new testable scenarios (P37 expansion precedes P38 combining; ordinary entries retain difficulty-then-ID).

v5 corrective update: tightens the MODIFIED `Catalog Querying` rule to resolve the v4 residual contradiction. v4's "same `progressionFamily` + numeric `progressionOrder` on both → by `progressionOrder`" only orders WITHIN one family and cannot guarantee P37 (`log-expansion`) precedes P38 (`log-combining`) since those are DIFFERENT families. v5 replaces the same-family rule with strictly-scoped cross-family precedence that fires ONLY when BOTH entries are validated U3 logarithmic metadata entries: `progressionFamily ∈ {"log-expansion","log-combining"}` AND finite numeric `progressionOrder`. Family rank: `log-expansion`=0, `log-combining`=1 (sort ASC). Numeric `progressionOrder` sorts ASC within the same family. ALL other pairings (legacy, missing/malformed metadata, single-side metadata, or `progressionFamily` outside the recognized set) fall back to the legacy difficulty-then-ID rule. Scenarios prove every P37 expansion precedes every P38 combining AND legacy ordering is unchanged for ordinary entries.

v6 corrective update: splits the `difficulty-progression` `wrong challenge difficulty rejected` scenario into a two-layer contract. Generic loader accepts `4` or `5`; the scoped U3 alignment audit rejects diff-4 entries on the nine in-scope skill IDs only and MUST NOT touch `mat.u3.traduccion_lenguaje_verbal.desafio-02` (diff 4). The wrong-difficulty scenario now asserts all three outcomes: (1) generic parsing compatible with `difficulty: 4`, (2) scoped policy audit rejection for the new alignment skill IDs, and (3) existing translation desafio-02 at diff 4 remains accepted. Aligns with the MODIFIED `challenge-exercises`/`Challenge Exercise Schema Compliance` block that documents the same separation between loader-level and audit-level enforcement.

---

## Domain: u3-absolute-value-equations-skill (NEW)

> P8 equation family

# U3 Absolute-Value Equations Skill Specification

## Purpose

Domain contract for `mat.u3.ecuaciones_valor_absoluto` (P8 absolute-value equation family). Leaf skill; teaches `|ax+b|=k` patterns separate from the existing `inecuaciones_valor_absoluto`. Source-of-truth: `material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf`.

## Requirements

### Requirement: Skill Identity and Leaf Discipline

`mat.u3.ecuaciones_valor_absoluto` MUST exist with ID following `mat.u{1-6}.{slug}`, unit 3, and MUST NOT declare global prerequisites (parallel-branch design). It MUST appear in `UNIT_3_SKILLS` and `PILOT_SKILLS`.

#### Scenario: leaf skill registered

- GIVEN the loaded skill catalog
- WHEN the U3 skill list is enumerated
- THEN `mat.u3.ecuaciones_valor_absoluto` is present
- AND no `SKILL_DEPENDENCIES` entry lists it as a prerequisite for any other skill

### Requirement: Theory Coverage

Theory MUST cover: `|x|=k` two-solution (k>0), one-solution (k=0), and no-solution (k<0) cases; `|ax+b|=c` reduction; nested negative bars on both sides (P8g); structural contrast with `|x|+c=d` (P8b pattern); and symmetric-variable equations (P8i). Theory MUST NOT reference modular inequalities or other units.

#### Scenario: theory covers all required cases

- GIVEN theory node `theory-valor-absoluto-ecuaciones`
- WHEN each case is inspected
- THEN `|x|=k>0`, `|x|=0`, `|x|=k<0`, `|ax+b|=c`, nested negative bars, and `|x|+c=d` are all present
- AND no concept references modular inequalities or other units

### Requirement: Worked Examples and P8g Solution

Worked examples MUST be >= 3. The P8g worked example MUST show `-|x| = -10.5` ⇒ `|x| = 10.5` ⇒ solution set `{−10.5, 10.5}`. The prior "no solution" and "−10.5 alone" interpretations are incorrect and MUST NOT appear in any worked example.

#### Scenario: P8g worked example uses corrected solution

- GIVEN the worked-example entry for P8g
- WHEN the solution steps are rendered
- THEN `|x| = 10.5` appears before the two-value set
- AND `{−10.5, 10.5}` is the final solution set

### Requirement: Base Exercises (Difficulty 1-4)

>= 5 MC base exercises covering diff 1 (P8a/c), diff 2 (P8d/e/f/h), diff 3 (P8i + P8g). Difficulty MUST be in 1-4 inclusive. No base exercise MUST use `text` or free-form symbolic input.

#### Scenario: P8g base exercise uses corrected solution

- GIVEN `ex.u3.ecuaciones_valor_absoluto.{n}` anchored in P8g
- WHEN its `correctAnswer` is read
- THEN it matches `{−10.5, 10.5}` (surfaced as two MC options, not "no solution")

#### Scenario: structured-control discipline

- GIVEN all base exercises for this skill
- WHEN their `type` is inspected
- THEN type is `multiple-choice` for every entry (no `text`, no free-form symbolic)

### Requirement: Feedback and Error Tags

At least 3 `u3_abs_eq_*` error tags MUST exist with feedback mappings in `feedback/unit-3.json`. Each exercise's `commonErrorTags` MUST reference only tags with feedback coverage.

#### Scenario: feedback coverage complete

- GIVEN feedback library for unit-3
- WHEN `u3_abs_eq_*` tags are enumerated
- THEN each has a non-empty `FeedbackMapping`
- AND no base exercise references an uncovered tag

### Requirement: Canonical Trace

Each new exercise, theory node, and worked example MUST carry a `canonicalTrace` entry whose `sourceUse` is one of `reference | adapted | reinforcement` (NEVER `alignment`, NEVER `canonical-source`) and whose `path` resolves to an existing repository file. For this change the verified path is `material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf`.

#### Scenario: trace sourceUse is in exercise enum

- GIVEN any new exercise for this skill
- WHEN its `canonicalTrace[].sourceUse` is read
- THEN the value is `reference`, `adapted`, or `reinforcement`
- AND `path` resolves to a file that exists on disk

### Requirement: Challenge (Difficulty 5)

Exactly one new challenge MUST exist for this skill with `difficulty === 5` and `type === multiple-choice`. Its `canonicalTrace.sourceUse` MUST be one of `canonical-source | adapted | calibrated-from-exam | solution-pattern` (challenge enum), and `path` MUST resolve to an existing file.

#### Scenario: challenge is structured MC at diff 5

- GIVEN the challenge loader
- WHEN challenges for `mat.u3.ecuaciones_valor_absoluto` are queried
- THEN exactly 1 entry is returned
- AND `difficulty === 5`
- AND `type === multiple-choice`
- AND `canonicalTrace.sourceUse` is one of the four challenge enum values
- AND `canonicalTrace.path` resolves to a real file

---

## Domain: u3-product-quotient-inequalities-skill (NEW)

> P9p-w sign-chart family

# U3 Product-Quotient Inequalities Skill Specification

## Purpose

Domain contract for `mat.u3.inecuaciones_producto_cociente` (P9p-w product/quotient/quadratic/rational inequality sign-chart family). Leaf skill; teaches sign-chart methodology for non-linear inequalities. Source-of-truth: `material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf`.

## Requirements

### Requirement: Skill Identity and Leaf Discipline

`mat.u3.inecuaciones_producto_cociente` MUST exist with ID following `mat.u{1-6}.{slug}`, unit 3, and MUST NOT declare global prerequisites (parallel-branch design). It MUST appear in `UNIT_3_SKILLS` and `PILOT_SKILLS`.

#### Scenario: leaf skill registered

- GIVEN the loaded skill catalog
- WHEN the U3 skill list is enumerated
- THEN `mat.u3.inecuaciones_producto_cociente` is present
- AND no `SKILL_DEPENDENCIES` entry lists it as a prerequisite

### Requirement: Theory Coverage

Theory MUST cover: critical roots from product/quotient factors, sign-chart partition, endpoint inclusion vs exclusion, rational-inequality domain exclusions (denominator zeros), and preservation of all critical factors when factoring (factor `x` MUST NOT be dropped). Theory MUST NOT reference other units.

#### Scenario: theory covers sign-chart methodology

- GIVEN theory node `theory-inecuaciones-producto-cociente`
- WHEN each topic is inspected
- THEN critical roots, sign-chart partition, endpoint inclusion/exclusion, denominator-zero domain exclusions, and factor preservation are all present
- AND factor `x` preservation is explicitly stated as a rule

### Requirement: Worked Examples and P9p Factor Preservation

Worked examples MUST be >= 3. The P9p worked example MUST show `(x − 2x²)(x + ½) ≤ 0` ⇒ `x(2x − 1)(x + ½) ≥ 0` with critical roots `−½, 0, ½` and solution `[−½, 0] ∪ [½, ∞)`. Factor `x` MUST be preserved.

#### Scenario: P9p worked example preserves factor x

- GIVEN the worked-example entry for P9p
- WHEN the factored form is rendered
- THEN `x(2x − 1)(x + ½)` appears with `x` intact
- AND `−½, 0, ½` are listed as critical roots
- AND the final solution is `[−½, 0] ∪ [½, ∞)`

### Requirement: Base Exercises (Difficulty 3-4)

>= 5 MC base exercises covering diff 3 (P9w `(2x − 1)(x − 3) ≥ 0`, P9q `x² ≤ x`) and diff 4 (P9p with factor `x` preserved, P9r, P9t, P9u with denominator boundary). Difficulty MUST be 3-4. No exercise MAY use `text` or free-form symbolic input.

#### Scenario: P9p preserves factor x

- GIVEN a P9p-anchored exercise
- WHEN its MC options are inspected
- THEN factor `x` is present in the canonical factored form
- AND `−½, 0, ½` are visible as critical roots

#### Scenario: P9u honors denominator boundary

- GIVEN a P9u-anchored exercise
- WHEN its MC options are inspected
- THEN `x = 2` (denominator zero) is NOT included in any correct option

### Requirement: Feedback and Error Tags

At least 3 `u3_signchart_*` error tags (e.g. `u3_signchart_factor_signo_incorrecto`, `u3_signchart_critical_root_omitido`, `u3_signchart_dominio_denominador`) MUST exist with feedback mappings in `feedback/unit-3.json`.

#### Scenario: feedback coverage complete

- GIVEN feedback library for unit-3
- WHEN `u3_signchart_*` tags are enumerated
- THEN each has a non-empty `FeedbackMapping`
- AND no base exercise references an uncovered tag

### Requirement: Canonical Trace

Each new exercise, theory node, and worked example MUST carry `canonicalTrace`. `sourceUse` MUST be `reference | adapted | reinforcement` (NEVER `alignment`, NEVER `canonical-source`). `path` MUST resolve to an existing file. The verified path is `material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf`.

#### Scenario: trace path resolves

- GIVEN any new exercise for this skill
- WHEN its `canonicalTrace[].path` is resolved on disk
- THEN the file exists
- AND `sourceUse` is `reference`, `adapted`, or `reinforcement`

### Requirement: Challenge (Difficulty 5)

Exactly one new challenge MUST exist for this skill with `difficulty === 5` and `type === multiple-choice`, anchored in P9v `(x² − x)/((x + 1)(2 − x)) ≥ 0` with full sign chart preserving factor `x`. Its `canonicalTrace.sourceUse` MUST be one of `canonical-source | adapted | calibrated-from-exam | solution-pattern`.

#### Scenario: challenge is structured MC at diff 5

- GIVEN the challenge loader
- WHEN challenges for `mat.u3.inecuaciones_producto_cociente` are queried
- THEN exactly 1 entry is returned
- AND `difficulty === 5`, `type === multiple-choice`
- AND `canonicalTrace.sourceUse` is one of the four challenge enum values
- AND `canonicalTrace.path` resolves

---

## Domain: math-skill-model (DELTA)

> Adds 2 U3 leaf skills

# Delta for math-skill-model

## ADDED Requirements

### Requirement: U3 Absolute-Value Equations Skill

The skill catalog MUST register `mat.u3.ecuaciones_valor_absoluto` as a U3 leaf skill for the P8 `|ax+b|=k` equation family. It MUST appear in `UNIT_3_SKILLS` and `PILOT_SKILLS`. It MUST NOT appear as a prerequisite for any other skill (parallel-branch design; see root-skill convention).

#### Scenario: skill registered as leaf

- GIVEN the loaded skill catalog
- WHEN `UNIT_3_SKILLS` is enumerated
- THEN `mat.u3.ecuaciones_valor_absoluto` is present
- AND no entry in `SKILL_DEPENDENCIES` lists it as a prerequisite for any other skill

### Requirement: U3 Product-Quotient Inequalities Skill

The skill catalog MUST register `mat.u3.inecuaciones_producto_cociente` as a U3 leaf skill for the P9p-w sign-chart family. It MUST appear in `UNIT_3_SKILLS` and `PILOT_SKILLS`. It MUST NOT appear as a prerequisite for any other skill.

#### Scenario: skill registered as leaf

- GIVEN the loaded skill catalog
- WHEN `UNIT_3_SKILLS` is enumerated
- THEN `mat.u3.inecuaciones_producto_cociente` is present
- AND no entry in `SKILL_DEPENDENCIES` lists it as a prerequisite for any other skill

### Requirement: Existing `traduccion_lenguaje_verbal` Untouched

This change MUST NOT modify `mat.u3.traduccion_lenguaje_verbal` (the `fortalecer-u3-lenguaje-modelizacion-transferencia` companion owns it), MUST NOT alter its existing 5 base MC exercises, and MUST NOT touch its 2 existing desafios (`desafio-01` diff 5, `desafio-02` diff 4).

#### Scenario: existing skill and challenges unchanged

- GIVEN the existing `mat.u3.traduccion_lenguaje_verbal` entry and its 2 desafios
- WHEN this change is applied
- THEN `UNIT_3_SKILLS` membership is unchanged for that skill
- AND the 2 desafios remain in the challenge loader at their original `difficulty` and `id`

---

## Domain: math-exercise-catalog (DELTA — MODIFIED Catalog Querying (cross-family U3 logarithmic metadata precedence) + Unit 2 Official-PDF Canonical Trace (alignment removed); ADDED P34/P37 mandatory + canonicalTrace contract)

> Corrective update v5: tightens MODIFIED `Catalog Querying` to a strictly-scoped cross-family override that fires ONLY for the recognized U3 logarithmic metadata set; legacy difficulty-then-ID is the default for everything else. Resolves the v4 residual contradiction (same-family rule could not guarantee P37 `log-expansion` precedes P38 `log-combining`).

# Delta for math-exercise-catalog

## MODIFIED Requirements

### Requirement: Catalog Querying

The catalog SHALL support querying by unit, skill, and difficulty range. Deterministic ordering per pair:

| Pair condition | Order |
|---|---|
| Both entries carry validated U3 logarithmic metadata: `progressionFamily ∈ {"log-expansion","log-combining"}` AND finite numeric `progressionOrder` | `progressionFamily` rank ASC (`log-expansion`=0, `log-combining`=1), then numeric `progressionOrder` ASC within same family |
| Otherwise | difficulty ASC, then ID lexicographic ASC |

This is the ONLY cross-family override. All other pairings (legacy, missing/malformed metadata, single-side metadata, or `progressionFamily` outside the recognized set) fall back to the legacy rule.

(Previously: difficulty-then-ID unconditional; same-family override scoped. Updated: same-family rule replaced by strictly-scoped cross-family precedence that fires ONLY for the recognized U3 logarithmic metadata set.)

#### Scenario: query by skill orders results

- GIVEN three exercises for one skill with difficulties 2, 1, 4
- WHEN exercises are requested by skill
- THEN results return in difficulty order 1, 2, 4

#### Scenario: query with no matches is safe

- GIVEN no exercises match a requested skill or difficulty range
- WHEN the catalog is queried
- THEN an empty result returns without error

#### Scenario: P37 expansion precedes P38 combining by validated U3 logarithmic metadata

- GIVEN logaritmicas entries spanning both families with finite numeric `progressionOrder` values
- WHEN the catalog loader enumerates the skill
- THEN every entry with `progressionFamily = "log-expansion"` appears before every entry with `progressionFamily = "log-combining"`
- AND within each family, entries sort ascending by numeric `progressionOrder`
- AND ordering is NOT based on prompt, canonical anchor, or `pedagogicalNote` text

#### Scenario: ordinary entries retain legacy difficulty-then-ID ordering

- GIVEN entries lacking `progressionFamily`/`progressionOrder`, with `progressionFamily` outside the recognized U3 logarithmic set, OR with non-numeric/non-finite `progressionOrder`
- WHEN the catalog loader enumerates the skill
- THEN results return in legacy order (difficulty ASC, then ID lexicographic ASC)
- AND the same ordering applies when only ONE entry in the pair carries the metadata

### Requirement: Unit 2 Official-PDF Canonical Trace

Each new U2 exercise (PR 3-7) MUST carry `canonicalTrace` with `path` including `02_ej_utn.pdf` and `sourceUse` ∈ {`reference`, `adapted`, `reinforcement`} for exercises/theory/worked-examples. Challenges use enum: `canonical-source | adapted | calibrated-from-exam | solution-pattern`. `alignment` MUST NOT be used on any surface.

(Previously: sourceUse enum was `reference, adapted, reinforcement, alignment`; challenge enum omitted; `alignment` incorrectly allowed on the exercise surface.)

#### Scenario: U2-CAT-OFFICIAL-001 — All aligned exercises reference 02_ej_utn.pdf

- GIVEN any of the 32 new U2 exercises (PR 3-7)
- WHEN its `canonicalTrace` is inspected
- THEN at least one entry has `path` matching `02_ej_utn.pdf`
- AND that entry's `sourceUse` is one of: `reference`, `adapted`, `reinforcement`

#### Scenario: U2-CAT-OFFICIAL-002 — PR-by-PR coverage

- GIVEN the 32 aligned exercises grouped by PR (PR 3: 4, PR 4: 6, PR 5: 10, PR 6: 4, PR 7: 8)
- WHEN each group's `canonicalTrace` is inspected
- THEN every exercise carries an official-PDF trace

## ADDED Requirements

### Requirement: U3 Aligned Exercise Coverage (P34/P37 Mandatory)

The catalog MUST add base exercises (difficulty 1-4) for each in-scope U3 skill:

| Skill | Base coverage |
|-------|---------------|
| `ecuaciones_lineales` | >=1 diff-3 P1c/g/j/k/l/m/n |
| `ecuaciones_cuadraticas` | >=1 diff-3 P5d; >=1 diff-4 P6 |
| `ecuaciones_valor_absoluto` (NEW) | >=5 MC diff 1-3 incl P8g |
| `inecuaciones_valor_absoluto` | >=1 diff-4 P9n/o |
| `inecuaciones_producto_cociente` (NEW) | >=5 MC diff 3-4 incl P9p, P9q, P9r, P9t, P9u, P9w |
| `recta` | >=1 diff-4 parallel-by-point + >=1 perpendicular-by-point (P12c/d/g or P20a/b) |
| `sistemas` | >=1 diff-4 P25; >=1 diff-4 P27/P29; >=1 diff-4 P32; >=1 diff-4 P34 |
| `exponenciales` | >=1 diff-4 P39b/c; >=1 diff-4 P39m/n |
| `logaritmicas` | >=1 diff-2/3 P37; >=1 diff-3 P38; >=1 diff-3 P40k; >=1 diff-4 P40m; >=1 diff-4 P40n |

#### Scenario: P34 single MC combines three interpretations

- GIVEN `mat.u3.sistemas` difficulty-4 entries
- WHEN the P34-anchored exercise is inspected
- THEN its MC prompt requires the student to:
  - classify the system (SPD/SCI/SI)
  - interpret the graph (intersection/coincident/parallel)
  - select the solution set (unique point / parametric line / empty)
- AND its MC options encode all three interpretations as distinct choices
- AND it carries a `canonicalTrace` entry whose `path` resolves to the verified PDF

### Requirement: canonicalTrace Existence, Enum, and Path Resolution

Every new U3 exercise MUST carry `canonicalTrace` with a path resolving on disk (verified: `material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf`). `sourceUse` MUST be `reference | adapted | reinforcement` (NEVER `alignment`, NEVER `canonical-source`).

#### Scenario: every new U3 exercise has a resolvable trace

- GIVEN the catalog
- WHEN every new U3 exercise is inspected
- THEN each carries `canonicalTrace` resolving on disk
- AND `sourceUse` is `reference | adapted | reinforcement` (NOT `alignment`/`canonical-source`)

---

## Domain: practice-coverage (DELTA)

> Adds U3 base 1-4 vs challenge 5 policy + IDs/storage compatibility baselines

# Delta for practice-coverage

## ADDED Requirements

### Requirement: U3 Base vs Challenge Difficulty Policy

All NEW base exercises for the nine in-scope U3 skills MUST have `difficulty` in `1-4` inclusive; each MUST have EXACTLY ONE new challenge with `difficulty === 5`. Nine skills: `mat.u3.ecuaciones_lineales`, `mat.u3.ecuaciones_cuadraticas`, `mat.u3.ecuaciones_valor_absoluto`, `mat.u3.inecuaciones_valor_absoluto`, `mat.u3.inecuaciones_producto_cociente`, `mat.u3.recta`, `mat.u3.sistemas`, `mat.u3.exponenciales`, `mat.u3.logaritmicas`. Content policy (NOT enforced by the `Difficulty` literal type); enforced by per-skill content tests.

#### Scenario: no base exercise has difficulty 5

- GIVEN the catalog
- WHEN each in-scope U3 skill's base exercises are enumerated
- THEN no base exercise has `difficulty === 5`

#### Scenario: exactly 9 new challenges at diff 5

- GIVEN the challenge loader
- WHEN new challenges for the in-scope U3 skill IDs are enumerated
- THEN the count is exactly 9
- AND every one has `difficulty === 5`

### Requirement: Companion Ownership Preserved

This change MUST NOT add base exercises or challenges for families owned by registered companions. **#82** owns P7, P10a-h, P13-P19, P31a-j. **#83** owns P22, P23, P30.

#### Scenario: no companion-family exercise lands here

- GIVEN the catalog after this change
- WHEN any new exercise is inspected
- THEN no exercise references P7, P10, P13-P19, P22, P23, P30, or P31

### Requirement: Existing U3 IDs and Progress Preserved

This change MUST NOT renumber any existing U3 exercise ID, MUST NOT alter the `pre-utn.practice.v1` storage shape (full student-scoped envelope with `students` and `activeStudentId`), and MUST NOT change the schema of `PracticeProgress`, `PracticeProgressMap`, `ChallengeAttempt`, or `AdvancedPracticeProgress`.

#### Scenario: existing U3 IDs preserved

- GIVEN the existing catalog
- WHEN this change is applied
- THEN every existing `ex.u3.<skill>.<n>` ID resolves to the same `id`, `skillId`, and `difficulty`

#### Scenario: practice storage shape preserved (full student-scoped envelope)

- GIVEN a populated `pre-utn.practice.v1` entry holding `{ students, activeStudentId }`
- WHEN the catalog is reloaded after this change
- THEN the entry parses without error
- AND `students[activeStudentId]` retains its original `PracticeProgress` keys and types

### Requirement: Literal Immutable Compatibility Fixtures (Frozen Baselines)

The test suite MUST check in immutable literal fixtures under `tests/fixtures/compatibility/` capturing the pre-change state below. Fixtures MUST be TypeScript literal objects (`as const`), MUST NOT import from `src/domain/catalog/`, `src/domain/practice/`, or `src/domain/advanced-practice/`, and MUST be used as frozen expectations. Expected values MUST NOT be derived from the post-change catalog.

| Fixture file | Shape | Coverage |
|--------------|-------|----------|
| `tests/fixtures/compatibility/u3-exercise-baseline.ts` | `{ id, skillId, difficulty }[]` | Every pre-change `ex.u3.<skill>.<n>` |
| `tests/fixtures/compatibility/u3-challenge-baseline.ts` | `{ id, skillId, difficulty, type, canonicalTrace }[]` | `desafio-01` (diff 5) + `desafio-02` (diff 4) |
| `tests/fixtures/compatibility/u3-practice-progress-baseline.ts` | `PracticeProgressMap` literal | Full `pre-utn.practice.v1` envelope: `{ students, activeStudentId }` |
| `tests/fixtures/compatibility/u3-advanced-progress-baseline.ts` | `AdvancedPracticeProgress` literal | `challengeAttempts: ChallengeAttempt[]` plus `readinessBySkill: Record<SkillId, number \| null>` |

`ChallengeAttempt` fields in `u3-advanced-progress-baseline.ts` MUST be EXACTLY: `studentId`, `exerciseId`, `skillId`, `correct`, `answeredAt`, `timeMs`, `attemptIndex`. NO other field names (no `attemptId`, no `selectedOptionId`, no `submittedAt`).

#### Scenario: frozen U3 base inventory matches post-change IDs

- GIVEN the frozen `u3-exercise-baseline.ts` literal
- WHEN the post-change catalog enumerates `ex.u3.<skill>.<n>` IDs
- THEN every frozen `id` resolves to the same `id`, `skillId`, and `difficulty`

#### Scenario: frozen `traduccion_lenguaje_verbal` desafios preserved

- GIVEN the frozen `u3-challenge-baseline.ts` literal
- WHEN the post-change loader queries `mat.u3.traduccion_lenguaje_verbal`
- THEN it returns 2 entries
- AND `desafio-01` retains `difficulty: 5`, frozen `type`, canonical trace shape
- AND `desafio-02` retains `difficulty: 4`, frozen `type`, canonical trace shape

#### Scenario: frozen `pre-utn.practice.v1` parses as full student-scoped envelope

- GIVEN the frozen `u3-practice-progress-baseline.ts` literal `{ students, activeStudentId }`
- WHEN the post-change parser reads it
- THEN `students[activeStudentId]` parses with the same `PracticeProgress` keys and types

#### Scenario: frozen advanced-practice preserves `ChallengeAttempt` and `readinessBySkill`

- GIVEN the frozen `u3-advanced-progress-baseline.ts` literal
- WHEN the post-change parser reads it
- THEN every `ChallengeAttempt` field (`studentId, exerciseId, skillId, correct, answeredAt, timeMs, attemptIndex`) parses with the same type
- AND `readinessBySkill` retains the same keys and same `number | null` values

---

## Domain: difficulty-progression (DELTA)

> Adds U3 diff-5 challenge discipline

# Delta for difficulty-progression

## ADDED Requirements

### Requirement: U3 Difficulty-5 Is Reserved for Challenges

For the nine in-scope U3 skills in `align-u3-practice-official-exercises`, every entry with `difficulty === 5` MUST be a challenge (i.e. loaded via the challenge loader, not the base exercise loader). Conversely, every challenge for these nine skills MUST have `difficulty === 5` exactly.

#### Scenario: diff-5 entries are challenges only

- GIVEN the catalog after this change
- WHEN all U3 exercises with `difficulty === 5` are enumerated
- THEN each one is a challenge (loaded by the challenge loader)

#### Scenario: in-scope U3 challenges are diff 5

- GIVEN the challenge loader
- WHEN challenges for the nine in-scope U3 skill IDs are enumerated
- THEN every one has `difficulty === 5`

### Requirement: Per-Skill Base Difficulty Monotonicity

For each in-scope U3 skill, base exercises (non-challenge) ordered by `id` MUST show a non-decreasing difficulty sequence across the FIRST occurrence of each new diff level added by this change.

#### Scenario: monotonic base progression

- GIVEN `mat.u3.sistemas` exercises ordered by id
- WHEN difficulties are inspected
- THEN the new entries added by this change show non-decreasing difficulty

### Requirement: Challenge Difficulty Is Exactly 5

A U3 challenge for an in-scope skill MUST NOT be added with `difficulty` other than 5. Any other difficulty fails validation per the per-skill content test. The generic loader accepts `4` or `5`; the scoped U3 alignment audit rejects diff-4 entries on the nine in-scope skill IDs only.

#### Scenario: wrong challenge difficulty rejected

- GIVEN a structurally valid candidate challenge with one of the nine new U3 alignment skill IDs and `difficulty: 4`
- WHEN the generic challenge loader parses it and the scoped U3 alignment policy audit runs
- THEN generic parsing remains compatible with difficulty 4 or 5
- AND the scoped policy audit rejects it because every newly added alignment challenge requires `difficulty === 5`
- AND the existing `mat.u3.traduccion_lenguaje_verbal` difficulty-4 challenge remains accepted

### Requirement: Existing `traduccion_lenguaje_verbal` Desafios Preserved

The two existing desafios `ex.u3.traduccion_lenguaje_verbal.desafio-01` (diff 5) and `ex.u3.traduccion_lenguaje_verbal.desafio-02` (diff 4) MUST remain at their original `difficulty` and MUST NOT be duplicated by this change.

#### Scenario: existing desafios untouched

- GIVEN the challenge loader before this change
- WHEN `mat.u3.traduccion_lenguaje_verbal` challenges are queried
- THEN exactly 2 entries are returned at their original `difficulty` values
- AND no new challenge with that skill id is added by this change

---

## Domain: challenge-exercises (DELTA — MODIFIED Challenge Exercise Schema Compliance (diff policy); ADDED scoped U3 alignment audit + free-form TYPE prohibition + desafios compatibility baseline)

> 

# Delta for challenge-exercises

## MODIFIED Requirements

### Requirement: Challenge Exercise Schema Compliance

Every new challenge MUST have: `type: "multiple-choice"`, 4 `options`, `challengeSection: true`, `category: "desafio"`, `tags: ["desafio", "integrador"]`, `canonicalTrace` with ≥1 entry whose `sourceUse` ∈ {`canonical-source`, `adapted`, `calibrated-from-exam`, `solution-pattern`}, `commonErrorTags` referencing real tags in `src/domain/error-taxonomy/`, and `pedagogicalNote` plus `pedagogicalIntent` written in Spanish. The loader MUST throw at module init on any violation. The loader-level difficulty check accepts `4` or `5`.

Context-specific difficulty baselines (enforced by a scoped U3 alignment audit, NOT by the loader): pilot-skill (U1/U2) challenges use `difficulty: 4`. `traduccion_lenguaje_verbal.desafio-02` keeps `difficulty: 4` (pre-change baseline). `traduccion_lenguaje_verbal.desafio-01` keeps `difficulty: 5` (pre-change baseline). The nine named U3 alignment challenges added by `align-u3-practice-official-exercises` MUST have `difficulty === 5`.

(Previously: requirement text said `difficulty: 4` universally; the wrong-difficulty scenario was inconsistent; translation desafios not enumerated as preserved baselines; no scoped U3 alignment audit existed.)

#### Scenario: valid entry passes loader

- GIVEN a valid challenge
- WHEN `loadChallengesForSkill(skillId)` is called
- THEN the entry is returned without error

#### Scenario: free-text root rejected

- GIVEN a challenge whose `expectedAnswer` is a free-text root in a `numerical` type
- WHEN the loader parses the file
- THEN the loader throws (AGENTS.md prohibition)

#### Scenario: wrong difficulty is rejected

- GIVEN a challenge with `difficulty: 3` or `6`
- WHEN the loader parses the file
- THEN the loader throws (loader-level check accepts only `4` or `5`)

#### Scenario: unknown error tag rejected

- GIVEN a challenge with `commonErrorTags: ["u1_tag_inexistente"]`
- WHEN the traceability audit runs
- THEN the audit reports the challenge ID and the unknown tag

#### Scenario: non-Spanish fragment rejected

- GIVEN a challenge whose `pedagogicalIntent` contains a non-Spanish fragment
- WHEN the PR review runs
- THEN the challenge is rejected

## ADDED Requirements

### Requirement: U3 Alignment Policy Audit (Scoped, Non-Loader)

A scoped U3 alignment audit MUST enforce, for the nine U3 alignment skill IDs (`ecuaciones_lineales`, `ecuaciones_cuadraticas`, `ecuaciones_valor_absoluto`, `inecuaciones_valor_absoluto`, `inecuaciones_producto_cociente`, `recta`, `sistemas`, `exponenciales`, `logaritmicas`), that each has EXACTLY one new challenge with `difficulty === 5` and `type === multiple-choice`. The audit MUST NOT enforce this on other skills. `traduccion_lenguaje_verbal` diff 4 (`desafio-02`) and diff 5 (`desafio-01`) are preserved and MUST NOT be rejected by the audit.

#### Scenario: U3 alignment audit accepts nine diff-5 challenges

- GIVEN the nine U3 alignment skill IDs each have exactly one diff-5 MC challenge
- WHEN the scoped U3 alignment audit runs
- THEN it returns no violations

#### Scenario: existing translation desafio-02 still loads

- GIVEN `traduccion_lenguaje_verbal.desafio-02` at `difficulty: 4`
- WHEN the challenge loader parses the file
- THEN the loader returns the challenge
- AND the scoped U3 alignment audit does NOT touch this challenge

### Requirement: Free-Form Input Type Prohibition

No new challenge MAY use `text` or any other free-form input type. The student MUST NOT type structured-math answers in a free-form input field. MC option values MAY encode intervals, unions, radicals, or `log/ln` expressions as text (those are valid structured representations and MUST NOT be rejected).

#### Scenario: prohibited input type rejected

- GIVEN a candidate challenge with `type: "text"`
- WHEN the challenge loader parses the file
- THEN the loader throws

#### Scenario: MC option values with structured math pass

- GIVEN a multiple-choice challenge whose options include text-encoded intervals, unions, radicals, or `log/ln`
- WHEN the loader parses the file
- THEN the loader accepts it

### Requirement: Challenge Compatibility Baselines (Desafios)

Pre-change challenge fixtures that MUST remain valid post-change: `mat.u3.traduccion_lenguaje_verbal.desafio-01` (diff 5, owned by `fortalecer-u3`); `mat.u3.traduccion_lenguaje_verbal.desafio-02` (diff 4, owned by `fortalecer-u3`). A compatibility test suite compares post-change behavior against these fixtures.

#### Scenario: desafio-02 still loads post-change

- GIVEN the pre-change fixture `desafio-02` at diff 4
- WHEN the catalog is reloaded after this change
- THEN `loadChallengesForSkill("mat.u3.traduccion_lenguaje_verbal")` returns 2 entries
- AND `desafio-02` retains `difficulty: 4`
- AND `desafio-01` retains `difficulty: 5`

---

## Domain: math-error-taxonomy (DELTA)

> Adds U3 tags + removes legacy u2_*

# Delta for math-error-taxonomy

## ADDED Requirements

### Requirement: U3 New Symbolic Error Tags

The taxonomy MUST add the following `u3_*` error tags with feedback mappings in `feedback/unit-3.json` and detection patterns in `error-tagging.ts`:

| Tag ID | Misconception |
|--------|---------------|
| `u3_abs_eq_signo_negativo` | Treats `−|x|` as automatically <= 0 and concludes no solution |
| `u3_abs_eq_doble_solucion_omitida` | Returns only one root for `|ax+b|=k>0` |
| `u3_discriminante_signo_incorrecto` | Mis-evaluates `b² − 4ac` sign for parameter-k quadratic classification |
| `u3_recta_pendiente_perpendicular` | Uses reciprocal slope instead of negative reciprocal for perpendicular |
| `u3_sistemas_clasificacion_incorrecta` | Mis-classifies a system as SPD/SCI/SI from coefficients or graph |
| `u3_signchart_factor_signo_incorrecto` | Drops or sign-flips a critical factor when building the sign chart |
| `u3_signchart_critical_root_omitido` | Omits a critical root (e.g. forgets factor `x` root at 0 in P9p) |
| `u3_signchart_dominio_denominador` | Includes a denominator-zero value in the solution set |
| `u3_log_dominio_olvidado` | Solves a log equation without checking domain (`x < 0` for `log₂(−x)`, `x < 1` for P40m) |
| `u3_exp_factor_comun_signo` | Sign error when factoring `5^{x−1}` from `5^{x+2} − 105·5^{x−1}` |
| `u3_aislamiento_incorrecto` | Isolates variable incorrectly across multiple terms |
| `u3_signo_desigualdad` | Flips inequality sign incorrectly when multiplying/dividing by negative |

#### Scenario: tags pass validation

- GIVEN each new `u3_*` tag
- WHEN validated against the ErrorTag schema
- THEN validation succeeds with normalized tag

#### Scenario: feedback coverage complete

- GIVEN feedback library for unit-3
- WHEN each new `u3_*` tag is looked up
- THEN a non-empty `FeedbackMapping` is returned

### Requirement: Legacy `u2_*` Tag Removal

`ex.u3.ecuaciones_lineales.1` MUST NOT carry `u2_aislamiento_variable` or `u2_signo_al_mover`. The unit-prefix debt is corrected: those legacy tags are removed from this exercise and replaced by the new `u3_aislamiento_incorrecto` / `u3_signo_desigualdad` family where applicable.

#### Scenario: ex.u3.ecuaciones_lineales.1 carries u3 tags only

- GIVEN `ex.u3.ecuaciones_lineales.1` in the catalog
- WHEN its `commonErrorTags` are read
- THEN no tag starts with `u2_`
- AND `u3_aislamiento_incorrecto` and/or `u3_signo_desigualdad` appear in the list

### Requirement: No New Modeling-Chain Tags

This change MUST NOT introduce new tags under the `u3_traduccion_*` / `u3_verificacion_*` / `u3_interpretacion_*` namespace. Those tags are owned by the `fortalecer-u3-lenguaje-modelizacion-transferencia` companion change.

#### Scenario: modeling tags untouched

- GIVEN the taxonomy after this change
- WHEN tags are filtered by namespace
- THEN `u3_traduccion_*`, `u3_verificacion_*`, `u3_interpretacion_*` tag set is unchanged

---

