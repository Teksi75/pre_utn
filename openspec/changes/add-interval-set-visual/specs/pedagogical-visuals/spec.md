# Pedagogical Visuals Specification

## Purpose

Defines typed, parsed, and rendered math visual examples. This change adds `interval-set` for final Unit 3 inequality solution sets while preserving `sign-chart` for sign reasoning.

## Requirements

### Requirement: Interval Set Visual Model

The system MUST support `kind: "interval-set"` as a `PedagogicalVisual` variant. Root fields MUST own `notation`, optional `setBuilderLabel`, and accessibility text. `intervals` MUST be a non-empty `IntervalSegment[]`; each segment MUST contain only `lower`, `upper`, `lowerInclusion`, and `upperInclusion` using existing `IntervalBound` and `EndpointInclusion`. Segments MUST NOT embed `IntervalRepresentation`, notation, or per-segment accessibility text.

#### Scenario: Single bounded interval

- GIVEN an `interval-set` with one finite lower and one finite upper bound
- WHEN parsed
- THEN the visual is accepted with open or closed endpoint inclusion preserved

#### Scenario: Union of rays

- GIVEN notation `(-∞, -3) ∪ (7, +∞)` and two interval segments
- WHEN parsed
- THEN both segments are preserved on one visual as one solution set

#### Scenario: Segment count drift

- GIVEN notation has two union parts but `intervals` has one segment
- WHEN parsed
- THEN parsing fails with an error naming `notation` and `intervals`

### Requirement: Interval Bound Geometry and Labels

The renderer MUST support left rays, right rays, bounded intervals, and open/closed finite endpoints. For finite bounds, `value` MUST drive geometry and optional `label` MUST drive displayed text, including fraction labels.

#### Scenario: Fraction label uses numeric geometry

- GIVEN a finite endpoint `{ value: -2.5, label: "-5/2" }`
- WHEN rendered
- THEN the endpoint is positioned by `-2.5`
- AND the displayed tick label is `-5/2`

#### Scenario: Open and closed endpoints differ

- GIVEN `[4, +∞)` and `(-∞, -3)` segments
- WHEN rendered
- THEN `4` is closed, `-3` is open, and infinity sides use arrows

### Requirement: Safe Responsive SVG Rendering

The `interval-set` SVG MUST be responsive with a `viewBox`, MUST NOT emit fixed `width="520"`, and MUST NOT emit `NaN` or coordinate `Infinity` values.

#### Scenario: Infinite bounds remain finite SVG coordinates

- GIVEN a visual with left and right infinity rays
- WHEN rendered
- THEN SVG coordinates are finite numbers
- AND arrows communicate unbounded sides

#### Scenario: Responsive container

- GIVEN the visual renders in narrow and wide containers
- WHEN the SVG is inspected
- THEN it uses `viewBox` and responsive sizing without fixed width `520`

### Requirement: Accessible and Testable Rendering

Rendered `interval-set` visuals MUST expose `role="img"`, `aria-label`, `<title>`, and `<desc>`. Testable elements MUST include `data-interval-region`, `data-interval-side`, `data-endpoint`, and `data-hatching` where applicable.

#### Scenario: Screen reader equivalent

- GIVEN an interval-set for `[4, +∞)`
- WHEN assistive technology reads it
- THEN the label/title/description communicate notation, included endpoint, and ray direction

#### Scenario: Stable selectors

- GIVEN renderer tests query interval pieces
- WHEN the visual renders
- THEN regions, sides, endpoints, and hatching cues have stable data attributes

### Requirement: Unit 3 Pedagogical Integration

Unit 3 content MAY combine `sign-chart` reasoning visuals with `interval-set` final-solution visuals. The change MUST NOT globally replace `sign-chart`, `DistanceOnLineVisual`, U1/U2 interval renderers, evaluators, or routes.

#### Scenario: Sign reasoning plus final set

- GIVEN a U3 inequality example explains signs before the answer
- WHEN visual examples render
- THEN `sign-chart` may show sign reasoning
- AND `interval-set` may show the final solution set

#### Scenario: Student and teacher value

- GIVEN a student reviews a U3 solution
- WHEN the final set is visualized
- THEN the student sees the solution topology clearly
- AND future teacher-facing signals can distinguish reasoning visuals from final-answer visuals
