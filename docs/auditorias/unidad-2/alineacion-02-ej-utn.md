# Alineación de Unidad 2 — Ejercicios UTN (`02_ej_utn.pdf`)

**Modo**: read-only. No se modificó código, contenido ni specs en esta entrega. Esta auditoría mapea el material canónico oficial contra el catálogo de práctica actual y deja registrado el plan de cobertura que implementarán los PRs siguientes.
**Fuentes**: repositorio en `pre_utn-align-u2-practice-official-exercises` (rama `align-u2-practice-official-exercises`) + PDF oficial `02_ej_utn.pdf` del Seminario de Ingreso UTN-FRM 2025 (`~/Documentos/Preuniversitarios/UTN/01 - Matemática/00 - Ejercicios UTN/`).
**Cambio SDD asociado**: `openspec/changes/align-u2-practice-official-exercises/` (`proposal.md`, `design.md`, `specs/`, `tasks.md`).
**Fecha**: 2026-07-06.

---

## 1. Criterio pedagógico

Esta auditoría compara el mapa mínimo de ejercicios de la guía oficial (`02_ej_utn.pdf`) contra el catálogo actual `content/matematica/exercises/unit-2.json` (31 ejercicios sobre 7 skills U2). El objetivo es **cobertura pedagógica**: cada familia que el examen de ingreso pide debe estar al menos una vez en la app, idealmente con más de un ejercicio para ejercitar distintas variantes. No se busca reproducir 1:1 los ítems del PDF — cada ejercicio nuevo debe ejercitar una habilidad que la familia representa, no copiar literal la consigna del PDF.

Convención de estado por fila:

| Marca | Significado |
|---|---|
| ✅ cubierto | El catálogo actual tiene al menos un ejercicio válido para esta familia. |
| ⚠️ parcial | El catálogo toca la familia pero con un solo representante o con un caso fácil comparado con la variedad del PDF. |
| ❌ ausente | El catálogo no tiene ningún ejercicio para esta familia. |

Convención del identificador trazable: cada ejercicio nuevo llevará un tag `02_ej_utn_<item>` (ej. `02_ej_utn_7a`, `02_ej_utn_10b`) en `Exercise.tags[]`. Los PRs 3-7 lo aplican por familia. La trazabilidad fina (qué ítem específico cubre cada nuevo ejercicio) vive también en este documento.

---

## 2. Tabla de cobertura por ítem del PDF

Fuente canónica: `02_ej_utn.pdf`, UTN-FRM 2025, Unidad II — Matemática. Ítems leídos del PDF (`pdftotext -layout`), contrastados con la exploración previa (`openspec/changes/align-u2-practice-official-exercises/exploration.md`) y con `content/matematica/exercises/unit-2.json`.

### 2.1 Polinomios (ítems 1–5)

| Ítem | Tema | Cobertura actual | Ejercicio(s) actual(es) | Decisión |
|---|---|---|---|---|
| 1 a–f | Identificar si una expresión es polinomio (denominadores, exponentes fraccionarios, constantes) | ❌ ausente | — | **AGREGAR** en PR 3 (`polinomios_basico`) — cobertura multi-ítem, tipo MC con variantes "es/no es polinomio". Tag: `02_ej_utn_1`. |
| 2 a–b | Grado + valor numérico para varios números (`Q(1), Q(-1), R(2), R(0), R(-1)`) | ⚠️ parcial | `polinomios_basico.2` (grado), `polinomios_basico.4` (eval P(3)) | **EXTENDER** en PR 3 con un ejercicio que pida **dos** valores numéricos simultáneamente (MC sobre tuplas o doble input). Tag: `02_ej_utn_2`. |
| 3 a–b | `P(-1)+Q(0)`, `2·P(-2) - Q(3)` (evaluación combinada de dos polinomios) | ❌ ausente | — | **AGREGAR** en PR 3. Tag: `02_ej_utn_3`. |
| 4 | `P(1)` + pregunta de unicidad (¿es el único valor?) | ❌ ausente | — | **AGREGAR** en PR 3 como MC conceptual (pregunta de interpretación, no de cálculo). Tag: `02_ej_utn_4`. |
| 5 a–e | Ordenar en forma decreciente + indicar cuáles no están completos (5 polinomios) | ❌ ausente | — | **AGREGAR** en PR 3 como `ordering` (ordenar grados) + MC sobre completitud. Tag: `02_ej_utn_5`. |

**Subtotal familia polinomios básicos**: 5 ítems oficiales → 1 parcial + 4 ausentes. Plan: 4 ejercicios nuevos en PR 3 (multi-ítem 1), 1 multi-valor (2), 1 evaluación combinada (3), 1 conceptual (4), 1 orden + completitud (5) → ~4 ejercicios nuevos, todos en `polinomios_basico`.

### 2.2 Operaciones entre polinomios (ítems 6–9)

| Ítem | Tema | Cobertura actual | Ejercicio(s) actual(es) | Decisión |
|---|---|---|---|---|
| 6 a–f | Suma / resta / multiplicación de polinomios | ✅ cubierto | `operaciones_polinomios.1`–`.5` (.1 producto binomio, .2 suma, .3 resta, .4–.5 productos) | **NO TOCAR**. Los 5 ítems del PDF caen sobre los 5 ejercicios actuales; quedan como referencia histórica al material canónico. |
| 7 a–e | **División larga** `P(x):Q(x)` con divisores cuadráticos (`x²-1`, `x²+x`, `x²-2`, `x²+2x-1`, `x²-x+1`) | ❌ ausente | — | **AGREGAR** en PR 4 (`operaciones_polinomios`). Piso de la familia: **≥3 ejercicios**. Cubrir al menos los casos `P(grado 3):Q(grado 2)` y `P(grado 4):Q(grado 2)` para ejercitar división con residuo cero y con residuo no cero. Tag: `02_ej_utn_7`. |
| 8 a–e | **Ruffini cociente**: divisores `(x+2), (x-3), (x-2), (x-1), (x+2)` | ⚠️ parcial | `ruffini_resto.4` (cociente `x³−1` ÷ `(x−1)`), `.5` (expandir producto) | **AGREGAR** ≥2 ejercicios en PR 6 (`ruffini_resto`) que devuelvan el **cociente** completo (no solo "el residuo es 0"). Tipo: MC sobre coeficientes o `ordering`. Tag: `02_ej_utn_8`. |
| 9 a–h | **Productos notables / potencias**: binomios al cuadrado y al cubo, combinaciones, sumas y diferencias de cubos | ❌ ausente | — | **AGREGAR** en PR 4. Piso de la familia: **≥3 ejercicios**. Cubrir al menos un cuadrado de binomio con parámetro (`(x²+a)²`), un cubo de binomio (`(x²+b)³`) y una diferencia de cubos (`(x+1)³-(x+2)³`). Tag: `02_ej_utn_9`. |

**Subtotal familia operaciones**: 4 ítems oficiales → 1 cubierto, 2 ausentes, 1 parcial. Plan: +3 long-division + 3 productos notables/potencias (PR 4) + ≥2 Ruffini cociente (PR 6). Total agregado: ≥8 ejercicios nuevos sobre la familia.

### 2.3 Factorización (ítem 10)

Siete casos oficiales. Cada uno tiene entre 4 y 15 sub-ítems.

| Caso | Sub-ítems PDF | Cobertura actual | Ejercicio(s) actual(es) | Decisión |
|---|---|---|---|---|
| Factor común | 10 a–f (6) | ⚠️ parcial | `factorizacion.3` (4x común en `12x³ − 8x² + 4x`) | **EXTENDER** con ≥1 ejercicio nuevo en PR 5 (`factorizacion`) para cubrir fracciones y coeficientes grandes. Tag: `02_ej_utn_10_factor_comun`. |
| Factor común por grupos | 10 a–d (4) | ❌ ausente | — | **AGREGAR** ≥1 ejercicio en PR 5. Tag: `02_ej_utn_10_grupos`. |
| Trinomio cuadrado perfecto (TCP) | 10 a–f (6) | ❌ ausente | — | **AGREGAR** ≥2 ejercicios en PR 5. Cubrir TCP "puro" y TCP con reordenamiento (ej. `¼x² + a⁶ + xa³`). Tag: `02_ej_utn_10_tcp`. |
| Cuatrinomio cubo perfecto | 10 a–f (6) | ❌ ausente | — | **AGREGAR** ≥2 ejercicios en PR 5. Tag: `02_ej_utn_10_cubo`. |
| Diferencia de cuadrados | 10 a–d (4) | ⚠️ parcial | `factorizacion.2` (`x²−25` → `(x−5)(x+5)`) | **EXTENDER** con ≥1 ejercicio nuevo (variante con coeficiente, ej. `4a⁸ − x¹⁰`, o con diferencia de orden no natural). Tag: `02_ej_utn_10_dif_cuadrados`. |
| Suma o diferencia de potencias | 10 a–d (4) | ❌ ausente | — | **AGREGAR** ≥1 ejercicio en PR 5. Cubrir un caso diferencia de potencias (`y⁵−243` → `(y³)⁵−3⁵`) y un caso suma (`a⁵+32`). Tag: `02_ej_utn_10_potencias`. |
| Trinomio de segundo grado | 10 a–f (6) | ⚠️ parcial | `factorizacion.1` (`x²-5x+6`, a=1), `factorizacion.4` (`6x²+7x+2`, a≠1) | **NO EXTENDER**: cubierto en dos variantes. Mantener como referencia. |
| Casos combinados | 10 a–ñ (15) | ❌ ausente | — | **AGREGAR** ≥1 ejercicio en PR 5 (un combinado "fácil", ej. `x⁴+a·x³ − x − a`, para forzar al alumno a identificar el caso antes de aplicar). Tag: `02_ej_utn_10_combinados`. |

**Subtotal familia factorización**: 8 casos oficiales → 1 cubierto, 4 parciales, 3 ausentes. Plan: ≥10 ejercicios nuevos en PR 5 (piso de familia exigido por el spec), distribuidos: ≥1 factor común, ≥1 grupos, ≥2 TCP, ≥2 cubo, ≥1 diferencia de cuadrados, ≥1 suma/dif. potencias, ≥1 combinado. Total floor: **10 ejercicios** sobre `factorizacion`.

### 2.4 Mínimo común múltiplo y máximo común divisor (ítem 11)

| Ítem | Tema | Cobertura actual | Decisión |
|---|---|---|---|
| 11 a | `P(x)=x³−8`, `Q(x)=4x²+8x+16` (binomio vs trinomio, factor común `x+2` en `Q`) | ❌ no representado exacto | Cubierto parcialmente por los 4 ejercicios actuales (`mcm_mcd_polinomios.1`–`.4`). |
| 11 b | Tres polinomios: `M(x)=x³+6x²+12x+8`, `R(x)=x²+4x+4`, `S(x)=x²−4` | ❌ ausente | **AGREGAR** ≥1 ejercicio de 3 polinomios en PR 6. Tag: `02_ej_utn_11`. |
| 11 c | Parámetros `a, b`: `T(x)=9x²+6ax+a²`, `C(x)=12x+4a`, `H(x)=9x²−a²` | ❌ ausente | **AGREGAR** ≥1 ejercicio con parámetro en PR 6. Tag: `02_ej_utn_11`. |
| 11 d–e | Otros casos con y sin parámetro | ⚠️ parcial | Cubierto parcialmente. |

**Subtotal MCM/MCD**: 5 ítems oficiales → 0 cubiertos exactos, 4 parciales, 1 ausente. Plan: +2 ejercicios en PR 6 para cubrir caso de 3 polinomios y caso con parámetro. Floor por skill: `mcm_mcd_polinomios` debe pasar de 4 → ≥6 ejercicios.

### 2.5 Expresiones algebraicas racionales (ítems 12–14)

Estos ítems cubren **operaciones** con fracciones algebraicas (sumas, factor+simplificación, cocientes de fracciones complejas), NO resolución de ecuaciones. Viven bajo `skillId: mat.u2.ecuaciones_fraccionarias` con `category: "expresiones_racionales"` por decisión explícita del cambio (`proposal.md`).

| Ítem | Tema | Cobertura actual | Decisión |
|---|---|---|---|
| 12 a–d | Sumas algebraicas de fracciones (`P(x)/Q(x) + R(x)/S(x)`) | ❌ ausente | **AGREGAR** ≥2 ejercicios en PR 7. Tipo MC sobre el resultado simplificado. Tag: `02_ej_utn_12`. |
| 13 a–d | Factorizar numerador y denominador y simplificar el cociente | ❌ ausente | **AGREGAR** ≥1 ejercicio en PR 7. Tipo MC sobre la forma simplificada. Tag: `02_ej_utn_13`. |
| 14 a–d | Resolver numerador y denominador (fracción continua) y luego dividir | ❌ ausente | **AGREGAR** ≥1 ejercicio en PR 7. Tipo MC (no se usa `numerical` por la complejidad algebraica). Tag: `02_ej_utn_14`. |

**Subtotal expresiones racionales**: 3 ítems oficiales, todos ausentes. Piso de familia: **≥4 ejercicios** con `category: "expresiones_racionales"` sobre `skillId: mat.u2.ecuaciones_fraccionarias`. Distribución: 2 sumas, 1 factor+simplifica, 1 cociente de fracciones continuas.

### 2.6 Ecuaciones fraccionarias (ítem 15)

15 sub-ítems en el PDF (a-o). La cobertura actual tiene 4 ejercicios, todos centrados en **exclusión de dominio** y **una ecuación con solución numérica simple**. Faltan: variedad de denominadores, problemas verbales, fracciones con parámetro, suma/resta de fracciones en ambos miembros.

| Ítem | Tema | Cobertura actual | Decisión |
|---|---|---|---|
| 15 a | `2/y + 4/y = 3` (fracciones con misma estructura) | ❌ ausente | **AGREGAR** ≥1 ejercicio en PR 7. Tipo `numerical` (solución escalar única). Tag: `02_ej_utn_15a`. |
| 15 b | `4/y − 5 = 5/2y` | ❌ ausente | **AGREGAR** ≥1 ejercicio en PR 7. Tag: `02_ej_utn_15b`. |
| 15 c | `6x − 5 = 1/x` (cociente simple) | ❌ ausente | **AGREGAR** ≥1 ejercicio en PR 7. Tag: `02_ej_utn_15c`. |
| 15 d, e, f, g, h, i, j, k, l, m, n, o | Ecuaciones con denominadores distintos, parámetros (`w, t`), valor absoluto, igualdades con productos cruzados | ❌ ausente | **NO agregar uno por sub-ítem**. La cobertura mínima es **≥4 ejercicios** con distractor de exclusión de dominio (floor del spec), más allá de los 4 actuales. Distribución propuesta: 1 misma estructura (.a), 1 suma/resta mixta (.c), 1 con denominadores distintos (.g o .h), 1 con verificación de dominio (.m). Los sub-ítems restantes (i-o) quedan como referencia pedagógica. Tag: `02_ej_utn_15`. |

**Subtotal ecuaciones fraccionarias**: 15 ítems oficiales → 0 cubiertos exactos, 1 parcial (exclusión de dominio), 14 ausentes. Piso de familia: **≥4 ejercicios nuevos** con distractor de exclusión de dominio, llegando a `ecuaciones_fraccionarias` con ≥8 ejercicios totales (4 originales + 4 nuevos).

---

## 3. Resumen de brechas por skill

| Skill | Ejercicios actuales | Ejercicios nuevos planeados | Plan total |
|---|---:|---:|---:|
| `mat.u2.polinomios_basico` | 5 | +4 (PR 3) | 9 |
| `mat.u2.operaciones_polinomios` | 5 | +6 (PR 4: 3 long division + 3 notables/potencias) | 11 |
| `mat.u2.ruffini_resto` | 5 | +2–3 (PR 6: cocientes Ruffini) | 7–8 |
| `mat.u2.factorizacion` | 4 | +10 (PR 5) | 14 |
| `mat.u2.gauss` | 4 | +0 (no está en el PDF oficial) | 4 |
| `mat.u2.mcm_mcd_polinomios` | 4 | +2 (PR 6: 3 polinomios + parámetro) | 6 |
| `mat.u2.ecuaciones_fraccionarias` | 4 | +8 (PR 7: 4 expresiones racionales + 4 ecuaciones fraccionarias) | 12 |
| **TOTAL** | **31** | **+32–33** | **63–64** |

### 3.1 Skills no tocadas

`mat.u2.gauss` no aparece en `02_ej_utn.pdf` (es contenido del material canónico local `UNIDAD2_matemática.pdf`, conservado por el SPEC actual como referencia). Se mantiene sin agregar ejercicios en este cambio; un eventual PR futuro podría alinearlo si el material canónico lo justifica.

---

## 4. Decisión sobre ruta canónica (`canonicalTrace`)

El campo `canonicalTrace` de los 31 ejercicios actuales apunta a `material_canonico/Matemática/UNIDAD2_matemática.pdf` (`unit-2.json:148`, `:482`, `:514`, `:546`, `:590`, `:622`, `:654`, `:686`, `:712`). Para los ejercicios nuevos se mantiene ese path **y** se agrega una segunda entrada que apunte al PDF oficial para preservar trazabilidad:

```json
"canonicalTrace": [
  {
    "path": "material_canonico/Matemática/UNIDAD2_matemática.pdf",
    "section": "Capítulo N: <título>",
    "sourceUse": "reference",
    "pedagogicalIntent": "Exercise references this canonical source for pedagogical context"
  },
  {
    "path": "00-Ejercicios UTN/02_ej_utn.pdf",
    "section": "Ítem 7a–e: División larga de polinomios",
    "sourceUse": "alignment",
    "pedagogicalIntent": "New exercise added to align coverage with official UTN 2025 guide item 7"
  }
]
```

- `path` del PDF oficial: ruta **relativa al repo** apuntando al directorio `00-Ejercicios UTN/` que aloja los PDFs de Seminarios UTN-FRM (no commiteados hoy). La entrada queda como referencia declarativa; el archivo en sí vive en `~/Documentos/Preuniversitarios/UTN/01 - Matemática/00 - Ejercicios UTN/`. El spec actual **no exige** que el PDF esté en el repo para validar la cobertura.
- `sourceUse: "alignment"` (nuevo valor) diferencia estas entradas del `sourceUse: "reference"` existente y permite a las shape tests distinguir trazos oficiales de trazos pedagógicos.

El nuevo tag por ejercicio (`02_ej_utn_<item>`) se aloja en `Exercise.tags[]` (campo opcional ya soportado). Esto da doble trazabilidad: el tag es buscable en cualquier test, y el `canonicalTrace` mantiene el modelo de cita del repo.

---

## 5. Pisos de cobertura por familia (acordados en el spec)

Estos pisos vienen del spec `openspec/changes/align-u2-practice-official-exercises/specs/math-exercise-catalog/spec.md` (Requirement: Unit 2 Exercise Coverage) y son el contrato de aceptación de los PRs 3-7:

| Familia | Piso | Skill destino | Categoría |
|---|---:|---|---|
| Long division | 3 | `operaciones_polinomios` | — |
| Productos notables y potencias | 3 | `operaciones_polinomios` | — |
| Factorización a través de casos | 10 | `factorizacion` | — |
| Expresiones racionales | 4 | `ecuaciones_fraccionarias` | `expresiones_racionales` |
| Ecuaciones fraccionarias con verificación de dominio | 4 | `ecuaciones_fraccionarias` | — |

Cobertura actual vs. piso:

| Familia | Actual | Piso | Brecha |
|---|---:|---:|---:|
| Long division | 0 | 3 | 3 |
| Productos notables y potencias | 0 | 3 | 3 |
| Factorización por casos | 4 | 10 | 6 |
| Expresiones racionales | 0 | 4 | 4 |
| Ecuaciones fraccionarias con dominio | 4 | 4 | 0 (cumple piso, se extenderá en PR 7) |

**Nota**: el piso de la tabla de arriba cuenta los 4 ejercicios actuales de `ecuaciones_fraccionarias` como cumplimiento del piso de "verificación de dominio" (los 4 actuales usan distractor de exclusión). PR 7 extiende más allá del piso para cubrir variedad de estructuras (no solo "no hay solución porque anula denominador").

---

## 6. Disciplina de tipo de respuesta (constraint del spec)

Prohibido por `specs/math-exercise-catalog/spec.md` (Requirement: Unit 2 Input Type Restriction):

- `numerical` para una expresión algebraica simbólica, una factorización, una raíz irracional, una unión/interseccción de intervalos, un número complejo, una raíz doble con texto adjunto.
- Cualquier forma de respuesta libre (texto, fill-blank algebraico).

`numerical` solo se permite cuando la respuesta es exactamente **un escalar finito**: el residuo de una división, un coeficiente entero, una raíz numérica única. Para todo lo demás:

| Familia de respuesta | Tipo permitido |
|---|---|
| Cociente de Ruffini (polinomio) | `multiple-choice` sobre opciones con coeficientes del cociente |
| Cociente de división larga | `multiple-choice` sobre opciones con cociente + resto |
| Factorización | `multiple-choice` sobre opciones con la factorización completa |
| Expresión racional simplificada | `multiple-choice` |
| Ecuación con dos raíces válidas | `multiple-choice` (distractores: una raíz + una exclusión) |
| Ecuación con exclusión de dominio | `multiple-choice` con distractor explícito `x = k` que anula denominador |
| Orden de polinomios por grado | `ordering` |
| Emparejar numerador/denominador factorizados | `matching` |

Las shape tests del catálogo (`catalog-answer-contract.test.ts`, `exercises-u2-shape.test.ts`) se extenderán para hacer cumplir esta tabla como **guardia de calidad**, no como recomendación.

---

## 7. Trazabilidad por ejercicio

Aplicable a los 32-33 ejercicios nuevos, mapeo tentativo entre ítem del PDF y slot de catálogo. Se confirma durante la implementación de PR 3-7 (las tags finales pueden diferir levemente del slot sugerido si el material canónico así lo justifica).

| Tag `02_ej_utn_*` | Familia | Slot sugerido |
|---|---|---|
| `02_ej_utn_1` | polinomios — identificación | `ex.u2.polinomios_basico.6` |
| `02_ej_utn_2` | polinomios — multi-valor numérico | `ex.u2.polinomios_basico.7` |
| `02_ej_utn_3` | polinomios — evaluación combinada | `ex.u2.polinomios_basico.8` |
| `02_ej_utn_4` | polinomios — unicidad / conceptual | `ex.u2.polinomios_basico.9` |
| `02_ej_utn_5` | polinomios — orden y completitud | (parte del slot anterior o ejercicio aparte) |
| `02_ej_utn_7a`, `02_ej_utn_7c`, `02_ej_utn_7e` | long division | `ex.u2.operaciones_polinomios.6`–`.8` |
| `02_ej_utn_9a`, `02_ej_utn_9c`, `02_ej_utn_9g` | productos notables / potencias | `ex.u2.operaciones_polinomios.9`–`.11` |
| `02_ej_utn_8a`, `02_ej_utn_8d` | Ruffini cociente | `ex.u2.ruffini_resto.6`, `ex.u2.ruffini_resto.7` |
| `02_ej_utn_10_factor_comun` | factor común extendido | `ex.u2.factorizacion.5` |
| `02_ej_utn_10_grupos` (a) | factor común por grupos | `ex.u2.factorizacion.6` |
| `02_ej_utn_10_tcp` (a, c) | trinomio cuadrado perfecto | `ex.u2.factorizacion.7`, `.8` |
| `02_ej_utn_10_cubo` (a, d) | cuatrinomio cubo perfecto | `ex.u2.factorizacion.9`, `.10` |
| `02_ej_utn_10_dif_cuadrados` (c) | diferencia de cuadrados extendida | `ex.u2.factorizacion.11` |
| `02_ej_utn_10_potencias` (a, c) | suma/dif. potencias | `ex.u2.factorizacion.12` |
| `02_ej_utn_10_combinados` (e) | casos combinados | `ex.u2.factorizacion.13` |
| (slot extra factorización) | cobertura extra (si falta para llegar a 10) | `ex.u2.factorizacion.14` |
| `02_ej_utn_11` (b, c) | mcm/mcd con 3 polinomios o parámetros | `ex.u2.mcm_mcd_polinomios.5`, `.6` |
| `02_ej_utn_12` (a, c) | sumas de fracciones algebraicas | `ex.u2.ecuaciones_fraccionarias.5`, `.6` |
| `02_ej_utn_13` (a) | factor + simplifica | `ex.u2.ecuaciones_fraccionarias.7` |
| `02_ej_utn_14` (a) | cociente de fracciones complejas | `ex.u2.ecuaciones_fraccionarias.8` |
| `02_ej_utn_15` (a, c, g, m) | ecuaciones fraccionarias variadas | `ex.u2.ecuaciones_fraccionarias.9`–`.12` |

---

## 8. Plan de implementación alineado con tasks.md

| PR | Tasks | Entregables | Acordado en |
|---|---|---|---|
| PR 1 (esta entrega) | 1.1, 1.2 | Este documento + README de la carpeta | `tasks.md` Phase 1 (Foundation) |
| PR 2 | 2.1 | Tags `u2_*` faltantes en `error-taxonomy/index.ts` | `tasks.md` Phase 1 |
| PR 3 | 3.1, 3.2 | +4 ejercicios `polinomios_basico` (`category: "polinomios_basico"` en cada uno), extensión de `exercises-u2-shape.test.ts` con piso `>=9` (5 existentes + 4 nuevos) y trazas `02_ej_utn_1..5` | `tasks.md` Phase 2 |
| PR 4 | 4.1, 4.2 | +6 ejercicios `operaciones_polinomios` (3 long division con `02_ej_utn_7` + 3 notables/potencias con `02_ej_utn_9`), shape floors (`>=3` cada familia) | `tasks.md` Phase 2 |
| PR 5 | 5.1, 5.2 | +10 ejercicios `factorizacion` distribuidos sobre los 7 casos oficiales (`02_ej_utn_10_*`), shape floors (piso `>=10`, presencia por caso) | `tasks.md` Phase 2 |
| PR 6 | 6.1, 6.2 | +2-3 ejercicios `ruffini_resto` (`02_ej_utn_8`) + +2-3 ejercicios `mcm_mcd_polinomios` (`02_ej_utn_11`, incluyendo 3 polinomios y parámetro), shape floors con `>=5` por skill | `tasks.md` Phase 2 |
| PR 7 | 7.1, 7.2, 7.3 | +4 expresiones racionales (`02_ej_utn_12..14`, `category: "expresiones_racionales"`) + +4 ecuaciones fraccionarias (`02_ej_utn_15`, distractor de exclusión de dominio), shape tests con `category` + distractor + scalar-only guard | `tasks.md` Phase 2 |
| PR 8 | 8.1–8.5 | `catalog-content.test.ts` (traza canónica `02_ej_utn.pdf`), `catalog-answer-contract.test.ts` (audit para casos algebraicos/dominio), `skill-catalog-u2-deps.test.ts` (no-new-skill guard), ambos specs actualizados, `pnpm run test:run && pnpm run typecheck && pnpm run build` en verde | `tasks.md` Phase 3 |

PRs 3-7 son **independientes** y revertibles por sí solos (cada uno agrega contenido + tests; ninguno toca catalog loader, schema ni skill list). PR 8 es la consolidación: verifica que la cobertura completa cumple los pisos y que ningún guardián de calidad quedó corto.

---

## 9. Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| El PDF `02_ej_utn.pdf` no vive en el repo; `canonicalTrace.path` será ruta relativa a un directorio externo (`00-Ejercicios UTN/`). | Documentado en sección 4. Los tests de cobertura trabajan con tags `02_ej_utn_*`, no con la ruta absoluta del PDF. |
| El campo `category` no se usaba en ningún ejercicio U2 antes de este cambio | Se introduce de forma aditiva como opcional en `Exercise`. PR 3 lo aplica a los 4 ejercicios nuevos de `polinomios_basico` con `category: "polinomios_basico"` (coherente con el patrón usado en U1, ej. `factor_racionalizante` para `racionalizacion`); PR 7 lo hará con `category: "expresiones_racionales"` para las expresiones racionales sobre `ecuaciones_fraccionarias`. Los shape tests verifican presencia en las familias que lo declaran; ausencia en el resto no rompe nada. |
| Algunos ejercicios propuestos tienen respuesta simbólica (factorización, cociente de Ruffini) y la app no soporta "escribir factorización como texto". | Disciplina de tipo explícita (sección 6); shape tests reforzados para detectar regresiones a `numerical` en respuestas simbólicas. |
| PRs 3-7 juntos podrían acercarse al límite de 400 líneas por PR. | Cada PR es una familia y se mantiene <400 líneas de diff (auditoría + contenido + tests). Una desbordada se parte en PRs consecutivos. |
| El alineamiento confunde al alumno si la teoría U2 no cubre familias como trinomio cuadrado perfecto | Verificar que `content/matematica/theory/unit-2.json` ya nombra TCP, cubo perfecto, suma de potencias. Si falta, abrir cambio SDD paralelo (fuera de scope de este change). |

---

## 10. Reglas de la pasada

- No se modificó código, specs ni contenido.
- Las afirmaciones importantes citan `archivo:línea` cuando fue posible verificar contra el repositorio o el PDF.
- El conteo de ejercicios actuales se hizo leyendo `content/matematica/exercises/unit-2.json` con `grep -c '"id": "ex\\.u2\\.'` (31 hits).
- La distribución por skill se hizo con `grep -E '"skillId":' unit-2.json | sort | uniq -c` y reproduce los conteos del exploration (`exploration.md`, sección "Current State").
- El mapeo de ítems del PDF se hizo leyendo `pdftotext -layout` sobre `02_ej_utn.pdf` y contrastando con la lista del exploration.
- No se cita `mate-explorer` ni apps externas: este cambio es contenido-only sobre el catálogo de `pre_utn`.
