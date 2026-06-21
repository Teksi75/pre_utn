# Design: Practice Theory Disclosures

## Technical Approach

Make disclosure content optional at the domain contract boundary while keeping required learning content strict. `TheoryCard` will render each disclosure affordance only when the matching array has entries. Unit 2 content will then be enriched selectively from existing concept warnings/notation where it improves practice, otherwise arrays stay empty/absent and no control appears.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Empty optional arrays | `validateTheoryNode` accepts `notation: []` and `commonMistakes: []`; `concepts`, `id`, and `canonicalTrace` remain required. | Keep validator strict and force filler; make fields nullable. | Empty arrays already normalize safely in `content-loaders.ts`; allowing them models “no valuable disclosure” without weakening core theory traceability. |
| UI visibility rule | Gate notation and common-mistake button/list blocks with `node.notation.length > 0` and `node.commonMistakes.length > 0`. | Disabled buttons; render empty collapsed lists. | The spec requires no empty or disabled controls by default; independent gates support mixed cases. |
| U2 authoring | Lift only source-backed/value-backed entries from `unit-2.json` concept blocks, preserving explicit warnings verbatim when used. | Add generic tips to every node. | The product decision is pedagogical: the button exists only when there is real support content, not to satisfy layout symmetry. |
| Test order | Write failing domain/component/content tests first. | Patch implementation directly. | Repo rules require TDD for domain/evaluator-like validation; failing tests pin the behavior before relaxing validation. |

## Data Flow

```text
content/matematica/theory/unit-2.json
  -> parseTheoryNode/loadTheoryContent (normalizes missing arrays to [])
  -> validateTheoryNode (empty optional disclosures valid)
  -> TheoryCard
       ├─ notation.length > 0 -> render notation control + list
       └─ commonMistakes.length > 0 -> render mistakes control + list
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/__tests__/theory.test.ts` | Modify | Add RED case accepting empty disclosure arrays and update old rejection expectations. Keep missing `concepts`/`canonicalTrace` failures. |
| `src/domain/models/theory.ts` | Modify | Relax `validateTheoryNode` so `notation`/`commonMistakes` must be arrays if present by type, but may be empty. |
| `src/components/practice/__tests__/TheoryCard.test.tsx` | Modify | Add static-render tests for populated notation, empty notation hidden, and mixed common-mistakes-only behavior. |
| `src/components/practice/TheoryCard.tsx` | Modify | Wrap each disclosure button and animated list in an independent length guard. |
| `src/domain/__tests__/catalog-content.test.ts` | Modify | Add U2 tests proving empty optional arrays validate and at least selected source-backed U2 nodes expose populated disclosures. |
| `content/matematica/theory/unit-2.json` | Modify | Add selective `notation`, `commonMistakes`, and/or `practicePrompts` where existing concepts provide meaningful source material. |
| `src/domain/__tests__/copy-strings-acceptance.test.ts` | Modify | Reuse/extend the existing Unit 2 content voice gate if new disclosure text needs issue-specific coverage. |

## Interfaces / Contracts

No new public interfaces. `TheoryNode` keeps readonly arrays:

```ts
readonly notation: readonly string[];
readonly commonMistakes: readonly string[];
```

Contract change: empty arrays mean “hide that disclosure”; populated arrays mean “show the disclosure control and entries.”

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `validateTheoryNode` accepts empty optional disclosures but rejects missing core content. | Vitest TDD in `src/domain/__tests__/theory.test.ts`. |
| Component | `TheoryCard` hides empty controls and renders populated controls independently. | `renderToStaticMarkup` string assertions; no jsdom dependency. |
| Content | U2 loading/validation and selective disclosure coverage. | `loadTheoryContent("unit-2")` assertions plus source-backed node checks. |
| Voice guard | New U2 strings avoid forbidden tutor/personalization claims. | Existing `copy-strings-acceptance.test.ts`; extend only if needed. |
| Verification | Whole app remains sound. | `pnpm run test`, `pnpm run typecheck`, `pnpm run build`. |

## Migration / Rollout

No migration required. Static JSON and pure validation/rendering behavior change together in one SDD implementation slice.

## Open Questions

None.
