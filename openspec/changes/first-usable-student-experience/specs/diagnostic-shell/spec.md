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
