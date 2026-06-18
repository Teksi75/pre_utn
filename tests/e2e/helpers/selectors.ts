/**
 * Centralized selector constants for the challenge-smoke E2E suite.
 *
 * Derived from existing semantic markers in the production code — no
 * data-testid is added to `src/**` (the only reused one is
 * `answer-form-multiple-choice` on `ExerciseAnswerInput.tsx:161`).
 * See design.md "Selector Inventory" for the E1–E5 mapping.
 */

// Challenge opt-in (ChallengeOptInBlock)
export const OPT_IN_HEADING = /Terminaste la práctica base\./; // E1 header
export const INTENTAR_BTN = /Intentar desafíos/; // E1 → E2/E3
export const FINALIZAR_BTN = /Finalizar por ahora/; // E4 skip

// Challenge exercise card (ChallengeExerciseCard)
export const COUNTER_REGEX = /^Desafío \d+ de \d+$/; // E2/E3 counter

// Challenge feedback (ChallengeFeedback)
export const STATUS_BANNER_ROLE = "status" as const; // result banner
export const CONTINUE_BTN = /Siguiente desafío|Ver resultado/; // continue

// Challenge done summary (ChallengeDoneSummary)
export const DONE_HEADER = "Desafíos completados"; // E3/E4
export const READINESS_LABEL = /Nivel de preparación en desafíos/; // E5

// FocusSelector (used by the practice-flow driver)
export const UNIT_SELECT = "#unit-select"; // FocusSelector.tsx:174

// Exercise answer input (reused by base practice + challenges)
export const ANSWER_FORM_MC = '[data-testid="answer-form-multiple-choice"]';
// Text-based answer form (numerical, fill-blank, symbolic share this form).
// See src/components/exercises/ExerciseAnswerInput.tsx:250.
export const ANSWER_FORM_TEXT = '[data-testid="answer-form-text"]';
// True/false answer form. See src/components/exercises/ExerciseAnswerInput.tsx:211.
export const ANSWER_FORM_TRUE_FALSE = '[data-testid="answer-form-true-false"]';
// Input inside the text-based answer form. Use a *relative* selector (not
// `#exercise-answer`) because the parent component can pass a custom
// `inputId` prop (e.g. `AnswerForm.tsx:34` passes `inputId="answer-input"`
// for the standard practice flow; `ChallengeExerciseCard.tsx` may pass
// another). The relative selector covers all of them.
export const ANSWER_INPUT = 'input[type="text"]';
