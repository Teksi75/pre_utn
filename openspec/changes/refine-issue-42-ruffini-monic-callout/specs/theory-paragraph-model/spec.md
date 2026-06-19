# Delta for theory-paragraph-model

**Source spec**: `openspec/specs/theory-paragraph-model/spec.md`
**Change**: `refine-issue-42-ruffini-monic-callout`
**Summary**: Replaces P4 of `concept-fac-potencias-igual-grado` with a KaTeX `array` table, a "resto es 0" closure, the cociente, and an "Importante:" monic-factor callout. Cap relaxes 5–6 → 5–10. Zero model or renderer change.

## MODIFIED Requirements

### Requirement: Caso 6 Concept Has 5-10 Paragraphs

The system SHALL provide 5–10 `bodyParagraphs` for `concept-fac-potencias-igual-grado`, each a single pedagogical step. The cap relaxes from 5–6 to 5–10 to accommodate the KaTeX table, the closure, the cociente line, and the monic-factor callout.
(Previously: hard-coded 5–6 paragraphs.)

#### Scenario: paragraph count within relaxed cap

- GIVEN the concept
- WHEN `bodyParagraphs.length` is read
- THEN the value is between 5 and 10 inclusive.

## ADDED Requirements

### Requirement: Ruffini Table as KaTeX Array

The Ruffini step SHALL render the coefficient table as KaTeX display math using `\begin{array}{c|cccc}` with `\hline` for the result row. Layout: header `-3/2`, coefficients `[8, 0, 0, 27]`, intermediate `[−12, 18, −27]`, result `[8, −12, 18, 0]`. The table SHALL NOT be plain prose with ASCII whitespace.

#### Scenario: table renders as aligned KaTeX

- GIVEN `/learn/matematica/mat.u2.factorizacion` is opened
- WHEN the Ruffini step is observed
- THEN the table appears with aligned columns and a visible `|` / `\hline` separator.

### Requirement: Explicit "Resto es 0" Closure

A dedicated paragraph SHALL contain "Como el resto es 0, la división es exacta." as a standalone line, not embedded mid-sentence.

#### Scenario: closure is its own line

- GIVEN the concept rendered
- WHEN the post-table paragraphs are read
- THEN the closure sentence appears on its own.

### Requirement: Importante Callout for Monic Factor

A dedicated paragraph at the end of the Ruffini block SHALL open with "Importante:" and SHALL name the monic factor `x + 3/2`, stating that Ruffini divides by the monic factor associated with the divisor, not by the original `2x + 3`.

#### Scenario: monic callout is its own paragraph

- GIVEN the concept rendered
- WHEN the Ruffini block closes
- THEN a paragraph opens with "Importante:" and mentions `x + 3/2`.

### Requirement: Explicit Cociente Line

The cociente `8x² − 12x + 18` SHALL appear explicitly between the table and the "Importante:" callout, before the divide-by-2 reconciliation.

#### Scenario: cociente is named

- GIVEN the concept rendered
- WHEN the paragraphs after the table are read
- THEN `8x² − 12x + 18` appears as a dedicated reference.

### Requirement: Final Factorization Preserved

The factorization `(2x + 3)(4x² − 6x + 9)` SHALL remain present in the concept, anchoring the cociente back to the original divisor.

#### Scenario: factorization intact

- GIVEN the concept rendered
- WHEN the bodyParagraphs are scanned
- THEN `(2x + 3)(4x² − 6x + 9)` appears at least once.

### Requirement: No Horizontal Overflow at 375px

At a 375px-wide viewport, the KaTeX `array` table SHALL fit without introducing horizontal scroll on the concept page.

#### Scenario: mobile renders without scroll

- GIVEN a 375×812 viewport
- WHEN `/learn/matematica/mat.u2.factorizacion` loads
- THEN there is no horizontal scrollbar and the table is legible.

### Requirement: No Forbidden Ingenium Voice Strings

The modified content SHALL NOT introduce any string from the AGENTS.md prohibited list: "profe digital", "tu profesor", "plan personalizado", "te marco qué practicar", "vamos a armar un plan a tu medida", or any variant that personifies the app as tutor.

#### Scenario: voice gate green

- GIVEN the modified content files
- WHEN `pnpm run test -- copy-strings-acceptance` runs
- THEN zero forbidden strings match.

### Requirement: Test Caps Updated for New Range

`content-loaders.test.ts` (`EXPANDED_U2_IDS` set) and `copy-strings-acceptance.test.ts` (`<= 6` assertion) SHALL be updated to accommodate the 5–10 range without false-positive failures on `concept-fac-potencias-igual-grado`.

#### Scenario: tests pass at new cap

- GIVEN the updated tests
- WHEN `pnpm run test` runs
- THEN no test fails because the concept exceeds the legacy 5–6 cap.
