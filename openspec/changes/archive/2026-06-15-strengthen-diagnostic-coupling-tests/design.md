# Design: Strengthen Diagnostic Coupling Tests

## Technical Approach

Test-only change. Two surgical additions to existing test files — no production code touched. The work locks contracts left partially-covered by `fix-student-home-diagnostic-coupling` (b9ef7da): (a) direct regression tests for `deriveHomeNextStep`'s 4th `effectiveDiagnosticResult` parameter, and (b) explicit sub-assertions on 3 existing view-model tests.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Append to existing `next-step.test.ts` vs create new file | Keeps related tests together vs isolating the new contract | **Chosen**: `src/domain/__tests__/next-step.test.ts` already exists with a `progress()` helper. Add a new `describe` block at the end — no new file, no new helpers. |
| 2 work units vs 4 | Fewer commits = simpler history vs granular revert | **Chosen**: 2 commits — one for test additions, one for spec delta + STATUS.json. The change is ~50 lines total; 4 commits is overkill. |
| Use existing `progress()` helper from next-step.test.ts | Consistency with existing test style | **Chosen**: the helper already handles defaults (`attempts: []`, `diagnosticResult: null`). New tests pass only the overrides they need. |

## Data Flow

```text
Test A (next-step.test.ts)
  progress({ attempts: [] }) + effectiveDiagnosticResult (non-null)
    → deriveHomeNextStep(...)
      → nextStep.kind === "practice"     ✓ locked

Test B (next-step.test.ts)
  progress({ attempts: [] }) + effectiveDiagnosticResult = null
    → deriveHomeNextStep(...)
      → nextStep.kind === "diagnostic"   ✓ locked

Tests C/D/E (derive-student-home-view-model.test.ts)
  Existing tests + new expect(...) calls
    → sub-conditions now explicitly asserted
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/__tests__/next-step.test.ts` | Modify | Add `describe("deriveHomeNextStep — effectiveDiagnosticResult")` with 2 tests at end of file (~25 lines) |
| `src/domain/__tests__/derive-student-home-view-model.test.ts` | Modify | Add 1-2 `expect(...)` calls to each of 3 existing tests (lines 197, 206, 222) (~10 lines) |
| `openspec/specs/teacher-digital-home/spec.md` | Modify | Apply spec delta: MODIFIED requirement (4 scenarios with sub-assertion lists) + ADDED requirement (2 scenarios) |
| `openspec/changes/STATUS.json` | Modify | Add entry: `status: "in-progress"`, `branch: "fix/strengthen-diagnostic-coupling-tests"` |

## Interfaces / Contracts

The `kind` enum from `src/domain/next-step/index.ts` (line 11):

```ts
type HomeNextStepKind = "diagnostic" | "practice" | "continue-unit";
```

The 4th parameter signature (line 61):

```ts
function deriveHomeNextStep(
  progress: Pick<PracticeProgress, "attempts" | "accuracyBySkill" | "trendBySkill" | "diagnosticResult">,
  readySkills: readonly ReadySkill[],
  pilotSkills: readonly ReadySkill[] = readySkills,
  effectiveDiagnosticResult?: DiagnosticResult | null
): HomeNextStep
```

Test assertions target `"practice"` (not `"start"` — the proposal's wording was imprecise; source confirms `"practice"`).

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `effectiveDiagnosticResult` non-null → `kind: "practice"` | New test in next-step.test.ts, 4th param overrides null `progress.diagnosticResult` |
| Unit | `effectiveDiagnosticResult` null → `kind: "diagnostic"` | New test, 4th param is null, falls back to null progress diagnostic |
| Unit | Mission CTA positive coupling to `nextStep.href` | Strengthened assertion in existing test (line 206) |
| Unit | `ctaLabel` exact match + `diagnosticCompletedAt` null check | Strengthened assertions in existing tests (lines 197, 222) |

All tests pass on first run — production code already satisfies the contract. TDD discipline: write → confirm green → commit.

## Migration / Rollout

No migration required. Test-only change, no production code, no data.

## Open Questions

- [ ] None — all decisions resolved from source code reading.
