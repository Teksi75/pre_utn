# Delta for practice-coverage

## ADDED Requirements

### Requirement: Practice Bank Size for `mat.u3.exponenciales`

The system MUST expose, after the change, a bank of 15–19
exercises (target 17, parity with the canonical P39 count of 17
in `03_ej_utn.pdf`) for the skill `mat.u3.exponenciales`,
accessible through the existing loader APIs (`queryBySkill`,
`loadExercisesForSkill`, `loadSkillBank`) without introducing
new API surface.

#### Scenario: bank meets the acceptance band

- GIVEN the catalog is loaded after the change
- WHEN the bank for `mat.u3.exponenciales` is enumerated via
  `queryBySkill` (or the existing `loadExercisesForSkill` /
  `loadSkillBank` helpers)
- THEN the count is `>= 15 AND <= 19`, target 17

#### Scenario: bank stays within the published readiness floor

- GIVEN the current `isSkillReady` rule (exercises present when
  the skill has `>= 4` exercises, theory, examples, feedback,
  and evaluation)
- WHEN the bank is enumerated after the change
- THEN that floor is still satisfied, and the bank count
  additionally lies in the 15–19 acceptance band

### Requirement: U3 Exponenciales Unit-Threshold Non-Regression

Expanding `mat.u3.exponenciales` MUST NOT push the U3 unit below
its declared `UNIT_THRESHOLDS["unit-3"] = 24` floor. The
per-skill bank growth is observable through the existing
`loadExercisesForSkill`, `loadSkillBank`, and `queryBySkill`
APIs; no new loader surface is introduced.

#### Scenario: U3 unit still satisfies its threshold

- GIVEN the loaded catalog after the change
- WHEN the U3 threshold check runs
- THEN the U3 total is `>= 24`

#### Scenario: existing loader APIs continue to serve the bank

- GIVEN `queryBySkill`, `loadExercisesForSkill`, and
  `loadSkillBank`
- WHEN each is invoked with `mat.u3.exponenciales` after the
  change
- THEN each returns the appended entries without code changes
  beyond the `unit-3.json` source

### Requirement: Per-Skill Difficulty Range Coverage

For `mat.u3.exponenciales`, every difficulty in `{1, 2, 3, 4}`
MUST be represented by at least one entry, and difficulty `5`
MUST be represented by at least two entries. This is observable
through the same existing loader APIs as the bank-size rule; no
new readiness algorithm or threshold is introduced.

#### Scenario: low-to-mid difficulties are populated

- GIVEN the bank is filtered by difficulty
- WHEN counts at d = 1, 2, 3, 4 are read
- THEN each count is `>= 1`

#### Scenario: difficulty 5 has at least two entries

- GIVEN the bank is filtered by `difficulty === 5`
- WHEN the count is read
- THEN the count is `>= 2`

## MODIFIED Requirements

*None.*

## REMOVED Requirements

*None.*

## RENAMED Requirements

*None.*
