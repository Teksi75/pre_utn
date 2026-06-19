# Exploration: issue-42 — Suma o diferencia de potencias de igual grado

## Issue synthesis

- **Title says**: "URGENTE: mejorar explicación de suma/diferencia de potencias de igual grado".
- **Body says** the current explanation states the rules but lacks the bridge between rule and procedure, listing 7 specific gaps: (1) cómo elegir entre `a - b` y `a + b`; (2) cómo se obtiene el número que se usa en Ruffini; (3) por qué en `8x^3 + 27` se usa `x = -3/2` y no `3`; (4) cómo se obtiene el segundo factor `4x^2 - 6x + 9`; (5) qué significa "fórmula conocida"; (6) cómo se construye el cociente por disminución de exponentes; (7) cómo distinguir la raíz usada en Ruffini del factor original.
- **Comment (added 2026-06-18T23:09 by owner) adds the explicit `x + a = 0 ⇒ x = -a` step** as a non-negotiable acceptance criterion, with suggested wording: "Para aplicar Ruffini primero identificamos el divisor lineal. Si dividimos por `x + 2`, buscamos qué valor de `x` hace cero ese divisor: `x + 2 = 0`, por lo tanto `x = -2`. Ese número, `-2`, es el que se usa en la tabla de Ruffini."
- **Body specifies two parallel methods to teach** (Ruffini y disminución de exponentes) using `8x^3 + 27 = (2x)^3 + 3^3` as the central example, with a required table of divisibility (4 rows: `a^n - b^n` por `a-b` siempre, `a^n - b^n` por `a+b` si `n` par, `a^n + b^n` por `a+b` si `n` impar, `a^n + b^n` por `a-b` nunca).
- **Body requires two additional worked examples** (diferencia de potencias, suma de potencias con exponente impar) and a comparison table between Ruffini (divide) and disminución de exponentes (construye directamente el cociente).
- **Body ends with a scope guardrail** (acceptance criterion #16): "La implementación no modifica la estructura general de navegación ni la lógica de ejercicios." — i.e. content-first.

## Current state

### Where the concept lives today

- `content/matematica/theory/unit-2.json`, `theory-factorizacion` node (line 124-195).
- `concept-fac-potencias-igual-grado` (lines 168-175) — already migrated to `bodyParagraphs` (per `migrate-all-theory-paragraphs`, 2026-06-18) but with **only 2 paragraphs** that are precisely the "rule without bridge" the issue complains about:
  - P1: criteria (a/b/c/d) of divisibility — the table in the issue is essentially a structured form of this.
  - P2: "El cociente se obtiene por Ruffini o por fórmula conocida (ej: a³ + b³ = (a + b)(a² − ab + b²)). Ejemplo: x³ + 8 = (x + 2)(x² − 2x + 4) porque n = 3 (impar) y la suma se divide por x + 2." — **this is the gap**. Mentions Ruffini and "fórmula conocida" without showing where the number comes from or how the second factor is built.

### Adjacent scaffolding already in place

- **Ruffini conceptos** (`concept-ruffini-procedimiento`, `concept-teorema-resto`, `concept-ruffini-signo`, lines 87-113 of unit-2 theory) already migrated to `bodyParagraphs` by `issue-36-theory-readability`. The sign rule is stated abstractly ("si el divisor es `(x+a)`, debe usarse `−a` porque `(x+a) = (x − (−a))`") but not anchored to a concrete non-monic example like `2x + 3 = 0`.
- **Worked examples** (`content/matematica/examples/unit-2.json`):
  - `example-ruffini-resto-2` covers plain Ruffini division of `2x³ − 5x² + x − 2` by `(x − 3)`, with divisor already in monic form `x − 3`.
  - `example-factorizacion-1` is diferencia de cuadrados (not Caso 6).
  - `example-factorizacion-2` is TCP (not Caso 6).
  - **No worked example for suma o diferencia de potencias de igual grado.** This matches the issue's request for at least two additional examples (diferencia + suma con n impar).
- **Feedback mappings** (`content/matematica/feedback/unit-2.json`, 10 entries): there is no entry specific to the Caso 6 mistakes. Closest reusables: `u2_signo_factorizacion` (cubre signo en la elección de factores), `u2_factorizacion_incompleta` (reusable), `u2_caso_incorrecto` (cubre confusión de caso). A new mapping tagged for the "left-number-of-Ruffini" mistake is a defensible add.
- **Error taxonomy** (`src/domain/error-taxonomy/index.ts`): no tag for "uso mecánico de `a` en lugar de resolver `factor = 0`". Closest is `u2_ruffini_signo_a` (covers monic sign only). A new `u2_ruffini_raiz_no_monica` tag is a defensible add.
- **Error detectors** (`src/domain/evaluator/error-tagging.ts`): `isU2SignoFactorizacionError`, `isU2CasoIncorrectoError` — neither covers the "left number from non-monic divisor" case.

### Practice gap for Caso 6

- `mat.u2.factorizacion` has exactly 4 base exercises per the catalog spec (`openspec/specs/math-exercise-catalog/spec.md:215-247`): ex.u2.factorizacion.1 (TCP vs trinomio 2do grado), .2 (diferencia de cuadrados), .3 (factor común), .4 (trinomio 2do grado a≠1). **None covers Caso 6.**
- `mat.u2.factorizacion` has 2 challenges (`ex.u2.factorizacion.desafio-01` factor común con potencias mixtas; `ex.u2.factorizacion.desafio-02` diferencia de cuadrados iterada). **None covers Caso 6.**
- The `unit-2-factorizacion-slice` verify-report already flagged this as a SUGGESTION: "3 factoreo cases without specific exercises" (casos 2, 4, 6). Caso 6 was deferred from MVP but the issue now forces it back into scope (theory-side at minimum).

### Tooling / precedents

- `issue-36-theory-readability` (2026-06-18, done, merged to main) introduced `bodyParagraphs` model + `TheoryCard` rendering. Ruffini concepts migrated.
- `migrate-all-theory-paragraphs` (2026-06-18, done, merged to main) migrated 38 long concepts (21 U1 + 17 U2). The 17 U2 already covers `concept-fac-potencias-igual-grado` (now 2 paragraphs), but the body length (~700 chars) only got split on existing punctuation, not refilled to address the pedagogical gap. **This issue is the natural follow-up: same model, deeper content.**

## Gap analysis

| # | What the issue asks for | What's missing today | Severity |
|---|-------------------------|----------------------|----------|
| 1 | Tabla de divisibilidad clara (4 filas) | P1 of `concept-fac-potencias-igual-grado` carries the 4 criteria as a prose list, not a table. Acceptable in markdown but the issue wants a structured table. | Low — content rewrite |
| 2 | Cómo se elige el primer factor (`a-b` vs `a+b`) | Implicit in P1 but never walked through. The "qué caso aplica" pattern is already in the factorización skill but not anchored to the rule. | Medium — new worked example needed |
| 3 | Cómo se obtiene el número que va en Ruffini | Concept-ruffini-signo covers the monic case (`x+a ⇒ −a`); not the non-monic case (`2x+3 ⇒ −3/2`). **This is the exact "agregado pedagógico" the comment demands.** | **High — explicitly required by issue** |
| 4 | Por qué en `8x^3 + 27` se usa `x = -3/2` y no `3` | Not stated anywhere. The current example uses `x³ + 8` (monic case) and never resolves the non-monic case. | **High — directly in the issue's criteria list** |
| 5 | Cómo se obtiene el segundo factor `4x² - 6x + 9` | Current P2 says "fórmula conocida" — exactly the wording the issue wants us to NOT use. | **High — explicitly forbidden by the issue** |
| 6 | Cómo se construye el cociente por disminución de exponentes | Not present in any theory or example. The "disminución de exponentes" method is a teacher-shorthand alternative to Ruffini. | **High — explicitly in the issue's method 2** |
| 7 | Distinguir raíz usada en Ruffini del factor original | Not stated. The factor `2x + 3` and its monic version `x + 3/2` are never reconciled in current text. | **High — explicitly in the issue's criteria list** |
| 8 | Tabla de comparación Ruffini vs disminución de exponentes | Does not exist. | Medium — new content, not new model |
| 9 | Dos ejemplos adicionales (diferencia + suma impar) | Zero worked examples for Caso 6 today. | **High — explicitly in the issue's criteria** |
| 10 | Feedback / error detection for the "left number" mistake | No specific tag, no specific detector. `u2_ruffini_signo_a` covers only the monic sign issue. | Medium — new taxonomy + detector or reuse existing |

## Scope tentativo

Content-first change. No model, parser, renderer, or evaluator changes. All tooling needed is already in `main` after `issue-36-theory-readability` and `migrate-all-theory-paragraphs`.

### In scope

1. **Expand `concept-fac-potencias-igual-grado`** in `content/matematica/theory/unit-2.json` from 2 to ~5-6 `bodyParagraphs`, each carrying a single pedagogical step:
   - P1 (refine): divisibility table as a 4-row block (or structured prose) with explicit "siempre" / "si n es par" / "si n es impar" / "nunca".
   - P2 (new): how to choose the first factor given the sign and parity of `n`, with the `8x^3 + 27` recognition: `8x^3 + 27 = (2x)^3 + 3^3` is suma de cubos → first factor is `2x + 3`.
   - P3 (new — the headline gap): "Para aplicar Ruffini primero identificamos el divisor lineal. Si el divisor es `2x + 3`, buscamos qué valor de `x` hace cero ese divisor: `2x + 3 = 0`, por lo tanto `x = -3/2`. Ese número, `-3/2`, es el que se coloca a la izquierda en Ruffini." (Lifted almost verbatim from the comment.)
   - P4 (new): second-factor construction via Ruffini: write the full coefficients `[8, 0, 0, 27]`, run the table with `-3/2`, obtain cociente `8x^2 - 12x + 18` and reconcile it with the original factor `2x + 3` via the mónico vs original distinction: `2x + 3 = 2(x + 3/2)`, so `8x^3 + 27 = (2x + 3)(4x^2 - 6x + 9)`.
   - P5 (new): the alternative method by disminución de exponentes, same example, no division. Recognize bases `2x` and `3`, apply `a^3 + b^3 = (a + b)(a^2 - ab + b^2)` directly.
   - P6 (new): one-liner comparison ("Ruffini divide, disminución construye el cociente directamente. Ambos llegan al mismo resultado.").
2. **Add 2-3 new worked examples** in `content/matematica/examples/unit-2.json`, all `skillId: "mat.u2.factorizacion"`:
   - `example-factorizacion-3`: `8x^3 + 27` by Ruffini (full table).
   - `example-factorizacion-4`: `8x^3 + 27` by disminución de exponentes.
   - `example-factorizacion-5`: `x^4 - 16` by disminución (to show the "diferencia" branch and the exponent > 3 case).
   - Each must be `validateWorkedExample`-clean: ≥2 steps sequential from order 1, with a `canonicalTrace` entry and a `pedagogicalNote`. Bonus: third example to show the n=5 / suma de potencias con exponente impar case, if forecast permits.
3. **(Optional) Add 1 new feedback mapping** in `content/matematica/feedback/unit-2.json`:
   - `errorTag: "u2_ruffini_raiz_no_monica"` (or reuse `u2_ruffini_signo_a` if we don't want a new tag) keyed to the "left number from non-monic divisor" mistake. Recovery target: `example-factorizacion-3`. If a new tag is created, it also needs to be registered in `src/domain/error-taxonomy/index.ts` and wired into `src/domain/evaluator/error-tagging.ts` (TDD).
4. **(Out of MVP per issue's scope guardrail) NO new base exercises** in `exercises/unit-2.json` for Caso 6 — the issue explicitly says "no modificar la lógica de ejercicios". The current 4-exercise contract for `mat.u2.factorizacion` stays intact.
5. **(Optional) NO new challenge exercise** in `challenges/unit-2.json`. Challenges are content and were the right place to backfill Caso 6 in the original `unit-2-factorizacion-slice` SUGGESTION, but the issue scope-guardrail says "contenido teórico/explicativo de factorización en Unidad 2" — interpreted strictly, that excludes challenges too. If the orchestrator wants to take the opportunistic win (Caso 6 has no challenge), the forecast can absorb ~25-30 lines.

### Forecast (rough line count)

| Item | Est. lines added | Notes |
|------|------------------|-------|
| Expand `concept-fac-potencias-igual-grado` (5-6 paragraphs of math+prose) | ~15-25 | Replaces 2 existing paragraphs (net add ~10-20) |
| 3 new worked examples (steps + finalAnswer + pedagogicalNote + canonicalTrace) | ~60-90 | Each ~20-30 lines |
| 1 new feedback mapping (if taken) | ~5-7 | Plus taxonomy entry ~10 lines + detector + tests ~40-60 lines |
| Optional: 1 challenge exercise (if taken) | ~30-40 | Plus loaders + shape tests ~10-20 lines |
| Specs/design (small): update or new `specs/issue-42-powers-same-grade/spec.md` + `design.md` + `tasks.md` | ~50-80 | One short spec delta if no new code model; mostly acceptance anchors |
| **Total without new tag/detector** | **~120-180 lines** | Comfortable under 400. |
| **Total with new tag + detector + 1 challenge** | **~250-340 lines** | Still under 400 but tighter; would tip into 2 PRs. |

**Recommendation**: do content only (no new tag, no new challenge) in 1 PR. If the user later wants practice or a detector, that's a follow-up change.

## Precedentes relevantes

- **`issue-36-theory-readability` (done 2026-06-18)**: introduced `bodyParagraphs` + `TheoryCard` rendering. This issue is the natural follow-up: same model, deeper body for one specific concept. We don't need to re-open the model; we just write more (and better) paragraphs.
- **`migrate-all-theory-paragraphs` (done 2026-06-18)**: 38 long concepts migrated. `concept-fac-potencias-igual-grado` was among the 17 in unit-2.json, but the migration was a pure paragraph split — it did not fill the pedagogical gap. The migration's `bodyParagraphs` shape is the canvas this issue paints on.
- **`unit-2-factorizacion-slice` (done 2026-06-10)**: created the 7-case `concept-fac-*` family. The Caso 6 concept was defined at the time but its body was kept terse because the practice and feedback pieces for Caso 6 were deferred. Issue #42 is the deferred work coming back through the front door.

## Open questions

1. **Optional challenge exercise**: do we add `ex.u2.factorizacion.desafio-03` for Caso 6 (cuantitativa: ~30 lines content + ~10-20 lines loader/test), or keep this strictly content-only? The issue's scope-guardrail leans toward "no", but the known SUGGESTION from `unit-2-factorizacion-slice` verify-report is exactly this gap.
2. **New error tag vs reuse**: the "left number from non-monic divisor" mistake doesn't fit any existing `u2_*` tag perfectly. Three options: (a) reuse `u2_ruffini_signo_a` (loose semantic match, no new code), (b) reuse `u2_signo_factorizacion` (loose semantic match, no new code), (c) add a new `u2_ruffini_raiz_no_monica` tag + detector (cleanest, ~50-60 lines of code+tests). What does the user prefer?
3. **Example count**: the issue says "al menos dos ejemplos adicionales". Should we do exactly 2 (Ruffini + diferencia) or 3 (Ruffini + disminución + diferencia)? 3 is better pedagogically and within forecast.
4. **Central example**: the issue says use `8x^3 + 27 = (2x)^3 + 3^3` as the worked-example axis. The current concept uses `x^3 + 8` (monic). Should the bodyParagraphs in the concept ALSO switch to `8x^3 + 27` for consistency, or keep `x^3 + 8` in the concept (it illustrates the divisibility rule) and use `8x^3 + 27` only in the worked examples? The comment's suggested wording uses `x + 2 ⇒ x = -2` (monic), suggesting the monic case is also needed in the body.
5. **Voice (Ingenium)**: the issue comment's suggested wording is "Para aplicar Ruffini primero identificamos el divisor lineal…" — neutral, imperative, no profe-digital claim. Should we run a quick test in `src/domain/__tests__/copy-strings-acceptance.test.ts` to lock the new text against forbidden strings (parallel to what was done in the B3 home closeout)?

## Risks

- **Forecast blow-up if we add a new error tag** (+~50-60 lines code+tests) and/or a new challenge exercise (+~40-60 lines). Without those, the change is ~120-180 lines. If both are added, ~250-340 — still under 400 but tight. The orchestrator should be told the full price if it wants the "full fix".
- **Spec drift**: the `math-exercise-catalog` spec hardcodes the 4 base exercises for `mat.u2.factorizacion` (line 215-247). If we add a base exercise for Caso 6, that spec needs a delta (and possibly a new scenario). If we add only a challenge, the spec is untouched.
- **Voice drift**: any new copy must be checked against the Ingenium rules in `AGENTS.md` (no "profe digital", no "plan personalizado", no "te marco qué practicar"). The suggested wording in the comment is already voice-clean, but the worked-example prose must be reviewed.
- **Pedagogical-rule conflict (AGENTS.md "Diseño de ejercicios")**: if we add a new exercise for Caso 6 and ask the student to enter the second factor as text, we violate the no-free-text rule for structured math. The correct path is `symbolic` with `polynomial-evaluator` (factored form) or MC. The proposed forecast avoids this by skipping new base exercises.
- **Tooling state**: `polynomial-evaluator` is fully landed (PR3 of `unit-2-pedagogical-slice` + 3 GGA fixes from `polynomial-evaluator-input-validation`). `TheoryCard` renders `bodyParagraphs` correctly (covered by `TheoryCard.test.tsx`). No risk on the rendering side.
- **GGA**: GGA is bypassed on Windows (Codex CLI hook parser ambiguity) per the multi-change history; the user/orchestrator should plan a Linux pass for adversarial re-validation.
- **Branch state**: `openspec/changes/STATUS.json` shows `activeBranches: []` as of 2026-06-18. We can branch from `main` directly; no risk of stomping another in-flight change.
- **The issue title says "URGENTE"**: the user's wording in the body is precise (acceptance criteria are well-defined). The "urgente" is rhetorical; do not skip the spec/apply gates because of urgency. The pattern in this repo is "SDD first, then implementation" even for fast fixes.

## No proceder si…

- The user wants the fix to also include new base exercises that change the 4-exercise contract for `mat.u2.factorizacion`. That would be a separate change because it requires a `math-exercise-catalog` spec delta, and the issue's own scope-guardrail forbids it. If the user insists, this explore should be re-scoped into a wider "U2-Factorización: complete Caso 6 practice" change.
- The user wants the rewrite to use a different central example (not `8x^3 + 27`). The issue body is very specific; a different example would require re-running the explore.
- The user wants the cambio to span U1 (suma de cubos en `potencias_raices`) as well. The issue body is explicitly U2 / Polinomios. U1 suma de cubos is a different SDD change (and would need its own explore).

## Ready for proposal

**Yes.** The issue is well-scoped, the pedagogical gap is concrete and limited to one concept + zero-to-three worked examples + optionally one feedback mapping. The tooling is fully in place. Forecast fits comfortably under the 400-line budget if we keep it content-only. The orchestrator can launch `sdd-propose` with the proposed scope (content-only, no new tag, no new base exercise, optionally 1 new feedback mapping reusing `u2_ruffini_signo_a` or `u2_signo_factorizacion`).
