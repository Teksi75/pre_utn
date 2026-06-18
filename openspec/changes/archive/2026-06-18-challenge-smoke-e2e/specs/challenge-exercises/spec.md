# Delta Spec: challenge-smoke-e2e

**Change**: challenge-smoke-e2e
**Domain**: challenge-exercises
**Type**: Delta (ADDED Requirements only)
**File**: openspec/changes/challenge-smoke-e2e/specs/challenge-exercises/spec.md
**Size**: ~363 word body, 464 total file words (under 650 budget)

## Target Spec

This delta adds 1 new requirement to `openspec/specs/challenge-exercises/spec.md`. No existing requirements are modified or removed. On archive, the new requirement is appended to the target spec; the total target spec grows from 5 to 6 requirements.

## ADDED Requirements

### Requirement: Post-Deploy Smoke Coverage

A browser-driven smoke suite MUST validate the challenge flow end-to-end against the deployed bundle. The suite MUST cover, for every pilot skill that has challenges: the challenge opt-in is presented after the base practice completes, exactly 2 challenge exercises are available, the user can navigate from the opt-in to the first challenge, the user can skip the challenges, accepting and completing the challenges produces a non-null readiness score, completing challenges does not modify the base practice state, and failing all challenges does not change the base mastery for the skill. The suite MUST drive the practice flow through the real UI to reach the opt-in (no shortcut that bypasses the practice flow phases). Pedagogical intent: the suite confirms the deployed bundle delivers the challenge flow to students as the teacher designed, so the teacher can trust the post-deploy state for student support.

#### Scenario: smoke happy path reaches opt-in and lists 2 challenges

- GIVEN a pilot skill that has challenges has finished its base practice
- WHEN the practice flow is complete for that skill
- THEN the challenge opt-in is presented with the message that 2 challenge exercises are available and the user can open the first challenge

#### Scenario: skipping challenges closes the opt-in without persisting attempts

- GIVEN the challenge opt-in is presented
- WHEN the user chooses to skip the challenges
- THEN the opt-in closes and no challenge attempt for the current skill is recorded in the advanced practice state

#### Scenario: accepting and completing challenges produces a non-null readiness score

- GIVEN the user has accepted the challenges and answered both
- WHEN the challenge flow is complete
- THEN a readiness score for the skill is displayed as a non-null percentage between 0 and 100

#### Scenario: advanced practice state is independent from base practice state

- GIVEN the user has a populated base practice state (`pre-utn.practice.v1`) for a pilot skill
- WHEN the user completes challenge attempts for that same skill
- THEN the base practice state for the user is unchanged from before the challenge attempts

#### Scenario: failing challenges does not change base mastery

- GIVEN the user has a known base mastery level for a pilot skill
- WHEN the user fails every challenge attempt for that skill
- THEN the base mastery level for that skill is unchanged from the value before the challenges
