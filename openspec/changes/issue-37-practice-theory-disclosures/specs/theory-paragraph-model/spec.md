# Delta for Theory Paragraph Model

## ADDED Requirements

### Requirement: Source-Backed U2 Disclosure Lifts

When Unit 2 node-level notation, common-mistake, or practice-prompt disclosures are derived from existing concept content, the lifted content MUST preserve the source mathematical intent, variables, signs, and warnings. Common-mistake lifts from explicit source warnings MUST reproduce the warning text verbatim. The system MUST NOT add filler disclosures merely to make a button appear.

#### Scenario: warning lift preserves source text

- GIVEN a Unit 2 concept block contains an explicit common-mistake warning
- WHEN that warning is lifted into node-level common mistakes
- THEN the lifted entry reproduces the warning verbatim
- AND preserves every mathematical symbol and sign.

#### Scenario: no natural source content

- GIVEN a Unit 2 theory node has only definitional concepts with no useful disclosure source
- WHEN node-level disclosures are authored
- THEN notation and common mistakes MAY remain empty or absent
- AND no synthetic filler entry is added.

### Requirement: Ingenium Support-Material Voice for Disclosure Content

New Unit 2 disclosure content SHALL keep the app in support-material voice. It MUST NOT personify the app as a teacher, promise a personalized plan, or assume whether a teacher is supervising the alumno.

#### Scenario: forbidden voice strings absent

- GIVEN the modified Unit 2 theory content
- WHEN the content is checked for forbidden Ingenium voice strings
- THEN no string personifies the app as a tutor or digital teacher.

#### Scenario: usage context remains neutral

- GIVEN a disclosure entry is shown to an alumno
- WHEN the entry is read
- THEN it supports practice without claiming a teacher is present
- AND without denying future teacher review.

## Pedagogical Impact

| Audience | Effect |
|----------|--------|
| Alumno | U2 disclosures surface real notation and mistakes only where they add value. |
| Docente | Source-backed lifts preserve the intended explanation and avoid misleading filler. |
