# Apply Progress: Expand Factorization Worked Examples

## Scope

- Delivery: stacked-to-main PR slice 3
- Work unit: Disclosure Contract + Shared Flow — Work Unit 3
- Boundary: tasks 2.1–2.3 and 3.1–3.3; Phase 1 (tasks 1.1–1.3) complete in prior batch

## Completed Tasks

- [x] 1.1 RED semantic contract
- [x] 1.2 GREEN canonical content
- [x] 1.3 REFACTOR and verification
- [x] 2.1 RED disclosure contract tests
- [x] 2.2 GREEN conditional rendering + aria-expanded
- [x] 2.3 REFACTOR and full suite verification
- [x] 3.1 RED E2E extension (Learn nine cards, Practice order, responsive 375px)
- [x] 3.2 GREEN/REFACTOR E2E integration fixes
- [x] 3.3 Final verification (test, typecheck, build, diff budget)

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1 | `src/domain/__tests__/factorizacion-worked-examples.test.ts` | Domain unit | 66/66 existing loader/model tests passed | 4/4 tests failed against the five-example collection | 4/4 passed | Multiple semantic invariants and all nine entries | Helpers keep assertions semantic | 
| 1.2 | Same | Domain unit | Covered by task 1.1 baseline | Reuses recorded RED | 4/4 passed after adding and ordering canonical content | Nine examples across seven cases | No production refactor needed |
| 1.3 | Same | Domain unit | Focused test 4/4 passed | Reuses recorded RED | Focused 4/4 and full suite 2120/2120 passed | Semantic helpers cover different cases and invariants | No prose snapshots; helpers retained |
| 2.1 | `WorkedExamplesSection.test.tsx` + `WorkedExampleCard.test.tsx` | Component unit | 129/129 existing test files passed | 10/15 tests failed (content mounted when closed, no aria-expanded, maxHeight present) | 15/15 passed | Both components: closed=unmounted, aria-expanded=false, no maxHeight | No shared helpers needed; fixtures are local |
| 2.2 | Same | Component unit | 129/129 existing test files passed | Reuses recorded RED | 15/15 passed after conditional rendering + aria-expanded | Conditional mount removes ceiling and overflow-hidden | No production refactor beyond disclosure |
| 2.3 | Same + full suite | Component unit | Focused 15/15 passed | Reuses recorded RED | Focused 15/15 + full suite 2136/2136 passed | No duplication to consolidate | Full suite green |
| 3.1 | `factorizacion.spec.ts` (E2E) | Browser integration | Existing E2E legacy tests pass | 3/5 E2E tests failed (selector ambiguity, Practice flow navigation) | 5/5 passed | Learn nine cards, Practice first example, responsive 375px | E2E selectors use exact match and flow-aware navigation |
| 3.2 | Same | Browser integration | 2/5 legacy E2E tests pass | Reuses recorded RED | 5/5 passed after selector fix and Practice flow navigation | Exact text match for final answer; flow buttons for Practice | No production code changes needed |
| 3.3 | Full suite + typecheck + build | Verification | All layers green | N/A | 2136 tests, typecheck clean, build green | diff --stat: 251 lines (Phase 2+3), 371 total | Under 400-line budget |

## Verification Log

- RED (Phase 1): `CI=true pnpm exec vitest run src/domain/__tests__/factorizacion-worked-examples.test.ts` — expected failure, 4 tests failed (five examples found; canonical case markers absent).
- GREEN (Phase 1): `CI=true pnpm exec vitest run src/domain/__tests__/factorizacion-worked-examples.test.ts` — 4/4 passed after one content correction to make the Case 6 error signal explicit.
- REFACTOR (Phase 1): focused test 4/4 passed; `CI=true pnpm run test` passed 127 files and 2120 tests.
- Baseline (Phase 1): `CI=true pnpm exec vitest run src/domain/__tests__/worked-example.test.ts src/domain/__tests__/content-loaders.test.ts` — 66/66 passed.
- RED (Phase 2): `pnpm exec vitest run WorkedExamplesSection.test.tsx WorkedExampleCard.test.tsx` — 10/15 failed (content mounted when closed, no aria-expanded, maxHeight/overflow-hidden present).
- GREEN (Phase 2): Same command — 15/15 passed after conditional rendering + aria-expanded on both components.
- REFACTOR (Phase 2): `pnpm run test` — 129 files, 2136 tests passed.
- RED (Phase 3): `npx playwright test factorizacion.spec.ts` — 3/5 failed (selector ambiguity, Practice flow navigation).
- GREEN (Phase 3): Same command — 5/5 passed after exact selector and flow-aware navigation.
- Final (Phase 3): `pnpm run test` 2136/2136, `pnpm run typecheck` clean (after fixing optional `section` field), `pnpm run build` green, `git diff --stat` 251 lines (Phase 2+3) / 371 total.

## Fresh-Review Remediation

| Finding | RED | GREEN | REFACTOR |
|---|---|---|---|
| Case 6 direct-method example referenced another example instead of expanding its own `finalAnswer` | Strengthened the semantic assertion to require an equation inside the verification segment; focused run failed only for `example-factorizacion-4` | Added the complete expansion `(2x + 3)(4x² − 6x + 9) = … = 8x³ + 27`; focused test passed 4/4 | Kept the assertion semantic and independent of exact prose |
| Case 7 did not follow the explored non-monic recommendation | Added a Case 7 structural assertion for a leading coefficient different from 1; focused run failed for the monic example | Replaced it with canonical Case 7 content for `2x² + 7x + 3`; focused test passed 5/5 | Used roots plus `a(x − x₁)(x − x₂)` to expose the leading-coefficient misconception |

- Remediation verification: `CI=true pnpm exec vitest run src/domain/__tests__/factorizacion-worked-examples.test.ts` — 5/5 passed.
- Remediation full suite: `CI=true pnpm run test` — 127 files and 2121 tests passed.

## Deviations

- TypeScript strict: `trace.section` in Phase 1 test was accessed without optional chaining (`trace.section.trim()`) but `CanonicalTrace.section` is optional. Fixed with `trace.section?.trim()`.
- E2E selectors: `getByText('(2x + 1)(x + 3)')` matched two elements (step explanation + final answer). Fixed with `{ exact: true }`.
- E2E Practice navigation: Practice page starts at theory/select phase, not directly at example. Added flow-aware button click before asserting example visibility.
