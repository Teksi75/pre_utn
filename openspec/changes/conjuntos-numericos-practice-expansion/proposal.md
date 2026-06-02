# Proposal: Conjuntos Numericos Practice Expansion

## Intent

Expand `mat.u1.conjuntos_numericos` from 5 exercises to a robust ≥40-item practice set. Current practice is too thin, all multiple-choice, difficulty 1–2, has gaps in decimals and inclusion maps, weak feedback coverage, and a root-render bug where literal `√` appears outside KaTeX delimiters. Aligns with ADR-006 (pedagogically transformed practice) and ADR-007 (student + teacher value).

## Scope

### In Scope
- Add ≥40 exercises for this skill with gradual difficulty and varied supported types.
- Fix root rendering in existing exercises 4 and 5; all math uses `$...$` + LaTeX/KaTeX (`\sqrt{...}`, `\frac{...}{...}`, `\in`, `\subset`).
- Add/adjust feedback and error taxonomy entries for required misconceptions.
- Ensure validation accepts the `mat.u1.conjuntos_numericos` skill/error-tag set.

### Out of Scope
- Theory redesign, except strict compatibility fixes.
- Practice for powers, radicals, intervals, absolute value, or logarithms beyond classification context.
- Redesigning the math renderer itself.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `math-exercise-catalog`: require dense coverage for this skill and pedagogical traceability.
- `math-exercise-model`: validate the expanded exercise/type/difficulty mix and skill references.
- `math-error-taxonomy`: add unit-1 misconception tags needed by new exercises.
- `math-answer-evaluator`: keep tag assignment bounded to declared `commonErrorTags`.
- `guided-practice`: ensure every new item surfaces useful explanatory feedback.

## Approach

Deliver as 5 stacked PRs to main, each under the 400-line review budget: PR#1 root-render fix + base cleanup; PR#2 pertenencia/inclusion + inclusion map; PR#3 classification; PR#4 rational/irrational + decimals; PR#5 common-error exercises + verification. Use TDD where domain validation/evaluation changes are needed.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `content/matematica/exercises.json` | Modified | Expand skill catalog and fix root prompts. |
| `content/matematica/feedback/unit-1.json` | Modified | Add feedback for new error tags. |
| `src/domain/**` | Modified | Only if validation/tag support needs updates. |
| `openspec/specs/*` | Modified | Delta specs for changed requirements. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Catalog density exceeds review budget | Med | Use agreed 5-PR stack. |
| KaTeX syntax mismatch | Med | Test roots/fractions/membership/inclusion on desktop/mobile. |
| Feedback gaps for tags | Med | Add mapping for every referenced tag. |
| Scope creep into other skills | Low | Enforce explicit out-of-scope boundary. |

## Rollback Plan

Each slice is independently revertable. PR#1 is the critical revert point: if rendering or validation regresses, revert the root fix/base cleanup before reverting content-only slices.

## Dependencies

- Existing KaTeX `RichText` pipeline and OpenSpec/TDD workflow.

## Success Criteria

- [ ] ≥40 exercises for `mat.u1.conjuntos_numericos` across the required category counts.
- [ ] No root renders without top bar; no bare `√` for multi-term radicands.
- [ ] Roots, fractions, `\in`, and `\subset` render correctly on desktop and mobile.
- [ ] Every exercise has explanatory feedback with difficulty progression.
- [ ] Mandatory numbers appear: 5, 0, -3, 2/5, 0,75, 0,3̄, √2, √9, π, -4/1.
- [ ] No unrelated-skill exercise creep.
- [ ] `pnpm run test`, `pnpm run typecheck`, and `pnpm run build` pass.
