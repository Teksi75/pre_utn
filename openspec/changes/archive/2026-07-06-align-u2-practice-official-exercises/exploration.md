# Exploration: Align Unit 2 Practice with Official UTN 2025 Guide (02_ej_utn.pdf)

## Current State

### Existing U2 Exercise Count (31 total across 7 skills)

| Skill | Exercises | Types | Status |
|-------|-----------|-------|--------|
| `mat.u2.polinomios_basico` | 5 (.1–.5) | MC + numerical | OK base |
| `mat.u2.operaciones_polinomios` | 5 (.1–.5) | MC + numerical | Partial — missing long division + powers |
| `mat.u2.ruffini_resto` | 5 (.1–.5) | MC + numerical | Partial — missing Ruffini cociente exercises |
| `mat.u2.factorizacion` | 4 (.1–.4) | MC + numerical | Partial — missing 5 of 7 cases + combined |
| `mat.u2.gauss` | 4 (.1–.4) | MC + numerical | OK |
| `mat.u2.mcm_mcd_polinomios` | 4 (.1–.4) | MC | OK |
| `mat.u2.ecuaciones_fraccionarias` | 4 (.1–.4) | MC + numerical | Partial — all domain-exclusion, no varied equations |

### Loading Architecture (confirmed stable — no loading bug found)
- `content/matematica/exercises/unit-2.json` is statically imported in `catalog/index.ts` and `catalog/content-loaders.ts`
- Loading order: unit-2.json first, then exercises.json (monolith) as fallback for deduplication
- `PER_SKILL_SKILL_IDS` only covers `mat.u1.conjuntos_numericos`; all U2 skills load from unit-2.json
- No catalog architecture changes needed

### Official PDF Coverage Map (02_ej_utn.pdf — UTN 2025, MENDOZA)

| PDF Section | Item | Topic | Current Coverage |
|-------------|------|-------|-----------------|
| Polinomios | 1 | Identify polynomial (6 sub-items: denominators, fractional exponents, constants) | **MISSING** |
| Polinomios | 2 | Degree + numeric value (Q(1), Q(-1), R(2), R(0), R(-1)) | Partial (eval only, no multi-value) |
| Polinomios | 3 | P(-1)+Q(0), 2·P(-2)-Q(3) | **MISSING** |
| Polinomios | 4 | P(1) + uniqueness question | **MISSING** |
| Polinomios | 5 | Ordering + completeness detection (5 polynomials) | **MISSING** |
| Operaciones | 6a-f | Add/subtract/multiply polynomials | Partial (6a-f covered by .2–.5) |
| Operaciones | 7a-e | Long division P(x):Q(x) with quadratic divisors | **MISSING** |
| Operaciones | 8a-e | Ruffini division (x+2), (x-3), (x-2), (x-1), (x+2) | Partial (theo only, no cociente) |
| Operaciones | 9a-h | Powers: (-¼x³-2)², (x²+a)², (x²+b)³, (-2x²+x)³, (-x³+½x)³, (3x²+2x)², (x+1)³-(x+2)³, (x+1)³-(x-1)³ | **MISSING** |
| Factorización | 10a-f (factor común) | Common factor: x⁵-2x⁴+7x², 5x³–10x²+20x, 7x⁵–14x⁷+21x⁴, 12x²–16x³, 169x³–13x⁵, x²+x³-x | Partial (only .3 covers common factor) |
| Factorización | 10a-d (factor común por grupos) | Group factoring: x³+2x-3x²-6, 2x³+2x+3+3x², x²-5x+x⁴-5x³, xa+3x+x²+2a+6+2x | **MISSING** |
| Factorización | 10a-f (TCP) | Perfect square trinomial: 4x⁴+20x²+25, 36x²+1-12x, -8x+16+x², 9x²+4-12x, ¼a²+49x⁴b²+7x²ab, ¼x²+a⁶+xa³ | **MISSING** |
| Factorización | 10a-f (cubo perfecto) | Perfect cube: 27x³+8+54x²+36x, x⁶-6x⁴+12x²-8, 1-27m³-9m+27m², x³-3x²+3x-1, 27+36x²+54x+8x³, x³+3x+1+3x² | **MISSING** |
| Factorización | 10a-d (dif. de cuadrados) | Difference of squares: 1-144x², 25a²-49x², 4a⁸-x¹⁰, -81+x² | Partial (only .2 covers difference of squares) |
| Factorización | 10a-d (suma/dif. potencias) | Sum/diff of powers: y⁵-243, 125x³-27, a⁵+32, 1+128x⁷ | **MISSING** |
| Factorización | 10a-f (trinomio 2do grado) | Quadratic trinomial: 2x²-10x-28, 35+12x+x², 3x²+4x+1, -12x+x²-108, 54-27x+3x², 4x²+3x-1 | Partial (only .4 covers a≠1 case) |
| Factorización | 10a-ñ (combinados) | Combined: 15 sub-items from 5x³+5 to x⁴a+xa | **MISSING** |
| MCM/MCD | 11a-e | MCM + MCD of polynomials (some with parameters: a, b) | Partial (basic only, no parameters, no 3-polynomial case) |
| Expr. algebraicas racionales | 12a-d | Sum of algebraic fractions | **MISSING** |
| Expr. algebraicas racionales | 13a-d | Factor + simplify rational expressions | **MISSING** |
| Expr. algebraicas racionales | 14a-d | Numerator+denominator then divide | **MISSING** |
| Ecuaciones fraccionarias | 15a-o (15 items) | Fractional equations (varied: denominators, word-problems, sums) | **MISSING** — only 4 domain-exclusion "no solution" exercises |

---

## Affected Areas

- `content/matematica/exercises/unit-2.json` — primary target; needs new exercises + canonicalTrace backfill
- `src/domain/__tests__/exercises-u2-shape.test.ts` — shape tests will need expansion (exercise count assertions, type distribution, difficulty floors)
- `content/matematica/theory/unit-2.json` — theory already references `material_canonico/Matemática/UNIDAD2_matemática.pdf`; alignment confirms correct canonical source
- `content/matematica/feedback/unit-2.json` — feedback mappings may need new tags for gaps
- `src/domain/error-taxonomy/` — new `u2_*` tags may be needed (e.g., `u2_identifica_polinomio`, `u2_agrupacion`, `u2_tcp`, `u2_cubo_perfecto`, `u2_suma_potencias`, `u2_division_larga`)
- `docs/auditorias/unidad-2/alineacion-02-ej-utn.md` — audit doc (future implementation artifact)

---

## Approaches

### Approach A: Incremental Gap-Fill per Skill (Recommended)

Add exercises skill-by-skill, one skill per work unit, following the existing SDD slice pattern.

**Sequence:**
1. `polinomios_basico`: Add "is polynomial?" + ordering + completeness + multi-value evaluation
2. `operaciones_polinomios`: Add long division (P/Q format) + binomial powers with parameters
3. `ruffini_resto`: Add Ruffini cociente exercises + synthetic division with various divisors
4. `factorizacion`: Fill 5 missing cases (factor común por grupos, TCP, cubo perfecto, suma/diff potencias) + combined cases
5. `mcm_mcd_polinomios`: Add parameter exercises (a, b) + 3-polynomial case
6. `ecuaciones_fraccionarias`: Add diverse equation types (not just domain exclusion) + rational expression operations (sumas, cocientes)

- Pros: Low risk per slice; existing tests protect current exercises; each slice verifiable independently
- Cons: 6 slices; each requires new error tags and feedback; total effort significant
- Effort: High (6 skill slices)

### Approach B: One Large Content-Only Change

A single change adding all missing exercises across all 7 skills at once, with a comprehensive test update.

- Pros: Single PR; all gaps closed together; consistent naming/traces across all new entries
- Cons: High diff (potentially 200+ new lines in JSON + test expansions); review fatigue; risk of merge conflicts
- Effort: High (single large content-only PR)

### Approach C: Rational Expressions as New Sub-skill

Create `mat.u2.expresiones_racionales` as a dedicated skill between `mcm_mcd_polinomios` and `ecuaciones_fraccionarias` for rational expression operations (sumas algebraicas, simplificación, cocientes). Keep `ecuaciones_fraccionarias` for actual equation solving.

- Pros: Cleaner skill topology; aligns with PDF structure (section 12 = "Expresiones algebraicas racionales" separate from section 15 "Ecuaciones fraccionarias")
- Cons: New skill requires skill-catalog.ts update, new dependencies, PILOT_SKILL_UNIT_MAP update, theory/examples/feedback scaffolding, home dashboard updates
- Effort: Very High (skill infrastructure + content)

---

## Recommendation

**Approach A (Incremental Gap-Fill)** with the following strategy:

1. **Preserve all 31 existing exercises** — no removals, only additions
2. **Add `category` and specific official tags** to new exercises (e.g., `category: "expresiones_racionales"`, `tags: ["suma_fracciones", "02_ej_utn_12a"]`)
3. **Use `skillId: mat.u2.ecuaciones_fraccionarias`** for rational expression exercises per user spec
4. **Add `canonicalTrace`** to all new exercises referencing `02_ej_utn.pdf` with item numbers
5. **Maintain type discipline**: MC for polynomial/factorization answers, numerical for roots/coeffs, no free-text symbolic
6. **Start with `polinomios_basico` slice** (lowest risk, establishes pattern for remaining skills)

**Key insight**: The official PDF has 15+ exercise types per section. The current unit-2.json covers ~20% of the official minimum map. The goal is pedagogical coverage, not 1:1 reproduction — each new exercise should exercise a skill case not yet represented.

---

## Risks

1. **Test count assertions**: `exercises-u2-shape.test.ts` hardcodes `toBeGreaterThanOrEqual(31)` — new exercises must maintain this floor but no ceiling is defined; safe to add
2. **Error tag inflation**: New gap skills may need 8-10 new `u2_*` tags; need to verify against existing taxonomy before adding
3. **Rational expressions mixing into `ecuaciones_fraccionarias`**: The user wants rational expression exercises to use `skillId: mat.u2.ecuaciones_fraccionarias` with `category: expresiones_racionales`; this blends two distinct PDF sections (12 and 15) under one skill — acceptable for MVP if feedback pathways remain coherent
4. **`canonicalTrace` path**: Current unit-2.json uses `material_canonico/Matemática/UNIDAD2_matemática.pdf` — the official `02_ej_utn.pdf` is a different file; need to decide whether to use a separate `canonicalTrace` path or add a second source entry
5. **PDF not in repo**: `02_ej_utn.pdf` lives outside the repo at `~/Documentos/Preuniversitarios/UTN/01 - Matemática/00 - Ejercicios UTN/`; `canonicalTrace.path` should use a repo-relative path or a clear external reference convention

---

## Ready for Proposal

**Yes.** The exploration confirms:
- The official PDF exists at the expected path and its content maps cleanly to the 7 existing U2 skills
- No catalog loading bug exists; `unit-2.json` is correctly loaded as the primary source
- 6 of 7 skills have measurable gaps in coverage of the official minimum map
- The `polinomios_basico` slice is the natural starting point (most foundational, lowest risk)
- The audit doc `docs/auditorias/unidad-2/alineacion-02-ej-utn.md` is the right location for the alignment report
