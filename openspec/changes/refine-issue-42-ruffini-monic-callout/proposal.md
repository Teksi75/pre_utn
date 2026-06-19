# Proposal: Ruffini Monic Callout — Visual Table + Callout Refinement

## Intent

`concept-fac-potencias-igual-grado` P4 presents the Ruffini table as a ~700-char single-sentence wall of prose, burying two critical pedagogical points: (1) the explicit "resto = 0 → división exacta" closure, and (2) the reconciliation that Ruffini divides by the monic factor `x + 3/2`, not the original divisor `2x + 3`. This refinement restructures P4 into focused sub-paragraphs with a KaTeX `array` table and a dedicated "Importante:" callout, without changing any pedagogical content or model/renderer code.

## Scope

### In Scope
- Replace P4 of `concept-fac-potencias-igual-grado` in `content/matematica/theory/unit-2.json` with a structured block: KaTeX `$$\begin{array}{c|cccc}$$` table + "resto es 0" sentence + cociente + "Importante:" callout for the monic factor reconciliation
- Update paragraph cap in `src/domain/__tests__/content-loaders.test.ts` (`EXPANDED_U2_IDS`) from 6 to 10
- Update paragraph cap in `src/domain/__tests__/copy-strings-acceptance.test.ts` from `>=5 && <=6` to `>=5 && <=10`

### Out of Scope
- Worked examples (`example-factorizacion-3/4/5`) — no changes
- Feedback mapping — no changes
- P5 (disminución) and P6 (comparación) — remain intact
- `ConceptBlock` model, `RichText` parser, `TheoryCard` renderer — zero code changes
- PR creation / push — out of scope

## Capabilities

### New Capabilities
None — content refinement within existing model.

### Modified Capabilities
- `theory-paragraph-model`: paragraph count for `concept-fac-potencias-igual-grado` increases from 6 to ~9. The spec's "5-6 paragraphs" requirement needs a delta to allow up to 10 for this concept. No behavior change to the model or renderer.

## Approach

**KaTeX block math** (`$$...$$`) using `\begin{array}{c|cccc}` with `\hline`. The `rich-text-parser.ts` already handles `$$...$$` as display math (lines 45-49), and `TheoryCard` renders it via `katex-display`. No model or renderer changes needed.

**New P4 structure** (replaces current single P4):

| Sub-block | Content |
|-----------|---------|
| P4-α | Intro sentence + KaTeX array table: `-3/2` over `[8, 0, 0, 27]`, intermediate row `[-12, 18, -27]`, result row `[8, -12, 18, 0]` |
| P4-β | "Como el resto es 0, la división es exacta." (explicit closure) |
| P4-γ | Cociente `8x² − 12x + 18` + reconciliation: Ruffini divides by monic `x + 3/2`, original divisor is `2x + 3 = 2·(x + 3/2)`, so divide cociente by 2 → `4x² − 6x + 9` |
| P4-δ | "Importante: Ruffini divide por el factor mónico asociado: x + 3/2" (dedicated callout) |

Final factorization `(2x + 3)(4x² − 6x + 9)` stays in P4-γ or moves to P5 transition — sdd-design decides exact placement.

**Decision: "Importante:" marker.** Neutral, consistent with educational material tone. "OJO:" is colloquial and breaks Ingenium voice. "Atención:" is valid but less common in the repo.

**Decision: Replace P4, not append.** Current P4 is a 700-char sentence with 4 interleaved ideas. Splitting into focused sub-blocks improves legibility and honors the paragraph-structured presentation model.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `content/matematica/theory/unit-2.json` | Modified | Replace P4 of `concept-fac-potencias-igual-grado` with 4 KaTeX-structured sub-blocks |
| `src/domain/__tests__/content-loaders.test.ts` | Modified | Raise paragraph cap from 6 to 10 in `EXPANDED_U2_IDS` |
| `src/domain/__tests__/copy-strings-acceptance.test.ts` | Modified | Raise paragraph cap assertion from `<=6` to `<=10` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| KaTeX `array` overflows horizontally at 375px mobile | Low | `c\|cccc` with 5 columns occupies ~250-300px in math font; fits 375px. Validate with Playwright in sdd-verify. |
| Backslash escaping in JSON (`\begin`, `\hline`) breaks parsing | Low | `rich-text-parser.ts` processes `$$...$$` content as-is; KaTeX handles the LaTeX. Existing display math in other concepts uses similar syntax. |
| Paragraph cap increase masks future regressions | Low | Cap goes from 6 to 10 specifically for `EXPANDED_U2_IDS`; other concepts unchanged. |

## Rollback Plan

Revert the 3 modified files to pre-change state. Pure content + test cap adjustment — zero schema/migration risk. `git revert` is sufficient.

## Dependencies

- `issue-42-powers-same-degree` (done, merged at 3c36dca) — provides the 6-paragraph baseline being refined
- KaTeX support in `TheoryCard` + `RichText` (already landed)

## Success Criteria

- [ ] KaTeX `array` table with `-3/2` over `[8, 0, 0, 27]` renders as visual table (not plain text) in the concept
- [ ] "Como el resto es 0, la división es exacta" appears as a distinct sentence
- [ ] Cociente `8x² − 12x + 18` appears explicitly
- [ ] "Importante: Ruffini divide por el factor mónico asociado: x + 3/2" appears as a highlighted callout at end of P4 block
- [ ] Factor `2x + 3` and factorization `(2x + 3)(4x² − 6x + 9)` remain present
- [ ] No horizontal overflow at 375px viewport width
- [ ] No forbidden Ingenium voice strings introduced (voice gate green)
- [ ] P5 and P6 remain unchanged
- [ ] `pnpm run test && pnpm run typecheck && pnpm run build` pass

## Assumptions Made (Auto Mode)

1. **Marker: "Importante:"** — neutral, consistent with educational material. "OJO:" is colloquial and borderline for Ingenium voice.
2. **Replace P4, not append** — current P4 is 700 chars with 4 ideas interleaved. Replacing with focused sub-blocks improves readability.
3. **P5/P6 intact** — refinement targets only P4. Disminución (P5) and comparison (P6) are already clear.
4. **No worked example changes** — the explore confirmed duplicating the table in `example-factorizacion-3` adds no pedagogical value when the concept already shows it.
5. **Sub-blocks as separate paragraphs** — sdd-design will decide whether P4-α/β/γ/δ are 4 separate `bodyParagraphs` elements or a single multi-line element. Proposal assumes separate for clarity.

## Out of Scope Follow-ups

- **`monospaceBlocks` field on `ConceptBlock`**: If true monospace table rendering is desired in the future, a dedicated field + component is the honest path. Separate change.
- **Table in worked examples**: Would require the same `monospaceBlocks` field or a KaTeX array duplication. Not justified for this refinement.

## Definition of Done

- `pnpm run test` green
- `pnpm run typecheck` green
- `pnpm run build` green (7/7 routes)
- Voice gate green (no forbidden strings)
- Visual render confirmed (manual or Playwright) at 375px and desktop
- Change merged to main with `--no-ff`
- Archived in `openspec/changes/archive/`
