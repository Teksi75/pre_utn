# Exploration — Issue #36: UX legibilidad de textos teóricos

## Exploration: Theory-readability in Aprender and Práctica

### Current State

- Theory rendering is centralized in **`src/components/practice/TheoryCard.tsx`** and is reused by:
  - Aprender: `src/app/learn/matematica/[skillId]/page.tsx` (line 49) → `<TheoryCard node={theoryNode} />`
  - Práctica: `src/components/practice/PracticeTheoryPhase.tsx` (line 38) → `<TheoryCard node={theoryNode} />`
- A single `<div>` wraps the concept body (TheoryCard line 62-64):
  ```
  <div className="mt-1 text-sm text-brand-700 leading-[var(--leading-relaxed)]">
    <RichText text={concept.body} />
  </div>
  ```
- The data is a single string per concept. In `content/matematica/theory/unit-2.json` the Ruffini concepts are 1-paragraph walls:
  - `concept-ruffini-procedimiento` body = "Para dividir P(x) por (x−a) usando Ruffini: (1) se escriben...; (2) se escribe...; (3) se baja...; (4) se multiplica...".
  - `concept-teorema-resto` body = definition + sign explanation + worked example, all in one sentence.
  - `concept-ruffini-signo` body = "Error frecuente: ... Confundir el signo produce cociente y resto incorrectos. Verificar siempre: ...".
- The `RichText` component (`src/components/math/RichText.tsx`) parses inline `$...$` and block `$$...$$` KaTeX via `parseRichTextSegments`. It is robust to math delimiters as long as each chunk has matched `$` pairs.
- The CSS variables `var(--leading-relaxed)` (1.625) and `var(--text-sm)` (0.875rem) are already set. There is no `var(--space-paragraph)` token, and `space-y-3` is the only vertical rhythm inside the concept card.
- No existing `TheoryCard.test.ts` exists under `src/components/practice/__tests__/`. The closest related tests are `rich-text-parser.test.ts` and `katex-rendering.test.ts`.
- The component is a `"use client"` component because of the `useState` for the `showNotation` / `showMistakes` toggles. It is rendered inside an RSC page (`learn/matematica/[skillId]/page.tsx`).
- `WorkedExampleCard.tsx` has the same wall-of-text pattern in `problem`, `step.explanation`, and `pedagogicalNote`, but the issue is scoped to theory. This is **out of scope** for #36 — flag for a follow-up.

### Affected Areas

- `src/components/practice/TheoryCard.tsx` — concept body rendering (line 62-64) is the only place where theory text is laid out as a flat div.
- `src/components/math/RichText.tsx` and `rich-text-parser.ts` — the parser is the only math-aware splitter. Any paragraphization must call it per chunk to avoid breaking KaTeX segments.
- `src/domain/models/theory.ts` — `ConceptBlock.body: string` is the field. Adding `bodyParagraphs: readonly string[]` (or a discriminated union) is a domain change. `validateTheoryNode` may need a small adjustment (the existing validator doesn't reach into body shape).
- `src/domain/catalog/content-loaders.ts` — `parseConceptBlock` (line 241) is where the new field would be parsed; needs a branch for `bodyParagraphs` and runtime validation per chunk.
- `content/matematica/theory/unit-1.json` and `unit-2.json` — Ruffini and other long concepts would migrate to the array form. Optional for the first PR (see Recommendation).
- `src/components/practice/TheoryCard.tsx` rendering loop (line 53-78) — must switch to `bodyParagraphs.map(...)` when the array is present, fall back to `body` otherwise.
- `src/app/globals.css` — does not need changes. Existing `space-y-3` on the concept card (line 53) provides vertical rhythm; per-paragraph spacing is best done with `space-y-2` on the paragraph wrapper or with `mt-2` on subsequent paragraphs.

### Approaches

1. **Render-side heuristic paragraph splitting** (no content change, no model change).
   - Description: Inside TheoryCard, split the body string on regex boundaries (`. `, `; `, `(1)`, `(2)`, `Ejemplo:`, `Advertencia:`, `Error frecuente:`) and wrap each chunk as a `<p>`. Each chunk is parsed independently by the existing `RichText`.
   - Pros: No data migration. No domain change. Lowest diff.
   - Cons: Heuristic, fragile for new content patterns; risk of breaking math if a split point lands inside a `$...$` pair that spans the boundary (mitigated by parsing per-chunk and discarding chunks with unmatched `$`).
   - Effort: **Low**.

2. **Add a `RichTextParagraphs` component that extends `RichText` with paragraph splitting**.
   - Description: Reusable wrapper that splits on newlines or recognized clause delimiters, renders each as a `<p>` with `RichText` inside.
   - Pros: Reusable across the project (could later be used in WorkedExampleCard). Clean separation. Testable in isolation. TDD-friendly.
   - Cons: Still heuristic; same math-boundary risk; a second component to maintain.
   - Effort: **Low–Medium**.

3. **Content-model change: `bodyParagraphs: readonly string[]` on `ConceptBlock`** (explicit).
   - Description: Add the field to the domain model, parser, and validator. Each element is independently rendered through the existing `RichText`. Migrate Ruffini concepts (and any other concept > 3 sentences) in the same PR.
   - Pros: Explicit and author-controlled. Math-safe by construction. Future-proof. TDD applies cleanly (model + parser tests). Matches the project's SDD/TDD discipline.
   - Cons: Touches `src/domain/`, `content-loaders.ts`, and the two unit JSON files. Slightly larger diff. Validator and parser must agree on the shape.
   - Effort: **Medium**.

4. **Hybrid: support BOTH `body: string` and `bodyParagraphs: string[]`** (recommended).
   - Description: `ConceptBlock` allows either. Parser reads whichever is present. TheoryCard prefers `bodyParagraphs` when non-empty, falls back to the legacy `<RichText text={concept.body} />`. New concepts and migrated ones use the array form; old content keeps working unchanged.
   - Pros: Backward compatible. No forced migration of `unit-1.json`. Allows incremental rollout. Same TDD coverage as approach 3. Matches the project's incremental SDD practice.
   - Cons: Two code paths in TheoryCard (acceptable — it's a one-line `if`). Documentation overhead.
   - Effort: **Medium**.

### Recommendation

**Approach 4 (Hybrid: add `bodyParagraphs`, prefer it, keep `body` working)**, combined with a small, focused content migration of the Ruffini concepts in `content/matematica/theory/unit-2.json` to satisfy the issue's acceptance criteria.

Rationale:

- The issue's verification list names `mat.u2.ruffini_resto` and `/practice` explicitly. Without migrating Ruffini, the issue is half-done.
- The project rule "TDD required in domain" (AGENTS.md) means the domain model change must come with RED-GREEN tests for the parser and the validator. This is a clean fit for approach 3/4.
- Approach 1 (heuristic) is too fragile for canonical content (the canonical material can introduce new patterns, and the parser would need constant updates). It is also opaque to the content author.
- Approach 2 (a new component without the model change) is technically viable but leaves the underlying problem — content being one long string — unsolved. The render layer is the wrong place to make the editorial decision.
- The hybrid keeps `unit-1.json` untouched in this change, so the diff stays under the 400-line review budget. A follow-up change can migrate unit-1 concepts that need it.

The change will look like:

1. **Domain (TDD)**: Add `bodyParagraphs?: readonly string[]` to `ConceptBlock` in `src/domain/models/theory.ts`. Each element must be a non-empty string; this is validated in the parser. Add a test for the new field, a test for the legacy-only path, and a test for the hybrid (both present) path.
2. **Parser**: Extend `parseConceptBlock` in `src/domain/catalog/content-loaders.ts` to read `bodyParagraphs` when present (default to an empty array or undefined). Each element must be a non-empty string at runtime.
3. **Component**: In `TheoryCard`, render `bodyParagraphs` (when length > 0) as a list of paragraph blocks wrapping `<RichText>` — the renderer uses `<div>` wrappers (not `<p>`) to avoid invalid HTML nesting when a chunk contains display math that produces block-level KaTeX output. Otherwise keep the existing `<div><RichText text={concept.body} /></div>` path. Add per-paragraph vertical spacing (`space-y-2` on the wrapper).
4. **Content**: Migrate the 3 Ruffini concepts (`concept-ruffini-procedimiento`, `concept-teorema-resto`, `concept-ruffini-signo`) in `content/matematica/theory/unit-2.json` from the `body` field to `bodyParagraphs`. Also keep `body` for backward compatibility, OR remove it once migration is complete. Recommendation: remove `body` for migrated concepts to keep the model clean and prevent drift.
5. **Test additions**:
    - `rich-text-parser.test.ts` is already covered. New test: `TheoryCard.test.tsx` asserting that a concept with `bodyParagraphs` renders N paragraph blocks and that math is preserved.
   - Domain test in `src/domain/models/theory.test.ts` (if it doesn't exist, add it) for the new `bodyParagraphs` validation rule.
6. **Visual verification** (per acceptance criteria): navigate to `/learn/matematica/mat.u2.ruffini_resto` and to `/practice` (after selecting Ruffini) on desktop and mobile. Capture screenshots before/after. Confirm math expressions like `P(x)`, `(x−a)`, `P(a)` still render correctly.

### Risks

- **Math boundary safety**: any per-paragraph rendering path must re-run the existing `parseRichTextSegments` on each chunk, because the existing parser assumes matched `$` pairs. A paragraph that ends with an unclosed `$` would otherwise leak into KaTeX. Mitigation: in the parser, validate that each chunk either has no `$` or has matched pairs (or pass unmatched ones through as plain text, which is the current behavior of `parseRichTextSegments`).
- **TDD coverage gap**: the project mandates TDD in `src/domain/`. The exploration must surface this so `sdd-spec` writes a test for the new field before any implementation. Otherwise the change violates AGENTS.md.
- **Tone drift**: the canonical material is the source of truth. The migration must keep every sentence and math expression. A regression here is a pedagogical bug, not just a UX one.
- **Out-of-scope signal**: `WorkedExampleCard` (problem, step explanation, pedagogical note) has the same pattern, but the issue only mentions theory. If the orchestrator wants the same fix applied to examples, the scope will grow past the 400-line budget and should become its own SDD change.
- **JSON authoring ergonomics**: in the current JSON, `bodyParagraphs` is a long array of strings. Editors may be tempted to use `\n\n` inside a single string. The change should clarify the chosen convention (array of strings, one logical paragraph per entry) so future authors don't reintroduce the wall of text.
- **KaTeX regression**: any change to how the body is rendered can affect KaTeX hydration. The existing `katex-rendering.test.ts` is the safety net; the verification phase must run it.

### Ready for Proposal

**Yes** — the orchestrator can launch `sdd-propose` for `issue-36-theory-readability`. One open decision the orchestrator should surface to the user (or that the proposal can decide and document):

- Should the migration of `unit-2.json` Ruffini concepts happen in this same change, or as a follow-up after the model+component PR lands? **Recommendation**: in the same change, because the issue's acceptance criteria explicitly list `/learn/matematica/mat.u2.ruffini_resto` and `/practice` as visual-verification targets. Without the migration, the change ships the abstraction but doesn't fix the user-visible problem.
- The orchestrator should also confirm whether to extend the same treatment to `WorkedExampleCard` in this change. **Recommendation**: no, keep it scoped; file a follow-up issue.

## Verification Anchors (for sdd-verify)

- `/learn/matematica/mat.u2.ruffini_resto` — desktop + mobile screenshots.
- `/practice` — Ruffini flow, theory phase.
- Math expressions `P(x)`, `(x−a)`, `P(a)`, `(x−(−a))` must render via KaTeX.
- `pnpm run test` covers the new domain test and the new TheoryCard test.
- `pnpm run typecheck` must pass (no `any` from the new field).
- `pnpm run build` must pass.
