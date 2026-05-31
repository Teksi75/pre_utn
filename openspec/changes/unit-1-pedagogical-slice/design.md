# Design: Unit 1 Pedagogical Slice

## Technical Approach

Keep the existing Unit 1 guided flow and add Phase 12 as a small, additive interval representation layer. The interval model, normalization, and validation stay pure under `src/domain/intervals`; React renders that structured data with a reusable SVG/CSS number line in `src/components/practice`. Content JSON may reference interval graphics from theory concepts, worked-example steps, multiple-choice options, and feedback, but copied static images remain out of scope.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Interval ownership | Create `src/domain/intervals` for pure interval data, helpers, aria text, and validators. | Add ad-hoc objects inside React cards or parse strings in components. | Domain remains framework-free and tests can prove open/closed/unbounded semantics. |
| Rendering | Create `IntervalNumberLine.tsx` in `src/components/practice` using SVG for line, segment/ray, endpoint circles, arrows, and labels. | Canvas, static images, or CSS-only bars. | SVG is accessible, small, responsive, and precise enough for endpoint states. |
| Content integration | Add optional `intervalRepresentations` arrays to relevant content models and optional interval metadata for exercise options/feedback. | Replace existing text fields. | Additive schema avoids breaking existing Unit 1 flow while enabling visual-ready content. |
| Option rendering | Keep answer value as string; allow option objects with `label`, `value`, and optional `intervalRepresentation`. | Make all options structured objects only. | Preserves current evaluator expectations and multiple-choice validation with minimal change. |

## Data Flow

    content JSON ──→ catalog loaders ──→ domain validators
         │                  │                    │
         │                  └── IntervalRepresentation[]
         │                                       │
         └──→ TheoryCard / WorkedExampleCard / AnswerForm / FeedbackDisplay
                                         │
                                         └── IntervalNumberLine SVG + aria fallback

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/intervals/index.ts` | Create | `IntervalRepresentation`, bounds, endpoint inclusion, notation/condition/aria validation. |
| `src/domain/__tests__/intervals.test.ts` | Create | TDD for bounded, unbounded, open/closed, infinity, and aria text. |
| `src/domain/models/theory.ts` | Modify | Allow `ConceptBlock.intervalRepresentations?: readonly IntervalRepresentation[]`. |
| `src/domain/models/worked-example.ts` | Modify | Allow `SolutionStep.intervalRepresentations?: readonly IntervalRepresentation[]`. |
| `src/domain/models/exercise.ts` | Modify | Add `ExerciseOption` object support and optional `feedbackIntervalRepresentations`. |
| `content/matematica/theory/unit-1.json` | Modify | Add interval graphics to interval notation and graphical-representation concepts. |
| `content/matematica/examples/unit-1.json` | Modify | Add graphics to interval examples where inequality/interval/graph translation is taught. |
| `content/matematica/exercises.json` | Modify | Add graphics to interval multiple-choice options where useful; keep string `expectedAnswer`. |
| `content/matematica/feedback/unit-1.json` | Modify | Add corrective interval graphic for endpoint-inclusion feedback. |
| `src/components/practice/IntervalNumberLine.tsx` | Create | Reusable client-safe renderer for notation, condition, number line, endpoints, rays, labels. |
| `src/components/practice/{TheoryCard,WorkedExampleCard,AnswerForm,FeedbackDisplay}.tsx` | Modify | Render optional interval graphics without changing non-interval content. |
| `src/domain/index.ts` | Modify | Export interval contracts. |

## Interfaces / Contracts

```ts
type IntervalBound = { kind: "finite"; value: number; label?: string } | { kind: "infinity"; direction: "negative" | "positive" };
type EndpointInclusion = "open" | "closed";
interface IntervalRepresentation {
  id: string;
  notation: string;
  setBuilderLabel: string;
  lower: IntervalBound;
  upper: IntervalBound;
  lowerInclusion: EndpointInclusion;
  upperInclusion: EndpointInclusion;
  ariaLabel: string;
}
type ExerciseOption = string | { value: string; label: string; intervalRepresentation?: IntervalRepresentation };
```

Rules: infinity bounds must be `open`; finite closed/open endpoints must match notation and set-builder label; `ariaLabel` must mention notation, condition, endpoint inclusion, and ray direction for unbounded intervals.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit/domain | Interval validation, normalization, aria generation, exercise option compatibility. | Vitest TDD in `src/domain/__tests__/intervals.test.ts` and `exercise.test.ts`. |
| Integration | JSON content with interval representations loads and validates. | Extend catalog content tests for Unit 1. |
| UI | SVG renders open/closed endpoints, bounded segments, rays/arrows, labels, option graphics, feedback graphic. | Component tests if available; otherwise targeted DOM tests plus manual smoke. |
| Verification | Regression suite. | `pnpm run test`, `pnpm run typecheck`, `pnpm run build`, then GGA. |

## Migration / Rollout

No migration required. This is additive content/model metadata; existing practice progress and string answers remain valid.

## Open Questions

- [ ] Should Phase 12 support union/intersection graphics as multiple intervals now, or defer composite interval rendering to a later slice?
