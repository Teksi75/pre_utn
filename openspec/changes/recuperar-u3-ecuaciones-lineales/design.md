# Design: Recover U3 Linear Equations

## Technical Approach

Deliver two chained, independently reviewable content/domain slices for `mat.u3.ecuaciones_lineales`. PR1 makes the existing MC-only isolation detector reachable without trace infrastructure. PR2 adds the adapted canonical P1l item and challenge, then introduces the rationalization tag end-to-end. The canonical-trace dependency is SATISFIED by PR #98 (merge commit `e553648079cd7b6f9864683d4ab4d694b4f6a8e7`; head `feat/u3-traza-canonica-parser` @ `d4c77a5`), which delivered `parseOptionalCanonicalTrace` and `auditU3TraceSourceUse` to `main`.

## Architecture Decisions

| Decision | Alternatives / trade-off | Rationale |
|---|---|---|
| Split by pedagogical milestone | One vertical PR would exceed the 400-line review budget | PR1 is useful and deployable alone; PR2 is the canonical-max extension. |
| Add MC items; retain four numerical items | Convert existing numerical exercises | `isU3AislamientoIncorrectoError` is MC-only; additions preserve existing surfaces and make its declared-tag guard reachable. |
| Add, do not replace, the rationalization tag | Reuse a U1 rationalization tag | The misconception is specifically an irrational *linear-equation coefficient*; U3 feedback and analytics need that distinction. |
| Keep trace vocabularies separate | Share a single `sourceUse` union | Exercise traces use `adapted | reinforcement | reference` (U3 excludes `alignment`); challenge traces use `adapted` for this adapted item, from the challenge union. |

## Data Flow

```text
unit-3 exercise/challenge JSON
        -> catalog/challenge loader -> Exercise
        -> evaluateAnswer -> tagError (declared-tag guarded)
        -> feedback mapping -> learner recovery message
```

PR1 adds MC answers whose known distractors activate `u3_aislamiento_incorrecto`. PR2 adds P1l MC distractors; the rationalization detector returns `u3_racionalizacion_irracional` only for a declared P1l-style item when the selected option preserves the prompt radicand/denominator or uses its non-matching conjugate. Correct rationalization and unrelated wrong answers remain untagged.

## File Changes

| File | Slice | Action | Description |
|---|---|---|---|
| `content/matematica/exercises/unit-3.json` | PR1, PR2 | Modify | Add isolation MC items (`6a`, `6b`, etc.); then `ex.u3.ecuaciones_lineales.6`, difficulty 4, four MC options, adapted exercise trace. |
| `src/domain/__tests__/u3-exercise-shape.test.ts` | PR1, PR2 | Modify | Assert isolation reachability; later admit the thirteenth declared U3 tag and P1l MC shape. |
| `src/domain/__tests__/content-loaders-u3.test.ts` | PR1, PR2 | Modify | Assert catalog/readiness loading; later assert P1l and feedback growth. |
| `content/matematica/challenges/unit-3.json` | PR2 | Modify | Add one adapted P1l challenge, difficulty 5, four MC options, Spanish-neutral pedagogical fields and challenge trace. |
| `content/matematica/feedback/unit-3.json` | PR2 | Modify | Add recovery feedback for irrational-coefficient rationalization. |
| `src/domain/error-taxonomy/index.ts` | PR2 | Modify | Add complete `u3_racionalizacion_irracional` metadata conforming to the `ErrorTag` contract `{ id, unit, description, examples }` — `description` is the pedagogical visible explanation in Spanish-neutral language; no `label` field, no model widening. |
| `src/domain/evaluator/error-tagging.ts` | PR2 | Modify | Add the safe-first rationalization predicate and U3 dispatch. |
| `src/domain/__tests__/error-tagging-u3.test.ts` | PR2 | Modify | RED/GREEN tests for firing, correct-answer non-firing, and declaration scope. |
| `src/domain/__tests__/error-taxonomy-u3.test.ts` | PR2 | Modify | Preserve all 12 baseline IDs and assert exactly 13 U3 tags afterward. |
| `src/lib/challenges/__tests__/loader.test.ts` | PR2 | Modify | Assert the new skill challenge loads at difficulty 5 with valid challenge trace/MC shape. |

## Interfaces / Contracts

```ts
// PR2 only; data remains in pure domain/content boundaries.
type ExerciseU3TraceSourceUse = "adapted" | "reinforcement" | "reference";
type ChallengeSourceUse =
  | "canonical-source" | "adapted" | "calibrated-from-exam" | "solution-pattern";

// PR2 consumes the canonical ErrorTag exported from
// src/domain/models/error-tag.ts without redefining it.
// No label is added or emulated; description provides pedagogical explanatory text.
// examples remains readonly string[]; this slice does not widen, redefine, or migrate ErrorTag.
```

The 12-tag baseline is the original eight, three modeling tags, and legacy `u3_direccion_desigualdad`. PR2 adds only `u3_racionalizacion_irracional`, yielding 13. Irrational expressions use MC; no structured free-text answer is introduced.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit (PR1) | Isolation tag is reachable from loaded MC content | RED catalog/shape/readiness assertions, then content. |
| Unit (PR2) | Taxonomy, detector, feedback, P1l and challenge loading | RED detector positive/negative/declaration tests; loader and 12-to-13 regression assertions. |
| Integration | Evaluator returns tag and matching feedback for selected distractors | Use `evaluateAnswer` with loaded P1l/challenge data. |
| Build | Type and production integrity | `pnpm run test`, `pnpm run typecheck`, `pnpm run build` after each slice. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No data migration. PR1 targets `main` and is reversible by its catalog/test files. PR2 targets PR1; its canonical-trace dependency is SATISFIED by PR #98 (merge `e553648`, head `feat/u3-traza-canonica-parser` @ `d4c77a5`). Because this planning checkout remains at c9712cf with stale local refs, PR2 implementation MUST verify `e553648` is an ancestor of its base (`git merge-base --is-ancestor e553648079cd7b6f9864683d4ab4d694b4f6a8e7 HEAD` returns 0) OR `parseOptionalCanonicalTrace` and `auditU3TraceSourceUse` are importable from `src/domain`, before writing any `canonicalTrace` entry; if verification fails, PR2 MUST NOT proceed. PR2 is then independently revertible. Each slice must remain at or below 400 authored changed lines.

## Open Questions

None.
