# Delta for Challenge Exercises

## Purpose

Add one U3 challenge at `difficulty: 5` for `mat.u3.ecuaciones_lineales`, anchored in P1l (PR2). PR1 is autonomous. CHALLENGE and EXERCISE `sourceUse` vocabularies differ. `mat.u3.traduccion_lenguaje_verbal` keeps its two existing challenges per the parent roadmap.

## ADDED Requirements

### Requirement: U3 Ecuaciones Lineales P1l Challenge (PR2)

PR2 MUST add one challenge for `mat.u3.ecuaciones_lineales` at canonical max difficulty, sourced from `03_ej_utn.pdf` and adapted. `canonicalTrace[].sourceUse` MUST use the CHALLENGE surface.

| Field | Value |
|-------|-------|
| Skill | `mat.u3.ecuaciones_lineales` |
| `type` / `options` | `"multiple-choice"`, exactly `4` |
| `difficulty` | `5` (loader accepts `4` or `5`) |
| `commonErrorTags` | include `u3_racionalizacion_irracional` |
| `canonicalTrace[].sourceUse` | CHALLENGE surface: `canonical-source` \| `adapted` \| `calibrated-from-exam` \| `solution-pattern` |
| `pedagogicalNote` + `pedagogicalIntent` | Spanish-neutral |

#### Scenario: U3LIN-CHAL-001 — new challenge loads and is reachable

- GIVEN the updated challenges file
- WHEN `loadChallengesForSkill("mat.u3.ecuaciones_lineales")` is called
- THEN the list includes the new entry at `difficulty: 5`
- AND `mat.u3.traduccion_lenguaje_verbal` keeps its two pre-existing challenges (no new entry)

#### Scenario: U3LIN-CHAL-002 — verbatim P1l prompt is rejected

- GIVEN a challenge whose `prompt` matches the canonical PDF P1l item verbatim
- WHEN the PR review runs
- THEN the challenge is rejected and the author must adapt it
- AND `canonicalTrace[].sourceUse` MUST be `adapted` / `calibrated-from-exam` / `solution-pattern`; `canonical-source` rejects verbatim prompts

### Requirement: U3 Challenge Difficulty 5 Carve-Out

Loader already enforces `difficulty ∈ {4, 5}` (no loader change). The parent audit (`recuperar-u3-practica-canonica/specs/u3-canonical-coverage-audit/spec.md`) requires exactly one NEW challenge per U3 alignment skill at `difficulty: 5`; `mat.u3.traduccion_lenguaje_verbal` is excepted. Non-U3 new challenges use `difficulty: 4`.

#### Scenario: U3LIN-CHAL-003 — loader accepts both 4 and 5

- GIVEN a U3 challenge at `difficulty: 5`
- WHEN the loader parses the file
- THEN the entry loads without throwing
- AND the U3 audit (not the loader) scopes `5` to U3 alignment skills

### Requirement: PR1 Autonomous; PR2 External Dependency SATISFIED With Base Verification

PR1 MUST be fully autonomous — no dependency on `parseOptionalCanonicalTrace` or `auditU3TraceSourceUse`, no new `canonicalTrace` write. PR2's external dependency on `recuperar-u3-traza-canonica-ejercicios` PR2 (parser + U3 audit) is recorded as **SATISFIED** by PR #98 (merge commit `e553648079cd7b6f9864683d4ab4d694b4f6a8e7`; head `feat/u3-traza-canonica-parser` @ `d4c77a5`), which delivered `parseOptionalCanonicalTrace` and `auditU3TraceSourceUse` to `main`. Implementation of PR2 MUST verify its future base contains merge commit `e553648` or the equivalent merged symbols (`parseOptionalCanonicalTrace`, `auditU3TraceSourceUse` are importable) before writing the new challenge's `canonicalTrace`; if verification fails, PR2 MUST NOT proceed.

#### Scenario: U3LIN-CHAL-004 — PR2 dependency SATISFIED; PR1 proceeds; PR2 verifies base before writing canonicalTrace

- GIVEN `recuperar-u3-traza-canonica-ejercicios` PR2 is merged on `main` (PR #98, `e553648079cd7b6f9864683d4ab4d694b4f6a8e7`)
- WHEN the orchestrator plans PR1 and PR2
- THEN PR1 may proceed and merge independently (no `canonicalTrace` write)
- AND PR2 may proceed BUT the implementation branch MUST verify `e553648` is an ancestor of its base OR the symbols `parseOptionalCanonicalTrace` and `auditU3TraceSourceUse` are importable from `src/domain`, before writing the challenge's `canonicalTrace`

## MODIFIED Requirements

### Requirement: Challenge Exercise Schema Compliance

Every new challenge MUST have: `type: "multiple-choice"`, exactly `4` `options`, `difficulty ∈ {4, 5}` (4 for non-U3; 5 for U3 alignment per `recuperar-u3-practica-canonica/specs/u3-canonical-coverage-audit/spec.md`), `challengeSection: true`, `category: "desafio"`, `tags: ["desafio", "integrador"]`, `canonicalTrace` with ≥1 entry whose CHALLENGE-surface `sourceUse` ∈ {`canonical-source`, `adapted`, `calibrated-from-exam`, `solution-pattern`} (distinct from exercise `{adapted, reinforcement, reference, alignment}`), `commonErrorTags` referencing real tags, and `pedagogicalNote` + `pedagogicalIntent` in Spanish. The loader MUST throw on violation.

(Previously: only `difficulty: 4` was mandated; U3 alignment now lands at `5`. CHALLENGE and EXERCISE `sourceUse` vocabularies stay distinct.)

#### Scenario: valid U3 challenge at difficulty 5 passes loader

- GIVEN a U3 challenge with `difficulty: 5` and a valid `canonicalTrace` (CHALLENGE-surface `sourceUse`)
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

- GIVEN a challenge with `commonErrorTags: ["u3_tag_inexistente"]`
- WHEN the traceability audit runs
- THEN the audit reports the challenge ID and the unknown tag

#### Scenario: non-Spanish fragment rejected

- GIVEN a challenge whose `pedagogicalIntent` contains a non-Spanish fragment
- WHEN the PR review runs
- THEN the challenge is rejected

## REMOVED Requirements

*None.*

## RENAMED Requirements

*None.*
