# Diagnostic Shell Specification

## Purpose

Defines a short mathematics-only diagnostic that estimates weak skills and points the student to practice.

## Requirements

### Requirement: Balanced Diagnostic Selection

The system SHALL select a short diagnostic set balanced across mathematics skills and units. Selection MUST be deterministic for the same catalog and request.

#### Scenario: diagnostic covers multiple units

- GIVEN enough eligible exercises across units
- WHEN a diagnostic set is requested
- THEN it includes exercises from multiple units without over-selecting one unit

#### Scenario: insufficient catalog is reported

- GIVEN too few eligible exercises for balanced selection
- WHEN a diagnostic set is requested
- THEN the system reports the missing coverage instead of producing a biased set

### Requirement: Accuracy-Based Skill Estimation

The system SHALL estimate skill strength from diagnostic attempts using accuracy per practiced skill. The estimate SHOULD be marked provisional.

#### Scenario: weaker skill is identified

- GIVEN attempts for two skills where one has lower accuracy
- WHEN diagnostic results are calculated
- THEN the lower-accuracy skill is ranked as weaker

### Requirement: Weak-Area Suggestions

The system SHALL suggest guided-practice targets for the weakest skills and include any observed error tags.

#### Scenario: suggestions link diagnosis to practice

- GIVEN diagnostic results identify two weak skills
- WHEN suggestions are shown
- THEN the student receives practice targets for those skills with tagged misconceptions when available

### Requirement: Diagnostic Answer Type Reliability

Exercises selected for diagnostic assessment MUST use answer types that produce reliable skill evidence. An exercise whose expected answer is ambiguous under free-text matching (multi-value sets, variable assignments, order-dependent notation) MUST NOT be included in the diagnostic set unless it has been converted to `multiple-choice` or a structured type with a deterministic evaluator.

#### Scenario: diagnostic excludes ambiguous free-text exercises

- GIVEN an exercise with type `numerical` and expected answer `x = -2, x = 2`
- WHEN the diagnostic selection algorithm considers it
- THEN the exercise is excluded from the diagnostic set

#### Scenario: diagnostic includes only reliably-evaluable exercises

- GIVEN the catalog after type-answer corrections
- WHEN a diagnostic set is requested
- THEN every exercise in the set has a type whose evaluator can deterministically judge correctness

### Requirement: Diagnostic Evidence Integrity

The diagnostic MUST NOT produce skill estimates based on answers that were marked incorrect due to evaluator configuration errors or type-answer mismatches. If an exercise cannot be reliably evaluated, it MUST be excluded rather than counted as an incorrect attempt.

#### Scenario: configuration error does not corrupt skill estimate

- GIVEN an exercise that triggers an evaluator configuration error
- WHEN diagnostic results are calculated
- THEN that exercise is excluded from accuracy calculations and the skill estimate is based only on reliably-evaluated attempts
