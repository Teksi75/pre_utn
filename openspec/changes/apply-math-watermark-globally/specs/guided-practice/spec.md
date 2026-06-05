# Delta for guided-practice

## Purpose

Integrates per-phase `MathWatermark` wrappers into each of the five guided practice sub-phases, deriving the topic dynamically from the active skill and applying phase-appropriate variants.

## ADDED Requirements

#### ADDED: Theory phase watermark

The `PracticeTheoryPhase` component SHALL wrap its content in a `MathWatermark`. The topic SHALL be derived from the active skill via `mathThemeForSkill(usePracticeFlow().selectedSkillId)`. The variant SHALL be `"background"` with opacity `0.18`.

#### Scenario: theory phase displays skill-specific watermark

- GIVEN a learner is in the theory phase for `valor_absoluto`
- WHEN `PracticeTheoryPhase` renders
- THEN the `MathWatermark` resolves `mathThemeForSkill("valor_absoluto")` and renders with `variant="background"` and opacity `0.18`

#### ADDED: Example phase watermark

The `PracticeExamplePhase` component SHALL wrap its content in a `MathWatermark`. The topic SHALL be derived from the active skill. The variant SHALL be `"background"` with opacity `0.18`.

#### Scenario: example phase watermark consistent with theory

- GIVEN the learner moves from theory to example in the same skill
- WHEN `PracticeExamplePhase` renders
- THEN it uses the same topic and `variant="background"` as the theory phase, maintaining visual continuity

#### ADDED: Exercise phase watermark

The `PracticeExercisePhase` component SHALL wrap its content in a `MathWatermark`. The topic SHALL be derived from the active skill. The variant SHALL be `"card"` with opacity `0.12`.

#### Scenario: exercise phase uses card variant

- GIVEN a learner is answering exercises for `potencias`
- WHEN `PracticeExercisePhase` renders
- THEN the watermark uses `variant="card"` with opacity `0.12`, visually distinguishing active work from instructional phases

#### ADDED: Feedback phase watermark

The `PracticeFeedbackPhase` component SHALL wrap its content in a `MathWatermark`. The topic SHALL be derived from the active skill. The variant SHALL be `"card"` with opacity `0.12`.

#### Scenario: feedback phase shares card variant with exercise

- GIVEN the learner completes an exercise and enters the feedback phase
- WHEN `PracticeFeedbackPhase` renders
- THEN the watermark uses `variant="card"` with the same topic, maintaining the active-work visual language through feedback

#### ADDED: Recovery phase watermark

The `PracticeRecoveryPhase` component SHALL wrap its content in a `MathWatermark`. The topic SHALL be derived from the active skill. The variant SHALL be `"background"` with opacity `0.18`.

#### Scenario: recovery phase returns to background variant

- GIVEN a learner enters recovery after feedback
- WHEN `PracticeRecoveryPhase` renders
- THEN the watermark uses `variant="background"`, signaling a return to instructional context

#### ADDED: Topic resolution from practice flow state

All five practice phase components SHALL resolve the `skillId` from `usePracticeFlow().selectedSkillId`. The resolved `skillId` SHALL be passed to `MathWatermark` as the `skillId` prop rather than pre-resolving the topic externally.

#### Scenario: watermarks update when skill changes

- GIVEN the learner switches practice from `conjuntos_numericos` to `raices`
- WHEN any phase component re-renders
- THEN the watermark topic changes to reflect the new active skill without manual intervention

## Pedagogical Impact

- **Alumno**: The variant differentiation — `background` for instructional phases (theory, example, recovery) and `card` for active phases (exercise, feedback) — creates a subtle visual rhythm that helps learners orient themselves within the practice flow. The dynamic topic resolution means the decoration always matches what they are studying, reinforcing domain identity.
- **Docente**: The per-phase contract provides a predictable visual grammar: instructional screens share one watermark variant, active-work screens share another. When observing a student's screen during class, instructors can identify the practice phase at a glance without reading labels, speeding up in-class support.
