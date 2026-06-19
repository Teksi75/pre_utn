# Tasks: Section Card Topic Count

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~25 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-forecast |
| Chain strategy | not needed |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: not-needed
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full implementation | PR 1 | All 3 tasks in single PR |

## Phase 1: Core Substitution

- [x] 1.1 `src/app/learn/matematica/page.tsx` line 64-66: replace `{node.concepts?.[0]?.title ?? "Teoría del tema"}` with `{node.concepts.length === 1 ? "1 tema" : `${node.concepts.length} temas`}`

## Phase 2: Content Rename

- [x] 2.1 `content/matematica/theory/unit-2.json` line 65: rename `"3. División larga de polinomios (procedimiento)"` → `"3. División de polinomios"`

## Phase 3: Testing

- [x] 3.1 Create `src/app/learn/matematica/__tests__/section-card-content.test.ts`: source-level test asserting card shows count (e.g., `"temas"`) and does NOT contain `node.concepts?.[0]?.title` literal or `"Teoría del tema"` fallback
  - **Superseded (2026-06-19 post-apply review)**: the source-level `section-card-content.test.ts` was replaced by behavior-level `src/app/learn/matematica/__tests__/section-card-content.test.tsx` (187 lines, 6 tests using `renderToStaticMarkup` from `react-dom/server` + mocked wrappers for `next/link`, `MathWatermark`, `DirectionalTransition`, and a focused `loadTheoryContent` mock for the singular pluralization case). The replacement is necessary because a source-level read+regex test can pass while the rendered UI is wrong. See `apply-progress.md` "Post-Apply Review Fixes" Finding 1 for the full rationale.
- [x] 3.2 Add focused data-assertion regression guard to `src/domain/__tests__/content-loaders.test.ts` (post-verify SUGGESTION #1): assert `concept-op-division` title is `"3. División de polinomios"` (and NOT the old `"División larga de polinomios (procedimiento)"`) via `loadTheoryContent("unit-2")` → find the `mat.u2.operaciones_polinomios` node → find the `concept-op-division` concept → assert on the typed `ConceptBlock.title` field. This is a domain data assertion (goes through the actual loader), not a source-regex.
- [x] 3.3 Verify: `pnpm run test`, `pnpm run typecheck`, `pnpm run build`
