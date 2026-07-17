# Tasks: Unit 5 Angle and Arc Measurement (u5-02-medicion-angulos-y-arcos)

> **Archive reconciliation note:** `tasks.md` used header-form task representation without markdown checkbox syntax. Completion is authoritatively evidenced by `apply-progress.md` (WU map: 5/5 Done, commits `950e3f2`, `7dba8f5`, `9d88a84`, `48649f0`, `c8a0eb6`, bounded correction `af80afc`), `verify-report.md` (51/51 tasks complete, 3341/3341 tests, typecheck clean, build green), and git log. All 48 implementation tasks are mechanically reconciled below with `[x]` markers for audit-trail completeness. This is an evidence-based mechanical repair; it does not change any functional history.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~750–800 (authored) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr-default |
| Chain strategy | none |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: none
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Domain/evaluator (model, codecs, structured evaluator, detectors, dispatcher) | PR 1 | `pnpm run test:run -- --testNamePattern="structured\|structured\|u5_" ` | N/A (pure domain) | Revert evaluator/index.ts + structured.ts + error-tagging.ts additions |
| 2 | Controls/display + state (PiRationalInput, AngleDmsInput, state, display) | PR 1 | `pnpm run test:run -- --testNamePattern="PiRational\|AngleDms\|structured"` | N/A (pure components) | Revert component additions |
| 3 | Content (4 × unit-5.json: theory, examples, feedback, exercises) | PR 1 | `pnpm run test:run -- --testNamePattern="u5\|unit-5"` | N/A (JSON fixtures) | Delete 4 JSON files |
| 4 | Wiring (UNIT_5_SKILLS, PILOT_SKILLS, RAW_REGISTRY, UNIT_EXERCISE_FILES[5], catalog/index.ts, UNIT_THRESHOLDS, learn page) | PR 1 | `pnpm run test:run -- --testNamePattern="UNIT_5\|unit-5\|readiness"` | N/A (pure wiring) | Revert wiring additions |
| 5 | Flow/regression + FocusSelector + brand voice scan | PR 1 | `pnpm run test:run` | `pnpm run build` | N/A (final gate) |

## Phase 1: Domain Model and Evaluator TDD

### 1.1 RED — structured type model test
- **File**: `src/domain/__tests__/structured-model.test.ts` (create)
- **Action**: Write tests for `ExerciseType` including `"structured"`; test that `EvaluableExercise` accepts `answerSpec?: StructuredAnswerSpec`; test normalization rules (pi-rational sign-to-numerator, GCD reduction, denominator > 0; angle-dms bounds 0≤m<60, 0≤s<60)
- **Acceptance**: Test fails on current `SUPPORTED_TYPES` (no `"structured"`) and on missing `StructuredAnswerSpec`
- **Spec**: `math-exercise-model/spec.md` §"Structured Answer Specification"
- [x] **Status**: Complete (commit `950e3f2`)

### 1.2 GREEN — add structured to ExerciseType and StructuredAnswerSpec
- **File**: `src/domain/models/exercise.ts`
- **Action**: Add `"structured"` to `ExerciseType` alias; extend `EvaluableExercise` with optional `answerSpec?: StructuredAnswerSpec` discriminated union (`pi-rational` | `angle-dms`); add runtime validation helpers for structured bounds (reject denominator=0, minutes≥60, seconds≥60)
- **Acceptance**: Existing exercise.ts tests pass; new structured model tests pass
- **Spec**: `math-exercise-model/spec.md` §"Structured Answer Specification"

- [x] **Status**: Complete (WU Phase 1)
### 1.3 REFACTOR — exercise.ts type hygiene
- **File**: `src/domain/models/exercise.ts`
- **Action**: Ensure `validateExercise` permits `"structured"` type; ensure `hasStructuredMathAnswer` and `hasStructuredNumericalAnswer` do not false-positive on structured exercise prompts
- **Acceptance**: All exercise.ts tests green

- [x] **Status**: Complete (WU Phase 1)
### 1.4 RED — structured codec unit tests
- **File**: `src/domain/__tests__/structured-codec.test.ts` (create)
- **Action**: Write RED tests for `parseStructuredSubmissionV1`, `serializeStructuredSubmissionV1`, `normalizePiRational`, `normalizeAngleDms` covering: valid round-trip pi-rational v1 JSON, valid round-trip angle-dms v1 JSON, malformed JSON rejection, unknown kind rejection, pi-rational GCD reduction, sign-to-numerator normalization, angle-dms bounds rejection (minutes=60, seconds=60), version≠1 rejection
- **Acceptance**: Tests fail (codecs not yet written)
- **Spec**: `math-exercise-model/spec.md` §"Canonical Versioned JSON Submission Format"

- [x] **Status**: Complete (WU Phase 1)
### 1.5 GREEN — implement structured codecs
- **File**: `src/domain/evaluator/structured.ts` (create)
- **Action**: Implement pure `parseStructuredSubmissionV1`, `serializeStructuredSubmissionV1`, `normalizePiRational` (GCD reduction, denominator sign to numerator), `normalizeAngleDms` (bounds check 0≤m<60, 0≤s<60); throw on malformed/unknown kind
- **Acceptance**: All codec tests green
- **Spec**: `math-exercise-model/spec.md` §"Structured Spec Malformed at Load Returns Configuration Error"

- [x] **Status**: Complete (WU Phase 1)
### 1.6 RED — pi-rational evaluation tests
- **File**: `src/domain/__tests__/structured-evaluator.test.ts` (create)
- **Action**: Write tests for `evaluatePiRational`: exact coefficient equality after reduction + decimal within tolerance → correct; coefficient wrong → incorrect; decimal out of tolerance → incorrect; equivalence under reduction → correct (e.g. {2,10} reduces to {1,5})
- **Acceptance**: Tests fail (evaluator not yet written)
- **Spec**: `math-answer-evaluator/spec.md` §"Pi-Rational Evaluation"

- [x] **Status**: Complete (WU Phase 1)
### 1.7 RED — angle-dms evaluation tests
- **File**: `src/domain/__tests__/structured-evaluator.test.ts` (append)
- **Action**: Write tests for `evaluateAngleDms`: exact {11,27,33} → correct (Δ=0); {11,27,32.7} → correct (Δ=0.3, within 0.5 tolerance); {11,27,32} → incorrect (Δ=1.0, outside 0.5); minutes=60 → rejected; seconds=60 → rejected; tolerance boundary at exactly 0.5
- **Acceptance**: Tests fail
- **Spec**: `math-answer-evaluator/spec.md` §"Angle DMS Evaluation"

- [x] **Status**: Complete (WU Phase 1)
### 1.8 GREEN — implement structured evaluators
- **File**: `src/domain/evaluator/structured.ts`
- **Action**: Implement `evaluatePiRational` (normalized coefficient equality + |decimal-expected.decimal|≤tolerance) and `evaluateAngleDms` (total arc-seconds difference ≤tolerance); return `{correct: boolean, feedback?: string}`
- **Acceptance**: All structured evaluator tests green

- [x] **Status**: Complete (WU Phase 1)
### 1.9 RED — structured dispatcher integration test
- **File**: `src/domain/__tests__/structured-evaluator.test.ts` (append)
- **Action**: Write tests proving `evaluateAnswer` routes `type==="structured"` to structured dispatcher BEFORE legacy branches; prove legacy numerical path is NOT executed for structured
- **Acceptance**: Test fails (dispatcher not updated)
- **Spec**: `math-answer-evaluator/spec.md` §"Structured Answer Dispatch"

- [x] **Status**: Complete (WU Phase 1)
### 1.10 GREEN — update evaluator dispatcher for structured
- **File**: `src/domain/evaluator/index.ts`
- **Action**: Add structured dispatch branch BEFORE `numerical`/`true-false`/`fill-blank`/`multiple-choice`; parse submission as canonical JSON v1; delegate to `evaluatePiRational` or `evaluateAngleDms`; malformed submission → `{correct:false, feedback}`; malformed expected spec → unreachable (caught at load)
- **Acceptance**: Dispatcher tests green; U1/U2 regression suite unchanged behavior

- [x] **Status**: Complete (WU Phase 1)
### 1.11 RED — U5 detector tests
- **File**: `src/domain/__tests__/evaluator-error-tagging-u5.test.ts` (create)
- **Action**: Write tests for `isU5DegreeRadianFactorError`: fires when submitted pi-rational numerator/denominator magnitudes match prompt degree fraction (e.g. submitted {36,180} after reduction = {1,5} but expected {1,5} — actually the detector must compare RAW submitted pair against the unreduced degree fraction from the prompt; advisory note 2); only fires when exercise declares `u5_degree_radian_factor` in `commonErrorTags`. Test `isU5DmsConversionError`: fires on in-range total-second miss ≤1.0 arc-sec (inclusive) including {11,27,32} where Δ=1.0 (advisory note 1), also fires on out-of-bounds minutes/seconds; only fires when declared. Test `isU5ArcTimeFractionError`: fires on pi-rational {4,1,12.5663} for item 3 when expected is {8,1,25.1327}; only fires when declared
- **Acceptance**: Tests fail (detectors not yet written)
- **Spec**: `math-answer-evaluator/spec.md` §"Unit 5 Misconception Tagging"; advisory notes 1+2

- [x] **Status**: Complete (WU Phase 1)
### 1.12 GREEN — implement U5 error detectors
- **File**: `src/domain/evaluator/error-tagging.ts`
- **Action**: Add `isU5DegreeRadianFactorError` (compare RAW submitted {num,den} against the unreduced degree fraction from prompt — e.g. for 36° the RAW pair is {36,180} which reduces to expected {1,5}); add `isU5DmsConversionError` (inclusive ≤1.0 arc-sec miss, out-of-bounds minutes/seconds, degree-carry misses); add `isU5ArcTimeFractionError` (check submitted coefficient equals half of expected for item 3); each returns tag only when in `commonErrorTags`
- **Acceptance**: All U5 detector tests green; existing error-tagging tests unchanged

- [x] **Status**: Complete (WU Phase 1)
### 1.13 REFACTOR — pure evaluator guarantee
- **File**: `src/domain/evaluator/index.ts`
- **Action**: Confirm `evaluateAnswer` is deterministic: call 100 times with same input, verify same output; confirm no runtime state, no DOM dependency, no random seed
- **Acceptance**: Stress test passes

- [x] **Status**: Complete (WU Phase 1)
## Phase 2: Structured UI Controls and Display TDD

### 2.1 RED — PiRationalInput component tests
- **File**: `src/components/exercises/__tests__/pi-rational-input.test.tsx` (create)
- **Action**: Write tests for `PiRationalInput`: renders numerator, denominator, decimal, tolerance fields; accepts integer numerator and positive denominator; emits `onComplete({numerator,denominator,decimal,tolerance})` with serialized JSON v1; validates denominator>0; accessibility: all fields labeled
- **Acceptance**: Tests fail (component not yet written)

- [x] **Status**: Complete (WU Phase 2)
### 2.2 GREEN — implement PiRationalInput
- **File**: `src/components/exercises/PiRationalInput.tsx` (create)
- **Action**: Implement accessible numeric inputs for numerator (integer), denominator (positive integer), decimal (finite), tolerance (positive); serialize complete fields to `{"v":1,"kind":"pi-rational",numerator,denominator,decimal}`; emit via `onComplete`; use `aria-label` per field
- **Acceptance**: All PiRationalInput tests green

- [x] **Status**: Complete (WU Phase 2)
### 2.3 RED — AngleDmsInput component tests
- **File**: `src/components/exercises/__tests__/angle-dms-input.test.tsx` (create)
- **Action**: Write tests for `AngleDmsInput`: renders degrees (integer), minutes (0-59), seconds (0-59.99); emits `onComplete({degrees,minutes,seconds})` as `{"v":1,"kind":"angle-dms",degrees,minutes,seconds}`; validates bounds (minutes<60, seconds<60); accessibility labels per field
- **Acceptance**: Tests fail

- [x] **Status**: Complete (WU Phase 2)
### 2.4 GREEN — implement AngleDmsInput
- **File**: `src/components/exercises/AngleDmsInput.tsx` (create)
- **Action**: Implement numeric inputs with min/max constraints; serialize to canonical JSON v1; emit via `onComplete`; `aria-label` per field
- **Acceptance**: All AngleDmsInput tests green

- [x] **Status**: Complete (WU Phase 2)
### 2.5 RED — exercise-answer-state structured completeness tests
- **File**: `src/components/exercises/__tests__/exercise-answer-state-structured.test.ts` (create)
- **Action**: Write tests: `isAnswerComplete` returns true when all required structured fields are non-empty; `serializeStructured` produces valid v1 JSON; incomplete state returns null from serializer
- **Acceptance**: Tests fail

- [x] **Status**: Complete (WU Phase 2)
### 2.6 GREEN — extend exercise-answer-state for structured
- **File**: `src/components/exercises/exercise-answer-state.ts`
- **Action**: Add structured completeness check and serialization helpers; wire `PiRationalInput` and `AngleDmsInput` into the state machine; `serializeSubmission` produces canonical JSON string for structured types
- **Acceptance**: All exercise-answer-state structured tests green

- [x] **Status**: Complete (WU Phase 2)
### 2.7 RED — SubmittedAnswerDisplay structured tests
- **File**: `src/components/exercises/__tests__/submitted-answer-display-structured.test.tsx` (create)
- **Action**: Write tests: parses `{"v":1,"kind":"pi-rational",...}` and renders coefficient `n/d`, decimal value, unit; parses `{"v":1,"kind":"angle-dms",...}` and renders `d° m′ s″`; is read-only (no edit affordance); malformed JSON gracefully handled
- **Acceptance**: Tests fail

- [x] **Status**: Complete (WU Phase 2)
### 2.8 GREEN — extend SubmittedAnswerDisplay for structured
- **File**: `src/components/exercises/submitted-answer-display.tsx`
- **Action**: Add structured JSON parsing and display: render coefficient fraction with KaTeX, render D/M/S labels; ensure read-only contract unchanged for other types
- **Acceptance**: All SubmittedAnswerDisplay structured tests green

- [x] **Status**: Complete (WU Phase 2)
## Phase 3: U5 Content (4 JSON Files)

### 3.1 RED — content-loader structured validation tests
- **File**: `src/domain/__tests__/content-loaders-structured.test.ts` (create)
- **Action**: Write tests: `applyExerciseDefaults` rejects `pi-rational` with missing decimal, denominator=0, unknown kind; rejects `angle-dms` with minutes=60 or seconds=60; accepts valid structured specs; loading a unit-5 file with invalid structured spec throws with exercise id in message
- **Acceptance**: Tests fail (validation not yet added)

- [x] **Status**: Complete (WU Phase 3)
### 3.2 GREEN — add structured answerSpec validation to content-loaders
- **File**: `src/domain/catalog/content-loaders.ts`
- **Action**: In `applyExerciseDefaults`, validate `answerSpec` when `type==="structured"`: check `kind` is `"pi-rational"` or `"angle-dms"`; for `pi-rational`: required fields `expected.numerator` (integer), `expected.denominator` (positive integer), `decimal` (finite), `tolerance` (positive); for `angle-dms`: `expected.degrees` (integer), `expected.minutes` (0-59 integer), `expected.seconds` (finite, 0-59.99), `tolerance` (positive); throw with exercise id on violation
- **Acceptance**: All content-loader structured validation tests green

- [x] **Status**: Complete (WU Phase 3)
### 3.3 Create unit-5 theory JSON
- **File**: `content/matematica/theory/unit-5.json` (create)
- **Action**: Create theory node `theory-medicion-angulos-y-arcos` with `skillId: "mat.u5.medicion_angulos_y_arcos"`; include 5 concepts: (a) DMS bounds (0≤α<360°, 0≤m<60, 0≤s<60), (b) 180°=π rad equivalence, (c) decimal degrees↔DMS rounding, (d) radian definition (arc length=radius), (e) elapsed-time fraction (α=(Δt/T)·2π); each concept's `canonicalTrace.path` cites `mat.u5.theory` pp.7-9; KaTeX for math; non-tutor voice; `theoryNodes.length===1` and `concepts.length` 4-5
- **Acceptance**: Theory node loads and validates; all 5 concept families present
- **Spec**: `angle-arc-measurement/spec.md` §"Single Theory Node With Required Concepts"

- [x] **Status**: Complete (Phase 3)
### 3.4 Create unit-5 examples JSON
- **File**: `content/matematica/examples/unit-5.json` (create)
- **Action**: Create 3 worked examples: E1 (degree/radian table: 36°→π/5, 225°→5π/4, 3π/4→135°, 2.3456rad→134.39°), E2 (6/30 rad→11°27′33″), E3 (20-min arc on 12cm clock→8πcm≈25.13cm); each `canonicalTrace.path` cites `mat.u5.practice` p.3; KaTeX in prompts and finalAnswer
- **Acceptance**: All 3 examples load; E1 shows correct table values, E2 shows 1/5 rad + DMS, E3 shows 8πcm
- **Spec**: `angle-arc-measurement/spec.md` §"Three Worked Examples"

- [x] **Status**: Complete (Phase 3)
### 3.5 Create unit-5 feedback JSON
- **File**: `content/matematica/feedback/unit-5.json` (create)
- **Action**: Create feedback mappings for 3 tags: `u5_degree_radian_factor` → recovery targets nearest concept without revealing answer; `u5_dms_conversion` → carry/bounds/rounding category; `u5_arc_time_fraction` → elapsed-time fraction concept; NO feedback reveals literal `11°27′33″`; use corrective/procedural types
- **Acceptance**: All 3 feedback mappings load; no answer revealed in messages
- **Spec**: `angle-arc-measurement/spec.md` §"Three Declared Unit 5 Feedback Tags"

- [x] **Status**: Complete (Phase 3)
### 3.6 Create unit-5 exercises JSON
- **File**: `content/matematica/exercises/unit-5.json` (create)
- **Action**: Create 7 exercises in order: `.1a` structured/pi-rational {1,5,0.6283,0.0001}; `.1b` structured/pi-rational {5,4,3.9269,0.0001}; `.1c` numerical 135; `.1d` numerical 134.392980 tolerance 0.0001; `.2r` numerical 0.2; `.2d` structured/angle-dms {11,27,33,0.5}; `.3` structured/pi-rational {8,1,25.1327,0.001}; each with correct `commonErrorTags` (1a/1b: `u5_degree_radian_factor`, 2d: `u5_dms_conversion`, 3: `u5_arc_time_fraction`); each with individual `canonicalTrace` citing `mat.u5.practice` item + `mat.u5.theory` pp.7-9; difficulties 1,1,2,3,3,4,4; Spanish KaTeX prompts; expected triple for 2d verbatim from spec: `{degrees:11,minutes:27,seconds:33}` tolerance `0.5` (advisory note 3)
- **Acceptance**: All 7 exercises load; 2d has exact spec values; each has individual trace
- **Spec**: `angle-arc-measurement/spec.md` §"Seven Traced Practice Interactions"

- [x] **Status**: Complete (Phase 3)
### 3.7 Brand voice scan of U5 content
- **File**: `src/domain/__tests__/copy-strings-acceptance.test.ts`
- **Action**: Extend brand-voice scan to cover all 4 U5 JSON files; assert no "profe digital" or tutor-personification phrases; assert no free-text math expressions in prompts
- **Acceptance**: All 4 U5 files pass brand-voice scan
- **Spec**: `angle-arc-measurement/spec.md` §"Brand Voice and No Free Text"

- [x] **Status**: Complete (Phase 3)
## Phase 4: Catalog and Wiring

### 4.1 Add unit-5 to RAW_REGISTRY
- **File**: `src/domain/catalog/content-loaders.ts`
- **Action**: Import `theoryUnit5`, `examplesUnit5`, `feedbackUnit5` from `content/matematica/{theory,examples,feedback}/unit-5.json`; add to `RAW_REGISTRY.theory["unit-5"]`, `RAW_REGISTRY.examples["unit-5"]`, `RAW_REGISTRY.feedback["unit-5"]`
- **Acceptance**: `loadTheoryContent("unit-5")`, `loadExampleContent("unit-5")`, `loadFeedbackContent("unit-5")` return correct data

- [x] **Status**: Complete (Phase 4)
### 4.2 Add unit-5 exercises to catalog/index.ts
- **File**: `src/domain/catalog/index.ts`
- **Action**: Add `_unit5Exercises` import; add unit-5 to `getComposedExercises` via `addExercises(_unit5Exercises, "unit-5")`; ensure `queryBySkill("mat.u5.medicion_angulos_y_arcos")` returns all 7 exercises
- **Acceptance**: Catalog loads with 7 U5 exercises; `queryBySkill` returns correct count

- [x] **Status**: Complete (Phase 4)
### 4.3 Register unit-5 in UNIT_EXERCISE_FILES
- **File**: `src/domain/catalog/content-loaders.ts`
- **Action**: Add `5: unit5Exercises as unknown` to `UNIT_EXERCISE_FILES`; update `pilotExercisesWithLinks` to handle unit 5
- **Acceptance**: `UNIT_EXERCISE_FILES[5]` defined; exercises for unit-5 skill loadable

- [x] **Status**: Complete (Phase 4)
### 4.4 Update UNIT_THRESHOLDS
- **File**: `src/domain/catalog/content-loaders.ts`
- **Action**: Change `UNIT_THRESHOLDS["unit-5"]` from `0` to `7`; update `getUnitThreshold("unit-5")` returns `7`
- **Acceptance**: Unit threshold test passes; threshold guard no longer blocks U5
- **Spec**: `unit-5-foundation/spec.md` §"Unit 5 Catalog State"

- [x] **Status**: Complete (Phase 4)
### 4.5 Add U5 to PILOT_SKILLS
- **File**: `src/domain/catalog/pilot-skills.ts`
- **Action**: Add `{skillId:"mat.u5.medicion_angulos_y_arcos", unitKey:"unit-5", label:"Medición de ángulos y arcos"}` to `PILOT_SKILLS` array; verify `PILOT_SKILL_UNIT_MAP` derives correctly
- **Acceptance**: `PILOT_SKILL_UNIT_MAP["mat.u5.medicion_angulos_y_arcos"]==="unit-5"`

- [x] **Status**: Complete (Phase 4)
### 4.6 Add unit-5 to UNIT_5_SKILLS
- **File**: `src/domain/catalog/skill-availability.ts` (or wherever `UNIT_5_SKILLS` is defined — check existing pattern)
- **Action**: Add `"mat.u5.medicion_angulos_y_arcos"` to `UNIT_5_SKILLS`; verify no `SKILL_DEPENDENCIES` entry for this skill
- **Acceptance**: `UNIT_5_SKILLS` contains exactly one U5 root skill; `SKILL_DEPENDENCIES` has no entry
- **Spec**: `unit-5-foundation/spec.md` §"Unit 5 First Live Root Skill Has No Skill Dependencies"

- [x] **Status**: Complete (Phase 4)
### 4.7 Add unit-5 error tags to taxonomy
- **File**: `src/domain/error-taxonomy/index.ts`
- **Action**: Add `u5_degree_radian_factor`, `u5_dms_conversion`, `u5_arc_time_fraction` to taxonomy (or wherever tags are declared); verify tags are known to `validateExercise`
- **Acceptance**: U5 exercises with these tags pass validation; `loadTaxonomy()` includes U5 tags

- [x] **Status**: Complete (Phase 4)
### 4.8 Wire learn page Unit 5 section card
- **File**: `src/app/learn/matematica/page.tsx` (or learn view-model)
- **Action**: Add `"unit-5"` to `UNIT_LABELS` and `UNIT_KEYS`; ensure `/learn/matematica/mat.u5.medicion_angulos_y-arcos` renders theory card; topic count equals theory node `concepts.length`
- **Acceptance**: Learn page shows Unit 5 section card; card links to correct skill route
- **Spec**: `angle-arc-measurement/spec.md` §"Unit 5 Section Card and Selector Wiring"

- [x] **Status**: Complete (Phase 4)
### 4.9 Add dual-registration guard test
- **File**: `src/domain/__tests__/catalog-split-equivalence.test.ts`
- **Action**: Write test: load catalog via `content-loaders.ts` path AND via `catalog/index.ts` path; assert `mat.u5.medicion_angulos_y_arcos` has same skill and same 7 exercises in both paths; assert counts match
- **Acceptance**: Dual-registration guard test passes
- **Spec**: `unit-5-foundation/spec.md` §"Dual Registration of Unit 5 Content"

- [x] **Status**: Complete (Phase 4)
### 4.10 Update count/order guards in pilot-skills tests
- **File**: `src/domain/__tests__/pilot-skills.test.ts`
- **Action**: Update exact count assertions to reflect new total pilot skills including U5 entry; update order guard if affected
- **Acceptance**: All pilot-skills tests green

- [x] **Status**: Complete (Phase 4)
## Phase 5: Flow, Regression, and Final Gates

### 5.1 RED — U5 readiness integration test
- **File**: `src/domain/__tests__/catalog-readiness-u5.test.ts` (create)
- **Action**: Write test: `isSkillReady("mat.u5.medicion_angulos_y_arcos")` returns true when all components present; readiness false when fewer than 4 exercises implemented; readiness false when feedback missing
- **Acceptance**: Tests fail (wiring not yet complete)

- [x] **Status**: Complete (WU Phase 5)
### 5.2 GREEN — readiness verification
- **File**: (same test file)
- **Action**: Verify readiness becomes true once all components are wired; verify selector transitions from "Próximamente" to enabled
- **Acceptance**: Readiness tests green

- [x] **Status**: Complete (WU Phase 5)
### 5.3 RED — U5 visible-flow Playwright test
- **File**: `src/app/learn/matematica/__tests__/u5-visible-flow.test.ts` (create)
- **Action**: Write e2e test: student navigates to `/learn/matematica`; sees Unit 5 card; clicks card; sees theory with 5 concepts; navigates to practice; selects U5 skill; submits pi-rational answer for item 1a; receives correct/incorrect feedback; submits angle-dms answer for item 2d; receives correct/incorrect with tag
- **Acceptance**: Test fails (flow not yet wired)

- [x] **Status**: Complete (WU Phase 5)
### 5.4 GREEN — FocusSelector re-enable after U5 navigation
- **File**: `src/components/ui/__tests__/focus-selector.test.ts` (or wherever FocusSelector lives)
- **Action**: Verify FocusSelector auto-re-enables after U5 practice flow completes; no manual re-enable call needed
- **Acceptance**: FocusSelector re-enable tests pass after U5 integration

- [x] **Status**: Complete (WU Phase 5)
### 5.5 U1/U2 evaluator regression suite
- **File**: `src/domain/__tests__/u1-regression.test.ts`, `src/domain/__tests__/u2-*-test.ts`
- **Action**: Run full U1 and U2 evaluator suites; assert all pass; prove structured branch is additive, not replacing legacy behavior; prove scalar items 1c/1d remain on numerical path
- **Acceptance**: All U1/U2 tests green; 1c and 1d grade via numerical branch
- **Spec**: `math-answer-evaluator/spec.md` §"Scalar Items 1.c and 1.d Stay on the Numerical Path"

- [x] **Status**: Complete (Phase 5)
### 5.6 Scalar 1c/1d regression tests
- **File**: `src/domain/__tests__/evaluator-numeric.test.ts`
- **Action**: Explicitly test `ex.u5.medicion_angulos_y_arcos.1c` (numerical 135) and `ex.u5.medicion_angulos_y_arcos.1d` (numerical 134.392980 tolerance 0.0001) via `evaluateAnswer` to confirm numerical branch; test edge: 134.3931 submitted to 1d is incorrect (Δ=0.00012 > 0.0001)
- **Acceptance**: All 1c/1d regression tests green

- [x] **Status**: Complete (Phase 5)
### 5.7 Final test gate
- **Command**: `pnpm run test:run`
- **Action**: Run full test suite; all tests must pass
- **Acceptance**: Test suite 100% green

- [x] **Status**: Complete (Phase 5)
### 5.8 Final typecheck gate
- **Command**: `pnpm run typecheck`
- **Action**: Run TypeScript strict type check; no errors
- **Acceptance**: TypeScript clean

- [x] **Status**: Complete (Phase 5)
### 5.9 Final build gate
- **Command**: `pnpm run build`
- **Action**: Run Next.js production build; no errors
- **Acceptance**: Build succeeds

- [x] **Status**: Complete (Phase 5)
### 5.10 STATUS.json housekeeping note
- **File**: `openspec/changes/STATUS.json`
- **Action**: After merge to main, update entry for `u5-02-medicion-angulos-y-arcos` to `status:"done"`, `mergedTo:"main"`, `branch:null`; commit
- **Acceptance**: STATUS.json entry correct; no zombie branches

---

- [x] **Status**: Complete (Phase 5)
## Traceability Index

| Task | Spec requirement covered |
|------|--------------------------|
| 1.1-1.3 | `math-exercise-model/spec.md` — Structured Answer Specification |
| 1.4-1.5 | `math-exercise-model/spec.md` — Canonical Versioned JSON; Structured Spec Malformed at Load |
| 1.6-1.8 | `math-answer-evaluator/spec.md` — Pi-Rational Evaluation; Angle DMS Evaluation |
| 1.9-1.10 | `math-answer-evaluator/spec.md` — Structured Answer Dispatch; Dispatch order regression |
| 1.11-1.12 | `math-answer-evaluator/spec.md` — Unit 5 Misconception Tagging (advisory notes 1+2) |
| 2.1-2.8 | `math-exercise-model/spec.md` — Structured Submissions Coexist; `math-answer-evaluator/spec.md` — evaluation I/O |
| 3.1-3.6 | `angle-arc-measurement/spec.md` — Theory Node, Worked Examples, Exercises (7 traced), Feedback Tags |
| 3.7 | `angle-arc-measurement/spec.md` — Brand Voice and No Free Text |
| 4.1-4.3 | `unit-5-foundation/spec.md` — Dual Registration; `angle-arc-measurement/spec.md` — Skill appears in catalog |
| 4.4 | `unit-5-foundation/spec.md` — Unit Threshold Tracks Implemented Exercise Count |
| 4.5-4.6 | `unit-5-foundation/spec.md` — Pilot Skills; No SKILL_DEPENDENCIES entry |
| 4.7 | `angle-arc-measurement/spec.md` — Three Declared Unit 5 Feedback Tags |
| 4.8 | `angle-arc-measurement/spec.md` — Unit 5 Section Card and Selector Wiring |
| 4.9 | `unit-5-foundation/spec.md` — Dual Registration Guard |
| 4.10 | `angle-arc-measurement/spec.md` — Updated count/order guards |
| 5.1-5.2 | `angle-arc-measurement/spec.md` — Auto-Enablement Derives From Live Skills and Readiness |
| 5.3 | `angle-arc-measurement/spec.md` — Visible-flow proof |
| 5.4 | `angle-arc-measurement/spec.md` — FocusSelector auto-reenable |
| 5.5-5.6 | `math-answer-evaluator/spec.md` — Scalar Items Regression; U1/U2 Evaluator Suites |
| 5.7-5.9 | `openspec/config.yaml` — Final gates |
