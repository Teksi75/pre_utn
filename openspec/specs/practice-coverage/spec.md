# Delta for practice-coverage

## ADDED Requirements

### Requirement: Practice Bank Size for `mat.u1.conjuntos_numericos`

The system MUST expose a practice bank for skill `mat.u1.conjuntos_numericos` containing at least 40 exercises.

#### Scenario: bank meets minimum threshold

- GIVEN the skill `mat.u1.conjuntos_numericos` is queried for its exercise bank
- WHEN the bank is enumerated
- THEN the count is greater than or equal to 40

#### Scenario: bank falls short

- GIVEN the skill `mat.u1.conjuntos_numericos` is queried for its exercise bank
- WHEN the count is less than 40
- THEN the system reports the bank as insufficient for the `conjuntos-numericos-practice-expansion` change

### Requirement: Category Distribution

The practice bank MUST distribute exercises across these categories with these minimums:

| Category | Minimum Exercises |
|----------|-------------------|
| Pertenencia e inclusión | 8 |
| Clasificación de números | 12 |
| Racionales vs irracionales | 8 |
| Decimales (finitos, periódicos, no periódicos) | 6 |
| Mapa de inclusión entre conjuntos | 4 |
| Errores comunes conceptuales | 6 |

#### Scenario: category coverage is satisfied

- GIVEN the practice bank is filtered by each category
- WHEN each category count is measured
- THEN each count meets or exceeds its minimum

#### Scenario: category falls short

- GIVEN a category has fewer than its required minimum
- WHEN the bank is validated
- THEN a category coverage error names the deficient category and its count

### Requirement: Mandatory Numbers in Bank

The bank MUST include exercises or options that reference each of these numbers: 5, 0, -3, 2/5, 0,75, 0,3̄, √2, √9, π, -4/1.

#### Scenario: mandatory number appears in exercise prompt or options

- GIVEN the bank is searched for each mandatory number
- WHEN a number appears in a prompt or in an option value
- THEN it counts as coverage for that number

#### Scenario: mandatory number is absent

- GIVEN a mandatory number does not appear in any prompt or option
- WHEN the bank is validated
- THEN a missing-number error names the absent number

### Requirement: Skill Scope Boundary

Exercises in the bank MUST NOT include topics from powers, radicals, intervals, absolute value, or logarithms unless the topic is strictly required to classify a number.

#### Scenario: out-of-scope topic is primary focus

- GIVEN an exercise primarily tests powers, radicals, intervals, absolute value, or logarithms
- WHEN it is validated for `mat.u1.conjuntos_numericos`
- THEN it is rejected as out-of-scope for this skill

#### Scenario: out-of-scope topic is incidental to classification

- GIVEN an exercise asks to classify √2 or π
- WHEN the classification target is a number from the sets domain
- THEN it is accepted even though the symbol involves a root or constant

### Requirement: Difficulty Distribution Per Category

Each category MUST include exercises at each difficulty level: básico (1–2), intermedio (3), desafiante (4–5).

#### Scenario: basic exercises present in category

- GIVEN a category is selected
- WHEN exercises with difficulty 1 or 2 are counted
- THEN at least one such exercise exists

#### Scenario: intermediate exercises present in category

- GIVEN a category is selected
- WHEN exercises with difficulty 3 are counted
- THEN at least one such exercise exists

#### Scenario: challenging exercises present in category

- GIVEN a category is selected
- WHEN exercises with difficulty 4 or 5 are counted
- THEN at least one such exercise exists