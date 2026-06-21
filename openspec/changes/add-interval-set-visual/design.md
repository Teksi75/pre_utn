# Design: Add Interval Set Visual

## Technical Approach

Add `interval-set` as an additive `PedagogicalVisual` variant. Domain stays pure in `src/domain/visuals/`: types define the contract, parser validates JSON content, and layout computes finite SVG coordinates. React only renders the parsed model through the existing `PedagogicalVisualRenderer` and `PedagogicalVisualFigure` path.

## Architecture Decisions

| Topic | Choice | Alternatives considered | Rationale |
|------|--------|--------------------------|-----------|
| Model shape | Root `IntervalSetVisual` owns `notation`, optional `setBuilderLabel`, `ariaLabel`, `description`; `IntervalSegment[]` owns only geometry. | `IntervalRepresentation[]` per segment. | A union is one solution set; per-segment notation/accessibility duplicates and can drift. |
| Bounds | Reuse `IntervalBound` and `EndpointInclusion` from `src/domain/intervals/representation.ts`. | New visual-specific bound types. | Existing primitives already encode finite labels, infinity direction, and open/closed endpoints. |
| Layout | Add pure union-aware helpers to `src/domain/visuals/layout.ts`. | Compute coordinates inside React. | Keeps geometry testable, domain-pure, and safe from `NaN`/`Infinity`. |
| Rendering | New static SVG component, no hooks/effects. | Reuse stacked `IntervalNumberLine`. | One shared axis is required to show gaps/disjoint unions; static SVG follows current renderer pattern and avoids client overhead. |
| Content | Keep `sign-chart` for sign reasoning; add `interval-set` where final solution is shown. | Replace sign charts globally. | Sign charts explain signs; interval sets show answer topology. Both have different pedagogical jobs. |

## Data Flow

```text
content JSON → parseOptionalVisualExamples → parsePedagogicalVisual
  → IntervalSetVisual domain object → PedagogicalVisualRenderer
  → IntervalSetVisual.tsx → PedagogicalVisualFigure SVG
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/visuals/types.ts` | Modify | Add `IntervalSegment` and `IntervalSetVisual`; extend union. |
| `src/domain/visuals/parse.ts` | Modify | Parse `interval-set`; validate non-empty intervals, infinity directions, infinity-open inclusions, finite value/label, finite bound ordering, and best-effort notation union count drift. |
| `src/domain/visuals/layout.ts` | Modify | Add `computeIntervalSetLayout()` with union-wide finite domain, padding, safe scale, ticks, and finite coordinates for rays. |
| `src/components/math-visuals/IntervalSetVisual.tsx` | Create | Render notation, optional set-builder label, shared axis, arrows, ticks/labels, hatching/sombreado, rays, bounded segments, and endpoints. |
| `src/components/math-visuals/PedagogicalVisualRenderer.tsx` | Modify | Route `kind: "interval-set"`. |
| Tests under `src/domain/visuals` and `src/components/math-visuals` | Modify | Parser/layout/render contract coverage. |
| `content/matematica/theory/unit-3.json` | Modify | Add final-solution interval visuals to U3 theory. |
| `content/matematica/examples/unit-3.json` | Modify | Add final-solution interval visuals to U3 examples. |

## Interfaces / Contracts

```ts
export interface IntervalSegment {
  readonly lower: IntervalBound;
  readonly upper: IntervalBound;
  readonly lowerInclusion: EndpointInclusion;
  readonly upperInclusion: EndpointInclusion;
}

export interface IntervalSetVisual extends VisualBase {
  readonly kind: "interval-set";
  readonly notation: string;
  readonly setBuilderLabel?: string;
  readonly intervals: readonly IntervalSegment[];
}
```

Parser rules: lower infinity must be `negative`; upper infinity must be `positive`; infinity endpoints must be open; finite values must be finite numbers; finite labels, when present, must be non-empty strings; finite lower must be `<=` finite upper; `intervals.length` should equal `notation` union parts counted by `∪`, `\\cup`, or ` U `.

Renderer selectors: `data-interval-region`, `data-interval-side`, `data-endpoint`, and `data-hatching`. Accessibility remains via `role="img"`, `aria-label`, `<title>`, `<desc>` from `PedagogicalVisualFigure`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Parser validation and narrowing helper. | Extend `parse.test.ts` and `helpers.ts`; include invalid infinity, labels, ordering, empty intervals, and notation drift. |
| Unit | Layout safety. | Test union-wide finite domain, fraction label ticks, all-infinite rays, and no non-finite coordinates. |
| Render | SVG contract. | `renderToStaticMarkup` tests for responsive SVG, arrows, hatching, open/closed endpoints, labels, accessibility, and stable data attributes. |
| Content | U3 regression. | Extend U3 content-loader/regression tests so added visuals parse in theory/examples. |

## Migration / Rollout

No data migration required. Delivery should be chained under the 400-line budget: PR 1 domain/parser/layout/tests; PR 2 renderer/render tests/U3 content. Forecast risk: Medium; chained PRs recommended: Yes.

## Content Strategy

Add interval sets for final answers: `concept-inl-resolver` `(-∞, 2]`; `example-inecuaciones-lineales-1` `[4, +∞)`; `example-inecuaciones-lineales-2` `(-∞, -3)` while keeping its sign chart; `concept-inv-caso-mayor` `(-∞, -3) ∪ (7, +∞)`; and `example-inecuaciones-valor-absoluto-2` `(-∞, -2] ∪ [1, +∞)`. Keep `concept-inv-caso-menor` as `distance-on-line` unless a later content task decides to add an interval-set too.

## Open Questions

- [ ] None blocking. The only optional content choice is whether to also add `interval-set` to `concept-inv-caso-menor`; default is no for this change.
