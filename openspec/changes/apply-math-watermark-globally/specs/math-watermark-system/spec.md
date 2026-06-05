# Math Watermark System Specification

## Purpose

Defines the `MathWatermark` wrapper component contract: a reusable container that layers a `MathThemePlate` SVG decoration behind interactive content with correct positioning, topic resolution, accessibility attributes, and variant-opacity defaults.

## Requirements

### Requirement: Wrapper Signature

The `MathWatermark` component SHALL accept props `topic?: MathTheme`, `skillId?: string`, `variant?: MathThemeVariant`, `opacity?: number`, and `className?: string`. All props SHALL be optional. The component SHALL render its `children` inside the decorated container.

#### Scenario: wrapper renders with all defaults

- GIVEN no props are passed
- WHEN `MathWatermark` renders
- THEN children are visible, the watermark uses `topic="sets"`, `variant="background"`, and `opacity=0.18`

#### Scenario: explicit opacity overrides default

- GIVEN `opacity={0.12}` is passed
- WHEN the component renders
- THEN the inner `MathThemePlate` receives that exact opacity value

### Requirement: Positioning Contract

The wrapper SHALL establish a `relative` positioning container with `overflow-hidden`. The inner `MathThemePlate` SHALL be `absolute inset-0`. Children SHALL render in a `relative z-10` layer above the watermark. The SVG layer SHALL carry `pointer-events: none`.

#### Scenario: watermark sits behind interactive children

- GIVEN a button child inside `MathWatermark`
- WHEN the user clicks the button
- THEN the click reaches the button, not the SVG layer

### Requirement: Topic Resolution

If `skillId` is provided, the component SHALL resolve the topic via `mathThemeForSkill(skillId)`. If `skillId` is absent and `topic` is provided, it SHALL use `topic` directly. If neither is provided, it SHALL fall back to `"sets"`.

#### Scenario: skillId resolves to a known topic

- GIVEN `skillId="conjuntos_numericos"`
- WHEN `MathWatermark` renders
- THEN it calls `mathThemeForSkill("conjuntos_numericos")` and passes the result to `MathThemePlate`

#### Scenario: neither skillId nor topic provided

- GIVEN no `skillId` and no `topic` prop
- WHEN the component renders
- THEN the watermark displays the `"sets"` theme without crashing

### Requirement: Accessibility Contract

The `MathThemePlate` SVG layer SHALL carry `aria-hidden="true"`. All interactive children MUST remain focusable and operable via keyboard and screen reader. The wrapper SHALL NOT introduce new tab stops or focus traps.

#### Scenario: screen reader ignores decoration

- GIVEN a screen reader user lands on a `MathWatermark`-wrapped section
- WHEN the virtual cursor moves through the DOM
- THEN the SVG is not announced; only content children are read

#### Scenario: keyboard focus reaches children

- GIVEN a focusable input inside `MathWatermark`
- WHEN the user presses Tab
- THEN focus enters the input, not trapped by the SVG

### Requirement: Variant and Opacity Defaults

The component SHALL provide default opacities per variant: `hero` → `0.15`, `background` → `0.18`, `card` → `0.12`. If `variant` is omitted, it SHALL default to `"background"`. `className` SHALL be forwarded to the outer container.

#### Scenario: variant hero applies hero opacity

- GIVEN `variant="hero"` with no explicit `opacity`
- WHEN `MathWatermark` renders
- THEN `MathThemePlate` receives `opacity={0.15}`

#### Scenario: omitted variant defaults to background

- GIVEN no `variant` prop
- WHEN `MathWatermark` renders
- THEN `MathThemePlate` receives `variant="background"` and `opacity={0.18}`

## Pedagogical Impact

- **Alumno**: Consistent watermark positioning provides a subtle visual anchor that reinforces the mathematical domain without distracting from content. The `z-10` layering ensures interactive exercises remain fully operable. The `aria-hidden` decoration stays out of the screen-reader path so learners using assistive technology are not burdened with noise.
- **Docente**: The wrapper contract serves as a single integration point for all screens, reducing the cognitive cost of maintaining visual consistency. The topic-resolution fallback chain (`skillId` → `topic` → `"sets"`) guarantees a watermark always renders, preventing broken visuals during lesson review or classroom display.
