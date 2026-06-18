# Proposal: Challenge Smoke E2E

**Change**: `challenge-smoke-e2e`
**Date**: 2026-06-17

## Why

The `challenge-exercises-expansion` change (archived today) expanded challenge content to all 15 pilot skills. The existing spec (`openspec/specs/challenge-exercises/spec.md`) covers unit-level contracts (loader, store, schema) but does NOT validate the **deployed bundle**. The user needs post-deploy smoke coverage: a Playwright suite that boots the real production server, exercises the challenge flow end-to-end, and confirms the opt-in → challenge → done path works in the actual browser.

**Why Playwright over Vitest:** Vitest runs in Node (no browser). `vitest.config.ts` excludes `*.spec.ts` so the suites won't conflict. Playwright is the natural fit for "smoke-test the deployed bundle".

## Scope

### In Scope

- `playwright.config.ts` at project root (port 3100, chromium, `webServer` auto-boot)
- `tests/e2e/` directory: 9 spec files + fixtures + helpers + README
- `package.json`: add `@playwright/test` devDep + `test:e2e` + `test:e2e:install` scripts
- `openspec/changes/STATUS.json`: add `challenge-smoke-e2e` entry

### Out of Scope

- CI workflow changes (`.github/workflows/*` untouched)
- Vitest changes
- Source code changes (`src/**` untouched — hard constraint)
- Multi-browser matrix (chromium-only for MVP)
- Visual regression testing
- Pedagogical audit of the 30 challenges (separate change)

## Capabilities

### New Capabilities

None — this is testing infrastructure, not a new domain capability.

### Modified Capabilities

None — the existing 5 requirements + 14 scenarios in `openspec/specs/challenge-exercises/spec.md` are the domain contract. The E2E suite is the test harness that validates the deployed bundle against that contract, not a new requirement. The spec stays unchanged.

## Approach

**Playwright + `addInitScript` for fixtures** (exploration alternative #1, recommended).

Key decisions from exploration:

1. **`@playwright/test` as devDep** + `playwright install chromium` (~150 MB browser binary).
2. **`playwright.config.ts`** at root: `testDir: "tests/e2e"`, `webServer.command: "pnpm start --port 3100"`, `baseURL: "http://localhost:3100"`, `headless: true`, `trace: "retain-on-failure"`.
3. **`tests/e2e/`** location (not `e2e/`, not `playwright/`). The `tests/` dir already exists (empty `.gitkeep`).
4. **`*.spec.ts` naming** — Playwright convention; `vitest.config.ts` glob is `*.test.ts` so no collision.
5. **`addInitScript` for fixtures** — seeds `pre-utn.profiles.v1` + `pre-utn.practice.v1` BEFORE the app's `useEffect` reads them. Wins the hydration race (`usePracticeFlow.ts:110-112`).
6. **Seed BOTH stores** in the same `addInitScript` block: `pre-utn.profiles.v1` (bypass `StudentGate`) + `pre-utn.practice.v1` (v2 student-scoped shape with known `studentId`, prereq accuracies ≥ 0.7 for `factorizacion`).
7. **Existing semantic markers** for selectors: `getByText('Terminaste la práctica base.')`, `getByRole('button', { name: 'Intentar desafíos' })`, `getByText(/^Desafío \d+ de \d+$/)`, `getByRole('status')`, etc. No new `data-testid` needed.
8. **1 canary** for `mat.u1.potencias_raices` (which serves as that skill's full smoke coverage) **+ 8 sample specs** for the remaining skills. Total: **9 spec files**.
9. **Port 3100** avoids conflict with developer's `pnpm dev` on 3000.
10. **Chromium-only** for MVP.

## 8 Scope Items × Test Assertions

| # | Scope Item | Spec Files | Assertion Approach |
|---|-----------|------------|-------------------|
| 1 | Opt-in appears | canary + 8 sample specs | `getByText('Terminaste la práctica base.')` + `getByRole('button', { name: 'Intentar desafíos' })` |
| 2 | Navigate to challenge mode | canary + 8 sample specs | Click "Intentar desafíos", assert `getByText(/^Desafío 1 de 2$/)` appears |
| 3 | 2 challenges per skill | all 9 specs | Assert counter goes `Desafío 1 de 2` → `Desafío 2 de 2` → done summary |
| 4 | Skip challenge | 8 sample specs | Click "Finalizar por ahora", assert `ChallengeDoneSummary` appears |
| 5 | Accept challenge | canary + 8 sample specs | Click "Intentar desafíos", answer first exercise, assert feedback banner (`role="status"`) |
| 6 | Readiness displayed | canary + 8 sample specs | Complete both challenges, assert `getByText('Nivel de preparación en desafíos')` + percentage |
| 7 | Store independence | 8 sample specs | After challenge attempts, `page.evaluate(() => localStorage.getItem('pre-utn.practice.v1'))` — assert unchanged from fixture |
| 8 | Failing challenges ≠ base mastery | canary | Fail a challenge, read `accuracyBySkill[skillId]` from localStorage, assert same as before |

## Honest Trade-off

**The fixture alone CANNOT trigger `phase === "complete"`.**

`phase` is React state inside `usePracticeFlow`, not derived from `localStorage` (`phases.ts:46`). The `complete` phase is reached when the last exercise is graded in the real UI. This means:

- **All 9 specs** (8 samples + canary) must drive the practice flow through the real UI to reach the `ChallengeOptInBlock`.
- The fixture's value is: (a) bypassing `StudentGate` (seeds `pre-utn.profiles.v1`), (b) seeding `accuracyBySkill` for prereq bypass (e.g., `factorizacion` needs `operaciones_polinomios` ≥ 0.7), (c) seeding a stable `studentId` so the per-student shape is predictable.
- **Estimated runtime:** ~5–10 min total (9 specs × 30–60s each, plus server boot). This is slow for "smoke" but it's the only way to validate the deployed bundle end-to-end without touching source.

**Alternative rejected:** A `?e2e=complete` query param the hook respects in dev mode — this would touch `usePracticeFlow.ts` and violate the "no architecture changes" rule.

## Affected Areas

| Path | Impact | Description |
|------|--------|-------------|
| `playwright.config.ts` | NEW | Playwright config: port 3100, chromium, webServer |
| `tests/e2e/fixtures/practice-progress.ts` | NEW | v2 student-scoped PracticeProgress fixture builder |
| `tests/e2e/fixtures/student-profile.ts` | NEW | Student profile fixture (bypass StudentGate) |
| `tests/e2e/fixtures/advanced-practice.ts` | NEW | AdvancedPracticeProgress fixture builder |
| `tests/e2e/helpers/selectors.ts` | NEW | Shared selector constants/helpers |
| `tests/e2e/specs/potencias_raices.spec.ts` | NEW | Canary: real flow, no fixture shortcut |
| `tests/e2e/specs/intervalos.spec.ts` | NEW | Sample skill spec |
| `tests/e2e/specs/conjuntos_numericos.spec.ts` | NEW | Sample skill spec |
| `tests/e2e/specs/logaritmos.spec.ts` | NEW | Sample skill spec |
| `tests/e2e/specs/polinomios_basico.spec.ts` | NEW | Sample skill spec |
| `tests/e2e/specs/operaciones_polinomios.spec.ts` | NEW | Sample skill spec |
| `tests/e2e/specs/factorizacion.spec.ts` | NEW | Sample skill spec (prereq bypass) |
| `tests/e2e/specs/gauss.spec.ts` | NEW | Sample skill spec |
| `tests/e2e/specs/mcm_mcd_polinomios.spec.ts` | NEW | Sample skill spec |
| `tests/e2e/README.md` | NEW | Convention docs (why `*.spec.ts`, why separate dir) |
| `package.json` | MODIFIED | Add `@playwright/test` devDep + 2 scripts |
| `openspec/changes/STATUS.json` | MODIFIED | Add `challenge-smoke-e2e` entry |
| `src/**` | **NO CHANGE** | Hard constraint: no source changes |
| `openspec/specs/challenge-exercises/spec.md` | **NO CHANGE** | Domain contract unchanged |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Playwright install adds ~150 MB to devDependencies | High | Document in README; `test:e2e:install` script isolates it |
| 5–10 min suite runtime is slow for "smoke" | High | Acknowledged; only way to validate deployed bundle without source changes. Can optimize later (parallel specs, shared server). |
| Vitest glob collision if someone uses `.test.ts` for E2E | Low | `*.spec.ts` convention + README documents why |
| `StudentGate` redirect timing | Medium | `addInitScript` seeds profiles before mount; test waits for post-hydration selector |
| Prereq bypass for `factorizacion` | Low | Fixture seeds `accuracyBySkill['operaciones_polinomios'] = 0.8` |
| Server boot timeout in CI (future) | Low | `webServer.timeout: 120_000` in config; CI is out of scope for now |

## Rollback Plan

Delete `tests/e2e/`, `playwright.config.ts`, and revert `package.json` + `STATUS.json` changes. No source code touched; zero risk to production.

## Dependencies

- `@playwright/test` (new devDep)
- `playwright install chromium` (system browser binary, one-time)
- Node ≥ 20 (already met)
- Existing challenge infra (loader, store, UI) — read-only dependency

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~750–1450 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes (subject to sdd-tasks confirmation) |
| Suggested split | 4 PRs chained stacked-to-main: (1) infra, (2) canary, (3) 4 specs U1, (4) 4 specs U2 |
| Delivery strategy | auto-forecast (C4) — orchestrator to confirm after sdd-tasks |
| Chain strategy | stacked-to-main (consistent with challenge-exercises-expansion) |
| Size exception needed | No (if 4-PR split is followed) |
| Decision needed before apply | Yes — user should confirm 4-PR split or single-PR-with-size-exception |

## Open Questions for the User

**Q1.** Are you OK with all 9 specs driving the real practice UI (8 samples + canary all need it because `phase === "complete"` is runtime state)? Or do you want a fast-but-invasive alternative (e.g., a `?e2e=complete` query param the hook respects only in `NODE_ENV !== 'production'`, which would touch `usePracticeFlow.ts` and violate the "no architecture changes" rule)? **Recommendation:** accept the real-UI approach.

**Q2.** Confirm the 4-PR split is acceptable, or do you want a single PR with `size:exception`? (The previous `challenge-exercises-expansion` used chained PRs, so 4-PR is consistent.)

**Q3.** Confirm `tests/e2e/` location (not `e2e/`, not `playwright/`, not `tests/e2e/challenge/`)?

**Q4.** Confirm chromium-only for MVP (no firefox/webkit)?

**Q5.** Confirm no CI wiring in this change (manual `pnpm test:e2e` only)?

## Verifiable Conditions

- [ ] `pnpm test:e2e` runs all 9 spec files and all 9 pass
- [ ] `pnpm test:run` still reports ≥ 2053 tests passing
- [ ] `pnpm typecheck` clean
- [ ] `pnpm build` green
- [ ] `pnpm audit:branches` reports no zombie branch after merge
- [ ] Canary test for `mat.u1.potencias_raices` does NOT use any fixture (real flow)
- [ ] 8 sample specs use the shared fixture helper; assertions on localStorage use `page.evaluate(() => localStorage.getItem(...))` after the action, not before
- [ ] `package.json` has both `test:e2e` and `test:e2e:install` scripts
