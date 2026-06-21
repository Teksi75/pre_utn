# Tasks: Practice Theory Disclosures

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150–220 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | auto-chain (no chain needed) |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain relaxation + UI gating + selective U2 lifts | PR 1 | Single PR; tests + content included |

## Phase 1: Domain Contract (RED → GREEN)

- [x] 1.1 In `src/domain/__tests__/theory.test.ts`, add RED case asserting `validateTheoryNode` accepts `notation: []` and `commonMistakes: []` when `concepts` and `canonicalTrace` are present.
- [x] 1.2 Update existing rejection expectations in `src/domain/__tests__/theory.test.ts` so `notation`/`commonMistakes` empty arrays no longer trigger errors; keep missing-`concepts`/`canonicalTrace` rejection assertions.
- [x] 1.3 In `src/domain/models/theory.ts`, relax `validateTheoryNode`: drop the length checks for `notation` and `commonMistakes` while keeping array type presence; preserve all `concepts`, `id`, `canonicalTrace` invariants.
- [x] 1.4 Run `pnpm run test -- src/domain/__tests__/theory.test.ts` until green.

## Phase 2: TheoryCard Visibility (RED → GREEN)

- [x] 2.1 In `src/components/practice/__tests__/TheoryCard.test.tsx`, add RED cases: populated notation shows `Ver notación`; empty notation hides it; mixed case shows only `Ver errores comunes` (use `renderToStaticMarkup` string assertions, no jsdom).
- [x] 2.2 In `src/components/practice/TheoryCard.tsx`, wrap the notation button block (lines ~123–141) in `node.notation.length > 0 && (…)`; wrap the common-mistakes button block (lines ~144–162) in `node.commonMistakes.length > 0 && (…)`.
- [x] 2.3 Re-run `pnpm run test -- src/components/practice/__tests__/TheoryCard.test.tsx` until green.

## Phase 3: U2 Content Lifts

- [x] 3.1 In `content/matematica/theory/unit-2.json`, audit each node; add node-level `notation`, `commonMistakes`, and/or `practicePrompts` only where existing concept blocks supply real source material (lift verbatim warnings).
- [x] 3.2 Leave definitional nodes with empty/absent arrays; do NOT add filler to satisfy symmetry.
- [x] 3.3 In `src/domain/__tests__/catalog-content.test.ts`, add U2 assertions: `loadTheoryContent("unit-2")` validates; selected source-backed nodes expose populated disclosures; no node gains synthetic filler (verify by spot-checking definitional nodes still empty).

## Phase 4: Voice Guard (if needed)

- [x] 4.1 New U2 disclosure strings do not introduce tutor/personalization phrasings; existing copy-strings gate covers the change. Skipped.

## Phase 5: Verification

- [x] 5.1 `pnpm run test` — full suite green (executed via `pnpm vitest run`: 2479 tests passed).
- [x] 5.2 `pnpm run typecheck` — no errors.
- [x] 5.3 `pnpm run build` — succeeds.
- [x] 5.4 Manually spot-check `/practice` U2 in browser: empty disclosures are hidden; populated disclosures still toggle and list entries. Completed by user visual review.
