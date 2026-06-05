# Exploration: Apply Math Watermark Globally

## Current State

The `editorial-math-visual-direction` change (archived 2026-06-04) built the infrastructure: `MathThemePlate` component, 8 topic SVGs, `EngineeringHeroVisual`, `topic-map.ts`, `.app-watermark` CSS class. However, the watermark system is only partially applied and has a centering problem.

### Placement audit — which screens have decoration, which don't

| Screen | File | Has watermark? | Notes |
|--------|------|----------------|-------|
| Home hero | `src/app/page.tsx` | Yes — `EngineeringHeroVisual` | Custom SVG, not `MathThemePlate`. Uses `opacity-20`, `w-[62%]`, right-aligned. |
| Home zones 2–3 | `src/components/home/HomeNextStepClient.tsx` | No | No watermark on roadmap or study plan sections. |
| Diagnostic question | `src/app/diagnostic/page.tsx` | Yes — `MathThemePlate` | `variant="hero"`, `opacity={0.2}`, manually oversized with negative insets. |
| Diagnostic results | `src/components/diagnostic/ResultsDisplay.tsx` | Yes — `MathThemePlate` | `topic="sets"` (hardcoded), `variant="hero"`, `opacity={0.18}`. |
| Learn index | `src/app/learn/page.tsx` | No | No decoration at all. |
| Learn matemática | `src/app/learn/matematica/page.tsx` | No | No decoration at all. |
| Learn skill detail | `src/app/learn/matematica/[skillId]/page.tsx` | No | No decoration at all. |
| Practice select | `src/components/practice/PracticeSelectPhase.tsx` | No | No watermark. |
| Practice theory | `src/components/practice/PracticeTheoryPhase.tsx` | No | No watermark. |
| Practice example | `src/components/practice/PracticeExamplePhase.tsx` | No | No watermark. |
| Practice exercise | `src/components/practice/PracticeExercisePhase.tsx` | No | No watermark. |
| Practice feedback | `src/components/practice/PracticeFeedbackPhase.tsx` | No | No watermark. |
| Practice recovery | `src/components/practice/PracticeRecoveryPhase.tsx` | No | No watermark. |

**Summary**: 3 of 13 screens have watermarks. The practice flow (5 sub-phases) and learn flow (3 screens) have zero decoration.

### Centering analysis

Current `MathThemePlate` uses:
- `viewBox="0 0 160 112"` — narrow aspect ratio
- `preserveAspectRatio="xMidYMid meet"` — letterboxes (adds whitespace) when container is wider than 160:112

This produces visible centering gaps on wide containers (hero sections, full-width backgrounds). The decorative content sits centered with blank margins on left/right.

The proposed fix:
- Widen viewBox to `"0 0 320 112"` — wider aspect ratio matches typical containers
- Change to `preserveAspectRatio="xMidYMid slice"` — fills edge-to-edge, clips overflow
- Rebalance opacity: hero `~0.15`, background `~0.18`, card `~0.12`

### Architecture options compared

**Option A: Wrapper component (`MathWatermark`)**
Create a `MathWatermark` wrapper that handles positioning, opacity, and topic resolution. Each screen wraps its content in `<MathWatermark>`. MathThemePlate stays as the internal SVG renderer.

- Pros: Single API contract, consistent behavior, screens don't need to know about positioning
- Cons: New component to maintain, wrapper indirection

**Option B: Direct MathThemePlate usage per screen**
Each screen directly imports and positions `MathThemePlate` with explicit props. No wrapper.

- Pros: No new component, explicit control per screen
- Cons: Duplicated positioning logic across 8+ screens, easy to get opacity/sizing wrong, no contract enforcement

**Option C: Layout-level watermark via CSS/globals**
Apply watermarks via CSS classes or layout wrappers at the route level.

- Pros: Least code, automatic coverage
- Cons: Can't vary topic per section, can't do per-phase watermarks in practice, too coarse

**Recommendation**: Option A. The wrapper provides a single contract for positioning, opacity defaults, and topic resolution. It reduces per-screen boilerplate and makes the per-phase practice contract clean (each phase wraps itself).

## Affected Areas

From commit `149c096` baseline (26 source files):
- `src/app/page.tsx` — hero visual swap
- `src/app/diagnostic/page.tsx` — watermark application
- `src/app/globals.css` — viewBox/opacity CSS
- `src/components/math-visuals/MathThemePlate.tsx` — viewBox/opacity changes
- `src/components/math-visuals/index.ts` — export updates
- `src/components/math-visuals/topic-map.ts` — no changes needed
- `src/components/math-visuals/types.ts` — no changes needed
- `src/components/math/MathThemePlate.tsx` — re-export (may need update)
- `src/components/math/__tests__/math-theme-plate.test.ts` — test updates for viewBox/opacity
- `src/components/diagnostic/DiagnosticQuestion.tsx` — watermark integration
- `src/components/diagnostic/ResultsDisplay.tsx` — topic resolution fix
- 5 practice phase components — watermark addition
- 3 learn pages — watermark addition (lower priority)

## Risks

1. **Test breakage**: The 67-line test file asserts `viewBox="0 0 160 112"` on line 47. Changing viewBox breaks this test.
2. **Slice clipping**: `slice` mode clips SVG content at container edges. Decorative elements near edges may be partially visible.
3. **DOM changes in practice**: Adding watermarks to each practice phase means the DOM structure changes on every phase transition.
4. **EngineeringHeroVisual fallback**: Must remain importable and visually correct for revert.

## Ready for Proposal

**Yes** — the infrastructure exists, the scope is clear, and the user has made explicit decisions on the 3 key questions (hero swap, centering fix, per-phase practice).
