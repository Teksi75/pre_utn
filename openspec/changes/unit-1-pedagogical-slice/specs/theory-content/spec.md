# Theory Content Specification

## Purpose

Defines mathematics theory nodes for the Unit 1 pilot skills, grounded in canonical material and adapted when pedagogically useful.

## Requirements

### Requirement: Theory Node Coverage

The system SHALL provide one validated theory node for `mat.u1.reales_operaciones` and one for `mat.u1.intervalos`. Each node MUST include concept explanations, notation, common mistakes, practice prompts, and canonical source notes.

#### Scenario: pilot theory loads

- GIVEN the Unit 1 pilot content exists
- WHEN theory content is loaded
- THEN both pilot skills have valid theory nodes
- AND each node references canonical coverage with clear pedagogical intent

#### Scenario: incomplete theory is rejected

- GIVEN a pilot skill lacks concepts, common mistakes, or source notes
- WHEN content is validated
- THEN validation fails naming the missing theory field

### Requirement: Sufficient Topic Theory

Theory content MUST be sufficient for a student to attempt guided practice for the skill; it MAY be longer than a short summary when the topic requires definitions, notation, and examples.

#### Scenario: interval notation is teachable

- GIVEN the `intervalos` theory node
- WHEN a student reads it before practice
- THEN it explains finite/infinite intervals, endpoint inclusion, and notation-to-graph translation

#### Scenario: real operations are teachable

- GIVEN the `reales_operaciones` theory node
- WHEN a student reads it before practice
- THEN it explains real-number subsets, operation properties, and order-of-operations risks

### Requirement: Theory Learning Entry Point

Pilot theory MUST be accessible as a learning mode before practice, not only inside the guided practice sequence.

#### Scenario: student opens theory before practice

- GIVEN a pilot skill has validated theory content
- WHEN the student chooses the theory or learn entry point for that skill
- THEN the theory is shown without requiring an exercise attempt
- AND the student can continue to practice afterward
