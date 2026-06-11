# Proposal: unit-2-factorizacion-slice

> **Change:** unit-2-factorizacion-slice
> **Date:** 2026-06-10
> **Author:** orchestrator + sdd-propose-chinos
> **Status:** proposed

## 1. Why Now

La Unidad 2 tiene su infraestructura operativa: `polynomial-evaluator` (1273 tests, 3 bugs corregidos), routing guard para skills U2, 6 error tags `u2_*` con detectores, 3 skills base implementados (`polinomios_basico`, `operaciones_polinomios`, `ruffini_resto`) con 12 ejercicios y contenido JSON verificado. El slice anterior completo y archivado (`unit-2-pedagogical-slice`, 3 PRs, 1267→1273 tests) deja el terreno preparado.

Los capitulos 12-13 del material canonico (`UNIDAD2_matematica.pdf`, pags. 9-14) cubren factorizacion de polinomios (7 casos) y teorema de Gauss para raices racionales. Este es el corazon algebraico de U2: donde convergen todas las herramientas construidas (definiciones, operaciones, Ruffini, teorema del resto) para descomponer polinomios en factores irreducibles.

Sin este slice, el alumno tiene las herramientas basicas pero no puede aplicarlas al objetivo central de la unidad: factorizar. Los skills downstream (`mcm_mcd_polinomios`, `ecuaciones_fraccionarias`) dependen de `factorizacion` y no pueden implementarse hasta que este slice complete la cadena.

## 2. What

Este slice implementa los 2 skills restantes de la cadena principal de U2:

- **`mat.u2.factorizacion`**: 7 casos de factoreo (factor comun, factor comun por grupos, trinomio cuadrado perfecto, cuatrinomio cubo perfecto, diferencia de cuadrados, suma/resta de potencias de igual grado, trinomio de segundo grado). Un solo skill con sub-bloques en el TheoryNode (patron establecido en U1 por `complejos`).
- **`mat.u2.gauss`**: Teorema de Gauss para factorizacion con raices racionales (algoritmo p/q, evaluacion de candidatos, division por Ruffini iterada).

Entregables concretos: 8 ejercicios nuevos (4 por skill), 2 etiquetas de error nuevas (`u2_signo_factorizacion`, `u2_caso_incorrecto`), 1 dependencia nueva en skill-catalog (`factorizacion ← ruffini_resto`), 2 TheoryNodes, 2-4 WorkedExamples, 3-5 FeedbackMappings. Cero modulos de dominio nuevos.

## 3. Why This Approach

**(a) Factorizacion + Gauss en 1 slice**: El material canonico los presenta como unidad indivisible. Gauss es el cierre natural de la factorizacion (encuentra raices cuando ningun caso directo aplica). Separarlos rompe el hilo pedagogico y duplica overhead SDD.

**(b) 1 skill por topico, 7 casos como sub-bloques**: Dividir `factorizacion` en basico/avanzado cambiaria el modelo y requeriria actualizar `SKILL_DEPENDENCIES` para todos los skills downstream (`gauss`, `mcm_mcd`, `ecuaciones_fraccionarias`). Los sub-bloques dentro del TheoryNode siguen el patron de `complejos` (U1).

**(c) Sin delta de polynomial-evaluator**: Verificado que `extractFactor()` (linea 220) soporta `(2x+1)(x-3)` via match2 (`ax + b`). Factores internos cuadraticos NO estan soportados ni son necesarios para este slice.

**(d) 8 ejercicios (4+4)**: Consistente con el patron del slice anterior (4 por skill). Los ejercicios de factorizacion cubren multiples casos por ejercicio, no 1-por-caso.

## 4. Scope (In)

- 2 skills activados: `mat.u2.factorizacion`, `mat.u2.gauss`
- 8 ejercicios nuevos (4 factorizacion + 4 gauss), reutilizando `ex.u2.factorizacion.1` (agregando error tags)
- 2 error tags nuevos: `u2_signo_factorizacion`, `u2_caso_incorrecto`
- 2 detectores en `error-tagging.ts` (TDD estricto)
- 1 dependencia skill-catalog: `factorizacion ← ruffini_resto` (WARNING: no esta ya agregada, ver §9)
- 2 TheoryNodes en `theory/unit-2.json` (con sub-bloques por caso)
- 2-4 WorkedExamples en `examples/unit-2.json`
- 3-5 FeedbackMappings en `feedback/unit-2.json`
- Cero cambios en `polynomial-evaluator.ts`, `evaluator/index.ts`, UI, ni modulos de dominio nuevos

## 5. Scope (Out)

- Factorizacion inversa en polynomial-evaluator (expandir solo, no factorizar)
- Factores internos cuadraticos `(x²+3x)` en polynomial-evaluator
- U2-Aplicaciones: `mcm_mcd_polinomios` + `ecuaciones_fraccionarias` (slice futuro)
- Division larga interactiva como ejercicio
- Split de factorizacion en sub-skills (basico/avanzado)
- Dependencias bloqueantes U1→U2 (documentadas, no implementadas)
- Interactive long-division para Gauss

## 6. Capabilities

### New Capabilities

None. No se crean nuevos modulos de dominio ni specs nuevas.

### Modified Capabilities

- `math-error-taxonomy`: +2 tags `u2_*` (`u2_signo_factorizacion`, `u2_caso_incorrecto`)
- `math-answer-evaluator`: +2 patrones de error en `error-tagging.ts` con TDD
- `math-exercise-catalog`: +8 ejercicios, +2 TheoryNodes, +2-4 WorkedExamples, +3-5 FeedbackMappings
- `math-skill-model`: +1 dependencia en `SKILL_DEPENDENCIES` (`factorizacion ← ruffini_resto`)

## 7. Approach

**Sin codigo de dominio nuevo.** Todo el trabajo es extension de contenido y taxonomia:

1. **Taxonomia + detectores** (TDD estricto): 2 tags nuevos en `error-taxonomy/index.ts`, 2 funciones detectoras en `error-tagging.ts` con tests RED→GREEN→REFACTOR. Reutilizar `u2_factorizacion_incompleta` existente (unificar con `u2_factor_comun_incompleto`).

2. **Skill-catalog**: Agregar `ruffini_resto` a `factorizacion.prerequisites` en `SKILL_DEPENDENCIES`.

3. **Contenido JSON**: Extender archivos U2 existentes (no crear nuevos). 2 TheoryNodes con sub-bloques por caso de factoreo. 2-4 WorkedExamples (al menos 1 por skill, 2 para factorizacion cubriendo casos diferentes). 3-5 FeedbackMappings con mensajes en espanol neutro/profesional.

4. **Ejercicios**: 4 nuevos para factorizacion (MC + symbolic, cubriendo casos multiples) + 4 nuevos para Gauss (MC + numerical + symbolic). Tipos: MC para reconocimiento de caso, numerical para raices, symbolic para factorizacion completa verificada por polynomial-evaluator. Sin texto libre para expresiones polinomicas (cumple AGENTS.md).

## 8. Success Criteria

- [ ] ≥4 ejercicios por skill, todos con `commonErrorTags` no vacio
- [ ] Todos los ejercicios U2 pasan `math-answer-evaluator` (polynomial-evaluator para symbolic)
- [ ] 2 nuevos error tags con ≥1 test positivo y ≥1 test negativo cada uno (TDD)
- [ ] `factorizacion.prerequisites` incluye `ruffini_resto` en `SKILL_DEPENDENCIES`
- [ ] 1273+ tests existentes siguen pasando (full gate green)
- [ ] `pnpm run typecheck` y `pnpm run build` verdes
- [ ] GGA pre-commit limpio (o bypass documentado en Windows)
- [ ] `ex.u2.factorizacion.1` actualizado con `commonErrorTags` apropiados
- [ ] Contenido teorico en espanol neutro/profesional, sin texto libre

## 9. Pedagogical Impact

**Alumno**: aprende a aplicar los 7 casos de factoreo y el teorema de Gauss para factorizar polinomios sistematicamente. La progresion va de reconocimiento de patrones (MC: "¿que caso aplica?") a aplicacion (symbolic: "factoriza completamente"). Los error tags `u2_signo_factorizacion` y `u2_caso_incorrecto` detectan los errores mas frecuentes en factorizacion y generan feedback correctivo especifico.

**Docente**: la taxonomia de errores extendida permite identificar que casos de factoreo generan mas confusion, intervenir con foco, y planificar el slice U2-Aplicaciones con evidencia de prerequisitos. El contenido esta alineado con caps. 12-13 del material canonico de UTN Mendoza.

## 10. Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | Sobrecarga cognitiva: 7 casos en 1 skill | Alta | Sub-bloques en TheoryNode con progresion clara. Ejercicios fuerzan identificar caso ANTES de factorizar. Casos basicos (1,3,5,7) con mas ejercicios que avanzados (2,4,6). |
| 2 | polynomial-evaluator no soporta algun formato factorizado esperado | Media | Verificado que `(2x+1)(x-3)` funciona (match2, linea 220). Ejercicios symbolic usaran solo factores lineales. MC para casos con factores no-lineales. |
| 3 | Confusion entre casos similares (TCP vs trinomio 2do grado) | Media | Ejercicios MC de "identificar el caso" antes de "factorizar". Distractores representan confusion entre casos. |
| 4 | Volumen de contenido JSON (~300-500 lineas) | Baja | Slice anterior manejo ~250 lineas sin problemas. Es contenido, no codigo. |
| 5 | `ruffini_resto` no esta actualmente en `factorizacion.prerequisites` | Media | WARNING: El orquestador indico que ya estaba agregado; verificacion muestra que NO lo esta (linea 115 de `skill-catalog.ts`). Debe agregarse en este slice. |

## 11. Open Assumptions

1. `ruffini_resto` debe agregarse como prerrequisito formal de `factorizacion` (decision orquestador #1, verificada: NO esta ya agregado)
2. `mat.u2.factorizacion` se mantiene como skill unico con 7 casos como sub-bloques (#2)
3. polynomial-evaluator soporta `(2x+1)(x-3)` y factores lineales con coeficiente ≠ 1 (#3, verificado en codigo)
4. 4 ejercicios por skill, 8 total (#4)
5. `u2_factor_comun_incompleto` se unifica con `u2_factorizacion_incompleta` existente (#5)
6. Slice unificado factorizacion+Gauss en 1 cambio SDD con 2 PRs encadenados (#6)
7. 2 nuevos error tags: `u2_signo_factorizacion` + `u2_caso_incorrecto` (#7)
8. Contenido JSON extiende archivos U2 existentes, no crea nuevos (#8)
9. Cero modulos de dominio nuevos (#9)
10. `ex.u2.gauss.1` ID esta libre (el original fue reubicado a `mat.u3.sistemas`) y este slice crea el ejercicio correcto de Teorema de Gauss (#10)
11. Los ejercicios de factorizacion no usan texto libre (AGENTS.md): MC, numerical, o symbolic con polynomial-evaluator
12. Contenido teorico en espanol neutro/profesional

## 12. Execution Plan (preview)

spec → design → tasks → apply (2 PRs encadenados) → verify → archive

**Estrategia PR**: auto-forecast. Estimacion: ~500-600 lineas diff total.

| PR | Contenido estimado | Lineas |
|----|-------------------|--------|
| PR-1: Taxonomia + detectores + skill-catalog | 2 tags + 2 detectores + 1 dep + tests TDD | ~200 |
| PR-2: Contenido JSON + ejercicios | 2 TheoryNodes + 2-4 ejemplos + 3-5 feedback + 8 ejercicios | ~350 |

Cadena: stacked-to-main (ambos PRs mergean a main independientemente).

## 13. Rollback Plan

Revertir el merge commit de cada PR. Los cambios son aditivos (nuevas entradas en arrays JSON, nuevos tags en taxonomia) o extensiones (sub-bloques en TheoryNodes existentes). Sin destructive mutations sobre el slice anterior. Especificamente:

- PR-1: revertir cambios en `error-taxonomy/index.ts`, `error-tagging.ts`, `skill-catalog.ts`, y tests asociados
- PR-2: revertir cambios en `theory/unit-2.json`, `examples/unit-2.json`, `feedback/unit-2.json`, `exercises.json`
- `ex.u2.factorizacion.1`: restaurar `commonErrorTags: []` si se modifico

## 14. References

- `openspec/changes/unit-2-factorizacion-slice/exploration.md` (Phase 1)
- `openspec/changes/archive/2026-06-10-unit-2-pedagogical-slice/` (proposal, design, tasks, verify-report)
- `openspec/specs/polynomial-evaluator/spec.md` (sin delta necesario)
- `openspec/specs/math-error-taxonomy/spec.md` (extension +2 tags)
- `openspec/specs/math-exercise-catalog/spec.md` (extension +8 ejercicios)
- `openspec/specs/math-answer-evaluator/spec.md` (extension +2 patrones)
- `openspec/specs/math-skill-model/spec.md` (extension +1 dependencia)
- `material_canonico/Matemática/UNIDAD2_matemática.pdf` (caps. 12-13, pags. 9-14)
