# Delta for pedagogical-feedback-coverage

## ADDED Requirements

### Requirement: Feedback Coverage for Complex Number Errors

The feedback library MUST include FeedbackMapping entries for every `u1_complejo_*` error tag. Each mapping MUST explain the specific misconception and guide the student toward the correct reasoning.

| Error Tag | Feedback Must Address |
|-----------|----------------------|
| `u1_complejo_i_definicion` | Why i is not a real number; i is defined by i^2 = -1 |
| `u1_complejo_partes_confusion` | How to identify Re(z) and Im(z) from standard form a+bi |
| `u1_complejo_suma_real` | That both real and imaginary parts must be combined separately |
| `u1_complejo_i_cuadrado_signo` | The substitution i^2 = -1 in multiplication steps |
| `u1_complejo_conjugado_signo` | That conjugate changes only the sign of the imaginary part |
| `u1_complejo_division_sin_conjugado` | Why multiplying by conjugate eliminates the imaginary denominator |
| `u1_complejo_potencia_ciclo` | The 4-step cycle: i^1=i, i^2=-1, i^3=-i, i^4=1, then repeats |
| `u1_complejo_igualdad_parcial` | That equality requires BOTH real and imaginary parts to match |

#### Scenario: every complex error tag has feedback

- GIVEN the feedback library for unit-1
- WHEN queried for each `u1_complejo_*` tag
- THEN a non-empty FeedbackMapping exists with pedagogical explanation

#### Scenario: feedback explains the specific misconception

- GIVEN feedback for `u1_complejo_i_cuadrado_signo`
- WHEN the feedback content is reviewed
- THEN it explains WHY i^2 = -1 (not just states the rule)

#### Scenario: exercise references only covered tags

- GIVEN an exercise with `commonErrorTags` containing `u1_complejo_*` tags
- WHEN the feedback library is checked
- THEN every referenced tag has a corresponding FeedbackMapping entry
