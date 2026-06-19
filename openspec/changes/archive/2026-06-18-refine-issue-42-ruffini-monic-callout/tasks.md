# Tasks: Ruffini Monic Callout — Visual Table + Callout Refinement

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~75–110 net |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Content + tests | PR 1 | Single PR: T1 + T2 + T3 + T4 |

## Phase 1: Content Replacement

- [x] 1.1 In `content/matematica/theory/unit-2.json`, replace the single `bodyParagraphs[3]` (P4, line 175 — the 700-char Ruffini prose sentence) with 5 new entries: P4-α (KaTeX `$$\begin{array}{c|cccc}...$$` table with coefficients [8,0,0,27] and intermediate [-12,18,-27]), P4-β ("Como el resto es 0, la división es exacta."), P4-γ (cociente `8x² − 12x + 18` with divide-by-2 reconciliation leading to `4x² − 6x + 9`), P4-δ ("Importante: Ruffini divide por el factor mónico asociado..." callout naming `x + 3/2` and the connection to `2x + 3 = 2·(x + 3/2)`), P4-ε (final reconciliation `$$\frac{8x^2-12x+18}{2}=4x^2-6x+9$$` and factorization `(2x+3)(4x^2-6x+9)`). Verify: `node -e "JSON.parse(require('fs').readFileSync('content/matematica/theory/unit-2.json','utf8'))"` runs clean.

## Phase 2: Test Cap Adjustments

- [x] 2.1 In `src/domain/__tests__/content-loaders.test.ts` line 553, change `<=6` to `<=10` in the `EXPANDED_U2_IDS` branch; update the comment to note the 5–10 range. Other 16 U2 concepts remain `<=4`.
- [x] 2.2 In `src/domain/__tests__/copy-strings-acceptance.test.ts` line 236, change `<=6` to `<=10`; update the describe block comment to reference "5–10 paragraph bridge".

## Phase 3: Verification

- [x] 3.1 Run `pnpm run test` — all tests must pass.
- [x] 3.2 Run `pnpm run typecheck` — zero errors.
- [x] 3.3 Run `pnpm run build` — 7/7 routes build clean.
- [x] 3.4 Visual check at 375×812 viewport: table legible, no horizontal overflow.

## Phase 4 (Conditional)

- [ ] 4.1 **Only if T3.4 fails**: reduce to 4 paragraphs by merging P4-γ + P4-ε; adjust test caps accordingly; re-run gates.
