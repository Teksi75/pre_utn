## Exploration: add-interval-set-visual

> **Status:** Complete
> **Date:** 2026-06-20
> **Change:** `add-interval-set-visual`
> **Scope:** Add a new `interval-set` pedagogical visual kind for Unit 3 inequality solution sets. Keep `SignChartVisual` for sign reasoning; do NOT auto-convert existing visuals.
> **Depends on:** existing `IntervalBound` + `EndpointInclusion` in `src/domain/intervals/representation.ts`; existing `PedagogicalVisual` discriminated union in `src/domain/visuals/types.ts`.

---

## Recommendation (lead with the answer)

Add a third `PedagogicalVisual` variant — `interval-set` — to the existing union. The global visual owns `notation` + optional `setBuilderLabel` + `ariaLabel` (the WHOLE solution set as a single piece of info, e.g. `"[-2, 3) ∪ [5, +∞)"`). `intervals` is `readonly IntervalSegment[]`; each segment owns ONLY geometry (`lower`, `upper`, `lowerInclusion`, `upperInclusion`) using `IntervalBound` + `EndpointInclusion` from `representation.ts`. Segments do NOT carry per-segment notation or accessibility text — that lives at the visual root.

A new `IntervalSetVisual.tsx` renderer draws ONE number-line axis shared by all segments (so gaps are visible), with closed/open circles on finite endpoints, arrows on infinity sides, and the union notation rendered ONCE at the top of the figure (same place `SignChartVisual` puts its expression label).

Add `interval-set` visuals to U3 theory/examples ONLY where the visual's purpose is the final solution set: `concept-inl-resolver`, `concept-inv-caso-mayor`, and the solution steps of `example-inecuaciones-lineales-1` and `example-inecuaciones-lineales-2`. Do NOT replace `sign-chart` visuals — they answer a different question (sign reasoning vs solution graph).

---

## Current State

### Pedagogical visual contract today

The repo already has a typed `PedagogicalVisual` discriminated union (`src/domain/visuals/types.ts:104-108`):

```
PedagogicalVisual = SignChartVisual | DistanceOnLineVisual | CartesianLineVisual | SystemsOfLinesVisual
```

Wire-up path:

| Layer | File | Role |
|-------|------|------|
| Types | `src/domain/visuals/types.ts` | Pure TS union, no React. |
| Parser | `src/domain/visuals/parse.ts` | Fail-fast `kind` switch with per-kind helpers. |
| Loader | `src/domain/catalog/content-loaders.ts:260,355,405` | `parseOptionalVisualExamples` reuses the same parser for concept blocks, solution steps, and theory nodes. |
| Renderer | `src/components/math-visuals/PedagogicalVisualRenderer.tsx` | `kind` switch → per-kind `*Visual.tsx` component. |
| Wrapper | `src/components/math-visuals/PedagogicalVisualFigure.tsx` | Shared `<figure role="img"> + <title> + <desc>` accessibility envelope. |

### U3 visuals today — partial coverage

| Theory / Example | Skill | Current `visualExamples` | Gap |
|------------------|-------|--------------------------|-----|
| `concept-inl-resolver` | `mat.u3.inecuaciones_lineales` | `kind: "sign-chart"` (signs of `x-2`) | Mentions "Solución: $(-\infty, 2]$" in body but renders only sign chart — NO solution graph. |
| `concept-inl-flip` | `mat.u3.inecuaciones_lineales` | none | Mentions "x < -3" solution; no visual at all. |
| `example-inecuaciones-lineales-1` step 3 | `mat.u3.inecuaciones_lineales` | none | "Solución: $[4, +\infty)$" — no visual. |
| `example-inecuaciones-lineales-2` step 3 | `mat.u3.inecuaciones_lineales` | `kind: "sign-chart"` (signs of `-2x-6`) | Mentions "Solución: $(-\infty, -3)$" in same step — solution is implicit in sign chart. |
| `concept-inv-caso-menor` | `mat.u3.inecuaciones_valor_absoluto` | `kind: "distance-on-line"` | Geometric distance visual — correct for the $|x-a|<c$ case. |
| `concept-inv-caso-mayor` | `mat.u3.inecuaciones_valor_absoluto` | none | "Solución: $(-\infty, -3) \cup (7, \infty)$" — NO visual; the ONLY place a disjunction-shaped solution exists today. |
| `example-inecuaciones-valor-absoluto-1` step 4 | `mat.u3.inecuaciones_valor_absoluto` | `kind: "distance-on-line"` | Geometric; solution `(-3, 7)` is implicit. |
| `example-inecuaciones-valor-absoluto-2` step 4 | `mat.u3.inecuaciones_valor_absoluto` | `kind: "distance-on-line"` (data line — see `examples/unit-3.json:196-206`) | Center `-0.5`, distance `1.5`, `≥` → TWO RAYS. The distance-on-line visual currently draws this with two separated segments; a disjoint ray pair (e.g. `|2x+1| ≥ 3` final answer `(−∞, −2] ∪ [1, +∞)`) would benefit from an explicit interval-union visual. |

### Existing interval number-line primitives (DO NOT reinvent)

| Component | File | Domain model | Coverage |
|-----------|------|--------------|----------|
| `IntervalNumberLine` | `src/components/practice/IntervalNumberLine.tsx` | `IntervalRepresentation` (`representation.ts`) | Bounded, ray w/ arrow, open/closed endpoints, infinity labels. Layout via `computeIntervalSvgLayout` (pure). 1 visual = 1 segment. |
| `NumberLineInterval` | `src/components/math/NumberLineInterval.tsx` | `IntervalModel` (`index.ts`) | Legacy, same single-segment scope. Used in `TheoryCard.intervalVisuals` slot. |

**Neither renders a union of disjoint segments on a shared axis.** The new visual must.

### Existing interval domain primitives (REUSE)

| Type | File | Notes |
|------|------|-------|
| `IntervalBound = { kind: "finite", value, label? } \| { kind: "infinity", direction }` | `src/domain/intervals/representation.ts:13-15` | `label?` already exists for fraction display (`-5/2`, `7/2`); `value` drives geometry. Matches user-approved spec exactly. |
| `EndpointInclusion = "open" \| "closed"` | `src/domain/intervals/representation.ts:18` | Reuse as-is. |
| `validateIntervalRepresentation`, `formatIntervalRepresentation`, `generateAriaLabel` | `src/domain/intervals/representation.ts:44-145` | Single-segment helpers. NOT applicable to unions — must be replaced by a new union-aware formatter. |

---

## Affected Areas

| Area | Action | Why |
|------|--------|-----|
| `src/domain/visuals/types.ts` | **Modify** | Add `IntervalSetVisual` + `IntervalSegment` interfaces; extend `PedagogicalVisual` union. Pure TS, no React. |
| `src/domain/visuals/parse.ts` | **Modify** | Add `intervalSet()` parser case (segment-bound + segment-inclusion + union-notation normalization); extend `parsePedagogicalVisual` switch. |
| `src/domain/visuals/__tests__/parse.test.ts` | **Modify** | Add parser tests mirroring the `sign-chart` test set: valid, missing `notation`, missing `intervals`, finite bound without value, infinity on lower, duplicates, segments out of order, etc. |
| `src/domain/visuals/__tests__/helpers.ts` | **Modify** | Add `assertIntervalSet(visual)` discriminated-union narrowing helper. |
| `src/components/math-visuals/IntervalSetVisual.tsx` | **Create** | New SVG component. Shares axis across all segments; closed/open circles on finite endpoints; arrows on infinity sides; ONE `<text>` with the union notation at the top. Reuse the styling tokens (`var(--color-accent-600)`, `var(--color-brand-400)`) established by `SignChartVisual.tsx` and `DistanceOnLineVisual.tsx`. |
| `src/components/math-visuals/PedagogicalVisualRenderer.tsx` | **Modify** | Add `case "interval-set"` → `IntervalSetVisual`. |
| `src/components/math-visuals/__tests__/PedagogicalVisualRenderer.test.tsx` | **Modify** | Add a `interval-set` describe block: basic render, union of 2 segments, union with infinity arrow on each side, fraction label rendering, default-unknown-kind still throws. |
| `content/matematica/theory/unit-3.json` | **Modify** | Add `interval-set` to `concept-inl-resolver` (shows `(-∞, 2]` solution next to the existing sign chart — ADDS, does not replace). Add a new `concept-inv-caso-mayor` visual with `kind: "interval-set"` (fills the gap — disjoint union `(−∞, −3) ∪ (7, +∞)`). Optionally add to `concept-inl-flip`. |
| `content/matematica/examples/unit-3.json` | **Modify** | Add `interval-set` to `example-inecuaciones-lineales-1` step 3 (the solution step) and `example-inecuaciones-lineales-2` step 3 (replace the existing `sign-chart` with BOTH: keep sign chart for reasoning + add `interval-set` for the solution graph, OR keep only the interval-set per user constraint "add, do not replace"). |

**Out of scope** (do NOT touch in this change):

- `SignChartVisual.tsx` — stays exactly as-is for sign reasoning.
- `DistanceOnLineVisual.tsx` — stays for the geometric `$|x-a| \lessgtr c$` view (the user's U3 frame for `concept-inv-caso-menor`).
- `IntervalNumberLine.tsx` / `NumberLineInterval.tsx` — stay for the U1 single-interval `intervalVisuals` / `intervalRepresentations` slots.
- New evaluators, new exercise types, new routes.
- U1 / U2 visuals — none of the U3-style solution unions apply to U1/U2 skills.

---

## Approaches

### A. Add `IntervalSetVisual` to the existing union (RECOMMENDED)

Follow the exact pattern already established by `SignChartVisual` + `DistanceOnLineVisual`:

- New interfaces in `src/domain/visuals/types.ts`:
  ```ts
  interface IntervalSegment {
    readonly lower: IntervalBound;
    readonly upper: IntervalBound;
    readonly lowerInclusion: EndpointInclusion;
    readonly upperInclusion: EndpointInclusion;
  }
  interface IntervalSetVisual extends VisualBase {
    readonly kind: "interval-set";
    readonly notation: string;                    // e.g. "(-∞, 2] ∪ [4, +∞)"
    readonly setBuilderLabel?: string;            // e.g. "{x ∈ ℝ | x ≤ 2 o x ≥ 4}"
    readonly intervals: readonly IntervalSegment[];
  }
  ```
- Parser case in `src/domain/visuals/parse.ts` (kind switch + helpers). Reuses `IntervalBound` + `EndpointInclusion` from `representation.ts`.
- Renderer `IntervalSetVisual.tsx`: shared axis, one `<line>` per segment, closed/open circles on finite bounds, arrow markers on infinity sides, ONE `<text>` for the union notation.

- **Pros**: Mirrors the existing `PedagogicalVisual` pattern exactly (1 kind added, switch grows by 1 case). Domain stays DRY (no duplicate per-segment notation). Single visual per solution set preserves the mental model ("this is THE solution"). AGENTS.md TDD rule trivially satisfied (parser tests first, renderer second, content third).
- **Cons**: New SVG component (~80-120 lines) + parser (~60-80 lines) + tests (~100-150 lines). Above the 400-line budget → 2 chained PRs expected.
- **Effort**: Medium.

### B. Stack multiple `IntervalNumberLine` instances vertically (REJECTED)

Reuse the existing `IntervalNumberLine` (single-segment) per segment, stacked.

- **Pros**: No new SVG code; reuses existing accessibility-tested renderer.
- **Cons**: Loses the topological information that defines a union — gaps between segments become invisible because each segment gets its OWN axis with its OWN padding. Notation `[a,b) ∪ [c,d)` must be reconstructed from per-segment headers, but `IntervalNumberLine` doesn't expose `notation` as input — it derives it from `formatIntervalRepresentation`. Violates the "global visual owns notation" design rule. Pedagogically wrong: "the solution is ONE thing" is the point.
- **Effort**: Low for code, but requires reverting the user-approved `IntervalSetVisual` shape. Not viable.

### C. Replace `SignChartVisual` for inequation content (REJECTED)

Promote `interval-set` and remove `sign-chart` from U3 inequation theory/examples.

- **Pros**: Cleaner mental model — only one number-line visual exists per concept.
- **Cons**: Loses the sign-reasoning visual that U3 students use to construct the solution. Sign chart shows WHERE the expression is positive / negative; interval set shows WHERE the inequality is satisfied. These answer different pedagogical questions (see AGENTS.md pedagogy criterion). The user's brief explicitly says "do not automatically convert every sign-chart."
- **Effort**: Low but pedagogically wrong; explicitly out of scope per the user's instructions.

### D. Use `IntervalRepresentation[]` as the per-segment type (REJECTED)

Adopt the `IntervalRepresentation` shape (which already has `notation`, `setBuilderLabel`, `ariaLabel`) as the segment type. The visual just owns `intervals: readonly IntervalRepresentation[]`.

- **Pros**: Reuses the richest existing interval domain type; `validateIntervalRepresentation` + `formatIntervalRepresentation` already work.
- **Cons**: Duplicates per-segment notation (`"[a, b)"`, `setBuilderLabel`, `ariaLabel`) that doesn't apply to a union. Forces every segment to carry a single-segment notation that the renderer must then ignore. The user explicitly rejected this in the brief: "Do NOT model this as `IntervalRepresentation[]`; the global visual owns notation/accessibility, segments own only geometry."
- **Effort**: Low for code but violates the approved contract. Not viable.

---

## Risk assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Notation/segments drift**: the JSON `notation` string may disagree with the rendered segments (e.g. `"[a,b) ∪ [c,d]"` but only one segment provided). | High | Parser MUST cross-check the count of segments vs the number of comma-separated chunks in `notation` (best-effort: count `∪`/`\cup` separators + 1 vs `intervals.length`). Reject on mismatch with a clear error referencing both fields. |
| **Fraction label geometry mismatch**: `value: -2.5` paired with `label: "-5/2"` — the renderer must use `label` for display and `value` for axis placement. | Medium | Add a TDD test: `"(-∞, -5/2] ∪ [7/2, +∞)"` segment renders the label exactly while the circle sits at the right pixel. Mirror the pattern already used in `IntervalNumberLine.tsx` (`tick.label`). |
| **400-line review budget**: new renderer + parser + tests + content ≈ 400-500 lines. | Medium | Forecast 2 chained PRs in `sdd-tasks`: (1) types + parser + tests in `src/domain/visuals/`; (2) renderer + renderer tests + U3 content updates. Per `sdd-phase-common.md §E`. |
| **GGA bypass on Windows** (precedent in STATUS.json). | Medium | STATUS.json precedent: orchestrator runs GGA on Linux for adversarial review; document in PR-2 verify step. |
| **Disjoint-segment layout collapse**: when both segments share the axis, padding may collide with infinity arrows. | Medium | Reuse the existing `computeIntervalSvgLayout` per segment AND compute a UNION-wide `[min, max]` so all segments share one domain. Add a regression test for a 2-segment union where the gap is wider than the segments. |
| **Infinities on both sides** (`(-∞, +∞)` is the whole real line): degenerate single-segment case. | Low | Allow it: parser accepts, renderer draws a single axis-wide accent line with no endpoint circles. Add a test. |
| **Cross-PC work conflicts** (AGENTS.md multi-PC note). | Medium | Single feature branch + `STATUS.json` registration per AGENTS.md branch-management rule. |
| **U3 regression** on existing `visualExamples` parsing. | Low | The change is additive on the parser switch and on the union. U1/U2 visuals pass through unchanged. The existing `parsePedagogicalVisual` "unknown kind" test (line 333 of `parse.test.ts`) still works because new kind is added to the switch. |

---

## Ready for Proposal

**Yes.** The scope is well-bounded, the data shape is user-approved (Observation #2161), and the wire-up path is fully traced through the existing `PedagogicalVisual` infrastructure.

The orchestrator should:

1. Run `sdd-propose` to write `openspec/changes/add-interval-set-visual/proposal.md` referencing this exploration.
2. Pass `auto-forecast` + `feature-branch-chain` (likely 2 PRs: domain+tests → renderer+content).
3. Reuse the existing `parseOptionalVisualExamples` contract — no schema changes to `TheoryNode` / `ConceptBlock` / `SolutionStep` are needed (the `visualExamples: readonly PedagogicalVisual[]` slot already accepts any new kind in the union).
4. Confirm with the user whether `concept-inv-caso-menor` should keep the existing `distance-on-line` visual, replace it with `interval-set`, or show both stacked (since the geometric and set-builder views answer related-but-different questions for $|x-a|<c$).
5. Confirm with the user whether `example-inecuaciones-lineales-2` step 3 should keep the existing `sign-chart` AND add an `interval-set` (recommended for full pedagogical coverage), or replace it.

---

## Artifacts

- OpenSpec: `openspec/changes/add-interval-set-visual/exploration.md` (this file)
- Engram: `sdd/add-interval-set-visual/explore` (saved on completion)

## Related prior artifacts (informational)

- `openspec/changes/implement-unit-3-mathematics/exploration.md` — context for U3 visuals gap (mentioned but did not add `interval-set`).
- Engram #2100 (`U3 pedagogical visualizations exploration`) — broader exploration that flagged the solution-graph gap; this change is the focused fix for the `interval-set` part of that gap.
- Engram #2161 (`Refined U3 interval-set model`) — user-approved decision on the `IntervalSetVisual` + `IntervalSegment` shape (no `IntervalRepresentation[]` duplication, `IntervalBound` + `EndpointInclusion` reused, fraction labels via `value` + `label`).