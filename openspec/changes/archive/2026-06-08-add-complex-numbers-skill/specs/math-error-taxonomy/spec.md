# Delta for math-error-taxonomy

## ADDED Requirements

### Requirement: Complex Number Error Tags

The taxonomy SHALL include 6-8 error tags with prefix `u1_complejo_*` for common complex number misconceptions. Each tag MUST follow the `u{1-6}_{slug}` ID convention and include description and examples.

| Tag ID | Misconception |
|--------|---------------|
| `u1_complejo_i_definicion` | Treats i as sqrt(-1) in real numbers; thinks i is a real number |
| `u1_complejo_partes_confusion` | Swaps real and imaginary parts: Re(a+bi) = b instead of a |
| `u1_complejo_suma_real` | Adds complex numbers as if only real parts matter; ignores imaginary component |
| `u1_complejo_i_cuadrado_signo` | Forgets i^2 = -1 in multiplication; uses i^2 = 1 or i^2 = i |
| `u1_complejo_conjugado_signo` | Errors in conjugate sign: writes conjugate of a+bi as a+bi or -a-bi |
| `u1_complejo_division_sin_conjugado` | Divides complex numbers without multiplying by conjugate |
| `u1_complejo_potencia_ciclo` | Misapplies powers-of-i cycle: e.g., i^5 = 1 instead of i |
| `u1_complejo_igualdad_parcial` | Considers two complex numbers equal if only real or only imaginary parts match |

#### Scenario: all complex error tags load

- GIVEN the taxonomy is loaded
- THEN all `u1_complejo_*` tags are present with valid ID, unit 1, description, and examples
- AND no duplicate tag IDs exist

#### Scenario: complex tags pass validation

- GIVEN each `u1_complejo_*` tag
- WHEN validated against ErrorTag schema
- THEN validation succeeds with normalized tag
