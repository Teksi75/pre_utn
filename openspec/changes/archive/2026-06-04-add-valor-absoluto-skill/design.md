# Design: Add Traversable `mat.u1.valor_absoluto` Skill

## Technical Approach

Make `mat.u1.valor_absoluto` traversable by extending the existing Unit 1 content registries and pilot skill list. Follow the current `racionalizacion`, `intervalos`, and `logaritmos` pattern: static JSON content in shared Unit 1 files, exercises in `content/matematica/exercises.json`, error tags in the static taxonomy, and local route allow-lists only where current learn/practice code requires them. No loader, evaluator, or domain architecture change.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Content storage | Add to existing Unit 1 JSON files | Per-skill exercise/content file | Valor absoluto needs 8–12 exercises, not the larger `conjuntos_numericos` file split; shared files are the peer-skill pattern. |
| Exercise shape | Use `multiple-choice` and `numerical` only | Symbolic/free-response answers | The project forbids free-form structured math answers; existing exact/numeric evaluators cover the required interactions. |
| Skill order/dependency | Insert after `intervalos`; add `intervalos` as prerequisite; keep `logaritmos` depending only on `potencias_raices` | Leave no prerequisite or make logaritmos depend on valor absoluto | Revised spec requires intervalos before valor absoluto and explicitly forbids a logaritmos dependency. |
| Feedback taxonomy | Define the exact 9 `u1_abs_*` tags | Reuse the legacy four-tag shorthand | Acceptance requires full misconception coverage and feedback for each exercise tag. |
| Navigation | Update `PILOT_SKILLS` plus current local learn maps | New route registry | Existing practice uses `PILOT_SKILL_UNIT_MAP`; learn pages still gate through local maps, so targeted edits fit current code. |

## Data Flow

```text
Unit 1 JSON content ──→ content-loaders ──→ readiness/queryBySkill
        │                       │                 │
        ├──→ learn pages        └──→ practice flow └──→ FocusSelector/navigation
        └──→ feedback mappings ─────→ answer feedback recovery
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/domain/models/skill-catalog.ts` | Modify | Add dependency: `mat.u1.valor_absoluto` requires `mat.u1.intervalos`; do not add it to `mat.u1.logaritmos`. |
| `src/domain/catalog/pilot-skills.ts` | Modify | Insert `mat.u1.valor_absoluto` between intervalos and logaritmos with label `Valor absoluto`. |
| `content/matematica/theory/unit-1.json` | Modify | Add `theory-valor-absoluto` covering the 9 required concepts, excluding Unit 3 modular inequalities. |
| `content/matematica/examples/unit-1.json` | Modify | Add ≥5 examples: numeric calculation, distance between reals, properties, `|x|=a`, and misconception validation. |
| `content/matematica/exercises.json` | Modify | Update `ex.u1.valor_absoluto.1` links/tags and reach 8–12 exercises, difficulty 1–4, MC/numerical only. |
| `content/matematica/feedback/unit-1.json` | Modify | Add feedback mappings for all 9 `u1_abs_*` tags. |
| `src/domain/error-taxonomy/index.ts` | Modify | Define all 9 `u1_abs_*` tags with Unit 1 descriptions/examples. |
| `src/domain/__tests__/valor-absoluto-domain.test.ts` | Create | TDD coverage for catalog, dependency/order, readiness, content, exercise contracts, taxonomy/feedback, route resolution, and KaTeX delimiters. |
| `src/domain/__tests__/error-taxonomy.test.ts` | Modify | Include the 9 `u1_abs_*` tags in lookup/order coverage. |
| `src/domain/__tests__/catalog-readiness.test.ts` | Modify | Add `mat.u1.valor_absoluto` to pilot readiness expectations. |
| `src/app/practice/__tests__/start-skill.test.ts` | Modify | Assert requested-skill analysis respects content readiness and the intervalos prerequisite. |
| `src/app/learn/matematica/page.tsx` | Modify | Add display name for the learn listing. |
| `src/app/learn/matematica/[skillId]/page.tsx` | Modify | Add `SKILL_UNIT_MAP` entry for `/learn/matematica/mat.u1.valor_absoluto`. |
| `README.md` | Modify | Mark valor_absoluto Listo only after verification; keep complejos Pendiente. |

## Interfaces / Contracts

No new TypeScript interfaces. Stable IDs:

```ts
const SKILL_ID = "mat.u1.valor_absoluto";
const THEORY_ID = "theory-valor-absoluto";
const ERROR_TAGS = [
  "u1_abs_signo_incorrecto",
  "u1_abs_cero",
  "u1_abs_distancia_no_signo",
  "u1_abs_no_negativo",
  "u1_abs_confunde_opuesto",
  "u1_abs_distancia_entre_reales",
  "u1_abs_sqrt_cuadrado",
  "u1_abs_doble_solucion",
  "u1_abs_distributiva_falsa",
] as const;
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit/TDD | Order, dependency, readiness, content contracts, taxonomy/feedback | Start with failing `valor-absoluto-domain.test.ts`, then implement. |
| Integration | Learn/practice route gates and pilot readiness | Update existing catalog-readiness and start-skill tests. |
| Validation | TypeScript, build, static content imports | Run `pnpm run test`, `pnpm run typecheck`, `pnpm run build`. |

## Migration / Rollout

No migration required. Rollback removes added JSON entries, taxonomy entries, pilot/dependency/local map edits, tests, and README status.

## Open Questions

- [ ] Verify canonical material section for valor absoluto before authoring final theory/examples.
