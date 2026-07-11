# Delta for challenge-exercises

## MODIFIED Requirements

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

## ADDED Requirements

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