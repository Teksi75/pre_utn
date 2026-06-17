# Delta for guided-practice

## ADDED Requirements

### Requirement: Challenge Extension Point at complete Phase

The Practice page MAY render `<ChallengeOptInBlock />` (from the
`src/components/practice/challenges/` module) as a sibling of `PracticeCompletePhase`
when the current `complete` phase is reached AND the selected skill has at least
one challenge exercise in the challenges catalog.

This is the **only** coupling point between the base guided-practice flow and the
challenge module. The base `PracticePhase` union, the `nextPhase` machine, the
`usePracticeFlow` hook internals, and the base `src/lib/practice-progress.ts`
store MUST remain unchanged. The challenge flow is a separate optional mini-flow
that runs alongside the complete phase visually and returns control to the base
flow through a typed callback (which the page wires to `resetToSelect`).

The base flow MUST NOT use challenges for any of the following:
- Skill completion (a skill is completed when standard exercises are done).
- Base accuracy or `accuracyBySkill`.
- Base mastery level (`computeMasteryLevel`).
- Prerequisite gating or skill accessibility.

#### Scenario: complete phase with challenges shows the opt-in block

- GIVEN a student finishes the last standard exercise for a skill with challenges
- WHEN the `complete` phase renders
- THEN `PracticeCompletePhase` is shown AND `<ChallengeOptInBlock />` is rendered as a sibling section

#### Scenario: complete phase without challenges is unchanged

- GIVEN a student finishes the last standard exercise for a skill with zero challenges
- WHEN the `complete` phase renders
- THEN only `PracticeCompletePhase` is shown (no opt-in block, behavior is identical to today)

#### Scenario: accepting a challenge does not mutate base phase

- GIVEN the complete phase is shown with `<ChallengeOptInBlock />`
- WHEN the user clicks "Hacer un desafío"
- THEN the opt-in block renders its first challenge step AND the base `phase` state remains `"complete"` (the challenge flow owns its own internal step state)

#### Scenario: skipping a challenge returns to selector

- GIVEN the complete phase is shown with `<ChallengeOptInBlock />`
- WHEN the user clicks "Volver al selector"
- THEN the challenge module calls back to the page and `resetToSelect()` runs (same behavior as the base complete → selector path)

#### Scenario: base phase machine is unchanged

- GIVEN the base `PracticePhase` union
- WHEN inspected after the challenge module is added
- THEN the union is exactly `select | theory | example | exercise | feedback | recovery | complete` (no `"challenges"` member was added)
- AND `nextPhase` does NOT have a `"challenges"` case

#### Scenario: base store is unchanged

- GIVEN `src/lib/practice-progress.ts`
- WHEN inspected after the challenge module is added
- THEN it does NOT import from `src/lib/advanced-practice-progress.ts`
- AND `pre-utn.practice.v1` is the only localStorage key it reads or writes
