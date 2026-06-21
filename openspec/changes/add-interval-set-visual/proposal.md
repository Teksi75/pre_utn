# Proposal: Add Interval Set Visual

## Intent

Unit 3 inequality content uses sign-analysis visuals to communicate final solution sets. This blurs two purposes: `sign-chart` explains signs, while students also need the final set on a number line. Add `interval-set` for solution graphs, aligned with ADR-007/008 in `docs/sdd/13-adr-foundation.md`.

## Scope

### In Scope
- Add `IntervalSetVisual` / `IntervalSegment` to the pedagogical visual model.
- Parse/render `kind: "interval-set"` with shared-axis unions, endpoints, infinity arrows, and root-level `notation`.
- Add initial U3 visuals for linear inequalities and absolute-value inequalities.
- Preserve finite-bound `label` for fractions while using numeric `value` for geometry.

### Out of Scope
- Do not delete or replace `SignChartVisual` globally.
- Do not auto-convert every existing `sign-chart`.
- Do not change evaluators, routes, U1/U2 interval visuals, or `DistanceOnLineVisual`.

## Capabilities

### New Capabilities
- `pedagogical-visuals`: typed, parsed, rendered math visual examples, including `interval-set` solution sets.

### Modified Capabilities
- None.

## Approach

Add a `PedagogicalVisual` variant using the approved shape: root owns `notation`/optional `setBuilderLabel`; each segment owns only `IntervalBound` endpoints and `EndpointInclusion`. Do not use `IntervalRepresentation[]` internally. Reuse parser/renderer switches and `parseOptionalVisualExamples`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/visuals/types.ts` | Modified | Add interval-set interfaces and union member. |
| `src/domain/visuals/parse.ts` | Modified | Validate notation, bounds, inclusions, segment count. |
| `src/components/math-visuals/IntervalSetVisual.tsx` | New | Render one shared number-line axis for all segments. |
| `src/components/math-visuals/PedagogicalVisualRenderer.tsx` | Modified | Route `interval-set` visuals. |
| `content/matematica/theory/unit-3.json` | Modified | Add initial U3 solution visuals. |
| `content/matematica/examples/unit-3.json` | Modified | Add initial U3 example visuals. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Notation/segment drift | Med | Parser tests and union-count validation. |
| Fraction label geometry bug | Med | Tests assert `label` display and `value` placement. |
| >400-line review | Med | Chain PRs: domain/parser, then renderer/content. |

## Decisions to Resolve

- `concept-inv-caso-menor`: keep, replace, or stack existing `distance-on-line` with `interval-set`.
- `example-inecuaciones-lineales-2`: keep `sign-chart` and add `interval-set`, or replace the existing visual.

## Rollback Plan

Remove the `interval-set` union member, parser branch, renderer/component, tests, and U3 JSON entries. Existing visuals remain valid.

## Dependencies

- Existing `IntervalBound` and `EndpointInclusion` in `src/domain/intervals/representation.ts`.

## Success Criteria

- [ ] U3 inequality solutions can render as `interval-set` visuals on one shared axis.
- [ ] Sign charts still render unchanged for sign reasoning.
- [ ] Fraction labels display as labels while geometry uses numeric values.
- [ ] Initial scope covers U3 linear and absolute-value inequalities.
