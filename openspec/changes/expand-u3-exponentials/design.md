# Design: Expand U3 Exponentials Practice Bank

## Technical Approach

Extend only `mat.u3.exponenciales` in `unit-3.json` with 13 original entries, producing 17 total. Existing loaders, evaluators, and `ExerciseAnswerInput` support all required types, so no domain, route, renderer, taxonomy, or feedback-file change is needed. Entries use `u3_igualdad_exponenciales` feedback and `pedagogicalNote` guidance. There is no per-exercise hint/solution UI; evidence verifies prompt, options/field, and post-answer corrective feedback.

## Architecture Decisions

| Decision | Alternatives / trade-off | Rationale |
|---|---|---|
| Content-only extension | New renderer, tags, feedback copy | Existing loader, evaluator, and U3 feedback cover the change. |
| One sortable d2 bridge | Lower `.3`; non-schema ID; omit d2 | Add `ex.u3.exponenciales.03` at d2. It passes the numeric-suffix parser. `.2` sorts first (2 < 3); `.03` and `.3` tie at 3, then lexical `.03` < `.3`. |
| Normalize only `.4` | Rewrite existing exercises | Raise `.4` 1→3, the minimum after `.3=3`; preserve `.2`, `.3`, `.5`. |

## Data Flow

`unit-3.json` → loaders → `queryBySkill` → `usePracticeFlow` → `ExerciseAnswerInput` → `evaluateAnswer` → U3 feedback.

Natural difficulty order is `[.2=1, .03=2, .3=3, .4=3, .5=3, .6=.8=3, .9=.12=4, .13=.17=5]`; it is non-decreasing and includes five d5 items.

## Coverage Matrix

Each row uses `category: "exponenciales"`, `commonErrorTags: ["u3_igualdad_exponenciales"]`, original content, near-miss selectable distractors, and a procedure/misconception `pedagogicalNote`.

| New ID | Family / d / type | Learning procedure and guidance |
|---|---|---|
| `.03` | radical common-base / 2 / MC | Rewrite radicals as powers; equate exponents. |
| `.6` | constant RHS exponent-zero / 3 / true-false | Rewrite the constant as 1. |
| `.7` | common `a^x` factor / 3 / fill-blank | Factor; use positivity; enter one scalar. |
| `.8` | negative-exponent equalization / 3 / MC | Rewrite reciprocal as a negative power; preserve sign. |
| `.9` | quadratic in `a^x` / 4 / MC | Substitute `t=a^x`; reject inadmissible `t`. |
| `.10` | mixed-base substitution / 4 / numerical | Rewrite to one base; solve a scalar branch. |
| `.11` | sum-of-powers factorization / 4 / true-false | Recognize and factor the power sum before solving. |
| `.12` | quadratic exponent equals one / 4 / MC | Set exponent to zero and factor it; selectable dual result. |
| `.13` | symmetric `t+k/t` / 5 / MC | Substitute, clear denominator, validate positive `t`. |
| `.14` | `e^x`/`e^-x` polynomial / 5 / MC | Set `t=e^x>0`; reject non-positive roots. |
| `.15` | different bases, logs / 5 / MC | Change base; select an approximate scalar. |
| `.16` | fractional exponents from radicals / 5 / MC | Convert radical bases to fractional powers, then equalize. |
| `.17` | combined bases / 5 / fill-blank | Rewrite every term to one base and enter one finite scalar. |

This covers 13 benchmark families and all four types without prohibited free text. New `u3-exponentials-coverage.test.ts` is the executable matrix audit and rejects literal P39 matches without embedding canonical expressions.

## File Changes

| File | Action | Description |
|---|---|---|
| `content/matematica/exercises/unit-3.json` | Modify | Add 13 rows; preserve `.2`–`.5`, raising only `.4`. |
| `src/domain/__tests__/content-loaders-u3.test.ts` | Modify | Assert 17-item loaded bank, readiness, diagnostics, and U3 threshold non-regression. |
| `src/domain/__tests__/u3-exercise-shape.test.ts` | Modify | Assert answer shapes, tag/feedback compatibility, and legacy stability. |
| `src/domain/__tests__/u3-exponentials-coverage.test.ts` | Create | Executable coverage matrix, natural-ID progression, type/family, canonical-exclusion, and input-discipline audit. |
| `tests/e2e/exponenciales-practice.spec.ts` | Create | Real route evidence for four forms, feedback, and no fallback. |

## Interfaces / Contracts

No new interface. Entries conform to `Exercise`: valid numeric-suffix `id`, scalar-only numerical/fill-blank answers, MC expected answer present in unique options, and `u3_igualdad_exponenciales` resolvable through `unit-3.json` feedback.

## Testing Strategy

| Layer | What to test | Approach |
|---|---|---|
| Unit | Count, legacy fields, difficulty/type/tag/copy rules | RED coverage tests, then JSON. |
| Integration | `loadExercisesForSkill`, `loadSkillBank`, `queryBySkill`, `isSkillReady`, U3 threshold | Assert the real loaders return all rows with no feedback diagnostics. |
| E2E | Route reachability, prompts, MC/TF/text forms, selectable options/fields, feedback, no fallback | Seed a student and exercise the real practice flow. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary is changed.

## Migration / Rollout

No migration required. Existing progress IDs remain valid; rollback removes only the 13 additions and restores `.4` difficulty to 1.

## Open Questions

None.
