# Proposal: Practice Theory Disclosures

## Intent

Fix empty theory disclosure buttons in `/practice` U2. `TheoryCard` currently shows `+ Ver notación` and `+ Ver errores comunes` even when normalized arrays are empty, creating a broken learning affordance. The change makes empty disclosure content valid, hides empty controls, and adds useful U2 disclosure content only where it has pedagogical value.

## Proposal Assumptions

- Issue #37 accepts both hiding empty sections and authoring concise content where natural.
- Shared `TheoryCard` behavior applies to `/practice` and `/learn`.

## Scope

### In Scope
- Relax theory validation so empty `notation` / `commonMistakes` arrays are valid optional disclosure content.
- Render each disclosure button only when its corresponding array has entries.
- Add concise U2 node-level `notation`, `commonMistakes`, and matching prompts where source content supports it.
- Add/update tests for validator, `TheoryCard`, and U2 content coverage.

### Out of Scope
- U1/U3 content changes.
- Evaluators, metrics, recommendations, exercise bank, challenge bank.
- New teacher-panel behavior or “digital teacher” copy.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `guided-practice`: practice theory disclosures MUST not render empty buttons and MUST render populated disclosure sections.
- `theory-paragraph-model`: lifted U2 disclosure content MUST preserve source math/copy intent and Ingenium voice constraints when derived from concept blocks.

## Approach

Use the combined exploration recommendation. First update the domain contract and tests: `validateTheoryNode` accepts empty optional arrays while preserving required `canonicalTrace`, `id`, and `concepts` checks. Then gate `TheoryCard` disclosure controls by array length. Finally author U2 disclosure arrays only for nodes with natural source material, leaving definitional nodes empty/absent. Follow ADR foundation expectations from `docs/sdd/13-adr-foundation.md`: pure domain logic remains framework-free.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/models/theory.ts` | Modified | Optional disclosure arrays become valid when empty. |
| `src/components/practice/TheoryCard.tsx` | Modified | Hide empty disclosure controls; preserve populated path. |
| `content/matematica/theory/unit-2.json` | Modified | Add useful node-level disclosure content selectively. |
| `src/domain/__tests__/catalog-content.test.ts` | Modified | Clarify/extend U2 optional-array and coverage expectations. |
| `src/components/practice/__tests__/TheoryCard.test.tsx` | Modified | Assert hide/show disclosure behavior. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Validator relaxation masks malformed content | Low | Keep array type checks and required node invariants. |
| Authored U2 content drifts from source concepts | Medium | Lift concise source-backed content; avoid synthetic filler. |
| Shared `TheoryCard` changes regress `/learn` | Low | Test both empty and populated render paths. |

## Rollback Plan

Revert the proposal implementation commit(s): restore strict validator checks, unconditional disclosure rendering, and remove U2 node-level disclosure arrays. U1/U3 content remains untouched.

## Dependencies

- Issue #37 acceptance context.
- Existing `guided-practice` and `theory-paragraph-model` specs.
- `docs/sdd/13-adr-foundation.md` architecture guidance.

## Success Criteria

- [ ] Empty U2 disclosure arrays no longer produce visible empty buttons.
- [ ] Populated U1/U3 and selected U2 disclosures still render with bullets.
- [ ] U2 content additions respect Ingenium support-material voice.
- [ ] `pnpm run test`, `pnpm run typecheck`, and `pnpm run build` pass.
