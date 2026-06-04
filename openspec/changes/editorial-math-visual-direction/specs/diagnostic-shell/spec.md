# Delta for diagnostic-shell

## ADDED Requirements

### Req: Editorial Visual Conformity

Diagnostic question screen and results display SHALL apply editorial design tokens. Existing behavioral requirements (balanced selection, skill estimation, weak-area suggestions) are unchanged.

**Scenario: question screen follows editorial tokens**
- GIVEN diagnostic question displayed
- WHEN `DiagnosticQuestion` renders
- THEN typography, surfaces, spacing match editorial tokens

**Scenario: results display follows editorial tokens**
- GIVEN results calculated
- WHEN `ResultsDisplay` renders
- THEN surface treatment, typography, accent tokens match editorial design

**Scenario: behavior unchanged**
- GIVEN editorial styling applied
- WHEN student completes diagnostic
- THEN selection, estimation, and suggestions work identically to pre-change

## Pedagogical Impact

Consistent styling reduces visual fatigue during assessment. Unified presentation helps instructors interpret results without distraction.
