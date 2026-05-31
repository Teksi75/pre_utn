# Interval Representation Specification

## Purpose

Defines a reusable structured model and renderer for interval notation, set-builder conditions, and number-line visuals in Unit 1 interval learning.

## Requirements

### Requirement: Structured Interval Representation

The system SHALL model interval graphics from structured data, not from copied static images. The model MUST represent notation, set-builder condition, lower/upper bounds, endpoint inclusion, and unbounded infinity sides.

#### Scenario: bounded interval is represented

- GIVEN the interval `[2, 5)`
- WHEN the interval representation is built
- THEN it records lower bound `2` as closed and upper bound `5` as open
- AND exposes notation and condition text consistently

#### Scenario: static image is not accepted

- GIVEN interval content uses only a copied visual image
- WHEN content is validated or reviewed
- THEN it is rejected because no structured interval data exists

### Requirement: Supported Interval Shapes

The renderer MUST support closed, open, half-open, bounded, and unbounded interval shapes, including rays with arrows and infinity notation.

#### Scenario: unbounded ray renders infinity

- GIVEN the condition `x >= -1`
- WHEN it is rendered as an interval graphic
- THEN the number line shows a closed endpoint at `-1`
- AND a ray arrow toward positive infinity

#### Scenario: open endpoints remain visually distinct

- GIVEN the interval `(-3, 4)`
- WHEN the number line is rendered
- THEN both endpoints appear open
- AND neither endpoint is communicated as included

### Requirement: Pedagogical Integration

Theory nodes, worked examples, practice options, and feedback for `mat.u1.intervalos` SHOULD reuse the interval representation engine whenever interval notation, inequality condition, and graph translation are taught or compared.

#### Scenario: theory compares representations

- GIVEN interval theory explains a bounded interval
- WHEN the student views the concept
- THEN notation, condition, and number-line representation are shown from the same data

#### Scenario: practice feedback shows the target representation

- GIVEN a student confuses endpoint inclusion
- WHEN feedback is displayed
- THEN it MAY show the correct interval graphic with the inclusion cue highlighted

### Requirement: Accessible Interval Graphics

Every rendered interval graphic MUST provide a textual fallback or aria label containing the interval notation and set-builder condition.

#### Scenario: screen reader receives equivalent content

- GIVEN a graph for `[2, +∞)` with condition `x >= 2`
- WHEN assistive technology reads it
- THEN it receives text describing the notation, condition, closed endpoint at `2`, and ray to positive infinity
