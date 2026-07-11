# Design: Align U3 Practice with Official Exercises

## Technical Approach

Extend catalogs and pure loaders without changing the practice UI or evaluator dispatch. Base exercises remain difficulty 1–4; nine additive U3 challenges are difficulty 5. Replace the oversized S0 with four independently reviewable foundation units. For absolute-value equations, S2 deliberately creates the leaf, theory, and P8g worked-example scaffold; S3 completes that scaffold with two further worked examples, base exercises, and its challenge. This is sequencing, not a scope change. S11 remains the only final exact-nine integration audit.

## Architecture Decisions

| Decision | Choice and rationale |
|---|---|
| Base trace boundary | Define `ExerciseCanonicalTrace` and `ExerciseSourceUse = "reference" \| "adapted" \| "reinforcement"` in `src/domain/models/exercise.ts`; `Exercise.canonicalTrace` uses that type, not shared `CanonicalTrace`. `content-loaders.ts` runtime-parses and rejects every other literal. This prevents challenge-only sources from leaking onto base exercises without widening a shared union. |
| Trace filesystem safety | The Node-only validator in `src/lib/trace-path.ts` resolves against the repository root, rejects absolute/out-of-root traversal, then checks existence. S11 consumes it; bare file existence is insufficient because a trace must reference repository material. |
| P37/P38 comparator | Apply family/order precedence only when **both** operands have `skillId === "mat.u3.logaritmicas"`, an allowed parsed family, and finite numeric order. Rank expansion before combining, then order; otherwise retain difficulty/ID fallback. This preserves every unrelated or malformed legacy comparison. |
| Compatibility evidence | S0a proves the new optional base-exercise trace contract remains assignable through the existing rendering and evaluator surfaces, with compile-time and runtime tests in addition to parser rejection tests. S0d freezes all 42 pre-change IDs in literal `as const` fixtures and passes them through production persistence deserializers/load paths, so stored-state compatibility is demonstrated. |
| Final audit boundary | S0a–S0d provide contracts only; S1–S10 own their content anchors. S11 alone turns the exact-nine/no-bleed/trace/compatibility audit GREEN. |

## Review Work Units

16 stacked-to-main units, estimated **>=5,230 changed lines**; every unit is <=400 lines and has its own RED→GREEN→REFACTOR evidence.

| Unit | Budget | Exact responsibility |
|---|---:|---|
| S0a | 360 | Exercise-only per-surface trace model/type and pure parser; preserve rendering and evaluator compatibility; compile-time plus runtime parser, surface, and source-literal rejection tests. |
| S0b | 240 | Repository-root-contained Node trace-path validator and traversal/absolute-path tests. |
| S0c | 260 | Validated progression metadata parser and pair-scoped U3 logarithm comparator tests. |
| S0d | 340 | Unsupported challenge-type rejection, inert audit scaffold, and four immutable 42-ID compatibility fixtures exercised by real persistence parsers. |
| S1a | 320 | Linear P1l (`√10/5`) base exercise and its own difficulty-5 linear challenge, with scoped rational/irrational feedback and no-bleed tests. |
| S1b | 380 | Quadratic P5d, P6b, and P6f base exercises plus its own difficulty-5 quadratic challenge, detector/feedback, and no-bleed tests. |
| S2 | 250 | Create the `ecuaciones_valor_absoluto` leaf, theory, P8g worked-example scaffold, and scoped feedback tags; no base exercises or challenge. |
| S3 | 380 | Add the other two absolute-value worked examples plus P8 base exercises and the owned challenge, completing the spec requirement of at least three worked examples. |
| S4–S9 | <=380 each | Existing per-skill, own-anchor content work. |
| S10 | 320 | Tag/feedback/detector cleanup and compatibility integration. |
| S11 | 320 | Final exact-nine, no-bleed, root-contained trace, and compatibility audit. |

## Data Flow

```
raw base exercise → S0a per-surface model/parser → catalog → renderer/evaluator compatibility tests
raw metadata → S0c validated comparator → sorted catalog
trace path → S0b repo-root validator → S11 audit
42 frozen fixtures → production persistence parsers → S10/S11 regression evidence
```

S11 audits immutable IDs for `ecuaciones_lineales`, `ecuaciones_cuadraticas`, `ecuaciones_valor_absoluto`, `inecuaciones_valor_absoluto`, `inecuaciones_producto_cociente`, `recta`, `sistemas`, `exponenciales`, and `logaritmicas`; it preserves `traduccion_lenguaje_verbal.desafio-01/-02`. Anchors are P1l (`√10/5`), P5d/P6b/P6f, P8g/P8b, P9n, P9v, P21, P28, P39e/h, and P40l. Traces target `material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf` within the repository root.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/domain/models/exercise.ts` | Modify | Exercise-only trace contract and progression metadata. |
| `src/domain/catalog/content-loaders.ts` | Modify | Runtime base-trace and metadata parsing. |
| `src/lib/trace-path.ts` | Modify | Root-contained trace validation. |
| `src/domain/catalog/index.ts` | Modify | Strict pair-scoped logarithm comparator. |
| `src/lib/challenges/loader.ts` | Modify | Unsupported-type rejection and scoped audit scaffold. |
| `content/matematica/challenges/unit-3.json` | Modify | Nine immutable challenge IDs and anchors. |
| `tests/fixtures/compatibility/u3-*-baseline.ts` | Create | Four literal fixtures containing all 42 pre-change IDs. |
| `tests/__tests__/u3-s0a-trace.test.ts` | Modify | S0a type/runtime parsing, source rejection, and rendering/evaluator compatibility coverage. |
| `tests/__tests__/u3-s0*.test.ts` | Create | Focused S0b–S0d tests, including real persistence-parser loading. |

## Testing Strategy

S0a proves per-surface compile-time separation, runtime source rejection, and that existing renderer/evaluator entry points accept exercises carrying the optional trace contract. S0b proves valid in-root material succeeds and missing, absolute, and escaping paths fail. S0c proves precedence only for two qualified U3-log operands plus all fallback cases. S0d proves each frozen fixture is accepted by production persistence parsers. S11 proves exact nine, difficulty 5, multiple choice, #82/#83 exclusions, root-contained traces, and all compatibility regressions. Run `pnpm run test`, `pnpm run typecheck`, and `pnpm run build` in S11.

## Migration / Rollout

No migration required: new fields are optional and IDs are additive.

## Open Questions

None.
