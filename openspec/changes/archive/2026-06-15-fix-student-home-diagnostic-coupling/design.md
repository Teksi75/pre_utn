# Design: Fix Student Home Diagnostic Coupling

## Technical Approach

Two surgical changes, both TDD-tested, to wire `loadDiagnosticResult()` into the home dashboard and fix the `buildMission()` selector so a completed diagnostic is treated as a valid first interaction. The spec delta adds a new requirement ("Diagnostic counts as first interaction") and modifies "No Invented Evidence" to recognize the diagnostic as evidence of student engagement.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Wire `loadDiagnosticResult()` in the component `useEffect` | Component reads two localStorage keys per render | Chosen: the effect already runs client-side and reads `localStorage` via `loadProgress()`; one more read is negligible and avoids new abstractions. |
| Pass `diagnosticResult` through `StudentHomeInput` | Existing field already declared but underused | Chosen: `StudentHomeInput.diagnosticResult` exists; the domain already supports it. The wiring layer just never populated it from the live source. |
| Update `buildMission` signature to accept `diagnosticResult` | Signature changes from 2 to 3 params | Chosen: the function is internal (not exported), called from one site (`deriveStudentHomeViewModel`), and the domain is pure TS — no React impact. |
| Keep `progress.diagnosticResult` as fallback | Two sources of truth for a transition period | Chosen: legacy data may still live on `progress`; the fallback chain `activeDiagnosticResult ?? progress.diagnosticResult ?? null` is safe and preserves backward compatibility. |

## Data Flow

```text
HomeNextStepClient (useEffect)
  ├─ loadProgress()          → PracticeProgress
  ├─ loadDiagnosticResult()  → DiagnosticResult | null   ← NEW
  ├─ deriveHomeNextStep(...)
  └─ deriveStudentHomeViewModel({ progress, diagnosticResult: active ?? legacy, ... })
       ├─ buildMission(progress, nextStep, diagnosticResult)   ← CHANGED
       │    └─ condition: attempts.length === 0 && !diagnosticResult
       └─ buildStudentSituation(..., diagnosticResult)          ← ALREADY HANDLED
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/home/HomeNextStepClient.tsx` | Modify | Import `loadDiagnosticResult`; call it in `useEffect` after `loadProgress()`; pass result as `diagnosticResult` field with legacy fallback. |
| `src/domain/student-home/index.ts` | Modify | `buildMission` signature adds `diagnosticResult: DiagnosticResult \| null`; condition becomes `attempts.length === 0 && !diagnosticResult`. |
| `src/domain/__tests__/derive-student-home-view-model.test.ts` | Modify | Update test at line 195 to pin `diagnosticResult: null`; add 2 new tests for diagnostic-completed scenario. |
| `openspec/specs/teacher-digital-home/spec.md` | Modify | Apply spec delta: add "Diagnostic counts as first interaction" requirement; modify "No Invented Evidence" first scenario. |
| `openspec/changes/STATUS.json` | Modify | Add entry: `status: "in-progress"`, `branch: "fix/student-home-diagnostic-coupling"`. |

## Interfaces / Contracts

```ts
// buildMission — internal, not exported
// Before:
function buildMission(progress: PracticeProgress, nextStep: HomeNextStep): Mission

// After:
function buildMission(
  progress: PracticeProgress,
  nextStep: HomeNextStep,
  diagnosticResult: DiagnosticResult | null
): Mission
```

The caller (`deriveStudentHomeViewModel`, line 107) passes `diagnosticResult` from `StudentHomeInput` — no interface change needed.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Mission CTA behavior with diagnostic completed but no attempts | New test: input with `attempts: []`, `diagnosticResult` non-null → assert `ctaLabel !== "Hacer diagnóstico inicial"` and `ctaHref !== "/diagnostic"`. |
| Unit | Diagnostic CTA preserved when neither diagnostic nor attempts exist | Update existing test (line 195) to pin `diagnosticResult: null` explicitly. |
| Unit | `diagnosticCompletedAt` reflects stored result | New test: same input → assert `studentSituation.diagnosticCompletedAt` equals the stored timestamp. |
| Integration | Existing happy path and diagnostic-data tests still pass | No changes needed to tests at lines 566-623. |
| Build | Typecheck and build clean | `pnpm run typecheck && pnpm run build`. |

## Migration / Rollout

No migration required. Both localStorage keys remain intact. The fallback chain (`activeDiagnosticResult ?? progress.diagnosticResult ?? null`) ensures legacy data is still read during the transition.

## Open Questions

None.
