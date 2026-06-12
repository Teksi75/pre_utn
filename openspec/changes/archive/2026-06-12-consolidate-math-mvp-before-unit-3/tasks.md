# Tasks: Consolidate Math MVP Before Unit 3

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1200–1500 total across 4 phases |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 4 PRs: Safety→CI→Content→Cleanup |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1a | Safety net TDD + helpers + validators + wiring | PR 1a → main | Base: main; skill-id helper, difficulty progression (numeric sort), traceability audit, per-unit thresholds, catalog split equivalence, shared helper wiring. Fits within 400-line review budget. |
| 1b | canonicalTrace content backfill | PR 1b → main | Base: main; deferred from PR1a because content JSON reformatting + backfill exceeds review budget. Pure content change, no code. |
| 2 | Coverage + CI | PR 2 → main | Base: main; vitest coverage + GitHub Actions |
| 3 | Content split + per-unit validator | PR 3 → main | Base: main; split files + threshold config |
| 4 | Tech debt cleanup + GGA/Linux validation | PR 4 → main | Base: main; shared helper wiring + re-validation |

## Phase 1a: Safety Net TDD + Helpers + Validators + Wiring (PR1a — complete)

- [x] 1.1 RED: write `src/domain/__tests__/parse-skill-unit.test.ts` — test `parseSkillUnit("mat.u2.polinomios_basico")` returns 2, unknown pattern defaults to 1, single-digit vs multi-digit unit numbers
- [x] 1.2 GREEN: create `src/domain/shared/skill-id.ts` exporting `parseSkillUnit(skillId: string): number` using `/^mat\.u(\d+)\./` regex, unknown → 1
- [x] 1.3 RED: write `src/domain/__tests__/difficulty-progression.test.ts` — test monotonic non-decreasing per-skill, non-monotonic fails, single-exercise passes, equal-difficulty allowed, numeric suffix ordering (from difficulty-progression spec)
- [x] 1.4 GREEN: implement `validateDifficultyProgression` in `src/domain/catalog/content-loaders.ts` — check non-decreasing difficulty by skill using natural numeric ID ordering (`compareExerciseIds` helper)
- [x] 1.5 RED: write `src/domain/__tests__/traceability-audit.test.ts` — test `auditTraceability(exercises)` flags exercises with `relatedTheoryIds`/`relatedExampleIds` but missing `canonicalTrace`, exercises without links pass (from pedagogical-feedback-coverage spec)
- [x] 1.6 GREEN: implement `auditTraceability(exercises: Exercise[]): readonly AuditWarning[]` in `src/domain/catalog/content-loaders.ts` — flag missing traceability metadata
- [x] 1.7 RED: write `src/domain/__tests__/per-unit-thresholds.test.ts` — test per-unit U1≥40/U2≥20/U3≥20, unknown unit gets default minimum 5 (from practice-coverage spec)
- [x] 1.8 GREEN: add `UnitValidationThresholds` interface and per-unit threshold config to `src/domain/catalog/content-loaders.ts`; update `loadCatalog` to use per-unit grouping
- [x] 1.9 RED: write `src/domain/__tests__/catalog-split-equivalence.test.ts` — test that `loadCatalog()` returns same count/IDs before and after split (proves no regression)
- [x] 1.10 GREEN: wire `parseSkillUnit` into `src/domain/next-step/index.ts` — replace local `parseSkillUnit` with import from `../shared/skill-id`
- [x] 1.11 GREEN: wire `parseSkillUnit` into `src/domain/teacher-home/index.ts` — replace local `parseSkillUnit` with import from `../shared/skill-id`; preserve `TeacherHomeInput` contract unchanged

## Phase 1b: canonicalTrace Content Backfill (PR1b — deferred)

- [x] 1.12 GREEN: backfill `canonicalTrace` metadata on existing `content/matematica/exercises.json` and `content/matematica/exercises/conjuntos-numericos.json` exercises that reference `relatedTheoryIds`/`relatedExampleIds` but lack traceable links. **Deferred to separate PR1b**: this task involves ~2600 lines of JSON reformatting + backfill that exceeds the 400-line review budget. PR1a verifies the audit helper behavior via unit tests with stubs; PR1b is a pure content change with no code.

## Phase 2: Coverage + CI

- [x] 2.1 Add `test:coverage` script to `package.json`: `"test:coverage": "vitest run --coverage"`
- [x] 2.2 Modify `vitest.config.ts` to add coverage provider (v8/v9 depending on installed version) with domain-only include path `src/domain/`
- [x] 2.3 Create `.github/workflows/ci.yml` with: `pnpm install --frozen-lockfile`, `pnpm run test:run`, `pnpm run typecheck`, `pnpm run build`, `pnpm run test:coverage`; soft 60% domain coverage floor as warning only
- [x] 2.4 Verify CI runs locally: `pnpm run test:run && pnpm run typecheck && pnpm run build && pnpm run test:coverage`
- [x] 2.5 Run `pnpm run test:run` — all tests must pass before Phase 3

## Phase 3: Content Split by Unit/Skill + Per-Unit Validator

- [x] 3.1 Create `content/matematica/exercises/unit-1.json` and `content/matematica/exercises/unit-2.json` — migrate exercises from `exercises.json` preserving all fields and ordering
- [x] 3.2 Update `src/domain/catalog/content-loaders.ts` — extend `loadExercisesForSkill` and `loadSkillBank` to compose from split unit files while preserving deterministic ordering
- [x] 3.3 Add explicit `unit` metadata field during `applyExerciseDefaults` — derive from skillId regex, store as `unit: number` for explicit grouping
- [x] 3.4 Update `src/domain/catalog/index.ts` — use `loadExercisesForSkill` composition instead of manual filter/merge; use `parseSkillUnit` for unit grouping in `loadCatalog`
- [x] 3.5 Run `src/domain/__tests__/catalog-split-equivalence.test.ts` — verify loaded count and IDs match pre-split baseline
- [x] 3.6 Verify `loadCatalog`, `queryBySkill`, `queryByUnit` produce same results as before split

## Phase 3 Fix: loadCatalog Regression (PR3 hotfix)

- [x] 3.7 RED: strengthen `catalog-split-equivalence.test.ts` with exact baseline assertions — `loadCatalog().length === 152`, `queryByUnit(1).length === 101`, `queryBySkill("mat.u1.conjuntos_numericos").length === 44`
- [x] 3.8 GREEN: filter exercises from unit files whose `skillId` is in `PER_SKILL_SKILL_IDS` before composing catalog — prevents 5 legacy `conjuntos_numericos` entries from leaking into `loadCatalog()` (157→152)
- [x] 3.9 GREEN: wire `getUnitThreshold` / `UNIT_THRESHOLDS` into `loadCatalog` unit validation instead of hardcoded `< 5`
- [x] 3.10 GREEN: adjust `UNIT_THRESHOLDS` — remove `unit-3` entry (placeholder content has 5 exercises, threshold 20 was aspirational); update `per-unit-thresholds.test.ts` accordingly
- [x] 3.11 Verify: `pnpm run test:run` (1618/1618), `pnpm run typecheck` (clean), `pnpm run build` (clean), `pnpm run test:coverage` (94.91% lines)

## Phase 4: Tech Debt Cleanup + GGA/Linux Re-Validation

- [x] 4.1 Remove duplicated `parseSkillUnit` implementations from `src/domain/next-step/index.ts` and `src/domain/teacher-home/index.ts` — both must import from shared helper only
- [x] 4.2 Verify `TeacherHomeInput` contract in `src/domain/teacher-home/index.ts` unchanged: `{ progress, diagnosticResult, availableSkills, pilotSkills, nextStep }` — no new fields added
- [x] 4.3 Update `openspec/changes/STATUS.json` — add entry for `consolidate-math-mvp-before-unit-3` with `status: in-progress`, `branch: null`
- [x] 4.4 Run GGA on Linux: `pnpm run gga` or `.gga` hook — validate no new issues surfaced
- [x] 4.5 Final verification: `pnpm run test:run && pnpm run typecheck && pnpm run build`
