# Delta for math-exercise-catalog

## MODIFIED Requirements

### Requirement: Pedagogically Valuable Content

Catalog content MUST provide pedagogical value beyond mechanical duplication. It MAY reuse canonical material directly when repetition is intentionally used to reinforce a concept; otherwise it SHOULD vary values, wording, representation, or context while preserving the target skill.

Exercises within the same skill MUST NOT have identical prompts or prompts that differ only by trivial wording (e.g., adding "el número" prefix). When two exercises assess the same concept from different angles (e.g., direct classification vs. true/false misconception), each MUST have a distinct pedagogical justification documented in its `pedagogicalNote`.

#### Scenario: transformed pattern is accepted

- GIVEN an exercise changes values, wording, and context while assessing the same skill
- WHEN the catalog is reviewed
- THEN the exercise is eligible for inclusion

#### Scenario: intentional repetition is accepted

- GIVEN an exercise prompt matches canonical UTN material
- WHEN the catalog is reviewed
- THEN it is eligible when metadata explains the reinforcement purpose

#### Scenario: exact duplicate within same skill is rejected

- GIVEN two exercises in the same skill have prompts that are identical or differ only by trivial wording
- WHEN the catalog is validated
- THEN the duplicate MUST be replaced with a genuinely different exercise or removed
