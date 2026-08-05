# Delta for Math Error Taxonomy

## ADDED Requirements

### Requirement: U3 Exponenciales Error Tag Coverage

Every appended `mat.u3.exponenciales` entry MUST declare a
non-empty `commonErrorTags` array whose tag IDs exist in the
existing U3 taxonomy. At least one of the declared tag IDs MUST
be `u3_igualdad_exponenciales`. Each declared tag MUST map to
an existing feedback entry in
`content/matematica/feedback/unit-3.json`, and that feedback
MUST be useful (>= 1 sentence that names the misconception and
points at a corrective step).

#### Scenario: every appended entry declares at least one existing U3 tag

- GIVEN any appended entry in `mat.u3.exponenciales`
- WHEN its `commonErrorTags` is inspected
- THEN the array is non-empty AND every ID has prefix `u3_`
  AND `u3_igualdad_exponenciales` is present

#### Scenario: declared tags map to existing feedback

- GIVEN the set of tag IDs across all appended entries
- WHEN each ID is looked up in `content/matematica/feedback/unit-3.json`
- THEN a non-empty feedback entry exists for every ID

#### Scenario: feedback is useful

- GIVEN a feedback entry resolved from a declared tag
- WHEN its text is inspected
- THEN it names a misconception or corrective step (not a
  generic placeholder) and is >= 1 sentence long

### Requirement: U3 Exponenciales Renderer-Readable Answer Shapes

For multiple-choice entries in `mat.u3.exponenciales`, every
option MUST be select-able through the rendered control (an
option is a value the learner can pick from the MC or true-false
list — NOT free text the learner types). For numerical or
fill-blank entries, the expected answer MUST be a single finite
scalar (no `x = -2 or x = 2` surface, no interval text, no
log-expression text, no complex `a+bi` text).

#### Scenario: multiple-choice options are rendered, not typed

- GIVEN a multiple-choice `mat.u3.exponenciales` entry
- WHEN its `options` array is inspected
- THEN every option can be selected via the rendered control
  (no option relies on the learner typing roots, fractions with
  radicals, intervals, solution sets, complex `a+bi` forms,
  dual `x = -2 or x = 2` solutions, or full logarithmic
  expressions)

#### Scenario: numerical entries never request dual or structured text

- GIVEN a numerical or fill-blank `mat.u3.exponenciales` entry
- WHEN its prompt and expected answer are inspected
- THEN the expected answer is a single finite scalar — no dual
  `x = a, x = b` surface, no interval, no log expression, and
  no complex number text

## MODIFIED Requirements

*None.*

## REMOVED Requirements

*None.*

## RENAMED Requirements

*None.*
