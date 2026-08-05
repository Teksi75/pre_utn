# Design: Fix U3 Mathematical Rendering

## Technical Approach

Keep `parseRichTextSegments`, `RichText`, `InlineMath`, `BlockMath`, and KaTeX unchanged. Correct the source strings in `content/matematica/exercises/unit-3.json` so every affected expression reaches the existing `$...$`/`$$...$$` pipeline as valid LaTeX. Use inline delimiters for embedded expressions and display delimiters only for standalone equations. The implementation follows strict TDD: add the parser-backed guard in RED state, apply explicit content corrections, then refactor the test helpers and prove readability and scope.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| Rendering boundary | Author explicit delimiters and LaTeX in content | Implicit symbol detection or parser rewrites | The existing pipeline is correct; content-only repair avoids false positives and UI/domain risk. |
| Option answer identity | For a math-bearing option, use the existing `{ value, label }` form: preserve raw `value`, put delimited LaTeX in `label` | Put delimiters into the raw option string | `getOptionValue` and `evaluateAnswer` compare exact answer values. The object pattern renders `label` through `RichText` without changing answer keys. |
| Regression proof | Scan every target prompt, option display value, and note, plus an explicit metadata projection | Hand-check only named examples | A dynamic field scan catches omissions such as a second fraction in a distractor or note while the projection proves unrelated data is stable. |

## Data Flow

```text
unit-3.json (+ exercises.json baseline)
        └─→ ExerciseCard / option label / FeedbackDisplay
             └─→ RichText → parseRichTextSegments
                  ├─ text segments: no bare math markers
                  └─ math segments: InlineMath/BlockMath → KaTeX
```

The test imports both catalog sources, selects the target IDs, and parses the exact strings that the UI renders (`prompt`, `pedagogicalNote`, string options, or object-option `label`).

## File Changes

| File | Action | Description |
|---|---|---|
| `content/matematica/exercises/unit-3.json` | Modify | Delimit and translate math in all affected fields for the 17 exponential IDs and `ex.u3.ecuaciones_lineales.6`; preserve prose, raw option values, and metadata. |
| `src/components/math/__tests__/exponenciales-render-safety.test.ts` | Create | Parser-backed coverage, KaTeX validity checks, target-ID/order assertions, and preservation checks. |
| `src/components/math/*`, `src/domain/*` | No change | Explicitly exclude parser, renderer, loader, evaluator, schema, and domain changes. |

## Interfaces / Contracts

Target exponential order is exactly `.2, .3, .4, .5, .03, .6, .7, .8, .9, .10, .11, .12, .13, .14, .15, .16, .17`; `ex.u3.ecuaciones_lineales.6` must occur once. The test must:

- deep-compare a baseline projection for every target: `id`, `skillId`, `type`, `difficulty`, `expectedAnswer`, `commonErrorTags`, optional `tags`, `category`, `answerSpec`, `canonicalTrace`, and other non-render fields;
- compare each options array’s length and raw `value` sequence, preserving answer keys and option order exactly;
- compare unaffected prompt/note fields exactly, while allowing only the listed display strings to change;
- reject bare `^`, `√`, numeric fractions (`\d+\s*/\s*\d+`), and the inventory’s equivalent bare visual tokens in plain segments;
- require each intended math segment to be non-empty and pass `katex.renderToString` with `throwOnError: true`, preserving the parser’s `displayMode`.

Use forms such as `\sqrt{32}`, `\frac{5}{2}`, `\cdot`, `2^{x+1}`, `\log_2(12)`, and `\frac{\ln 20}{\ln 3}`. For options, `value` remains the original answer text and only `label` receives these render-safe forms.

## Testing Strategy

| Phase | Test | Proof |
|---|---|---|
| RED | Add the focused test first and run it with `pnpm run test -- src/components/math/__tests__/exponenciales-render-safety.test.ts` | Baseline fails on existing plain caret/root/fraction content. |
| GREEN | Correct JSON content, including object options where needed | All 17 IDs plus lineales.6 are scanned; every rendered math segment is valid KaTeX and metadata/order checks pass. |
| REFACTOR | Simplify names/comments without changing contracts; review the targeted diff | Focused test is rerun, then only `pnpm run test`, `pnpm run typecheck`, and `pnpm run build`. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary is changed.

## Migration / Rollout

No migration required. Reviewable local conventional commits are allowed: RED test, content GREEN, and readability proof. Do not push, open a PR, merge, remove the worktree, or touch/archive `expand-u3-exponentials`. Leave logarithmic and quadratic cleanup for separate SDD changes.

## Open Questions

None.
