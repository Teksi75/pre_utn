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