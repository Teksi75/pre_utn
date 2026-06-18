# Delta for theory-paragraph-model

> New capability. Source of truth: `openspec/specs/theory-paragraph-model/spec.md`. Archive syncs both.

## ADDED Requirements

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
