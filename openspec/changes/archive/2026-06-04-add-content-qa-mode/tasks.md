# Tasks: Add Content QA Mode

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 80-130 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-chain |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Env-gated direct URL QA access | PR 1 | Includes tests and SDD artifacts. |

## Phase 1: RED Tests

- [x] 1.1 In `src/app/practice/__tests__/start-skill.test.ts`, assert normal mode blocks `mat.u1.valor_absoluto` when `intervalos` is unmet.
- [x] 1.2 Add QA-mode test: ready `mat.u1.valor_absoluto` opens with unmet `intervalos` when option/flag is true.
- [x] 1.3 Add safety tests: unknown/non-pilot requests stay blocked and `buildAccessibleSkillMap()` still marks unmet prereqs inaccessible.

## Phase 2: GREEN Implementation

- [x] 2.1 In `src/app/practice/start-skill.ts`, add `isContentQaModeEnabled()` using exact `NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE === "true"`.
- [x] 2.2 Add optional `AnalyzeRequestedSkillOptions` to `analyzeRequestedSkill()` without changing existing callers.
- [x] 2.3 After pilot-map and `isSkillReady()` checks pass, return `ready` when QA mode is enabled; otherwise keep prerequisite logic unchanged.

## Phase 3: REFACTOR / Verification

- [x] 3.1 Keep `src/domain/` untouched; QA flag remains in app-layer practice code.
- [x] 3.2 Run `pnpm run test` and confirm `start-skill.test.ts` covers the spec scenarios.
- [x] 3.3 Run `pnpm run typecheck` and `pnpm run build`.
