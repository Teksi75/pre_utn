# Visual design — pedagogical math visuals

> **Scope:** U3+ inequality and equation visuals.  
> **Anchors:** ADR-007 (enfoque pedagógico dual), ADR-008 (SDD + TDD + ENGRAM + GGA).

## Visual kinds and their pedagogical job

| Kind | Purpose | When to use |
|------|---------|-------------|
| `sign-chart` | Explain the sign of an expression across regions. | Show *why* an inequality direction holds, where the expression is positive/negative, and which critical points are roots vs. excluded. |
| `distance-on-line` | Interpret `|x - a| op c` as distance on the number line. | Build intuition for absolute-value inequalities before writing the interval answer. |
| `interval-set` | Show the final solution set as one or more intervals on a shared number line. | Communicate the *answer topology* after all algebra is done. |

## Rule: keep the reasoning visual and the answer visual separate

- A `sign-chart` may appear next to an `interval-set` for the same inequality.
- Do **not** replace a `sign-chart` with an `interval-set` when the pedagogical goal is to explain signs.
- Do **not** add a `sign-chart` where the only message is the final solution set.
- `distance-on-line` can coexist with `interval-set` for absolute-value cases: distance builds meaning, interval-set states the answer.

## `interval-set` content rules

- Root fields own `notation`, optional `setBuilderLabel`, accessibility text.
- Each `IntervalSegment` owns only endpoints (`lower`, `upper`) and inclusions (`lowerInclusion`, `upperInclusion`).
- Geometry uses numeric `value`; displayed text may use `label` for fractions such as `-5/2` or `7/2`.
- Notation union count (`∪`, `\cup`, ` U `) must match the number of segments.

## Examples in Unit 3

- `concept-inl-resolver`: `sign-chart` for `x - 2` plus `interval-set` for `(-∞, 2]`.
- `example-inecuaciones-lineales-2`: keeps the `sign-chart` for `-2x - 6` and adds `interval-set` for `(-∞, -3)`.
- `example-inecuaciones-valor-absoluto-2`: keeps `distance-on-line` for `|x + 0,5| ≥ 1,5` and adds `interval-set` for `(-∞, -2] ∪ [1, +∞)`.
