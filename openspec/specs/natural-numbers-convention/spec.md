# Delta for natural-numbers-convention

## ADDED Requirements

### Requirement: N Without Zero Convention

The practice bank MUST treat ℕ (natural numbers) as the set WITHOUT zero: ℕ = {1, 2, 3, ...}. Zero is NOT a natural number.

#### Scenario: zero is not classified as natural

- GIVEN an exercise asks to classify the number 0
- WHEN the correct answer is determined
- THEN 0 is placed in ℤ, ℚ, ℝ (and possibly ℝ\ℚ) but NOT in ℕ

#### Scenario: zero appears in options for natural classification

- GIVEN an exercise asks "¿0 ∈ ℕ?"
- WHEN the student answers "Sí"
- THEN the answer is marked incorrect
- AND the feedback explains that 0 is not a natural number by the N-sin-cero convention

### Requirement: Explicit N-Sin-Cero Test

The practice bank MUST contain at least one exercise that explicitly tests the N-sin-cero convention.

#### Scenario: explicit N-sin-cero test exists

- GIVEN the practice bank is enumerated
- WHEN it is searched for exercises that ask about 0 and ℕ
- THEN at least one such exercise exists

#### Scenario: no explicit N-sin-cero test

- GIVEN the practice bank has no exercise that tests the 0/ℕ relationship
- WHEN the bank is validated against this spec
- THEN a missing-test error is raised

### Requirement: N-Sin-Cero Convention in Feedback

Any exercise that includes 0 as an option or classification target MUST reflect the N-sin-cero convention in its feedback.

#### Scenario: feedback for 0 classification respects convention

- GIVEN an exercise where 0 is classified in ℤ, ℚ, ℝ
- WHEN the student submits a wrong answer classifying 0 in ℕ
- THEN the feedback explicitly states that 0 is not a natural number under the N-sin-cero convention

#### Scenario: feedback for exercise without 0 does not need convention note

- GIVEN an exercise that does not involve 0
- WHEN feedback is generated
- THEN no N-sin-cero convention note is required