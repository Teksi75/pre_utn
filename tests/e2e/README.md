# E2E Smoke Suite (`tests/e2e/`)

Playwright smoke tests that boot the **real production bundle** and drive
the challenge flow end-to-end in Chromium. Additive infrastructure —
changes nothing in `src/**`.

## Why `tests/e2e/` + `*.spec.ts`

`vitest.config.ts` includes `["src/**/*.test.ts", "tests/**/*.test.ts"]`.
Playwright specs use `*.spec.ts` so vitest never loads them (design.md
**D3**). `playwright.config.ts` sets `testMatch: "**/*.spec.ts"` so
Playwright never loads the vitest `*.test.ts` companions. Keep the two
suffixes separate.

## Running locally

First time — download Chromium (~150 MB):

```bash
pnpm test:e2e:install
pnpm test:e2e                      # whole suite (webServer auto-boots on :3100)
pnpm test:e2e --grep "placeholder" # one spec by name
```

## Debugging

| Need | Command |
|------|---------|
| Playwright Inspector | `pnpm test:e2e -- --debug` |
| Always-on trace | `pnpm test:e2e -- --trace on` |
| UI mode | `pnpm test:e2e -- --ui` |

Failures retain a trace (`trace: "retain-on-failure"`).

## Scope & limitations (MVP)

- **Chromium-only** (design.md D5). Sequential, single worker
  (`fullyParallel: false`, `workers: 1`).
- **~5–10 min** full-suite runtime (acknowledged, no mitigation in MVP).
- **Manual command** — NOT wired into CI (separate change). Run before merge.
- Port **3100** avoids clashing with `pnpm dev` on 3000.

## File layout

```
tests/e2e/
├── fixtures/   # localStorage seed builders (PR1a) + vitest companions
├── helpers/    # selectors.ts (constants) + practice-flow.ts (drivers)
└── specs/      # *.spec.ts (1 canary + 8 sample = 9 total)
```

## 6-PR delivery plan (stacked-to-main, each ≤ 400 lines)

| PR | Content | Status |
|----|---------|--------|
| PR1a | Fixture builders + vitest | merged |
| PR1b | `@playwright/test` + config + helpers + README + placeholder | this PR |
| PR2 | Canary: `potencias_raices` (real flow, no fixture) | pending |
| PR3 | U1: `intervalos`, `conjuntos_numericos`, `logaritmos` | pending |
| PR4a | U2 first 3: `polinomios_basico`, `operaciones_polinomios`, `factorizacion` | pending |
| PR4b | U2 last 2: `gauss`, `mcm_mcd_polinomios` | pending |

Dependency order is strict: PR1a → PR1b → PR2 → PR3 → PR4a → PR4b.

## Adding a new skill spec

1. Copy a PR3/PR4a/PR4b sample spec as a template.
2. Replace `skillId`, `skillLabel`, and the per-exercise `exerciseAnswers`.
3. If the skill has a prereq below 70% (e.g. `factorizacion` ←
   `operaciones_polinomios`), seed `accuracyBySkill['mat.u2.operaciones_polinomios'] = 0.8`
   in the practice-progress fixture (design.md **D8**).
4. `drivePracticeFlow` → assert opt-in → `driveChallengeFlow` → assert
   E1–E5 (`specs/challenge-exercises/spec.md`).
5. `pnpm test:e2e --grep "<spec>"`; iterate on selectors/waits until green.

## Spec ref

- `openspec/changes/challenge-smoke-e2e/design.md` — architecture, selectors, D1–D8.
- `openspec/changes/challenge-smoke-e2e/tasks.md` — the 6-PR plan.
