# Proposal: Expand Factorization Worked Examples

## Intent

Give students a progressive, readable worked-example path through all seven canonical factorization cases. The current five-example set overrepresents equal-degree powers, omits four cases, and can be clipped by fixed-height disclosures. This follows the content-first architecture in `docs/sdd/13-adr-foundation.md` and preserves one canonical source for Learn and Practice.

## Scope

### In Scope
- Expand `mat.u2.factorizacion` to nine validated examples covering all seven canonical cases in pedagogical order.
- Preserve existing example IDs and the three Case 6 examples; add explicit final results, checks, traceability, and focused error notes.
- Remove fixed-height clipping from collection and solution disclosures.
- Add focused domain/component tests and desktop/375px verification.

### Out of Scope
- Exercise, evaluator, feedback-routing, or mastery changes.
- Selectable/skippable Practice examples or other flow redesign.
- New content models or duplicated Learn/Practice content.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `theory-paragraph-model`: Broaden the factorization worked-example contract from the three preserved Case 6 examples to nine total examples with complete seven-case coverage, progression, shared consumption, and unclipped disclosure.

## Approach

Add four canonical examples for common factor, grouping, perfect cube, and quadratic trinomial. Reorder the nine entries by conceptual progression without renumbering IDs. Keep `loadExampleContent` as the shared Learn/Practice source. Replace pixel ceilings with content-sized conditional disclosure. Implement RED→GREEN→REFACTOR using semantic invariants rather than copy snapshots.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `content/matematica/examples/unit-2.json` | Modified | Four examples and progressive ordering |
| `src/domain/__tests__/factorizacion-worked-examples.test.ts` | New | Coverage, order, IDs, shape, final-result invariants |
| `src/components/practice/WorkedExamplesSection.tsx` | Modified | Unbounded collection disclosure |
| `src/components/practice/WorkedExampleCard.tsx` | Modified | Unbounded solution disclosure |
| `src/components/practice/__tests__/` | Modified | Disclosure regression coverage |
| `tests/e2e/specs/factorizacion.spec.ts` | Modified | Shared content and responsive legibility checks |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Nine examples delay exercises | Medium | Preserve current flow; defer navigation redesign |
| Reordering breaks index-based assumptions | Low | Audit consumers; test stable identity |
| Wide math overflows mobile | Medium | Keep expressions concise; verify at 375px |

## Rollback Plan

Revert the content, tests, and disclosure changes together; stable IDs and unchanged models avoid data migration.

## Dependencies

- Canonical Unit 2, Chapter 13 material.
- Existing `WorkedExample` validation and shared loader.

## Success Criteria

- [ ] Nine valid examples cover Cases 1–7 progressively while IDs `example-factorizacion-1` through `-5` remain stable.
- [ ] Learn and Practice consume the same ordered collection.
- [ ] Full collections and solutions remain readable on desktop and 375px mobile without fixed-height clipping.
- [ ] Focused tests, `pnpm run test`, typecheck, and build pass.
