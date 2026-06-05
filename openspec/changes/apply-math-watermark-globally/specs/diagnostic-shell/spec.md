# Delta for diagnostic-shell

## Purpose

Integrates the `MathWatermark` wrapper into the diagnostic shell, replacing hardcoded topic constants with dynamic resolution and ensuring both the question and results screens carry context-aware watermarks.

## ADDED Requirements

#### ADDED: Diagnostic question screen watermark

The diagnostic question screen SHALL render its content inside a `MathWatermark` wrapper. The topic SHALL be derived from the current exercise's `skillId` via `mathThemeForSkill()`. The variant SHALL be `"hero"` with opacity `0.15`.

#### Scenario: question screen shows relevant watermark

- GIVEN a learner is on the diagnostic screen and the current exercise belongs to skill `conjuntos_numericos`
- WHEN the question screen renders
- THEN the section container has an absolutely-positioned `MathWatermark` with topic from `mathThemeForSkill("conjuntos_numericos")` and `MathThemePlate` opacity `0.15`

#### Scenario: watermark does not block question interaction

- GIVEN the diagnostic question screen with `MathWatermark`
- WHEN the learner clicks an answer option
- THEN the click event reaches the option button, not the SVG layer

#### ADDED: Diagnostic results screen watermark with dynamic topic

The `ResultsDisplay` component SHALL replace its hardcoded `topic="sets"` with dynamic topic resolution. If the diagnostic produced skill estimates, the watermark topic SHALL be derived from the weakest estimated skill via `mathThemeForSkill()`. If no estimates are available, it SHALL fall back to `"sets"`.

#### Scenario: results screen uses weakest-skill topic

- GIVEN the diagnostic identifies `potencias` as the weakest skill
- WHEN `ResultsDisplay` renders
- THEN the `MathWatermark` receives a `skillId` derived from `potencias`, and `MathThemePlate` displays the corresponding SVG theme

#### Scenario: results screen falls back to sets when no estimates

- GIVEN the diagnostic completed but produced no skill estimates
- WHEN `ResultsDisplay` renders
- THEN the `MathWatermark` renders with `topic="sets"` as the fallback, and no crash occurs

## MODIFIED Requirements

#### MODIFIED: ResultsDisplay replaces hardcoded topic constant

The `ResultsDisplay` component currently passes `topic="sets"` as a hardcoded string to the watermark layer. This SHALL be replaced with a call to `mathThemeForSkill()` using the weakest estimated skill ID, with `"sets"` as the fallback when no estimate is available.

(Previously: `ResultsDisplay` used `topic="sets"` unconditionally, displaying the same sets-themed decoration regardless of which skills the diagnostic tested.)

#### Scenario: hardcoded string is no longer present

- GIVEN the change is applied
- WHEN a developer searches `ResultsDisplay.tsx` for the string `topic="sets"`
- THEN no hardcoded topic assignment remains; topic resolution is dynamic

## Pedagogical Impact

- **Alumno**: The diagnostic's visual frame adapts to the mathematical domain being assessed, creating subtle contextual reinforcement. During results review — a potentially stressful moment — the dynamic topic watermark shifts attention toward the area that needs work rather than a generic decoration.
- **Docente**: When reviewing diagnostic results alongside a student, the watermark offers an immediate visual cue about which skill domain the results pertain to. The fallback to `"sets"` ensures the component never renders broken, even when diagnostic data is incomplete.
