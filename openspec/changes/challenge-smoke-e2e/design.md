# Design: Challenge Smoke E2E

**Change**: `challenge-smoke-e2e`
**Date**: 2026-06-17
**Target Spec**: `openspec/specs/challenge-exercises/spec.md` (unchanged until archive)
**Type**: Delta (infrastructure + test harness)

## Goal

Add a Playwright-based smoke suite that boots the real production server, drives 10 skills through the practice flow → challenge opt-in → challenge completion path in a real Chromium browser, and validates the 5 spec scenarios (E1–E5) against the deployed bundle. Zero source code changes. The suite is additive infrastructure that confirms the challenge flow works end-to-end after deploy.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Playwright Runner (Chromium, headless)              │
│  playwright.config.ts                                │
│    testDir: "tests/e2e"                              │
│    webServer: pnpm start --port 3100                 │
└──────────────┬──────────────────────────────────────┘
               │ addInitScript (pre-hydration)
               ▼
┌─────────────────────────────────────────────────────┐
│  localStorage seeds                                  │
│    pre-utn.profiles.v1  → bypass StudentGate         │
│    pre-utn.practice.v1  → v2 student-scoped shape    │
│    pre-utn.advanced-practice.v1 → empty (default)    │
└──────────────┬──────────────────────────────────────┘
               │ page.goto(/practice?skill=<id>)
               ▼
┌─────────────────────────────────────────────────────┐
│  Real Next.js bundle (production mode, port 3100)    │
│    StudentGate → passes (activeStudentId set)        │
│    usePracticeFlow → loads from seeded localStorage  │
│    practice phases → complete → ChallengeFlow        │
│    ChallengeOptInBlock → ChallengeExerciseCard × 2   │
│    → ChallengeFeedback × 2 → ChallengeDoneSummary    │
└─────────────────────────────────────────────────────┘
```

The Playwright suite and Vitest suite are **completely independent**: Playwright runs browser-driven tests in Chromium against a production server; Vitest runs unit/integration tests in Node. They share no runtime. The only shared artifact is the production bundle. `vitest.config.ts` includes `["src/**/*.test.ts", "tests/**/*.test.ts"]` — the `*.spec.ts` extension used by Playwright is excluded by design.

## File Layout

| File | Action | Purpose |
|------|--------|---------|
| `playwright.config.ts` | NEW | Config: port 3100, chromium, `webServer` auto-boot, `testDir: "tests/e2e"`, `trace: "retain-on-failure"`, `headless: true` |
| `tests/e2e/fixtures/practice-progress.ts` | NEW | v2 student-scoped `PracticeProgress` fixture builder. Exports `buildPracticeProgressFixture({ studentId, skillId, completedExerciseIds, accuracyBySkill })`. Strict TDD: vitest companion required. |
| `tests/e2e/fixtures/student-profile.ts` | NEW | `StudentProfile` + `activeStudentId` fixture. Exports `buildStudentProfileFixture({ studentId })`. Strict TDD. |
| `tests/e2e/fixtures/advanced-practice.ts` | NEW | `AdvancedPracticeProgress` fixture builder. Exports `buildAdvancedPracticeFixture({ skillId, challengeAttempts? })` with empty `challengeAttempts` by default. Strict TDD. |
| `tests/e2e/helpers/selectors.ts` | NEW | Central selector constants: `OPT_IN_HEADING`, `INTENTAR_BTN`, `FINALIZAR_BTN`, `COUNTER_REGEX`, `STATUS_BANNER_ROLE`, `READINESS_LABEL`, etc. |
| `tests/e2e/helpers/practice-flow.ts` | NEW | `drivePracticeFlow(page, { skillId, exerciseAnswers })` — drives practice phases to completion, returning when opt-in appears. |
| `tests/e2e/specs/potencias_raices.spec.ts` | NEW | Canary: real flow, no fixture shortcut. Drives `mat.u1.potencias_raices` through all phases. |
| `tests/e2e/specs/intervalos.spec.ts` | NEW | Sample spec U1: `mat.u1.intervalos` |
| `tests/e2e/specs/conjuntos_numericos.spec.ts` | NEW | Sample spec U1: `mat.u1.conjuntos_numericos` |
| `tests/e2e/specs/logaritmos.spec.ts` | NEW | Sample spec U1: `mat.u1.logaritmos` |
| `tests/e2e/specs/polinomios_basico.spec.ts` | NEW | Sample spec U2: `mat.u2.polinomios_basico` |
| `tests/e2e/specs/operaciones_polinomios.spec.ts` | NEW | Sample spec U2: `mat.u2.operaciones_polinomios` |
| `tests/e2e/specs/factorizacion.spec.ts` | NEW | Sample spec U2: `mat.u2.factorizacion` (prereq bypass needed) |
| `tests/e2e/specs/gauss.spec.ts` | NEW | Sample spec U2: `mat.u2.gauss` |
| `tests/e2e/specs/mcm_mcd_polinomios.spec.ts` | NEW | Sample spec U2: `mat.u2.mcm_mcd_polinomios` |
| `tests/e2e/README.md` | NEW | Convention docs: why `*.spec.ts`, why `tests/e2e/`, how to run, how to debug |
| `package.json` | MODIFY | Add `@playwright/test` devDep; add `test:e2e` + `test:e2e:install` scripts |
| `openspec/changes/STATUS.json` | MODIFY | Add `challenge-smoke-e2e` entry (`status: "in-progress"`) |
| `src/**` | **NO CHANGE** | Hard constraint: no source changes |
| `openspec/specs/challenge-exercises/spec.md` | **NO CHANGE** | Domain contract unchanged until archive |

## Fixture Schema

### PracticeProgress (v2 student-scoped)

Source: `src/lib/practice-progress.ts:60`

```ts
interface PracticeProgressMap {
  readonly students: Record<string, PracticeProgress>;
  readonly activeStudentId: string | null;
}

interface PracticeProgress {
  readonly attempts: readonly PracticeAttempt[];
  readonly accuracyBySkill: Record<SkillId, number>;
  readonly trendBySkill: Record<SkillId, "improving" | "stable" | "needs-review">;
  readonly lastPracticedBySkill: Record<SkillId, string>;
  readonly diagnosticResult: DiagnosticResult | null;
  readonly studyPlan: StudyPlan | null;
}
```

**Example seed for `potencias_raices` (no prereq):**

```json
{
  "students": {
    "local-e2e-canary": {
      "attempts": [
        { "exerciseId": "ex.u1.potencias_raices.1", "skillId": "mat.u1.potencias_raices", "correct": true, "answeredAt": "2026-06-17T10:00:00.000Z", "timeMs": 5000, "attemptIndex": 1, "studentId": "local-e2e-canary" }
      ],
      "accuracyBySkill": { "mat.u1.potencias_raices": 1.0 },
      "trendBySkill": { "mat.u1.potencias_raices": "stable" },
      "lastPracticedBySkill": { "mat.u1.potencias_raices": "2026-06-17T10:00:00.000Z" },
      "diagnosticResult": null,
      "studyPlan": null
    }
  },
  "activeStudentId": "local-e2e-canary"
}
```

**Example seed for `factorizacion` (prereq `operaciones_polinomios` ≥ 0.7):**

```json
{
  "students": {
    "local-e2e-sample": {
      "attempts": [],
      "accuracyBySkill": { "mat.u2.operaciones_polinomios": 0.8 },
      "trendBySkill": {},
      "lastPracticedBySkill": {},
      "diagnosticResult": null,
      "studyPlan": null
    }
  },
  "activeStudentId": "local-e2e-sample"
}
```

### StudentProfile

Source: `src/domain/student-profile/index.ts:14`, `src/lib/student-profile-storage.ts:16`

```json
{
  "profiles": [
    {
      "studentId": "local-e2e-canary",
      "displayName": "E2E Canary",
      "createdAt": "2026-06-17T10:00:00.000Z",
      "lastActiveAt": "2026-06-17T10:00:00.000Z"
    }
  ],
  "activeStudentId": "local-e2e-canary"
}
```

### AdvancedPracticeProgress

Source: `src/lib/advanced-practice-progress.ts:43-46`

```json
{
  "challengeAttempts": [],
  "readinessBySkill": {}
}
```

The advanced store is seeded **empty** by default. The E2E flow writes to it via the real UI; the test then reads it back via `page.evaluate` to verify isolation.

## Selector Inventory

| Spec Scenario | Component | Selector | Constant |
|--------------|-----------|----------|----------|
| E1: opt-in appears | `ChallengeOptInBlock` | `getByText('Terminaste la práctica base.')` | `OPT_IN_HEADING` |
| E1: opt-in appears | `ChallengeOptInBlock` | `getByRole('button', { name: 'Intentar desafíos' })` | `INTENTAR_BTN` |
| E2: navigate to challenge | `ChallengeExerciseCard` | `getByText(/^Desafío 1 de 2$/)` | `COUNTER_REGEX` |
| E3: 2 challenges per skill | `ChallengeExerciseCard` | `getByText(/^Desafío 2 de 2$/)` then `getByText('Desafíos completados')` | `COUNTER_REGEX`, `DONE_HEADER` |
| E4: skip challenge | `ChallengeOptInBlock` | `getByRole('button', { name: 'Finalizar por ahora' })` then `getByText('Desafíos completados')` | `FINALIZAR_BTN`, `DONE_HEADER` |
| E5: readiness displayed | `ChallengeDoneSummary` | `getByText('Nivel de preparación en desafíos')` | `READINESS_LABEL` |
| Store independence (8 samples) | — | `page.evaluate(() => localStorage.getItem('pre-utn.practice.v1'))` | N/A (programmatic) |
| Canary: failing ≠ mastery | — | `page.evaluate(...)` comparing `accuracyBySkill` before/after | N/A (programmatic) |
| Feedback banner | `ChallengeFeedback` | `getByRole('status')` | `STATUS_BANNER_ROLE` |
| Continue after feedback | `ChallengeFeedback` | `getByRole('button', { name: /Siguiente desafío\|Ver resultado/ })` | `CONTINUE_BTN` |

## Practice Flow Driver

`drivePracticeFlow(page, { skillId, exerciseAnswers })` — pseudocode:

```
1.  page.goto(`/practice?skill=${skillId}`)
2.  Wait for post-hydration: expect(page.getByRole('option', { name: /./ })).toBeVisible()
    // StudentGate passes because addInitScript seeded profiles.v1
3.  Select unit: page.locator('#unit-select').selectOption(unitNumber)
4.  Select skill: page.getByRole('option', { name: skillLabel }).click()
5.  Click "Comenzar" or equivalent CTA
6.  LOOP through phases:
    a. theory → click "Continuar" / "Siguiente"
    b. example → click "Continuar al ejemplo" / "Siguiente ejemplo" / "Ir a ejercicios"
    c. exercise → select answer from exerciseAnswers[i], click "Verificar"
    d. feedback → click "Continuar" / "Siguiente"
    e. recovery (if error tag) → click "Continuar"
    f. Repeat until phase === "complete"
7.  Verify: expect(page.getByText('Terminaste la práctica base.')).toBeVisible()
    // ChallengeFlow renders because hasChallengesForSkill(skillId) === true
```

The driver iterates through 6–10 standard exercises per skill (content varies). Each answer is pre-selected from a known-correct or known-incorrect option. The canary uses the real MC options; the 8 sample specs use the same pattern with fixture-seeded `accuracyBySkill` for prereq bypass.

**FocusSelector selectors** (from `src/components/practice/FocusSelector.tsx`):
- Unit select: `<select id="unit-select">` (line 173)
- Skill buttons: `role="option"` (line 228)
- Mastery pill: `data-testid="mastery-pill"` (line 246)
- Availability pill: `data-testid="availability-pill"` (line 264)

## Decision Rationale

| # | Decision | Choice | Alternatives Rejected | Rationale |
|---|----------|--------|-----------------------|-----------|
| D1 | E2E runner | `@playwright/test` | Vitest browser mode (`@vitest/browser`), Puppeteer/raw `playwright-core` | Vitest browser mode doesn't support real route navigation (StudentGate redirect); Puppeteer loses Playwright's `webServer`, fixtures, trace viewer. Playwright is the industry standard for "smoke-test the deployed bundle". |
| D2 | Fixture injection | `addInitScript` | `page.evaluate` after `page.goto` | `usePracticeFlow.ts:110-112` reads localStorage in `useEffect` (post-mount). `page.evaluate` after navigation races the mount. `addInitScript` runs in every new document's main world before any user script, guaranteeing the seed is present when React's first `useEffect` fires. |
| D3 | Directory naming | `tests/e2e/` with `*.spec.ts` | `e2e/`, `playwright/`, `tests/e2e/*.test.ts` | `vitest.config.ts` includes `["src/**/*.test.ts", "tests/**/*.test.ts"]`. Using `*.spec.ts` avoids glob collision. `tests/` already exists with `.gitkeep`. |
| D4 | Server port | 3100 | 3000 | Developer's `pnpm dev` often occupies 3000. Non-default port avoids conflict. |
| D5 | Browser matrix | Chromium-only | Firefox + WebKit | MVP: ~150 MB binary. Multi-browser can be added later. Chromium covers 80%+ of the target student population. |
| D6 | Real UI for all 9 specs | Drive practice flow through the real UI | `?e2e=complete` query param shortcut | `phase === "complete"` is React state inside `usePracticeFlow`, not derived from localStorage. Any shortcut that bypasses the practice flow would touch `usePracticeFlow.ts`, violating the "no source changes" constraint. The fixture's value is: (a) bypassing StudentGate, (b) seeding `accuracyBySkill` for prereq bypass, (c) seeding a stable `studentId`. |
| D7 | Dual-store seeding | Seed BOTH `pre-utn.profiles.v1` AND `pre-utn.practice.v1` | Seed only practice.v1 | `StudentGate` (`page.tsx:36`) returns the gate when `student === null`. Without `profiles.v1`, the test gets stuck on the identification card, not the practice flow. |
| D8 | Factorizacion prereq | Seed `accuracyBySkill['operaciones_polinomios'] = 0.8` | Skip factorizacion test, or seed all skills | `analyzeRequestedSkill` in `start-skill.ts:69-104` blocks skills whose prerequisites are below 70% accuracy. `factorizacion` prereqs `operaciones_polinomios`. Without seeding ≥ 0.7, the test hits the BlockedSkillBanner instead of the practice flow. |

## Verification Plan

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
| PR1 (infra) | `pnpm test:e2e --grep "placeholder"` runs empty spec without crashing (sanity) |
| PR2 (canary) | Canary spec passes; `pnpm test:run` still ≥ 2053 |
| PR3 (U1 specs) | 4 new specs pass; canary still passes (regression) |
| PR4 (U2 specs) | 5 new specs pass; all previous specs still pass |

### Final merge-to-main gate

- Vercel preview deployment green
- `pnpm test:e2e` all 9 specs pass
- `pnpm test:run` ≥ 2053
- `pnpm typecheck` clean
- `pnpm build` green
- `pnpm audit:branches` reports no zombie branch

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| ~150 MB Chromium binary in devDependencies | High | Medium | `test:e2e:install` script isolates install; documented in README |
| 5–10 min suite runtime | High | High (acknowledged) | No mitigation in MVP. Can optimize later (parallel specs, shared server). Only way to validate deployed bundle without source changes. |
| Vitest glob collision if someone uses `.test.ts` | Low | Medium | `*.spec.ts` convention documented in README + `tests/e2e/helpers/selectors.ts` comment header |
| `StudentGate` redirect timing race | Medium | Medium | `addInitScript` seeds profiles before mount; test waits for post-hydration selector (`getByRole('option')`), not `waitForLoadState('networkidle')` |
| Prereq gate for `factorizacion` | Low | Low | Fixture seeds `accuracyBySkill['operaciones_polinomios'] = 0.8` (≥ 0.7 threshold) |
| Server boot timeout on first run | Low | Low | `webServer.timeout: 120_000` in config |

## Migration / Rollout

No migration required. Infrastructure-only change. Rollback = delete `tests/e2e/`, `playwright.config.ts`, and revert `package.json` + `STATUS.json` changes. No source code touched; zero risk to production.

## Out of Scope

- CI workflow changes (`.github/workflows/*` untouched)
- Vitest changes
- Source code changes (`src/**` untouched — hard constraint)
- Multi-browser matrix (chromium-only for MVP)
- Visual regression testing
- Pedagogical audit of the 30 challenges (separate change)

## Open Questions

None — all 6 user decisions locked; D1–D8 cover the technical sub-decisions.
