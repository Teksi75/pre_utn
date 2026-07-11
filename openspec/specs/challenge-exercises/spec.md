# Spec: challenge-exercises

## Requirements

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

Every new challenge MUST have: `type: "multiple-choice"`, 4 `options`, `challengeSection: true`, `category: "desafio"`, `tags: ["desafio", "integrador"]`, `canonicalTrace` with ≥1 entry whose `sourceUse` ∈ {`canonical-source`, `adapted`, `calibrated-from-exam`, `solution-pattern`}, `commonErrorTags` referencing real tags in `src/domain/error-taxonomy/`, and `pedagogicalNote` plus `pedagogicalIntent` written in Spanish. The loader MUST throw at module init on any violation. The loader-level difficulty check accepts `4` or `5`.

Context-specific difficulty baselines (enforced by a scoped U3 alignment audit, NOT by the loader): pilot-skill (U1/U2) challenges use `difficulty: 4`. `traduccion_lenguaje_verbal.desafio-02` keeps `difficulty: 4` (pre-change baseline). `traduccion_lenguaje_verbal.desafio-01` keeps `difficulty: 5` (pre-change baseline). The nine named U3 alignment challenges added by `align-u3-practice-official-exercises` MUST have `difficulty === 5`.

(Previously: requirement text said `difficulty: 4` universally; the wrong-difficulty scenario was inconsistent; translation desafios not enumerated as preserved baselines; no scoped U3 alignment audit existed.)

#### Scenario: valid entry passes loader

- GIVEN a valid challenge
- WHEN `loadChallengesForSkill(skillId)` is called
- THEN the entry is returned without error

#### Scenario: free-text root rejected

- GIVEN a challenge whose `expectedAnswer` is a free-text root in a `numerical` type
- WHEN the loader parses the file
- THEN the loader throws (AGENTS.md prohibition)

#### Scenario: wrong difficulty is rejected

- GIVEN a challenge with `difficulty: 3` or `6`
- WHEN the loader parses the file
- THEN the loader throws (loader-level check accepts only `4` or `5`)

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

### Requirement: Student-Scoped Challenge Attempts

Challenge attempt persistence MUST associate every new `ChallengeAttempt` with the active student profile. Challenge readiness and progress MUST read only the active student's challenge attempts. Legacy anonymous challenge attempts MUST remain loadable through a safe compatibility path, but MUST NOT be aggregated into another student's readiness. The existing challenge-exercises storage contract MUST remain compatible for consumers that read challenge progress. Pedagogical impact: each alumno sees their own advanced readiness, so the teacher can trust challenge progress as profile-specific evidence instead of mixed device history.

#### Scenario: new challenge attempt belongs to active student

- GIVEN an active student profile with `studentId: "student-a"`
- WHEN the alumno submits a challenge answer
- THEN the persisted `ChallengeAttempt` includes `studentId: "student-a"`
- AND challenge progress for that student includes the attempt

#### Scenario: no active student blocks challenge write

- GIVEN no active student profile exists
- WHEN a challenge answer is submitted
- THEN no new `ChallengeAttempt` is persisted
- AND the caller receives an explicit blocked result compatible with the StudentGate flow

#### Scenario: legacy anonymous attempts remain loadable safely

- GIVEN stored challenge progress contains attempts without `studentId`
- WHEN challenge progress is loaded for the active profile
- THEN the legacy attempts remain parseable without data loss
- AND the load does not throw because `studentId` is missing

#### Scenario: readiness does not leak across students

- GIVEN student A and student B have challenge attempts for the same skill
- WHEN advanced readiness is computed while student A is active
- THEN only student A's attempts contribute to the readiness score
- AND student B's attempts are ignored

#### Scenario: storage contract remains compatible

- GIVEN existing challenge-exercises consumers load advanced practice progress
- WHEN student-scoped challenge attempts are present
- THEN they can still read challenge progress for the active student
- AND base practice progress remains unchanged

---

## Added by align-u3-practice-official-exercises

### Requirement: U3 Alignment Policy Audit (Scoped, Non-Loader)

A scoped U3 alignment audit MUST enforce, for the nine U3 alignment skill IDs (`ecuaciones_lineales`, `ecuaciones_cuadraticas`, `ecuaciones_valor_absoluto`, `inecuaciones_valor_absoluto`, `inecuaciones_producto_cociente`, `recta`, `sistemas`, `exponenciales`, `logaritmicas`), that each has EXACTLY one new challenge with `difficulty === 5` and `type === multiple-choice`. The audit MUST NOT enforce this on other skills. `traduccion_lenguaje_verbal` diff 4 (`desafio-02`) and diff 5 (`desafio-01`) are preserved and MUST NOT be rejected by the audit.

#### Scenario: U3 alignment audit accepts nine diff-5 challenges

- GIVEN the nine U3 alignment skill IDs each have exactly one diff-5 MC challenge
- WHEN the scoped U3 alignment audit runs
- THEN it returns no violations

#### Scenario: existing translation desafio-02 still loads

- GIVEN `traduccion_lenguaje_verbal.desafio-02` at `difficulty: 4`
- WHEN the challenge loader parses the file
- THEN the loader returns the challenge
- AND the scoped U3 alignment audit does NOT touch this challenge

### Requirement: Free-Form Input Type Prohibition

No new challenge MAY use `text` or any other free-form input type. The student MUST NOT type structured-math answers in a free-form input field. MC option values MAY encode intervals, unions, radicals, or `log/ln` expressions as text (those are valid structured representations and MUST NOT be rejected).

#### Scenario: prohibited input type rejected

- GIVEN a candidate challenge with `type: "text"`
- WHEN the challenge loader parses the file
- THEN the loader throws

#### Scenario: MC option values with structured math pass

- GIVEN a multiple-choice challenge whose options include text-encoded intervals, unions, radicals, or `log/ln`
- WHEN the loader parses the file
- THEN the loader accepts it

### Requirement: Challenge Compatibility Baselines (Desafios)

Pre-change challenge fixtures that MUST remain valid post-change: `mat.u3.traduccion_lenguaje_verbal.desafio-01` (diff 5, owned by `fortalecer-u3`); `mat.u3.traduccion_lenguaje_verbal.desafio-02` (diff 4, owned by `fortalecer-u3`). A compatibility test suite compares post-change behavior against these fixtures.

#### Scenario: desafio-02 still loads post-change

- GIVEN the pre-change fixture `desafio-02` at diff 4
- WHEN the catalog is reloaded after this change
- THEN `loadChallengesForSkill("mat.u3.traduccion_lenguaje_verbal")` returns 2 entries
- AND `desafio-02` retains `difficulty: 4`
- AND `desafio-01` retains `difficulty: 5`
