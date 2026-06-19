# Proposal: Section Card Topic Count

Section cards on `/learn/matematica` show the first subtopic instead of a topic count, misrepresenting section breadth. Fix: show title + "N tema(s)" only.

## Intent

Cards currently display `node.concepts?.[0]?.title`, which reads as if the section contains only that subtopic. For "Operaciones con polinomios" (3 concepts), the card shows "1. Suma y resta de polinomios" — hiding multiplicación and división. Replace with a computed topic count so the card honestly represents section scope.

## Scope

### In Scope
- Replace first-subtopic line in `src/app/learn/matematica/page.tsx:64-66` with `node.concepts.length` + pluralized "tema(s)"
- Remove `"Teoría del tema"` fallback (every node has ≥1 concept, enforced by domain validation)
- Rename content: `"3. División larga de polinomios (procedimiento)"` → `"3. División de polinomios"` in `content/matematica/theory/unit-2.json`
- New render test asserting card contract (title visible, count correct, no first subtopic, card is `Link`)

### Out of Scope
- Visual/styling changes (background, watermark, layout, sidebar, footer)
- `TheoryCard` component, `[skillId]/page.tsx` detail page
- Other pages, Física, domain model changes
- Extracting `SectionCard` component (deferred; justified only when Física reuses shape)

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is a presentational fix; no spec-level requirements change.

## Approach

**Inline JSX change (Approach 1 from exploration).** The data is already in the model (`TheoryNode.concepts.length`). No new files, no domain changes.

1. In `page.tsx` lines 60–67: replace `{node.concepts?.[0]?.title ?? "Teoría del tema"}` with `{node.concepts.length === 1 ? "1 tema" : `${node.concepts.length} temas`}`
2. In `unit-2.json`: rename `concept-op-division` title string
3. New test file: render test for section-card content using at least two nodes (`operaciones_polinomios` with 3 topics, `potencias_raices` with 7)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/learn/matematica/page.tsx:60-67` | Modified | Replace first-subtopic with topic count |
| `content/matematica/theory/unit-2.json` | Modified | Rename `concept-op-division` title |
| New test file (TBD under `src/app/learn/matematica/` or `tests/`) | New | Render regression for card contract |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Count drifts from actual rendered concepts | Low | Uses same `node.concepts.length` array as `TheoryCard.tsx` — identical source |
| Content rename breaks assertion | Low | Grepped: no test asserts "División larga de polinomios" |
| Pluralization edge case (1 concept) | Low | Single ternary; `potencias_raices` has 7, common case is plural |

## Rollback Plan

Revert the two-file change (JSX block + JSON title string). No migrations, no schema changes, no stateful side effects.

## Dependencies

- None.

## Success Criteria

- [ ] Cards show title + "N tema(s)" — no first subtopic visible
- [ ] "Operaciones con polinomios" reads "3 temas" (not "1. Suma y resta…")
- [ ] Third concept reads "3. División de polinomios" (renamed)
- [ ] Card remains a single clickable `Link`
- [ ] New render test passes covering pluralization and absence of subtopic
- [ ] Existing tests unaffected (`pnpm run test`, `pnpm run typecheck`, `pnpm run build`)
