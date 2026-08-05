# Delta for math-exercise-catalog
## ADDED Requirements
### Requirement: parseExerciseId Boundary Contract (Test-Only Lock-In)
MUST accept numeric (`ex.u{N}.{skill}.{N}`) and slug-hyphen (`ex.u{N}.{slug-with-hyphens}.{N}`) ExerciseIds; MUST reject malformed prefix, unit out of `1..6`, empty skill segment, empty suffix.
#### Scenario: accepts numeric and slug-hyphen IDs
- GIVEN `"ex.u3.operaciones_polinomios.4"` and `"ex.u2.mcm-mcd-polinomios.1"`; WHEN `parseExerciseId` parses them; THEN both yield a valid `ExerciseId`.
#### Scenario: rejects malformed prefix, out-of-range unit, empty skill segment, empty suffix
- GIVEN `"exx.u3.polinomios.1"`, `"ex.u7.polinomios.1"`, `"ex.u3..1"`, `"ex.u3.polinomios."`; WHEN `parseExerciseId` parses each; THEN all parses fail.