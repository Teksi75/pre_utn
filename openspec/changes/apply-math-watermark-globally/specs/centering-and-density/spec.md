# Centering and Density Specification

## Purpose

Defines the corrected `MathThemePlate` viewBox dimensions, `preserveAspectRatio` value, and rebalanced opacity defaults that ensure watermarks fill containers edge-to-edge without centering whitespace.

## Requirements

### Requirement: viewBox Dimensions

`MathThemePlate` SHALL use `viewBox="0 0 320 112"` on its root `<svg>` element. The wider aspect ratio (~2.86:1) SHALL ensure the decorative pattern reaches container edges at common layout widths.

#### Scenario: SVG uses 320×112 viewBox

- GIVEN `MathThemePlate` is rendered
- WHEN the DOM is inspected
- THEN the root `<svg>` element has attribute `viewBox="0 0 320 112"`

#### Scenario: wider viewBox fills a 1200px container

- GIVEN a section container is 1200px wide
- WHEN `MathThemePlate` with `preserveAspectRatio="xMidYMid slice"` renders inside it
- THEN the SVG fills edge-to-edge with no visible whitespace on left or right

### Requirement: preserveAspectRatio Value

`MathThemePlate` SHALL use `preserveAspectRatio="xMidYMid slice"`. This value SHALL cause the SVG to scale uniformly to fill the container, centering the visible area and clipping overflow equally on all sides.

#### Scenario: slice fills container

- GIVEN a container narrower than the 2.86:1 aspect ratio
- WHEN `MathThemePlate` renders
- THEN the SVG scales to cover the full container width and height, clipping excess height equally from top and bottom

#### Scenario: no horizontal gaps

- GIVEN any container wider than 320 CSS pixels
- WHEN the watermark renders with `xMidYMid slice`
- THEN there are no transparent bars or gaps on any edge of the container

### Requirement: Opacity Defaults

The default opacities for `MathThemePlate` SHALL be: `hero` → `0.15`, `background` → `0.18`, `card` → `0.12`. These values SHALL apply when no explicit `opacity` prop is passed to the component.

#### Scenario: hero opacity is 0.15

- GIVEN `MathThemePlate` with `variant="hero"` and no `opacity` prop
- WHEN the component renders
- THEN the visible opacity is `0.15`

#### Scenario: card opacity is 0.12

- GIVEN `MathThemePlate` with `variant="card"` and no `opacity` prop
- WHEN the component renders
- THEN the visible opacity is `0.12`

### Requirement: Edge-to-Edge Fill Behavior

When rendered inside a full-width container, the `MathThemePlate` SVG SHALL extend from the left edge to the right edge of the container. No horizontal centering whitespace SHALL appear. The `slice` preserveAspectRatio SHALL clip overflow rather than letterbox.

#### Scenario: full-width container shows no whitespace

- GIVEN a `MathWatermark` wrapper inside a `max-w-7xl` container at a 1200px viewport
- WHEN the page renders
- THEN the decorative SVG touches both left and right edges of the container with no gap

## Pedagogical Impact

- **Alumno**: The edge-to-edge fill eliminates the floating "sticker" effect of a centered decoration, creating a more immersive frame that feels intentional. The rebalanced opacities ensure the watermark stays in the perceptual background — visible enough for atmosphere, transparent enough to never compete with text or interactive elements.
- **Docente**: The consistent 320×112 viewBox ensures all 8 SVG themes render at the same scale and density regardless of which topic is displayed. This uniformity means the visual weight of one topic does not appear denser or lighter than another when instructors review different screens.
