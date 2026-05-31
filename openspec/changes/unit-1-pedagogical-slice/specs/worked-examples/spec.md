# Worked Examples Specification

## Purpose

Defines step-by-step worked examples for the Unit 1 pedagogical slice.

## Requirements

### Requirement: Worked Example Coverage

The system SHALL provide at least two worked examples for each pilot skill: `mat.u1.reales_operaciones` and `mat.u1.intervalos`. Each example MUST include a problem, ordered solution steps, final answer, pedagogical note, and common-error cue where applicable.

#### Scenario: examples load for a skill

- GIVEN a pilot skill has two worked examples
- WHEN examples are requested for that skill
- THEN they are returned in deterministic order
- AND every example has at least two solution steps

#### Scenario: shallow example is rejected

- GIVEN an example has only a final answer
- WHEN examples are validated
- THEN validation fails because worked reasoning is missing

### Requirement: Pedagogically Justified Source Use

Worked examples MUST be teaching artifacts with explicit learning intent. They MAY reuse canonical statements or solution patterns when repetition reinforces a concept; otherwise they SHOULD vary the source pattern to give the learner additional practice value.

#### Scenario: transformed example is accepted

- GIVEN an example teaches endpoint inclusion with new values and wording
- WHEN content is reviewed
- THEN it is eligible for inclusion

#### Scenario: repeated solution is justified

- GIVEN an example matches canonical wording or step text verbatim
- WHEN content is reviewed
- THEN it is eligible when the example documents the reinforcement purpose

### Requirement: Pre-University Worked Example Tone

Worked examples MUST be appropriate for UTN entrance aspirants: rigorous tone, mathematical notation, non-childlike phrasing, and enough reasoning to justify each transformation.

#### Scenario: rigorous example is accepted

- GIVEN an example uses notation such as intervals, inequalities, or operation properties
- WHEN content is reviewed
- THEN each step explains the mathematical reason without infantilizing language

#### Scenario: childish example is rejected

- GIVEN an example uses playful or primary-school phrasing without sufficient reasoning
- WHEN examples are validated or reviewed
- THEN the example is not eligible for the pilot slice
