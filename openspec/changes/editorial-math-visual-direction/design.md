# Design: Editorial Math Visual Direction

## Technical Approach

Use a token-first UI redesign: update `globals.css` warm-neutral tokens, then restyle existing App Router pages and UI components through current Tailwind v4 CSS-variable patterns. Add one reusable decorative component, `MathThemePlate`, as pure SVG/CSS with explicit `topic` and `variant` props. Domain modules remain untouched; all changes stay in `src/app/`, `src/components/`, and metadata/UI copy.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Design system foundation | Replace blue-slate token values in `globals.css`, preserving variable names where possible | Per-component restyle only | Cascades through existing `Card`, `Button`, links, and badges with less churn and consistent review surface. |
| Math decoration API | `MathThemePlate({ topic, variant, className })` with static pattern map | One-off inline SVGs in pages | Keeps SVGs reusable, testable, dependency-free, and avoids hidden page-specific decoration logic. |
| Variants | String variants: `hero`, `background`, `card` | Multiple boolean props | Explicit variants avoid impossible combinations and follow existing component simplicity. |
| Diagnostic option layout | Apply grid only to multiple-choice fieldset/options | Change shared option label styles globally | Fixes math option stacking without affecting true/false or text answer flows. |
| Rebrand boundary | Public UI/metadata says `Ingenium`; docs/specs may retain historical references | Global repo rename | Requirement is public UI only; docs preserve project context and traceability. |

## Data Flow

Visual-only flow; domain/evaluator behavior is unchanged.

```text
globals.css tokens ──→ Card/Button/Nav/page utility classes
        │
        └──→ MathThemePlate ──→ Home / Diagnostic shell / Question card

DiagnosticPage state ──→ DiagnosticQuestion ──→ ExerciseCard + ExerciseAnswerInput
                                              └── multiple-choice grid layout
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/app/globals.css` | Modify | Warm-neutral palette, editorial surfaces, larger card radius, refined shadows/focus/motion tokens. |
| `src/components/math/MathThemePlate.tsx` | Create | Pure decorative SVG/CSS component for `sets`, `irrationals`, `powers`, `roots`, `intervals`, `absolute`, `logs`, `complex`; variants `hero/background/card`; `aria-hidden`. |
| `src/app/layout.tsx` | Modify | Metadata rebrand and discrete footer disclaimer; keep skip link and landmarks. |
| `src/components/Nav.tsx` | Modify | Brand `Ingenium`, editorial nav styling, preserve `aria-current`. |
| `src/app/page.tsx` | Modify | Sober editorial home layout using MathThemePlate and existing `HomeNextStepClient`. |
| `src/app/diagnostic/page.tsx` | Modify | Editorial loading/error/question/results shell; spinner must respect reduced motion via global CSS. |
| `src/components/diagnostic/DiagnosticQuestion.tsx` | Modify | Add question header/progress treatment and optional MathThemePlate background; keep `ExerciseAnswerInput` contract. |
| `src/components/diagnostic/ResultsDisplay.tsx` | Modify | Restyle result surfaces and CTA cards; no result computation changes. |
| `src/components/exercises/ExerciseAnswerInput.tsx` | Modify | Multiple-choice fieldset becomes `grid grid-cols-1 sm:grid-cols-2`; option text gets `min-w-0`/inline math-friendly wrapping. |
| `src/components/ui/Card.tsx`, `src/components/ui/Button.tsx` | Modify | Tune variants against new tokens, preserving public props. |
| `src/components/home/*` | Modify | Restyle hero, roadmap, and plan cards without domain changes. |

## Interfaces / Contracts

```ts
export type MathThemeTopic =
  | "sets" | "irrationals" | "powers" | "roots"
  | "intervals" | "absolute" | "logs" | "complex";

export type MathThemeVariant = "hero" | "background" | "card";

export interface MathThemePlateProps {
  readonly topic: MathThemeTopic;
  readonly variant?: MathThemeVariant;
  readonly className?: string;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `MathThemePlate` topic/variant class selection if logic is non-trivial | Vitest with React-independent helper or snapshot-light assertions. |
| Component | Multiple-choice layout keeps radio labels clickable and true/false/text unchanged | Existing answer input tests plus class/role assertions. |
| Accessibility | Contrast, labels, focus-visible, skip link, `aria-current`, reduced motion | Manual/GGA pass plus grep for `transition-all`, `outline-none`, public `Pre UTN`/institutional copy. |
| Build | TypeScript and Next compile | `pnpm run test`, `pnpm run typecheck`, `pnpm run build`. |

## Migration / Rollout

No migration required. This is a visual/public-copy change with no persisted data shape changes and no new dependencies.

## Open Questions

- [ ] Confirm final disclaimer wording before implementation if product wants legal precision; otherwise use a short neutral independent-program disclaimer.
