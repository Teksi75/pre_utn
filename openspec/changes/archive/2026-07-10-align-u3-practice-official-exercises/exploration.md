# Exploration: Align Unit 3 Symbolic/Core Mathematical Practice with Canonical Source (`03_ej_utn.pdf`)

## Scope of this exploration

This exploration covers the **symbolic/core mathematical practice families** of `03_ej_utn.pdf`:

- P1, P5, P6, P8, P9, P12, P20, P21, P25, P27, P28, P29, P32, P33, P34, P37, P38, P39, P40
- Excluded and explicitly assigned to existing registered companions:
  - **P7, P10, P13, P14, P15, P16, P17, P18, P19, P31** (all canonical application families) → GitHub issue **#82** `feat(u3): cubrir aplicaciones canónicas y transferencia contextual` — https://github.com/Teksi75/pre_utn/issues/82
  - **P22, P23, P30** (forms of the line, triangle integrativa, propositions true/false) → GitHub issue **#83** `feat(u3): cubrir formas de recta, geometría integrativa y proposiciones de sistemas` — https://github.com/Teksi75/pre_utn/issues/83

Together, **this change + #82 + #83 form the complete canonical-alignment program** for Unit 3. No canonical family is silently dropped.

---
## Direct-PDF-verified ground truth

Every expression below was verified by rendering `material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf` directly via PyMuPDF (3× DPI) and reading the PDF visually. The OCR-only `docs/auditorias/unidad-3/03_ej_utn_text.txt` is navigation only. When OCR and rendered PDF disagree, the rendered PDF wins. Items that structurally need a radical / nested term use a structural description rather than inventing radicals.

### Transcription corrections vs prior artifact (cumulative)

| Ref | Prior claim (wrong) | PDF-direct truth (current) |
|---|---|---|
| P5d | `[7□²/4]` (numerator `−3` lost) | **`(7x² − 3)/4 = 141`** |
| P8g | "No solution" | **`−\|x\| = −\|−9\| − \|−1,5\|`; RHS = −9 − 1.5 = −10.5; ⇒ \|x\| = 10.5; ⇒ x ∈ {−10.5, 10.5}`** |
| P9p | factor `x` dropped (sometimes) | **`(x − 2x²)(x + ½) ≤ 0` ⇔ `x(1 − 2x)(x + ½) ≤ 0` ⇔ `x(2x − 1)(x + ½) ≥ 0`; critical factor `x` preserved (root at 0)** |
| P9s | `½x − ¼ ≤ ½` | **`½x − ¼ ≥ ½`** |
| P9v | `(□² − □)/(…) ≤ 0` | **`(x² − x)/((x + 1)(2 − x)) ≥ 0`** |
| P12d | perpendicular a `y = (4/1)x − 5` | **perpendicular a `y = −5 + (1/4)·x`** (slope `1/4`) |
| P38a | `(1/3) log x + (2/3) log(x + 2)` | **`(1/3) log x + (3/2) log(x + 2)`** |
| P39a | `5^{2x−1} = (5^{x²−1})^{4/3}` | **`5^{2x−1} = ∛(25^{x² − 1/4})`** |
| P39l | (not solved) | **`5^{x+2} − 105·5^{x−1} = 100`; factor `5^{x−1}`: `5^{x−1}(5³ − 105) = 20·5^{x−1} = 100` ⇒ `5^{x−1} = 5` ⇒ `x = 2`** |
| P40l | `2·√(log₂x²) − 2·√(log₂(−x)) = 4` (radicals) | **`2·log₂(x²) − 2·log₂(−x) = 4`; domain `x < 0`; substituting `log₂(x²) = 2·log₂(−x)` ⇒ `2·log₂(−x) = 4` ⇒ `x = −4`** |
| P36a | `log 2 5 + log 4 0` (undefined) | **`log 25 + log 40 = log(1000) = 3`** (base 10, no subscripts) |
| P36b | uncertain | **`log₂40 − log₂10 = log₂4 = 2`** |

### Difficulty policy (corrected)

- Type-level: `Difficulty = 1 | 2 | 3 | 4 | 5` per `src/domain/models/exercise.ts:42-43`. The TypeScript model accepts all five values generally.
- U3 content/spec policy for THIS change: planned base progression exercises are difficulty **1–4** only; each of the **9** new challenge entries is difficulty **exactly 5**. This policy is NOT enforced by the type itself — it must be enforced by a delta spec and per-skill content tests in the apply phase. Any leftover "Level 6" reference from prior artifacts is reclassified as difficulty-5 challenge or diff-4 base.
- Legacy `u2_*` error tags on `ex.u3.ecuaciones_lineales.1` in `content/matematica/exercises.json` are NOT intentional/correct — they are unit-prefix debt documented per Engram and reclassified to `u3_*` tags in the apply phase.

### STATUS registration (note)

`openspec/changes/STATUS.json` already registers `align-u3-practice-official-exercises` as `in-progress` on branch `feat/align-u3-practice-official-exercises`, with `companionIssues: [82, 83]`. This exploration remains restricted to `exploration.md` plus the matching Engram topic; it does not edit STATUS.json.

---
## Current state

### Runtime inventory: 42 U3 exercises

| Source | Count | Diff range | Notes |
|---|---|---|---|
| `content/matematica/exercises/unit-3.json` | 37 (IDs `.2`–`.5`) | 1–3 | All 9 U3 skills have 4 entries `.2`–`.5`; `traduccion_lenguaje_verbal` has 5 entries `.2`–`.6` |
| `content/matematica/exercises.json` (legacy `.1`) | 5 U3 entries | 1–3 | See table below |
| **Deduped runtime total** | **42** | — | Dedup by `id` |

Legacy `.1` U3 entries and their problems:

| ID | Skill | Type | Diff | Error-tag problem |
|---|---|---|---|---|
| `ex.u3.ecuaciones_lineales.1` | `mat.u3.ecuaciones_lineales` | numerical | 1 | Carries `u2_aislamiento_variable`, `u2_signo_al_mover` — wrong unit prefix; reclassify in apply phase |
| `ex.u3.ecuaciones_cuadraticas.1` | `mat.u3.ecuaciones_cuadraticas` | multiple-choice | 2 | Clean |
| `ex.u3.inecuaciones_lineales.1` | `mat.u3.inecuaciones_lineales` | multiple-choice | 2 | Carries `u3_signo_desigualdad` (correct tag) |
| `ex.u3.recta.1` | `mat.u3.recta` | numerical | 2 | Clean |
| `ex.u3.sistemas.1` | `mat.u3.sistemas` | multiple-choice | 3 | Clean |

### Current coverage by skill vs canonical maximum (PDF)

| Skill | Current max | Canonical max (PDF) | Gap |
|---|---|---|---|
| `traduccion_lenguaje_verbal` | 3 (covered by `fortalecer-u3`) | diff 4 (challenge by `fortalecer-u3`) | None — owned and complete |
| `ecuaciones_lineales` | 2 | 3 (P1c/g/j/k/l/m/n) | **No diff-3 rational exercise** |
| `ecuaciones_cuadraticas` | 3 | 4 (P6a–g) | **No diff-4 discriminant** |
| `inecuaciones_lineales` | 3 | 3 (compound) | None |
| `inecuaciones_valor_absoluto` | 3 | 4 (P9n/o) | **No diff-4 both-sides** |
| `recta` | 3 | 4 (P12c/d/g, P20a/b) | **No parallel/perpendicular by point** |
| `sistemas` | 4 | 4 (P25, P27–P29, P32, P33, P34) | **No explicit P34 classification + graph + solution-set interpretation** |
| `exponenciales` | 3 | 4 (P39b/c/m/n) | **No factor-común / cambio variable at diff 4** |
| `logaritmicas` | 2 | 4 (P37, P38, P40k/m/n, P40l) | **No log expansion before combining; no log combining; max is currently 2** |

Two canonical families have **no skill at all**:

| PDF family | Required action |
|---|---|
| **P8** — absolute-value equations (`\|ax+b\| = k`, `\|x\|+8=3`, `\|x−1\|=\|1−4\|`, etc.) | **New skill `mat.u3.ecuaciones_valor_absoluto`** |
| **P9p–w** — product/quotient/quadratic/rational inequalities (sign chart) | **New skill `mat.u3.inecuaciones_producto_cociente`** |

### Existing desafios (not owned by this change)

`traduccion_lenguaje_verbal.desafio-01` (diff 5) and `.desafio-02` (diff 4) remain unchanged and are owned by `fortalecer-u3`. This change adds exactly **9 new diff-5 challenges** (one per expanded skill/family; per-skill rationale below).

### Catalog contracts from the codebase

| Constraint | Source | Value |
|---|---|---|
| `Difficulty` literal type | `src/domain/models/exercise.ts:42-43` | `1 | 2 | 3 | 4 | 5` (TypeScript accepts 5 generally) |
| Base/challenge policy | this change's delta spec + per-skill content test | planned base exercises 1–4; the 9 new challenge entries are exactly 5 |
| Prohibited exercise/input types | AGENTS.md + challenge policy tests | NO `text` or free-form symbolic input for structured math; use MC / numerical scalar / fill-blank only when structurally safe / matching / ordering |
| `multiple-choice` shape | `src/domain/models/exercise.ts:198-205` | ≥ 2 options; `expectedAnswer` ∈ `options` |
| `numerical` shape | `src/domain/models/exercise.ts:174-186` | single scalar only; no `a+bi`, no multi-value, no symbols |
| `fill-blank` shape | `src/domain/models/exercise.ts:103-113, 190-195` | no structured math (no radicals, no log, no ln) |
| Exercise `SourceUse` | `src/domain/models/theory.ts:14` | `"adapted" | "reinforcement" | "reference"` (exactly three; no `alignment`) |
| Challenge `SourceUse` | `src/lib/challenges/loader.ts:90` | `canonical-source | adapted | calibrated-from-exam | solution-pattern` |
| Prereq discipline | `src/domain/models/skill-catalog.ts:106` comment | parallel-branch design; new skills are leaves, no global prereqs |

---
## Canonical inventory (PDF-direct)

### P1 — Ecuaciones Lineales (p. 3, items a–n = 14)

| Sub-item | PDF-direct | Diff |
|---|---|---|
| P1a | `2·(3 + 2x) = 3·(x − 4)` | 1 |
| P1b | `6 − x = −x + 9` | 1 |
| P1c | `5 − (6x − 4)/5 = x − 3` | 3 |
| P1d | `3·(2 − x) = −3x + 6` | 1 |
| P1e | `0.9 t = 0.4 − 0.1 t` | 2 |
| P1f | `8x − (2x + 1) = 3x − 10` | 2 |
| P1g | `x/3 − (x − 1)/2 = (x − 13)/9` | 3 |
| P1h | `5 − (2x − 1) = 10` | 1 |
| P1i | `√(x − 2) = 4` | 2 |
| P1j | `(4x − 6)/12 − (3x − 8)/4 = (2x − 9)/6 − (x − 4)/8` | 3 |
| P1k | `(2 − (1 − x))/3 − x = 1 − (2/3)·x` | 3 (degenerate) |
| P1l | `2·(√2 − (√5/2)·x) = (√2/2) + (√5/2)·x` | 3 (irrational coeff) |
| P1m | `(2x + 4 − 5x + 3)/4 − (7x − 9 + 3x − 8)/7 + 2 = 4x` | 3 |
| P1n | `(7/9)(x − 2) + (5/6)(x − 4) = 20 − (7/3)(x − 7)` | 3 |

Canonical max for `ecuaciones_lineales` is **diff 3** (rational/irrational coefficient). The diff-5 challenge is grounded in the user's consistency requirement across all nine expanded families. P1l (irrational-coefficient distribution with surds) is the natural diff-5 anchor: structured equation/solution/step pair for a linear equation with two irrational coefficients (sums of surds on both sides), not free-form symbolic work. **P1l algebraic solution (preserved for the S1a slice)**: `2·(√2 − (√5/2)·x) = (√2/2) + (√5/2)·x` ⇒ `2√2 − √5·x = √2/2 + (√5/2)·x` ⇒ `(3√2)/2 = (3√5/2)·x` ⇒ `x = √2/√5` ⇒ **`x = √10/5`**. The `ex.u3.ecuaciones_lineales.6` diff-3 base exercise is anchored on this equation with **exact root `√10/5`** (irrational, hence the `u3_racionalizacion_irracional` error tag and the scoped rational/irrational detector that lands in S1a, not S0).

### P5 — Ecuación Cuadrática (p. 5, items a–h = 8)

| Sub-item | PDF-direct | Diff |
|---|---|---|
| P5a | `18 = 6x + x(x − 13)` | 1 |
| P5b | `(2x − 3)² = 1 − 2x + x²` | 2 |
| P5c | `x² + x + 1 = 0` | 2 |
| **P5d** | **`(7x² − 3)/4 = 141`** | 3 |
| P5e | `8x(x + 2) − 2 = 2(8x − 1)` | 3 |
| P5f | `3(x² − 2x) + 3(3x² + 2) = 3x² + 6` | 2 |
| P5g | `(24x − 6x²)/15 = 0` | 2 |
| P5h | `(3x² + 6x)/3 − 120 = 0` | 2 |

### P6 — Parámetro k en cuadrática (p. 5–6, items a–g = 7)

P6 is pure discriminant analysis. Compact derivation with the discriminant `Δ = b² − 4ac` and any nonzero-leading-coefficient constraint respected:

| Sub-item | Equation (verbatim) | Condition | Discriminant reasoning | k-set | Diff |
|---|---|---|---|---|---|
| P6a | `x² − kx + 36 = 0` | iguales | `Δ = k² − 144 = 0` ⇒ `k = ±12` | `{−12, 12}` | 4 |
| P6b | `kx² − 2x + 4 = 0` | reales distintos | `Δ = 4 − 16k > 0` ⇒ `k < 1/4`; leading coeff `k ≠ 0` | `(−∞, 0) ∪ (0, 1/4)` | 4 |
| P6c | `x² + kx − k = 0` | complejos | `Δ = k² + 4k < 0` ⇒ `k(k+4) < 0` ⇒ `k ∈ (−4, 0)`; leading coeff = 1, always nonzero | `(−4, 0)` | 4 |
| P6d | `x² + kx − k = 0` | iguales | `Δ = k² + 4k = 0` ⇒ `k ∈ {−4, 0}`; `k = 0` ⇒ `x = 0` (raíz doble), `k = −4` ⇒ `(x − 2)² = 0` (raíz doble `x = 2`) | `{−4, 0}` | 4 |
| P6e | `x² + kx − k = 0` | reales distintos | `Δ = k² + 4k > 0` ⇒ `k(k+4) > 0` ⇒ `k ∈ (−∞, −4) ∪ (0, ∞)` | `(−∞, −4) ∪ (0, ∞)` | 4 |
| P6f | `−kx² − 2x + 4 = 0` | complejos | Rewrite as `kx² + 2x − 4 = 0`: `Δ = 4 + 16k < 0` ⇒ `k < −1/4`; leading coeff `k ≠ 0` | `(−∞, −1/4)` | 4 |
| P6g | `3x² − 2x + k = 0` | reales | `Δ = 4 − 12k ≥ 0` ⇒ `k ≤ 1/3`; leading coeff = 3, always nonzero | `(−∞, 1/3]` | 4 |

### P7 — Aplicación finca rectangular (p. 6)

Single canonical item: `Para vallar una finca rectangular de 750 m² se han utilizado 110 m de cerca. Calcula las dimensiones de la finca.` System: `2(largo + ancho) = 110`, `largo · ancho = 750`. Solutions: `25 m` and `30 m`. Owned by companion issue #82 (`feat(u3): cubrir aplicaciones canónicas y transferencia contextual`) — https://github.com/Teksi75/pre_utn/issues/82.

### P8 — Ecuaciones con Valor Absoluto (p. 6, items a–i = 9) — **NEW SKILL**

| Sub-item | PDF-direct | Solve | Diff |
|---|---|---|---|
| P8a | `\|x + 2\| = 8` | `x = 6` or `x = −10` | 1 |
| P8b | `\|x\| + 8 = 3` | `\|x\| = −5`; **no solution** | 2 |
| P8c | `\|v − 2\| = 3` | `v = 5` or `v = −1` | 1 |
| P8d | `\|10 − x\| = 5` | `x = 5` or `x = 15` | 2 |
| P8e | `\|6 − 2t\| = 4` | `t = 1` or `t = 5` | 2 |
| P8f | `\|3x + 18\| = 0` | `x = −6` (single root) | 2 |
| P8g | **`−\|x\| = −\|−9\| − \|−1,5\|`** | RHS = `−9 − 1.5 = −10.5`; multiply by `−1`: `\|x\| = 10.5` ⇒ **`x = 10.5` or `x = −10.5`** (solution set `{−10.5, 10.5}`). Prior "no solution" claim is wrong; prior "−10.5 / still no solution" claim is also wrong (multiplying by `−1` here produces valid ± solutions). | **3** |
| P8h | `\|x − 1\| = \|1 − 4\|` | `\|1 − 4\| = 3` ⇒ `x − 1 = ±3` ⇒ `x = 4` or `x = −2` | 2 |
| P8i | `−\|r\| = −6 + \|r\|` | `0 = −6 + 2\|r\|` ⇒ `\|r\| = 3` ⇒ `r = ±3` | 3 |

**P8g: corrected resolution — solution set is `{−10.5, 10.5}` (two solutions).** Multiplying `−|x| = −10.5` by `−1` gives `|x| = 10.5 > 0`, so valid solutions exist: `x = ±10.5`.

### P9 — Inecuaciones (p. 6–7, items a–w = 23) — **PARTIALLY UNSERVED**

| Sub-item | PDF-direct | Family | Diff | Skill |
|---|---|---|---|---|
| P9a | `3 + x ≥ 6` | linear | 1 | `inecuaciones_lineales` |
| P9b | `x/2 + x/3 > 5` | fractional linear | 2 | `inecuaciones_lineales` |
| P9c | `(−4 + x)/2 ≤ −1` | fractional linear | 2 | `inecuaciones_lineales` |
| P9d | `2 < 2x − 4 ≤ 6` | compound | 3 | `inecuaciones_lineales` |
| P9e | `−3 < −9 − 4x ≤ 11` | compound, neg coeff | 3 | `inecuaciones_lineales` |
| P9f | `2x − 4 > 6x` | linear, move | 2 | `inecuaciones_lineales` |
| P9g | `−1 ≤ (5 − 2x) < 1` | compound | 3 | `inecuaciones_lineales` |
| P9h | `\|x − 2\| ≤ 5` | abs-value ineq | 2 | `inecuaciones_valor_absoluto` |
| P9i | `\|x + 5\| ≥ 2` | abs-value ineq | 2 | `inecuaciones_valor_absoluto` |
| P9j | `\|x − 1\| > 3` | abs-value ineq | 2 | `inecuaciones_valor_absoluto` |
| P9k | `\|x + 4\| < 1` | abs-value ineq | 2 | `inecuaciones_valor_absoluto` |
| P9l | `\|x + 2\| ≤ \|(−3)·4\| = 12` | abs-value equality | 3 | `inecuaciones_valor_absoluto` |
| P9m | `\|(−1)·(x + 5)\| > 9 − (−2) = 11` | abs-value with factor | 3 | `inecuaciones_valor_absoluto` |
| P9n | `3\|x − 5\| − 1 < 2\|x − 5\|` | term on both sides | **4** | `inecuaciones_valor_absoluto` |
| P9o | `2\|x + 3\| > 2 + \|x + 3\|` | compound both sides | **4** | `inecuaciones_valor_absoluto` |
| **P9p** | **`(x − 2x²)(x + ½) ≤ 0` ⇔ `x(1 − 2x)(x + ½) ≤ 0` ⇔ `x(2x − 1)(x + ½) ≥ 0`** (CRITICAL: factor `x` MUST be preserved; critical roots at `−½, 0, ½`) | quadratic ineq (product) | **4** | `inecuaciones_producto_cociente` (NEW) |
| P9q | `x² ≤ x` ⇒ `0 ≤ x ≤ 1` | quadratic ineq | **4** | `inecuaciones_producto_cociente` (NEW) |
| P9r | `x/(x + 1) < 3` | rational ineq | **4** | `inecuaciones_producto_cociente` (NEW) |
| **P9s** | **`½x − ¼ ≥ ½`** | fractional linear | 2 | `inecuaciones_lineales` |
| P9t | `(−1 − 3x)/(1 − 4x) < 2` | rational ineq | **4** | `inecuaciones_producto_cociente` (NEW) |
| P9u | `(x + 2)/(2 − x) ≥ 1` | rational ineq boundary | **4** | `inecuaciones_producto_cociente` (NEW) |
| **P9v** | **`(x² − x)/((x + 1)(2 − x)) ≥ 0`** (sign chart: roots `−1, 0, 1, 2`; critical at `x = 0` from factor `x`) | rational sign chart | **5** | `inecuaciones_producto_cociente` (NEW) |
| P9w | `(2x − 1)(x − 3) ≥ 0` | product ineq (signos) | **3** | `inecuaciones_producto_cociente` (NEW) |

**P9p detailed solution** (with `x` factor preserved): factor `x` from `(x − 2x²) = x(1 − 2x)`, multiply by `−1` to flip ≤ to ≥, yielding `x(2x − 1)(x + ½) ≥ 0`. Critical roots `−½, 0, ½`. Sign chart: `(−∞,−½)→no`, `(−½,0)→yes`, `(0,½)→no`, `(½,∞)→yes`. **Solution:** `x ∈ [−½, 0] ∪ [½, ∞)`.

### P10 — Aplicaciones con inecuación (p. 7–8, items a–h = 8)

Word problems with absolute-value or simple inequation contexts (distancia, camión, botellas, ascensor, cajas, camioneta, alquiler motos). Owned by companion issue #82 — https://github.com/Teksi75/pre_utn/issues/82.

### P12 — Recta: encontrar ecuación (p. 8–9, items a–g = 7)

| Sub-item | PDF-direct | Diff |
|---|---|---|
| P12a | `m = −5/3, b = −2` | 2 |
| P12b | `m = −3, punto (0; −4)` | 2 |
| P12c | Paralela a `y = −x + 2`, contiene a `p(−2; 1)` | 3 → 4 (parallel by point) |
| **P12d** | **Perpendicular a `y = −5 + (1/4)·x` (slope `1/4`), pasa por origen** | 4 |
| P12e | Pasa por `p(−2;3)` y `q(0;4)` | 2 |
| P12f | Pasa por `r(3;−1)` y `s(−2;−5)` | 2 |
| P12g | Pasa por `p(2;3)`, paralela a recta por `r(0;1)` y `q(2;5)` | 4 |

### P13–P19 — Aplicaciones lineales (p. 9, 7 problemas)

P13 (costo/beneficio), P14 (perímetro + postes), P15 (alquiler vehículos), P16 (harina ritmo), P17 (operarios fracciones), P18 (ebullición temperatura), P19 (MRU). All owned by companion issue #82 — https://github.com/Teksi75/pre_utn/issues/82.

### P20–P21 — Paralela/perpendicular por punto y parámetro k (p. 9–10)

| Prob | PDF-direct | Diff |
|---|---|---|
| P20a | Paralela a `3x − 2y + 1 = 0` por `P(2;2)` | 4 |
| P20b | Perpendicular a `−(3/2)x + 5x − 8 = 2` por `P(−1;3)` | 4 |
| P20c | Rectas `l ⊥ l'` cruzando `Q(2;3)` y `R(−2;−3)` | 4 |
| P21a–d | Parámetro `k` en `2kx − 5y + 2k + 3 = 0`: por `P(3;−2)`, pendiente `m = −1/2`, ordenada `b = 3`, por origen | 3 → 5 (challenge) |

### P22–P23, P30 — Owned by companion issue #83

P22 (forma explícita/segmentaria), P23 (demostración triángulo rectángulo), P30 (verdadero/falso, p. 12, 5 propositions sobre SEL). All owned by GitHub issue #83 (`feat(u3): cubrir formas de recta, geometría integrativa y proposiciones de sistemas`) — https://github.com/Teksi75/pre_utn/issues/83.

### P24–P26 — Sistemas introductorios (p. 10–11)

| Prob | Family | Diff | Status |
|---|---|---|---|
| P24a–c | Resuelve gráficamente | 2–3 | In scope (`sistemas.2/.3` already cover) |
| P25a–i | Clasifica y resuelve analíticamente | 3–4 | **Diff 4 needed (P25)** |
| P26 | Proporcionar SEL desde gráfico | 3 | Not expanded in this change; existing graphical-intro coverage remains the baseline |

### P27–P29, P33 — Parámetro en sistema estándar (p. 11–12) — **CANONICAL MAX**

| Prob | Family | Diff |
|---|---|---|
| P27a–c | Parámetro k → SPD / SCI / SI | **4** |
| P28a–c | Parámetros p, s → sin / única / infinitas soluciones (dual-parameter) | **5 (challenge input)** |
| P29a–c | Parámetro k → una / infinitas / ninguna | **4** |
| P33 | Parámetro k en homogéneo | **4** |

### P31 — Problemas aplicados de sistemas (p. 12–13, items a–j = 10)

10 word problems (ómnibus, interés, software, rectángulo, terreno, cajas, cosecha, hamburguesas, fútbol, ciclistas). All owned by companion issue #82 — https://github.com/Teksi75/pre_utn/issues/82.

### P32a–b — Sistemas homogéneos (p. 13–14)

| Prob | Family | Diff |
|---|---|---|
| P32a | `{3x − 2y = 0; x − y = 0}` — homogéneo SPD | 4 |
| P32b | `{3x − 6y = 0; x − 2y = 0}` — homogéneo SCI (paramétrica `y = x/3`) | 4 |

### P34 — Clasifica + grafica + conjunto solución (p. 14) — **MANDATORY IN THIS CHANGE**

P34c: `{2x − 5y = 0; x − 0.3y = 0}`; P34d: `{7x/3 = 2y; 4y/3 − 14x/9 = 0}`. Diff 3–4. This change must include at least one `sistemas` base exercise that requires **classification + graph interpretation + solution-set interpretation** for this family.

### P35–P36 — Cálculo + propiedades de logaritmos (p. 14)

| Prob | Family | Diff |
|---|---|---|
| P35a–f | Cálculo por definición | 1 (covered at runtime already) |
| **P36a** | **`log 25 + log 40 = log 1000 = 3`** (base 10) | 2 |
| **P36b** | **`log₂40 − log₂10 = log₂4 = 2`** | 2 |
| P36c | `log₃18 − log₃6 = 1` | 2 (covered) |
| P36d | `ln e¹⁰ − ln e⁷ = 3` | 2 |

### P37a–d — Desarrolla (expandir logs) — **MANDATORY IN THIS CHANGE**

`log(x³·y/z)`, `log((x+y)³/(x·z²))`, `ln((x²−1)/√(x+1))`, `log(∛(x·2y)/(x³+y)²)`. Diff 2–3. This change owns P37 under `mat.u3.logaritmicas` as the required expansion step before P38 log-combining.

### P38 — Agrupa en un solo logaritmo (p. 14–15, items a–c = 3)

| Sub-item | PDF-direct | Diff |
|---|---|---|
| **P38a** | **`(1/3)·log x + (3/2)·log(x + 2)`** | **3** |
| P38b | `2·log a − 3·log b + (2/3)·log(a − b)` | 3 |
| P38c | `ln 6 + (1/3)·ln 7 − (1/3)·(ln 5 + ln 6)` | 3 |

### P39 — Ecuaciones exponenciales (p. 15, items a–q = 17)

| Sub-item | PDF-direct | Family | Diff |
|---|---|---|---|
| **P39a** | **`5^{2x−1} = ∛(25^{x² − 1/4})`** | igualación de bases | 2–3 |
| P39b | `4^{x+1} + 2^{x+3} − 320 = 0` (extraer `2^x`) | factor común | 3–4 (**4**) |
| P39c | `3^{2(x+1)} − 28·3^x + 3 = 0` | factor común | 3–4 (**4**) |
| P39d | `10^{3x} = 1` | igualación `1 = 10⁰` | 1 (covered) |
| P39e | `2^{x+1} + 2^{2x−1} + 2·(2^{x−1}) + 2^{2x−3} + 2^{2(x−2)} − 1984 = 0` | series sum | **5 (challenge)** |
| P39f | `2^{x−1} + 2^{x−2} + 2^{x−3} + 2^{x−4} = 960` | series sum | 3 |
| P39g | `3^x + 3^{1−x} = 9` | simétrico cambio variable | 3–4 (**4**) |
| P39h | `4·e^{−3x} − 5·e^{−x} + e^x = 0` | exponencial en e | **5 (challenge)** |
| P39i | `9^{−3x} = (1/27)^{x+3}` | bases fraccionarias | 3 |
| P39j | `3^{2x+7} = 3` | igualación trivial | 2 (covered) |
| P39k | `3^{x+1} = 4^{x−1}` | distintas bases | 3–4 |
| **P39l** | **`5^{x+2} − 105·5^{x−1} = 100`** ⇒ factor `5^{x−1}`: `5^{x−1}(5³ − 105) = 20·5^{x−1} = 100` ⇒ `5^{x−1} = 5` ⇒ **`x = 2`** | base mixta con factor | 3–4 (**4**) |
| P39m | `9^{x²+2x−3} = 1` | cambio de variable (quadratic) | **4** |
| P39n | `9^x − 2·3^x − 3 = 0` | cambio de variable | **4** |
| P39o | `√5·(1/5)^{2x−4} = 25^{3x}` | bases mixtas con radical | 3–4 |
| P39p | `e^x + e^{−x} = 2` | identidad (cosh) | 2–3 |
| P39q | `4^{2x−1} ÷ 8^{2−x} = 16·2^{2−2x}` | propiedades de potencias | 3 |

### P40 — Ecuaciones logarítmicas (p. 15–16, items a–o = 15)

| Sub-item | PDF-direct | Family | Diff |
|---|---|---|---|
| P40a | `(x² − 5x + 9)·log 2 + log 125 = 3` | log eq | 3 |
| P40b | `log((2^{2−x})^{2−x}) + log 1250 = 4` | log de potencia | 3 |
| P40c | `[log 2 + log(11 − x²)] / log(5 − x) = 2` | cociente de logs | 3–4 |
| P40d | `(x² − 4x + 7)·log 5 + log 16 = 4` | log eq | 3 |
| P40e | `log(x + √(x² − 1)) + log(x − √(x² − 1)) = 0; x ≥ 1` | comp. conjugada | 3–4 |
| P40f | `3·log x − log 32 = log(x/2)` | propiedades + solve | 3 |
| P40g | `log₂x · logₓ(2x) · log₂(xy) = logₓ(x²)` | producto de logs | 3–4 |
| P40h | `5·logₓ 2 + 2·logₓ 3 = 3·log x − log(32/9)` | base mixta | 3–4 |
| P40i | `2·log x = 3 + log(x/10)` | log eq | 3 |
| P40j | `log(√(3x+1)) − log(√(2x−3)) = 1 − log 5` | diferencia con radicales | 3–4 |
| P40k | `log₂(x + 4) + log₂(x − 4) = 2` (domain `x > 4`) | log eq + dominio | **3** |
| **P40l** | **`2·log₂(x²) − 2·log₂(−x) = 4`**; domain `x < 0` (since `log₂(−x)` requires `−x > 0` ⇒ `x < 0`); on this domain `log₂(x²) = 2·log₂(−x)`, so `4·log₂(−x) − 2·log₂(−x) = 2·log₂(−x) = 4` ⇒ `log₂(−x) = 2` ⇒ **`x = −4`**. NO RADICALS in this equation. | dominio nested log | **5 (challenge)** |
| P40m | `log₂(x² − 7x + 8) + log₂(1 − x) = 1` (domain `x < 1`, interval `(-∞, 1)`: `1 − x > 0` gives `x < 1`; roots of `x² − 7x + 8` are `(7 ± √17)/2 ≈ 1.438, 5.562`, so positivity is outside the roots and the intersection is `x < 1`; solution inside domain: `x = 3 − √6`) | dominio log eq | **4** |
| P40n | `log_(√5)(x + 1) − log₅(x + 1) = log₅ 7` | cambio de base | 3–4 (**4**) |
| P40o | `ln(x²) − ln(√x) = 14/3` | propiedades | 3 |

---
## Scope: this change + registered companions (#82/#83)

This change covers **symbolic/core mathematical practice** for **P1 / P5 / P6 / P8 / P9 / P12 / P20 / P21 / P25 / P27–P29 / P32–P34 / P37–P40** (P39 = P39a–q, P40 = P40a–o). **P34 and P37 are mandatory in THIS change.** The canonical-alignment program is completed by two existing registered companions:
- **#82** `feat(u3): cubrir aplicaciones canónicas y transferencia contextual` — https://github.com/Teksi75/pre_utn/issues/82 — owns **P7, P10, P13–P19, P31**.
- **#83** `feat(u3): cubrir formas de recta, geometría integrativa y proposiciones de sistemas` — https://github.com/Teksi75/pre_utn/issues/83 — owns **P22, P23, P30**.

### No-orphan ownership matrix

| Canonical family | Owner | Contract |
|---|---|---|
| P1a–n | THIS change | Add rational/irrational-coefficient diff-3 base coverage + one structured diff-5 challenge for `ecuaciones_lineales`. |
| P5a–h | THIS change | Add P5d-aligned diff-3 coverage retaining `(7x² − 3)/4 = 141`; pair with P6 discriminant coverage. |
| P6a–g | THIS change | Add discriminant diff-4 coverage using the verified k-sets in this exploration. |
| P7 | **#82** — https://github.com/Teksi75/pre_utn/issues/82 | Canonical rectangular-fence application family. |
| P8a–i | THIS change | New skill `mat.u3.ecuaciones_valor_absoluto`; include P8g corrected solution set `{−10.5, 10.5}`. |
| P9a–g / P9s | Existing `inecuaciones_lineales` baseline | Already represented by current linear-inequality coverage; only regression compatibility if touched. |
| P9h–o | THIS change | Extend `inecuaciones_valor_absoluto` with P9n/o diff-4 and one structured diff-5 challenge. |
| P9p–w | THIS change | New skill `mat.u3.inecuaciones_producto_cociente`; preserve P9p factor `x`; include P9v as diff-5 sign-chart challenge. |
| P10a–h | **#82** — https://github.com/Teksi75/pre_utn/issues/82 | Canonical inequation/application contexts. |
| P12a–g / P20a–c / P21a–d | THIS change | Extend `recta` with parallel/perpendicular-by-point diff-4 coverage and one structured P21 diff-5 challenge. |
| P13–P19 | **#82** — https://github.com/Teksi75/pre_utn/issues/82 | Canonical line/application families. |
| P22 / P23 / P30 | **#83** — https://github.com/Teksi75/pre_utn/issues/83 | Forms of line, integrative triangle geometry, and SEL true/false propositions. |
| P24 / P26 | Existing `sistemas` baseline | Graphical/intro system coverage remains compatible; no new gap identified for this change. |
| P25 / P27–P29 / P32–P34 | THIS change | Extend `sistemas`; **P34 requires classification + graph + solution-set interpretation**. |
| P31a–j | **#82** — https://github.com/Teksi75/pre_utn/issues/82 | Canonical applied systems families. |
| P35–P36 | Existing `logaritmicas` baseline | Calculation/properties coverage remains compatible; verified P36a/P36b truths are retained. |
| P37a–d | THIS change | Add log-expansion coverage under `logaritmicas` before P38 combining. |
| P38a–c / P40a–o | THIS change | Add log-combining/domain/change-of-base coverage; P40l has no radicals and is the diff-5 challenge anchor. |
| P39a–q | THIS change | Add factor-common/change-variable exponential coverage and one structured diff-5 challenge. |

No canonical family in `03_ej_utn.pdf` is unowned. **Two new skills required** in this change: `mat.u3.ecuaciones_valor_absoluto` (P8 equation family, separate from `inecuaciones_valor_absoluto` parent) and `mat.u3.inecuaciones_producto_cociente` (P9p–w sign-chart family).

---
## Progression / challenge contract (exactly 9 new structured diff-5 challenges)

For each expanded skill/family, this change adds **exactly one** new challenge at difficulty **exactly 5**. Existing `traduccion_lenguaje_verbal` desafio-01 (diff 5) and desafio-02 (diff 4) are kept unchanged and are not duplicated. **Exact challenge count for THIS change: 9 new challenges**, one per skill in: `mat.u3.ecuaciones_lineales`, `mat.u3.ecuaciones_cuadraticas`, `mat.u3.ecuaciones_valor_absoluto`, `mat.u3.inecuaciones_valor_absoluto`, `mat.u3.inecuaciones_producto_cociente`, `mat.u3.recta`, `mat.u3.sistemas`, `mat.u3.exponenciales`, `mat.u3.logaritmicas`.

### Structured-control rule for the nine challenges

- Planned control for all 9 new challenges: **`multiple-choice`**.
- No new challenge may use `text` or free-form symbolic input.
- No challenge may require the student to type roots, interval unions, solution sets, radicals, logarithmic expressions, systems, or multi-value answers in plain text.
- Any prompt that conceptually says "plantee y resuelva" must be implemented as a structured selection: equation/solution pair, valid next step, graph/solution-set interpretation, or equivalent MC option set.
- Policy tests must reject prohibited answer shapes from AGENTS.md and must assert the exact 9 challenge skill IDs above with `difficulty === 5`.

### `mat.u3.ecuaciones_lineales` (current max: 2; target: 3 + challenge 5) — **S1a slice**

| Level | Source | Diff | Control |
|---|---|---|---|
| 1, 2 | `.2`–`.5` (existing) | 1, 2 | existing |
| **3** | `2·(√2 − (√5/2)·x) = (√2/2) + (√5/2)·x` (P1l, irrational-coefficient; **exact root `x = √10/5`**) — S1a anchor | **3** | MC or safe scalar numerical |
| **5 challenge** | Structured MC selecting the valid equation/solution/step pair for the irrational-coefficient linear equation anchored in P1l (`x = √10/5`) — S1a chal | **5 exactly** | **multiple-choice** |

### `mat.u3.ecuaciones_cuadraticas` (current max: 3; target: 4 + challenge 5) — **S1b slice**

| Level | Source | Diff | Control |
|---|---|---|---|
| 1, 2, 3 | existing `.2`–`.5` + `(7x² − 3)/4 = 141` (P5d, diff-3 NEW; **±9 symmetric roots**: `(7x² − 3) = 564` ⇒ `x² = 81` ⇒ `x = ±9`) — S1b anchor | 1, 2, 3 | MC or safe scalar numerical |
| **4** | `ex.u3.ecuaciones_cuadraticas.7` carries P6b `(−∞,0)∪(0,1/4)` (kx² − 2x + 4 = 0, reales distintos) + P6f `(−∞,−1/4)` (−kx² − 2x + 4 = 0, complejos) — S1b anchor | **4** | multiple-choice for k-set classification |
| **5 challenge** | Bhaskara/discriminant with parameter in quadratic coefficient (P6b/P6f extension), selecting the correct k-set and reasoning step — S1b chal | **5 exactly** | **multiple-choice** |

### `mat.u3.ecuaciones_valor_absoluto` (NEW SKILL, P8)

| Level | Source | Diff | Control |
|---|---|---|---|
| 1 | P8a, P8c | 1 | multiple-choice |
| 2 | P8d, P8e, P8h, P8f | 2 | multiple-choice |
| 3 | P8i + **P8g corrected** (`−\|x\| = −10.5` ⇒ `\|x\| = 10.5` ⇒ `{−10.5, 10.5}`) | 3 | multiple-choice |
| **5 challenge** | P8g-style absolute-value equation plus structural no-solution contrast (P8b pattern), selecting the valid solution set and justification | **5 exactly** | **multiple-choice** |

### `mat.u3.inecuaciones_valor_absoluto` (current max: 3; target: 4 + challenge 5)

| Level | Source | Diff | Control |
|---|---|---|---|
| 2, 3 | existing `.2`–`.5` | 2, 3 | existing |
| **4** | P9n: `3\|x − 5\| − 1 < 2\|x − 5\|`; P9o: `2\|x + 3\| > 2 + \|x + 3\|` | **4** | multiple-choice interval/set options |
| **5 challenge** | Parameter in absolute-value inequality; student selects correct inequality transformation and interval/set result | **5 exactly** | **multiple-choice** |

### `mat.u3.inecuaciones_producto_cociente` (NEW SKILL, P9p–w)

| Level | Source | Diff | Control |
|---|---|---|---|
| 3 | P9w: `(2x − 1)(x − 3) ≥ 0`; P9q: `x² ≤ x` | 3 | multiple-choice interval/set options |
| **4** | P9p (factor `x` preserved), P9r, P9t, P9u | **4** | multiple-choice interval/set options |
| **5 challenge** | P9v: `(x² − x)/((x + 1)(2 − x)) ≥ 0` full sign chart, preserving factor `x` | **5 exactly** | **multiple-choice** |

### `mat.u3.recta` (current max: 3; target: 4 + challenge 5)

| Level | Source | Diff | Control |
|---|---|---|---|
| 1, 2, 3 | existing `.2`–`.5` | 1, 2, 3 | existing |
| **4** | P12c, P12d (`y = −5 + (1/4)x`), P12g, P20a, P20b | **4** | multiple-choice equation/graph options |
| **5 challenge** | P21a–d (parámetro k en recta `2kx − 5y + 2k + 3 = 0`) | **5 exactly** | **multiple-choice** |

### `mat.u3.sistemas` (current max: 4; target: mandatory P34 + challenge 5)

| Level | Source | Diff | Control |
|---|---|---|---|
| 2, 3, 4 | existing `.2`–`.5` | 2, 3, 4 | existing |
| **4** | P25 classification; P27/P29 parameter; P32 homogeneous; P33 homogeneous with parameter; **P34 classification + graph + solution-set interpretation** | **4** | multiple-choice classification/graph/solution-set options |
| **5 challenge** | P28a–c (parameters p, s: sin/única/infinitas) | **5 exactly** | **multiple-choice** |

### `mat.u3.exponenciales` (current max: 3; target: 4 + challenge 5)

| Level | Source | Diff | Control |
|---|---|---|---|
| 1, 3 | existing `.2`–`.5` | 1, 3 | existing |
| **4** | P39b, P39c (factor común); P39m, P39n (cambio de variable) | **4** | multiple-choice solution/step options |
| **5 challenge** | P39e (series sum) or P39h (`4e^{−3x} − 5e^{−x} + e^x = 0`) | **5 exactly** | **multiple-choice** |

### `mat.u3.logaritmicas` (current max: 2; target: P37 + P38 + P40 + challenge 5)

| Level | Source | Diff | Control |
|---|---|---|---|
| 1, 2 | existing `.2`–`.5` | 1, 2 | existing |
| **2–3** | **P37a–d log expansion** before combining | **2–3** | multiple-choice expanded-expression options |
| **3** | P38a (corrected: `(1/3)·log x + (3/2)·log(x + 2)`), P38b, P38c | **3** | multiple-choice combined-log options |
| **3–4** | P40k (log eq + domain), P40n (cambio de base), P40m (domain `x < 1`, solution `x = 3 − √6`) | 3–4 | multiple-choice domain/solution options |
| **5 challenge** | P40l: `2·log₂(x²) − 2·log₂(−x) = 4` (domain `x < 0`, solution `x = −4`, no radicals) | **5 exactly** | **multiple-choice** |

### Existing `mat.u3.traduccion_lenguaje_verbal` (NOT in scope of this change)

| Level | Source | Diff |
|---|---|---|
| 1–3 | existing `.2`–`.6` | 1, 2, 3 |
| 5, 4 | desafio-01, desafio-02 (owned by `fortalecer-u3`) | 5, 4 |

This change preserves those 2 existing `traduccion_lenguaje_verbal` challenges unchanged.

---
## Scope separation from `fortalecer-u3`

`fortalecer-u3-lenguaje-modelizacion-transferencia` (PR 1 + PR 2 merged) owns `mat.u3.traduccion_lenguaje_verbal` (leaf skill with 5 MC exercises + 2 worked examples + 1 theory node `theory-traduccion-lenguaje-verbal`), two integrative desafios (diff 5 and 4) for that skill, 3 dedicated error tags (`u3_traduccion_incorrecta`, `u3_verificacion_omitida`, `u3_interpretacion_contextual_incorrecta`), and the generic modeling chain (definir variable → traducir → plantear → verificar → interpretar). This change does NOT re-implement the modeling chain. It does NOT touch `mat.u3.traduccion_lenguaje_verbal` exercises or theory. Both `traduccion_lenguaje_verbal.desafio-01` and `desafio-02` remain unchanged. New challenges added here belong to the new/expanded skills only.

Companion issue #82 may re-use the 3 modeling error tags for application-family exercises and should not create duplicate modeling tags without a concrete diagnostic need. THIS change may add structural error tags (e.g. `u3_discriminante_signo_incorrecto`, `u3_signchart_factor_signo_incorrecto`) for the new/expanded symbolic skills.

---
## canonicalTrace duality (corrected)

The `canonicalTrace.sourceUse` enum differs by surface:

| Surface | Valid values | Type source |
|---|---|---|
| `TheoryNode`, `WorkedExample`, `Exercise` | `"adapted" | "reinforcement" | "reference"` (exactly) | `src/domain/models/theory.ts:14` and runtime check `src/domain/catalog/content-loaders.ts:149-152` |
| `Challenge` (and only challenge) | `"canonical-source" | "adapted" | "calibrated-from-exam" | "solution-pattern"` | `src/lib/challenges/loader.ts:90,205-211` |

A prior version referenced `"alignment"`, invalid in either enum; that value was removed. canonicalTrace path contract: every new `canonicalTrace.path` must use `material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf` (the only verified existing-file path for this change); agents must not guess theory/exam path templates. Per-slot `sourceUse`: `reference` (canonical structure + minor formatting only); `adapted` (app-neutral Spanish rephrasing preserving canonical math structure); `reinforcement` (numerically different example of the same canonical family, e.g. different coefficients but same algebraic form).

---
## Review workload forecast

Comparable evidence: `fortalecer-u3` PR 1 ≈ `+501/-33` for one new leaf skill + 5 MC + 2 worked examples + 1 theory + 3 error tags + 3 detectors + tests; PR 2 (challenges) ≈ `+300` for 2 challenges + loader wiring + tests. Planning constraint for THIS change: **≥5,230 estimated changed lines across exactly 16 autonomous slices, each ≤ 400 changed lines** (per-slice budgets below sum to ≈5,230; ≥5,230 is the proposal/design floor, consistent with `tasks.md`); excludes #82 and #83. **All per-slice line budgets are forecasts (best estimates of what each slice WILL cost when applied), not measurements from prior runs.** S0 has NOT been applied; it is **planned** as four autonomous foundation slices (S0a–S0d) so no single slice exceeds the 400-line review budget and so the S0 foundation stays GREEN-on-its-own per slice without owning any exact-nine audit. **S1 is split into two autonomous slices** — S1a lineales (≤320) + S1b cuadraticas (≤380) — so no per-skill-content slice exceeds the 400-line review budget and so each per-skill slice owns its own RED→GREEN→REFACTOR test file with no test bleed across the lineales/cuadraticas boundary. **S11 alone flips the exact-nine / no-bleed / root-contained trace / compatibility audit to GREEN.**

### S0 four-way foundation structure (planned; uncommitted)

S0 owns four autonomous foundation slices with the four sole scopes documented below. **None of them turns the exact-nine audit GREEN; S11 alone** flips the exact-nine / no-bleed / root-contained trace / compatibility audit to GREEN. The S0 split is structured so every S0 slice is a stand-alone GREEN-on-its-own PR; the foundation test file `tests/__tests__/u3-s0-foundation.test.ts` (when it ships, owned by S0a) grows incrementally across S0b/S0c/S0d. The 4 compatibility fixtures ship in S0d because they are the most parser-backed deliverable and the natural completion point of the S0 foundation.

- **S0a** — Exercise-only `canonicalTrace` enum/type + pure parser + source-literal rejection tests. Sole responsibility: `ExerciseCanonicalTrace` and `ExerciseSourceUse = "reference" | "adapted" | "reinforcement"` in `src/domain/models/exercise.ts`; pure `parseOptionalCanonicalTrace` parser in `src/domain/catalog/content-loaders.ts` that rejects every other source literal at parse time. `SourceUse` widening in `src/domain/models/theory.ts` is the structural-input boundary — challenge-only enums (`canonical-source`, `calibrated-from-exam`, `solution-pattern`) stay challenge-side; `ChallengeCanonicalTrace` is a parallel-but-separate type in `src/lib/challenges/loader.ts` and never leaks onto base `Exercise`. RED: parser-rejection of `alignment`, `canonical-source`, `calibrated-from-exam`, `solution-pattern`, and any unknown string. **Exact-nine audit: INERT here.**
- **S0b** — Repository-root `Node` trace-path validator + audit tests. Sole responsibility: `src/lib/trace-path.ts` is the sole `node:fs`/`node:path` importer; it resolves against the repository root, rejects absolute paths and any `..` traversal, then checks existence. The validator stays generic ("resolves on disk"), with the canonical verified path `material_canonico/utn-frm/.../03_ej_utn.pdf` enforced elsewhere. Re-export of `node:fs` from `src/domain/` is forbidden (Next.js client bundling + AGENTS.md "no side effects in `src/domain/`"). RED: valid in-root existing path succeeds; missing path fails; absolute path fails; `..` escaping path fails. **Exact-nine audit: INERT here.**
- **S0c** — Validated U3 log progression metadata + comparator tests. Sole responsibility: optional `progressionFamily` + finite numeric `progressionOrder` on `Exercise`; pair-scoped `compareValidatedU3LogExercises` in `src/domain/catalog/index.ts` applies family/order precedence only when BOTH operands have `skillId === "mat.u3.logaritmicas"`, an allowed parsed family, and finite numeric order (rank expansion-before-combining, then order); legacy/fallback otherwise. `sortExercises` is re-routed through a `compareExercisesByMetadata` shim. RED: two qualified U3-log operands sorted by precedence; mixed-skill pair falls back; missing/empty metadata falls back; invalid family/order pair falls back. **Exact-nine audit: INERT here.**
- **S0d** — Generic loader unsupported type rejection + inert scoped audit scaffold + four literal compatibility fixtures + parser-backed tests. Sole responsibility: `src/lib/challenges/loader.ts` adds `VALID_CHALLENGE_TYPES` set + explicit type-reject (throws on `text`, `free-response`, or any non-structured type; difficulty 4|5 compatibility preserved). The scoped U3 alignment audit (`runU3AlignmentAudit` + `U3AlignmentAuditInput`/`Violation`/`Result`) is **INERT** in `src/domain/catalog/content-loaders.ts` (default `enabled: false`); the exact-nine GREEN audit is owned by **S11**, not S0d. The four `as const` literal frozen baselines in `tests/fixtures/compatibility/u3-{exercise,challenge,practice-progress,advanced-progress}-baseline.ts` carry all 42 pre-change IDs and are exercised through real production persistence parsers (`pre-utn.practice.v1` deserializer + `ChallengeAttempt`), not asserted on TypeScript shape alone — the legacy `material_canonico/Matemática/UNIDAD3_matemática.pdf` path is preserved because the verified `material_canonico/utn-frm/.../03_ej_utn.pdf` is the only existing-file path allowed in this change. **Exact-nine audit: INERT here; S11 alone flips it to GREEN.**

| Component | Budget | Sole responsibility (16 slices; 4 S0 scopes; S1 split into S1a lineales + S1b cuadraticas) |
|---|---:|---|
| S0a exercise-only `canonicalTrace` enum/type + parser + source-literal rejection tests | 360 | `ExerciseCanonicalTrace` + `ExerciseSourceUse` literal type; pure parser rejects every non-`reference`/`adapted`/`reinforcement` literal. |
| S0b repository-root `Node` trace-path validator + audit tests | 240 | `src/lib/trace-path.ts` sole `node:fs` importer; resolves to repo root, rejects absolute/`..`/missing. |
| S0c validated U3 log progression metadata + comparator tests | 260 | `progressionFamily`/`progressionOrder` parse + pair-scoped `compareValidatedU3LogExercises` for `mat.u3.logaritmicas`; legacy fallback otherwise. |
| S0d loader type rejection + inert audit scaffold + 4 fixtures + parser tests | 340 | `VALID_CHALLENGE_TYPES` reject in loader; `runU3AlignmentAudit` INERT (`enabled: false`); 4 `as const` fixtures parsed by real persistence parsers. |
| **S1a** lineales base content + lineales challenge | 320 | `ex.u3.ecuaciones_lineales.6` P1l diff-3 with **exact root `√10/5`** (irrational-coefficient distribution with surds); OWN tag `u3_racionalizacion_irracional` + scoped rational/irrational detector + feedback. `lineales.desafio-01` diff-5 MC carrying `03_ej_utn.pdf` trace. |
| **S1b** cuadraticas base content + cuadraticas challenge | 380 | `ex.u3.ecuaciones_cuadraticas.6` P5d diff-3 with **±9 symmetric roots**; `ex.u3.ecuaciones_cuadraticas.7` carries P6b `(−∞,0)∪(0,1/4)` + P6f `(−∞,−1/4)`; OWN tag `u3_discriminante_signo_incorrecto` + quadratic detector + feedback. `cuadraticas.desafio-01` diff-5 MC with `03_ej_utn.pdf` trace. |
| New absolute-value-equations skill infrastructure (S2) | 250 | Register `mat.u3.ecuaciones_valor_absoluto` leaf skeleton. |
| Absolute-value equations content + P9n diff-4 + 2 challenges (S3) | 380 | P8 base MC + P8g/P8b challenges + P9n OWN-anchor audit. |
| New product/quotient-inequalities skill infrastructure (S4) | 250 | Register `mat.u3.inecuaciones_producto_cociente` leaf skeleton. |
| Product/quotient sign-chart content + P9v challenge (S5) | 370 | P9p–w base MC sign-chart (factor `x` preserved) + P9v challenge. |
| Recta base extensions and P21 challenge (S6) | 320 | P12/P20 diff-4 parallel/perpendicular-by-point + P21 parameter-k challenge. |
| Sistemas P25–P34 base + P28 challenge (S7) | 380 | P34 MC classify + graph + solution-set; P28 two-parameter challenge. |
| Exponentials base extensions + P39e/h challenge (S8) | 360 | P39b/c/m/n factor-common / change-variable + P39e/h challenge. |
| Logarithms P37/P38/P40 base + P40l challenge (S9) | 380 | P37 log-expansion before P38 combining; P40k/m/n; P40l challenge. |
| Legacy U3 error-tag fix + compatibility regressions (S10) | 320 | Reclassify `u2_*` → `u3_*`; 4 fixtures re-parse via real production parsers; desafios preserved. |
| Integration verification, traceability audit, SDD closeout (S11) | 320 | **Exact-nine GREEN only here** + no-bleed + root-contained trace audit; `pnpm test/typecheck/build`. |
| **Total for THIS change** | **≥5,230** (sum of per-slice budgets = **5,230**) | Consistent with `tasks.md` (5,230). S1 split into S1a (lineales, 320) + S1b (cuadraticas, 380) replaces the old bundled S1 (340); per-slice budgets sum to 5,230 with no slice above 400. |

### PR-slicing plan: 16 autonomous slices, each ≤ 400 changed lines (forecasts)

| Slice | Autonomous subset | Line budget | Primary purpose |
|---|---|---:|---|
| **S0a** | Exercise-only `canonicalTrace` enum/type + parser + source-literal rejection tests | **360** | Typed `ExerciseCanonicalTrace` + `ExerciseSourceUse = "reference" \| "adapted" \| "reinforcement"` literal type in `src/domain/models/exercise.ts`. Pure `parseOptionalCanonicalTrace` parser in `src/domain/catalog/content-loaders.ts` rejects every other source literal at parse time (NEVER `alignment`, NEVER `canonical-source`, NEVER `calibrated-from-exam`, NEVER `solution-pattern` on base `Exercise`). `SourceUse` widening in `src/domain/models/theory.ts` is the structural-input boundary; `ChallengeCanonicalTrace` is a parallel-but-separate type in `src/lib/challenges/loader.ts`. RED: `canonicalTrace+source-literal-rejection` describe (5+ cases) in `tests/__tests__/u3-s0-foundation.test.ts`. **Exact-nine audit: INERT here.** |
| **S0b** | Repository-root `Node` trace-path validator + audit tests | **240** | `src/lib/trace-path.ts` Node-only `node:fs`/`node:path` wrapper that resolves against the repository root, rejects absolute paths and any `..` traversal, then checks existence. Sole `node:fs` importer for trace validation; re-exports from `src/domain/` would break Next.js client bundling (Turbopack rejects `node:fs`) AND violate AGENTS.md "no side effects in `src/domain/`". The validator stays generic; canonical verified path enforcement lives elsewhere. RED: `trace-path-validator` describe (4 cases: in-root existing succeeds; missing fails; absolute fails; `..` escaping fails). **Exact-nine audit: INERT here.** |
| **S0c** | Validated U3 log progression metadata + comparator tests | **260** | Optional `progressionFamily` + finite numeric `progressionOrder` on `Exercise`, plus `ProgressionFamily`/`ProgressionOrder` literal types. Pair-scoped `compareValidatedU3LogExercises` in `src/domain/catalog/index.ts` applies family/order precedence ONLY when BOTH operands have `skillId === "mat.u3.logaritmicas"`, an allowed parsed family, and finite numeric order (rank expansion-before-combining, then order); legacy/fallback otherwise. `sortExercises` re-routed through `compareExercisesByMetadata` shim. RED: `progression-meta+comparator` describe (4+ cases: two qualified U3-log operands sorted by precedence; mixed-skill falls back; missing metadata falls back; invalid family/order falls back). **Exact-nine audit: INERT here.** |
| **S0d** | Loader unsupported type rejection + inert scoped audit scaffold + 4 literal compatibility fixtures + parser-backed tests | **340** | `VALID_CHALLENGE_TYPES` set + explicit type-reject in `src/lib/challenges/loader.ts` (throws on `text`, `free-response`, or any non-structured type; difficulty 4\|5 compatibility preserved). `runU3AlignmentAudit` + `U3AlignmentAuditInput`/`Violation`/`Result` interfaces in `src/domain/catalog/content-loaders.ts` (INERT by default; `enabled: true` flips on — owned by **S11**, not S0d). Four `as const` frozen baselines in `tests/fixtures/compatibility/u3-{exercise,challenge,practice-progress,advanced-progress}-baseline.ts` carry all 42 pre-change IDs and are exercised through real production persistence parsers (`pre-utn.practice.v1` deserializer + `ChallengeAttempt`), not asserted on TypeScript shape alone — the legacy `material_canonico/Matemática/UNIDAD3_matemática.pdf` path is preserved because `material_canonico/utn-frm/.../03_ej_utn.pdf` is the only existing-file path allowed in this change. RED: `loader-type-reject` (4 cases) + `audit-inert` (2 cases) + `fixture-parse` (4 cases) describes in the same test file. **Exact-nine audit: INERT here; S11 alone flips it to GREEN.** |
| **S1a** | Lineales base content + lineales challenge | **320** | `ex.u3.ecuaciones_lineales.6` P1l diff-3 with **exact root `√10/5`** (irrational-coefficient distribution with surds); OWN tag `u3_racionalizacion_irracional` + scoped rational/irrational detector + feedback. `lineales.desafio-01` diff-5 MC structured equation/solution/step pair carrying `03_ej_utn.pdf` trace. #82/#83 no-bleed. **Own test file**: `tests/__tests__/u3-lineales.test.ts`. |
| **S1b** | Cuadraticas base content + cuadraticas challenge | **380** | `ex.u3.ecuaciones_cuadraticas.6` P5d diff-3 with **±9 symmetric roots** (`(7x² − 3)/4 = 141` ⇒ `7x² − 3 = 564` ⇒ `x² = 81` ⇒ `x = ±9`); `ex.u3.ecuaciones_cuadraticas.7` carries P6b `(−∞,0)∪(0,1/4)` + P6f `(−∞,−1/4)`; OWN tag `u3_discriminante_signo_incorrecto` + quadratic detector + feedback. `cuadraticas.desafio-01` diff-5 MC with `03_ej_utn.pdf` trace. #82/#83 no-bleed. **Own test file**: `tests/__tests__/u3-cuadraticas.test.ts`. |
| **S2** | New absolute-value-equations skill infrastructure | **250** | Register `mat.u3.ecuaciones_valor_absoluto` leaf skeleton (catalog/pilot/theory/example/feedback/error-tag). |
| **S3** | Absolute-value-equations content + P9n + 2 challenges | **380** | P8 base MC (incl. P8g corrected); P8g+P8b challenges; P9n diff-4 OWN-anchor audit. |
| **S4** | New product/quotient-inequalities skill infrastructure | **250** | Register `mat.u3.inecuaciones_producto_cociente` leaf skeleton. |
| **S5** | Product/quotient content and P9v challenge | **370** | P9p–w base MC sign-chart (factor `x` preserved) + P9v challenge. |
| **S6** | Recta base extensions and P21 challenge | **320** | P12/P20 diff-4 parallel/perpendicular-by-point + P21 parameter-k challenge. |
| **S7** | Sistemas P25–P34 base + P28 challenge | **380** | P34 MC classify + graph + solution-set; P28 two-parameter challenge. |
| **S8** | Exponentials base extensions + P39e/h challenge | **360** | P39b/c/m/n factor-common / change-variable + P39e/h challenge. |
| **S9** | Logarithms P37/P38/P40 base + P40l challenge | **380** | P37 log-expansion before P38 combining; P40k/m/n; P40l challenge. |
| **S10** | Legacy U3 error-tag fix + compatibility regressions | **320** | Reclassify `u2_*` → `u3_*` on `ex.u3.ecuaciones_lineales.1`; 12 `u3_*` tags + feedback + detectors; 4 fixtures re-parse via real production parsers; desafios preserved. |
| **S11** | Final integration; **exact-nine GREEN only here** | **320** | **S11 alone** flips the exact-nine / no-bleed / root-contained trace / compatibility audit to GREEN; consumes S0a parser + S0b validator; per-surface trace enforce at loader; repo-contained trace audit; no-bleed #82/#83; `pnpm run test/typecheck/build`; commits `verify-report.md`. **S11 GREEN; S0–S10 OWN-anchor only.** |
| **Total** |  | **≥5,230** (= 5,230 sum of per-slice budgets; each ≤ 400) | Forecast sum (best estimate); actual implementation costs may vary per slice. Every slice is ≤ 400. S1 split into S1a (lineales, 320) + S1b (cuadraticas, 380) replaces the old bundled S1 (340). |

---
## Issue-ready title, body, acceptance criteria

### Title

`feat(u3): align symbolic/core canonical practice (P1/P5/P6/P8/P9/P12/P20/P21/P25/P27-P29/P32-P34/P37-P40)`

### Body

Unit 3 currently has 42 practice exercises (37 in `content/matematica/exercises/unit-3.json` + 5 legacy `.1` in `content/matematica/exercises.json`) across 9 skills. Across those skills, current coverage misses the canonical symbolic/core maximum from `03_ej_utn.pdf`: `ecuaciones_lineales` lacks diff-3 rational/irrational-coefficient practice; `ecuaciones_cuadraticas` lacks diff-4 discriminant parameter practice; P8 absolute-value equations and P9p–w product/quotient inequalities have no skill; `inecuaciones_valor_absoluto`, `recta`, `sistemas`, `exponenciales`, and `logaritmicas` need the diff-4 families documented here. **P34 is mandatory** for `sistemas` classification + graph + solution-set interpretation. **P37 is mandatory** for `logaritmicas` expansion before P38 combining.

This change adds the missing base exercises up to canonical maximum, introduces two new skills (`mat.u3.ecuaciones_valor_absoluto` for P8, `mat.u3.inecuaciones_producto_cociente` for P9p–w), adds exactly **9 new difficulty-5 challenges** (one per expanded skill/family), requires those 9 challenges to use structured controls (planned as MC), enforces the U3 policy that base exercises are difficulty 1–4 while the new challenge entries are difficulty exactly 5 (TypeScript accepts 1–5 generally; tests enforce this content policy), and corrects the legacy `u2_*` error tags on `ex.u3.ecuaciones_lineales.1` to `u3_*` tags.

Known mathematical truths remain unchanged: P6 k-sets, P8g solution set `{−10.5, 10.5}`, P9p factor `x`, P9s `≥`, P9v `≥`, P5d `(7x² − 3)/4 = 141`, P12d slope `1/4`, P38a coefficient `3/2`, P39l solution `x = 2` from `105·5^{x−1}`, **P40m domain `x < 1` with solution `x = 3 − √6` inside the domain**, P40l with no radicals, valid `canonicalTrace.sourceUse` enums, and existing-file-only `canonicalTrace.path` values.

**Workload**: ≥**5,230** estimated changed lines across exactly **16** autonomous slices, each **≤ 400** changed lines (per-slice forecasts sum to ≈5,230; consistent with `tasks.md` 5,230; `design.md` and `proposal.md` already reflect the 16-slice / ≥5,230 / S1a+S1b state). S0 is **planned** as four autonomous foundation slices (S0a–S0d: 360 + 240 + 260 + 340 = 1,200) so no S0 slice exceeds 400 lines; the S0 foundation owns ZERO audit GREEN — **S11 alone** flips the exact-nine / no-bleed / root-contained trace / compatibility audit to GREEN. S1 is split into two autonomous slices S1a lineales (320) + S1b cuadraticas (380) so no per-skill-content slice exceeds the 400-line review budget; each owns its own RED→GREEN→REFACTOR test file with no bleed across the lineales/cuadraticas boundary. Chain ordering is delegated to `sdd-tasks`; if a real slice breaches 400, split it instead of hiding the overage. **Status registration**: `openspec/changes/STATUS.json` already registers this change as `in-progress` with `companionIssues: [82, 83]`.

### Acceptance criteria

#### Base skill gaps (in THIS change)

- [ ] `mat.u3.ecuaciones_lineales` has ≥ 1 diff-3 exercise for rational-coefficient equations (P1c/g/j/k/l/m/n family).
- [ ] `mat.u3.ecuaciones_cuadraticas` has ≥ 1 diff-4 exercise for discriminant analysis (P6a–g family, with one MC per condition using the k-sets in this exploration: P6a `{−12,12}`, P6b `(−∞,0)∪(0,1/4)`, P6c `(−4,0)`, P6d `{−4,0}`, P6e `(−∞,−4)∪(0,∞)`, P6f `(−∞,−1/4)`, P6g `(−∞,1/3]`).
- [ ] `mat.u3.ecuaciones_cuadraticas` has ≥ 1 diff-3 exercise that uses P5d **(7x² − 3)/4 = 141** (numerator retains `−3`).
- [ ] `mat.u3.inecuaciones_valor_absoluto` has ≥ 1 diff-4 exercise for term-on-both-sides absolute-value inequality (P9n or P9o).
- [ ] `mat.u3.recta` has ≥ 1 diff-4 exercise for parallel by point AND ≥ 1 for perpendicular by point (P12c/d/g or P20a/b family).
- [ ] `mat.u3.sistemas` has ≥ 1 diff-4 exercise for SPD/SCI/SI classification without solving (P25 family).
- [ ] `mat.u3.sistemas` has ≥ 1 diff-4 exercise for parameter-based classification (P27/P29 or P33 family).
- [ ] `mat.u3.sistemas` has ≥ 1 diff-4 exercise for homogeneous systems (P32 family).
- [ ] `mat.u3.sistemas` has ≥ 1 diff-4 exercise for **P34 classification + graph + solution-set interpretation**.
- [ ] `mat.u3.exponenciales` has ≥ 1 diff-4 exercise for factor-common exponential (P39b or P39c).
- [ ] `mat.u3.exponenciales` has ≥ 1 diff-4 exercise for change-of-variable exponential (`9^{x²+2x−3} = 1` for P39m and/or `9^x − 2·3^x − 3 = 0` for P39n).
- [ ] `mat.u3.logaritmicas` has ≥ 1 diff-2/3 exercise for **P37 log expansion** before P38 combining.
- [ ] `mat.u3.logaritmicas` has ≥ 1 diff-3 exercise for logarithm combining (P38 family), using `(1/3)·log x + (3/2)·log(x + 2)` (NOT `2/3`).
- [ ] `mat.u3.logaritmicas` has ≥ 1 diff-3 exercise for `log₂(x + 4) + log₂(x − 4) = 2` with domain validity (P40k).
- [ ] `mat.u3.logaritmicas` has ≥ 1 diff-4 exercise for `log₂(x² − 7x + 8) + log₂(1 − x) = 1` with domain `x < 1` / `(-∞, 1)` and solution `x = 3 − √6` verified inside that domain (P40m).
- [ ] `mat.u3.logaritmicas` has ≥ 1 diff-4 exercise for `log_√5(x+1) − log₅(x+1) = log₅7` change-of-base (P40n).

#### New skills (in THIS change)

- [ ] **New skill `mat.u3.ecuaciones_valor_absoluto`** created for P8a–i `\|ax+b\| = k` equation family (separate from `inecuaciones_valor_absoluto`). ≥ 5 base MC exercises covering diff 1 (P8a/c), diff 2 (P8d/e/f/h), diff 3 (P8i + P8g corrected). Leaf in `UNIT_3_SKILLS` and `PILOT_SKILLS` (no global prereq).
- [ ] **New skill `mat.u3.inecuaciones_producto_cociente`** created for P9p–w product/quotient/quadratic/rational inequalities sign-chart family. ≥ 5 base MC exercises covering diff 3 (P9w, P9q) and diff 4 (P9p with factor `x` preserved, P9r, P9t, P9u).
- [ ] Each new skill has its own theory node + ≥ 1 worked example + ≥ 1 feedback mapping + ≥ 1 runtime-reachable error tag with detector.

#### Difficulty-5 challenges (exactly 9 new structured challenges in THIS change)

- [ ] The challenge loader contains exactly these 9 new challenge skill IDs for this change and no others: `mat.u3.ecuaciones_lineales`, `mat.u3.ecuaciones_cuadraticas`, `mat.u3.ecuaciones_valor_absoluto`, `mat.u3.inecuaciones_valor_absoluto`, `mat.u3.inecuaciones_producto_cociente`, `mat.u3.recta`, `mat.u3.sistemas`, `mat.u3.exponenciales`, `mat.u3.logaritmicas`.
- [ ] Every one of the 9 new challenges has `difficulty === 5` exactly.
- [ ] Every one of the 9 new challenges uses `multiple-choice` (planned control) and does not use `text` or free-form symbolic input.
- [ ] `mat.u3.ecuaciones_lineales` challenge: structured MC for irrational-coefficient linear equation (P1l anchor), selecting equation/solution/step pair.
- [ ] `mat.u3.ecuaciones_cuadraticas` challenge: structured MC for Bhaskara/discriminant with parameter in quadratic coefficient (P6b/P6f extension).
- [ ] `mat.u3.ecuaciones_valor_absoluto` challenge: structured MC for P8g-style equation plus no-solution contrast; selects valid solution set and justification.
- [ ] `mat.u3.inecuaciones_valor_absoluto` challenge: structured MC for parameter in absolute-value inequality.
- [ ] `mat.u3.inecuaciones_producto_cociente` challenge: structured MC for P9v full sign chart `(x² − x)/((x + 1)(2 − x)) ≥ 0`, preserving factor `x`.
- [ ] `mat.u3.recta` challenge: structured MC for P21 parameter-k line family (`2kx − 5y + 2k + 3 = 0`).
- [ ] `mat.u3.sistemas` challenge: structured MC for P28 two-parameter system `(p, s)` with no/unique/infinitely-many cases.
- [ ] `mat.u3.exponenciales` challenge: structured MC for P39e series sum or P39h `4e^{−3x} − 5e^{−x} + e^x = 0`.
- [ ] `mat.u3.logaritmicas` challenge: structured MC for P40l domain-aware equation `2·log₂(x²) − 2·log₂(−x) = 4` (domain `x < 0`; solution `x = −4`; no radicals). Existing 2 desafios owned by `fortalecer-u3` (`traduccion_lenguaje_verbal.desafio-01` diff 5, `.desafio-02` diff 4) are kept unchanged.

#### Policy & contract enforcement (in THIS change)

- [ ] Delta spec for `practice-coverage` enforces U3 policy: planned base exercises in THIS change are difficulty 1–4; the 9 new challenge entries are difficulty exactly 5. This policy is NOT enforced by the TypeScript type system, which accepts 1–5 generally.
- [ ] Per-skill content test asserts that no new base exercise in `unit-3.json` for the 9 in-scope skills has `difficulty === 5`.
- [ ] Challenge content test asserts the exact 9 challenge skill IDs listed above and `difficulty === 5` for every new challenge.
- [ ] Structured-control test rejects `text`, free-form symbolic input, and any answer shape prohibited by AGENTS.md for the 9 new challenges and for new structured-math exercises.
- [ ] `canonicalTrace.sourceUse` for every new exercise/theory item is `reference` or `adapted` or `reinforcement`. NEVER `alignment`. NEVER `canonical-source`.
- [ ] `canonicalTrace.sourceUse` for every new challenge is one of `canonical-source | adapted | calibrated-from-exam | solution-pattern`.
- [ ] Every new `canonicalTrace.path` resolves to an existing repository file. For this change the required verified path is `material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf`; agents must not emit guessed theory/exam path templates.
- [ ] P5d exercise in scope as `(7x² − 3)/4 = 141` (numerator retains `−3`), NOT `7x²/4 = 141`.
- [ ] P8g exercise has solution set `{−10.5, 10.5}` and the prompt transcription `- |x| = - |-9| - |-1,5|` (NOT "no solution" and NOT −10.5 alone).
- [ ] P9p exercise factors to `x(2x − 1)(x + ½) ≥ 0` (factor `x` preserved, never dropped); sign chart roots at `−½, 0, ½`; solution `[−½, 0] ∪ [½, ∞)`.
- [ ] P9s exercise uses `½x − ¼ ≥ ½` (NOT `≤`).
- [ ] P9v exercise uses `(x² − x)/((x + 1)(2 − x)) ≥ 0` (NOT `≤ 0`).
- [ ] P39l exercise uses `5^{x+2} − 105·5^{x−1} = 100` (NOT `10√5^{x−1}`); solution `x = 2`.
- [ ] P40l exercise uses `2·log₂(x²) − 2·log₂(−x) = 4` (NO `√` symbols); domain `x < 0`; solution `x = −4`.
- [ ] P12d exercise perpendicular reference slope is `1/4` (NOT `4/1`).
- [ ] P38a exercise uses `(1/3)·log x + (3/2)·log(x + 2)` (NOT `2/3`).
- [ ] P36a exercise uses `log 25 + log 40 =` (base 10, NOT `log₂5 + log₄0` undefined).
- [ ] P36b exercise uses `log₂40 − log₂10`.
- [ ] Legacy `u2_*` error tags on `ex.u3.ecuaciones_lineales.1` reclassified to `u3_*` tags (e.g. `u3_aislamiento_incorrecto`, `u3_signo_desigualdad`).

#### Companion issues and no-orphan guarantee

- [ ] **#82 and #83 exist and are linked** (#82: P7, P10a–h, P13–P19, P31a–j; #83: P22, P23, P30), each with body enumerating owned families and acceptance requiring ≥ 1 canonical-aligned exercise per family.
- [ ] `openspec/changes/STATUS.json` links both companions via `companionIssues: [82, 83]`.
- [ ] No canonical family in `03_ej_utn.pdf` is silently dropped; every row in the no-orphan ownership matrix resolves to THIS change, #82, #83, or an explicitly retained existing baseline.

#### Quality gates (per PR slice)

- [ ] `pnpm run test && pnpm run typecheck && pnpm run build` all pass on each PR slice.
- [ ] Exactly **16** autonomous slices are planned in this exploration; each slice is budgeted at ≤ 400 changed lines and the sum is **≥5,230** estimated changed lines (forecast sum = 5,230; consistent with `tasks.md`; `design.md` and `proposal.md` already reflect 16-slice / ≥5,230 / S1a+S1b state). **S0 is planned (not applied) as four autonomous foundation slices (S0a–S0d)** — each ≤ 400 lines — so the S0 foundation stays within the ≤400 invariant without owning the exact-nine audit. **S1 is split into two autonomous slices** S1a lineales (320) + S1b cuadraticas (380); each owns its own RED→GREEN→REFACTOR test file with no bleed across the lineales/cuadraticas boundary. **S11 alone** flips the exact-nine / no-bleed / root-contained trace / compatibility audit to GREEN.
- [ ] If actual implementation cannot fit a slice within ≤ 400 changed lines, `sdd-tasks` must split the slice and declare the higher real slice count.
- [ ] No application-family implementation from #82 and no P22/P23/P30 implementation from #83 is included in THIS change.
- [ ] Compatibility regressions cover catalog loading, progress/readiness behavior for the two new skill IDs, challenge registration, and preservation of the 2 existing `traduccion_lenguaje_verbal` challenges.

---
## Risks

1. **Slice pressure**: ≥5,230 estimated lines across 16 slices leaves little slack; if a slice exceeds 400, split it, do not hide the overage. S0 is split pre-emptively into four autonomous slices S0a–S0d (≤400 each) and S1 is split pre-emptively into two autonomous slices S1a lineales (320) + S1b cuadraticas (380) so the foundation and the per-skill-content phases stay within the invariant from the start; the same rule applies prospectively to any future slice.
2. **Two new skills require full infrastructure**: `mat.u3.ecuaciones_valor_absoluto` and `mat.u3.inecuaciones_producto_cociente` each need catalog + theory + ≥ 1 worked example + ≥ 5 base MC + feedback + ≥ 1 error tag + ≥ 1 detector + tests; splitting infrastructure from content is what makes the 15-slice budget credible.
3. **Structured-control drift**: symbolic families tempt free-form answers; apply must keep the 9 new challenges as MC and reject `text`/free-form symbolic shapes prohibited by AGENTS.md.
4. **Companion-scope bleed**: #82 owns P7/P10/P13–P19/P31 and #83 owns P22/P23/P30; any slice implementing those families must be rejected in review.
5. **OCR-decoded vs PDF-direct divergence**: 12+ transcription errors fixed (P5d, P8g, P9p, P9s, P9v, P12d, P38a, P39a, P39l, P40l, P36a, P36b); apply must verify accepted expressions visually against the rendered PDF before merging each relevant slice.
6. **canonicalTrace contract**: `alignment` is invalid for every surface; `canonical-source` is valid for challenges only; `canonicalTrace.path` must resolve to an existing repository file (`03_ej_utn.pdf` for this change); theory/exam paths must be discovered and verified, not guessed.
7. **Legacy `u2_*` tag debt**: correcting `ex.u3.ecuaciones_lineales.1` changes legacy content and must be covered by compatibility/regression tests.

---
## Ready for proposal

Yes — the latest five blockers are closed: **Definitive ownership** (P34/P37 mandatory in THIS; #82 owns P7/P10/P13–P19/P31; #83 owns P22/P23/P30; both linked and registered); **Exactly 9 new challenges** (one per expanded skill/family; existing `traduccion_lenguaje_verbal` desafios unchanged); **Structured controls** (all 9 are MC; tests reject `text`/free-form/AGENTS-prohibited shapes); **Exact difficulty policy** (base 1–4, challenges `=== 5`, TypeScript 1–5 general acceptance stated as type behavior not content policy); **Truthful slicing** (16 autonomous slices, each ≤ 400, ≥5,230 total — per-slice budgets sum to ≈5,230; consistent with `tasks.md` 5,230; **S0 is planned**, not applied, as four autonomous foundation slices S0a–S0d with the four sole scopes documented in the "S0 four-way foundation structure" sub-section, and S0 owns ZERO audit GREEN — **S11 alone** flips the exact-nine / no-bleed / root-contained trace / compatibility audit to GREEN; **S1 is split into S1a lineales (320) + S1b cuadraticas (380)** so the per-skill-content phase stays within the ≤400 invariant from the start and each slice owns its own RED→GREEN→REFACTOR test file); **Issue-ready contract** (title says symbolic/core alignment; body and acceptance link #82/#83; criteria cover P34/P37, corrected P40m domain, valid `canonicalTrace` enums, existing-file-only `canonicalTrace.path`, compatibility, no-orphan ownership, per-slice budget); **Latest gate corrections** (P40m domain is `x < 1` / `(-∞, 1)` with solution `x = 3 − √6` inside the domain; P1l algebraic root `√10/5` derived and preserved; guessed theory/exam paths removed from the canonicalTrace contract).

Next recommended phase: `propose`.
