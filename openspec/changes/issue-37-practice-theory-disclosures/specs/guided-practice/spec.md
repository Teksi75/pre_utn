# Delta for Guided Practice

## ADDED Requirements

### Requirement: Populated Theory Disclosure Controls

Practice theory disclosure controls MUST appear only when their corresponding disclosure content contains at least one entry. The system MUST render populated notation and common-mistake disclosures with their entries, and MUST NOT render empty disclosure buttons, disabled empty buttons, or empty lists as the default behavior.

#### Scenario: notation disclosure is populated

- GIVEN a practice theory node has one or more notation entries
- WHEN the theory card renders
- THEN the `Ver notación` control is shown
- AND opening it reveals the notation entries.

#### Scenario: notation disclosure is empty

- GIVEN a practice theory node has no notation entries
- WHEN the theory card renders
- THEN no `Ver notación` control is shown
- AND no empty notation list is rendered.

#### Scenario: common mistakes disclosure is mixed independently

- GIVEN a practice theory node has common mistakes but no notation
- WHEN the theory card renders
- THEN `Ver errores comunes` is shown with entries
- AND `Ver notación` is not shown.

### Requirement: Empty Optional Theory Disclosures

Theory nodes used by practice MUST allow empty notation and common-mistake arrays as valid optional disclosure state. Required learning content, including the theory concepts and canonical trace, MUST remain mandatory.

#### Scenario: empty disclosures are valid

- GIVEN a theory node has concepts, canonical trace, `notation: []`, and `commonMistakes: []`
- WHEN the node is validated for practice use
- THEN validation succeeds.

#### Scenario: required learning content remains mandatory

- GIVEN a theory node is missing concepts or canonical trace
- WHEN the node is validated for practice use
- THEN validation fails.

## Pedagogical Impact

| Audience | Effect |
|----------|--------|
| Alumno | Disclosure buttons now signal real support content instead of sending the alumno to empty space. |
| Docente | Cleaner practice flow preserves attention on useful theory warnings and notation. |
