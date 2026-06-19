# Design: Section Card Topic Count

## Technical Approach

Inline JSX substitution in the section-card body. The data (`node.concepts.length`) already exists in the `TheoryNode` model — no domain changes, no new files besides a test. Replace the first-subtopic display with a computed count and pluralized label. One content rename in JSON.

## Architecture Decisions

| # | Decision | Choice | Alternatives | Rationale |
|---|----------|--------|-------------|-----------|
| 1 | Display format | `{count} tema(s)` inline ternary | Extract `SectionCard` component | Premature: justified only when Física reuses the shape. Inline keeps diff minimal. |
| 2 | Pluralization | Single ternary `=== 1 ? "1 tema" : "N temas"` | i18n library, plural rules | Only Spanish, only "tema". Ternary is the project pattern (see `page-student-home.test.ts` style). |
| 3 | Test strategy | Behavior-level render via `react-dom/server` + mocked wrappers | Source-level read + assert (string match) | The page is a sync Server Component — it can be rendered to a static HTML string with `renderToStaticMarkup` after mocking `next/link`, `MathWatermark`, and `DirectionalTransition` as plain passthroughs. The previous source-level test (claim from initial design) was based on the assumption that "server components can't be rendered in vitest without extra setup" — that assumption was false. The review follow-up replaced the source-level test with this behavior-level one to close the gap where a UI regression could pass source-level assertions. |
| 4 | Remove `"Teoría del tema"` fallback | Yes — delete fallback | Keep as dead code | The fallback is removed for clarity (no silent hiding of a 0-topic case). **Important caveat** (raised in post-apply review): the production loader `parseTheoryNode` in `content-loaders.ts:399-407` does NOT call `validateTheoryNode`, so a node missing both `concepts` and `conceptBlocks` would normalize to `concepts: []` and render as `0 temas`. All current production content has ≥ 3 concepts per node, so the 0-case is unreachable in practice. Wiring `validateTheoryNode` into the loader is a separate, out-of-scope change; for this slice the false "domain invariant" claim was corrected in the test (the test no longer asserts the invariant and the archived test comment was misleading). |

## Data Flow

```
unit-2.json (conceptBlocks[])
       │
       ▼
content-loaders.ts  parseTheoryNode()
       │
       ▼
TheoryNode.concepts: readonly ConceptBlock[]   (always ≥ 1 in current content;
       │                                       loader normalizes missing
       │                                       fields to `[]`; the
       │                                       validateTheoryNode invariant
       │                                       is not enforced on the
       │                                       runtime path — see decision #4)
       ▼
page.tsx  node.concepts.length
       │
       ▼
JSX: "{count} tema(s)"   (replaces node.concepts?.[0]?.title)
```

No state, no effects, no async. Pure derived value from existing model.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/learn/matematica/page.tsx` | Modify | Lines 64-66: replace `{node.concepts?.[0]?.title ?? "Teoría del tema"}` with `{node.concepts.length === 1 ? "1 tema" : `${node.concepts.length} temas`}` |
| `content/matematica/theory/unit-2.json` | Modify | Line 65: rename `"3. División larga de polinomios (procedimiento)"` → `"3. División de polinomios"` |
| `src/app/learn/matematica/__tests__/section-card-content.test.ts` | ~~Created~~ Deleted | Source-level read+regex test (77 lines) — **replaced** by behavior-level `.test.tsx` (post-apply review Finding 1). |
| `src/app/learn/matematica/__tests__/section-card-content.test.tsx` | Create (replacement) | Behavior-level render tests (6 tests) using `renderToStaticMarkup` from `react-dom/server` + mocked wrappers (`next/link`, `MathWatermark`, `DirectionalTransition`) + `loadTheoryContent` loader-mock seam for the singular pluralization case. |
| `src/domain/__tests__/content-loaders.test.ts` | Modify | Add focused data-assertion regression guard: `concept-op-division` title is `"3. División de polinomios"` (not the old verbose form). Goes through the domain loader, not source regex. |

## Interfaces / Contracts

No new interfaces. The change consumes the existing `TheoryNode.concepts: readonly ConceptBlock[]` contract.

Key constraint: `node.concepts` is non-empty in all current production content (minimum 3 concepts per node), so the new code can safely access `.length` directly. The `?.` optional chaining on the old code was defensive and is removed. The `validateTheoryNode` invariant (`concepts.length >= 1`) exists in the domain model (`src/domain/models/theory.ts:81-127`) and is consumed by tests under `src/domain/__tests__/` (e.g., `theory.test.ts`, `catalog-content.test.ts`), but the production loader `parseTheoryNode` in `content-loaders.ts:395-419` does NOT call it — see decision #4 for the full explanation. Wiring `validateTheoryNode` into the loader is a separate, out-of-scope change; for this slice the direct `.length` access is safe given the actual production data, and the `0 temas` rendering path is unreachable in practice.

> **Correction note (2026-06-19)**: The original wording stated `concepts.length >= 1` was "enforced by `validateTheoryNode`" on the runtime path. That claim was false — the validation function is only consumed by tests, not by the loader. The text above has been corrected to match the actual loader behavior documented in decision #4 and the "Post-Apply Review Fixes" section in `apply-progress.md`.

## Testing Strategy

> **Updated 2026-06-19** — table corrected to match the actual behavior-level
> test approach used by `section-card-content.test.tsx` (post-apply review
> found and removed the earlier "Source" rows; this table still listed the
> stale source-level approach).

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Behavior-level render | `page.tsx` renders the count, not the first subtopic | `renderToStaticMarkup` from `react-dom/server` + mocked wrappers (`next/link`, `MathWatermark`, `DirectionalTransition`) → assert visible HTML contract (`>3 temas</span>`, no first subtopic, no "Estudiar", card is `<a>` with subject-scoped href) |
| Behavior-level render | Count is derived from `node.concepts.length` (not literal) | Triangulation: assert three real nodes with distinct counts (3, 5, 7) each render the matching count. A hardcoded literal would fail this test. |
| Behavior-level render | Pluralization: singular `"1 tema"` vs plural `"N temas"` | Loader-mock seam injects a synthetic 1-concept node → assert `>1 tema</span>` and absence of `1 temas`. (No production node has 1 concept — current minimum is 3.) |
| Behavior-level render | Card remains a clickable `<a>` with the subject-scoped href | Assert the rendered card matches `<a href="/learn/matematica/{skillId}">…</a>` and contains both the title and the count. |
| Domain (data assertion) | Content rename `"División larga de polinomios (procedimiento)"` → `"División de polinomios"` is in effect | `loadTheoryContent("unit-2")` → find `mat.u2.operaciones_polinomios` node → find `concept-op-division` → assert `title === "3. División de polinomios"` and `not.toMatch(/División larga de polinomios/)`. Regression guard added in `content-loaders.test.ts` (focused data assertion, NOT source-regex). |
| Domain | Existing `content-loaders.test.ts` validates unit-2 nodes | Unchanged — still passes |
| Build | `pnpm run typecheck && pnpm run build` | Validates no TS errors from removed optional chaining |

## Migration / Rollout

No migration required. Pure presentational change with no schema, state, or routing impact.

## Open Questions

- [x] ~~Test file path: `src/app/learn/matematica/__tests__/section-card-content.test.ts` follows the `src/app/__tests__/` pattern. Confirm this is the right location.~~ **Resolved** — the source-level `.test.ts` was replaced by the behavior-level `section-card-content.test.tsx` in the same `__tests__/` directory during the post-apply review. Path is correct; only the extension changed (`.ts` → `.tsx` because the file imports React).
