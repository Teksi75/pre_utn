# Delta for Theory Paragraph Model

## Purpose

Issue #42 (Teksi75/pre_utn#42) requires `concept-fac-potencias-igual-grado` to bridge divisibility rules and procedure (non-monic root, second-factor construction, two methods). This delta layers Caso 6 content, worked examples, and a feedback mapping on the existing `bodyParagraphs` model without changing parser or renderer behavior.

## ADDED Requirements

### Requirement: Caso 6 Concept Has 5-6 Paragraphs

The system SHALL provide 5-6 `bodyParagraphs` for `concept-fac-potencias-igual-grado`, each a single pedagogical step.

#### Scenario: paragraph count

- GIVEN the concept
- WHEN `bodyParagraphs.length` is read
- THEN the value is 5 or 6.

### Requirement: Divisibility Table Paragraph

The system SHALL include a paragraph with the 4-row rule: `a^n−b^n` por `a−b` siempre; `a^n−b^n` por `a+b` si n par; `a^n+b^n` por `a+b` si n impar; `a^n+b^n` por `a−b` nunca.

#### Scenario: table present

- GIVEN the bodyParagraphs
- WHEN read
- THEN at least one paragraph contains the four divisibility cases with parity conditions.

### Requirement: First-Factor Selection Paragraph

The system SHALL include a paragraph that walks through factor selection for `8x^3 + 27 = (2x)^3 + 3^3` (suma de cubos) → first factor `2x + 3`.

#### Scenario: factor selection walked

- GIVEN the bodyParagraphs
- WHEN read
- THEN at least one paragraph recognizes `8x^3 + 27` as suma de cubos and identifies `2x + 3` as first factor.

### Requirement: Non-Monic Root Derivation Paragraph

The system SHALL include a paragraph deriving the Ruffini number from a non-monic divisor: `2x + 3 = 0 ⇒ x = -3/2`.

#### Scenario: non-monic derivation present

- GIVEN the bodyParagraphs
- WHEN read
- THEN at least one paragraph contains `2x + 3 = 0 ⇒ x = -3/2` (or equivalent) and states the Ruffini number.

### Requirement: No "Fórmula Conocida" as Sole Justification

The system SHALL NOT use "fórmula conocida" as the only justification for the second factor.

#### Scenario: forbidden sole-justification absent

- GIVEN the bodyParagraphs
- WHEN scanned
- THEN no paragraph relies on "fórmula conocida" alone to derive the second factor.

### Requirement: Second-Factor Construction via Ruffini

The system SHALL include a paragraph showing the second factor built from the Ruffini table on `8x^3 + 27` and reconciled with the non-monic divisor.

#### Scenario: reconciliation present

- GIVEN the bodyParagraphs
- WHEN read
- THEN at least one paragraph shows cociente `4x^2 − 6x + 9` and reconciles with `2x + 3`.

### Requirement: Disminución de Exponentes Method

The system SHALL include a paragraph applying `a^3 + b^3 = (a + b)(a^2 − ab + b^2)` directly on the same example, without division.

#### Scenario: direct method present

- GIVEN the bodyParagraphs
- WHEN read
- THEN at least one paragraph applies the formula with `a = 2x`, `b = 3` and does not run Ruffini.

### Requirement: Method Comparison

The system SHALL include a paragraph contrasting Ruffini (divide) with disminución de exponentes (construct cociente directly).

#### Scenario: comparison one-liner present

- GIVEN the bodyParagraphs
- WHEN read
- THEN at least one paragraph states both methods reach the same factorization.

### Requirement: Three Worked Examples for Caso 6

The system SHALL include 3 worked examples with `skillId: "mat.u2.factorizacion"`, each passing `validateWorkedExample` (≥2 steps ordered, canonicalTrace, pedagogicalNote).

#### Scenario: count and shape

- GIVEN the examples file
- WHEN filtered for `example-factorizacion-{3,4,5}`
- THEN 3 examples exist
- AND each passes `validateWorkedExample`.

### Requirement: Example 3 Is Ruffini Walk for 8x^3 + 27

`example-factorizacion-3` SHALL factor `8x^3 + 27` with divisor `2x + 3`; its first step SHALL identify the divisor and resolve `2x + 3 = 0` before the table.

#### Scenario: example 3 covers non-monic Ruffini

- GIVEN `example-factorizacion-3`
- WHEN read
- THEN step 1 identifies `2x + 3`, derives `x = -3/2`
- AND a full Ruffini table is present.

### Requirement: Example 4 Is Disminución for 8x^3 + 27

`example-factorizacion-4` SHALL factor `8x^3 + 27` via `a^3 + b^3 = (a + b)(a^2 − ab + b^2)` with `a = 2x`, `b = 3`.

#### Scenario: example 4 uses direct formula

- GIVEN `example-factorizacion-4`
- WHEN read
- THEN it identifies `a = 2x`, `b = 3` and applies the formula without division.

### Requirement: Example 5 Is Diferencia Branch for x^4 − 16

`example-factorizacion-5` SHALL factor `x^4 − 16` (exponente ≥ 4, resta) by disminución de exponentes.

#### Scenario: example 5 covers diferencia

- GIVEN `example-factorizacion-5`
- WHEN read
- THEN the expression is `x^4 − 16`
- AND the method is disminución de exponentes.

### Requirement: Feedback Mapping Reuses u2_ruffini_signo_a

The system SHALL provide a feedback mapping keyed to "left number from non-monic divisor" that reuses `u2_ruffini_signo_a`. No new error tag SHALL be created; specific copy SHALL live in the mapping's `pedagogicalNote`, not a new tag.

#### Scenario: existing tag reused, no new tag

- GIVEN the feedback library and error taxonomy
- WHEN read
- THEN the mapping's `errorTag` is `u2_ruffini_signo_a`
- AND no `u2_ruffini_raiz_no_monica` entry exists in the taxonomy.

### Requirement: Feedback Mentions Divisor = 0 Step

The mapping's `message` or `pedagogicalNote` SHALL explicitly mention: "primero identificá el divisor, después resolvés divisor = 0 para obtener la raíz de Ruffini".

#### Scenario: explicit step phrasing present

- GIVEN the feedback entry
- WHEN its `message` (or `pedagogicalNote`) is read
- THEN it contains the divisor = 0 step phrasing.

### Requirement: Ingenium Voice — No Forbidden Strings

The new content SHALL NOT contain any of: "profe digital", "tu profesor", "plan personalizado", "te marco qué practicar", "vamos a armar un plan a tu medida".

#### Scenario: forbidden strings absent

- GIVEN the modified content files
- WHEN grepped for each forbidden string
- THEN zero matches are returned.

### Requirement: Ingenium Voice — Neutral to Use Context

The new content SHALL NOT assume the alumno is supervised by a teacher, nor deny it.

#### Scenario: no supervision assumption

- GIVEN the new copy
- WHEN read
- THEN no paragraph claims a teacher is watching
- AND no paragraph denies teacher presence.

### Requirement: No New Base Exercises for Caso 6

The system SHALL NOT add base exercises to `exercises/unit-2.json` for Caso 6. The 4-exercise contract for `mat.u2.factorizacion` SHALL remain unchanged.

#### Scenario: contract preserved

- GIVEN `exercises/unit-2.json` and the catalog spec
- WHEN filtered by `skillId === "mat.u2.factorizacion"` and category `base`
- THEN the count remains 4
- AND the catalog spec is unmodified.

### Requirement: No New Challenge Exercise for Caso 6

The system SHALL NOT add a challenge exercise for Caso 6 in `challenges/unit-2.json` for this change.

#### Scenario: challenge count unchanged

- GIVEN `challenges/unit-2.json`
- WHEN filtered for Caso 6 challenges
- THEN no new challenge is added.

### Requirement: Feedback Ready for Future Practice Activation

The mapping SHALL resolve automatically when a future exercise references `commonErrorTags: ["u2_ruffini_signo_a"]`, without model changes.

#### Scenario: tag resolves to mapping

- GIVEN a future exercise with `commonErrorTags: ["u2_ruffini_signo_a"]`
- WHEN the feedback library is queried
- THEN the issue-42 mapping is returned.
