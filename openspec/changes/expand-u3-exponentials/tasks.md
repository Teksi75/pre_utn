# Tasks: Expand U3 Exponenciales Practice Bank

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~600 (no lock) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 (stacked-to-main) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units (cumulative RED→GREEN)

| Unit | Goal | PR | Focused test | Runtime harness | Rollback |
|------|------|----|--------------|-----------------|----------|
| 1 | RED 8-item → GREEN `.03, .6–.8` + `.4.difficulty` 1→3 | PR 1 | `pnpm run test:run -- u3-exponentials-coverage.test.ts` | `pnpm run typecheck && pnpm run build` | Revert + del test |
| 2 | Extend RED → 12-item + d4 → GREEN `.9–.12` | PR 2 | `pnpm run test:run -- u3-exponentials-coverage.test.ts` | `pnpm run test && pnpm run typecheck && pnpm run build` | Revert `.9–.12` + drop asserts |
| 3 | Extend RED → FINAL 17 → GREEN `.13–.17` + loader/shape + E2E + verify | PR 3 | `pnpm run test:e2e -- exponenciales-practice.spec.ts` | `pnpm run test && pnpm run typecheck && pnpm run build` | Revert `.13–.17` + drop FINAL + e2e |

## Phase 1: Work Unit 1 — RED 8-item → GREEN

- [x] 1.1 RED `u3-exponentials-coverage.test.ts`: bank length === 8; order `.2,.03,.3,.4,.5,.6,.7,.8` (lexical `.03 < .3`); difficulty `[1,2,3,3,3,3,3,3]`; ≥4 families; ≥2 types.
- [x] 1.2 RED same file: byte-stable on `.2,.3,.5`; `.4` may change ONLY `difficulty` (→3).
- [x] 1.3 `unit-3.json`: change `.4.difficulty` 1→3 (only field).
- [x] 1.4 Append `.03` (d=2 MC), `.6` (d=3 TF), `.7` (d=3 fill-blank scalar), `.8` (d=3 MC); 1.1 GREEN.

## Phase 2: Work Unit 2 — RED 12-item → GREEN

- [x] 2.1 Extend RED same test: bank length === 12; order `.2,.03,.3,.4,.5,.6,.7,.8,.9,.10,.11,.12`; difficulty `[1,2,3,3,3,3,3,3,4,4,4,4]`; ≥6 families; ≥3 types.
- [x] 2.2 Append `.9` (d=4 MC), `.10` (d=4 numerical scalar), `.11` (d=4 TF), `.12` (d=4 MC); 2.1 GREEN.

## Phase 3: Work Unit 3 — RED FINAL 17 → GREEN

- [x] 3.1 Extend RED same test: bank length === 17; full order `.2,.03,.3,.4,.5,.6,.7,.8,.9,.10,.11,.12,.13,.14,.15,.16,.17`; difficulty `[1,2,3,3,3,3,3,3,4,4,4,4,5,5,5,5,5]`; ≥8 families; d1–5; ≥2 d=5; ≥3 types.
- [x] 3.2 Append `.13` (d=5 MC), `.14` (d=5 MC), `.15` (d=5 MC), `.16` (d=5 MC), `.17` (d=5 fill-blank scalar); 3.1 GREEN.
- [x] 3.3 RED then GREEN `content-loaders-u3.test.ts`: bank length === 17; `loadSkillBank` non-empty + zero new diagnostics; U3 threshold `=== 24` non-regression.
- [x] 3.4 RED then GREEN `u3-exercise-shape.test.ts`: `numerical` scalar (no `, ; = { }`); MC `expectedAnswer` ∈ `options`; tag via `loadFeedbackContent("unit-3")`.
- [x] 3.5 Create `exponenciales-practice.spec.ts` via `drivePracticeFlow`. Assert: reachable; theory/example render; prompts for one of each type; options/field per type; post-answer feedback.
- [x] 3.6 `pnpm run test && pnpm run typecheck && pnpm run build`; green per unit.
- [x] 3.7 Confirm rollback: removing 13 entries + `.4.difficulty = 1` returns prior 4-entry bank. Skip `STATUS.json` + blocked prior U3 files.
