# Delta for math-error-taxonomy

## ADDED Requirements

### Requirement: U3 New Symbolic Error Tags

The taxonomy MUST add the following `u3_*` error tags with feedback mappings in `feedback/unit-3.json` and detection patterns in `error-tagging.ts`:

| Tag ID | Misconception |
|--------|---------------|
| `u3_abs_eq_signo_negativo` | Treats `−|x|` as automatically <= 0 and concludes no solution |
| `u3_abs_eq_doble_solucion_omitida` | Returns only one root for `|ax+b|=k>0` |
| `u3_discriminante_signo_incorrecto` | Mis-evaluates `b² − 4ac` sign for parameter-k quadratic classification |
| `u3_recta_pendiente_perpendicular` | Uses reciprocal slope instead of negative reciprocal for perpendicular |
| `u3_sistemas_clasificacion_incorrecta` | Mis-classifies a system as SPD/SCI/SI from coefficients or graph |
| `u3_signchart_factor_signo_incorrecto` | Drops or sign-flips a critical factor when building the sign chart |
| `u3_signchart_critical_root_omitido` | Omits a critical root (e.g. forgets factor `x` root at 0 in P9p) |
| `u3_signchart_dominio_denominador` | Includes a denominator-zero value in the solution set |
| `u3_log_dominio_olvidado` | Solves a log equation without checking domain (`x < 0` for `log₂(−x)`, `x < 1` for P40m) |
| `u3_exp_factor_comun_signo` | Sign error when factoring `5^{x−1}` from `5^{x+2} − 105·5^{x−1}` |
| `u3_aislamiento_incorrecto` | Isolates variable incorrectly across multiple terms |
| `u3_signo_desigualdad` | Flips inequality sign incorrectly when multiplying/dividing by negative |

#### Scenario: tags pass validation

- GIVEN each new `u3_*` tag
- WHEN validated against the ErrorTag schema
- THEN validation succeeds with normalized tag

#### Scenario: feedback coverage complete

- GIVEN feedback library for unit-3
- WHEN each new `u3_*` tag is looked up
- THEN a non-empty `FeedbackMapping` is returned

### Requirement: Legacy `u2_*` Tag Removal

`ex.u3.ecuaciones_lineales.1` MUST NOT carry `u2_aislamiento_variable` or `u2_signo_al_mover`. The unit-prefix debt is corrected: those legacy tags are removed from this exercise and replaced by the new `u3_aislamiento_incorrecto` / `u3_signo_desigualdad` family where applicable.

#### Scenario: ex.u3.ecuaciones_lineales.1 carries u3 tags only

- GIVEN `ex.u3.ecuaciones_lineales.1` in the catalog
- WHEN its `commonErrorTags` are read
- THEN no tag starts with `u2_`
- AND `u3_aislamiento_incorrecto` and/or `u3_signo_desigualdad` appear in the list

### Requirement: No New Modeling-Chain Tags

This change MUST NOT introduce new tags under the `u3_traduccion_*` / `u3_verificacion_*` / `u3_interpretacion_*` namespace. Those tags are owned by the `fortalecer-u3-lenguaje-modelizacion-transferencia` companion change.

#### Scenario: modeling tags untouched

- GIVEN the taxonomy after this change
- WHEN tags are filtered by namespace
- THEN `u3_traduccion_*`, `u3_verificacion_*`, `u3_interpretacion_*` tag set is unchanged