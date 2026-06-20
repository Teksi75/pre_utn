# Tasks: Implement Unit 3 Mathematics (Ecuaciones y sistemas)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1800–2350 across 3 PRs |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 (stacked-to-main) |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | PR | Base |
|------|------|----|------|
| 1 | Domain + content (taxonomy/detectors + theory/examples/feedback + tests) | PR 1 → main | main; ~900–1100 lines |
| 2 | Exercises + catalog/loader wiring + threshold/baseline | PR 2 → main | main; ~700–900 lines |
| 3 | Pilot activation + UI copy + test fixtures + verify | PR 3 → main | main; ~200–350 lines |

## Non-Goals

- No UI redesign, new routes, evaluators, or domain modules.
- Do NOT remove/migrate the 5 legacy U3 entries in `exercises.json`; new `unit-3.json` loads before the monolith and wins dedup. Orphan cleanup is a follow-up issue.
- No new exercise types. `free-response`/`symbolic` banned; `numerical` only for single-scalar; MC for intervals/systems/two-root. No `pageReferences`.
- No Física, no Units 4–6.

## Phase 1 — PR 1: U3 Domain + Content (Base: main → main)

- [x] 1.1 TDD `error-taxonomy-u3.test.ts` + append 8 `u3_*` tags to `src/domain/error-taxonomy/index.ts`.
- [x] 1.2 TDD `error-tagging-u3.test.ts` + extend `src/domain/evaluator/error-tagging.ts` with deterministic U3 detectors; skip ambiguous free-text.
- [x] 1.3 Create `content/matematica/theory/unit-3.json`: 8 `TheoryNode`s, `concepts` only; `canonicalTrace` to `UNIDAD3_matemática.pdf`; no `pageReferences`.
- [x] 1.4 Create `content/matematica/examples/unit-3.json`: 16–24 `WorkedExample`s, ≥2 per U3 skill.
- [x] 1.5 Create `content/matematica/feedback/unit-3.json`: 8–12 `FeedbackMapping`s, ≥1 per U3 skill.
- [x] 1.6 Verify: `pnpm run test && pnpm run typecheck && pnpm run build`.
  - **PR 1 review fixes verification (2026-06-20)**:
    - `pnpm run test`: ✅ 2195/2195 tests pass (132 files), +2 regression tests (U3 factorizacion & signo_desigualdad edge cases)
    - `pnpm run typecheck`: ✅ 0 errors
    - `pnpm run build`: ✅ 7/7 routes built
    - Restored legacy `u3_direccion_desigualdad` tag (removed during PR 1, restored per review BLOCKER)
    - Fixed `isU3FactorizacionCuadraticaError`: now validates student number is actual ±√n root (not arbitrary distractors)
    - Fixed `isU3SignoDesigualdadError`: now validates boundary value match before tagging sign-direction errors
    - Corrected slope swap pedagogical note: reciprocal (not sign change) in theory + examples
    - Replaced confusing `+(-y)` vs `-y` common mistake with coherent elimination-sign error
    - Cleaned up stale duplicate scaffolding in error-tagging-u3.test.ts

## Phase 2 — PR 2: U3 Catalog + Exercises (Base: main → main)

- [x] 2.1 Create `content/matematica/exercises/unit-3.json`: 32 NEW `Exercise`s (4 per U3 skill × 8 skills), IDs `ex.u3.<skill>.>=2`, no duplicate IDs against `exercises.json`.
- [x] 2.2 TDD `content-loaders-u3.test.ts` + in `content-loaders.ts`: import U3 content; add `RAW_REGISTRY.theory/examples/feedback["unit-3"]`.
- [x] 2.3 Add `UNIT_EXERCISE_FILES[3] = unit3Exercises as unknown` and `UNIT_THRESHOLDS["unit-3"] = 24` (per PR 2 user constraint, NOT 32).
- [x] 2.4 TDD `catalog-split-equivalence.test.ts` (bumped `BASELINE_TOTAL` to `184` = `152 + 32`; added `BASELINE_UNIT_3 = 37` = `32 new + 5 legacy .1`) + in `catalog/index.ts`: call `addExercises(_unit3Exercises, "unit-3", PER_SKILL_SKILL_IDS)` BEFORE `addExercises(_exercisesJson, "main", ...)`.
- [x] 2.5 TDD `u3-exercise-shape.test.ts`: no `free-response`/`symbolic`; no `pageReferences`; numerical only for single-scalar; MC for intervals/systems/pairs; IDs ≥2; ≥4 per skill in unit-3.json; legacy non-collision.
- [x] 2.6 Verify: `pnpm run test` (✅ 2233/2233 pass), `pnpm run typecheck` (✅ 0 errors), `pnpm run build` (✅ 7/7 routes).

## Phase 3 — PR 3: U3 Pilot Activation (Base: main → main)

- [x] 3.1 TDD `pilot-skills.test.ts` (23 total, 8 with `unitKey === "unit-3"`, `PILOT_SKILL_UNIT_MAP["mat.u3.recta"] === "unit-3"`) + append 8 `PilotSkill` entries to `src/domain/catalog/pilot-skills.ts` after U2.
- [x] 3.2 Extend `UNIT_LABELS`/`UNIT_KEYS` in `src/app/learn/matematica/page.tsx` with `"unit-3": "Unidad 3 — Ecuaciones y sistemas"`.
- [x] 3.3 Update `src/app/page.tsx` line 89 pilot badge: `"Unidades 1 y 2"` → `"Unidades 1, 2 y 3"`; brand voice preserved.
- [x] 3.4 Update `src/app/learn/page.tsx` description to mention U3 alongside U1/U2.
- [x] 3.5 Replace U3 "not-pilot" fixtures in `start-skill.test.ts` and `practice-link.test.ts` with `mat.u4.perimetro_area_volumen` (U4 ID, intentionally still coming-soon).
- [x] 3.6 Update `accessibility.test.ts`: U3 accuracy entries; assert U1→U3 prereqs (`valor_absoluto`→`inecuaciones_valor_absoluto`, `potencias_raices`→`exponenciales`, `logaritmos`→`logaritmicas`).
- [x] 3.7 Add `STATUS.json` entry for `implement-unit-3-mathematics` (`status: in-progress`, `branch: null` since stacked-to-main with no feature branch).
- [x] 3.8 Final verify: `pnpm run test` (✅ 2252/2252, +19 new), `pnpm run typecheck` (✅ 0 errors), `pnpm run build` (✅ 7/7 routes including `/learn/matematica` and dynamic `/learn/matematica/[skillId]`).

### PR 3 Implementation Notes (2026-06-20)

- **Domain fix surfaced by PR 3:** `readiness.ts` had two correctness bugs that surfaced when activating U3 as a pilot unit:
  1. **Vacuous-truth violation:** skills whose exercises all declared empty `commonErrorTags` arrays returned `hasFeedback=false`, making them appear not-ready. U3 first-wave exercises legitimately use empty tag arrays per spec `U3-FB-RULE-001`.
  2. **Cross-unit legacy pollution:** the 5 legacy `exercises.json` U3 monolith entries carry `u2_*` tags from an older migration era. The unit-3 feedback library does not cover them, and the previous readiness check (only looking at the current unit's feedback library) treated them as uncovered.
  - Both fixed in `src/domain/catalog/readiness.ts::getSkillComponents`: tags are now filtered to `u{unit}_*` namespace for the current unit, and the vacuous-truth case (`unitTags.length === 0`) returns `present=true`. 5 new tests in `readiness.test.ts` cover the contract.
- **Brand voice preserved:** the home dashboard pilot badge and the `/learn` description copy were updated to mention U3 without changing the established voice (no "profe digital" or personalization claims).
- **No legacy U3 monolith edits:** the 5 legacy `ex.u3.*.1` entries in `content/matematica/exercises.json` remain untouched, per spec `U3-LEGACY-001`/`U3-LEGACY-002`.
- **Branch name:** spec task 3.7 mentioned `feat/implement-unit-3-mathematics-pr3` but the actual work is happening on `main` directly per the chained-prs-stacked-to-main strategy. STATUS.json entry uses `branch: null` to reflect reality; orchestrator decides branch policy when committing.
