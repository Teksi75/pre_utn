# Design: Unit 2 Aplicaciones Slice

## Technical Approach

Content-only slice adding the last two U2 skills (`mcm_mcd_polinomios`, `ecuaciones_fraccionarias`). Zero new domain evaluator modules — reuse the existing polynomial-evaluator guard for symbolic MCM/MCD answers and standard numerical evaluator for single-solution ecuaciones. Domain-exclusion checking for ecuaciones is handled via MC distractors (exercise design, not evaluator code). Replicates the 2-PR chained delivery pattern from factorizacion-slice.

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| Ecuaciones domain checking | (A) MC distractors (B) New evaluator module | (A) Zero code, pedagogically stronger (B) Automated but +800 lines | **A** — MC distractors |
| MCM/MCD symbolic evaluation | (A) Reuse polynomial-evaluator guard (B) New MCM-specific comparator | (A) Already routes `mat.u2.*` symbolic (B) Redundant code | **A** — existing guard |
| Error detector for `u2_confunde_mcm_mcd` | (A) MC pattern: answer matches wrong-operation distractor (B) Symbolic comparison | (A) Simple, all MCM/MCD exercises are MC (B) Over-engineered | **A** — MC pattern |
| Error detector for `u2_denominador_cero` | (A) MC pattern: answer contains excluded value (B) Algebraic domain checker | (A) Matches exercise design (B) Requires parsing rational expressions | **A** — MC pattern |
| Exercise storage | (A) Main `exercises.json` (B) Per-skill file | (A) Consistent with existing U2 exercises (B) Cleaner separation | **A** — main file |

## Data Flow

```
Student answer
    │
    ▼
evaluateAnswer() ─── evaluator/index.ts
    │
    ├─ symbolic + mat.u2.mcm_mcd_polinomios
    │   └── polynomial-evaluator guard (areEquivalent)
    │       └── tagError() → u2_confunde_mcm_mcd detector
    │
    └─ multiple-choice + mat.u2.ecuaciones_fraccionarias
        └── evaluateExact()
            └── tagError() → u2_denominador_cero detector (MC-only in PR 1)

Note: numerical path for u2_denominador_cero is DEFERRED.
The current detector returns false for non-MC types.
This aligns with the Architecture Decision (A) — MC distractors for domain checking.
Numerical detection may be added in a future PR if needed.
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `content/matematica/exercises.json` | Modify | +6-10 exercises (3-5 per skill) with MC, numerical, symbolic types |
| `content/matematica/theory/unit-2.json` | Modify | +2 TheoryNodes: MCM/MCD and ecuaciones fraccionarias |
| `content/matematica/examples/unit-2.json` | Modify | +4-6 WorkedExamples (2-3 per skill) |
| `content/matematica/feedback/unit-2.json` | Modify | +2-4 FeedbackMappings for new error tags |
| `src/domain/error-taxonomy/index.ts` | Modify | +2 error tags: `u2_denominador_cero`, `u2_confunde_mcm_mcd` |
| `src/domain/evaluator/error-tagging.ts` | Modify | +2 detector functions + wiring in `tagError()` |
| `src/domain/__tests__/error-tagging-u2-aplicaciones.test.ts` | Create | Detector tests for both new patterns |
| `src/domain/__tests__/exercises-u2-shape.test.ts` | Modify | Add assertions for mcm_mcd + ecuaciones exercises |

## Interfaces / Contracts

### New Error Tags

```typescript
// u2_confunde_mcm_mcd — student picks MCD when MCM is asked (or vice versa)
{
  id: "u2_confunde_mcm_mcd",
  unit: 2,
  description: "Confunde MCM con MCD: al pedir el mínimo común múltiplo responde el máximo común divisor, o viceversa.",
  examples: [
    "Pedir MCM de (x-2)(x-3) y (x-2)(x+1) y responder (x-2) (que es el MCD)",
    "Pedir MCD de x²-4 y x²-2x y responder x(x-2)(x+2) (que es el MCM)"
  ]
}

// u2_denominador_cero — student includes an excluded value in solution
{
  id: "u2_denominador_cero",
  unit: 2,
  description: "Incluye como solución un valor que anula un denominador de la ecuación fraccionaria original.",
  examples: [
    "Resolver 1/(x-2) = 3/(x-2) y dar x=2 como solución",
    "Resolver x/(x-3) = 3/(x-3) y dar x=3 como solución"
  ]
}
```

### Detector Signatures

Both follow the existing pattern in `error-tagging.ts`: `(exercise: Exercise, userAnswer: string) => boolean`. The `u2_confunde_mcm_mcd` detector checks MC exercises where prompt mentions MCM/MCD and student selected the wrong-operation distractor. The `u2_denominador_cero` detector checks MC exercises where the student answer contains a value that appears in a denominator factor in the prompt.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (TDD) | `u2_confunde_mcm_mcd` detector | Exercise with MCM prompt, student picks MCD option → returns true |
| Unit (TDD) | `u2_denominador_cero` detector | Exercise with denominator `(x-2)`, student picks `x=2` option → returns true |
| Unit (TDD) | Taxonomy uniqueness | New tags pass `loadTaxonomy()` validation |
| Shape | Exercise catalog | 3+ exercises per skill, difficulty range 1-4, all have commonErrorTags |
| Integration | `evaluateAnswer()` routing | Symbolic MCM/MCD → polynomial-evaluator guard; MC ecuaciones → exact + tagError |
| Integration | `loadSkillBank()` | Both new skills load without diagnostics errors |
| Build | `pnpm run test && typecheck && build` | All green |

## Migration / Rollout

No migration required. All changes are additive: new exercises in JSON, new theory/example/feedback entries, new error tags in taxonomy, new detectors in error-tagging. No breaking API changes. Rollback via revert merge commit.

## Open Questions

- [ ] Should MCM/MCD exercises include a symbolic type where the student writes the MCM/MCD polynomial? If so, the polynomial-evaluator guard already handles it, but the `u2_confunde_mcm_mcd` detector would need a symbolic branch. **Decision: start with MC-only for MCM/MCD to keep detectors simple; symbolic can be added later if needed.**
