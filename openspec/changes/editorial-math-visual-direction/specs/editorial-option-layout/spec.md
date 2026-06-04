# Editorial Option Layout Specification

## Purpose

Fix multiple-choice rendering: 2-column grid on desktop, single-column mobile, other types unaffected.

## Requirements

### Req: Desktop Two-Column Option Grid

Multiple-choice options MUST render 2-column grid at `sm:` (≥640 px). Below `sm:`, MUST stack single-column. `true-false` and `text` types SHALL remain `flex-col`.

**Scenario: 2-column on desktop**
- GIVEN 4 multiple-choice options with inline KaTeX
- WHEN viewport ≥640 px
- THEN 2-column grid; each cell fits math without overflow

**Scenario: single-column on mobile**
- GIVEN multiple-choice exercise
- WHEN viewport <640 px
- THEN options stack single column

**Scenario: true-false unaffected**
- GIVEN `true-false` exercise
- THEN `flex-col` at all widths (not grid)

## Pedagogical Impact

Side-by-side comparison supports mathematical reasoning. Compact layout reduces scrolling, lowers cognitive load.
