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