# Tasks: issue-36-theory-readability — Teoría Paragraph Model

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 150–200 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-forecast |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain + Parser + Tests + Component + Migration | PR 1 | All in one PR; below 400-line budget |

## Phase 1: Domain Model

- [x] 1.1 Add `bodyParagraphs?: readonly string[]` to `ConceptBlock` interface in `src/domain/models/theory.ts`
- [x] 1.2 Add `bodyParagraphs` to `makeConcept` test helper in `src/domain/__tests__/theory.test.ts`

## Phase 2: Parser Validation (TDD — RED first)

- [x] 2.1 RED: Add test in `src/domain/__tests__/theory.test.ts` — concept with valid `bodyParagraphs` passes validation
- [x] 2.2 RED: Add test in `src/domain/__tests__/theory.test.ts` — legacy `body`-only concept still valid (regression)
- [x] 2.3 RED: Add test in `src/domain/__tests__/theory.test.ts` — empty string element in `bodyParagraphs` throws with offending index
- [x] 2.4 RED: Add test in `src/domain/__tests__/theory.test.ts` — empty array `[]` normalizes to `undefined`
- [x] 2.5 GREEN: Implement `bodyParagraphs` parsing in `parseConceptBlock` in `src/domain/catalog/content-loaders.ts` — read array, validate each element non-empty string, fail with `bodyParagraphs[${i}]` index on empty/non-string, normalize empty array to undefined

## Phase 3: TheoryCard Component (TDD — RED first)

- [x] 3.1 RED: Create `src/components/practice/__tests__/TheoryCard.test.tsx` — mock node with `bodyParagraphs: ["P1.", "P2."]`, assert 2 paragraph block wrappers render (uses `<div>` not `<p>` to avoid invalid display-math nesting)
- [x] 3.2 RED: Add test — legacy `body`-only node renders single `<RichText>` (regression guard)
- [x] 3.3 GREEN: Modify `TheoryCard.tsx` lines 62-64: use `bodyParagraphs?.length ? bodyParagraphs.map(p => <div key={i}><RichText text={p} /></div>) : <RichText text={concept.body} />` with `space-y-2` wrapper div (<div> avoids invalid nesting when display math renders block-level KaTeX)

## Phase 4: Content Migration

- [x] 4.1 Split `concept-ruffini-procedimiento.body` into `bodyParagraphs` (steps 1-4 as para 1, remainder/quotient as para 2); remove `body`
- [x] 4.2 Split `concept-teorema-resto.body` into 3 paragraphs (definition, factor implication, example); remove `body`
- [x] 4.3 Split `concept-ruffini-signo.body` into 2 paragraphs (warning, verification rule); remove `body`

## Phase 5: Verification

- [x] 5.1 Run `pnpm run test` — all domain and component tests pass (2085/2085)
- [x] 5.2 Run `pnpm run typecheck` — no TypeScript errors
- [x] 5.3 Run `pnpm run build` — clean build
- [ ] 5.4 Manual anchor: visit `/learn/matematica/mat.u2.ruffini_resto` — verify Ruffini concepts render as paragraph-separated blocks with KaTeX math in each paragraph
- [ ] 5.5 Manual anchor: visit `/practice` with Ruffini flow — verify theory step renders paragraph-separated content matching Aprender