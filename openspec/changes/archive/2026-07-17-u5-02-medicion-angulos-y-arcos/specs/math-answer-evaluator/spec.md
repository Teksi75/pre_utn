# Delta for Math Answer Evaluator

## ADDED Requirements

### Requirement: Structured Answer Dispatch

The evaluator MUST dispatch on `exercise.type === "structured"` BEFORE the legacy type-based branches. The structured dispatcher MUST parse the submitted string as canonical JSON v1, normalize it according to the matching `answerSpec.kind`, and delegate to the matching evaluator (`pi-rational` or `angle-dms`). The dispatch MUST be deterministic, framework-free, and side-effect free.

| Dispatch step | Behavior |
|---|---|
| Parse | Strict JSON parse of the submitted string; reject anything that is not an object with integer `v === 1` |
| Kind lookup | Read `kind`; reject unknown kinds |
| Normalize | Apply `pi-rational` sign-to-numerator + GCD reduction, or `angle-dms` bounds check (0 ≤ minutes < 60, 0 ≤ seconds < 60) |
| Delegate | Compare normalized submission to normalized expected per the kind's rule |
| Fallback | Unknown kind or unparseable submission → `incorrect` with feedback (or `configuration_error` when the malformed data is the expected spec) |

#### Scenario: dispatch routes structured before legacy types

- GIVEN an exercise with `type === "structured"` and `answerSpec.kind === "pi-rational"`
- WHEN `evaluateAnswer` is called
- THEN the structured dispatcher runs first
- AND the legacy numerical path is NOT executed

#### Scenario: dispatcher is pure

- GIVEN the same structured exercise and submission
- WHEN `evaluateAnswer` is called 100 times
- THEN every result is identical (no runtime state, no random seed, no DOM dependency)

### Requirement: Pi-Rational Evaluation

The π-rational evaluator MUST compare the normalized submitted coefficient to the normalized expected coefficient by EXACT reduced-form equality. The decimal field is then compared by absolute difference against the declared `tolerance`. Both checks MUST succeed for `correct: true`. Either failure returns `incorrect` and gates any error tag on `commonErrorTags` declared by the exercise.

| Check | Rule |
|---|---|
| Coefficient | `submitted.numerator * expected.denominator === expected.numerator * submitted.denominator` AFTER each side is reduced |
| Decimal | `|submitted.decimal - expected.decimal| ≤ expected.tolerance` |

#### Scenario: exact coefficient and within tolerance is correct

- GIVEN expected `{numerator: 1, denominator: 5, decimal: 0.6283, tolerance: 0.0001}`
- WHEN submission is `{numerator: 1, denominator: 5, decimal: 0.6283}`
- THEN result is `correct: true`

#### Scenario: coefficient off, decimal within tolerance is incorrect

- GIVEN the same expected
- WHEN submission is `{numerator: 2, denominator: 5, decimal: 0.6283}`
- THEN result is `correct: false`
- AND if `u5_degree_radian_factor` is declared, `errorTag === "u5_degree_radian_factor"`

#### Scenario: coefficient exact, decimal outside tolerance is incorrect

- GIVEN the same expected
- WHEN submission is `{numerator: 1, denominator: 5, decimal: 0.65}`
- THEN result is `correct: false`

#### Scenario: equivalence under reduction is correct

- GIVEN expected `{numerator: 1, denominator: 5, ...}`
- WHEN submission is `{numerator: 2, denominator: 10, decimal: 0.6283}`
- THEN normalization reduces the submission to `{1, 5}`
- AND result is `correct: true`

### Requirement: Angle DMS Evaluation

The angle-dms evaluator MUST compare total arc-seconds: `expected.degrees * 3600 + expected.minutes * 60 + expected.seconds` against `submitted.degrees * 3600 + submitted.minutes * 60 + submitted.seconds`. The difference MUST satisfy `|Δ| ≤ expected.tolerance` (in arc-seconds) for `correct: true`. Tolerance for U5-02 item 2 is `0.5` arc-seconds. The canonical expected display string for item 2 is `11° 27′ 33″`.

#### Scenario: 11° 27′ 33″ exact is correct

- GIVEN expected `{degrees: 11, minutes: 27, seconds: 33, tolerance: 0.5}`
- WHEN submission is `{degrees: 11, minutes: 27, seconds: 33}`
- THEN the difference is `0` arc-seconds
- AND result is `correct: true`

#### Scenario: 11° 27′ 32.7″ within tolerance is correct

- GIVEN the same expected
- WHEN submission is `{degrees: 11, minutes: 27, seconds: 32.7}`
- THEN the difference is `0.3` arc-seconds
- AND result is `correct: true`

#### Scenario: 11° 27′ 32″ outside tolerance is incorrect

- GIVEN the same expected
- WHEN submission is `{degrees: 11, minutes: 27, seconds: 32}`
- THEN the difference is `1.0` arc-seconds
- AND result is `correct: false`
- AND if `u5_dms_conversion` is declared, `errorTag === "u5_dms_conversion"`

#### Scenario: minutes overflow rejected

- GIVEN an `angle-dms` submission with `minutes === 60`
- WHEN the dispatcher normalizes it
- THEN the submission is rejected as malformed
- AND result is `incorrect` (or `configuration_error` if the violation is on the expected spec)

### Requirement: Unit 5 Misconception Tagging

Three Unit 5 misconception detectors MUST be added to `src/domain/evaluator/error-tagging.ts`. Each detector MUST only tag when the exercise declares the matching tag in `commonErrorTags`. Detectors MUST be deterministic and side-effect free.

| Detector | Tag | Triggers when |
|---|---|---|
| `isU5DegreeRadianFactorError` | `u5_degree_radian_factor` | `pi-rational` submission has the right numerator/denominator magnitudes but inverted `π/180` vs `180/π` factor (e.g., expected `{1, 5}`, submitted `{π/180 * 36 ≈ 0.6283}` written as `{36, 180}` after reduction) |
| `isU5DmsConversionError` | `u5_dms_conversion` | `angle-dms` submission is a carry/bounds/rounding mistake against the declared tolerance (e.g., `11° 27′ 32″`, `12° 27′ 33″`, seconds ≥ 60) |
| `isU5ArcTimeFractionError` | `u5_arc_time_fraction` | `pi-rational` submission for item 3 reflects wrong time fraction (e.g., expected `{8, 1, 25.1327}`, submitted `{4π, 1, 12.5663}` representing 10 minutes instead of 20) |

#### Scenario: detector fires only when declared

- GIVEN exercise 2d declaring `commonErrorTags: ["u5_dms_conversion"]`
- WHEN the student submits `11° 27′ 32″`
- THEN result includes `errorTag: "u5_dms_conversion"`

- GIVEN the same exercise WITHOUT `u5_dms_conversion` in `commonErrorTags`
- WHEN the same wrong submission is graded
- THEN result is `correct: false` with NO error tag

#### Scenario: arc-time detector on wrong fraction

- GIVEN exercise `.3` declaring `commonErrorTags: ["u5_arc_time_fraction"]` and expected `{8, 1, 25.1327}`
- WHEN submission is `{4, 1, 12.5663}` (10-minute fraction)
- THEN result includes `errorTag: "u5_arc_time_fraction"`

### Requirement: Scalar Items 1.c and 1.d Stay on the Numerical Path

Items 1.c (`3π/4 → 135°`) and 1.d (`2.3456 rad → 134.392980…°`) MUST remain `numerical` exercises evaluated by the existing numerical branch with absolute tolerance. They MUST NOT be promoted to `structured` because their answer forms are scalar degrees. A regression test MUST prove both items still pass under the new dispatch order.

#### Scenario: 1.c evaluates as numerical

- GIVEN `ex.u5.medicion_angulos_y_arcos.1c` with `type === "numerical"`, expected `135`
- WHEN student submits `135`
- THEN result is `correct: true` via the legacy numerical path

#### Scenario: 1.d evaluates as numerical with platform tolerance 0.01

- GIVEN `ex.u5.medicion_angulos_y_arcos.1d` with expected `134.392980`
- WHEN student submits `134.3931`
- THEN `|Δ| === 0.00012 < 0.01` (platform fixed tolerance)
- AND result is `correct: true`
- NOTE: spec originally described 0.0001; reconciled at archive to 0.01 to match existing platform numeric evaluator behavior. See `evaluator-numeric-u5-scalar.test.ts` for explicit pinning.

#### Scenario: dispatch order does not regress legacy types

- GIVEN the full U1 and U2 evaluator regression suites
- WHEN executed after this change
- THEN every test passes without modification (proves the structured branch is additive, not replacing)

### Requirement: Structured Submissions Respect Configuration Error Semantics

When the malformed data is the EXPECTED spec (caught at load by `content-loaders.ts`), the evaluator MUST NOT be reachable for that exercise; loading fails first. When the malformed data is the SUBMITTED string (caught at parse/normalize time inside `evaluateAnswer`), the evaluator MUST return `incorrect` with feedback, NOT `configuration_error`. This preserves the existing distinction: configuration errors signal broken content, not student mistakes.

#### Scenario: malformed expected never reaches the evaluator

- GIVEN a structured exercise with a malformed expected spec
- WHEN the catalog loads
- THEN loading fails before any `evaluateAnswer` call
- AND no runtime student answer can ever produce a `configuration_error` for that exercise

#### Scenario: malformed submission is incorrect with feedback

- GIVEN a well-formed structured exercise
- WHEN a student submits `{"v":1,"kind":"pi-rational"}` (missing fields)
- THEN result is `correct: false`
- AND feedback explains the missing fields without revealing the expected answer