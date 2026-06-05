# Math Watermark Application Specification

## Purpose

Declares the application contract: which screens and practice sub-phases receive watermarks, what topic source each uses, and how the home hero fallback mechanism works.

## Requirements

### Requirement: Eight-Screen Application Contract

Each of the following screens SHALL render a `MathWatermark` wrapper. Topic source and variant SHALL follow this table:

| Screen | Topic Source | Variant | Opacity |
|--------|-------------|---------|---------|
| Home hero | `"sets"` (constant) | `hero` | `0.15` |
| Home roadmap | `"sets"` (constant) | `background` | `0.18` |
| Learn index | `"sets"` (constant) | `background` | `0.18` |
| Learn matemática | `"sets"` (constant) | `background` | `0.18` |
| Learn skill detail | `mathThemeForSkill(skillId)` | `background` | `0.18` |
| Diagnostic question | `mathThemeForSkill(exercise.skillId)` | `hero` | `0.15` |
| Diagnostic results | dynamic from estimates, fallback `"sets"` | `hero` | `0.15` |

#### Scenario: learn skill detail resolves topic dynamically

- GIVEN a learner is on `/learn/matematica/potencias`
- WHEN the skill detail page renders
- THEN the `MathWatermark` calls `mathThemeForSkill("potencias")` and displays the corresponding SVG theme

#### Scenario: diagnostic results fall back when no estimates

- GIVEN the diagnostic produces no skill estimates
- WHEN `ResultsDisplay` renders
- THEN `MathWatermark` falls back to `topic="sets"` rather than crashing

### Requirement: Five-Phase Practice Contract

Each practice sub-phase component SHALL wrap its content in `MathWatermark`. The topic SHALL be derived from `usePracticeFlow().selectedSkillId` via `mathThemeForSkill()`. The variant SHALL follow this table:

| Phase | Variant | Opacity |
|-------|---------|---------|
| Theory | `background` | `0.18` |
| Example | `background` | `0.18` |
| Exercise | `card` | `0.12` |
| Feedback | `card` | `0.12` |
| Recovery | `background` | `0.18` |

#### Scenario: exercise phase uses card variant

- GIVEN a learner is in the exercise sub-phase for `conjuntos_numericos`
- WHEN `PracticeExercisePhase` renders
- THEN the watermark uses `variant="card"` with opacity `0.12` and topic from `mathThemeForSkill("conjuntos_numericos")`

#### Scenario: theory and recovery share background variant

- GIVEN the learner transitions from theory to recovery phase
- WHEN both phases render
- THEN both use `variant="background"` with opacity `0.18`, differentiated only by content

### Requirement: Home Hero Fallback Mechanism

A single boolean constant `USE_MATH_THEME_PLATE` SHALL exist at the top of `src/app/page.tsx`. It SHALL default to `true`. When `true`, the home hero SHALL render `MathWatermark` with `variant="hero"` and `topic="sets"`. When `false`, it SHALL render the existing `EngineeringHeroVisual` component unchanged.

#### Scenario: default uses MathWatermark

- GIVEN `USE_MATH_THEME_PLATE = true` (default)
- WHEN the home page renders
- THEN the hero section contains `MathWatermark` with `variant="hero"` and `topic="sets"`

#### Scenario: one-line revert restores EngineeringHeroVisual

- GIVEN a developer changes `USE_MATH_THEME_PLATE` to `false`
- WHEN the home page renders
- THEN `EngineeringHeroVisual` renders exactly as before the change

### Requirement: EngineeringHeroVisual Preservation

The `EngineeringHeroVisual` component file SHALL remain in the codebase untouched. It SHALL remain importable and renderable. No code within `EngineeringHeroVisual.tsx` SHALL be modified, deleted, or refactored by this change.

#### Scenario: EngineeringHeroVisual still importable

- GIVEN the change is fully applied
- WHEN a developer imports `EngineeringHeroVisual` from its original path
- THEN the import resolves and the component renders without errors

## Pedagogical Impact

- **Alumno**: Every screen now has a consistent visual identity that frames the mathematical domain. Dynamic topic resolution on skill-detail and diagnostic screens means the decoration reflects what the student is working on, reinforcing context without requiring explicit attention. The fallback constant makes the hero trivially revertible if decoration proves distracting.
- **Docente**: The application contract provides a single source of truth for which screens carry watermarks and how topics resolve, simplifying audits. Per-phase variants — `background` for instruction (theory, example, recovery), `card` for active work (exercise, feedback) — create a visual rhythm that helps instructors identify the practice stage at a glance.
