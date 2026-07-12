# Design: Recover U3 Canonical Trace Compatibility

## Technical Approach
Recover the optional Exercise trace seam without copying unrelated work from read-only `0f79d63`. The general Exercise model/parser remains compatible with U2's `alignment`; a separate U3-only audit narrows U3 trace use. PR1 creates the compilable contracts; PR2 adds parser/defaulting and the scoped audit.

## Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Shared surface | `ExerciseBaseShape`; `Exercise extends` it | Keeps shared rendering/input fields while isolating trace contracts. |
| Three contracts | General Exercise: `adapted|reinforcement|reference|alignment`; Challenge: its existing four literals; U3 audit: the narrower three literals | Preserves U2 while preventing challenge literals in ordinary exercises and keeping U3 policy local. |
| Optionality | parser returns `null`; defaulting omits the property | Preserves legacy object shape rather than attaching `undefined`. |

## Data Flow
`raw exercise → applyExerciseDefaults → parseOptionalCanonicalTrace → Exercise`

`parsed U3 Exercise → U3 trace audit → violation list (no loader mutation)`

Insert `ExerciseCanonicalTrace`, four-value `ExerciseSourceUse`, and `ExerciseBaseShape` before `Exercise` in `src/domain/models/exercise.ts`; make `Exercise extends ExerciseBaseShape` with optional trace. Export them from `src/domain/index.ts`. In `content-loaders.ts`, parse all four general literals, call the optional helper after options parsing, include `canonicalTrace` in `KNOWN_FIELDS`, and spread it only when non-null. Add a separate U3-only audit utility that reports `alignment` on U3 exercises; it never changes parsing or examines U2. In `challenges/types.ts`, replace the `Exercise` import/extends clause with `ExerciseBaseShape`; retain challenge trace definitions unchanged.

The changed inheritance makes `ChallengeExercise` non-assignable to `Exercise`. Change only `ExerciseCardProps.exercise` and `ExerciseAnswerInputProps.exercise` to `ExerciseBaseShape`; `ChallengeExerciseCard` is their sole challenge call site. A new structural `EvaluableExercise` contract supplies the minimal surface (`type`, `expectedAnswer`, `prompt`, `commonErrorTags`, `skillId`, `options?`) the domain evaluator reads; both `Exercise` and `ChallengeExercise` assign to it via `ExerciseBaseShape`, but no equivalent bypass cast is introduced.

## Evidence and Contracts
Current `applyExerciseDefaults` preserves unknown keys and does not parse `canonicalTrace`; current theory parsing has a three-value `SourceUse`. Read-only source `0f79d63` proves the optional-trace normalization and challenge separation, but its three-value general parser is not reusable: the active U2 catalog spec explicitly permits `alignment`. General parsing therefore accepts `alignment`; only challenge-only/unknown literals fail. Preserve optional `section` only when valid.

## Tests
`src/domain/__tests__/exercise-canonical-trace.test.ts`: PR1 RED/GREEN asserts the four-value general Exercise union, unchanged challenge trace, base-shape compatibility, and public exports; `pnpm run typecheck` proves consumer migrations. PR2 tests absence normalization, valid single/array order, `alignment` acceptance, malformed/challenge-only rejection, legacy defaulting, and U3-only audit rejection of `alignment` without inspecting U2. No E2E boundary exists.

## Threat Matrix
N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Delivery Forecast
Mandatory stacked-to-main chain; all figures are additions + deletions and are independently auditable at apply time.

| PR | Branch / target / dependency | Behavior, tests, and included artifacts | Total |
|---|---|---|---:|
| 1 contracts | planned `feat/u3-traza-canonica-contracts` → `main`; none | Contracts/consumer compatibility + `EvaluableExercise` structural evaluator contract + RED/GREEN tests: tracked ≈155 insertions + 35 deletions; new test file + apply-progress ≤ 210. Final actual `git diff --shortstat` additions+deletions ≤ 400. Included artifacts: proposal + model/challenge specs + design + STATUS: ≈150 lines. | **≤400** |
| 2 parser + U3 audit | planned `feat/u3-traza-canonica-parser` → PR1; requires PR1 | General parser/defaulting plus isolated U3 audit: 78–96; parser, compatibility, and audit tests: 72–88; catalog spec + STATUS update: 32–62. | **≤246** |

PR1 is autonomous: it compiles, passes contract tests, and leaves loader behavior unchanged. PR2 owns parser/defaulting, legacy behavior, and U3 audit behavior. Each total counts additions plus deletions for code, tests, and included artifacts; no exception.

## Rollback and Exclusions
Revert PR2, then PR1; mark STATUS abandoned if delivery stops. Do not merge or copy unrelated read-only source changes. Exclude `validateTracePath`, theory/worked examples, JSON content, U2 migration, persistence, runtime provenance, challenge loader/store/flow/readiness, and UI behavior.
