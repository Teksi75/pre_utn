# Design: First Usable Student Experience

## Technical Approach

Implement a thin vertical slice over the existing pure math domain: first improve `evaluateAnswer()` with deterministic error-tag assignment, then add guided-practice and diagnostic UI that consume catalog/evaluator contracts without introducing persistence. `src/domain/` remains side-effect free; Next.js routes/components only orchestrate local state and rendering.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Error tagging location | Add `src/domain/evaluator/error-tagging.ts` and call it from `src/domain/evaluator/index.ts` after incorrect supported evaluations | Embed rules in numeric/exact evaluators; tag in UI | Keeps comparison and pedagogy separate, preserves pure TDD, and enforces `exercise.commonErrorTags` gating centrally. |
| Rule scope | Start with explicit deterministic rules for declared catalog tags only | Broad symbolic parser; AI/LLM feedback | MVP needs reliable, explainable patterns under review budget; unsupported patterns return no tag. |
| Practice UI state | Use client components with local React state under `src/app/practice/` | Supabase/session persistence now | Proposal excludes persistence; local state is enough for first usable loop and easy to revert. |
| Diagnostic logic | Put pure selection/scoring in `src/domain/diagnostic/` and render via `src/app/diagnostic/` | Do all scoring in React | Balanced selection and weak-skill estimation need TDD and must stay framework-free. |

## Data Flow

```text
Catalog/skills ──→ Practice route ──→ evaluateAnswer()
      │                    │              │
      │                    └── feedback ← errorTagging
      └──→ Diagnostic selector ──→ attempts ──→ skill estimate ──→ practice links
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/domain/evaluator/error-tagging.ts` | Create | Pure rule matcher returning a declared tag or `undefined`. |
| `src/domain/evaluator/index.ts` | Modify | Pass full `Exercise` context through tagging for incorrect supported answers. |
| `src/domain/__tests__/evaluator-error-tagging.test.ts` | Create | RED/GREEN tests for declared, undeclared, and unrelated wrong answers. |
| `src/domain/diagnostic/index.ts` | Create | Deterministic balanced selection, attempt summary, weakest-skill suggestions. |
| `src/domain/__tests__/diagnostic.test.ts` | Create | TDD coverage for balance, insufficient catalog, provisional accuracy ranking. |
| `src/app/page.tsx` | Modify | Link to practice and diagnostic entry points. |
| `src/app/practice/page.tsx` | Create | Unit/skill/exercise/answer/feedback flow. |
| `src/app/diagnostic/page.tsx` | Create | Short diagnostic shell and weak-area suggestions. |
| `src/components/practice/*` | Create | Small presentational components for selection, exercise card, answer form, feedback. |
| `src/components/diagnostic/*` | Create | Diagnostic question and results components. |

## Interfaces / Contracts

```ts
type Attempt = { exerciseId: ExerciseId; skillId: SkillId; correct: boolean; errorTag?: string };
type DiagnosticSelection = { ok: true; exercises: Exercise[] } | { ok: false; missingCoverage: string[] };
type SkillEstimate = { skillId: SkillId; accuracy: number; attempts: number; provisional: true; errorTags: string[] };
```

`evaluateAnswer(exercise, userAnswer)` keeps its public shape; correct answers never include `errorTag`. Incorrect supported answers MAY include one declared `commonErrorTags` match. Manual-review results remain unchanged.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Error-tag matching and diagnostic scoring | Vitest TDD in `src/domain/__tests__/`; no React imports. |
| Component | Practice/diagnostic rendering states | Add focused React tests only if test tooling exists in apply; otherwise cover via build/typecheck. |
| E2E | Full student loop | Deferred until Playwright exists; document manual smoke path in verify. |

## PR / Review Slicing

| Slice | Scope | Depends on | Budget |
|---|---|---|---|
| PR1 | Domain evaluator tagging + tests | Current domain | ~150 lines |
| PR2 | Guided practice route/components using PR1 | PR1 | ~300 lines |
| PR3 | Diagnostic domain + route/components | PR1, optionally PR2 links | ~350 lines |

Use chained/stacked PRs if actual diff exceeds forecast. Each PR keeps tests with code and remains independently revertable; no slice should exceed 400 additions+deletions without explicit `size:exception`.

## Migration / Rollout

No migration required. No Supabase persistence in this change.

## Open Questions

- [ ] None blocking.
