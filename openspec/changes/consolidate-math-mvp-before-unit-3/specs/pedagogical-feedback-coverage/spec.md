# Delta for pedagogical-feedback-coverage

## ADDED Requirements

### Requirement: Metadata Traceability for Theory and Example Links

Every exercise that references theory content, worked examples, or pedagogical notes MUST have traceable metadata linking to the source. Exercises MUST NOT reference theory/example content without a verifiable link.

#### Scenario: exercise with theory reference has metadata

- GIVEN an exercise that references a theory section or worked example
- WHEN its metadata is inspected
- THEN a traceable link to the source content exists (e.g., chapter, page, or content ID)

#### Scenario: exercise without theory reference passes

- GIVEN an exercise that does not reference theory content
- WHEN metadata traceability is validated
- THEN the exercise passes without requiring theory links

### Requirement: Feedback Backfill for Existing Content

Existing exercises that already depend on feedback or theory links MUST have their metadata backfilled where missing. The system MUST report exercises with incomplete traceability.

#### Scenario: existing exercise with missing metadata is flagged

- GIVEN an existing exercise that references theory content but lacks traceable metadata
- WHEN the traceability audit runs
- THEN the exercise is flagged with its ID and the missing metadata type
