# Design: Conjuntos Numericos Practice Expansion

## Technical Approach

Keep the domain/UI boundary intact: `src/domain/` owns validation, catalog query, taxonomy, evaluation, and feedback resolution with no React/Next/Supabase imports; `src/components/**` only renders domain outputs. Practice content should move toward per-skill files to avoid a 40+ item monolith, with PR#1 adding a loader composition path while preserving current imports.

Content flow:

```text
content/matematica/exercises*.json ─→ loadCatalog/validateExercise ─→ queryBySkill
content/matematica/feedback/unit-1*.json ─→ loadFeedbackContent ─→ generateFeedback
ExerciseCard/FeedbackDisplay ─→ RichText ─→ parseRichTextSegments ─→ KaTeXBlock
```

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| Content layout | Prefer `content/matematica/exercises/conjuntos-numericos.json` and `feedback/unit-1-conjuntos-numericos.json`, merged by `content-loaders.ts`; fallback is appending to current files. | Keep one large JSON forever. | Single-skill density is high; per-skill files improve review/revert safety while requiring only a small loader merge. |
| Render fix | Replace bare `√` in existing prompts with `$\sqrt{2}$` and `$\sqrt{-4}$`; add validation guard. | Redesign `RichText`. | Bug is content markup plus missing guard; KaTeX already renders roots correctly. |
| Metadata | Add optional `category?: PracticeCategory` and `tags?: readonly PracticeTag[]`; keep `difficulty` as existing required field. | Encode category in IDs only. | Optional fields preserve compatibility; bank-level validation can require them for this skill. |
| Feedback | Keep current `errorTag` mapping; add optional `feedbackKey`/index metadata only if needed for lookup docs. | Per-exercise bespoke engine. | Existing `generateFeedback` is enough; the bank validator can require every referenced tag has a mapping. |

## Root Render Fix

The bypass occurs in `src/components/math/rich-text-parser.ts`: only `/\$([^$]+)\$/g` at line 5 becomes math; line 19 and line 27 push all other text as `{kind:"text"}`. `RichText.tsx` line 24 renders those segments as plain `<span>`, so `content/matematica/exercises.json` lines 46 and 59 render `√` outside KaTeX.

PR#1 changes only the two prompts to `$\sqrt{2}$` and `$\sqrt{-4}$`. Add a domain-side `validatePracticeBank` or `validateRenderSafeText` helper that scans prompt/options/pedagogicalNote/feedback messages after splitting with `parseRichTextSegments`; if any text segment contains `√`, `∈`, `⊂`, or fraction-like `\d+/\d+`, return a validation error naming exercise ID and field. In UI/parser tests, add `src/components/math/__tests__/conjuntos-render-safety.test.ts` asserting the existing 5 parsed exercises contain no bare `√` text segment.

## Interfaces / Contracts

```ts
type PracticeCategory = "pertenencia" | "clasificacion" | "racionales-vs-irracionales" | "decimales" | "mapa-inclusion" | "errores-comunes";
interface Exercise { category?: PracticeCategory; tags?: readonly string[]; }
function validatePracticeBank(exercises: readonly Exercise[], feedback: readonly FeedbackMapping[]): ValidationError[];
```

For `mat.u1.conjuntos_numericos`, `validatePracticeBank` MUST require category, difficulty 1–5, ≥40 items, category minimums, basic/intermediate/challenging per category, mandatory numbers, N-without-zero convention, render safety, known taxonomy tags, and feedback coverage.

## Bank Organization

Full exercise IDs should remain compatible with the catalog prefix, e.g. `ex.u1.conjuntos_numericos.cn-per-01`; PR#1 must relax `ExerciseId`/regex from numeric-only final segment to stable slug segment, or add `bankCode` if the team chooses not to change the base ID spec.

| Prefix | Category |
|---|---|
| `cn-per-NN` | pertenencia/inclusion |
| `cn-cla-NN` | clasificacion |
| `cn-rvi-NN` | racionales-vs-irracionales |
| `cn-dec-NN` | decimales |
| `cn-map-NN` | mapa de inclusion |
| `cn-err-NN` | errores comunes |

## Feedback Library

Add an index comment/object near the top of the feedback source mapping misconception tags to feedback keys. Misconception keys: `feedback.cn.err.decimal_no_es_siempre_irracional`, `toda_raiz_no_es_irracional`, `racional_tambien_es_real`, `pertenencia_vs_inclusion`, `entero_no_siempre_natural`, `negativo_puede_ser_racional`, `decimal_periodico_es_racional`, `raiz_cuadrada_exacta_es_racional`. Each message should explain the principle in 1–3 sentences and reference current tags or new `u1_*` tags. Each new exercise references one key through `commonErrorTags`/`tags`; full text is written during apply.

## File Changes

| File | Action | Description |
|---|---|---|
| `content/matematica/exercises.json` | Modify | PR#1 root fix; optional fallback append target. |
| `content/matematica/exercises/conjuntos-numericos.json` | Create | Preferred new bank items. |
| `content/matematica/feedback/unit-1.json` | Modify | Root-related feedback markup and shared mappings. |
| `content/matematica/feedback/unit-1-conjuntos-numericos.json` | Create | Preferred new feedback mappings/index. |
| `src/domain/models/exercise.ts` | Modify | Optional category/tags and optional slug ID support. |
| `src/domain/catalog/content-loaders.ts`, `src/domain/catalog/index.ts` | Modify | Merge per-skill content; call bank validator. |
| `src/domain/error-taxonomy/index.ts` | Modify | Add missing `u1_*` misconception tags. |
| `src/components/math/__tests__/*`, `src/domain/__tests__/*` | Create/Modify | Render, bank, feedback, catalog coverage tests. |

## Phased Delivery

PR#1: render fix + optional metadata/loader/validator base + regression tests (~150–300 lines). PR#2: `cn-per-01..08` + `cn-map-01..04` and feedback tests (~300–400). PR#3: `cn-cla-01..12` (~300–400). PR#4: `cn-rvi-01..08` + `cn-dec-01..06`, including `{,}` decimal convention snapshots (~350–400). PR#5: `cn-err-01..06`, readiness update if needed, final verify (~150–250). Each PR is independently revertable; PR#1 is safest to keep because optional metadata and markup fixes are backward compatible.

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit | render parser, KaTeX roots/fractions/decimals | RED → GREEN parser scan + selected render snapshots |
| Domain | `validateExercise`, `validatePracticeBank`, taxonomy, feedback mappings | bank fixtures and real content assertions |
| Integration | catalog query/readiness/feed generation | query by skill/difficulty and resolve each referenced feedback tag |
| Visual | desktop/mobile roots and decimals | recommended smoke check, non-blocking CI |

Per PR: `pnpm run test`, `pnpm run typecheck`, `pnpm run build`.

## Migration / Rollout

No data migration required. Roll out through five stacked PRs to main under the 400-line budget.

## Open Questions

- [ ] Whether to relax exercise ID final segment to `cn-*-NN` or preserve numeric IDs and add `bankCode`.
