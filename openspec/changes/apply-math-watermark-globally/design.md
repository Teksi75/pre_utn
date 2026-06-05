# Design: Apply Math Watermark Globally

## 1. Context & Intent

The `editorial-math-visual-direction` change built a watermark infrastructure (`MathThemePlate`, 8 SVGs, `topic-map.ts`, `.app-watermark` CSS) but only 3 of 13 screens use it, the centering produces whitespace gaps (`viewBox 160x112` + `meet` letterboxing), and the practice flow has zero decoration. This change creates a `MathWatermark` wrapper component that standardizes positioning, opacity, and topic resolution, then applies it to all 8 page screens and 5 practice sub-phases.

The user-visible effect: every screen in the app gets a subtle, topic-aware mathematical SVG watermark behind its content. The decoration is atmospheric — felt, not read. It reinforces which mathematical domain the student is working in without competing with text or interactive elements. The home hero swaps from `EngineeringHeroVisual` to a `MathThemePlate`-based watermark with a one-line boolean revert.

## 2. Architecture Overview

### Component Tree (per screen)

```
Page / Phase Component
  └── MathWatermark (wrapper — positioning + topic resolution + opacity defaults)
        ├── MathThemePlate (absolute inset-0 — SVG renderer, aria-hidden, pointer-events-none)
        └── <children /> (relative z-10 — interactive content above watermark)
```

### Two-Layer Model

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| Low-level | `MathThemePlate` | Pure SVG renderer: viewBox, preserveAspectRatio, topic→visual switch, opacity. No positioning logic. |
| High-level | `MathWatermark` | Positioning contract (`relative isolate overflow-hidden`), topic resolution (`skillId` → `mathThemeForSkill()` → `topic` → `"sets"`), variant→opacity defaults, z-index layering, children composition. |

**Why this split**: `MathThemePlate` stays a pure presentational SVG component (testable without DOM layout concerns). `MathWatermark` owns the integration contract that 13+ screens share — one place to change positioning, opacity defaults, or topic resolution logic. Single responsibility per layer; screens call one component instead of juggling 4 props each.

### File Map

| File | Action |
|------|--------|
| `src/components/math-visuals/MathWatermark.tsx` | **Create** — wrapper component |
| `src/components/math-visuals/MathThemePlate.tsx` | Modify — viewBox, preserveAspectRatio, opacity defaults |
| `src/components/math-visuals/index.ts` | Modify — export `MathWatermark` |
| `src/components/math/__tests__/math-theme-plate.test.ts` | Modify — update viewBox assertion, add wrapper tests |
| `src/app/page.tsx` | Modify — hero swap with `USE_MATH_THEME_PLATE` flag |
| `src/app/diagnostic/page.tsx` | Modify — use `MathWatermark` wrapper |
| `src/components/diagnostic/ResultsDisplay.tsx` | Modify — dynamic topic from estimates |
| `src/app/learn/page.tsx` | Modify — add watermark |
| `src/app/learn/matematica/page.tsx` | Modify — add watermark |
| `src/app/learn/matematica/[skillId]/page.tsx` | Modify — add watermark with dynamic topic |
| `src/components/home/HomeNextStepClient.tsx` | Modify — add watermark |
| `src/components/practice/PracticeTheoryPhase.tsx` | Modify — add `skillId` prop + watermark |
| `src/components/practice/PracticeExamplePhase.tsx` | Modify — add `skillId` prop + watermark |
| `src/components/practice/PracticeExercisePhase.tsx` | Modify — add `skillId` prop + watermark |
| `src/components/practice/PracticeFeedbackPhase.tsx` | Modify — add `skillId` prop + watermark |
| `src/components/practice/PracticeRecoveryPhase.tsx` | Modify — add `skillId` prop + watermark |
| `src/app/practice/page.tsx` | Modify — pass `skillId` to phase components |

## 3. MathWatermark Wrapper Design

### TypeScript Signature

```tsx
"use client";

import type { ReactNode } from "react";
import { MathThemePlate } from "./MathThemePlate";
import { mathThemeForSkill } from "./topic-map";
import type { MathTheme, MathThemeVariant } from "./types";

interface MathWatermarkProps {
  readonly topic?: MathTheme;
  readonly skillId?: string;
  readonly variant?: MathThemeVariant;
  readonly opacity?: number;
  readonly className?: string;
  readonly children?: ReactNode;
}
```

### Topic Resolution Precedence

```
skillId provided?
  ├─ YES → mathThemeForSkill(skillId) → resolved topic
  └─ NO → topic provided?
            ├─ YES → topic (direct)
            └─ NO → "sets" (fallback)
```

`mathThemeForSkill()` already returns `MathTheme` (never `undefined`) — it falls back to `"sets"` internally via `FALLBACK_TOPIC`. So the wrapper just needs:

```ts
const resolvedTopic = skillId ? mathThemeForSkill(skillId) : (topic ?? "sets");
```

### Variant→Opacity Defaults

| Variant | Default Opacity |
|---------|----------------|
| `hero` | `0.15` |
| `background` | `0.18` |
| `card` | `0.12` |

Default variant: `"background"`.

### Positioning Contract

```tsx
// Outer container
<div className={["relative isolate overflow-hidden", className].filter(Boolean).join(" ")}>
  // Watermark layer — absolutely positioned, behind content
  <MathThemePlate
    topic={resolvedTopic}
    variant={variant ?? "background"}
    opacity={opacity ?? DEFAULT_OPACITY[variant ?? "background"]}
    className="absolute inset-0 z-0"
  />
  // Content layer — above watermark
  <div className="relative z-10">{children}</div>
</div>
```

### Server vs Client Component Decision

**Client Component** (`"use client"`). Rationale: the practice page passes `selectedSkillId` from `usePracticeFlow()` (client state via `useState`). The diagnostic results page computes topic from `estimates` (client state). Making `MathWatermark` a Server Component would force every consumer to pre-resolve the topic and pass it as a prop — which works but pushes resolution logic to 13 call sites instead of centralizing it. The component is pure presentational (no data fetching, no side effects), so Client Component has no performance cost.

### A11y Contract

- `MathThemePlate` already carries `aria-hidden="true"` on its wrapper `<div>` and `<svg>` — unchanged.
- `MathWatermark` does NOT add `aria-hidden` to its outer container — children must be announced.
- `pointer-events-none` is already on `MathThemePlate`'s wrapper div — clicks pass through.

### Composition with `.app-watermark` CSS

`MathThemePlate` already applies the `app-watermark` class internally. `MathWatermark` does not duplicate it. The CSS class handles any global watermark styling (e.g., print suppression) in one place.

## 4. Centering & Density Fix

### MathThemePlate Changes

| Property | Before | After |
|----------|--------|-------|
| `viewBox` | `"0 0 160 112"` | `"0 0 320 112"` |
| `preserveAspectRatio` | `"xMidYMid meet"` | `"xMidYMid slice"` |
| `DEFAULT_OPACITY.hero` | `0.1` | `0.15` |
| `DEFAULT_OPACITY.background` | `0.08` | `0.18` |
| `DEFAULT_OPACITY.card` | `0.12` | `0.12` (unchanged) |

**Why slice + wider viewBox**: The current `meet` mode letterboxes when the container is wider than 160:112 (~1.43:1), producing visible whitespace on left/right. The new 320:112 (~2.86:1) aspect ratio matches typical hero/background containers. `slice` fills edge-to-edge, clipping overflow equally from top/bottom rather than adding margins. The SVG decorative patterns are centered in the viewBox, so clipping only trims empty margins — core math shapes remain fully visible.

**Edge-to-edge verification targets**:
- Mobile 375px: SVG fills 375px width, height scales proportionally, clips top/bottom.
- Tablet 768px: Same behavior, no horizontal gaps.
- Desktop 1280px: Same behavior, no horizontal gaps.

### Test Migration (`math-theme-plate.test.ts`)

| Assertion | Change |
|-----------|--------|
| Line 47: `viewBox="0 0 160 112"` | → `viewBox="0 0 320 112"` |
| Line 47: (implicit) `preserveAspectRatio` | Add assertion for `"xMidYMid slice"` |
| Line 48: `opacity ?? DEFAULT_OPACITY[variant]` | Stays — the formula is unchanged, only the map values change |
| Lines 43-49: General structure | Add assertions for new opacity values: `0.15`, `0.18`, `0.12` |

## 5. Per-Screen Application Map

| Screen | File | Wrapper Placement | Topic Source | Variant | Opacity |
|--------|------|-------------------|--------------|---------|---------|
| Home hero | `src/app/page.tsx` | Inside `<section>`, wrapping the hero text `<div>` | `"sets"` (constant) | `hero` | `0.15` |
| Home roadmap | `src/components/home/HomeNextStepClient.tsx` | Inside the Zone 2 `<article>`, wrapping roadmap content | `"sets"` (constant) | `background` | `0.18` |
| Learn index | `src/app/learn/page.tsx` | Inside the main `<section>`, wrapping page content | `"sets"` (constant) | `background` | `0.18` |
| Learn matemática | `src/app/learn/matematica/page.tsx` | Inside the main container, wrapping content | `"sets"` (constant) | `background` | `0.18` |
| Learn skill detail | `src/app/learn/matematica/[skillId]/page.tsx` | Inside the main container, wrapping content | `skillId` from route params via `mathThemeForSkill()` | `background` | `0.18` |
| Diagnostic question | `src/app/diagnostic/page.tsx` | Replace current manual `MathThemePlate` + negative insets with `<MathWatermark>` wrapping the `<section>` content | `currentExercise.skillId` via `mathThemeForSkill()` | `hero` | `0.15` |
| Diagnostic results | `src/components/diagnostic/ResultsDisplay.tsx` | Replace current manual `MathThemePlate` with `<MathWatermark>` wrapping the outer `<div>` content | Weakest estimate `skillId` (see Section 8) | `hero` | `0.15` |

## 6. Per-Phase Practice Watermarks

### SkillId Flow

`usePracticeFlow()` already exposes `selectedSkillId: SkillId | null` in its return object (line 247 of `usePracticeFlow.ts`). The practice `page.tsx` already reads `flow.selectedSkillId` (line 39). The 5 phase components currently do NOT receive a `skillId` prop.

**Resolution**: Add `skillId?: string` prop to each phase component's interface. The practice page passes `skillId={flow.selectedSkillId ?? undefined}` to all 5 phase components. Each phase component passes it to `<MathWatermark skillId={skillId}>`.

This is a minimal adapter — no context, no refactoring of `usePracticeFlow`. The hook already owns the state; the page already reads it; we just thread it through as a prop.

### Phase → Variant Contract

| Phase Component | Variant | Opacity | Prop Added |
|----------------|---------|---------|------------|
| `PracticeTheoryPhase` | `background` | `0.18` | `skillId?: string` |
| `PracticeExamplePhase` | `background` | `0.18` | `skillId?: string` |
| `PracticeExercisePhase` | `card` | `0.12` | `skillId?: string` |
| `PracticeFeedbackPhase` | `card` | `0.12` | `skillId?: string` |
| `PracticeRecoveryPhase` | `background` | `0.18` | `skillId?: string` |

### View Transition Compatibility

The practice page already wraps each phase in `<ViewTransition enter="slide-up" exit="slide-down">`. The watermark is absolutely positioned (`absolute inset-0 z-0`) — it does not participate in the document flow. When a phase transition fires, the View Transition animates the content layer; the watermark swaps instantly (same absolute position, different topic/variant). No layout shift.

### When `selectedSkillId` Is Null

During the `"select"` phase, `selectedSkillId` is `null`. The select phase does NOT get a watermark (it's the skill picker). All other phases have a non-null `selectedSkillId` because `handleSkillSelect` sets it before transitioning to `"theory"`. The `skillId` prop is typed `string | undefined`; when `undefined`, `MathWatermark` falls back to `"sets"`.

## 7. Home Hero Fallback Mechanism

### Implementation

```tsx
// src/app/page.tsx — top of file, after imports
const USE_MATH_THEME_PLATE = true;

// Inside the hero <section>:
{USE_MATH_THEME_PLATE ? (
  <MathWatermark topic="sets" variant="hero" opacity={0.15} />
) : (
  <EngineeringHeroVisual />
)}
```

### Fallback Path

- `USE_MATH_THEME_PLATE = true` (default): renders `<MathWatermark>` with sets theme.
- `USE_MATH_THEME_PLATE = false`: renders `<EngineeringHeroVisual />` — the component file is untouched, the import stays, the JSX is identical to pre-change.
- One-line revert: change `true` to `false`. No other code changes needed.

### Why This Satisfies the Risk

The `EngineeringHeroVisual` component file is never modified, deleted, or refactored. The boolean flag is a compile-time constant — dead code elimination removes the unused branch in production builds. If the MathWatermark hero has visual issues, the revert is instant and produces the exact same output as before the change.

## 8. ResultsDisplay Dynamic Topic (TBD Resolution)

### Selection Signal

**Weakest estimated skill**: the `SkillEstimate` with the lowest `accuracy` value.

```ts
function resolveResultsTopic(estimates: readonly SkillEstimate[]): MathTheme {
  if (estimates.length === 0) return "sets";
  const weakest = estimates.reduce((min, est) =>
    est.accuracy < min.accuracy ? est : min
  , estimates[0]);
  return mathThemeForSkill(weakest.skillId);
}
```

### Data Flow

```
DiagnosticPage.handleAnswerSubmit()
  → estimateSkills(attempts) → SkillEstimate[]
  → setEstimates(est)
  → <ResultsDisplay estimates={estimates} ... />
    → resolveResultsTopic(estimates) → MathTheme
    → <MathWatermark topic={resolvedTopic} variant="hero" opacity={0.15} />
```

### Why This Signal

- `weakestEstimatedSkill` directly serves the pedagogical goal: the results screen highlights the area that needs the most work. When a student sees a "roots" watermark, they immediately associate the visual with their weakest domain.
- `mostRecentSkill` would be arbitrary — the last question answered isn't necessarily the weakest.
- `firstUnmasteredSkill` requires a threshold definition that doesn't exist in the current `SkillEstimate` type (it has `accuracy` but no mastery threshold).
- The `reduce` approach is O(n) with no sorting, no allocation.

### Fallback Path

When `estimates.length === 0` (diagnostic produced no estimates — edge case with empty catalog or all-unanswered), `resolveResultsTopic` returns `"sets"`. `mathThemeForSkill()` also has an internal fallback to `"sets"` for unrecognized skill IDs. Double safety net.

### TypeScript Types

```ts
// Input (existing):
interface SkillEstimate {
  readonly skillId: SkillId;  // e.g. "mat.u1.conjuntos_numericos"
  readonly accuracy: number;  // 0..1
  readonly attempts: number;
  readonly errorTags: readonly string[];
}

// Output:
type MathTheme = "sets" | "irrationals" | "powers" | "roots" | "intervals" | "absolute" | "logs" | "complex";
```

`mathThemeForSkill(skillId: string | null | undefined): MathTheme` — always returns a valid `MathTheme`, never `undefined`.

## 9. Sequence Diagrams

### A. Topic Resolution in MathWatermark

```
Page Component                MathWatermark              mathThemeForSkill         MathThemePlate
     │                             │                           │                        │
     │  skillId="conjuntos_numericos"                          │                        │
     ├────────────────────────────►│                           │                        │
     │                             │  mathThemeForSkill(       │                        │
     │                             │   "conjuntos_numericos")  │                        │
     │                             ├──────────────────────────►│                        │
     │                             │       "sets"              │                        │
     │                             │◄──────────────────────────┤                        │
     │                             │                           │                        │
     │                             │  resolvedTopic = "sets"   │                        │
     │                             │  opacity = DEFAULT_OPACITY["hero"] = 0.15           │
     │                             │                           │                        │
     │                             │  <MathThemePlate topic="sets" variant="hero"        │
     │                             │    opacity={0.15} className="absolute inset-0 z-0"> │
     │                             ├───────────────────────────────────────────────────►│
     │                             │                           │                        │
     │                             │           <svg viewBox="0 0 320 112"               │
     │                             │            preserveAspectRatio="xMidYMid slice"     │
     │                             │            aria-hidden="true">                      │
     │                             │              <SetsVisual />                         │
     │                             │            </svg>                                   │
     │                             │◄───────────────────────────────────────────────────┤
```

### B. Practice Phase Watermark Transition

```
PracticePage        usePracticeFlow      PracticeTheoryPhase    MathWatermark     PracticeExamplePhase
     │                     │                    │                    │                    │
     │  phase="theory"     │                    │                    │                    │
     │◄────────────────────│                    │                    │                    │
     │                     │                    │                    │                    │
     │  <ViewTransition>   │                    │                    │                    │
     │  <PracticeTheoryPhase                    │                    │                    │
     │    skillId={flow.selectedSkillId}>       │                    │                    │
     ├─────────────────────────────────────────►│                    │                    │
     │                     │                    │  skillId="potencias"                    │
     │                     │                    ├───────────────────►│                    │
     │                     │                    │                    │  topic="powers"     │
     │                     │                    │                    │  variant="background"│
     │                     │                    │                    │  opacity=0.18       │
     │                     │                    │  <content>         │                    │
     │                     │                    │◄───────────────────┤                    │
     │                     │                    │                    │                    │
     │  [user clicks "Ver ejemplo"]             │                    │                    │
     │  handleNextPhase() → phase="example"     │                    │                    │
     │◄────────────────────│                    │                    │                    │
     │                     │                    │                    │                    │
     │  <ViewTransition>   │                    │  [unmounts]        │                    │
     │  <PracticeExamplePhase                   │                    │                    │
     │    skillId={flow.selectedSkillId}>       │                    │                    │
     ├──────────────────────────────────────────────────────────────────────────────────►│
     │                     │                    │                    │  skillId="potencias"│
     │                     │                    │                    │◄───────────────────┤
     │                     │                    │                    │  topic="powers"     │
     │                     │                    │                    │  variant="background"│
     │                     │                    │                    │  opacity=0.18       │
```

Note: topic stays `"powers"` across theory→example (same skill). Variant stays `"background"`. The View Transition animates the content swap; the watermark is absolutely positioned and does not cause layout shift.

### C. ResultsDisplay Dynamic Topic

```
DiagnosticPage        estimateSkills()    ResultsDisplay      resolveResultsTopic()   MathWatermark
     │                      │                   │                      │                  │
     │  [last answer submitted]                  │                      │                  │
     │  estimates = estimateSkills(attempts)     │                      │                  │
     ├─────────────────────►│                   │                      │                  │
     │  SkillEstimate[]:    │                   │                      │                  │
     │   conjuntos: 0.8     │                   │                      │                  │
     │   potencias: 0.3     │                   │                      │                  │
     │   intervalos: 0.6    │                   │                      │                  │
     │◄─────────────────────┤                   │                      │                  │
     │                      │                   │                      │                  │
     │  <ResultsDisplay estimates={estimates}>  │                      │                  │
     ├─────────────────────────────────────────►│                      │                  │
     │                      │                   │  resolveResultsTopic(estimates)         │
     │                      │                   ├─────────────────────►│                  │
     │                      │                   │                      │  reduce by accuracy:
     │                      │                   │                      │  min = potencias (0.3)
     │                      │                   │                      │  mathThemeForSkill("mat.u1.potencias_raices")
     │                      │                   │       "powers"       │                  │
     │                      │                   │◄─────────────────────┤                  │
     │                      │                   │                      │                  │
     │                      │                   │  <MathWatermark topic="powers"          │
     │                      │                   │    variant="hero" opacity={0.15}>       │
     │                      │                   ├────────────────────────────────────────►│
     │                      │                   │                      │   <PowersVisual/>│
     │                      │                   │◄────────────────────────────────────────┤
```

## 10. File-Level Change Order

TDD-first where applicable. The order respects dependencies: infrastructure first, then application.

1. **RED**: Update `math-theme-plate.test.ts` — change viewBox assertion to `"0 0 320 112"`, add `preserveAspectRatio` assertion, add opacity value assertions.
2. **GREEN**: Modify `MathThemePlate.tsx` — update viewBox, preserveAspectRatio, `DEFAULT_OPACITY` map.
3. **RED**: Create test for `MathWatermark` — topic resolution precedence, variant→opacity defaults, positioning classes, aria-hidden passthrough.
4. **GREEN**: Create `MathWatermark.tsx` — implement wrapper.
5. **Export**: Update `math-visuals/index.ts` — export `MathWatermark`.
6. **Apply**: Modify `src/app/diagnostic/page.tsx` — replace manual `MathThemePlate` with `MathWatermark`.
7. **Apply**: Modify `ResultsDisplay.tsx` — add `resolveResultsTopic()`, replace hardcoded `topic="sets"`.
8. **Apply**: Modify `src/app/page.tsx` — add `USE_MATH_THEME_PLATE` flag, swap hero.
9. **Apply**: Modify `HomeNextStepClient.tsx` — add watermark to roadmap section.
10. **Apply**: Modify 3 learn pages — add watermark with appropriate topic source.
11. **Apply**: Add `skillId` prop to 5 practice phase components + wrap with `MathWatermark`.
12. **Apply**: Modify `practice/page.tsx` — pass `flow.selectedSkillId` to phase components.
13. **Verify**: Run `pnpm run test`, `pnpm run typecheck`, `pnpm run build`.

## 11. Risks & Open Questions

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `slice` clips decorative elements at container edges | Medium | SVG patterns are centered in 320-unit viewBox. Edge clipping only trims margins, not core shapes. Verify visually on 3 container widths (375px, 768px, 1280px). |
| Practice phase DOM churn on transitions | Low | Watermark is `aria-hidden` + `pointer-events-none`. View Transition handles the content swap. No layout shift since watermark is absolutely positioned. |
| `selectedSkillId` is `null` during non-select phases | Very Low | `handleSkillSelect` always sets `selectedSkillId` before transitioning to `"theory"`. The `"select"` phase (where it's null) does not get a watermark. |
| `EngineeringHeroVisual` import becomes unused when flag is `true` | Low | Tree-shaking handles this. The import is conditionally used via ternary — both branches are valid. No dead-code warning in Next.js. |
| Existing diagnostic page manual positioning (negative insets) differs from wrapper's `absolute inset-0` | Medium | The wrapper replaces the manual positioning entirely. The old `className="absolute -inset-x-24 -top-28 ..."` is removed. Visual result should be equivalent or better (edge-to-edge fill via `slice`). |

### Open Questions

- None. All TBDs are resolved. The two key decisions (ResultsDisplay signal = weakest estimate, practice skillId = prop threading from `usePracticeFlow()`) are concrete and implementable.

## 12. Pedagogy Validation

| Screen | Who Benefits | How |
|--------|-------------|-----|
| Home hero | Alumno | The sets-themed watermark creates a calm, mathematical atmosphere that signals "this is your study space" without distracting from the CTA. |
| Home roadmap | Alumno | The background watermark reinforces the learning journey context — the student sees mathematical decoration framing their progress. |
| Learn index / matemática | Alumno | Consistent visual identity across learn screens creates a sense of place — the learner knows they're in study mode. |
| Learn skill detail | Alumno | Dynamic topic (e.g., "powers" SVG when studying potencias) provides subtle contextual reinforcement of the specific domain. |
| Diagnostic question | Alumno | The watermark topic matches the current exercise's skill, creating visual coherence between the question content and its frame. |
| Diagnostic results | Alumno | The weakest-skill topic directs visual attention to the area needing work — a subtle nudge toward the recommended practice. |
| Practice phases (all 5) | Alumno | The variant rhythm (`background` for instruction, `card` for active work) helps the learner orient within the practice flow at a glance. |
| All screens | Docente | When observing a student's screen, the watermark topic provides an immediate visual cue about which mathematical domain is active — no need to read labels. |
