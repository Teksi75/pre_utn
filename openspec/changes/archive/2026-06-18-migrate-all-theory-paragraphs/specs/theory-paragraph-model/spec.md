# Delta for Theory Paragraph Model

## Purpose

Issue #36 shipped the `bodyParagraphs` model, parser, and renderer. This delta formalizes the editorial rules for converting the 38 remaining long-body concepts (`body` > 350 chars) across U1/U2 to that shape. Issue #36's infrastructure is the rendering capability and is not modified.

## ADDED Requirements

### Requirement: Long-Body Selection Criterion

A concept SHALL be eligible for `bodyParagraphs` migration when its `body` exceeds 350 characters. Concepts at or below 350 characters MUST remain on legacy `body`.

#### Scenario: long concept migrated

- GIVEN a `ConceptBlock` with `body` length = 728
- WHEN the migration pass runs
- THEN the concept is rewritten as `bodyParagraphs` and `body` is removed

#### Scenario: short concept untouched

- GIVEN a `ConceptBlock` with `body` length = 158
- WHEN the migration pass runs
- THEN the concept keeps `body` and is NOT rewritten

### Requirement: Content Preservation Invariants

A migrated concept MUST preserve every sentence, every `$...$` and `$$...$$` expression, every sign, every variable, and every pedagogical claim verbatim. The migration MUST NOT reword, reorder, or normalize punctuation, accent marks, or whitespace inside a chunk. A `$$...$$` pair MUST stay intact within one chunk.

#### Scenario: KaTeX tokens verbatim

- GIVEN a `body` containing `$\sqrt{2}$` and `$\frac{a+bi}{c+di}$`
- WHEN the concept is migrated
- THEN those exact strings appear unchanged in `bodyParagraphs` chunks

#### Scenario: display math intact

- GIVEN a `body` containing `$$P(x) = (x-a)Q(x) + R$$`
- WHEN the concept is migrated
- THEN both `$$` markers stay inside the same `bodyParagraphs` element

### Requirement: Migration Coverage and Drop-Legacy-Body

Every migrated concept MUST expose `bodyParagraphs` (2-4 elements) and MUST NOT expose a `body` field. Coverage: 21 in `unit-1.json` and 17 in `unit-2.json` (38 new, on top of the 3 Ruffini concepts shipped in #36).

#### Scenario: migrated concept drops body

- GIVEN any concept whose `body` exceeded 350 chars before this change
- WHEN the migration is applied
- THEN the concept exposes `bodyParagraphs` and not `body`

#### Scenario: per-file counts match plan

- GIVEN the migration is complete
- THEN `unit-1.json` has 21 `bodyParagraphs` entries
- AND `unit-2.json` has 20 `bodyParagraphs` entries (17 new + 3 Ruffini)

### Requirement: Verification — Theory Unit Shape and Visual Spot Checks

Verification SHALL (a) load every theory unit and assert each migrated chunk is a non-empty string and no concept has both `body` and `bodyParagraphs`; and (b) include manual visual spot checks on at least one U1 topic and one U2 topic, confirming KaTeX renders correctly inside every paragraph block.

#### Scenario: load-time shape check passes

- GIVEN the migrated `unit-1.json` and `unit-2.json`
- WHEN a test loads every theory node and walks every concept
- THEN every migrated concept has `bodyParagraphs.length >= 2`
- AND every chunk is a non-empty string
- AND no concept has both `body` and `bodyParagraphs` set

#### Scenario: U1 spot check

- GIVEN `/learn/matematica/mat.u1.conjuntos_numericos` is opened
- WHEN the page renders
- THEN migrated concepts render as paragraph-separated blocks
- AND KaTeX expressions (e.g. `$\mathbb{N}$`, `$\sqrt{2}$`, `$\frac{a+bi}{c+di}$`) render in every chunk

#### Scenario: U2 spot check

- GIVEN `/learn/matematica/mat.u2.factorizacion` is opened
- WHEN the page renders
- THEN migrated concepts render as paragraph-separated blocks
- AND KaTeX polynomial forms render in every chunk

### Requirement: Out-of-Scope Bodies

Concepts with `body` ≤ 350 chars, copy rewrites, model/parser/renderer changes, renaming the `concepts` key to `conceptBlocks` in `unit-1.json`, and any non-theory surface (including the future teacher panel) are out of scope. The apply phase MUST NOT modify them.

#### Scenario: short body stays legacy

- GIVEN a `ConceptBlock` with `body` length = 280
- WHEN the apply phase runs
- THEN the concept is not modified

#### Scenario: no copy edits

- GIVEN a long concept whose `body` reads "El conjunto vacío no contiene elementos."
- WHEN the apply phase runs
- THEN the migrated chunks reproduce that sentence character-for-character
