# Design: Add Complex Numbers as Unit 1 Pilot Skill

## Technical Approach

Activate `mat.u1.complejos` by following the existing `logaritmos`/`valor_absoluto` content pipeline: add the pilot entry, static JSON content, taxonomy tags, feedback mappings, and domain tests. No evaluator, UI, route, or dependency graph change is required because the skill ID, prerequisite, downstream Unit 5 dependency, and complex visual theme already exist.

## Architecture Decisions

| Decision | Options considered | Choice and rationale |
|---|---|---|
| Activation model | New module vs existing pilot registry | Add one `PILOT_SKILLS` entry in `src/domain/catalog/pilot-skills.ts`; readiness already derives unit lookup from `PILOT_SKILL_UNIT_MAP`. |
| Answer model | Free text `a+bi`, symbolic, or structured | Use only `multiple-choice`, `true-false`, and `numerical`; numerical asks one scalar at a time (`Re(z)`, `Im(z)`, coefficient, or power-cycle value). This respects AGENTS.md and existing evaluators. |
| Content storage | Dedicated exercise file vs main `exercises.json` | Append to `content/matematica/exercises.json` like `logaritmos`; avoid changing loader registries unless size later justifies a per-skill file. |
| Error tagging | Add detector rules vs declarative feedback only | Add taxonomy + feedback mappings first. Do not modify `error-tagging.ts` unless tests require deterministic tagging for a specific wrong numeric answer. Existing feedback coverage works from `commonErrorTags`. |
| Scope | Basic algebra vs polar/trig | Cover $i$, $i^2=-1$, $a+bi$, equality, operations, conjugate/division, powers of $i$; exclude polar form, Argand plane, De Moivre. |

## Data Flow

```text
PILOT_SKILLS ──→ readiness.ts ──→ learn/practice routes
      │              │
      │              ├─ theory/examples/feedback JSON
      │              └─ queryBySkill() ── exercises.json ── evaluator
      └─ accessibility/prerequisite checks via existing dependency graph
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/domain/__tests__/complejos-domain.test.ts` | Create | RED tests for identity, readiness, content, permitted answer types, feedback, route/prerequisite behavior. |
| `src/domain/catalog/pilot-skills.ts` | Modify | Add `mat.u1.complejos` after `mat.u1.logaritmos`, label `Números complejos`, `unitKey: "unit-1"`. |
| `src/domain/error-taxonomy/index.ts` | Modify | Add 6–8 `u1_complejo_*` tags. |
| `content/matematica/theory/unit-1.json` | Modify | Add `theory-complejos` with 8–10 concepts and mistakes. |
| `content/matematica/examples/unit-1.json` | Modify | Add ≥5 `example-complejos-*` worked examples. |
| `content/matematica/exercises.json` | Modify | Add 10–14 `ex.u1.complejos.N` items with categories and links. |
| `content/matematica/feedback/unit-1.json` | Modify | Map every new tag to theory/examples recovery targets. |
| `src/domain/__tests__/catalog-readiness.test.ts` | Modify | Include complejos in pilot-ready set; remove it from downstream not-ready expectations. |

## Interfaces / Contracts

```ts
const COMPLEJOS_ERROR_TAGS = [
  "u1_complejo_i_definicion",
  "u1_complejo_partes_confusion",
  "u1_complejo_suma_real",
  "u1_complejo_i_cuadrado_signo",
  "u1_complejo_conjugado_signo",
  "u1_complejo_division_sin_conjugado",
  "u1_complejo_potencia_ciclo",
  "u1_complejo_igualdad_parcial",
] as const;
```

Exercise categories should cover: `definicion`, `partes`, `igualdad`, `suma_resta`, `multiplicacion`, `conjugado_division`, `potencias_i`, `error_deteccion`. MC options containing math must use `$...$`; numerical expected answers must be single finite scalars.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit/domain | Pilot registration, prerequisite `reales_operaciones`, readiness, taxonomy lookup | New `complejos-domain.test.ts`, RED before content. |
| Content contract | ≥8 theory concepts, ≥5 examples, ≥10 exercises, all links/tags valid | Mirror `logaritmos-domain.test.ts`; assert no forbidden exercise types or raw `a+bi` free-text input. |
| Integration | Catalog readiness and route behavior | Update `catalog-readiness.test.ts`; assert blocked until `mat.u1.reales_operaciones` mastery. |
| Verification | Regression suite | `pnpm run test`, `pnpm run typecheck`, `pnpm run build`, then GGA. |

## Migration / Rollout

No data migration required. Rollback by removing the `PILOT_SKILLS` entry and restoring readiness assertions; JSON content can remain unreachable or be reverted with the same change.

## Risks

- Content may drift into polar/trig form; tests should reject polar vocabulary.
- Structured exercises can under-test full complex-result construction; compensate with MC and paired scalar questions.
- Adding many JSON entries may exceed review budget; tasks should consider chained PR slices.

## Open Questions

- None blocking.
