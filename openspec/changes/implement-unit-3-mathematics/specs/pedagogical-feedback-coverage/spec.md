# Delta for Pedagogical Feedback Coverage

## ADDED Requirements

### Requirement: Empty Tags Default for New Slices

For the first implementation of a new unit slice (U3 first implementation), exercises MUST default to `commonErrorTags: []` unless a corresponding `FeedbackMapping` exists in the slice's feedback file. New error tags MAY be added to the taxonomy without an immediate feedback entry, but exercises MUST NOT reference them until feedback is shipped.

#### Scenario: U3-FB-RULE-001 — Empty tags pass silently

- GIVEN a U3 exercise with `"commonErrorTags": []`
- WHEN the bank validator runs
- THEN no diagnostic references that exercise

#### Scenario: U3-FB-RULE-002 — Non-empty tag without feedback fails

- GIVEN a U3 exercise declaring `commonErrorTags: ["u3_signo_desigualdad"]`
- AND `content/matematica/feedback/unit-3.json` has no mapping for `u3_signo_desigualdad`
- WHEN the bank validator runs
- THEN a diagnostic names the exercise ID and the missing tag

#### Scenario: U3-FB-RULE-003 — Non-empty tag with matching feedback passes

- GIVEN a U3 exercise declaring `commonErrorTags: ["u3_signo_desigualdad"]`
- AND `feedback/unit-3.json` contains a mapping with `errorTag === "u3_signo_desigualdad"`
- WHEN the bank validator runs
- THEN no diagnostic references that exercise

### Requirement: U3 Feedback Mappings

The feedback library MUST include 8–12 `FeedbackMapping` entries in `content/matematica/feedback/unit-3.json` covering at least the 8 U3 skills (one per skill minimum). Each mapping MUST follow the corrective/conceptual/procedural pattern.

#### Scenario: U3-FB-004 — File loads

- GIVEN `loadFeedbackContent("unit-3")`
- WHEN called
- THEN it returns an array of `>= 8` non-empty `FeedbackMapping` objects

#### Scenario: U3-FB-005 — One mapping per U3 skill

- GIVEN the loaded U3 feedback
- WHEN grouped by `recoveryTarget` or message intent
- THEN each of the 8 U3 skill IDs is covered by at least one mapping

## MODIFIED Requirements

### Requirement: Feedback Required for Every Exercise

Every exercise in the practice bank MUST have a corresponding feedback entry in the feedback library.

(Previously: this requirement applied to all U1/U2 exercises. For U3 first implementation, empty `commonErrorTags` satisfies the requirement, so no per-exercise feedback entry is required when no error tag is declared.)

#### Scenario: exercise has feedback entry

- GIVEN an exercise ID in the bank
- WHEN the feedback library is queried for that exercise
- THEN a feedback entry exists and is non-empty

#### Scenario: exercise missing feedback entry

- GIVEN an exercise exists in the bank with no corresponding feedback entry
- WHEN the bank is validated
- THEN a missing-feedback error names the exercise ID

## REMOVED Requirements

*None.*

## RENAMED Requirements

*None.*