# Proposal: Migrate All Theory Paragraphs to `bodyParagraphs`

## Intent

Issue #36 shipped the `bodyParagraphs` infrastructure (model, parser, renderer) and migrated 3 Ruffini concepts as proof. The remaining 38 long theory concepts (>350 chars) still render as single wall-of-text blocks, hurting readability. This change applies the same paragraph-split pattern to every long concept across both units.

## Scope

### In Scope
- Migrate 21 long concepts in `unit-1.json` (conjuntos-numericos, racionalizacion, complejos, logaritmos)
- Migrate 17 long concepts in `unit-2.json` (factorizacion, gauss, mcm-mcd-polinomios, ecuaciones-fraccionarias, operaciones-polinomios)
- Drop legacy `body` field on migrated concepts (same pattern as Ruffini)
- Register change in `openspec/changes/STATUS.json`
- Optional: smoke test that loads all theory units to catch content-shape regressions

### Out of Scope
- Copy rewrites or pedagogy redesign — preserve every sentence verbatim
- Model, parser, or renderer changes (infrastructure is complete from #36)
- Migrating short/medium concepts (54 concepts <350 chars — single-paragraph by design)
- Renaming `concepts` key to `conceptBlocks` in unit-1.json (parser already normalizes both)
- Teacher panel or any non-theory surfaces

## Capabilities

### New Capabilities
None — the `theory-paragraph-model` spec already covers all `bodyParagraphs` shapes.

### Modified Capabilities
None — no spec requirements change. This is content authoring against an existing spec.

## Approach

Single PR, content-only. Per concept: split `body` into 2–4 logical paragraph chunks (definition / example / error-warning / cierre), wrap in `bodyParagraphs` array, remove `body` field. Every `$...$` and `$$...$$` expression stays intact within its chunk.

Editorial rules:
1. One logical paragraph = one array element (no `\n\n` inside a string)
2. Never split a math expression across paragraphs
3. Preserve every sentence verbatim — no copy edits
4. Drop `body` on migrated concepts to prevent drift

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `content/matematica/theory/unit-1.json` | Modified | 21 concepts across 4 theory nodes |
| `content/matematica/theory/unit-2.json` | Modified | 17 concepts across 5 theory nodes |
| `openspec/changes/STATUS.json` | Modified | Register new change entry |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Math token corruption (`$`, `$$`, `\frac`, `\sqrt`) | Medium | Diff focused on math tokens; existing KaTeX tests; optional smoke test |
| Scope creep into copy edits | Medium | Proposal explicitly scopes out copy rewrites |
| JSON formatting churn inflates diff | Low | Format only touched lines; avoid full-file reformat |

## Rollback Plan

Revert the single PR. Since `bodyParagraphs` is optional and the parser falls back to `body`, restoring the legacy `body` field on all 38 concepts immediately restores prior behavior. No schema or code rollback needed.

## Dependencies

- Commit `e20b7a9` (issue #36 infrastructure) — already merged

## Success Criteria

- [ ] `pnpm run test` passes (no test count delta expected)
- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run build` passes
- [ ] All 38 migrated concepts expose `bodyParagraphs` and not `body`
- [ ] All 54 short concepts remain on legacy `body` unchanged
- [ ] KaTeX math renders correctly in migrated concepts (manual visual check)
