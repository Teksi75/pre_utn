# Complex Numbers Skill Specification

## Purpose

Content and behavioral contract for making `mat.u1.complejos` traversable: theory → examples → practice → feedback → readiness. Closes Unit 1's number-set arc (N → Z → Q → R → C). Mirrors `valor-absoluto-skill` structure.

## Requirements

### Requirement: Skill Order and Prerequisites

`mat.u1.complejos` MUST appear in PILOT_SKILLS as the 8th entry, after `mat.u1.logaritmos`. Its prerequisite SHALL be `mat.u1.propiedades_operaciones_reales`. The active prerequisite graph for `mat.u1.complejos` MUST NOT include any downstream edge referencing a Unit 5 skill, and no active `SKILL_DEPENDENCIES` entry may list a `mat.u5.*` source as a downstream prerequisite.

#### Scenario: correct insertion order

- GIVEN PILOT_SKILLS array
- THEN `mat.u1.logaritmos` precedes `mat.u1.complejos`
- AND `mat.u1.complejos` is the last pilot entry

#### Scenario: no Unit 5 downstream edge references mat.u1.complejos

- GIVEN the active catalog after the U5-01 static retirement
- WHEN `SKILL_DEPENDENCIES` entries that list `mat.u1.complejos` as a prerequisite are enumerated
- THEN none of those entries is a Unit 5 skill
- AND the U1 prerequisite for `mat.u1.complejos` remains `mat.u1.propiedades_operaciones_reales`

### Requirement: Transitive Availability

The skill MUST be navigable in pilot learn/practice modes. Content loaders MUST return non-empty theory, examples, and exercises.

#### Scenario: pilot entry exists

- GIVEN PILOT_SKILLS is loaded
- THEN `mat.u1.complejos` has entry `{ skillId: "mat.u1.complejos", unitKey: "unit-1" }`

#### Scenario: content loads without error

- GIVEN student selects `mat.u1.complejos`
- WHEN theory and examples load
- THEN at least one TheoryNode and one WorkedExample exist

### Requirement: Theory Content

Theory MUST cover 8-10 concepts. MUST NOT cover polar form, trigonometric form, De Moivre, or Argand diagrams.

| # | Concept | Detail |
|---|---------|--------|
| 1 | Imaginary unit i | Definition: i^2 = -1 |
| 2 | Standard form a+bi | Real part a, imaginary part b |
| 3 | Real and imaginary parts | Identification of Re(z) and Im(z) |
| 4 | Equality of complex numbers | a+bi = c+di iff a=c and b=d |
| 5 | Addition and subtraction | Combine real parts and imaginary parts separately |
| 6 | Multiplication | Distributive law + i^2 = -1 substitution |
| 7 | Complex conjugate | Definition and properties |
| 8 | Division | Multiply numerator and denominator by conjugate |
| 9 | Powers of i | Cyclic pattern: i, -1, -i, 1 |

#### Scenario: theory covers all required concepts

- GIVEN theory node for `mat.u1.complejos`
- THEN all concepts above are present
- AND no concept references polar form or Unit 5 depth

### Requirement: Worked Examples

>= 5 worked examples MUST exist covering: basic operations (add/sub), multiplication, conjugate, division, and powers of i.

#### Scenario: example count and coverage

- GIVEN examples for `mat.u1.complejos`
- THEN count >= 5 with at least one multiplication and one division example

### Requirement: Exercise Content

10-14 graduated exercises MUST exist (difficulty 1-4). Permitted types: `multiple-choice`, `true-false`, `numerical` (real or imaginary part separately). Free-form `a+bi` text input is PROHIBITED.

| Constraint | Value |
|------------|-------|
| Total exercises | 10-14 |
| Allowed types | `multiple-choice`, `true-false`, `numerical` |
| Prohibited types | `symbolic`, `free-response`, structured `a+bi` text |
| MC options minimum | 3 |
| Numerical inputs | Real part OR imaginary part separately |
| Difficulty range | 1-4 inclusive |

#### Scenario: exercise constraints pass

- GIVEN exercises for `mat.u1.complejos`
- THEN count in [10, 14], all types allowed, no free-form complex expression input
- AND every MC expectedAnswer matches exactly one option

#### Scenario: numerical exercise asks one part at a time

- GIVEN a numerical exercise about a complex number result
- WHEN the exercise requires a numeric answer
- THEN it asks for the real part OR the imaginary part separately, not both in one field

### Requirement: Feedback and Error Taxonomy

6-8 error tags (`u1_complejo_*`) MUST have feedback entries in `feedback/unit-1.json`. Each exercise's `commonErrorTags` MUST reference only tags with feedback coverage.

#### Scenario: feedback coverage complete

- GIVEN feedback library for unit-1
- THEN all `u1_complejo_*` tags have non-empty FeedbackMapping
- AND no exercise references uncovered error tags

### Requirement: Readiness

`isSkillReady("mat.u1.complejos")` MUST return `{ ready: true, missing: [] }`.

#### Scenario: readiness check passes

- GIVEN theory, examples, exercises (>= 4), feedback, and evaluation exist
- WHEN `isSkillReady` is called for `mat.u1.complejos`
- THEN result is `ready: true` with zero missing components

### Requirement: Acceptance and Validation

`pnpm run test && pnpm run typecheck && pnpm run build` MUST pass. Existing catalog tests MUST NOT regress. Domain test file `complejos-domain.test.ts` MUST validate pilot order, prerequisites, readiness, content loading, exercise count, and error taxonomy coverage.

#### Scenario: CI validation passes

- GIVEN all content committed
- WHEN `pnpm run test && pnpm run typecheck && pnpm run build` executes
- THEN all exit code 0

#### Scenario: catalog-readiness assertions inverted

- GIVEN `catalog-readiness.test.ts`
- THEN assertions for `mat.u1.complejos` expect `ready: true`
- AND previous `ready: false` assertions are removed
