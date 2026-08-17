# Tasks: Unit 1 Rotonda Problem-Solving Capstone

## Review Workload Forecast (per PR)

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High (7 stacked PRs; each PR stays within budget individually)

| PR | Scope | Est. authored lines | Budget risk | Rollback boundary |
|----|-------|---------------------|-------------|-------------------|
| PR1 | Domain: `isUnitComplete` + capstone rules + comma adapter | ~210 | Low | Delete `src/domain/capstone/*`; revert predicate export |
| PR2 | Loader + capstone JSON + brand/voice/stage-order/math-contract scans | ~290 | Medium | Revert JSON + loader file |
| PR3 | Per-student storage `pre-utn.capstone.v1` with fail-closed + isolation | ~190 | Low | Delete `src/lib/capstone-progress.ts` |
| PR4 | **DORMANT** `UnitCapstoneCard` + state helper in isolation (no wiring, no route) | ~140 | Low | Delete `src/components/capstone/UnitCapstoneCard*` and any helper file |
| PR5a | **DORMANT** client eligibility hook/gate + automated no-import/no-link/no-route source-scan contract; no page, route, server shell, public link, or runner | ~210 | Low | Delete `use-capstone-eligibility*`, `CapstoneEligibilityGate*`, and source-scan tests |
| PR5b | Atomic server page shell + complete runner behind client gate, a11y/responsive/invariance + direct-URL E2E | ~390 | Medium (kept <400) | Revert the entire route and runner together; no public route survives without the complete eligible journey |
| PR6 | Atomic Home wiring of card + full integration E2E + final regression sweep | ~90 | Low | Remove `UnitCapstoneCard` import in `HomeNextStepClient.tsx`; source-scan allowlist reverts to its PR5a form |
| **Total** | | **~1510** | | |

### Stacked-to-main safety contract (intermediate state per merged slice)

State authority rule: the **client** owns active profile, practice progress, and capstone state (browser/localStorage). The server only loads static content. A "server-side gate" over client-local state is impossible by design and is forbidden here.

- **PR1–PR3**: pure code/JSON/storage changes; no production surface change.
- **PR4**: `UnitCapstoneCard` and any helper exist as isolated source files; **nothing imports them**, **no route exists**, **no public path** to a capstone surface. Visible Home is unchanged.
- **PR5a**: **DORMANT** eligibility hook/gate and automated source-scan contract exist, but no page file, route, server shell, public path, public link, or runner exists. Home is unchanged. Tests prove loading/ineligible/eligible gate behavior and absence of route/link/import.
- **PR5b**: atomically creates `src/app/capstone/unidad-1-rotonda/page.tsx` and mounts the complete runner behind the existing client gate. The first route-bearing merge already has the complete eligible journey; direct ineligible URL remains neutral/fail-closed and no answer flashes before hydration/eligibility resolves.
- **PR6**: `HomeNextStepClient` renders `UnitCapstoneCard` after the hero when eligible; full learner journey is integrated. The source-scan allowlist widens to exactly one import site.

No visible placeholder, dead CTA, 404-linked card, server-side assumption about client-local state, or partially interactive path may exist after any intermediate merge.

## Work Units (PR boundaries)

### PR1 — Domain foundation (dormant, no callers)
- **Start**: `isUnitComplete` not exported; `src/domain/capstone/` empty.
- **Finish**: `isUnitComplete` exported; pure rules + isolated comma adapter; regression asserts global `evaluateAnswer` byte/behavior stable.
- **Focused proof**: `pnpm run test src/domain/capstone src/domain/student-home`.
- **Runtime harness**: N/A (pure domain, no I/O).
- **Rollback**: delete `src/domain/capstone/*`; revert export.
- **Dependency**: none (first PR in chain).

### PR2 — Loader + content + scans (dormant, no UI)
- **Start**: no `capstone-loader.ts`; no capstone JSON.
- **Finish**: validator rejects unsupported controls + wrong stage order + brand violations + math-contract violations; valid JSON loaded.
- **Focused proof**: `pnpm run test src/domain/catalog/capstone-loader`.
- **Runtime harness**: `node -e "import('./content/matematica/capstones/unit-1-rotonda.json',{assert:{type:'json'}}).then(m=>console.log('parsed'))"`.
- **Rollback**: revert JSON + loader file.
- **Dependency**: PR1 merged.

### PR3 — Per-student storage (dormant, no UI)
- **Start**: no `src/lib/capstone-progress.ts`.
- **Finish**: versioned store with malformed/version/stale recovery, fail-closed without profile, cross-student isolation, `everCompleted` survives repeat.
- **Focused proof**: `pnpm run test src/lib/capstone-progress`.
- **Runtime harness**: Vitest with `vi.mock('../../lib/active-session')` returning a stub profile; round-trips through injected `localStorage` stub.
- **Rollback**: delete `src/lib/capstone-progress.ts`.
- **Dependency**: PR1 merged.

### PR4 — Dormant card + state helper (no wiring, no route)
- **Start**: no `UnitCapstoneCard`; nothing imports it.
- **Finish**: `UnitCapstoneCard` (and `deriveCapstoneCardState` if extraction is justified) derive hidden / not-started / in-progress / completed from `isUnitComplete` + `loadCapstoneProgress`; tests pass in isolation with stubbed dependencies; **no `HomeNextStepClient` import, no route creation, no public path**. Files are present but unimported.
- **Focused proof**: `pnpm run test src/components/capstone/UnitCapstoneCard src/components/capstone/derive-capstone-card-state`.
- **Runtime harness**: N/A (component isolated; no page, no route, no app integration).
- **Rollback**: delete `src/components/capstone/UnitCapstoneCard*` and any helper file.
- **Dependency**: PR1 + PR3 merged (predicate + storage available).

### PR5a — Dormant client gate contracts + absence scan
- **Start**: PR4 dormant card only; no eligibility hook/gate, route, page, server shell, public path, or runner.
- **Finish**: `useCapstoneEligibility` and `CapstoneEligibilityGate` are tested/implemented in isolation; gate returns loading/ineligible/eligible safely, but no route or page is created. `tests/unit/capstone/no-capstone-imports-or-links.test.ts` fails on any capstone route/link/import in app surfaces and proves route absence.
- **Focused proof**: `pnpm run test src/components/capstone/CapstoneEligibilityGate src/components/capstone/use-capstone-eligibility tests/unit/capstone/no-capstone-imports-or-links`.
- **Runtime harness**: N/A — deliberately no route exists in this dormant slice.
- **Rollback**: delete hook, gate, and absence-scan tests; no public surface to roll back.
- **Dependency**: PR1 + PR3 + PR4 merged.

### PR5b — Atomic route + complete runner
- **Start**: PR5a dormant contracts; no route/page exists.
- **Finish**: one atomic slice creates the server page shell and complete `CapstoneProvider`/theory/stage/completion runner behind the client gate. Eligible direct URL has the full journey immediately; loading has no answer flash; ineligible direct URL is neutral/fail-closed. Includes page-shell tests, a11y, 375×812 responsive, invariance scans, runner E2E, and updates the PR5a scan to allow exactly the route file while still forbidding in-app links/imports; Home remains unchanged.
- **Focused proof**: `pnpm run test src/components/capstone src/app/capstone tests/unit/capstone`.
- **Runtime harness**: `pnpm exec playwright test tests/e2e/specs/u1-rotonda-capstone-runner.spec.ts` — direct URL, ineligible/eligible gate, theory, five stages, completion.
- **Rollback**: revert the complete route + runner transaction together; never leave a public incomplete route.
- **Dependency**: PR1 + PR2 + PR3 + PR4 + PR5a merged.

### PR6 — Atomic Home activation + full integration E2E + regression sweep
- **Start**: card exists but is unimported; runner reachable only by direct URL behind the client gate.
- **Finish**: `HomeNextStepClient` imports and renders `UnitCapstoneCard` after the hero only when eligible; the PR5a source-scan regression is updated to admit `HomeNextStepClient.tsx` as the single authorized import site (centralization invariant: a positive test asserts the import exists and is the only one); full integration E2E (Home → card → theory → 5 stages → completion); final regression sweep confirms Unit 2 / mastery / base practice / challenge still untouched; `"72,32"` accepted; reload at `Verificar` resumes; repeat keeps `everCompleted`.
- **Focused proof**: `pnpm run test:e2e tests/e2e/specs/u1-rotonda-capstone.spec.ts`.
- **Runtime harness**: full Playwright suite (chromium only, port 3100).
- **Rollback**: remove `UnitCapstoneCard` import in `HomeNextStepClient.tsx`; source-scan allowlist reverts to its PR5a form; runner remains at the gated route.
- **Dependency**: PR1 + PR2 + PR3 + PR4 + PR5a + PR5b merged.

### Final verification (after PR6 lands)

```bash
pnpm run test
pnpm run typecheck
pnpm run build
pnpm run test:e2e tests/e2e/specs/u1-rotonda-capstone.spec.ts
```

## Apply Prerequisite (before PR1 starts)

- [ ] 0.1 Apply executor creates worktree `feat/u1-rotonda-capstone-pr1` from main and honors `.gga` + `AGENTS.md`. STATUS.json `branch` field is updated when worktree exists. No merge, push, or PR creation is presumed by planning; the user controls delivery per `delivery_strategy: auto-chain` after PR1 is ready.

## Phase 1 (PR1): Pure domain

Strict TDD: RED contract first, GREEN implementation second. No global evaluator coupling.

- [ ] 1.1 RED: `isUnitComplete(1, progress, PILOT_SKILLS)` true iff all 8 U1 skills return `mastered`.
- [ ] 1.2 GREEN: export `isUnitComplete` from `src/domain/student-home/index.ts` (additive; no behavior change to existing callers).
- [ ] 1.3 RED: stage transition — `theory`+first item→`comprender`; never backwards; `complete` only via stage 5.
- [ ] 1.4 GREEN: `nextStage()` + `StageId` types in `src/domain/capstone/index.ts`.
- [ ] 1.5 RED: answer-leak — stage-3 final number, exact expression, correct comm choice NOT in view-model before final-item submit.
- [ ] 1.6 GREEN: `revealStage3(state)` + `CapstoneProgress` discriminated union.
- [ ] 1.7 RED: `"72,32"` ≡ `"72.32"` parsed to ≈72.32 within `0.01`; absent/invalid → null; regression asserts global `evaluateAnswer` byte-stable.
- [ ] 1.8 GREEN: capstone-local `parseNumericWithComma()` adapter; no global `evaluateAnswer` re-export; regression test confirms global evaluator unchanged.

## Phase 2 (PR2): Loader + content + scans

Strict TDD: every RED contract test exists BEFORE content creation. Content creation is the LAST step.

- [ ] 2.1 RED: loader rejects unknown `StageId`, missing items, multi-select, free-text structured math.
- [ ] 2.2 RED: math contract — exact `=` and `\cong`/`≈` discipline per spec.
- [ ] 2.3 RED: stage order `comprender → buscar-plan → llevarlo-a-cabo → verificar → comunicar`; theory first.
- [ ] 2.4 RED: brand/source scan forbids institution/faculty/program/location + tutor tokens.
- [ ] 2.5 RED: `llevarlo-a-cabo` retains 3 distinct numeric items (D, r, d).
- [ ] 2.6 RED: `verificar` uses correctness/plausibility/units/approximation checks (no final recomputation).
- [ ] 2.7 GREEN: `loadUnit1RotondaCapstone()` in `src/domain/catalog/capstone-loader.ts`; 2.1–2.6 pass.
- [ ] 2.8 Create `content/matematica/capstones/unit-1-rotonda.json`: theory + 5 stages (single-select/TF/numerical; 3 numeric items in `llevarlo-a-cabo`; TF+numerical in `verificar`).

## Phase 3 (PR3): Per-student storage

- [ ] 3.1 RED: malformed/versioned/stale → empty incomplete; no unlock, no completion claim.
- [ ] 3.2 RED: writes without active profile blocked (fail-closed); cross-student isolation enforced.
- [ ] 3.3 RED: `everCompleted` survives repeat; per-item progress resets on re-entry; other students' keys preserved.
- [ ] 3.4 GREEN: `src/lib/capstone-progress.ts` w/ `loadCapstoneProgress` / `saveCapstoneItem` / `markCapstoneComplete`; 3.1–3.3 pass.

## Phase 4 (PR4): Dormant card + state helper (DORMANT — no wiring, no route)

- [ ] 4.1 RED: card derives hidden / not-started / in-progress / completed from `isUnitComplete` + `loadCapstoneProgress`; repeated completion keeps card visible without completion-claim duplication; tested in isolation with stubbed dependencies (no real Home, no real route).
- [ ] 4.2 GREEN: `src/components/capstone/UnitCapstoneCard.tsx` (+ optional `src/components/capstone/deriveCapstoneCardState.ts`) with neutral Spanish copy; 4.1 passes. **No `HomeNextStepClient` import, no route creation, no public path.** Files are present but unimported.

## Phase 5a (PR5a): Dormant client gate contracts + absence scan

- [ ] 5a.1 RED: `useCapstoneEligibility` initial loading and hydrated active-null, malformed-progress, U1-incomplete, U1-complete branches; no route dependency.
- [ ] 5a.2 GREEN: `src/components/capstone/use-capstone-eligibility.ts` with injected adapters and client-authoritative fail-closed eligibility.
- [ ] 5a.3 RED: `CapstoneEligibilityGate` loading/no-answer, neutral ineligible, and children-only eligible branches.
- [ ] 5a.4 GREEN: `src/components/capstone/CapstoneEligibilityGate.tsx`; gate tests pass.
- [ ] 5a.5 RED: source scan proves no route file, public path, in-app link, or capstone import exists outside dormant allowlist.
- [ ] 5a.6 GREEN: `tests/unit/capstone/no-capstone-imports-or-links.test.ts`; all PR5a tests pass. **Do not create `src/app/capstone/` or any page.**

## Phase 5b (PR5b): Complete runner behind gate + a11y + responsive + regression invariance + runner E2E

- [ ] 5b.1 RED: direct-URL route contract requires server shell + complete eligible runner in the same PR; loading has no answer flash; ineligible URL is neutral/fail-closed.
- [ ] 5b.2 RED: provider mounts theory first, then declared five stages; stage-3 expected values stay hidden until final-item submit.
- [ ] 5b.3 RED: a11y/responsive — keyboard/focus/live-region/ARIA/≥44px controls and 375×812 no clip.
- [ ] 5b.4 RED: invariance — runner does not touch practice/advanced/diagnostic storage, `phases.ts`, `usePracticeFlow`, mastery, Unit 2, base, challenge routes/guards.
- [ ] 5b.5 RED: `u1-rotonda-capstone-runner.spec.ts` direct URL → gate → theory → five stages → completion; page-shell SSR test proves no answer flash; update PR5a scan expectation to allow exactly the new route file while still rejecting in-app links/imports.
- [ ] 5b.6 GREEN: atomically create `src/app/capstone/unidad-1-rotonda/page.tsx`, `CapstoneProvider.tsx`, and three runner views; mount complete runner as gate children; 5b.1–5b.5 pass.

## Phase 6 (PR6): Atomic Home activation + full E2E + regressions

- [ ] 6.1 RED: `HomeNextStepClient` renders `UnitCapstoneCard` after the hero only when eligible; never renders otherwise; `UnitCapstoneCard` import + render site isolated to the eligible branch; non-eligible branches unchanged.
- [ ] 6.2 GREEN: wire `UnitCapstoneCard` into `src/components/home/HomeNextStepClient.tsx`; 6.1 passes; the PR5a source-scan regression is updated to admit `HomeNextStepClient.tsx` as the single authorized import site (centralization invariant: a positive test asserts the import exists and is the only one across `src/components/home/**`).
- [ ] 6.3 RED: `tests/e2e/specs/u1-rotonda-capstone.spec.ts` (full integration) — mastered-U1 seed → home card visible → click → theory → 5 stages → completion; reload at `Verificar` resumes; `"72,32"` accepted; repeat keeps `everCompleted`; Unit 2 still available; no Phase 1/2/3 screens changed.
- [ ] 6.4 GREEN: full-suite verification — `pnpm run test`, `pnpm run typecheck`, `pnpm run build`, `pnpm run test:e2e tests/e2e/specs/u1-rotonda-capstone.spec.ts`.

## Phase 7: Apply-phase bookkeeping (deferred)

- [ ] 7.1 Apply executor updates `STATUS.json` per PR merge: resets `branch = null`; appends `pr1` … `pr6` subentries (branch, mergedTo, mergeCommit, summary) per chained-pr convention. Planning metadata is finalized; this task belongs to the apply phase.

## Spec scenario coverage matrix

| Spec scenario | Tasks |
|---|---|
| Incomplete or genuine U1 (card visibility) | 4.1, 4.2, 6.1, 6.2 |
| Repeated completion (no contamination) | 3.3, 4.1, 5b.4, 6.3 |
| Textual model is sufficient (no diagram) | 2.3, 2.8 |
| Exact and approximate results (math contract) | 2.2 |
| Stage responsibilities distinct | 1.3, 1.4, 2.5, 2.6 |
| Controls, decimals, no answer leak | 1.5, 1.7, 1.8, 2.1, 2.8, 5b.2 |
| Resume and recover (stale/malformed/version-safe) | 3.1, 3.2, 3.3, 5b.4, 6.3 |
| Branded accessible use (a11y, 44px, narrow, no tutor copy) | 2.4, 4.1, 4.2, 5b.3, 5b.6 |
| Unit 2 / mastery / base / challenge invariance | 5b.4, 5b.5, 6.3, 6.4 |
| Client gate fail-closed (loading / absent / malformed / ineligible) | 5a.1, 5a.2, 5a.3, 5a.5, 5a.6, 5b.1, 5b.5 |
| Route undiscoverable from in-app surfaces before PR6 | 5a.5, 5a.6, 5b.5, 6.2 |
