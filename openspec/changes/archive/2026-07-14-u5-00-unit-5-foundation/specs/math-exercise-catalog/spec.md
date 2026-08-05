# Delta for Math Exercise Catalog

## ADDED Requirements

### Requirement: Unit 5 Canonical Coverage

The catalog MUST admit every canonical Unit 5 practice item numbered 1 through 22, except item 22.b which is deliberately excluded. Item 22.a MUST be retained. The admitted set is the minimum preliminary scope and MUST NOT be reduced, even when exam-style content weights identities, equations, and complex arithmetic more heavily.

#### Scenario: coverage spans 1–22 minus 22.b

- GIVEN the loaded catalog
- WHEN Unit 5 admitted items are enumerated
- THEN they include 1–21 and 22.a and exclude 22.b

#### Scenario: exam weighting does not shrink practice

- GIVEN a proposal that drops canonical items 4, 17, and 19 to make room for more exam items
- WHEN the catalog audit runs
- THEN the audit fails because canonical breadth is reduced

### Requirement: Item Traceability Metadata

Each admitted Unit 5 catalog entry MUST carry traceability metadata: theory section/page, target normative skill, initial difficulty (1–5), target answer type (existing or structured variant), common errors to cover, and exam relation to `mat.exam.theme1`/`mat.exam.theme2` when applicable. The traceability matrix lives in the change bundle; the loader MUST validate against it.

#### Scenario: traceability fields present

- GIVEN an admitted Unit 5 catalog entry
- WHEN its traceability metadata is inspected
- THEN it has theory reference, skill, difficulty, answer type, common errors, and exam relation when applicable

### Requirement: Deliberate Errata Exclusion

Item 22.b (printed expression `2−2 + 2i`) is editorially malformed and MUST NOT appear in any admitted catalog entry, content file, evaluator fixture, or test fixture. The exclusion MUST be auditable via a named constant in the change bundle and MUST surface in catalog audit reports.

#### Scenario: 22.b absent from fixtures

- GIVEN the full catalog and all evaluator/test fixtures
- WHEN a search for `22.b` runs
- THEN it appears only inside the documented errata exclusion reference and nowhere else

### Requirement: Pedagogical Corrections in Traceability

For items that require a pedagogical correction, the traceability row MUST name the correction. At minimum: items 5, 6 (signs from quadrant, `sqrt(cos²)=|cos α|`), item 11 (complete solution set including axes and endpoints), items 15 and 20 (quadrant-safe `atan2`-equivalent argument), item 18 (modulus preservation through exponential form), and item 21 (De Moivre/n-th roots taught before the item).

#### Scenario: correction fields reference corrections

- GIVEN item 21 traceability
- WHEN its pedagogical corrections field is inspected
- THEN it references De Moivre and n-th complex roots as required prior knowledge

### Requirement: Subexercise Family Preservation

The traceability matrix MUST preserve subexercise families (1.a–1.d, 5.a–5.e, etc.) as admitted subitems. A later content spec MUST assign one or more app exercise IDs per admitted subitem. The matrix MUST NOT be collapsed into eleven exam-like questions.

#### Scenario: subitems survive

- GIVEN item 1 with subitems 1.a–1.d
- WHEN the catalog loads
- THEN each admitted subitem maps to at least one app exercise ID with the declared skill and answer type

### Requirement: Exam Relation as Priority Signal Only

`mat.exam.theme1` and `mat.exam.theme2` provide priority signals for sequencing but MUST NOT reduce canonical coverage or override the 22.b exclusion. Prompt text and worked reasoning inform item shaping; the highlighted answer sheet for Theme I item 8 MUST NOT be used as an answer oracle because it is internally inconsistent with the printed domain.

#### Scenario: Theme I item 8 is not an oracle

- GIVEN Theme I item 8 with prompt `0 ≤ x ≤ π/2` and an inconsistent highlighted answer sheet
- WHEN the catalog auditor runs
- THEN the audit cites the prompt and reasoning as evidence and ignores the highlight

### Requirement: Catalog Audit Extended to Structured

The existing catalog type-answer audit MUST also validate structured exercises: any exercise whose `answerSpec.kind` is in the supported set MUST have a payload shape compatible with that kind, and MUST declare its answer type consistently. The audit MUST be executable as an automated test.

#### Scenario: structured exercise fails audit on shape mismatch

- GIVEN a structured exercise whose `answerSpec.kind = "complex-number"` and whose payload is an angle-dms
- WHEN the catalog audit runs
- THEN the audit fails and reports the exercise ID and mismatch reason