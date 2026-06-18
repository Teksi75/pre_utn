# Design: Theory Text Readability — Aprender + Práctica

## Technical Approach

Additive hybrid model: extend `ConceptBlock` with optional `bodyParagraphs: readonly string[]`, parse it in `content-loaders.ts`, render per-paragraph `<RichText>` in `TheoryCard`. Legacy `body` path preserved for unmigrated concepts. 3 Ruffini concepts in `unit-2.json` migrate in the same change. Each paragraph is independently KaTeX-safe because `parseRichTextSegments` runs per chunk.

## Architecture Decisions

| Decision | Option A | Option B | Choice | Rationale |
|----------|----------|----------|--------|-----------|
| Model shape | `body: string \| string[]` (union) | `bodyParagraphs?: readonly string[]` (additive) | **B — additive** | Non-breaking; `unit-1.json` untouched; type narrowing is clean `if (arr?.length)` |
| Parser validation | Skip empty strings silently | Fail on empty string element | **Fail** | Empty paragraph is authoring error; fail-fast prevents invisible rendering bugs |
| Component rendering | `body.split("\n\n")` heuristic | Explicit `bodyParagraphs` array | **Array** | Author-controlled; no regex math-boundary risk; TDD-friendly |
| Content migration | Keep `body` + add `bodyParagraphs` (drift risk) | Drop `body` on migrated concepts | **Drop `body`** | Prevents dual-source drift; parser enforces exactly one source |
| Paragraph spacing | Inline `mt-2` per `<p>` | `space-y-2` on wrapper div | **`space-y-2` wrapper** | Consistent with existing `space-y-3` pattern on concept cards; Tailwind-idiomatic |

## Data Flow

```
unit-2.json                    content-loaders.ts              TheoryCard.tsx
─────────────                  ──────────────────              ──────────────
{ bodyParagraphs: [...] }  →  parseConceptBlock()          →  concept.bodyParagraphs?.length
                                 ├─ validates non-empty          ? bodyParagraphs.map(p =>
                                 ├─ each element is string          <div><RichText text={p} /></div>)
                                 └─ sets bodyParagraphs          : <RichText text={concept.body} />
                                     OR body (legacy)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/models/theory.ts` | Modify | Add `bodyParagraphs?: readonly string[]` to `ConceptBlock` |
| `src/domain/__tests__/theory.test.ts` | Modify | Add tests: concept with `bodyParagraphs`, legacy `body`, empty array rejection |
| `src/domain/catalog/content-loaders.ts` | Modify | `parseConceptBlock`: read `bodyParagraphs`, validate each element non-empty |
| `src/components/practice/TheoryCard.tsx` | Modify | Render loop: prefer `bodyParagraphs` → `<div>` per chunk; else legacy `<div>` |
| `content/matematica/theory/unit-2.json` | Modify | Migrate 3 Ruffini concepts: replace `body` with `bodyParagraphs` array |

## Interfaces / Contracts

```typescript
// src/domain/models/theory.ts — ConceptBlock extension
export interface ConceptBlock {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly bodyParagraphs?: readonly string[];  // NEW
  readonly intervalRepresentations?: readonly IntervalRepresentation[];
}
```

```typescript
// src/domain/catalog/content-loaders.ts — parseConceptBlock changes
function parseConceptBlock(raw: Record<string, unknown>, parentId: string, index: number): ConceptBlock {
  const id = typeof raw.id === "string" ? raw.id : `${parentId}-concept-${index}`;
  const body = parseStringField(raw, "body", id);

  // NEW: parse optional bodyParagraphs
  const bodyParagraphsRaw = raw.bodyParagraphs;
  let bodyParagraphs: readonly string[] | undefined;
  if (Array.isArray(bodyParagraphsRaw)) {
    bodyParagraphs = bodyParagraphsRaw.map((p, i) => {
      if (typeof p !== "string" || p.trim().length === 0) {
        failParse(`bodyParagraphs[${i}]`, id, "expected non-empty string");
      }
      return p;
    });
  }

  return {
    id,
    title: parseStringField(raw, "title", id),
    body,
    ...(bodyParagraphs ? { bodyParagraphs } : {}),
    intervalRepresentations: parseOptionalIntervalRepresentations(raw, "intervalRepresentations", id),
  };
}
```

```typescript
// src/components/practice/TheoryCard.tsx — rendering change (lines 62-64)
// Before:
<div className="mt-1 text-sm text-brand-700 leading-[var(--leading-relaxed)]">
  <RichText text={concept.body} />
</div>

// After:
<div className="mt-1 text-sm text-brand-700 leading-[var(--leading-relaxed)]">
  {concept.bodyParagraphs && concept.bodyParagraphs.length > 0 ? (
    <div className="space-y-2">
      {concept.bodyParagraphs.map((p, i) => (
        <div key={i}><RichText text={p} /></div>
      ))}
    </div>
  ) : (
    <RichText text={concept.body} />
  )}
</div>
```

## Content Migration (unit-2.json)

3 concepts migrate from `body` to `bodyParagraphs`. Each preserves exact text and math expressions (`$P(x)$`, `$(x−a)$`, `$P(a)$`).

| Concept ID | Paragraphs | Math chunks |
|------------|------------|-------------|
| `concept-ruffini-procedimiento` | 2: (1)-(4) steps + remainder/quotient explanation | `$P(x)$`, `$(x−a)$` |
| `concept-teorema-resto` | 3: definition + factor implication + example | `$P(a)$`, `$(x−a)$`, `$P(x)=x³−2x+1$` |
| `concept-ruffini-signo` | 2: sign error warning + verification rule | `$(x−a)$`, `$(x+a)$`, `$−a$` |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Domain model | `ConceptBlock` with `bodyParagraphs` passes validation | `theory.test.ts`: construct node with `bodyParagraphs`, assert `validateTheoryNode` ok |
| Domain model | Legacy `body`-only concept still valid | `theory.test.ts`: existing test unchanged (regression guard) |
| Parser | `parseConceptBlock` reads `bodyParagraphs` array | New test in `theory.test.ts` or dedicated `content-loaders.test.ts`: raw object with `bodyParagraphs`, assert parsed correctly |
| Parser | Empty string in `bodyParagraphs` throws | Assert `failParse` on `bodyParagraphs[1] = ""` |
| Component | `TheoryCard` renders N paragraph block wrappers for N paragraphs | `TheoryCard.test.tsx`: mock node with `bodyParagraphs`, assert paragraph block count (uses `<div>` not `<p>`) |
| Component | Legacy `body`-only renders `<RichText>` | Existing behavior preserved (regression) |
| KaTeX | Math expressions render in each paragraph chunk | `katex-rendering.test.ts`: run against migrated content; or manual verify phase |

## Migration / Rollout

No migration required. Change is additive to domain model; existing `unit-1.json` concepts with only `body` continue to work via legacy path. The 3 Ruffini concepts in `unit-2.json` switch from `body` to `bodyParagraphs` in the same commit.

## Open Questions

- [x] Should `body` be dropped on migrated concepts? → **Yes**, to prevent drift. Parser enforces exactly one source.
- [ ] Should `validateTheoryNode` enforce that a concept has either `body` (non-empty) or `bodyParagraphs` (non-empty), but not neither? → Recommend yes, but current validator doesn't reach into body shape. Defer to parser for now; flag for follow-up if needed.
