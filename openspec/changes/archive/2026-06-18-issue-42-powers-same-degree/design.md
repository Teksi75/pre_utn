# Design: Powers of Same Degree — Pedagogical Bridge

## Technical Approach

Content-only change. The `bodyParagraphs` model, `TheoryCard` renderer, `validateWorkedExample`, and feedback library are all landed in main. We write deeper paragraphs for one concept (`concept-fac-potencias-igual-grado`), add 3 worked examples for Caso 6, and add 1 feedback mapping reusing the existing `u2_ruffini_signo_a` tag. No model, parser, renderer, or evaluator changes.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Error tag strategy | Reuse `u2_ruffini_signo_a` | New `u2_ruffini_raiz_no_monica` tag + detector (~50-60 lines) | Proposal assumption #2. Saves lines; feedback message carries the Caso 6-specific pedagogy. |
| Example count | 3 (Ruffini, disminución, diferencia) | 2 (minimum per issue) | Covers both methods + diferencia branch. Fits forecast. |
| Body math examples | Monic (`x+2 ⇒ x=-2`) AND non-monic (`2x+3 ⇒ x=-3/2`) | Non-monic only | Owner comment uses monic case; issue uses non-monic. Both needed for the bridge. |
| Voice validation | Extend existing `copy-strings-acceptance.test.ts` | Manual-only check | Automates the Ingenium voice gate. Existing test already checks forbidden strings in specific files. |

## Data Flow

No runtime data flow change. Content files are loaded by existing loaders at build time:

```
content/matematica/theory/unit-2.json  ──→  loadTheoryContent()  ──→  TheoryCard
content/matematica/examples/unit-2.json ──→  loadExampleContent() ──→  ExampleCard
content/matematica/feedback/unit-2.json ──→  loadFeedbackContent() ──→  FeedbackCard
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `content/matematica/theory/unit-2.json` | Modify | Expand `concept-fac-potencias-igual-grado.bodyParagraphs` from 2 to 6 entries |
| `content/matematica/examples/unit-2.json` | Modify | Add 3 worked examples: `example-factorizacion-3` (Ruffini), `example-factorizacion-4` (disminución), `example-factorizacion-5` (diferencia) |
| `content/matematica/feedback/unit-2.json` | Modify | Add 1 mapping for `u2_ruffini_signo_a` → recovery target `example-factorizacion-3` |
| `src/domain/__tests__/copy-strings-acceptance.test.ts` | Modify | Add content files to forbidden-strings check; add voice assertions for new theory/examples copy |

## Interfaces / Contracts

### bodyParagraphs (existing shape — no change)

```json
{
  "id": "concept-fac-potencias-igual-grado",
  "title": "6. Suma o diferencia de potencias de igual grado",
  "bodyParagraphs": ["paragraph1", "paragraph2", "..."]
}
```

Each string is a complete paragraph. KaTeX inline via `$...$`. Visual paragraph breaks decided by renderer.

### WorkedExample (existing shape — validated by `validateWorkedExample`)

```typescript
{
  id: string;              // "example-factorizacion-3"
  skillId: SkillId;        // "mat.u2.factorizacion"
  problem: string;
  steps: [{ order: 1..n, explanation: string }];
  finalAnswer: string;
  pedagogicalNote: string;
  canonicalTrace: [{ path, section, sourceUse, pedagogicalIntent }];
}
```

Requirements: ≥2 steps, sequential order starting at 1, non-empty `finalAnswer`, ≥1 `canonicalTrace` entry.

### Feedback mapping (existing shape)

```json
{
  "errorTag": "u2_ruffini_signo_a",
  "type": "corrective",
  "message": "...",
  "recoveryTarget": "example-factorizacion-3"
}
```

No `skillId` field in current feedback entries (spec listed it aspirationally; actual JSON omits it). Follow actual shape.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `validateWorkedExample` passes for 3 new examples | Existing `catalog-content.test.ts` runs validation on all examples |
| Unit | Theory node schema valid | Existing U2 theory normalization tests in `catalog-content.test.ts` |
| Unit | Forbidden strings absent from new content | Extend `copy-strings-acceptance.test.ts` |
| Integration | `pnpm run test` green | All existing + new assertions |
| Build | `pnpm run typecheck && pnpm run build` green | 7 routes build |

## Migration / Rollout

No migration required. Content files are loaded at build time. The new paragraphs/examples/feedback render immediately on the next deployment.

## Open Questions

None — all decisions resolved in proposal assumptions.

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| KaTeX escaping breaks on complex inline math (`$a^n \pm b^n$`, `$2x + 3 = 0$`) | Reuse exact patterns from already-migrated U2 concepts (e.g., `concept-ruffini-signo` uses `$x+a$`) |
| Worked example validation fails (missing field, wrong step order) | Run `validateWorkedExample` mentally before committing; existing `catalog-content.test.ts` catches it |
| Voice drift into forbidden Ingenium patterns | `copy-strings-acceptance.test.ts` extended to cover `content/matematica/` files |

## Out of Scope

- **No new base exercises** for `mat.u2.factorizacion` — 4-exercise contract preserved
- **No new challenge exercise** — scope guardrail
- **No new error tag** — `u2_ruffini_signo_a` reused
- **No new detector** in `src/domain/evaluator/error-tagging.ts`
- **No changes** to `openspec/specs/math-exercise-catalog/spec.md`
- **No model/parser/renderer changes**

## Commits Plan (orientative)

1. **`theory: expand concept-fac-potencias-igual-grado bodyParagraphs`** — only `content/matematica/theory/unit-2.json`
2. **`examples: add 3 worked examples for factorizacion caso 6`** — only `content/matematica/examples/unit-2.json`
3. **`feedback: add caso-6 ruffini-raiz mapping + voice test`** — `content/matematica/feedback/unit-2.json` + `src/domain/__tests__/copy-strings-acceptance.test.ts`

Each commit passes `pnpm run typecheck && pnpm run test` independently.
