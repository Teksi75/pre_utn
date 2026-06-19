# Tasks: Expand Factorization Worked Examples

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 550–650 total |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 planning/STATUS → PR 2 content contract → PR 3 disclosure/browser integration |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|---|---|---|---|
| 1 | Register the change and publish its reviewable SDD plan | PR 1 | Targets `main`; includes `openspec/changes/STATUS.json` and planning artifacts; ~320 lines |
| 2 | Establish the nine-example semantic contract and canonical content | PR 2 | Targets `main` after PR 1 merges; includes JSON, domain test, and apply-progress updates; ~232 lines |
| 3 | Make disclosures intrinsic-height and verify shared responsive behavior | PR 3 | Targets `main` after PR 2 merges; component and browser tests included; ~220–280 lines |

## Phase 1: Content Contract — Work Unit 2

- [ ] 1.1 **RED:** Create `src/domain/__tests__/factorizacion-worked-examples.test.ts`; assert ordered IDs `6,7,2,8,1,3,4,5,9`, nine unique validated examples, nondecreasing Cases 1–7, preserved Case 6 trio, sequential steps, repeated `finalAnswer`, expansion check, canonical trace, and focused error note. Run `pnpm exec vitest run src/domain/__tests__/factorizacion-worked-examples.test.ts` and record the expected failure.
- [ ] 1.2 **GREEN:** Modify `content/matematica/examples/unit-2.json`; add IDs 6–9 for Cases 1, 2, 4, and 7, reorder all nine exactly as designed, and satisfy every semantic invariant without changing IDs/content identity 1–5.
- [ ] 1.3 **REFACTOR:** Consolidate semantic test helpers without snapshotting prose; rerun the focused test and `pnpm run test` before the Unit 2 commit.

## Phase 2: Disclosure Contract — Work Unit 3

- [x] 2.1 **RED:** Create `src/components/practice/__tests__/WorkedExamplesSection.test.tsx` and `WorkedExampleCard.test.tsx`; assert closed bodies are unmounted, toggles expose `aria-expanded`, and rendered markup has no fixed-height ceiling. Run both with `pnpm exec vitest run` and record failures.
- [x] 2.2 **GREEN:** Modify `src/components/practice/WorkedExamplesSection.tsx` and `WorkedExampleCard.tsx`; conditionally mount open bodies at intrinsic height, remove ceiling/overflow transitions, preserve controls, and add solution-toggle `aria-expanded`.
- [x] 2.3 **REFACTOR:** Share only local test fixtures/helpers where duplication obscures behavior; rerun both component tests and `pnpm run test`.

## Phase 3: Shared Flow and Responsive Verification — Work Unit 3

- [x] 3.1 **RED:** Extend `tests/e2e/specs/factorizacion.spec.ts` for Learn's nine ordered cards/last solution, Practice's matching initial sequence, and desktop plus 375px reachability with `scrollWidth <= clientWidth`; confirm the test fails before final integration.
- [x] 3.2 **GREEN/REFACTOR:** Resolve only integration defects exposed by the E2E test, keeping the canonical loader/model and exercise flow unchanged; run `pnpm exec playwright test tests/e2e/specs/factorizacion.spec.ts`.
- [x] 3.3 Verify Unit 2 with `pnpm run test`, `pnpm run typecheck`, and `pnpm run build`; inspect `git diff --stat` and keep each PR below 400 changed lines.
