# Delta for Math Skill Model

## ADDED Requirements

### Requirement: U3 Pilot Skills Registration

`PILOT_SKILLS` MUST include exactly 8 entries for the U3 skill IDs already declared in `UNIT_3_SKILLS` (`skill-catalog.ts`), each with `unitKey: "unit-3"` and a human-readable Spanish label.

| `skillId` | Suggested label |
|-----------|-----------------|
| `mat.u3.ecuaciones_lineales` | Ecuaciones lineales |
| `mat.u3.ecuaciones_cuadraticas` | Ecuaciones cuadráticas |
| `mat.u3.inecuaciones_lineales` | Inecuaciones lineales |
| `mat.u3.inecuaciones_valor_absoluto` | Inecuaciones con valor absoluto |
| `mat.u3.recta` | Recta en el plano |
| `mat.u3.sistemas` | Sistemas de ecuaciones |
| `mat.u3.exponenciales` | Ecuaciones exponenciales |
| `mat.u3.logaritmicas` | Ecuaciones logarítmicas |

#### Scenario: U3-SKILL-001 — Eight U3 pilot entries exist

- GIVEN `PILOT_SKILLS`
- WHEN entries with `unitKey === "unit-3"` are filtered
- THEN the count is exactly 8 and their `skillId` values match `UNIT_3_SKILLS`

#### Scenario: U3-SKILL-002 — `PILOT_SKILL_UNIT_MAP` covers all U3 IDs

- GIVEN the 8 U3 skill IDs
- WHEN looked up in `PILOT_SKILL_UNIT_MAP`
- THEN each returns `"unit-3"` (not `undefined`)

### Requirement: U3 Skill Page Navigation

A student MUST be able to navigate from `/learn/matematica` to `/learn/matematica/{skillId}` for each U3 skill ID and see the skill page render without "skill not found" errors.

#### Scenario: U3-SKILL-003 — Detail page resolves U3 skills

- GIVEN a logged-in student visits `/learn/matematica/mat.u3.exponenciales`
- WHEN the detail page resolves the skillId
- THEN the page renders the skill content (not a "not found" state)

## MODIFIED Requirements

### Requirement: Skill Identity and Metadata

The system SHALL define a Skill with stable identity, unit, display name, description, prerequisites, and pedagogical tags. Skill IDs MUST follow `mat.u{1-6}.{slug}`.

(Previously: unchanged — the 8 U3 IDs already exist in `UNIT_3_SKILLS` and `KNOWN_SKILL_IDS`. This delta confirms pilot visibility only.)

#### Scenario: valid skill is accepted

- GIVEN a skill with ID `mat.u3.recta`, unit 3, metadata, empty prerequisites, and tags
- WHEN the skill is validated
- THEN validation succeeds with the normalized skill

#### Scenario: invalid identity is rejected

- GIVEN a skill with ID `math-3` or unit 7
- WHEN the skill is validated
- THEN validation fails with an identity or unit error

## REMOVED Requirements

*None.*

## RENAMED Requirements

*None.*