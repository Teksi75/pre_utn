# Proposal: Theory Text Readability — Aprender + Práctica

## Intent

Long theory blocks in `TheoryCard` (Ruffini, Teorema del resto, sign warnings) render as wall-of-text paragraphs. Students lose track of steps, definitions, and warnings. Both `/learn/matematica/[skillId]` and `/practice` share the same rendering path.

## Scope

### In Scope
- Add `bodyParagraphs?: readonly string[]` to `ConceptBlock` in domain model
- Parser reads `bodyParagraphs` when present; validates each element as non-empty string
- `TheoryCard` renders paragraph chunks via `RichText` per chunk; falls back to legacy `body`
- Migrate 3 Ruffini concepts in `unit-2.json` to `bodyParagraphs` (drop `body` to prevent drift)
- New tests: domain model + parser + `TheoryCard` rendering

### Out of Scope
- `WorkedExampleCard` same pattern — deferred to follow-up issue
- `unit-1.json` migration — untouched, legacy path preserved
- Copy/branding changes — no content rewording

## Capabilities

### New Capabilities
- `theory-paragraph-model`: `ConceptBlock` supports `bodyParagraphs` array alongside legacy `body`; parser validates per-element non-empty strings

### Modified Capabilities
- None (existing specs like `math-render-safety` cover KaTeX pipeline; this change uses it per-chunk without changing its contract)

## Approach

Hybrid backward-compatible model (exploration approach 4):
1. Domain: `bodyParagraphs?: readonly string[]` on `ConceptBlock` — TDD RED first
2. Parser: `parseConceptBlock` reads `bodyParagraphs` when present; runtime-validates each element
3. Component: `TheoryCard` prefers `bodyParagraphs` (renders `<div><RichText/></div>` per chunk — `<div>` avoids invalid nesting when display math produces block-level KaTeX); else legacy `<div><RichText/></div>`
4. Content: migrate 3 Ruffini concepts in `unit-2.json`; remove `body` from migrated entries
5. Verification: screenshots at `/learn/matematica/mat.u2.ruffini_resto` and `/practice` Ruffini flow

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/models/theory.ts` | Modified | Add `bodyParagraphs` to `ConceptBlock` |
| `src/domain/catalog/content-loaders.ts` | Modified | `parseConceptBlock` reads new field |
| `src/components/practice/TheoryCard.tsx` | Modified | Render loop for paragraph array |
| `content/matematica/theory/unit-2.json` | Modified | Migrate 3 Ruffini concepts |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Math boundary — unmatched `$` leaks as plain text | Low | `parseRichTextSegments` per chunk; validate matched pairs |
| KaTeX regression on migrated content | Low | Run `katex-rendering.test.ts` in verify phase |
| TDD gap if domain test missing | Low | Explicit RED test in task plan |

## Rollback Plan

Revert `theory.ts` model change, `content-loaders.ts` parser branch, `TheoryCard.tsx` render path, and `unit-2.json` migration. Legacy `body` field is untouched in non-migrated concepts; no data loss.

## Dependencies

- None — uses existing `RichText` + `parseRichTextSegments` pipeline

## Success Criteria

- [ ] `TheoryCard` renders paragraph-separated text for Ruffini concepts
- [ ] Math expressions `P(x)`, `(x−a)`, `P(a)` render via KaTeX in each chunk
- [ ] Legacy `body`-only concepts still render correctly
- [ ] `pnpm run test && pnpm run typecheck && pnpm run build` pass
