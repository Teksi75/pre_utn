# Proposal: Powers of Same Degree — Pedagogical Bridge

## Intent

`concept-fac-potencias-igual-grado` states the divisibility rules but never bridges rule → procedure. The issue (Teksi75/pre_utn#42) identifies 7 concrete gaps: how to choose the first factor, where the Ruffini number comes from, how the second factor is built, and how to distinguish the two methods (Ruffini vs disminución de exponentes). Without this bridge, the alumno can recite the rule but cannot apply it.

## Scope

### In Scope
- Expand `concept-fac-potencias-igual-grado` in `content/matematica/theory/unit-2.json` from 2 to 5-6 `bodyParagraphs` (divisibility table, factor selection, non-monic root derivation, second-factor construction, disminución method, comparison one-liner).
- Add 3 worked examples in `content/matematica/examples/unit-2.json`: `8x^3+27` by Ruffini, `8x^3+27` by disminución, `x^4-16` by disminución (diferencia branch).
- Reuse existing `u2_ruffini_signo_a` feedback mapping — no new error tag, no new detector.
- Voice validation: ensure new copy avoids forbidden Ingenium strings ("profe digital", "plan personalizado", "te marco qué practicar").

### Out of Scope
- **New base exercises** for Caso 6 — issue scope guardrail: "no modificar la lógica de ejercicios". The 4-exercise contract for `mat.u2.factorizacion` stays intact.
- **New challenge exercise** — follow-up if user requests; forecast stays comfortable without it.
- **New error tag `u2_ruffini_raiz_no_monica`** — ~50-60 extra lines; reuse existing tag instead.
- **Model/parser/renderer changes** — `bodyParagraphs` model already in main from `issue-36-theory-readability`.

## Capabilities

### New Capabilities
None — this change modifies existing content within an already-specified model.

### Modified Capabilities
- `theory-paragraph-model`: content expansion of one concept (no spec-level behavior change; the spec's paragraph rendering requirement already covers this).
- `math-exercise-catalog`: no change (4-exercise contract preserved).

## Approach

This is a **content-first** change. The `bodyParagraphs` model and `TheoryCard` renderer are already landed in main. We write better paragraphs for one concept and add worked examples that illustrate both methods.

**Precedent**: `issue-36-theory-readability` introduced `bodyParagraphs` + `TheoryCard`. `migrate-all-theory-paragraphs` migrated `concept-fac-potencias-igual-grado` to 2 paragraphs, but only split on punctuation — it did not fill the pedagogical gap. This issue is the natural follow-up: same model, deeper body.

**Concept expansion**: P1 refines the divisibility criteria into a structured 4-row block. P2 walks through factor selection given sign and parity of n. P3 (the headline gap) derives the Ruffini number from the non-monic divisor: `2x + 3 = 0 ⇒ x = -3/2`. P4 shows second-factor construction via Ruffini with coefficient reconciliation. P5 introduces the disminución method on the same example. P6 one-liner comparison.

**Worked examples**: Each follows `validateWorkedExample` shape (≥2 steps, sequential order, canonicalTrace, pedagogicalNote). Example 1 covers Ruffini full table; example 2 covers disminución direct; example 3 covers diferencia with exponent > 3.

**Feedback**: Reuse `u2_ruffini_signo_a` mapping. No new taxonomy entry, no new detector. Recovery target: the Ruffini worked example.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `content/matematica/theory/unit-2.json` | Modified | Expand `concept-fac-potencias-igual-grado` from 2 → 5-6 bodyParagraphs |
| `content/matematica/examples/unit-2.json` | Modified | Add 3 new worked examples for Caso 6 |
| `content/matematica/feedback/unit-2.json` | Modified | Add/update mapping for `u2_ruffini_signo_a` → new example |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| KaTeX rendering breaks on complex math in new paragraphs | Low | Reuse existing RichText pipeline; spot-check on `/learn/matematica/mat.u2.factorizacion` |
| Voice drift into forbidden Ingenium patterns | Low | Check new copy against AGENTS.md forbidden strings before commit |
| Worked example validation fails shape check | Low | Follow `validateWorkedExample` contract exactly (≥2 steps, sequential order) |

## Rollback Plan

Revert the three content files to their pre-change state. No schema, model, or evaluator changes are involved — rollback is a simple `git revert` with zero migration risk.

## Dependencies

- `issue-36-theory-readability` (done, merged) — provides `bodyParagraphs` model.
- `migrate-all-theory-paragraphs` (done, merged) — provides the 2-paragraph baseline we expand.

## Success Criteria

- [ ] `concept-fac-potencias-igual-grado` has 5-6 bodyParagraphs, each a single pedagogical step
- [ ] P3 explicitly derives `x = -3/2` from `2x + 3 = 0` (owner comment requirement)
- [ ] 3 worked examples exist in `examples/unit-2.json` with `skillId: "mat.u2.factorizacion"`
- [ ] Each worked example passes `validateWorkedExample` (≥2 steps, sequential, canonicalTrace, pedagogicalNote)
- [ ] Divisibility table covers all 4 rows (a^n−b^n por a−b siempre, a^n−b^n por a+b si n par, a^n+b^n por a+b si n impar, a^n+b^n por a−b nunca)
- [ ] No new error tag created; `u2_ruffini_signo_a` reused
- [ ] No new base exercises; 4-exercise contract for `mat.u2.factorizacion` unchanged
- [ ] New copy passes Ingenium voice check (no forbidden strings)
- [ ] `pnpm run test && pnpm run typecheck && pnpm run build` pass
- [ ] Visual spot-check on `/learn/matematica/mat.u2.factorizacion` confirms paragraph rendering

## Assumptions Made (Auto Mode)

1. **Challenge exercise: NO.** Issue scope guardrail forbids navigation/exercise changes. Forecast is comfortable without it.
2. **Error tag: REUSE `u2_ruffini_signo_a`.** No new tag, no new detector. Saves ~50-60 lines.
3. **Example count: 3** (Ruffini, disminución, diferencia). Issue says "al menos dos"; three covers the diferencia branch and fits forecast.
4. **Central example: `8x^3 + 27`** in worked examples; bodyParagraphs keep monic reference (`x + 2 ⇒ x = -2`) AND add non-monic (`2x + 3 ⇒ x = -3/2`), per owner comment.
5. **Voice: validate new copy** against forbidden strings. Run existing acceptance test if `copy-strings-acceptance.test.ts` exists; otherwise create minimal voice check.

## Out of Scope Follow-ups

- **New base exercise for Caso 6**: Would need a `math-exercise-catalog` spec delta (5th exercise for `mat.u2.factorizacion`). Separate change.
- **New error tag + detector for non-monic root**: Clean taxonomy add (~50-60 lines). Follow-up if user wants tighter feedback.

## Definition of Done

- `pnpm run test && pnpm run typecheck && pnpm run build` green
- Visual spot-check on `/learn/matematica/mat.u2.factorizacion`: paragraphs render correctly, KaTeX math visible
- Proposal archived in `openspec/changes/archive/`
