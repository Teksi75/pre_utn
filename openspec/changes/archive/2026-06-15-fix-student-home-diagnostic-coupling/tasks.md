# Tasks: Fix Student Home Diagnostic Coupling

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~80–120 (3 source files + 1 spec + 1 STATUS.json + tests) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single branch, 4 work-unit commits |
| Delivery strategy | single-pr-default (direct commits to main, matching `close-student-home-tech-debt` pattern) |
| Chain strategy | n/a |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: n/a
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Notes |
|------|------|-------|
| 1 | TDD tests: pin new diagnostic-completed contract | Single test file commit |
| 2 | Implementation: wire loadDiagnosticResult() and fix buildMission() | `HomeNextStepClient.tsx` + `student-home/index.ts` |
| 3 | Spec delta: apply to canonical spec | `openspec/specs/teacher-digital-home/spec.md` |
| 4 | Registry: register change in STATUS.json | `openspec/changes/STATUS.json` |

## Phase 1: TDD — write failing tests

- [ ] 1.1 In `src/domain/__tests__/derive-student-home-view-model.test.ts:195-202`: update the existing test "mission CTA points to /diagnostic when no attempts" to also pass `diagnosticResult: null` in the input, so the test name becomes "mission CTA points to /diagnostic when no attempts and no diagnostic".
- [ ] 1.2 Add new test: "mission CTA does NOT point to /diagnostic when diagnostic is completed and attempts is empty" — same `describe` block, immediately after 1.1. Assert `ctaHref !== "/diagnostic"` and `ctaLabel !== "Hacer diagnóstico inicial"`.
- [ ] 1.3 Add new test: "studentSituation.diagnosticCompletedAt reflects the stored diagnostic" — same `describe` block. Assert `studentSituation.diagnosticCompletedAt` equals the input `diagnosticResult.completedAt` timestamp.
- [ ] 1.4 Run `pnpm run test -- derive-student-home-view-model` and confirm: test 1.1 passes (existing behavior preserved), tests 1.2 and 1.3 fail (RED — TDD).

## Phase 2: Implementation — make tests green

- [ ] 2.1 In `src/domain/student-home/index.ts`: change `buildMission(progress, nextStep)` signature to `buildMission(progress, nextStep, diagnosticResult)`. Update the condition inside to `attempts.length === 0 && !diagnosticResult?.completedAt`. Update the caller in `deriveStudentHomeViewModel` to pass `diagnosticResult` from `StudentHomeInput`.
- [ ] 2.2 In `src/components/home/HomeNextStepClient.tsx`: add `loadDiagnosticResult` import; call it inside the `useEffect`; pass it as `diagnosticResult` field to `deriveStudentHomeViewModel`, keeping the legacy `progress.diagnosticResult` fallback as `activeDiagnosticResult ?? progress.diagnosticResult ?? null`.
- [ ] 2.3 Run `pnpm run test -- derive-student-home-view-model` — all 3 tests must be green.
- [ ] 2.4 Run `pnpm run typecheck` and `pnpm run build` — both must be clean.

## Phase 3: Spec delta — apply to canonical spec

- [ ] 3.1 Edit `openspec/specs/teacher-digital-home/spec.md`: add new requirement "Diagnostic counts as first interaction" with its 4 scenarios from the delta spec.
- [ ] 3.2 Edit `openspec/specs/teacher-digital-home/spec.md`: in the "No Invented Evidence" requirement's first scenario, add `diagnosticResult = null` to the GIVEN clause so it explicitly pins the null-diagnostic case.
- [ ] 3.3 Verify the spec structure is intact: requirements table, scenarios under each requirement, non-goals, and acceptance criteria all present.

## Phase 4: Registry and housekeeping

- [ ] 4.1 Edit `openspec/changes/STATUS.json`: add entry for `fix-student-home-diagnostic-coupling` with `status: "in_progress"`, `branch: "fix/student-home-diagnostic-coupling"`, `startedAt: "2026-06-15"`. Do NOT set `mergeCommit` (only set on done).

## Phase 5: Work-unit commits

- [ ] 5.1 Commit 1 (`test(home): pin new contract for diagnostic-completed students`): staged files: `src/domain/__tests__/derive-student-home-view-model.test.ts`.
- [ ] 5.2 Commit 2 (`fix(home): wire loadDiagnosticResult() and treat diagnostic as first interaction`): staged files: `src/components/home/HomeNextStepClient.tsx`, `src/domain/student-home/index.ts`.
- [ ] 5.3 Commit 3 (`chore(sdd): apply spec delta for diagnostic-coupling fix`): staged file: `openspec/specs/teacher-digital-home/spec.md`.
- [ ] 5.4 Commit 4 (`chore(sdd): register fix-student-home-diagnostic-coupling in STATUS.json`): staged file: `openspec/changes/STATUS.json`.

## Phase 6: Verification (sdd-verify phase, not apply)

- [ ] 6.1 Full test suite green: `pnpm run test`
- [ ] 6.2 Typecheck clean: `pnpm run typecheck`
- [ ] 6.3 Build green: `pnpm run build`
- [ ] 6.4 Manual smoke (optional): complete the diagnostic, visit `/`, observe mission CTA points to practice (not "Hacer diagnóstico inicial") and "TU SITUACIÓN" shows the diagnostic completion date.
