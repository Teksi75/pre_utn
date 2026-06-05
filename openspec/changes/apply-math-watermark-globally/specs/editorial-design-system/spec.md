# Delta for editorial-design-system

## Purpose

Updates the `MathThemePlate` component's viewBox, preserveAspectRatio, and default opacity values for edge-to-edge rendering with balanced visual density. Also updates corresponding test assertions.

## MODIFIED Requirements

#### MODIFIED: MathThemePlate viewBox and preserveAspectRatio

The `MathThemePlate` component's root `<svg>` viewBox SHALL change from `"0 0 160 112"` to `"0 0 320 112"`. The `preserveAspectRatio` SHALL change from `"xMidYMid meet"` to `"xMidYMid slice"`. All 8 SVG theme files remain unchanged — only the container attributes are modified.

(Previously: `viewBox="0 0 160 112"` with `preserveAspectRatio="xMidYMid meet"`, producing a centered 160-unit-wide decoration with letterbox gaps on wider containers.)

#### Scenario: viewBox is 320×112 in rendered output

- GIVEN `MathThemePlate` renders with any topic and variant
- WHEN the DOM is inspected
- THEN the root `<svg>` element has `viewBox="0 0 320 112"` and `preserveAspectRatio="xMidYMid slice"`

#### MODIFIED: Default opacity values rebalanced

The variant-to-opacity mapping in `MathThemePlate` SHALL be: `hero` → `0.15` (was `0.25`), `background` → `0.18` (was `0.25`), `card` → `0.12` (was `0.20`). All three defaults are lower, creating a more restrained watermark that recedes behind content.

(Previously: all three variants defaulted to higher opacities — `hero` 0.25, `background` 0.25, `card` 0.20 — which created a watermark that competed with text readability.)

#### Scenario: hero renders at 0.15 opacity

- GIVEN `MathThemePlate variant="hero"` with no `opacity` prop
- WHEN the component renders
- THEN the visible opacity is `0.15`

#### Scenario: card renders at 0.12 opacity

- GIVEN `MathThemePlate variant="card"` with no `opacity` prop
- WHEN the component renders
- THEN the visible opacity is `0.12`

#### MODIFIED: Test assertions updated for new viewBox and opacity

The existing test file `src/components/math/__tests__/math-theme-plate.test.ts` SHALL have its assertions updated. The assertion that checks `viewBox="0 0 160 112"` SHALL assert `viewBox="0 0 320 112"`. Any assertions referencing the old opacity defaults SHALL assert the new values (`0.15`, `0.18`, `0.12`).

(Previously: test asserted the old viewBox `"0 0 160 112"` and old opacity values `0.25`, `0.25`, `0.20`.)

#### Scenario: test passes with new viewBox

- GIVEN the `MathThemePlate` source uses `viewBox="0 0 320 112"`
- WHEN `pnpm run test` executes
- THEN the assertion in `math-theme-plate.test.ts` expects `"0 0 320 112"` and passes

#### Scenario: test passes with new opacity defaults

- GIVEN the component defaults to hero `0.15`
- WHEN the corresponding test renders `MathThemePlate variant="hero"` without `opacity`
- THEN the assertion expects `0.15` and passes

## Pedagogical Impact

- **Alumno**: The slice-based fill removes the visual jarring of a centered decoration floating in whitespace, creating a calmer reading environment. Reduced opacities ensure text remains the primary focus — the watermark is felt, not read.
- **Docente**: The updated test assertions serve as a contract: any future viewBox or opacity change must pass the same suite, protecting against accidental visual regressions that could distract students during assessment or practice.
