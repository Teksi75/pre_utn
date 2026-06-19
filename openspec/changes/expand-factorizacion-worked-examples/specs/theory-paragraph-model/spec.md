# Delta for Theory Paragraph Model

## ADDED Requirements

### Requirement: Complete Progressive Factorization Coverage

The system SHALL provide exactly nine worked examples for `mat.u2.factorizacion`. Together they MUST cover canonical Cases 1–7 in that conceptual order: common factor, grouping, perfect-square trinomial, perfect-cube polynomial, difference of squares, equal-degree powers, and quadratic trinomial. Multiple examples of one case MAY be adjacent, but MUST NOT interrupt the Case 1→7 progression.

#### Scenario: all cases appear progressively

- GIVEN the ordered factorization collection
- WHEN each example is classified by its canonical case
- THEN all seven cases are represented
- AND the case numbers are nondecreasing from 1 through 7

### Requirement: Stable Identity and Pedagogical Completeness

Existing IDs `example-factorizacion-1` through `example-factorizacion-5` MUST retain their identity; new examples SHALL use distinct IDs. Every example MUST pass `validateWorkedExample`, identify its canonical case, contain ordered transformations, expose the fully factored expression as `finalAnswer`, repeat that result in its final step, verify it by expansion, include canonical traceability, and provide a focused error note.

#### Scenario: collection satisfies semantic invariants

- GIVEN the nine factorization examples
- WHEN their identities and validated fields are inspected
- THEN IDs 1–5 remain present exactly once and every ID is unique
- AND every example satisfies the result, check, traceability, and error-note contract

#### Scenario: incomplete example is rejected

- GIVEN a factorization example without an expansion check or explicit final result
- WHEN the collection invariants are evaluated
- THEN the example fails acceptance

### Requirement: Shared Ordered Consumption

Learn and Practice MUST consume the same ordered factorization collection from the canonical example source. The change MUST NOT duplicate or independently reorder content between those surfaces.

#### Scenario: both surfaces expose the same sequence

- GIVEN the canonical factorization collection
- WHEN Learn renders its examples and Practice traverses its worked-example phase
- THEN both expose the same nine IDs in the same order

### Requirement: Unclipped Responsive Disclosure

Collection and solution disclosures MUST expand to their full content without fixed-height ceilings. At desktop and 375px viewport widths, all nine cards and every expanded solution MUST remain reachable and legible without horizontal page overflow.

#### Scenario: complete collection is visible

- GIVEN the nine-example collection is disclosed at desktop width
- WHEN all solutions are expanded
- THEN no card, step, final result, or note is vertically clipped

#### Scenario: mobile disclosure remains legible

- GIVEN a 375px-wide viewport
- WHEN the collection and each solution are disclosed
- THEN all content remains reachable and legible
- AND the page has no horizontal overflow

### Requirement: Pedagogical Utility

The progression SHALL help the alumno recognize, apply, and check every canonical factorization case; the explicit case and error metadata SHALL help the docente interpret misconceptions without changing exercises, evaluators, mastery, or recommendation behavior.

#### Scenario: learning and interpretation signals coexist

- GIVEN any example in the collection
- WHEN its pedagogical content is inspected
- THEN it supports student self-correction and exposes a case-specific misconception signal

## MODIFIED Requirements

### Requirement: Three Worked Examples for Caso 6

Within the nine-example collection, the system SHALL preserve exactly 3 worked examples with IDs `example-factorizacion-3`, `example-factorizacion-4`, and `example-factorizacion-5`, each with `skillId: "mat.u2.factorizacion"` and each passing `validateWorkedExample` (≥2 ordered steps, canonicalTrace, pedagogicalNote).

(Previously: the requirement specified the three Caso 6 examples without placing them inside a nine-example, seven-case collection.)

#### Scenario: count and shape

- GIVEN the examples file
- WHEN filtered for `example-factorizacion-{3,4,5}`
- THEN 3 examples exist
- AND each passes `validateWorkedExample`
