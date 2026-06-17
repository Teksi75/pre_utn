# Delta for challenge-exercises

## ADDED Requirements

### Requirement: Pilot Skill Challenge Coverage

Every U1+U2 pilot skill MUST have 2 challenges. The 3 pre-existing
(`complejos`, `valor_absoluto`, `ecuaciones_fraccionarias`) MUST keep their 2
and MUST NOT be doubled. Expansion adds 2 to each of the remaining 12 pilot
skills (5 U1 + 7 U2).

| Set | Count | Source |
|-----|-------|--------|
| Pre-existing (3) | 2 each | shipped, untouched |
| Expansion (12) | 2 each | Batches A–D |
| Final (15) | 2 each | after Batch D |

#### Scenario: uncovered skill reaches 2

- GIVEN `mat.u2.mcm_mcd_polinomios` has zero challenges before Batch D
- WHEN Batch D appends `desafio-01` and `desafio-02`
- THEN `queryChallengesBySkill("mat.u2.mcm_mcd_polinomios")` returns 2

#### Scenario: covered skill stays at 2

- GIVEN `mat.u1.complejos` has 2 challenges before this change
- WHEN any batch of this expansion lands
- THEN `queryChallengesBySkill("mat.u1.complejos")` STILL returns 2

### Requirement: Challenge Exercise Schema Compliance

Every new challenge MUST have: `type: "multiple-choice"`, 4 `options`,
`difficulty: 4`, `challengeSection: true`, `category: "desafio"`, `tags:
["desafio", "integrador"]`, `canonicalTrace` with ≥1 entry whose `sourceUse`
∈ {`canonical-source`, `adapted`, `calibrated-from-exam`, `solution-pattern`},
`commonErrorTags` referencing real tags in `src/domain/error-taxonomy/`, and
`pedagogicalNote` plus `pedagogicalIntent` written in Spanish. The loader
MUST throw at module init on any violation.

#### Scenario: valid entry passes loader

- GIVEN a valid challenge
- WHEN `loadChallengesForSkill(skillId)` is called
- THEN the entry is returned without error

#### Scenario: free-text root rejected

- GIVEN a challenge whose `expectedAnswer` is a free-text root in a `numerical` type
- WHEN the loader parses the file
- THEN the loader throws (AGENTS.md prohibition)

#### Scenario: wrong difficulty is rejected

- GIVEN a challenge with `difficulty: 3`
- WHEN the loader parses the file
- THEN the loader throws (MUST be `4` or `5`)

#### Scenario: unknown error tag rejected

- GIVEN a challenge with `commonErrorTags: ["u1_tag_inexistente"]`
- WHEN the traceability audit runs
- THEN the audit reports the challenge ID and the unknown tag

#### Scenario: non-Spanish fragment rejected

- GIVEN a challenge whose `pedagogicalIntent` contains a non-Spanish fragment
- WHEN the PR review runs
- THEN the challenge is rejected

### Requirement: No Literal Canonical Copy

Every challenge MUST be synthesized, not copied verbatim. `canonicalTrace.sourceUse`
MUST reflect the actual relationship (`calibrated-from-exam` = rephrased, not lifted).

#### Scenario: synthesized challenge accepted

- GIVEN a challenge with `sourceUse: "calibrated-from-exam"` and a reworded prompt
- WHEN the PR review runs
- THEN the challenge is accepted

#### Scenario: verbatim exam prompt rejected

- GIVEN a challenge whose `prompt` matches a TEMA 1 or TEMA 2 item verbatim
- WHEN the PR review runs
- THEN the challenge is rejected and the author is asked to rephrase

### Requirement: Challenge Non-Regression

Appending challenges MUST NOT change loader behavior, advanced store, base
practice store, UI, `usePracticeFlow`, or base mastery. `pre-utn.practice.v1`
MUST be unchanged.

#### Scenario: test count does not decrease

- GIVEN 2053 tests pass before the expansion
- WHEN all 4 batches land and `pnpm run test` runs
- THEN the report shows ≥ 2053 tests passing

#### Scenario: base mastery unaffected

- GIVEN a `PracticeProgress` for `mat.u1.potencias_raices` with 5 standard attempts
- WHEN `computeMasteryLevel` is called before and after the expansion
- THEN both calls return the same value

#### Scenario: base localStorage shape is preserved

- GIVEN `pre-utn.practice.v1` with a populated `PracticeProgress`
- WHEN the expansion is applied
- THEN the key still exists with the same shape

### Requirement: Batch Size Discipline

Each delivery batch MUST stay under 400 changed lines.

#### Scenario: batch within budget accepted

- GIVEN Batch C appends 8 challenges (~320 lines) split across `unit-1.json` and `unit-2.json`
- WHEN the PR is opened
- THEN the PR is reviewable without size exception

#### Scenario: batch over budget rejected

- GIVEN a batch that exceeds 400 lines
- WHEN the PR is opened
- THEN the orchestrator rejects it and asks to split
