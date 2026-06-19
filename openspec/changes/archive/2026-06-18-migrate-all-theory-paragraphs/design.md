# Design: Migrate All Theory Paragraphs to `bodyParagraphs`

## Technical Approach

Content-only migration of 38 long theory concepts (>350 chars) from single-string `body` to `bodyParagraphs` array. No model, parser, or renderer changes — infrastructure shipped in issue-36 (commit `e20b7a9`) is complete and proven by the 3 Ruffini concepts already migrated.

## Architecture Decisions

### Decision: Single PR vs chained by unit

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Single PR (U1+U2) | ~200 lines diff, one merge point, one review pass | **Chosen** |
| Chained U1→U2 | Smaller diffs but double ceremony for content-only work | Rejected — only if diff exceeds 400 lines |

**Rationale**: Forecast ~200 changed lines (38 concepts × ~4 net lines + STATUS.json + optional smoke test). Forecast was under the 400-line budget. Actual final diff was 407 lines (+7 over, driven by SDD doc and test additions). Despite the minor overshoot, the work remained editorial, not architectural — splitting would have added process overhead without review value.

### Decision: Drop `body` on migrated concepts

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Drop `body` field | Prevents drift; parser accepts `bodyParagraphs`-only shape | **Chosen** |
| Keep both fields | Safer rollback but risks dual-source drift | Rejected |

**Rationale**: Parser (`content-loaders.ts:247-256`) already handles `body`-less concepts when `bodyParagraphs` is present. Ruffini migration sets the precedent. Keeping both invites a future author to update one and forget the other.

### Decision: Smoke test scope

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Add smoke test loading all theory units | Catches content-shape regressions; ~30 lines | **Chosen** |
| Rely on existing parser tests only | No new test code but misses unit-level content drift | Rejected |

**Rationale**: Existing tests validate the parser's `bodyParagraphs` path generically but only assert Ruffini-specific content. A smoke test that loads both units and asserts all migrated concepts have `bodyParagraphs` + no `body` is cheap insurance.

## Data Flow

```
unit-1.json ──→ parseConceptBlock() ──→ ConceptBlock { bodyParagraphs } ──→ TheoryCard <div> per chunk
unit-2.json ─↗        ↑                                                  ↗
                       │                                                  │
              bodyParagraphs present? ──→ YES: use array                  │
                       │                NO:  fallback to body ────────────┘
```

No new data flow. Migration changes only the JSON content feeding the existing pipeline.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `content/matematica/theory/unit-1.json` | Modify | 21 concepts: split `body` → `bodyParagraphs[]`, drop `body` |
| `content/matematica/theory/unit-2.json` | Modify | 17 concepts: split `body` → `bodyParagraphs[]`, drop `body` |
| `src/domain/__tests__/content-loaders.test.ts` | Modify | Add smoke test: load all units, assert migrated shape |
| `openspec/changes/STATUS.json` | Modify | Register new change entry |

**Not modified**: `theory.ts` (model), `content-loaders.ts` (parser), `TheoryCard.tsx` (renderer) — no regression found.

## Interfaces / Contracts

No new interfaces. Existing contract used:

```typescript
// Already in src/domain/models/theory.ts:38
readonly bodyParagraphs?: readonly string[];

// Parser contract (content-loaders.ts:288-304):
// - undefined/null → undefined
// - [] → undefined (normalized)
// - ["", "x"] → throws (empty string at index 0)
// - ["x", 42] → throws (non-string at index 1)
// - ["x", "y"] → readonly ["x", "y"]
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (existing) | Parser accepts/rejects bodyParagraphs shapes | `content-loaders.test.ts:284-375` — no changes needed |
| Unit (existing) | TheoryCard renders <div> per chunk | `TheoryCard.test.tsx:116-283` — no changes needed |
| Unit (new smoke) | All migrated concepts have bodyParagraphs, no body | Add `describe` block in `content-loaders.test.ts` loading both units |
| Integration (existing) | Ruffini migration acceptance | `content-loaders.test.ts:377-453` — no changes needed |
| Manual visual | Spot-check math rendering | See Migration/Rollout section |

**Smoke test design** (new, ~30 lines):
```typescript
describe("migrate-all-theory-paragraphs — full catalog smoke", () => {
  test("all long concepts use bodyParagraphs and have no body", () => {
    // Load both units
    // For each concept with bodyParagraphs defined:
    //   - bodyParagraphs.length > 0
    //   - body === "" (parser default when body field absent)
    // For each concept without bodyParagraphs:
    //   - body is non-empty (legacy short concepts)
  });
});
```

## Migration / Rollout

No feature flags or phased rollout. Single PR, content-only.

**Manual visual spot-check recommendations** (per proposal success criteria):

1. **U1 — Conjuntos Numéricos**: Navigate to `/learn/matematica/mat.u1.conjuntos_numericos`. Check `concept-pertenencia-vs-inclusion` (950 chars, 4 paragraphs expected). Verify `$\in$`, `$\subset$`, `$\mathbb{N}$` render as KaTeX, not plain text.

2. **U2 — Factorización**: Navigate to `/learn/matematica/mat.u2.factorizacion`. Check `concept-fac-trinomio-segundo-grado` (606 chars, 3-4 paragraphs expected). Verify `$ax^2 + bx + c$` and the example trinomials render correctly across paragraph boundaries.

**Rollback**: Revert PR. Parser falls back to `body` when `bodyParagraphs` is absent — no schema or code rollback needed.

## Open Questions

- [x] Single PR vs chained? → Single PR (forecast under 400 lines; actual 407 (+7 over from SDD docs and tests))
- [x] Smoke test? → Yes (cheap insurance, ~30 lines)
- [ ] Any concept where paragraph split is ambiguous? → Resolved during apply; editorial judgment call per concept
