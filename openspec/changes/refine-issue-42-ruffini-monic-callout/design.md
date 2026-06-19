# Design: Ruffini Monic Callout — Visual Table + Callout Refinement

## Technical Approach

Replace the single 700-char P4 of `concept-fac-potencias-igual-grado` with 5 focused `bodyParagraphs` entries: a KaTeX `$$\begin{array}$$` table, an explicit "resto es 0" closure, the cociente line, an "Importante:" callout for the monic factor, and the divide-by-2 reconciliation. Zero model/parser/renderer changes — the existing `$$...$$` display-math path in `rich-text-parser.ts:45-49` and `katex-display` rendering in `TheoryCard` already support this.

## Architecture Decisions

### Decision: 5 separate bodyParagraphs (not 1 multiline)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| 1 bodyParagraph with `\n` | Renders as collapsed whitespace in `<span>` — whitespace not preserved | **Rejected** |
| 5 separate bodyParagraphs | Each becomes an independent `<div>` with `<RichText>` — clean visual separation | **Chosen** |

**Rationale**: `TheoryCard.tsx:63-69` maps each `bodyParagraphs` entry to a `<div>`. No whitespace-pre CSS exists. Separate entries are the only way to get visual line breaks without model changes.

### Decision: KaTeX `\begin{array}{c|cccc}` (not prose, not monospace)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Prosa refactor (Option A) | Zero risk but no visual table | Rejected |
| KaTeX `$$\begin{array}$$` (Option B) | Visual table, 0 model changes, uses existing display-math pipeline | **Chosen** |
| Monospace field (Option C) | True handwritten look but ~150-250 LOC model/parser/renderer change | Rejected (separate feature) |

**Rationale**: KaTeX display math is already used in other concepts (e.g. `concept-gauss-ejemplo`). The `rich-text-parser` segments `$$...$$` as display-mode math. `TheoryCard` renders via `katex-display`. No new code paths.

### Decision: "Importante:" marker (not "OJO:")

| Option | Tradeoff | Decision |
|--------|----------|----------|
| "OJO:" | Colloquial, borderline for Ingenium voice | Rejected |
| "Importante:" | Neutral, consistent with educational material | **Chosen** |
| "Atención:" | Valid but less common in the repo | Rejected |

### Decision: 5 paragraphs (not 4)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| 4 paragraphs (merge γ+δ) | Fewer entries but callout buried mid-paragraph | Rejected |
| 5 paragraphs (dedicated callout) | Clean separation, each idea = 1 paragraph | **Chosen** |

**Rationale**: The proposal suggested 4-5. Splitting the cociente (P4-γ) from the monic callout (P4-δ) gives the callout its own `<div>`, making it visually distinct. The reconciliation (P4-ε) also deserves its own block since it's the "do this to get the final answer" step.

## Data Flow

```
unit-2.json (P4 string array)
       │
       ▼
  ConceptBlock.bodyParagraphs  ──→  TheoryCard.tsx (map divs)
       │                                      │
       ▼                                      ▼
  rich-text-parser.ts               RichText.tsx → KaTeX
  (segment $$...$$ as display)      (katex-display class)
```

No new data flow. The existing pipeline handles the KaTeX `array` as it handles any other `$$...$$` block.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `content/matematica/theory/unit-2.json` | Modify | Replace P4 (line 175) with 5 new bodyParagraphs entries |
| `src/domain/__tests__/content-loaders.test.ts` | Modify | Raise cap from `<=6` to `<=10` in `EXPANDED_U2_IDS` branch (line 553) |
| `src/domain/__tests__/copy-strings-acceptance.test.ts` | Modify | Raise cap from `<=6` to `<=10` (line 236) |

## Interfaces / Contracts

No new interfaces. The change uses the existing `ConceptBlock.bodyParagraphs: readonly string[]` contract. The KaTeX content is a string with `$$...$$` delimiters — the parser already segments this as display math.

### JSON escaping reference for the KaTeX table

```json
"$$\\begin{array}{c|cccc}\n-\\tfrac{3}{2} & 8 & 0 & 0 & 27 \\\\\n                &   & -12 & 18 & -27 \\\\\n\\hline\n                & 8 & -12 & 18 & 0 \\\\\n\\end{array}$$"
```

Key escapes: `\\` → `\\\\` in JSON (KaTeX sees `\\`), `$` unescaped, `\n` for line breaks within the string.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | JSON validity | `node -e "JSON.parse(require('fs').readFileSync('content/matematica/theory/unit-2.json','utf8'))"` |
| Unit | Paragraph cap in content-loaders | `EXPANDED_U2_IDS` branch: `<=6` → `<=10` |
| Unit | Paragraph cap in copy-strings | `<=6` → `<=10` |
| Unit | Voice gate | Existing forbidden-strings check — verify no new violations |
| Integration | KaTeX renders as display math | Existing `TheoryCard.test.tsx:276-296` covers `$$...$$` → `katex-display` |
| E2E | Mobile no-overflow | Playwright screenshot at 375×812 viewport of `/learn/matematica/mat.u2.factorizacion` |

## Migration / Rollout

No migration required. Pure content + test cap adjustment. Revert is `git revert`.

## Open Questions

- [ ] **Mobile overflow**: KaTeX `c|cccc` with 5 columns should fit ~250-300px in math font at 375px. sdd-apply MUST validate visually before committing. If overflow occurs, reduce to 4 paragraphs (merge P4-γ with P4-β) or adjust column spec.
- [ ] **Paragraph count**: 5 paragraphs brings the concept to 10 total (P1-P3 original + P4α/β/γ/δ/ε + P5 + P6). The cap at 10 is tight. If content evolves further, the cap will need another raise.
