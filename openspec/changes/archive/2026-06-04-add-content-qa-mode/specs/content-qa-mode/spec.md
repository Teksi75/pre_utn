# Content QA Mode Specification

## Purpose

Defines env-controlled access for QA/content reviewers to validate ready guided-practice content without changing student progression. Pedagogical impact: reviewers can inspect content quality faster; students remain protected by prerequisite sequencing.

## Requirements

### Requirement: Env-Gated Direct Practice Access

The system MUST allow direct URL access to a content-ready pilot practice skill without prerequisite mastery only when `NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE=true`.

#### Scenario: normal mode keeps prerequisite block

- GIVEN `NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE` is unset or not exactly `true`
- AND `mat.u1.valor_absoluto` is content-ready
- AND the student's `mat.u1.intervalos` accuracy is below `0.7`
- WHEN `/practice?skill=mat.u1.valor_absoluto` is analyzed
- THEN the result is blocked with reason `missing-prerequisite`
- AND the missing prerequisite is `mat.u1.intervalos`

#### Scenario: QA mode opens ready skill by URL

- GIVEN `NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE=true`
- AND `mat.u1.valor_absoluto` is content-ready
- AND the student's `mat.u1.intervalos` accuracy is below `0.7`
- WHEN `/practice?skill=mat.u1.valor_absoluto` is analyzed
- THEN the result is ready for `mat.u1.valor_absoluto`

### Requirement: QA Mode Must Not Bypass Availability

QA mode MUST NOT open unknown, non-pilot, or content-not-ready skills.

#### Scenario: unknown skill stays blocked

- GIVEN `NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE=true`
- WHEN `/practice?skill=mat.u99.inexistente` is analyzed
- THEN the result is blocked with reason `unknown-skill`

#### Scenario: unavailable skill stays blocked

- GIVEN `NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE=true`
- WHEN a requested skill is absent from the practice pilot map or lacks required content readiness
- THEN the result is blocked before prerequisite bypass is considered

### Requirement: Selector Progression Remains Student-Safe

QA mode MUST NOT change the normal FocusSelector accessibility map.

#### Scenario: selector still marks unmet prerequisites blocked

- GIVEN QA mode is enabled
- AND the student's prerequisite accuracy is below `0.7`
- WHEN the practice selector accessibility map is built
- THEN the downstream skill remains inaccessible in the selector
