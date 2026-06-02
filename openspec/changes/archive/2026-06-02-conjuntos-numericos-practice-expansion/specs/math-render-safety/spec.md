# Delta for math-render-safety

## ADDED Requirements

### Requirement: Root Rendering Through Math Component

All roots in exercise content MUST render through the math component with the top bar visible. A bare `√` text node outside math delimiters is forbidden.

#### Scenario: root is rendered through math component

- GIVEN an exercise prompt contains $\sqrt{2}$
- WHEN the prompt is parsed by the RichText pipeline
- THEN the root renders with its top bar visible
- AND no plain-text `√` appears outside math delimiters

#### Scenario: bare root outside math delimiters is rejected

- GIVEN an exercise prompt contains the literal text `√2` without dollar delimiters
- WHEN the exercise is validated
- THEN validation fails with a render-safety error indicating bare root

#### Scenario: multi-term radicand uses \\sqrt{...}

- GIVEN an exercise contains a root with a multi-term radicand
- WHEN the exercise is validated for render safety
- THEN the radicand uses \\sqrt{...} syntax
- AND not a bare `√` with text following it

### Requirement: Math Symbol Rendering Through Component

Membership (∈) and inclusion (⊂) symbols MUST render through the math component, never as Unicode text nodes that bypass the renderer.

#### Scenario: membership symbol rendered through math component

- GIVEN an exercise contains `∈` inside math delimiters as $\in$
- WHEN the prompt is parsed
- THEN it renders correctly
- AND no raw Unicode ∈ appears outside math delimiters

#### Scenario: inclusion symbol rendered through math component

- GIVEN an exercise contains `⊂` inside math delimiters as $\subset$
- WHEN the prompt is parsed
- THEN it renders correctly
- AND no raw Unicode ⊂ appears outside math delimiters

#### Scenario: Unicode text node outside math is rejected

- GIVEN an exercise prompt contains ∈ or ⊂ as plain text
- WHEN the exercise is validated
- THEN validation fails naming the offending symbol and the exercise ID

### Requirement: Fraction Rendering Through Math Component

Fractions in exercise content MUST render through the math component using \frac{...}{...} syntax inside math delimiters.

#### Scenario: fraction renders correctly

- GIVEN an exercise prompt contains $\frac{2}{5}$
- WHEN the prompt is parsed
- THEN the fraction renders with numerator above denominator

#### Scenario: fraction as plain text is rejected

- GIVEN an exercise prompt contains `2/5` outside math delimiters
- WHEN the exercise is validated
- THEN validation fails with a render-safety error for non-rendered fraction

### Requirement: Decimal Comma Convention in Math Mode

Decimal commas in KaTeX math mode MUST use the `{,}` convention to avoid KaTeX treating a comma as punctuation.

#### Scenario: decimal comma uses correct convention

- GIVEN an exercise prompt contains a decimal number in math mode
- WHEN the prompt is parsed
- THEN any comma in the decimal uses `{,}` syntax

#### Scenario: comma treated as punctuation in math mode

- GIVEN an exercise prompt contains `0,75` in math mode as `0,75`
- WHEN KaTeX renders the expression
- THEN the comma may be treated as a punctuation separator
- AND the exercise is flagged for using the correct `0{,}75` convention

### Requirement: Regression Test for Render Safety

A regression test SHALL exist that asserts no exercise in `mat.u1.conjuntos_numericos` contains a bare `√` text node outside math delimiters.

#### Scenario: regression test detects bare root

- GIVEN the regression test runs over all exercises for `mat.u1.conjuntos_numericos`
- WHEN an exercise contains `√` outside `$...$` delimiters
- THEN the test fails
- AND reports the offending exercise ID

#### Scenario: regression test passes clean bank

- GIVEN the regression test runs over a bank where all roots are in math delimiters
- WHEN the test completes
- THEN the test passes