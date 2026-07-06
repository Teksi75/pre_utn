# Delta for Math Exercise Catalog

## ADDED Requirements

### Requirement: Official Unit 2 Alignment Verification

The system MUST verify the official Unit 2 alignment with `pnpm run test:run`, `pnpm run typecheck`, and `pnpm run build`. Watch-mode `pnpm run test` MUST NOT be used as the verification command for this change.

#### Scenario: non-watch verification gate

- GIVEN the Unit 2 official-alignment change is ready for verification
- WHEN the verification commands are selected
- THEN `pnpm run test:run`, `pnpm run typecheck`, and `pnpm run build` are required
- AND `pnpm run test` is rejected as insufficient watch-mode verification

## MODIFIED Requirements

### Requirement: Unit 2 Exercise Coverage

The catalog MUST preserve the 7 existing Unit 2 skills and include at least 5 exercises per skill. It MUST add official `02_ej_utn.pdf` coverage without removing existing exercises, introducing new U2 skills, or changing catalog loading architecture unless a real loading bug is found.
(Previously: required 12 new exercises across only 3 Unit 2 skills with exact type counts.)

| Family | Minimum |
|---|---:|
| long division | 3 |
| notable products/powers | 3 |
| factorization across cases | 10 |
| rational expressions | 4 |
| fractional equations with domain verification | 4 |

#### Scenario: U2-CAT-001 — Coverage by skill

- GIVEN the loaded Unit 2 catalog
- WHEN exercises are grouped by the 7 existing U2 skills
- THEN each skill has at least 5 exercises
- AND no new rational-expression skill exists

#### Scenario: U2-CAT-002 — Official family floors

- GIVEN the Unit 2 catalog aligned to `02_ej_utn.pdf`
- WHEN official-family coverage is audited
- THEN every family meets or exceeds its required floor

### Requirement: Unit 2 Input Type Restriction

No U2 exercise MUST use free text for structured mathematical answers. `numerical` MUST be used only for a single finite scalar answer. Algebraic expressions, double-answer equations, domain-rich answers, symbolic polynomial/factorization answers, intervals, unions, and rational expressions MUST use non-free-form controls such as multiple-choice, matching, ordering, chips, or separated numeric inputs.
(Previously: only prohibited free text for polynomial expressions.)

#### Scenario: U2-CAT-003 — No free text for structured math

- GIVEN any U2 exercise with a structured mathematical answer
- WHEN its answer type is inspected
- THEN it is NOT free-form symbolic or free-response text

#### Scenario: U2-CAT-004 — Numerical only for scalar answers

- GIVEN a U2 exercise with two roots, a domain restriction, or a symbolic expression
- WHEN its type is validated
- THEN it is NOT `numerical`

### Requirement: Unit 2 Exercise Concepts

The Unit 2 catalog MUST cover every official family at least once and SHOULD use varied exercises instead of mechanical duplication. New official-alignment exercises MUST carry `02_ej_utn_<item>` trace tags, a canonical trace source for `02_ej_utn.pdf`, and relevant `u2_*` error tags.
(Previously: listed 12 fixed exercise IDs for the first three U2 skills.)

#### Scenario: U2-CAT-005 — Official traces exist

- GIVEN a new Unit 2 official-alignment exercise
- WHEN its metadata is inspected
- THEN it includes a `02_ej_utn_<item>` trace tag
- AND references the official PDF source

#### Scenario: U2-CAT-006 — All official families represented

- GIVEN the official Unit 2 family map
- WHEN each family is searched in the catalog
- THEN at least one valid exercise represents each family
