## Exploration: challenge-smoke-e2e

### Current State

The challenge system (PR 1–5 of the previous `challenge-exercises-expansion`
change, archived 2026-06-17, mem #1927) is fully in place:

- **Catalog loader** (`src/lib/challenges/loader.ts:207`) exposes
  `loadChallengesForSkill(skillId)` returning `readonly ChallengeExercise[]`,
  backed by a module-level parse cache populated from
  `content/matematica/challenges/unit-1.json` and `unit-2.json`. Validation
  throws at module init on any malformed entry. The domain facade
  (`src/domain/catalog/challenges/index.ts:27,46`) re-exports
  `queryChallengesBySkill` and `hasChallengesForSkill`.
- **Advanced store** (`src/lib/advanced-practice-progress.ts:18`) writes
  to `pre-utn.advanced-practice.v1` with shape
  `{ challengeAttempts: ChallengeAttempt[]; readinessBySkill: Record<SkillId, number|null> }`.
  Has `loadAdvancedProgress()`, `addChallengeAttempt()`, and
  `computeAdvancedReadiness()`. Independent from the base store.
- **Base store** (`src/lib/practice-progress.ts:26`) uses
  `pre-utn.practice.v1` in the **v2 student-scoped shape**:
  `{ students: Record<studentId, PracticeProgress>; activeStudentId: string | null }`.
  The active slice is a `PracticeProgress` with `attempts[]`,
  `accuracyBySkill`, `trendBySkill`, `lastPracticedBySkill`, `diagnosticResult`,
  `studyPlan`. A lazy migration runs on first `loadProgress()` to upgrade
  the legacy flat shape.
- **Practice flow** (`src/app/practice/usePracticeFlow.ts:79`, `phases.ts`)
  is a state machine: `select → theory → example → exercise → feedback
  → recovery? → complete`. The `complete` phase is reached when the last
  exercise is graded (no error tag on the last feedback) or after recovery
  on the last exercise (`phases.ts:24` `nextPhase`). In `complete`,
  `page.tsx:218` conditionally renders `ChallengeFlow` if
  `hasChallengesForSkill(skillId)` is true, else the legacy
  `PracticeCompletePhase`.
- **Challenge flow** (`src/components/practice/challenges/ChallengeFlow.tsx`)
  is a sub-state machine `opt-in → exercise → feedback → done`. It uses
  the advanced store and does NOT call base `addAttempt()`.
- **SSR/hydration**: `usePracticeFlow.ts:110-112` reads
  `loadProgress()` inside `useEffect` (post-hydration, browser-only). The
  `useChallengeFlow` hook doesn't touch `localStorage` itself — it goes
  through the injected `addChallengeAttempt` / `loadAdvancedProgress`
  functions, which are called from event handlers (already on the client).
- **Test count baseline**: 2053 tests pass on `main` (verified with
  `pnpm test:run`). The challenge spec's "test count does not decrease"
  requirement (`openspec/specs/challenge-exercises/spec.md:96`) constrains
  E2E to be additive only.

### Affected Areas

> **No source files will change.** E2E tests are an entirely additive
> change. The list below is what the tests will *read* / *drive*, not what
> they will modify.

- `content/matematica/challenges/unit-1.json`, `unit-2.json` — read-only;
  test asserts the 2-challenges-per-skill contract for 9 sample skills.
- `src/lib/practice-progress.ts` — read; fixture builder mirrors the v2
  student-scoped shape.
- `src/lib/advanced-practice-progress.ts` — read; assertion target for
  challenge isolation (Q7).
- `src/app/practice/usePracticeFlow.ts:110-112` — read; dictates the
  hydration timing for the fixture.
- `src/app/practice/page.tsx:218-231` — the gate that decides whether
  `ChallengeFlow` or `PracticeCompletePhase` is rendered. Read-only.
- `src/components/practice/challenges/{ChallengeOptInBlock,ChallengeExerciseCard,ChallengeFeedback,ChallengeDoneSummary,ChallengeFlow,useChallengeFlow}.tsx`
  — selectors target the existing semantic markers (text + role) in
  these components. No code change.
- `src/hooks/active-student-store.ts`, `src/lib/student-profile-storage.ts`
  — the practice page gates on active student; the fixture must also seed
  `pre-utn.profiles.v1` to bypass the `StudentGate`.
- `vitest.config.ts` — read; its `include: ["src/**/*.test.ts",
  "tests/**/*.test.ts"]` glob does NOT match `tests/e2e/**/*.spec.ts`, so
  Playwright spec files are naturally excluded from vitest (verified).
- `package.json` — must be modified to add `@playwright/test` and a
  `test:e2e` script.
- `openspec/specs/challenge-exercises/spec.md` — the change can ship
  without modifying it (the 5 existing requirements are met by the E2E
  suite as a "smoke" extension). May add an entry in
  `openspec/changes/STATUS.json` for the new in-progress change.

### Approaches

1. **Playwright with `addInitScript` for fixtures (recommended)**
   - Add `@playwright/test` to devDependencies; add a
     `playwright.config.ts` that boots `pnpm build && pnpm start` (or
     `pnpm dev`) on port 3100 (avoiding default 3000 in case of stale
     dev servers). `webServer` block runs the production server
     automatically before tests.
   - Fixture builders in `tests/e2e/fixtures/practice-progress.ts` and
     `tests/e2e/fixtures/advanced-practice.ts` produce the v2
     student-scoped `PracticeProgress` and the
     `AdvancedPracticeProgress` JSON for the 9 sample skills.
   - Each spec calls `await context.addInitScript(value => { ... },
     fixture)` to write both `pre-utn.practice.v1` and
     `pre-utn.profiles.v1` BEFORE the app's `useEffect` reads them.
   - Specs in `tests/e2e/specs/*.spec.ts` (Playwright convention). Selectors
     rely on existing semantic markers: `getByRole('status', { name: ... })`
     for the result banner, `getByText('Intentar desafíos')` for opt-in,
     `getByText('Ver resultado')` for the last feedback continue, etc.
   - **Pros:** Production-mode matches real deploy, fixture survives
     hydration race, full coverage of the 8 scope items, no UI code
     change.
   - **Cons:** First install requires `npx playwright install chromium`
     (system browser binary, not bundled); needs Node ≥ 20 (already met);
     5–10s of overhead per test file from server boot.
   - **Effort:** Medium.

2. **Vitest browser mode (`@vitest/browser`) with Playwright provider**
   - Reuse the existing vitest runner; provide a Chromium instance via
     `@vitest/browser-playwright` (already a peer of `vitest@4.1.8`).
   - Write `*.spec.ts` under `tests/e2e/` and override `vitest.config.ts`
     with a workspace file when in E2E mode.
   - **Pros:** No new package, no new config, no browser install step.
   - **Cons:** Vitest browser mode is jsdom-like and does NOT support real
     navigation across multiple routes; the challenge flow involves
     navigating from `/practice` → phase transitions inside the same page
     (no real navigation) but the `StudentGate` redirect is a real route
     change. Also: E2E spec files in `tests/e2e/` would still be picked
     up by the default vitest include glob (test naming conflict).
   - **Effort:** Medium (and lossy — vitest is the wrong tool for
     "smoke-test post-deploy" because the goal is to validate the
     *deployed bundle*, not a jsdom-shimmed unit).

3. **Puppeteer / raw `playwright-core` + custom harness**
   - Bypass `@playwright/test` runner; use `playwright-core` directly
     inside vitest tests.
   - **Pros:** Smaller surface, can co-exist with vitest.
   - **Cons:** Loses Playwright's `webServer`, fixtures, parallelism,
     trace viewer, and report tooling. This is reinventing the wheel.
   - **Effort:** High (re-implementing the runner).

### Recommendation

**Approach 1 (Playwright with `addInitScript`)** is the only one that
matches the user's stated goal — "smoke-test automation post-deploy" — and
the only one that fits the constraint that the test must run against the
*deployed bundle* (no jsdom, no source-level mock). The `@playwright/test`
package is not installed today (verified in `package.json` and in
`pnpm-lock.yaml` — the lockfile entry is only the optional peer of
`next@16.2.7`), so the proposal must explicitly add it as a
`devDependency` and document the `playwright install chromium` step.

**Why `addInitScript` over `page.evaluate` after navigation:** the app
reads `pre-utn.practice.v1` in a `useEffect` on mount (`usePracticeFlow.ts:110`).
A `page.evaluate` after `page.goto` would race the mount. `addInitScript`
runs in every new document's main world before any user script, guaranteeing
the localStorage is present when the React app's first `useEffect` fires.

**Why port 3100 (not 3000):** Next.js default is 3000, but the developer's
local `pnpm dev` often occupies it. Picking a non-default port in
`playwright.config.ts` avoids conflicts when the developer runs both.

### Risks

- **No Playwright installed today.** `@playwright/test` is NOT in
  `package.json`; the lockfile entry is only Next's optional peer
  (`pnpm-lock.yaml:773`). Proposal must add it as a devDep and run
  `npx playwright install chromium`. Browser binary adds ~150 MB to the
  install footprint.
- **No `playwright.config.*` exists** at the project root; the proposal
  creates it from scratch and must wire `webServer.command`,
  `webServer.url`, `webServer.timeout`, and `testDir: "tests/e2e"`.
- **Vitest glob collision:** `vitest.config.ts:7` includes
  `["src/**/*.test.ts", "tests/**/*.test.ts"]` — note the `.test.ts`
  extension. Playwright convention is `.spec.ts`, so `tests/e2e/*.spec.ts`
  is NOT picked up by vitest (verified). The proposal must NOT use
  `.test.ts` for E2E files.
- **The `/practice` page gates on an active student** (`page.tsx:36`
  returns `StudentGate` if `student === null`). The fixture MUST seed
  `pre-utn.profiles.v1` with `{ profiles: [...], activeStudentId: "..." }`,
  not just `pre-utn.practice.v1`. Missing this means the E2E test gets
  stuck on the gate, not on the practice flow.
- **Hydration race on fixture:** the practice page reads
  `pre-utn.practice.v1` and `pre-utn.profiles.v1` in `useEffect`; the
  `StudentGate` shows a `animate-pulse` skeleton for one render cycle
  while the active-student store loads (`HomeNextStepClient.tsx:72-88`).
  Tests must `await page.waitForSelector` for the post-hydration
  selector, not just `waitForLoadState('networkidle')`.
- **The "challenge opt-in block" is only reachable when a skill has at
  least 2 challenges and the practice flow finishes the `complete` phase
  for that skill.** Fixture alone does NOT advance the flow — the test
  must drive the practice flow through the real UI (theory → example →
  exercise → feedback → complete) to reach `ChallengeOptInBlock`. This
  is the **canary test's** job: it does the real flow for
  `mat.u1.potencias_raices` and asserts the opt-in block appears.
- **Semantic markers are sufficient for the 8 sample-skills specs
  (fixture-based)** because they start with the practice already
  completed. The canary is the one that needs to navigate the real
  phases, and it must use the existing `<select id="unit-select">` in
  `FocusSelector.tsx:173` plus the `role="option"` skill buttons
  (line 228). No `data-testid` explosion needed; `data-testid` already
  exists on `availability-pill` and `mastery-pill` (line 264, 246) for
  free.
- **No CI:** the user explicitly scoped CI out ("out of scope"). The
  proposal only adds `pnpm run test:e2e` as a manual / local script.
  No `.github/workflows/*` changes.
- **The fixture must match the v2 student-scoped shape** to avoid
  triggering the lazy migration path in `loadProgress` (lines 101-164).
  A flat-shape fixture would still work (the migration is idempotent)
  but the test would be testing the wrong contract. The proposal should
  hand-craft the v2 shape with a stable `studentId` like `local-e2e-canary`.
- **The 9 sample skills' prereqs must be considered** for the
  `?skill=...` deep-link path. `analyzeRequestedSkill` in
  `start-skill.ts:69-104` blocks skills whose prerequisites are below
  70% accuracy. The fixture must also seed `accuracyBySkill` for any
  declared prerequisite of the target skill. For the 9 sample skills
  the only "blocked by prereq" case is `factorizacion` (prereq
  `operaciones_polinomios`). The proposal should use a v2 fixture that
  sets prereq accuracies to ≥ 0.7 to bypass this check.
- **Test count regression guard.** The 2053-test count is the contract
  (`openspec/specs/challenge-exercises/spec.md:96`). The proposal must
  verify `pnpm test:run` still reports ≥ 2053 after the change.

### Ready for Proposal

Yes — all 10 questions are answered with file:line citations and the
trade-offs are documented. The orchestrator should proceed to
`sdd-propose` for change `challenge-smoke-e2e`.

The proposal should make these decisions explicit (not deferred to apply):

1. **Add `@playwright/test` as a devDep + `playwright install chromium`.**
2. **Create `playwright.config.ts`** at project root with `testDir:
   "tests/e2e"`, `webServer` running `pnpm start -p 3100`, `baseURL:
   "http://localhost:3100"`, and `use: { headless: true, trace: "retain-
   on-failure" }`.
3. **Add `pnpm run test:e2e` script** that runs `playwright test`.
4. **Use `tests/e2e/`** (not `src/e2e/`) — the user constraint says
   "E2E tests live in a separate directory (do not mix with
   `src/**/*.test.ts`)" and `tests/` already exists with a `.gitkeep`.
5. **Use `*.spec.ts` naming** (Playwright convention; not picked up by
   the vitest `*.test.ts` glob).
6. **Use `addInitScript` for fixtures**, not `page.evaluate` after
   navigation, to win the hydration race.
7. **Seed BOTH `pre-utn.practice.v1` AND `pre-utn.profiles.v1`** in the
   same `addInitScript` block.
8. **Use the existing semantic markers** (text content, `role="status"`,
   `role="option"`, `<select id="unit-select">`, button labels) for
   selectors. No new `data-testid` needed.
9. **9 sample skills × 1 spec each + 1 canary spec** for `potencias_raices`
   that drives the real flow. Total: **10 spec files**, mirroring the
   scope (8 user-listed items + 1 canary). The "opt-in appears" and
   "navigate to challenge mode" are best asserted inside the canary
   since they require a fresh mount; the 9 sample specs assert
   "challenge count = 2" + "navigate to opt-in via the existing flow
   after hydration with fixture".
10. **Update `openspec/changes/STATUS.json`** with the new
    `challenge-smoke-e2e` entry: `status: "in-progress"`, `branch: null`
    until the feature branch is created.

---

## Answers to the 10 Exploration Questions

### Q1. Challenge loader shape

`src/lib/challenges/loader.ts:207` — `loadChallengesForSkill(skillId:
string): readonly ChallengeExercise[]`. Filters the unit's parsed
challenges by `c.skillId === skillId` (line 212). Each entry is a
`ChallengeExercise` (`src/domain/catalog/challenges/types.ts:61`)
extending `Exercise` with `challengeSection: true`, `category: "desafio"`,
`tags: ["desafio", "integrador"]`, `canonicalTrace: readonly
ChallengeCanonicalTrace[]`. The domain facade
(`src/domain/catalog/challenges/index.ts:27`) exposes
`queryChallengesBySkill(skillId)`. Also has `queryChallengesByUnit(unit)`
(line 37) and `hasChallengesForSkill(skillId) → boolean` (line 46).

### Q2. Advanced store shape

`src/lib/advanced-practice-progress.ts:18` — key
`pre-utn.advanced-practice.v1`. Full type
(`advanced-practice-progress.ts:43-46`):

```ts
interface AdvancedPracticeProgress {
  readonly challengeAttempts: readonly ChallengeAttempt[];
  readonly readinessBySkill: Record<SkillId, number | null>;
}

interface ChallengeAttempt {
  readonly exerciseId: string;
  readonly skillId: SkillId;
  readonly correct: boolean;
  readonly answeredAt: string;        // ISO timestamp
  readonly timeMs: number;
  readonly attemptIndex: number;
}
```

Public API: `loadAdvancedProgress()` (line 132),
`addChallengeAttempt(attempt) → { ok, value }` (line 158),
`computeAdvancedReadiness(skillId, attempts) → number | null` (line 99).
The "opt-in" state is **not** persisted — the `ChallengeOptInBlock` is
rendered conditionally based on the `complete` phase of the base flow,
not based on any persistent flag.

### Q3. Base practice store shape and "completed" trigger

`src/lib/practice-progress.ts:26` — key `pre-utn.practice.v1` in v2
**student-scoped shape** (line 60):

```ts
interface PracticeProgressMap {
  readonly students: Record<string, PracticeProgress>;
  readonly activeStudentId: string | null;
}
```

Where `PracticeProgress` (from `src/domain/progress/index.ts`) is:
`{ attempts: PracticeAttempt[]; accuracyBySkill: Record<SkillId, number>;
trendBySkill: Record<SkillId, "improving"|"stable"|"needs-review">;
lastPracticedBySkill: Record<SkillId, string>; diagnosticResult: ...
|null; studyPlan: ... | null }`.

**There is no "skill completed" boolean.** The opt-in fires when
`usePracticeFlow`'s `phase === "complete"` AND
`hasChallengesForSkill(skillId)` is true (`page.tsx:218`). The `complete`
phase is reached when the last exercise in the skill's exercise queue is
graded without an error tag (`phases.ts:46`).

**Minimum fixture to make opt-in appear** (for a skill with ≥ 2
challenges like `mat.u1.potencias_raices`):

1. Seed `pre-utn.profiles.v1` with a valid profile and
   `activeStudentId: "<that profile's id>"`.
2. Either drive the flow through the real UI (canary) OR seed
   `pre-utn.practice.v1` with a v2 map where the active slice has
   `attempts` containing the skill's standard exercises — but the
   `complete` phase is a *runtime state of the React hook*, not derived
   from localStorage. So the fixture alone CANNOT trigger `phase ===
   "complete"`; the test must drive the flow to reach it.

**The 9 sample skills' specs cannot rely on the fixture alone** — they
must either (a) drive the practice flow to `complete` via the UI, or
(b) deep-link to `/practice?skill=<id>` and drive the flow. Option (a)
is the canary; option (b) is what the 9 specs should do.

### Q4. Practice UI flow → opt-in trigger

`src/app/practice/page.tsx:218-231`:

```tsx
{flow.phase === "complete" && (
  flow.selectedSkillId && hasChallengesForSkill(flow.selectedSkillId) ? (
    <ChallengeFlow
      challenges={queryChallengesBySkill(flow.selectedSkillId)}
      skillId={flow.selectedSkillId as SkillId}
      onDone={flow.resetToSelect}
    />
  ) : (
    <PracticeCompletePhase
      skillId={flow.selectedSkillId ?? undefined}
      totalExercises={flow.exercises.length}
      onBackToSelector={flow.resetToSelect}
    />
  )
)}
```

So `ChallengeFlow` replaces the `complete` phase. `ChallengeFlow.tsx:77`
renders `ChallengeOptInBlock` when `state.phase === "opt-in"` (the
initial state of `useChallengeFlow`). **Opt-in IS the first screen
inside the challenge flow** — there is no "complete" view shown when
challenges exist; the user goes straight to opt-in.

`ChallengeOptInBlock` props (`ChallengeOptInBlock.tsx:5-12`):
`challengeCount: number`, `onStart: () => void`, `onSkip: () => void`.
It renders two `<Button>`s: "Intentar desafíos" (onStart, line 46) and
"Finalizar por ahora" (onSkip, variant=ghost, line 49). Both are
selectable via `getByRole('button', { name: 'Intentar desafíos' })` /
`getByText`.

### Q5. Challenge components — selectors

| Component | Path | Renders | Key actions | Selectors |
|-----------|------|---------|-------------|-----------|
| `ChallengeOptInBlock` | `src/components/practice/challenges/ChallengeOptInBlock.tsx` | Glass card with header `Terminaste la práctica base.` + `Hay N ejercicios de desafío...` + 2 buttons | "Intentar desafíos" (`onStart`) / "Finalizar por ahora" (`onSkip`) | `getByRole('button', { name: 'Intentar desafíos' })`, `getByText('Terminaste la práctica base.')` |
| `ChallengeExerciseCard` | `src/components/practice/challenges/ChallengeExerciseCard.tsx` | Counter `Desafío N de M`, badges (Desafío, type, difficulty), `<ExerciseCard exercise={...} />` (the prompt), `<ExerciseAnswerInput>` | Submits answer via `onSubmit(answer)` | `getByText(/^Desafío \d+ de \d+$/)`, `getByText(/^Dificultad \d+$/)`, `data-testid="answer-form-multiple-choice"` (already on `ExerciseAnswerInput.tsx:161` for MC type) |
| `ChallengeFeedback` | `src/components/practice/challenges/ChallengeFeedback.tsx` | Result banner (`role="status"`, green/red), pedagogical note, optional error tag, "Siguiente desafío" / "Ver resultado" button | Continue via `onContinue` | `getByRole('status')`, `getByRole('button', { name: /Siguiente desafío|Ver resultado/ })` |
| `ChallengeDoneSummary` | `src/components/practice/challenges/ChallengeDoneSummary.tsx` | "Desafíos completados" header, score `correctCount / challengeCount`, "Nivel de preparación en desafíos: NN%", "Volver al selector" button | `onBackToSelect` | `getByText('Desafíos completados')`, `getByText(/Nivel de preparación en desafíos/)`, `getByRole('button', { name: 'Volver al selector' })` |
| `ChallengeFlow` | `src/components/practice/challenges/ChallengeFlow.tsx` | Orchestrator that switches on `state.phase` to render the right sub-component above | none direct | none (it's a renderer) |

**No `data-testid` explosion needed.** All 8 spec scope items can be
asserted via text + role. The only "missing marker" risk is the
per-exercise "Desafío 1 de 2" counter, but `getByText(/^Desafío \d+ de
\d+$/)` works because the counter is a `span` with literal text
(`ChallengeExerciseCard.tsx:55`).

### Q6. Readiness component

The "challenge readiness" is rendered inside `ChallengeDoneSummary`
(`src/components/practice/challenges/ChallengeDoneSummary.tsx:62-68`):

```tsx
{advancedReadiness !== null && (
  <div className="space-y-1 text-center">
    <p className="text-sm text-brand-600">Nivel de preparación en desafíos</p>
    <p className="text-3xl font-bold text-accent-600">{advancedReadiness}%</p>
  </div>
)}
```

The user reaches it by completing all challenges (or skipping — but
skipping leaves `advancedReadiness === null` because no
`addChallengeAttempt` was called). The selector is
`getByText('Nivel de preparación en desafíos')` + the next `<p>` shows
the percentage.

There is no separate `Readiness` page or component; readiness is
read-only here, only used in the "level" badge. The home page's
`StudentSituationPanel` shows a different "readiness" (whole-course
mastery, from `StudentHomeViewModel`), not challenge readiness.

### Q7. Routes & dev server

- `pnpm dev` defaults to `http://localhost:3000` (Next.js 16.2.7
  standard). `pnpm build && pnpm start` also defaults to 3000. No
  custom port is configured in `next.config.ts` (10 lines, empty
  `experimental.viewTransition: true`).
- The `package.json` has scripts: `dev: "next dev"`, `build: "next
  build"`, `start: "next start"`. No port override.
- **`@playwright/test` is NOT installed.** Verified: not in
  `package.json` devDependencies, and the only `pnpm-lock.yaml` entry
  is `next@16.2.7`'s optional peer (`pnpm-lock.yaml:773`).
- **No `playwright.config.*` file** at the project root. The closest
  is `vitest.config.ts` (1 file, 14 lines).
- **No existing E2E directories.** The only `tests/` directory at root
  is empty (contains only `.gitkeep`). No `e2e/`, no
  `tests/e2e/`, no `playwright/` directories anywhere.
- **Recommended CI port:** 3100 (avoids conflict with developer's
  `pnpm dev` on 3000). Document in `playwright.config.ts` with
  `webServer.command: "pnpm start --port 3100"` and `use.baseURL:
  "http://localhost:3100"`.

### Q8. Content location and counts for the 9 sample skills

Both files exist (`content/matematica/challenges/unit-1.json` 38,883
bytes, `unit-2.json` 35,765 bytes). Counts verified by `grep "id":
"ex.uN.X.desafio-"`:

| Skill | Unit | Count | First challenge id |
|-------|------|-------|--------------------|
| `mat.u1.potencias_raices` | 1 | 2 | `ex.u1.potencias_raices.desafio-01` |
| `mat.u1.intervalos` | 1 | 2 | `ex.u1.intervalos.desafio-01` |
| `mat.u1.conjuntos_numericos` | 1 | 2 | `ex.u1.conjuntos_numericos.desafio-01` |
| `mat.u1.logaritmos` | 1 | 2 | `ex.u1.logaritmos.desafio-01` |
| `mat.u2.polinomios_basico` | 2 | 2 | `ex.u2.polinomios_basico.desafio-01` |
| `mat.u2.operaciones_polinomios` | 2 | 2 | `ex.u2.operaciones_polinomios.desafio-01` |
| `mat.u2.factorizacion` | 2 | 2 | `ex.u2.factorizacion.desafio-01` |
| `mat.u2.gauss` | 2 | 2 | `ex.u2.gauss.desafio-01` |
| `mat.u2.mcm_mcd_polinomios` | 2 | 2 | `ex.u2.mcm_mcd_polinomios.desafio-01` |

All 9 sample skills have exactly 2 challenges, matching the
"Challenge Non-Regression" requirement from the existing spec
(`openspec/specs/challenge-exercises/spec.md:88`).

For the **canary test** on `mat.u1.potencias_raices`, the standard
exercise catalog has 6 entries in
`content/matematica/exercises/unit-1.json` for that skill — i.e., the
canary will drive 6 standard exercises + 2 challenges.

### Q9. SSR/hydration timing

`usePracticeFlow.ts:110-112` initializes `progress` to `EMPTY_PROGRESS`
and reads `loadProgress()` inside `useEffect` (post-mount, browser-only).
Same pattern in `useActiveStudent.ts:41-44` and
`HomeNextStepClient.tsx:41-70`. The `useEffect` runs AFTER React's first
commit, AFTER the SSR/hydration mismatch check, so `localStorage` is
guaranteed to be available.

**Implication for Playwright:** if the test sets localStorage via
`page.evaluate` AFTER `page.goto`, it will race the `useEffect`. The
correct sequence is:

1. Create a `BrowserContext`.
2. `context.addInitScript(({ profiles, progress }) => {
     localStorage.setItem('pre-utn.profiles.v1', JSON.stringify(profiles));
     localStorage.setItem('pre-utn.practice.v1', JSON.stringify(progress));
     localStorage.setItem('pre-utn.advanced-practice.v1', JSON.stringify(advanced));
   }, fixture)` — runs in every new document's main world before any
   user script.
3. `const page = await context.newPage(); await page.goto(BASE_URL +
   '/practice?skill=mat.u1.potencias_raices');` — by the time the
   page's first `useEffect` runs, the localStorage is already seeded.
4. `await page.getByRole('option', { name: 'Potencias y raíces' }).click();
   await page.getByRole('button', { name: /Continuar|Siguiente/ }).click();`
   — drive the flow to `complete`.

**Alternative (rejected):** `page.evaluate(() => localStorage.setItem(...))`
after navigation. Loses the race; would need a `page.waitForFunction` to
poll until the React state catches up, which is fragile.

### Q10. Existing test patterns

Vitest conventions (verified across 122 test files, 2053 tests):

- **File naming:** `*.test.ts` (NOT `.spec.ts`).
- **Location:** co-located under `__tests__/` next to the file under
  test, e.g. `src/components/practice/challenges/__tests__/ChallengeOptInBlock.test.ts`
  pairs with `src/components/practice/challenges/ChallengeOptInBlock.tsx`.
- **Imports:** `import { describe, expect, test } from "vitest";`
  (globals are enabled by `vitest.config.ts:5`).
- **Environment:** `node` (`vitest.config.ts:6`) — NO jsdom, NO
  happy-dom. Component tests are **source-code assertions**, not
  rendered tests, e.g.
  `src/components/practice/challenges/__tests__/ChallengeOptInBlock.test.ts:17`
  reads the `.tsx` file and matches regexes against it.
- **Fixtures:** inline `localStorage` mocks via `vi.stubGlobal("localStorage",
  localStorageMock)` and a `Map`-backed in-memory object
  (`src/lib/__tests__/practice-progress.test.ts:12-60`).
- **Factory location:** none — tests construct fixtures inline.
- **Coverage:** only `src/domain/**` is included
  (`vitest.config.ts:10`). UI, lib, components, hooks are NOT measured.
- **Strict TDD discipline:** every test file has a header comment
  describing its scope; the pattern "RED first, GREEN, then verify" is
  consistent.

**The new E2E suite will use a parallel convention** (Playwright
runner, `.spec.ts` extension, `tests/e2e/` location) **on purpose** —
mixing Playwright `*.spec.ts` files into the `src/**/*.test.ts` glob
would be a maintenance hazard. The proposal should justify the
separation in a comment block in `tests/e2e/README.md` (the new README
the proposal must create).
