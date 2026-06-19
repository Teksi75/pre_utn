# Theory Paragraph Model Specification

## Purpose

Theory concepts render as a single wall-of-text string, hurting readability for long concepts (Ruffini, Teorema del resto, sign warnings) shared by Aprender (`/learn/matematica/[skillId]`) and Práctica (`/practice`). This spec adds an optional `bodyParagraphs: readonly string[]` on `ConceptBlock` so authors express paragraph structure explicitly while keeping the legacy `body: string` working. Helps the alumno parse theory faster; helps the docente see where a concept could be split.

## Requirements

### Requirement: Body Paragraphs Model and Parser

`ConceptBlock` MUST accept `bodyParagraphs?: readonly string[]` alongside `body: string`. When present, every element MUST be a non-empty string and the array length MUST be ≥ 1; an empty array is normalized to `undefined`. `parseConceptBlock` MUST runtime-validate each element and throw with the offending index on any empty or non-string value. A concept with only `body` MUST validate and render exactly as before.

#### Scenario: valid bodyParagraphs is preserved

- GIVEN a `ConceptBlock` with `bodyParagraphs: ["Párrafo 1.", "Párrafo 2."]`
- WHEN the domain validates the node
- THEN validation succeeds and the field is preserved

#### Scenario: parser rejects empty element

- GIVEN JSON `{ id, title, bodyParagraphs: ["OK", ""] }`
- WHEN the parser processes the entry
- THEN parsing throws with the offending index

#### Scenario: empty array is treated as absent

- GIVEN a `ConceptBlock` whose `bodyParagraphs` is `[]`
- WHEN the parser validates the entry
- THEN the field is normalized to `undefined`

#### Scenario: legacy concept is unchanged

- GIVEN a `ConceptBlock` with only `body: "Texto largo"`
- WHEN `TheoryCard` renders the node
- THEN the legacy single-block path is used and no regression occurs

### Requirement: TheoryCard Paragraph Rendering

`TheoryCard` MUST render `bodyParagraphs` (when present and non-empty) as a list of paragraph blocks, each containing a `RichText` per chunk. The renderer uses `<div>` wrappers (not `<p>`) to avoid invalid HTML nesting when a chunk contains display math that produces block-level KaTeX output. When absent, the legacy `<div><RichText text={concept.body} /></div>` MUST be preserved. When both fields are present, `bodyParagraphs` wins. The component is shared by Aprender and Práctica, so both surfaces get the same rendering.

#### Scenario: multi-paragraph concept renders N elements

- GIVEN a concept with `bodyParagraphs: ["P(x).", "(x−a).", "P(a)."]`
- WHEN `TheoryCard` renders the node
- THEN the concept block contains exactly 3 paragraph blocks
- AND each block contains a `RichText` chunk

### Requirement: Math Content Preservation Per Paragraph

Each paragraph chunk MUST be processed through the existing `RichText` / `parseRichTextSegments` pipeline so `$...$` and `$$...$$` render via KaTeX in every paragraph without leaking unmatched delimiters.

#### Scenario: KaTeX renders inside each paragraph

- GIVEN one chunk containing $P(x)$ and another containing $(x-a)$
- WHEN `TheoryCard` renders the node
- THEN each chunk's math renders via KaTeX and no raw `$` leaks

#### Scenario: unmatched delimiter is plain text

- GIVEN a chunk that ends without closing `$`
- WHEN the chunk is parsed
- THEN the unmatched portion is treated as plain text

### Requirement: Ruffini Concept Migration

The 3 Ruffini concepts (`concept-ruffini-procedimiento`, `concept-teorema-resto`, `concept-ruffini-signo`) in `content/matematica/theory/unit-2.json` MUST migrate to `bodyParagraphs` with `body` removed. `unit-1.json` MUST remain on the legacy `body` path.

#### Scenario: Ruffini concepts use bodyParagraphs

- GIVEN `unit-2.json` is loaded
- WHEN the Ruffini theory node is parsed
- THEN the 3 concepts expose `bodyParagraphs` and not `body`

### Requirement: Acceptance Anchors

Visiting `/learn/matematica/mat.u2.ruffini_resto` MUST render Ruffini concepts as paragraph-separated blocks with $P(x)$, $(x-a)$, $P(a)$, $(x-(-a))$ rendered via KaTeX in every paragraph. The theory step of a Ruffini flow in `/practice` MUST render the same paragraph-separated content (single source of truth shared with Aprender).

#### Scenario: Aprender shows paragraph-split Ruffini

- GIVEN the route `/learn/matematica/mat.u2.ruffini_resto` is opened
- WHEN the page renders
- THEN the Ruffini concepts render as multiple paragraph blocks
- AND the math expressions render through KaTeX

#### Scenario: Practice shows paragraph-split Ruffini

- GIVEN the Ruffini flow in `/practice`
- WHEN the theory step renders
- THEN the rendering matches the Aprender page paragraph-for-paragraph

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
