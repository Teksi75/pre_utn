# Math Skill Model Specification

## Purpose

Defines the mathematics skill model used to organize practice by unit, prerequisites, and pedagogical intent.

## Requirements

### Requirement: Skill Identity and Metadata

The system SHALL define a Skill with stable identity, unit, display name, description, prerequisites, and pedagogical tags. Skill IDs MUST follow `mat.u{1-6}.{slug}`.

#### Scenario: valid skill is accepted

- GIVEN a skill with ID `mat.u1.numeros_reales`, unit 1, metadata, empty prerequisites, and tags
- WHEN the skill is validated
- THEN validation succeeds with the normalized skill

#### Scenario: invalid identity is rejected

- GIVEN a skill with ID `math-1` or unit 7
- WHEN the skill is validated
- THEN validation fails with an identity or unit error

### Requirement: Prerequisite Integrity

The system MUST reject unknown prerequisite IDs and circular prerequisite chains.

#### Scenario: known prerequisites are accepted

- GIVEN skill B lists skill A as prerequisite
- WHEN both skills exist and no cycle is present
- THEN catalog validation succeeds

#### Scenario: invalid prerequisites are rejected

- GIVEN a skill references a missing prerequisite or creates a cycle
- WHEN the skill catalog is validated
- THEN validation fails with the affected skill IDs

### Requirement: Pedagogical Usefulness

Each skill SHALL identify what the student practices and what a teacher can interpret from performance on that skill.

#### Scenario: skill supports learning interpretation

- GIVEN a validated skill
- WHEN its metadata is inspected
- THEN it exposes learner-facing purpose and teacher-facing interpretation tags
