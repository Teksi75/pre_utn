# Delta for Pedagogical Feedback Coverage

## ADDED Requirements

### Requirement: Feedback Coverage for Unit 2 Aplicaciones Error Tags

The feedback library MUST include FeedbackMapping entries for every new `u2_*` error tag added in this slice. Each mapping MUST explain the specific misconception and guide the student toward correct reasoning.

| Error Tag | Feedback Must Address |
|-----------|----------------------|
| `u2_denominador_cero` | Why solutions that zero any denominator are invalid; how to check domain before accepting solutions |
| `u2_confunde_mcm_mcd` | The difference between MCM (smallest polynomial divisible by both) and MCD (largest polynomial dividing both); when to use each |

#### Scenario: U2APP-FB-001 — New tags have feedback

- GIVEN the feedback library for unit 2
- WHEN queried for `u2_denominador_cero` or `u2_confunde_mcm_mcd`
- THEN a non-empty FeedbackMapping exists with pedagogical explanation

#### Scenario: U2APP-FB-002 — Feedback explains misconception

- GIVEN feedback for `u2_denominador_cero`
- WHEN the feedback content is reviewed
- THEN it explains WHY a zero-denominator value is not a valid solution

#### Scenario: U2APP-FB-003 — Exercise references covered tags

- GIVEN an exercise with `commonErrorTags` containing new `u2_*` tags
- WHEN the feedback library is checked
- THEN every referenced tag has a corresponding FeedbackMapping entry
