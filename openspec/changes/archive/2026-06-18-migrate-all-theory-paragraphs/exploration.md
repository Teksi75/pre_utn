# Exploration: Migrate all theory paragraphs to `bodyParagraphs`

> **Post-apply update (2026-06-18):** The exploration identified 36 long-body candidates (19 U1 + 17 U2). During apply, 2 additional U1 concepts qualified (>350 chars), bringing the final scope to **38 concepts (21 U1 + 17 U2)**. The line-count forecast (~195-215) proved optimistic — the actual final diff was **407 lines** (+7 above the 400-line budget, driven by the extra U1 concepts and SDD docs/test additions).

## Exploration: Extend issue #36 readability improvement to all theory topics

### Current State

The `bodyParagraphs` model and renderer shipped in issue #36 (commit `e20b7a9`, archived 2026-06-18) are already in place. The infrastructure is complete and battle-tested for one slice of the catalog. What is missing is the *content* migration for the remaining theory topics.

**What exists today**

- `ConceptBlock.bodyParagraphs?: readonly string[]` — optional field, model accepted (`src/domain/models/theory.ts:38`).
- `parseOptionalBodyParagraphs` — fail-fast runtime parser, rejects non-array or non-string elements (`src/domain/catalog/content-loaders.ts:288-304`).
- `TheoryCard` — renders `bodyParagraphs` per chunk inside a `<div>` wrapper (avoids invalid `<div>`-inside-`<p>` nesting with display math KaTeX) when present, falls back to legacy `body` otherwise (`src/components/practice/TheoryCard.tsx:62-74`).
- 3 Ruffini concepts in `content/matematica/theory/unit-2.json` already migrated as the reference implementation.
- TDD coverage: `parseOptionalBodyParagraphs` tested in `src/domain/__tests__/content-loaders.test.ts`; `TheoryCard` rendering tested in `src/components/practice/__tests__/TheoryCard.test.tsx` (297 lines, `react-dom/server`).

**Theory content inventory** (scanned across both theory files)

| File | Theory nodes | Concepts | Already migrated | Still `body`-only |
|------|--------------|---------:|-----------------:|------------------:|
| `content/matematica/theory/unit-1.json` | 8 | 66 | 0 | 66 |
| `content/matematica/theory/unit-2.json` | 7 | 27 | 3 (Ruffini) | 24 |
| **Total** | **15** | **93** | **3** | **90** |

Note on shape: `unit-1.json` uses the `concepts` key; `unit-2.json` uses `conceptBlocks`. The parser (`parseTheoryNode`, `content-loaders.ts:395-419`) already normalizes both. No schema change is required.

**Long-body candidates (body > 350 chars, the readability threshold the issue itself implies)**

| Theory node | Long bodies | Examples |
|-------------|------------:|----------|
| `theory-conjuntos-numericos` (U1) | 7 | `concept-lenguaje-basico-conjuntos` 728c, `concept-pertenencia-vs-inclusion` 950c |
| `theory-racionalizacion` (U1) | 4 | `concept-cierre-racionalizacion` 440c, `concept-binomio-doble-conjugado` 407c |
| `theory-complejos` (U1) | 7 | `concept-division` 470c, `concept-conjugado` 429c |
| `theory-logaritmos` (U1) | 1 | `concept-conversion-log-exponencial` 365c |
| U1 long subtotal | **19** (apply found **21**) | |
| `theory-factorizacion` (U2) | 5 | `concept-fac-trinomio-segundo-grado` 606c, `concept-fac-tcp` 479c |
| `theory-gauss` (U2) | 3 | `concept-gauss-algoritmo` 560c, `concept-gauss-ejemplo` 480c |
| `theory-mcm-mcd-polinomios` (U2) | 3 | `concept-mcm-mcd-algoritmo` 524c |
| `theory-ecuaciones-fraccionarias` (U2) | 3 | `concept-ec-frac-sin-solucion` 492c |
| `theory-operaciones-polinomios` (U2) | 2 | `concept-op-division` 421c |
| U2 long subtotal | **17** | |
| **Long-body total (Class A — recommended migration)** | **36** (apply found **38**) | |
| **Medium-body borderline (Class B, skip)** | 30 (200-350c, single idea) | e.g. `concept-familia-conjuntos-numericos` 337c/2 sentences |
| **Already-short (Class C, no-op)** | 24 (<200c) | e.g. `concept-distributiva` 158c |

Class B and C do not need migration: a 1-3 sentence concept in a 200-350 char single string is a single paragraph by design. Adding paragraph breaks would be artificial and would harm readability, not improve it. Leave them in the legacy `body` form.

### Affected Areas

- `content/matematica/theory/unit-1.json` — migrate 21 long concepts (19 in exploration count; apply found 2 more) across 4 theory nodes (conjuntos-numericos, racionalizacion, complejos, logaritmos). Leave the other 4 nodes untouched (propiedades-operaciones-reales, intervalos, potencias-raices, valor-absoluto — already short or already-multi-sentence-but-tight).
- `content/matematica/theory/unit-2.json` — migrate 17 long concepts across 5 theory nodes (operaciones-polinomios, factorizacion, gauss, mcm-mcd-polinomios, ecuaciones-fraccionarias). Already-migrated Ruffini node stays as-is.
- `openspec/changes/STATUS.json` — register the new change with `status: in-progress`, branch name.
- `openspec/changes/archive/2026-06-18-issue-36-theory-readability/specs/theory-paragraph-model/spec.md` — re-read for context but **no delta needed**; the spec already covers all bodyParagraphs shapes. The body of work here is content authoring, not spec authoring.
- `src/domain/catalog/content-loaders.ts` — no code change. The parser already accepts the array form, and `parseConceptBlock` is generic over the new field.
- `src/components/practice/TheoryCard.tsx` — no code change. The render path with the `<div>` wrapper is already in place.
- `src/components/practice/__tests__/TheoryCard.test.tsx` — no change required. The existing 7 tests cover the bodyParagraphs render path generically (one concept with N chunks, math preserved, fallback to legacy `body`).
- Verification surface: `pnpm run test`, `pnpm run typecheck`, `pnpm run build`. Add a smoke test that loads all theory units to catch content drift (already covered partially by existing parse tests; optional add).

### Approaches

1. **Single PR, content-only, in this change** (recommended).
   - Description: One branch, one PR. Touches only `unit-1.json` and `unit-2.json`. Per-concept: split the existing `body` string into 2-4 logical paragraph chunks (one per idea: definition, example, error, warning), wrap them in a `bodyParagraphs` array, drop the legacy `body` field on the migrated concept. Preserve every sentence and every KaTeX expression verbatim.
   - Pros: Smallest blast radius. The model, parser, and renderer are already proven by the Ruffini migration. No domain/component/test churn. Reviewers can review the file with diff settings that ignore unchanged context.
   - Cons: Single PR touches two large content files (a 651-line file and a 266-line file). Reviewer has to scan all migrated concepts to verify math preservation.
   - Effort: **Low–Medium** (the work is editorial, not architectural).

2. **Chained PRs by unit (U1 then U2)**.
   - Description: PR1 migrates the 19 U1 long concepts (exploration count; apply found 21); PR2 migrates the 17 U2 long concepts. Each PR is stacked to main.
   - Pros: Smaller diff per PR. If a migration introduces a math regression, the blast radius is one unit.
   - Cons: Two PRs, two merge points, two STATUS.json updates. More process overhead for a content-only change where the verification surface is automated tests + a manual scan of the math.
   - Effort: **Low** for each PR, but double the ceremony.

3. **Chained PRs by concept density** (e.g., complex-multi-idea first, then long-narrative).
   - Description: Sort concepts by paragraph count and migrate in 3 chained PRs by paragraph-count bands.
   - Pros: Even smaller diffs.
   - Cons: Artificial slicing. The content is conceptually one migration; splitting it by density band adds no review value and forces reviewers to scan partial migrations across PRs.
   - Effort: **Low** per PR, **High** in ceremony.

4. **Defer to a future sprint and only migrate a subset now (e.g., the 7 U1 complejos concepts that the user explicitly mentioned in the prior session)**.
   - Description: Migrate only the complejos node as a quick win; revisit the rest later.
   - Pros: Minimum commit. Easy to review.
   - Cons: Violates the user's request: "aplica la misma mejora de legibilidad a todos los temas de teoría". The user explicitly wants the rest done.
   - Effort: **Very Low**, but scope-incomplete.

### Recommendation

**Approach 1 (single PR, content-only)** is the right call. The infrastructure is already in place and the Ruffini migration is a working precedent. The total content diff is small enough for a single review. _(Post-apply note: the actual final diff was 407 lines, +7 over the 400-line forecast budget. Approach 1 was used successfully despite the overage — the extra lines came from the 2 additional U1 concepts discovered during apply and from SDD docs/test additions, not from architectural churn. No fallback was needed.)_

Forecast (using Ruffini's prior delta as a calibration point):

- Ruffini migration: 3 concepts, +16/-0 lines in `unit-2.json`, plus the model/parser/test churn that is **not** part of this change.
- This change: 36 concepts (exploration count; actual 38) × ~4 net lines per concept (replace 1 line with `["…", "…", "…"]` open + 3 paragraphs + close) = **~144 net lines for content**.
- Plus JSON-formatting adjustments (commas at end of `body` removal, `bodyParagraphs` open/close) ≈ +10 lines.
- Plus optional smoke test that loads all theory (if not already implicit) ≈ +30-50 lines.
- Plus STATUS.json entry ≈ +10 lines.
- **Total forecast: ~195-215 changed lines.** This was **under the 400-line budget** at forecast time. The actual final diff was **407 lines** (+7 over, driven by extra U1 concepts and SDD docs/test additions).

Decision gates for the orchestrator:

- `Decision needed before apply`: No (single PR is feasible, no size exception required).
- `Chained PRs recommended`: No (single PR; the 400-line budget was exceeded by 7 lines at apply time but no fallback was needed — the overage came from content discovery and SDD docs, not scope creep).
- `400-line budget risk`: **Low** (materialized: actual diff 407, +7 over).

**Slicing proposal (superseded — not executed).** The pre-apply forecast contemplated splitting into two content-only slices (U1 then U2) if Approach 1 exceeded 400 lines. The actual final diff reached **407 lines** (+7 over the budget, driven by 2 extra U1 concepts discovered during apply and SDD docs/test additions). The overage was small and confined to content + documentation; it would have been reduced, not eliminated, by a split (the SDD docs and STATUS.json churn appear in any slice). The team accepted the +7 as a de-minimis overage for a content-only change, and **no chained split was performed**. The slice definitions are preserved below as historical reference only:

- **Slice A (not executed):** U1 long concepts (21 actual; 19 in exploration count).
- **Slice B (not executed):** U2 long concepts (17 concepts).
- Each slice would have been content-only and independent, requiring no bridge code between them.

Editorial conventions the proposal/spec phase should pin down so the migration is consistent:

1. **One logical paragraph = one array element.** Do not use `\n\n` inside a single string. The renderer already adds `space-y-2` vertical rhythm between chunks.
2. **Natural split points**: definition / example / error-or-warning / cierre. A concept with one definition and one example is 2 paragraphs. A concept with definition + 2 examples + 1 error is 4 paragraphs.
3. **Do not split a math expression across paragraphs.** A paragraph chunk that contains `$$...$$` display math must keep the `$$` pair intact. The parser already does per-chunk KaTeX, but the author should not author a split that visually breaks a math line.
4. **Preserve every sentence verbatim.** No rewording, no punctuation changes, no whitespace normalization inside chunks. This is a layout migration, not a copy edit.
5. **Drop the legacy `body` field on migrated concepts.** Same pattern as Ruffini. Prevents drift (a future author could update `body` and forget `bodyParagraphs`).

### Risks

- **Math preservation**: the highest risk. A typo in a `$\\sqrt{2}$` token or an unbalanced `$` pair would render as plain text or as a KaTeX error. Mitigation: (a) the author runs the existing test suite after each unit is touched (`pnpm run test`); (b) the existing `rich-text-parser.test.ts` and `katex-rendering.test.ts` cover the renderer path; (c) the orchestrator should run a final review of the diff focused on math tokens, not on prose. The change is content-only, so any test that loads all theory and renders it would surface broken chunks; such a smoke test is the cheapest safety net.
- **Vertical-rhythm regression**: `TheoryCard` uses `space-y-2` between paragraph blocks. The migration could feel either too dense or too airy for a specific concept. The visual rhythm is identical for the migrated concept because the render path is the same. Low risk.
- **Drift after migration**: a future content author could re-introduce a `body` field on a migrated concept. The parser already enforces "either `body` or `bodyParagraphs` must be present" (`content-loaders.ts:247-249`), so accidental duplication would fail at load time. The proposal should call out this safety net.
- **PR size risk (low)**: a single content-only PR is a different kind of cognitive load than a code PR. The reviewer has to read 36 prose blocks (exploration count; apply found 38) carefully. The orchestrator can suggest the PR author attach before/after screenshots for at least one migrated concept from each theory node, so the reviewer can compare visually without scanning the diff.
- **TDD gap**: AGENTS.md mandates TDD in `src/domain/`. This change does not touch `src/domain/` (model, parser, and tests for bodyParagraphs already exist from issue-36). TDD is not required for content authoring. The orchestrator should confirm in the proposal phase that no new domain code is being introduced.
- **JSON formatting churn**: a 651-line file edited in 21 places (19 in exploration count; apply found 2 more) produces a large diff even if the line count change is small. Reviewers may flag JSON reformatting noise. The author should set the editor to format only the touched lines and avoid full-file reformatting.
- **Scope creep**: a content migration is the right time to fix copy. The user explicitly framed this as "the same readability improvement" — not as a copy review. The proposal must keep copy edits out of scope to avoid mixing layout migration with content rewrites, which would harm review focus and inflate the diff.

### Ready for Proposal

**Yes** — the orchestrator can launch `sdd-propose` for `migrate-all-theory-paragraphs`. Two decisions to surface to the user (or that the proposal can decide and document):

1. **Scope decision**: migrate all 36 long concepts (exploration count; actual 38) in one PR, or split by unit (U1 then U2)? **Recommendation**: single PR. The forecast estimated ~195-215 lines and fit within the 400-line budget. _(Post-apply note: actual final diff was 407 lines, +7 over budget — driven by extra U1 concepts discovered during apply and SDD docs/test additions. Approach 1 was used successfully regardless.)_
2. **Smoke test**: should the proposal add a test that loads all theory units and asserts no parser errors after the migration, or rely on the existing parser tests? **Recommendation**: add the smoke test (1 small test, ~30 lines). Cheap insurance against a math-preservation regression in a content PR.

The exploration also leaves one observation for the proposal/spec phase to address:

- The `unit-1.json` concepts use the `concepts` key; `unit-2.json` uses `conceptBlocks`. The parser already handles both. The proposal can document this as a known-shape normalization and not change it. Splitting `unit-1.json` to also use `conceptBlocks` is out of scope (the parser doesn't care, and the rename would inflate the diff for zero functional gain).

## Verification Anchors (for sdd-verify)

- `pnpm run test` — 2087 tests must still pass (no test count delta expected; the smoke test add is optional but recommended).
- `pnpm run typecheck` — must pass. No new TypeScript code, but the smoke test addition is `.ts`/`.tsx`.
- `pnpm run build` — must pass. No bundle changes expected (content JSON is bundled; line count of JSON affects bundle size but not the routing graph).
- `pnpm run audit:branches` — informational. Must show the new branch registered in `STATUS.json` after PR open.
- Manual visual: navigate to `/learn/matematica/mat.u1.conjuntos_numericos` and `/learn/matematica/mat.u2.factorizacion` on desktop + mobile, confirm the migrated concepts render with paragraph spacing. Math expressions like `$\\mathbb{N}$`, `$\\sqrt{2}$`, `$\\frac{a+bi}{c+di}$` must still render as KaTeX.
- Optional: take one before/after screenshot pair and attach to the PR description for the reviewer's benefit.
