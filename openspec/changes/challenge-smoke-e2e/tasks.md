# Tasks: Challenge Smoke E2E

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines total | ~1,100–1,600 across 6 PRs |
| 400-line budget risk | High for original PR1 and PR4; resolved by 6-PR split |
| Chained PRs recommended | Yes |
| Suggested split | 6 PRs stacked-to-main (PR1a→PR1b→PR2→PR3→PR4a→PR4b) |
| Delivery strategy | force-chained; stacked-to-main |
| Chain strategy | stacked-to-main |
| Size exception needed | No (all PRs ≤ 400 lines after split) |

Decision needed before apply: Yes — user must confirm 6-PR split (vs original 4-PR preference).
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium (after split, all PRs within budget)

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1a | Fixture builders + vitest tests | PR 1a | `buildPracticeProgressFixture`, `buildStudentProfileFixture`, `buildAdvancedPracticeFixture` + their vitest companions; base=main |
| 1b | Config + helpers + README + placeholder | PR 1b | `playwright.config.ts`, `selectors.ts`, `practice-flow.ts`, README, `_placeholder.spec.ts`, `package.json` updates; base=main (after PR1a merged) |
| 2 | Canary: `potencias_raices.spec.ts` | PR 2 | Real flow, no fixture; validates `drivePracticeFlow` + `driveChallengeFlow`; base=main (after PR1b merged) |
| 3 | Sample specs U1 (3 specs) | PR 3 | `intervalos`, `conjuntos_numericos`, `logaritmos`; base=main (after PR2 merged) |
| 4a | Sample specs U2, first 3 | PR 4a | `polinomios_basico`, `operaciones_polinomios`, `factorizacion` (prereq bypass); base=main (after PR3 merged) |
| 4b | Sample specs U2, last 2 | PR 4b | `gauss`, `mcm_mcd_polinomios`; base=main (after PR4a merged) |

---

## Goal

Decompose the `challenge-smoke-e2e` change into 6 independently-verifiable, stacked-to-main PRs, each ≤ 400 changed lines, each with its own CI gate, each deliverable and rollbackable independently. The dependency order is strict: PR1a → PR1b → PR2 → PR3 → PR4a → PR4b.

---

## Phase 1a: Fixtures — builders + vitest tests (PR 1a)

**Goal:** Bootstrap the 3 fixture builders with strict TDD (vitest companion tests before implementation). No Playwright, no `playwright.config.ts` yet. These are plain TypeScript builders.

- [x] 1a.1 Branch `feat/challenge-smoke-e2e-pr1a-fixtures` from main.
- [x] 1a.2 Create `tests/e2e/fixtures/__tests__/practice-progress.test.ts`: write failing vitest test for `buildPracticeProgressFixture({ studentId, skillId, completedExerciseIds?, accuracyBySkill? })` — verify output shape matches `PracticeProgressMap` (v2 student-scoped, per `src/lib/practice-progress.ts:60`).
- [x] 1a.3 Implement `tests/e2e/fixtures/practice-progress.ts`: export `buildPracticeProgressFixture`. Green the test from 1a.2.
- [x] 1a.4 Create `tests/e2e/fixtures/__tests__/student-profile.test.ts`: write failing vitest test for `buildStudentProfileFixture({ studentId })` — verify output matches `StudentProfile` shape (per `src/domain/student-profile/index.ts:14`).
- [x] 1a.5 Implement `tests/e2e/fixtures/student-profile.ts`: export `buildStudentProfileFixture`. Green the test from 1a.4.
- [x] 1a.6 Create `tests/e2e/fixtures/__tests__/advanced-practice.test.ts`: write failing vitest test for `buildAdvancedPracticeFixture({ skillId, challengeAttempts? })` — verify output shape matches `AdvancedPracticeProgress` (per `src/lib/advanced-practice-progress.ts:43`).
- [x] 1a.7 Implement `tests/e2e/fixtures/advanced-practice.ts`: export `buildAdvancedPracticeFixture`. Green the test from 1a.6.
- [x] 1a.8 Run `pnpm test:run -- "fixtures/__tests__"` — all 3 vitest companion tests pass.
- [x] 1a.9 Open PR 1a; merge to main with `--no-ff`. — PR #33 opened, reviewed, and merged (commit e3149aa) on 2026-06-17.

---

## Phase 1b: Config + helpers + README + placeholder (PR 1b)

**Goal:** Complete the Playwright infrastructure. The config and helpers depend on the fixture builders (same source truth for `PracticeProgressMap` shape), but are independent of the vitest tests.

- [x] 1b.1 Branch `feat/challenge-smoke-e2e-pr1b-config` from main (after PR1a merged).
- [x] 1b.2 Add `@playwright/test` to `devDependencies`; run `pnpm install`. Add `test:e2e` + `test:e2e:install` scripts to `package.json`.
- [x] 1b.3 Create `playwright.config.ts` at project root: `port 3100`, `chromium`, `webServer.command: "pnpm start --port 3100"`, `testDir: "tests/e2e"`, `trace: "retain-on-failure"`, `headless: true`, `webServer.timeout: 120_000`.
- [x] 1b.4 Create `tests/e2e/helpers/selectors.ts`: central selector constants — `OPT_IN_HEADING`, `INTENTAR_BTN`, `FINALIZAR_BTN`, `COUNTER_REGEX`, `STATUS_BANNER_ROLE`, `READINESS_LABEL`, `DONE_HEADER`, `CONTINUE_BTN`. Pure constants, no logic.
- [x] 1b.5 Create `tests/e2e/helpers/practice-flow.ts`: implement `drivePracticeFlow(page, { skillId, exerciseAnswers })` and `driveChallengeFlow(page, { skillId })` using the pseudocode from design.md. No TDD (Playwright-based; tested via canary in PR2).
- [x] 1b.6 Create `tests/e2e/README.md`: document conventions (`*.spec.ts` naming, `tests/e2e/` location, why separate from Vitest), how to run (`pnpm test:e2e`, `pnpm test:e2e:install`), how to debug (Playwright trace viewer), and the Chromium-only MVP note.
- [x] 1b.7 Create `tests/e2e/specs/_placeholder.spec.ts`: single empty `test('placeholder', () => {})` so `pnpm test:e2e` boots without crashing on an empty test dir.
- [x] 1b.8 Update `openspec/changes/STATUS.json`: add `challenge-smoke-e2e` entry with `status: "in_progress"`, `branch: null`.
- [x] 1b.9 Run `pnpm test:e2e --grep "placeholder"` — sanity check that Playwright boots without crashing. Passed in 3.7s after ~2 min Chromium install (~297 MB downloaded).
- [x] 1b.10 Open PR 1b; merge to main with `--no-ff`. — PR #34 opened, GGA retro-validated (PASSED), merged (commit fc00df2) on 2026-06-17.

---

## Phase 2: Canary — `mat.u1.potencias_raices.spec.ts` (PR 2)

**Goal:** Real-flow canary, no fixture shortcut. Validates that `drivePracticeFlow` + `driveChallengeFlow` work end-to-end against the production bundle.

- [x] 2.1 Branch `feat/challenge-smoke-e2e-pr2-canary` from main (after PR1b merged).
- [x] 2.2 Write `tests/e2e/specs/potencias_raices.spec.ts`: drives `/practice?skill=mat.u1.potencias_raices` from theory through 6 exercises to `ChallengeOptInBlock`, clicks "Intentar desafíos", answers both challenges with known-correct MC options, asserts opt-in, asserts 2 challenges available, asserts readiness score displayed. No fixture (fresh localStorage). Asserts E1, E2, E3, E5 (skip = E4 not asserted in canary).
- [x] 2.3 Run the canary locally (`pnpm test:e2e -- "potencias_raices"`). Iterate on selectors / wait conditions until it passes. This is the integration调试.
- [x] 2.4 Remove `tests/e2e/specs/_placeholder.spec.ts` (replaced by the real canary).
- [x] 2.5 Run `pnpm test:run` — confirm ≥ 2053 tests still passing (no regression).
- [x] 2.6 Open PR 2; merge to main with `--no-ff` — PR #35 merged via commit 8d82839f on 2026-06-18.

---

## Phase 3: Sample specs U1 — 3 specs (PR 3)

**Goal:** 3 U1 sample specs using the fixture + helpers. Each is compact (~80-110 lines) because `driveChallengeFlow` handles the heavy lifting.

- [x] 3.1 Branch `feat/challenge-smoke-e2e-pr3-u1` from main (after PR2 merged). → actual: `feat/challenge-smoke-e2e-pr3-u1-samples`.
- [x] 3.2 Write `tests/e2e/specs/intervalos.spec.ts`: fixture for `mat.u1.intervalos`, `drivePracticeFlow` → opt-in → `driveChallengeFlow`, assert E1 (opt-in + 2 challenges) + E2 (navigate to challenge) + E3 (2 challenges) + E4 (skip closes opt-in) + E5 (readiness displayed) + store independence.
- [x] 3.3 Write `tests/e2e/specs/conjuntos_numericos.spec.ts`: same shape as 3.2 for `mat.u1.conjuntos_numericos`.
- [x] 3.4 Write `tests/e2e/specs/logaritmos.spec.ts`: same shape as 3.2 for `mat.u1.logaritmos`.
- [x] 3.5 Run all 3 locally (`pnpm test:e2e -- "intervalos|conjuntos_numericos|logaritmos"`). 6/6 passed in 5.5 min.
- [x] 3.6 Run `pnpm test:run` — 2063/2063 passed (no regressions).
- [x] 3.7 Open PR 3; merge to main with `--merge` (preserves history; fast-forward because no concurrent main commits). Branch deleted. → PR #39, commit `159b473`.

### PR3 helper deltas (necessary, documented in commit)

- `selectors.ts`: `ANSWER_FORM_TRUE_FALSE` constant.
- `practice-flow.ts`: `answerTrueFalse()` with post-submit fail-fast contract.
- `practice-flow.ts`: continue button detection tightened to `button.w-full:not([type="submit"]).last()` (defensive: skip retry button and form submit).
- 3 sample specs: `test.setTimeout(180_000)` to match `PRACTICE_FLOW_TIMEOUT_MS`.

### PR3 follow-up (NOT in this PR; deferred)

- KaTeX/LaTeX matcher for MC radio options (no `aria-label` exposed by KaTeX). Specs use "first option" fallback for flow-only assertions. Will need a richer matcher for correctness assertions in PR4a/4b or beyond.
- Continue button selector still relies on `w-full` class. A `data-testid` would be cleaner but requires a `src/**` change (out of PR scope).

---

## Phase 4a: Sample specs U2, first 3 (PR 4a)

**Goal:** 3 U2 specs. `factorizacion` uses prereq bypass via `accuracyBySkill['operaciones_polinomios'] = 0.8` in the fixture.

- [x] 4a.1 Branch `feat/challenge-smoke-e2e-pr4a-u2-samples` from main (after PR3 merged).
- [x] 4a.2 Write `tests/e2e/specs/polinomios_basico.spec.ts`: fixture for `mat.u2.polinomios_basico`, assert all 5 scenarios E1–E5 + store independence.
- [x] 4a.3 Write `tests/e2e/specs/operaciones_polinomios.spec.ts`: same shape for `mat.u2.operaciones_polinomios`.
- [x] 4a.4 Write `tests/e2e/specs/factorizacion.spec.ts`: fixture seeds `accuracyBySkill['mat.u2.operaciones_polinomios'] = 0.8` (prereq bypass, per D8) AND `accuracyBySkill['mat.u2.ruffini_resto'] = 0.8` (factorizacion has both as prereqs per skill-catalog.ts:115). Same 5-scenario assertion shape.
- [x] 4a.5 Run all 3 locally (`pnpm test:e2e -- "polinomios_basico|operaciones_polinomios|factorizacion"`). 6/6 passed in 1.7 min.
- [x] 4a.6 Run `pnpm test:run` — 2063/2063 passed (no regressions).
- [x] 4a.7 Open PR 4a; merge to main with `--merge` (fast-forward, preserves history; no concurrent main commits). Branch deleted. → PR #40, merge commit `d469cf8`.

### PR4a scope notes

- **No helper changes**. U2 only uses MC and TEXT forms (both already handled by PR3 helper). No new form types discovered.
- **Encounter order = catalog order** for all 3 U2 skills (unlike `logaritmos` which had a shuffle). Encounter discovery was done via a single debug spec that covered all 3 skills, then deleted before commit.
- **Prereq seeds**:
  - `polinomios_basico`: none.
  - `operaciones_polinomios`: `accuracyBySkill: { "mat.u2.polinomios_basico": 0.8 }` (threshold 0.7, per start-skill.test.ts:142).
  - `factorizacion`: `accuracyBySkill: { "mat.u2.operaciones_polinomios": 0.8, "mat.u2.ruffini_resto": 0.8 }` (both prereqs per skill-catalog.ts:115).
- **Diff**: 3 files, +370 lines (under 400-line budget by ~14%).
- **Validations**: vitest 2063/2063, typecheck 0 errors, build clean, e2e 6/6 in 1.7 min, git fsck clean, GGA pre-commit passed.

---

## Phase 4b: Sample specs U2, last 2 (PR 4b)

**Goal:** 2 remaining U2 specs. Both straightforward (no prereq bypass).

- [ ] 4b.1 Branch `feat/challenge-smoke-e2e-pr4b-u2-second` from main (after PR4a merged).
- [ ] 4b.2 Write `tests/e2e/specs/gauss.spec.ts`: fixture for `mat.u2.gauss`, assert E1–E5 + store independence.
- [ ] 4b.3 Write `tests/e2e/specs/mcm_mcd_polinomios.spec.ts`: fixture for `mat.u2.mcm_mcd_polinomios`, same 5-scenario shape.
- [ ] 4b.4 Run both locally (`pnpm test:e2e -- "gauss|mcm_mcd_polinomios"`). Iterate until green.
- [ ] 4b.5 Run `pnpm test:run` — confirm regression-free.
- [ ] 4b.6 Open PR 4b; merge to main with `--no-ff`.

---

## Verification Conditions

### Per-PR gates (before merge)

| Gate | Command | Expected |
|------|---------|----------|
| Existing tests | `pnpm test:run` | ≥ 2053 tests passing |
| Typecheck | `pnpm typecheck` | Clean (exit 0) |
| Build | `pnpm build` | Green (7/7 routes) |
| Pre-commit (GGA) | `git commit` | GGA runs on `tests/e2e/**` if covered by `.gga` glob |

### PR-specific gates

| PR | Additional Gate |
|----|----------------|
| PR1a (fixtures) | `pnpm test:run -- "fixtures/__tests__"` — all 3 vitest tests green |
| PR1b (config) | `pnpm test:e2e --grep "placeholder"` — empty spec runs without crashing |
| PR2 (canary) | `pnpm test:e2e -- "potencias_raices"` — canary passes; `pnpm test:run` still ≥ 2053 |
| PR3 (U1) | `pnpm test:e2e -- "intervalos\|conjuntos_numericos\|logaritmos"` — all 3 pass; canary still passes |
| PR4a (U2 first 3) | `pnpm test:e2e -- "polinomios_basico\|operaciones_polinomios\|factorizacion"` — all 3 pass; all previous pass |
| PR4b (U2 last 2) | `pnpm test:e2e -- "gauss\|mcm_mcd_polinomios"` — both pass; all previous pass |

### Final merge-to-main gate

- Vercel preview deployment green
- `pnpm test:e2e` — all 9 specs pass
- `pnpm test:run` ≥ 2053
- `pnpm typecheck` clean
- `pnpm build` green
- `pnpm audit:branches` reports no zombie branches

---

## Dependency Graph

```
PR1a (fixtures + vitest) ──► PR1b (config + helpers + README) ──► PR2 (canary)
                                                                            │
                                                                            ▼
PR4b (gauss, mcm_mcd) ◄── PR4a (polinomios_basico, operaciones_polinomios, factorizacion)
                                                                            │
                                                                            ▼
                                                          PR3 (intervalos, conjuntos_numericos, logaritmos)
```

All PRs merge to `main` in order (stacked-to-main). Each child PR targets `main` after the previous PR is merged. If GitHub shows previous slices in a child diff, retarget/rebase until the diff is clean.

---

## Work-Unit Commits

Each PR should be 1–3 atomic commits. Recommended structure:

| PR | Commits |
|----|---------|
| PR1a | 1. `fixtures: add practice-progress fixture + vitest` → 2. `fixtures: add student-profile fixture + vitest` → 3. `fixtures: add advanced-practice fixture + vitest` |
| PR1b | 1. `e2e: add @playwright/test + scripts to package.json` → 2. `e2e: add playwright.config.ts + selectors.ts` → 3. `e2e: add practice-flow helpers` → 4. `e2e: add README + placeholder spec` |
| PR2 | 1. `e2e: add canary spec for potencias_raices (real flow)` |
| PR3 | 1. `e2e: add U1 specs (intervalos, conjuntos_numericos, logaritmos)` |
| PR4a | 1. `e2e: add U2 specs first 3 (polinomios_basico, operaciones_polinomios, factorizacion)` |
| PR4b | 1. `e2e: add U2 specs last 2 (gauss, mcm_mcd_polinomios)` → 2. `e2e: update STATUS.json to done` |

---

## Out of Scope

- CI workflow changes (`.github/workflows/*` untouched)
- Vitest changes
- Source code changes (`src/**` untouched — hard constraint)
- Multi-browser matrix (chromium-only for MVP)
- Visual regression testing
- Pedagogical audit of the 30 challenges (separate change)
- `openspec/specs/challenge-exercises/spec.md` (domain contract unchanged until archive)

---

## Open Questions

**Q1 (RESOLVED 2026-06-17):** User approved 6 PRs chained stacked-to-main, no `size:exception`. The dependency order is PR1a → PR1b → PR2 → PR3 → PR4a → PR4b, all merging directly to main. Original 4-PR preference was based on intuition; line-count analysis showed PR1 (~545) and PR4 (~400-550) would exceed the 400-line budget, and the user preferred splitting over `size:exception` to keep every PR reviewable and within budget.

**Q2 (RESOLVED 2026-06-17):** User confirmed 9 spec files total. The canary for `mat.u1.potencias_raices` covers that skill end-to-end with real-flow (no fixture); the 8 sample specs cover the remaining skills with fixture + drive-real. No duplicate `potencias_raices` sample. Final spec count: 1 canary + 8 sample = 9 files, one per skill/coverage unit.

---

## Rollback Checklist

After rolling back any PR:
- `pnpm test:run` passes (no regression)
- `pnpm typecheck` passes
- `pnpm build` passes
- Previously merged stacked PRs remain intact
- `openspec/changes/STATUS.json` reflects actual merged state
