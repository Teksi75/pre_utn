# Tasks: Add Interval Set Visual

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 750–900 (domain + parser + layout + renderer + U3 content + tests) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: domain + parser + layout + tests → PR 2: renderer + render tests + U3 content |
| Delivery strategy | auto-forecast |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain types, parser, layout helper, all unit tests (no React) | PR 1 | Base: `feature/add-interval-set-visual`; pure domain; tests included |
| 2 | `IntervalSetVisual.tsx`, renderer routing, renderer tests, U3 content | PR 2 | Base: PR 1 branch; integration + content; depends on PR 1 |

## Phase 1: Domain Types (TDD — RED first)

- [x] 1.1 RED — Add failing parser tests in `src/domain/visuals/__tests__/parse.test.ts` covering single bounded `[a,b]`, left ray `(-∞,a)`, right ray `[a,+∞)`, two-segment exterior union `(-∞,-3) ∪ (7,+∞)`, fraction label `-5/2`, invalid infinity direction, finite bound ordering, missing `notation`, empty `intervals`, and notation/segment count drift.
- [x] 1.2 GREEN — Add `IntervalSegment` and `IntervalSetVisual` interfaces to `src/domain/visuals/types.ts`; extend `PedagogicalVisual` discriminated union with the new variant.

## Phase 2: Parser (TDD — GREEN, then REFACTOR)

- [x] 2.1 GREEN — Implement `parseIntervalSet()` in `src/domain/visuals/parse.ts`: validate non-empty `intervals`, finite bound ordering, infinity direction (`negative` on lower / `positive` on upper), open inclusion on infinity endpoints, finite `value`/`label`, and best-effort union-part count from `notation` (`∪`, `\cup`, ` U `).
- [x] 2.2 GREEN — Add `case "interval-set"` to the `parsePedagogicalVisual` switch.
- [x] 2.3 GREEN — Add `assertIntervalSet()` narrowing helper to `src/domain/visuals/__tests__/helpers.ts`.
- [x] 2.4 REFACTOR — Tighten parser error messages; keep all parser tests green.

## Phase 3: Layout Helper (TDD)

- [x] 3.1 RED — Add failing layout tests in `src/domain/visuals/__tests__/layout.test.ts`: union-wide finite `[min,max]` domain, fraction-label tick geometry, all-infinite ray case, no `NaN`/`Infinity` coordinates anywhere, gap-aware padding.
- [x] 3.2 GREEN — Add `computeIntervalSetLayout()` to `src/domain/visuals/layout.ts` returning ticks, finite segment positions, arrow origins, and a safe scale.
- [x] 3.3 REFACTOR — Extract shared tick math; keep layout pure and deterministic.

## Phase 4: Renderer (TDD)

- [ ] 4.1 RED — Add failing `renderToStaticMarkup` tests in a new `src/components/math-visuals/__tests__/IntervalSetVisual.test.tsx` covering responsive `viewBox` (no fixed `width="520"`), arrows on infinity sides, hatching/sombreado, open/closed finite endpoints, fraction labels, `role="img"`, `aria-label`, `<title>`, `<desc>`, and stable `data-interval-region`, `data-interval-side`, `data-endpoint`, `data-hatching` attributes.
- [ ] 4.2 GREEN — Create `src/components/math-visuals/IntervalSetVisual.tsx` with one shared axis, closed/open circles on finite bounds, arrows on infinity sides, hatching, and ONE `<text>` for the union notation.
- [ ] 4.3 GREEN — Add `case "interval-set"` routing in `src/components/math-visuals/PedagogicalVisualRenderer.tsx`.
- [ ] 4.4 GREEN — Extend `src/components/math-visuals/__tests__/PedagogicalVisualRenderer.test.tsx` with an `interval-set` describe block (basic render, two-segment union, infinity arrows on both sides, fraction label).
- [ ] 4.5 REFACTOR — Deduplicate styling tokens with `SignChartVisual`/`DistanceOnLineVisual`; keep tests green.

## Phase 5: U3 Content Integration

- [ ] 5.1 Add `interval-set` visuals to `content/matematica/theory/unit-3.json` for `concept-inl-resolver` `(-∞,2]` and `concept-inv-caso-mayor` `(-∞,-3) ∪ (7,+∞)`.
- [ ] 5.2 Add `interval-set` visuals to `content/matematica/examples/unit-3.json` for `example-inecuaciones-lineales-1` step 3, `example-inecuaciones-lineales-2` step 3 (keep its existing `sign-chart` and ADD `interval-set`), and `example-inecuaciones-valor-absoluto-2` step 4.
- [ ] 5.3 Extend U3 content-loader / regression tests so the new visuals parse.

## Phase 6: Verification & Documentation

- [ ] 6.1 Document the distinction (`sign-chart` = sign reasoning vs `interval-set` = final solution set) in the existing visual-design doc under `docs/sdd/`, referencing ADR-007/008.
- [ ] 6.2 Run `pnpm run test`, `pnpm run typecheck`, `pnpm run build`. All green.
- [ ] 6.3 After both PRs merge, run `pnpm run audit:branches` and clean up per `AGENTS.md` branch-management rule; update `openspec/changes/STATUS.json`.
