# Learn Section Card Specification

## Purpose

Entry surface on `/learn/{subject}` pages (e.g., `/learn/matematica`) that lets the alumno browse the catalog of available theory sections and click into any one. The card honestly represents section breadth via a topic count; the full topic listing lives in the section detail view.

## Requirements

### Requirement: Section Card Content

The `/learn/{subject}` page MUST render one card per theory node. Each card MUST display (a) the section title resolved from `PilotSkill.label`, and (b) a topic count. The card MUST NOT display any other content.

#### Scenario: card shows title and count

- GIVEN a section with `label: "Operaciones con polinomios"` and `node.concepts.length === 3`
- WHEN the page renders
- THEN the card MUST include "Operaciones con polinomios" as its title AND "3 temas" beneath it

#### Scenario: card hides the first subtopic

- GIVEN `node.concepts[0].title === "1. Suma y resta de polinomios"`
- WHEN the card renders
- THEN "1. Suma y resta de polinomios" MUST NOT appear inside the card

### Requirement: Topic Count Source

The count MUST equal `node.concepts.length` — the same array the detail view iterates over. It MUST NOT be hard-coded or taken from any other field.

#### Scenario: count matches the detail view

- GIVEN a section whose detail view renders N concept titles from `node.concepts`
- WHEN the corresponding section card renders
- THEN the card's count MUST equal N

### Requirement: Pluralization

The card MUST use "tema" when count is exactly 1 and "temas" otherwise.

#### Scenario: plural form

- GIVEN count === 7 (e.g., `potencias_raices`)
- WHEN the card renders
- THEN the text MUST be "7 temas"

#### Scenario: singular form

- GIVEN count === 1
- WHEN the card renders
- THEN the text MUST be "1 tema"

### Requirement: Prohibited Card Elements

The card MUST NOT display the first subtopic, the full subtopic list, a manual description, or a textual CTA such as "Estudiar →".

#### Scenario: no manual description or CTA

- WHEN the card renders
- THEN `node.summary` and the text "Estudiar →" MUST NOT appear inside the card

### Requirement: Card Link Behavior

Each card MUST be a single `<Link href="/learn/{subject}/{skillId}">`. The entire visible card area is the link surface.

#### Scenario: card is a Link

- WHEN the page source is inspected
- THEN each card MUST be rendered as a `<Link href="/learn/matematica/{skillId}">` element

### Requirement: Detail View Topic Listing Preserved

The section detail view MUST continue to render the full ordered list of concept titles.

#### Scenario: detail view lists all concepts

- GIVEN a section with 3 concepts
- WHEN the detail page renders
- THEN it MUST display all 3 concept titles in canonical order

### RENAMED Requirements

### Requirement: División larga de polinomios (procedimiento) → División de polinomios

The concept `concept-op-division` MUST have the title "3. División de polinomios".
(Previously: "3. División larga de polinomios (procedimiento)".)
(Migration: No test asserts the old literal. Remaining "División" references belong to "División de complejos" in the error taxonomy, an unrelated concept.)

#### Scenario: renamed concept title is in effect

- GIVEN `concept-op-division` in `content/matematica/theory/unit-2.json`
- WHEN the `title` field is read
- THEN it MUST equal "3. División de polinomios"

## Pedagogical Impact

| Audience | Effect |
|----------|--------|
| Alumno | Honest breadth signal: a card reading "3 temas" cannot be misread as a single-topic section. The full topic list stays one click away. |
| Docente | No direct effect — the card is the alumno's surface; the docente path is a separate product. |

## Out of Scope

Global layout, background, watermark, sidebar, footer, brand mark, and any other page. The `TheoryCard` component, detail view, navigation, home, domain model, and a reusable `SectionCard` component (deferred until another subject reuses the shape).
