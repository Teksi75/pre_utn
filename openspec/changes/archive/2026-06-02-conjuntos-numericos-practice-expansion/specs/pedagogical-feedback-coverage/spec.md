# Delta for pedagogical-feedback-coverage

## ADDED Requirements

### Requirement: Feedback Required for Every Exercise

Every exercise in the practice bank MUST have a corresponding feedback entry in the feedback library.

#### Scenario: exercise has feedback entry

- GIVEN an exercise ID in the bank
- WHEN the feedback library is queried for that exercise
- THEN a feedback entry exists and is non-empty

#### Scenario: exercise missing feedback entry

- GIVEN an exercise exists in the bank with no corresponding feedback entry
- WHEN the bank is validated
- THEN a missing-feedback error names the exercise ID

### Requirement: Feedback Explains Why the Correct Answer Is Correct

Feedback MUST explain WHY the correct answer is correct, not just that it is correct.

#### Scenario: feedback explains correct answer reasoning

- GIVEN an incorrect attempt on an exercise
- WHEN feedback is generated for the correct answer
- THEN the feedback explains the underlying mathematical principle that makes the correct answer correct

#### Scenario: feedback is generic

- GIVEN feedback that only states "correct answer" or "you got it right"
- WHEN the feedback is reviewed
- THEN it is flagged as non-compliant with the explain-why requirement

### Requirement: Feedback Addresses Wrong Option Reasoning

When useful, feedback MUST also explain WHY a typical wrong option is wrong.

#### Scenario: feedback explains wrong option misconception

- GIVEN an exercise with common wrong options
- WHEN feedback is generated for a wrong answer
- THEN the feedback names the specific misconception that led to the wrong option

#### Scenario: feedback ignores wrong option explanation when not useful

- GIVEN an exercise where wrong options stem from unrelated errors
- WHEN feedback is generated
- THEN it MAY focus on the correct answer reasoning only

### Requirement: Feedback Specificity

Feedback MUST be specific. Generic "you got it right" or "you got it wrong" messages are not compliant.

#### Scenario: specific feedback is non-generic

- GIVEN feedback for an exercise
- WHEN the content is reviewed
- THEN it does not contain purely generic confirmation or rejection language

#### Scenario: feedback is generic

- GIVEN feedback that says only "correcto" or "incorrecto" with no additional explanation
- WHEN the feedback is reviewed
- THEN it is flagged as non-compliant

### Requirement: Common Error Misconception Coverage

The feedback library MUST have entries that can address each of these common misconceptions:

1. "Todo decimal es irracional"
2. "Toda raíz es irracional"
3. "Un racional no es real"
4. "Confundir pertenencia ∈ con inclusión ⊂"
5. "Todo entero es natural"
6. "Todo número negativo no puede ser racional"
7. "Un decimal periódico NO es racional"
8. "√9 = 3 (no es irracional)"

#### Scenario: misconception has feedback coverage

- GIVEN one of the 8 common misconceptions
- WHEN the feedback library is queried for a relevant exercise
- THEN a feedback entry exists that addresses that misconception by name or concept

#### Scenario: misconception lacks feedback coverage

- GIVEN one of the 8 common misconceptions
- WHEN the feedback library is searched
- THEN no entry addresses that misconception
- AND a coverage gap error is raised naming the missing misconception

### Requirement: Feedback Target Independence from Category

The common error misconceptions MAY be tested in any category. The feedback library MUST be able to respond to these misconceptions regardless of which exercise category they appear in.

#### Scenario: misconception tested in different category

- GIVEN the misconception "todo decimal es irracional" is tested in a pertenencia exercise
- WHEN feedback is triggered for that wrong answer
- THEN the feedback correctly addresses the decimal/irrational confusion