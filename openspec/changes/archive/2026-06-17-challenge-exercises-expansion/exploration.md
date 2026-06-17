## Exploration: challenge-exercises-expansion

### Current State

The challenge system is **fully shipped, isolated from the base flow, and untouched by this change**. It was introduced in `openspec/changes/challenge-exercises/` and consists of:

- **Content**: `content/matematica/challenges/unit-1.json` (4 challenges) and `unit-2.json` (2 challenges). Each entry is a standard `Exercise` with three additional markers: `challengeSection: true`, `category: "desafio"`, `tags: ["desafio", "integrador"]`. Plus `canonicalTrace` (≥1 entries, each with `path`, `section`, `sourceUse`, `pedagogicalIntent`).
- **Loader**: `src/lib/challenges/loader.ts` validates every entry at module init (parses cache, throws on malformed) and exposes `loadChallengesForSkill(skillId)` / `loadChallengesForUnit(unit)`. `CHALLENGE_ID_PATTERN = /^ex\.u([1-6])\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/`. Difficulty must be `4 | 5`. `sourceUse` ∈ {`canonical-source`, `adapted`, `calibrated-from-exam`, `solution-pattern`}.
- **Domain facade**: `src/domain/catalog/challenges/{index,types}.ts` re-exports `queryChallengesBySkill`, `hasChallengesForSkill`, types. No coupling to `src/domain/catalog/index.ts` (the base catalog).
- **Persistence**: `src/lib/advanced-practice-progress.ts` owns a separate localStorage key `pre-utn.advanced-practice.v1` with per-skill `advancedReadinessBySkill` (0–100). Base `src/lib/practice-progress.ts` is forbidden from importing it and vice-versa.
- **UI**: `src/components/practice/challenges/` mounts `<ChallengeOptInBlock />` inside the base `complete` phase. No new entry in the `PracticePhase` union — challenges are a sibling visual section, not a phase.

**Three pilot skills already ship challenges**: `mat.u1.complejos` (2), `mat.u1.valor_absoluto` (2), `mat.u2.ecuaciones_fraccionarias` (2). Total: **6 challenges across 3 skills**.

The rest of the 15 pilot skills (8 in U1, 7 in U2) have **zero challenges**. They are the expansion target. U3–U6 skills are not yet pilot (per `PILOT_SKILLS` in `src/domain/catalog/pilot-skills.ts`), so they're out of scope for this expansion.

Verified status (per user): 2053/2053 tests, typecheck clean, build green, Vercel live.

### Affected Areas

- `content/matematica/challenges/unit-1.json` — append challenges for the 5 remaining U1 pilot skills.
- `content/matematica/challenges/unit-2.json` — append challenges for the 5 remaining U2 pilot skills (the 6th, `ecuaciones_fraccionarias`, already has challenges).
- `openspec/changes/challenge-exercises-expansion/` — new change folder created by this exploration.
- `openspec/changes/STATUS.json` — add a new entry on apply completion.

**Explicitly NOT touched** (per the user's hard constraints):
- `src/lib/challenges/loader.ts` (loader module)
- `src/domain/catalog/challenges/{index,types}.ts` (facade)
- `src/lib/advanced-practice-progress.ts` (advanced store)
- `src/components/practice/challenges/*` (challenge UI)
- `src/app/practice/{page.tsx,usePracticeFlow.ts,phases.ts}` (base flow)
- `src/lib/practice-progress.ts` and `pre-utn.practice.v1` (base progress)
- `src/domain/progress/index.ts` and `computeMasteryLevel` (base mastery)
- Any standard exercise JSON, theory, examples, or feedback for U1/U2

### Complete Skill Catalog

The full catalog of **15 pilot skills** (`mat.u1.*` ∪ `mat.u2.*`), with challenge coverage flag and source file. Confirmed against `src/domain/models/skill-catalog.ts` and `src/domain/catalog/pilot-skills.ts`.

| Skill ID | Unit | Topic (short) | Has challenges? | Source file (standard) |
|---|---|---|---|---|
| `mat.u1.conjuntos_numericos` | U1 | Conjuntos numéricos | **No** | `content/matematica/exercises/conjuntos-numericos.json` (44 ex.) + `unit-1.json` (5) |
| `mat.u1.propiedades_operaciones_reales` | U1 | Propiedades Operaciones de Reales | **No** | `content/matematica/exercises/unit-1.json` (4) |
| `mat.u1.potencias_raices` | U1 | Potencias y raíces | **No** | `content/matematica/exercises/unit-1.json` (6) |
| `mat.u1.racionalizacion` | U1 | Racionalización de denominadores | **No** | `content/matematica/exercises/unit-1.json` (12) |
| `mat.u1.intervalos` | U1 | Intervalos | **No** | `content/matematica/exercises/unit-1.json` (4) |
| `mat.u1.valor_absoluto` | U1 | Valor absoluto | **Yes (2)** ✓ | `content/matematica/exercises/unit-1.json` (8) |
| `mat.u1.logaritmos` | U1 | Logaritmos | **No** | `content/matematica/exercises/unit-1.json` (11) |
| `mat.u1.complejos` | U1 | Números complejos | **Yes (2)** ✓ | `content/matematica/exercises/unit-1.json` (12) |
| `mat.u2.polinomios_basico` | U2 | Polinomios: definición y clasificación | **No** | `content/matematica/exercises/unit-2.json` (5) |
| `mat.u2.operaciones_polinomios` | U2 | Operaciones con polinomios | **No** | `content/matematica/exercises/unit-2.json` (5) |
| `mat.u2.ruffini_resto` | U2 | Regla de Ruffini y teorema del resto | **No** | `content/matematica/exercises/unit-2.json` (5) |
| `mat.u2.factorizacion` | U2 | Factorización de polinomios | **No** | `content/matematica/exercises/unit-2.json` (4) |
| `mat.u2.gauss` | U2 | Método de Gauss | **No** | `content/matematica/exercises/unit-2.json` (4) |
| `mat.u2.mcm_mcd_polinomios` | U2 | MCM y MCD de polinomios | **No** | `content/matematica/exercises/unit-2.json` (4) |
| `mat.u2.ecuaciones_fraccionarias` | U2 | Ecuaciones fraccionarias | **Yes (2)** ✓ | `content/matematica/exercises/unit-2.json` (4) |

**Total**: 12 skills pending (5 in U1, 7 in U2 but 1 already covered → 6 in U2). Wait, recount: U1 has 3 covered (valor_absoluto, complejos) — actually 2 covered, so **5 remaining U1 skills**. U2 has 1 covered (ecuaciones_fraccionarias), so **6 remaining U2 skills**. **12 skills total need 2 challenges each = 24 new challenge entries.**

### Challenge Schema (canonical reference)

The schema is the existing `ChallengeExercise` interface in `src/domain/catalog/challenges/types.ts`, which extends `Exercise`. Every challenge is a JSON object inside `unit-{1,2}.json`. The reference shape is `ex.u{unit}.{slug}.desafio-{NN}`.

**Canonical reference entry** (taken verbatim from `content/matematica/challenges/unit-1.json`, ex.u1.complejos.desafio-01 — 38 lines):

```json
{
  "id": "ex.u1.complejos.desafio-01",
  "skillId": "mat.u1.complejos",
  "type": "multiple-choice",
  "difficulty": 4,
  "prompt": "Si $z = a + bi$ satisface $z^2 = 3 + 4i$, ¿cuál de las siguientes es una solución correcta para $z$?",
  "expectedAnswer": "$z = 2 + i$",
  "options": [
    "$z = 2 + i$",
    "$z = 2 - i$",
    "$z = -2 + i$",
    "$z = 1 + 2i$"
  ],
  "commonErrorTags": [
    "u1_complejos_signo_i_cuadrado",
    "u1_complejos_mala_separacion_real_imaginaria"
  ],
  "pedagogicalNote": "Igualando partes reales e imaginarias: a² - b² = 3, 2ab = 4 → ab = 2. Resolviendo: a² = 4, b² = 1, b = 2/a → b = ±1. Con a = 2, b = 1 da z = 2 + i. El distractor 2-i invierte el signo de b; 1+2i no satisface ab=2.",
  "challengeSection": true,
  "category": "desafio",
  "tags": ["desafio", "integrador"],
  "relatedTheoryIds": [
    "theory-complejos"
  ],
  "canonicalTrace": [
    {
      "path": "material_canonico/Matemática/UNIDAD1_matemática.pdf",
      "section": "Números Complejos — Forma Binómica y Operaciones",
      "sourceUse": "canonical-source",
      "pedagogicalIntent": "Requiere que el alumno despeje un sistema de dos ecuaciones con dos incógnitas来源于 binomio al cuadrado. Integra operaciones con i, separación real/imaginaria y resolución de sistema."
    },
    {
      "path": "material_canonico/Matemática/Examen_Matemática_TEMA 1 RESPUESTAS.pdf",
      "section": "Complejos — Ejercicio de resolución",
      "sourceUse": "calibrated-from-exam",
      "pedagogicalIntent": "Nivel de dificultad comparable a item de examen de ingreso. El distractor 1+2i simula error de separar a²-b²=3 y 2ab=4 como si fueran independientes del sistema."
    }
  ]
}
```

**Field-by-field notes** (validated against `loader.ts` + `types.ts`):

| Field | Required | Type | Notes from existing 6 entries |
|---|---|---|---|
| `id` | yes | string | Pattern `ex.u{1-6}.{slug}.desafio-{NN}`. Always `.desafio-01` and `.desafio-02` per skill. |
| `skillId` | yes | `SkillId` | One of the 15 pilot skill ids above. |
| `type` | yes | `ExerciseType` | All 6 existing challenges use `"multiple-choice"`. The base validator (`src/domain/models/exercise.ts`) requires `options.length ≥ 2` and `expectedAnswer ∈ options`. **Recommended: stick with `multiple-choice` for all new challenges** to keep visual + UX consistent and stay clear of the AGENTS.md exercise-design restrictions (see below). |
| `difficulty` | yes | `4 \| 5` | All 6 existing entries use `4`. Keep at `4` unless the design needs `5`. |
| `prompt` | yes | string | LaTeX via `$...$`. Must be self-contained (no reference to "the previous exercise"). |
| `expectedAnswer` | yes | string | Must be exactly one of the `options` values. |
| `options` | when `type === "multiple-choice"` | string[] | All 6 entries use **4 options**. AGENTS.md permits ≥3, but 4 is the established convention for challenges. |
| `commonErrorTags` | yes | string[] | Tag ids that match `src/domain/error-taxonomy/` taxonomy. **Critical for skill-catalog acceptance and pedagogical traceability** — must reference real tag ids, not free strings. |
| `pedagogicalNote` | yes | string | Free-form, but must explain the reasoning AND explicitly call out what each distractor traps. |
| `challengeSection` | yes | literal `true` | Loader throws if anything else. |
| `category` | yes | literal `"desafio"` | Loader throws otherwise. |
| `tags` | yes | `["desafio", "integrador"]` | Loader throws if either tag is missing. |
| `relatedTheoryIds` | optional but used | string[] | Used by traceability audit to link back to theory. All 6 entries include exactly 1 (`theory-<slug>`). |
| `canonicalTrace` | yes | `ChallengeCanonicalTrace[]` | **Required, ≥1 entry**. Each entry has `path`, `section`, `sourceUse`, `pedagogicalIntent`. All 6 entries have exactly 2 entries (one `canonical-source` from `UNIDAD{N}_matemática.pdf`, one `calibrated-from-exam` or `solution-pattern` from an exam/resolution PDF). |
| `unit` | NOT set | — | Loader does **not** derive unit from id; the loader's `unitFromSkillId(skillId)` derives it from `skillId`. Don't set `unit` on challenge entries. |

**Distractor strategy observed in existing entries** (this is the "pedagogical quality" the user's brand asks for):

1. **Sign confusion**: `2+i` vs `2-i` (cambia el signo de la parte imaginaria). Catches the "olvido el ±" failure.
2. **Wrong root entirely**: `-2+i` (signo equivocado en parte real). Catches the "olvido el doble signo".
3. **Conceptual misapplication**: `1+2i` (no satisface la ecuación; cumple `a²-b²=3` pero NO `2ab=4`). Catches the "trato las dos ecuaciones como independientes".
4. **Domain violations**: `{2, -3}` for an ecuación fraccionaria (catches "resuelvo sin verificar denominadores").
5. **Bracket-vs-paren**: `(-5, 2)` vs `[-5, 2]` for interval problems. Catches the "≤ vs < confusion".
6. **Intersection-vs-union**: `(-∞, -5] ∩ [7/2, ∞)` (intersección vacía) vs `(-∞, -5] ∪ [7/2, ∞)` (solución correcta). Catches the "confunde AND/OR en desigualdades con valor absoluto".

This is the pattern new challenges must follow. **Distractors should be derived from `commonErrorTags`, not invented arbitrarily.**

### Difficulty Calibration (from canonical material)

I read the canonical material relevant to the 12 remaining skills: `UNIDAD1_matemática.pdf` (full U1 content), `UNIDAD2_matemática.pdf` (full U2 content through ch. 15 on ecuaciones fraccionarias), `Examen_Matemática_TEMA 1 RESPUESTAS.pdf` (full 10-item exam with resolution), and `Examen_Matemática_TEMA 2 RESPUESTAS.pdf` / `Resolución_MATEMÁTICA_TEMA 2.pdf` headers. Verified U1 and U2 chapter structure maps 1:1 to the 15 pilot skills.

**What "difficulty ≥ 4" feels like in UTN exam terms** (based on TEMA 1):

- **Q1 (complejos)**: Resolver `2 + 2i − 3z = z(−2 + 3i) + 4`. → **difficulty 4–5**. Requires algebraic manipulation of complex expressions with isolation of `z`, then rationalizing by multiplying by the conjugate `(-1+3i)/(-1+3i)`, finally arriving at `z = 2/5 + 4/5 i`. The MC has 5 options (A–E) with one always being "Ninguna respuesta anterior es correcta" — a critical distractor. **All UTN exam items follow this 5-option-with-"ninguna" pattern.**
- **Q2 (racional)**: `x/(x-3) − 5/(x-2) = (x-1)/((x-3)(x-2))` → solve. → **difficulty 4**. Domain exclusion matters: `x≠3, x≠2`. Sol: `x=4`. Distractors are nearby wrong values (`6, -6, -4`).
- **Q3 (logaritmos)**: `log₂ x + log₄ x + log₁₆ x = 7`. → **difficulty 4**. Change of base → `log x + (log x)/2 + (log x)/4 = 7` → `(7/4) log x = 7` → `log x = 4` → `x = 16`. Distractors include a "two-element set" `{4.5, 6.53}` and a single-element `{3.125}` (from `7/(2+1/2+1/4) ≈ 1.867`, not 3.125 — so `3.125` is the wrong numerical answer from a miscalculation).
- **Q4 (valor absoluto + intervalos)**: `|2x − 1| − 2 ≥ 4` → `|2x − 1| ≥ 6` → `x ≥ 7/2` or `x ≤ -5/2` → `(-∞, -5/2] ∪ [7/2, ∞)`. → **difficulty 4**. Distractors: open parens (loses extremos), intersection symbol (confuses AND/OR).
- **Q7 (exponenciales, mixed base)**: `9^{-3x} = (1/27)^{x+3}` → `x = 3`. → **difficulty 4**.
- **Q8 (trig equation)**: `(sin x)² = 4 − 2(cos x)²` over `[0°, 90°]` → no real solution. → **difficulty 5**. The distractor "Ninguna respuesta anterior es correcta" is the right answer.

**Distractor styles observed** (transferable to new challenges):
- **Sign-of-integer errors**: `±a` confused into `∓a`.
- **Inequality boundary type**: `≤` vs `<` produces open-vs-closed bracket distractors.
- **Set operation confusion**: `∩` vs `∪` for compound inequalities.
- **Domain violation**: answer is the value that *would* solve the equation but is excluded by domain.
- **"Ninguna respuesta anterior es correcta"**: every exam item offers this as option E. We don't replicate it in challenges (would inflate wrong-answer rates), but we *do* keep the "well-shaped near-miss distractor" pattern.
- **Wrong numerical mid-step**: distractor is the result of a plausible-but-wrong intermediate calculation (e.g., `3.125` from `7/2.24` instead of `7/(7/4) = 4`).

**Do-not-copy note**: per the brand/voice rules in AGENTS.md, we don't lift exercises from the exam verbatim. The exam is used as a **calibration** — what difficulty ceiling, what distractor patterns, what answer shapes (intervals, single numbers, "no solution"). New challenges must be **synthesized** to hit the same difficulty ceiling while staying inside the structured answer formats allowed by AGENTS.md (no free-text roots, no free-text complex numbers `a+bi`, no free-text intervals).

**AGENTS.md exercise-design prohibitions** (must be respected for every new challenge):

- **NO free-text for**: roots, fractions with roots, intervals, solution sets with union/intersection, complex numbers `a+bi`, two-solution systems `x=...`, full logarithmic expressions.
- **Use instead**: `multiple-choice` (rendered), `numerical` (single value), `true-false`, `matching`, `ordering`, `graphical`, two `numerical` inputs, interval selector, chips.
- **For each existing pilot challenge**: complejos uses MC with options like `"$z = 2 + i$"`, `"$z = -2 + i$"` (this is a 4-way MC, NOT free-text — the structural intent of the rule is "no fill-in for a+bi", which MC satisfies); valor_absoluto uses MC with options like `"$[-5, 2]$"`, `"$(-5, 2)$"` (interval options rendered with LaTeX, again MC — the rule is "no free-text interval"); ecuaciones_fraccionarias uses MC with options like `"$\\{7\\}$"`, `"$\\{-\\frac{1}{2}\\}$"`, `"$\\{2, -3\\}$"`, `"No tiene solución"`. **All challenge answers are MC because every "structured math expression" answer type is forbidden as free-text.** This is the correct pattern for the 24 new challenges too.

### Approaches

1. **Append to existing `unit-{1,2}.json` files (Recommended for this change)** — keep the existing content untouched, append 24 new entries (5 U1 skills × 2 + 6 U2 skills × 2). The loader already supports arbitrary length per unit file.
   - Pros: Zero changes to architecture, loader, store, or UI. Smallest possible PR diff per skill group. Easy to split into stacked PRs (4 PRs of ~240 lines each). Tests already pass; loader validates at import time. Reuses the validated schema and `sourceUse` taxonomy from the pilot.
   - Cons: `unit-{1,2}.json` grow by ~960 lines total (24 × ~40 lines/challenge). One file per unit means we can't parallelize across PCs without merge conflicts (mitigation: split PRs by unit, each PR appends a contiguous block).
   - Effort: **Low–Medium** (4 PRs, ~240 lines each, content-only).

2. **One PR with all 24 challenges** — single PR appending everything to both files.
   - Pros: Single atomic change, no multi-PR coordination overhead.
   - Cons: ~960 lines diff is **well over** the 400-line PR budget. Will require user approval for an exception (`sizeException`, similar to the precedent in `feat-practice-attempt-timing-and-retry`). Harder to review and revert.
   - Effort: **Low** (1 PR) but blocked by budget policy.

3. **New `challenges/unit-1-b.json` / `unit-2-b.json` files** — split into additional files to keep individual PRs small and isolate content batches.
   - Pros: Per-PR diff stays small. No merge conflicts if multiple PCs work on different skill groups in parallel.
   - Cons: **Requires modifying `loader.ts` to register the new files in `UNIT_REGISTRY`** (currently: `import unit1ChallengesRaw ... import unit2ChallengesRaw`). The user explicitly said **"Do NOT touch architecture, advanced store, loader, UI, usePracticeFlow"**. So this approach is **out of scope**.
   - Effort: Out of scope.

### Per-Skill Challenge Plan

Two challenges per skill. Each challenge targets a real exam-style integrative problem calibrated against canonical material. All challenges are `multiple-choice` with 4 options, `difficulty: 4`, `difficulty: 4` (the established convention), MC `type`, and 2-entry `canonicalTrace`. Distractors derived from `commonErrorTags` taxonomy. All answers use **structured MC options** (no free-text).

#### U1 skills to expand

**`mat.u1.conjuntos_numericos`** — Currently 49 standard exercises. The skill is fundamentally about classification and inclusion. Challenges push the alumno to reason about decimal/power forms that are not obviously rational/irrational.
- *Desafío 01* — "Clasifica $\sqrt[3]{-8}$ en el conjunto más pequeño de los reales." → Multiple-choice with ℕ/ℤ/ℚ/ℝ. Catches "toda raíz irracional" misconception.
  - Concept: classification via representation form (cube root of negative integer).
  - Distractor strategy: `ℤ` (cube root of negative integer is integer); `ℚ` (confuses with decimal expansion); `No pertenece a R` (cube root is real).
  - Format: MC with 4 options (ℕ / ℤ / ℚ / ℝ).
- *Desafío 02* — "Dado el conjunto $A = \{ x \in \mathbb{Z} : \sqrt{x} \in \mathbb{Z} \}$, ¿cuál de las siguientes opciones describe correctamente A?" → Tests understanding of quantifier scope (some x in Z where sqrt(x) is in Z means perfect-square integers including 0).
  - Concept: bounded universal/existential quantifier on integers.
  - Distractor strategy: `{..., 0, 1, 4, 9, ...}` (correct) vs `{..., 0, 1, 2, 3, 4, ...}` (no sqrt constraint) vs `{0, 1, 2, 3, 4}` (finite set) vs `{-1, 0, 1}` (signs forgotten).
  - Format: MC with 4 options (each a set description, NO free-text).

**`mat.u1.propiedades_operaciones_reales`** — Orden de operaciones, distributiva, signos. Very procedural. Challenges focus on **discriminating** which property fails.
- *Desafío 01* — "¿Cuál de las siguientes igualdades es siempre verdadera para todos los reales a, b?" → MC over the four properties (asociativa adición, conmutativa multiplicación, distributiva, elemento opuesto). One is wrong.
  - Concept: property identification in non-trivial expressions.
  - Distractor strategy: distributiva mal aplicada `(a+b)² = a² + b²` (cuadrado de binomio, error frecuente).
  - Format: MC with 4 options.
- *Desafío 02* — "Si $a * b = a + b - ab$ para todos los reales, ¿cuál es el resultado de $3 * (4 * 5)$?" → Operacion binaria no estándar (suma, producto, neutros). Integra distributiva.
  - Concept: propiedades en operaciones no estándar (asociativa, elemento neutro).
  - Distractor strategy: `(3+4-12)+5-(3+4-12)\cdot 5$ calculado mal.
  - Format: `numerical` (single number, all integer → `−5`). **Alternative format consideration**: this is a clean `numerical` exercise, not MC. Mix is OK — challenges can use `numerical` for tasks where distractors are tedious and the computation IS the challenge. But to keep the convention, recommend MC with 4 nearby integers (`-5, -3, 2, 7`).

**`mat.u1.potencias_raices`** — High-distractor-density skill. Canonical material emphasises propiedad distributiva negation, exponente racional.
- *Desafío 01* — "El valor de $((-2)^3)^2 \cdot (-2^{-2})$ es:" → tests priority of paréntesis vs exponente y signo.
  - Concept: signs of powers, parenthesization, exponent precedence.
  - Distractor strategy: `8` (treats `(-2)^3^2` as `(-2)^6` = 64 — but uses wrong sign); `64` (computes `(-2)^6` correctly but ignores the `(-2^{-2})` factor); `-8` (forgets the trailing factor).
  - Format: `numerical` (single value `8`) or MC with 4 options.
- *Desafío 02* — "Simplifica $\dfrac{\sqrt[3]{a^2} \cdot \sqrt[6]{a^4}}{\sqrt{a}}$ asumiendo $a > 0$." → Exponente racional integrado.
  - Concept: equivalencia entre raíz y potencia fraccionaria.
  - **Format warning**: this involves structured math expressions (roots with radicals) which AGENTS.md forbids as free-text. Use **MC with 4 options rendered as $a^{...}$ form** (e.g., `$a^{2/3}$`, `$a^{4/3}$`, `$a^{5/6}$`, `$a^{1/6}$`). Even if the answer is `$a^{5/6}$`, MC lets the alumno pick without free-text input.
  - Canonical trace: `UNIDAD1_matemática.pdf` ch. on Potenciación de Números reales + Resolución PDF (Resolución de ejercicios de seminario).

**`mat.u1.racionalizacion`** — Many standard exercises; challenges push binomio irrational denominators.
- *Desafío 01* — "Racionaliza $\dfrac{1}{\sqrt{3} + \sqrt{2}}$ y simplifica." → Resultado $\sqrt{3} - \sqrt{2}$.
  - Concept: conjugado del denominador, diferencia de cuadrados.
  - **Format warning**: result is $\sqrt{3} - \sqrt{2}$ which is forbidden as free-text. Use **MC with 4 LaTeX options**.
  - Distractor strategy: $\sqrt{3} + \sqrt{2}$ (olvida el conjugado), $\sqrt{6}$ (multiplica mal), $\dfrac{1}{\sqrt{5}}$ (no racionaliza).
- *Desafío 02* — "Racionaliza $\dfrac{\sqrt{2}}{\sqrt{3} - 1}$." → Resultado $\dfrac{\sqrt{6} + \sqrt{2}}{2}$. Same MC convention.
  - Distractor strategy: $\sqrt{6} - \sqrt{2}$ (signo mal); $\sqrt{6}+1$; $\dfrac{\sqrt{6}-1}{2}$.

**`mat.u1.intervalos`** — Already at 4 standard exercises; challenges test intersection/union with mixed bracket types.
- *Desafío 01* — "Dados $A = [-2, 4)$ y $B = (1, 6]$, ¿cuál es $A \cup B$?" → `[-2, 6]` (cierre por absorción del abierto del extremo).
  - Concept: union, captura de extremos abiertos/cerrados correctos.
  - Distractor: `[-2, 6)` (pierde el cierre de 6); `[1, 6)` (intersección); `(-2, 6]`.
  - Format: MC with 4 interval options (each rendered with bracket notation).
- *Desafío 02* — "Si $A \cap B = \{x \in \mathbb{R} : 1 \le x < 5\}$ y $A = (-\infty, 5)$, ¿cuál es $B$?" → $B = [1, 5]$ (cierre del extremo izquierdo, abierto del derecho conservado).
  - Distractor: $B = [1, 5)$ (correcto en realidad — el trap sería si $A$ tuviera cerrado, acá trampa es pensar que $A$ no aporta nada al derecho); $B = (1, 5)$ (pierde el cierre); $B = [1, \infty)$.

**`mat.u1.logaritmos`** — TEMA 1 Q3 was exactly this. Strong calibration material.
- *Desafío 01* — "Resolver $\log_2 x + \log_4 x + \log_8 x = 11$." → Cambio de base → $(1 + 1/2 + 1/3) \log_2 x = 11$ → $\log_2 x = 6$ → $x = 64$.
  - Concept: cambio de base + suma de logaritmos.
  - Distractor: `2^11 = 2048` (no aplica cambio de base); `2^{11/3}` (suma equivocada como producto); `2^{11/2}`.
  - Canonical trace: U1 ch. Logaritmo + TEMA 1 Q3 (calibration).
- *Desafío 02* — "Si $\log 2 = a$ y $\log 3 = b$, entonces $\log 12$ es:" → Expresa en términos de $a, b$.
  - Concept: descomposición logarítmica con cambio de base.
  - Distractor: $a + b$; $2a + b$; $a \cdot b$; $a^2 \cdot b$.
  - Format: MC with 4 options (each a linear combination of $a$ and $b$).

#### U2 skills to expand

**`mat.u2.polinomios_basico`** — 5 standard exercises. Challenges push polynomial evaluation at large/integer values where reduction errors compound.
- *Desafío 01* — "Si $P(x) = 2x^3 - 5x + 7$, ¿cuánto vale $P(3) - P(-2)$?" → $P(3) = 54 - 15 + 7 = 46$; $P(-2) = -16 + 10 + 7 = 1$; diferencia = $45$.
  - Concept: valor numérico, evaluación con signo.
  - Distractor: `−45` (invierte el orden); `47` (suma en vez de resta); `−47`.
- *Desafío 02* — "El polinomio $P(x) = (x-1)(x-2)(x+3)$ tiene raíces $r_1, r_2, r_3$. ¿Cuánto vale $r_1 + r_2 + r_3$?" → Por Vieta con coeficiente principal 1: $r_1 + r_2 + r_3 = -(-(-1+2-3))/1 = 0$... wait, let's recompute. Expandido: $(x-1)(x-2)(x+3) = (x^2-3x+2)(x+3) = x^3 + 3x^2 - 3x^2 - 9x + 2x + 6 = x^3 - 7x + 6$. Coefs: $x^3 + 0x^2 - 7x + 6$. Por Vieta: $r_1+r_2+r_3 = -0/1 = 0$.
  - Concept: relación coef-raíces (Vieta).
  - Distractor: `6` (constante); `-7` (coef de x); `-6` (opuesto).
  - Format: `numerical` (clean single answer).

**`mat.u2.operaciones_polinomios`** — Multiplicación simbólica. Challenges push sign and distributive traps.
- *Desafío 01* — "Multiplica $(2x-1)(x+3)(x-2)$ y desarrollá. ¿Cuál es el coeficiente del término $x$?" → Expandir: $(2x-1)(x^2 + x - 6) = 2x^3 + 2x^2 - 12x - x^2 - x + 6 = 2x^3 + x^2 - 13x + 6$. Coef de $x$ = $-13$.
  - Concept: multiplicación asociativa, atención al signo y coef.
  - Distractor: `13` (signo); `5` (evalúa mal un paso); `7`.
  - Format: `numerical` or MC with 4 nearby integers.
- *Desafío 02* — "Dados $P(x) = (x+1)(x-2)$ y $Q(x) = x^2 + ax + b$, si $P(x) + Q(x) = 2x^2 - x - 3$, ¿cuánto vale $a + b$?" → $P(x) = x^2 - x - 2$. Suma: $2x^2 + (a-1)x + (b-2) = 2x^2 - x - 3$. Entonces $a - 1 = -1$ → $a = 0$; $b - 2 = -3$ → $b = -1$. Suma = $-1$.
  - Concept: suma polinómica + identificación de coeficientes.
  - Distractor: $1$ (suma mal); $-3$ (solo $b$); $0$ (solo $a$).

**`mat.u2.ruffini_resto`** — Teorema del resto. TEMA 1 had a similar item (examen item 7: "el conjunto solución de `9^{-3x} = (1/27)^{x+3}`" — exponential, not polynomial, but same flavor of "evaluar en lugar de factorizar").
- *Desafío 01* — "Si $P(x) = x^4 - 6x^3 + 11x^2 - 6x$, ¿cuáles son los coeficientes del cociente al dividir $P(x)$ por $(x-1)$?" → Ruffini con a=1: bajar 1, 1×1+(-6)=-5, -5×1+11=6, 6×1+(-6)=0, resto 0. Cociente: $[1, -5, 6, 0]$ → $x^3 - 5x^2 + 6x$. Coefs: `1, -5, 6, 0`.
  - Concept: Ruffini.
  - Distractor: `1, -5, 6` (olvida el cero); `1, -5, 5, 0` (error de cuenta); `1, 4, 6, 0` (signo mal).
  - **Format warning**: 4 coefs separados por coma. AGENTS.md forbids "two solutions `x=...`". A comma-separated list of 4 integers is also structured-set-with-multiple-numerals — same shape. Use MC with 4 options where each option is the 4-comma-separated string rendered in MC.
- *Desafío 02* — "El resto de dividir $P(x) = x^5 - 3x^4 + 2x^3 - 7x + 1$ por $(x+2)$ es:" → Por Teorema del Resto: $P(-2) = -32 - 48 - 16 + 14 + 1 = -81$.
  - Concept: Teorema del Resto (no hace falta hacer la división entera).
  - Distractor: $-83$ (error de signo); $-79$; $-1$.
  - Format: `numerical`.

**`mat.u2.factorizacion`** — Factor común, TCP, diferencia de cuadrados.
- *Desafío 01* — "Factoriza completamente $12x^3 y^2 - 18x^2 y^3 + 6x^2 y$." → Factor común: $6x^2 y(2xy - 3y^2 + 1)$. **Resultado con $6x^2 y$ y un paréntesis de tres términos.**
  - Concept: factor común con coeficientes y potencias mixtas.
  - Distractor: $6xy(2x^2 y - 3xy^2 + x)$; $6x^2(2xy - 3y^2 + 1)$ (no incluye $y$); $2x^2 y(6y - 9y^2 + 3)$.
  - **Format warning**: factorización expresada como producto. AGENTS.md forbids free-text for products with variables. Use MC with 4 LaTeX options.
- *Desafío 02* — "Factoriza $x^4 - 81$ completamente." → Diferencia de cuadrados anidada: $(x^2-9)(x^2+9) = (x-3)(x+3)(x^2+9)$.
  - Concept: diferencia de cuadrados iterada.
  - Distractor: $(x^2-9)^2$; $(x-3)^2(x+3)^2$ (cuadrado mal aplicado); $(x-3)(x+3)(x-9)(x+9)$ (mal anidado).
  - Format: MC.

**`mat.u2.gauss`** — Encontrar raíces racionales, factorizar.
- *Desafío 01* — "Para $P(x) = 2x^3 + 3x^2 - 8x + 3$, ¿cuál es la factorización completa?" → Canónica: $(x-1)(2x-1)(x+3)$ (ver TEMA 1 style). Por Gauss: $P(1)=0$ → Ruffini → cociente $2x^2+5x-3$ → raíces $1/2$ y $-3$.
  - Concept: Gauss + Ruffini + TCP.
  - Distractor: $(x-1)(2x+1)(x+3)$ (signo mal en coef); $(x+1)(2x-1)(x+3)$ (raíz opuesta); $(x-1)(2x-1)(x-3)$ (último signo mal).
  - Format: MC.
- *Desafío 02* — "¿Cuál es el conjunto de candidatos p/q (en su forma irreducible) para raíces racionales de $P(x) = 6x^4 - 7x^3 + x + 2$ según Gauss?" → $a_0=2$ → $p \in \{\pm 1, \pm 2\}$; $a_n=6$ → $q \in \{1, 2, 3, 6\}$. Candidatos: $\pm 1, \pm 2, \pm 1/2, \pm 1/3, \pm 2/3, \pm 1/6, \pm 2/6=\pm 1/3$ (repetido).
  - Concept: candidatos de Gauss sin repetir irreducibles.
  - Distractor: $\pm 1, \pm 2$ (ignora denominadores); $\pm 1, \pm 2, \pm 3, \pm 6$ (confunde divisores de $a_n$ con candidatos); $\pm 1, \pm 2, \pm 1/3, \pm 1/6$ (repetidos y omite $1/2, 2/3$).
  - Format: MC with 4 LaTeX options (each a set written as comma list).

**`mat.u2.mcm_mcd_polinomios`** — MCM y MCD sobre polinomios factorizados. TEMA 1 didn't have an explicit item, but the skill is small and integrative.
- *Desafío 01* — "Dados $P(x) = (x-1)^2 (x+2)$ y $Q(x) = (x-1) (x+2)^3$, ¿cuál es el MCM?" → MCM: $(x-1)^2 (x+2)^3$.
  - Concept: MCM = mayor exponente por factor.
  - Distractor: $(x-1)(x+2)$ (confunde con MCD); $(x-1)^2 (x+2)^2$ (suma exponentes); $(x-1)^2 (x+2)^3 \cdot (x+2)^{-1}$ (fórmula mal).
  - Format: MC.
- *Desafío 02* — "Dados $P(x) = (x-2)(x+1)^2$ y $Q(x) = (x-2)^3 (x-3)$, ¿cuál es el MCD?" → MCD: $(x-2)$.
  - Concept: MCD = factor común con menor exponente.
  - Distractor: $(x-2)(x+1)^2 (x-3)$ (confunde con MCM); $(x-2)^3$ (mayor en vez de menor); $1$ (dice que no hay factor común cuando sí hay).
  - Format: MC.

### Recommended Batch Plan

24 new challenges across 12 skills. Reference size per challenge (from the 6 existing entries): **~40 lines** (including `canonicalTrace` with 2 entries). Total expansion: **~960 lines**.

To respect the **< 400 line/PR budget** AND keep each PR reviewable in one session, recommend **4 stacked PRs** delivered in two units first, then split by skill count:

| Batch | Skills | New challenges | Estimated diff | Why this batch |
|---|---|---|---|---|
| **A — U1 early skills** | `potencias_raices`, `racionalizacion` | 4 challenges (2 per skill) | **~160 lines** | Clean warm-up; both skills involve radical/exponente notation already familiar from existing desafios. |
| **B — U1 middle skills** | `intervalos`, `logaritmos` | 4 challenges | **~160 lines** | Logaritmos is the strongest exam-calibration slot (TEMA 1 Q3). Intervalos is the natural pair (same MC-on-interval pattern as existing valor_absoluto desafios). |
| **C — U1 remaining + U2 early** | `conjuntos_numericos`, `propiedades_operaciones_reales`, `polinomios_basico`, `operaciones_polinomios` | 8 challenges | **~320 lines** | Two U1 skills + two U2 skills that are most procedural. Combines "easier" content so the second U2 PR stays under 400. |
| **D — U2 final skills** | `ruffini_resto`, `factorizacion`, `gauss`, `mcm_mcd_polinomios` | 8 challenges | **~320 lines** | The four U2 synthesis-heavy skills. Highest pedagogical value (these are exactly the skills that benefit most from challenges, since they integrate multiple chapters). |

Total: 4 PRs, all ≤ 320 lines, all under the 400-line budget with margin. Each PR is content-only (no code changes), so review focuses on **distractor correctness** and **canonical trace accuracy**.

**Delivery strategy**: stacked-to-main (single branch per batch, merged with `--no-ff`). Matches the precedent in `challenge-exercises` (PR2-stacked), `unit-2-pedagogical-slice` (3 PRs stacked), and `feat-practice-attempt-timing-and-retry`.

**Per-batch discipline** (same as prior SDD slices in this repo):
1. Branch `feat/challenge-exercises-expansion-batch-{a|b|c|d}` from main.
2. Append to `content/matematica/challenges/unit-{1,2}.json`. No code changes.
3. Run `pnpm run test` and `pnpm run typecheck`. Loader validation runs at module init; any malformed challenge JSON throws on first load.
4. PR body cites the prior `challenge-exercises` slice and the explore/proposal for this expansion.
5. Merge with `--no-ff`.
6. After Batch D lands: add entry to `openspec/changes/STATUS.json` with `status: "done"`, `mergedTo: "main"`, `branch: null`.

**Edge case for Batch D**: ruffini_resto has a 4-comma-separated option list, which is structured but multi-numeric. The existing convention in `ecuaciones_fraccionarias.desafio-02` already uses `"$\\{2, -3\\}$"` as a single MC option string — so 4-comma-list options are consistent with the established pattern. AGENTS.md's "two solutions `x=...`" prohibition is about free-text `x=-2, x=2` formatting; comma-separated lists rendered as MC option strings are OK.

### Recommendation

**Approach 1** (append to existing files, 4 stacked PRs ≤ 320 lines each) is the recommended path. It:
- Honors the user's hard constraint of "Do NOT touch architecture, advanced store, loader, UI".
- Stays well under the 400-line PR budget.
- Reuses the validated schema, error-taxonomy, and `sourceUse` taxonomy from the pilot.
- Allows independent PR-by-PR review (and independent rollback if a single batch is bad).
- Matches the project's established stacked-to-main delivery pattern.
- Total diff: ~960 lines across 4 PRs, all content-only, all under budget.

### Risks

- **Distractor quality variance across batches**: challenges in Batch C (procedural skills like `conjuntos_numericos`) are inherently less synthesis-heavy than Batch D (`gauss`, `factorizacion`). Risk: Batch C distractors become arbitrary instead of error-tag-driven. **Mitigation**: in `sdd-spec`/`sdd-tasks`, explicitly require that each distractor trace to a specific `commonErrorTag` from `src/domain/error-taxonomy/`. If no tag fits, the distractor is rejected at PR review.
- **Loader throws at module init on malformed JSON**: a single bad entry blocks the whole app. **Mitigation**: enforce loader validation in PR CI (already covered by `pnpm run test` — `loader.test.ts` instantiates the loader). If a challenge has wrong `sourceUse`, missing `canonicalTrace` field, or wrong ID pattern, the build breaks. This is a feature, not a bug — but it means each PR must be validated before merge.
- **Format drift**: AGENTS.md's exercise-design prohibitions are strict. AGENTS.md-forbidden answers (free-text roots, free-text complex numbers, free-text intervals) **cannot be used as `numerical` or `fill-blank` answers**. The recommended MC pattern with LaTeX-rendered option strings is the only correct path. **Mitigation**: every new challenge reviewed for answer-shape correctness against the table in this exploration before PR merge.
- **Canonical trace accuracy**: the 6 existing entries have small typos in `pedagogicalIntent` (e.g., the complejos.desafio-01 trace has "来源于" — a Chinese fragment, likely a copy-paste artifact). New challenges must use **Spanish** in `pedagogicalIntent`, not leave fragments. **Mitigation**: review checklist item.
- **GGA bypass on Windows**: this repo's GGA pre-commit hook is documented to have issues on Windows (Codex CLI ambiguity, see STATUS.json note for `feat-practice-attempt-timing-and-retry`). The user accepted this for previous slices. **Mitigation**: flag to the user that GGA pre-commit validation is on the `pending Linux review` queue; the chained PR pattern + final verify CI + Vercel preview validation is the de-facto coverage model for this repo.
- **Cross-PC merge conflict on `STATUS.json`**: if multiple PCs run this expansion in parallel, STATUS.json will conflict. **Mitigation**: serialize batches (A → B → C → D), or accept that the orchestrator handles STATUS.json sequentially per merge.
- **Memory tool bypass**: `addChallengeAttempt` writes to `pre-utn.advanced-practice.v1`, NOT `pre-utn.practice.v1`. **Mitigation**: nothing — this is correct behavior and confirmed in `src/lib/advanced-practice-progress.ts`. No risk.

### Ready for Proposal

**Yes.** The orchestrator can proceed to `sdd-propose` with this analysis. The proposal phase should:
1. Confirm the 4-batch plan (A/B/C/D, ≤ 320 lines each, stacked-to-main).
2. Detail the per-skill challenge authoring rubric (format = MC with 4 options, difficulty = 4, canonicalTrace with ≥2 entries pointing to UNIDAD + exam/resolution PDF).
3. Define the per-PR verification gate: `pnpm run test` + `pnpm run typecheck` + visual review of distractor→`commonErrorTag` mapping.
4. Define the rollback: drop the entries from `unit-{1,2}.json` (no code involved).

**Key clarifications the orchestrator should surface to the user**:
- Confirm the 4-batch cadence (vs. compressing to 1 batch with `sizeException`, as the precedent allows).
- Confirm difficulty = 4 for all 24 challenges (vs. mixing some difficulty 5 for the highest-synthesis U2 skills).
- Confirm that Batch C is acceptable despite the procedural-skill critique — or move `conjuntos_numericos` and `propiedades_operaciones_reales` to a "post-MVP" phase if the user prefers to ship the high-pedagogical-value skills first.
- Confirm that the `canonicalTrace` `sourceUse` `solution-pattern` reference to `Resolución_MATEMÁTICA_TEMA 2.pdf` is acceptable for U1 challenges where the TEMA 2 PDF doesn't cover U1 topics (in which case the trace stays at `canonical-source` + `calibrated-from-exam` only, with 1 entry instead of 2 — the loader only requires ≥1, not exactly 2).