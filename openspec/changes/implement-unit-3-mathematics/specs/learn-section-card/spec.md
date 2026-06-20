# Delta for Learn Section Card

## ADDED Requirements

### Requirement: Unit 3 Section Heading

The `/learn/matematica` page MUST include `unit-3` in `UNIT_KEYS` with `UNIT_LABELS["unit-3"]` equal to `"Unidad 3 — Ecuaciones y sistemas"`. The section MUST render below the existing U1/U2 sections.

#### Scenario: U3-LSC-001 — Section heading renders

- GIVEN `UNIT_KEYS = ["unit-1", "unit-2", "unit-3"]`
- WHEN `/learn/matematica` is rendered
- THEN a `<h2>` element with the literal text "Unidad 3 — Ecuaciones y sistemas" is present
- AND it appears AFTER the U1 and U2 section headings

#### Scenario: U3-LSC-002 — Eight U3 topic cards

- GIVEN the U3 section content is rendered
- WHEN the cards inside it are counted
- THEN the count is 8 — one per U3 skill

### Requirement: U3 Cards Reuse Existing Card Rules

U3 cards MUST follow the same rules as U1/U2 cards: title from `PilotSkill.label`, topic count from `node.concepts.length`, pluralization "tema/temas", and the full card is a single `Link` to the skill detail page.

#### Scenario: U3-LSC-003 — Card title from PilotSkill.label

- GIVEN `PilotSkill.label === "Ecuaciones lineales"` for `mat.u3.ecuaciones_lineales`
- WHEN the U3 card for that skill renders
- THEN the card text contains "Ecuaciones lineales"

#### Scenario: U3-LSC-004 — Card count from concepts array

- GIVEN a U3 theory node with `concepts.length === 4`
- WHEN the corresponding card renders
- THEN the card text contains "4 temas"

## MODIFIED Requirements

### Requirement: Card Link Behavior

Each card MUST be a single `<Link href="/learn/{subject}/{skillId}">`. The entire visible card area is the link surface.

(Previously: only U1/U2 skillIds were reachable from `/learn/matematica`.)

#### Scenario: card is a Link

- WHEN the page source is inspected
- THEN each card MUST be rendered as a `<Link href="/learn/matematica/{skillId}">` element
- AND the href values include the 8 U3 skillIds

## REMOVED Requirements

*None.*

## RENAMED Requirements

*None.*