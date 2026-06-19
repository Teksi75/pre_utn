# Exploration: refine-issue-42-ruffini-monic-callout

## Issue synthesis

- **El usuario señala un gap de PRESENTACIÓN (no de fondo)** sobre el estado dejado por `issue-42-powers-same-degree` (merge 3c36dca). Tres puntos concretos:
  1. La tabla de Ruffini está descrita en prosa dentro de P4. Quiere una representación visual.
  2. "El resto es 0" está implícito en el medio de P4. Quiere una llamada explícita que ancle el cierre de la tabla.
  3. La conciliación con el factor mónico (el punto pedagógicamente más sutil) está enterrada en la segunda mitad de P4. Quiere un callout dedicado al final de P4 (o como P5 nuevo): "Ruffini divide por el factor mónico asociado: x + 3/2".
- **El usuario proveyó un draft** del bloque que quiere ver (4 párrafos con la tabla ASCII y el callout). El draft usa espacios y newlines como en una tabla manuscrita.

## Current state

### Concepto vigente (líneas 171-178 de `content/matematica/theory/unit-2.json`)

`concept-fac-potencias-igual-grado` tiene **6 bodyParagraphs** (P1-P6):

- **P1 (línea 172)**: la regla de 4 casos de divisibilidad como lista parentética `(a) ... (b) ... (c) ... (d)`. ~600 chars.
- **P2 (línea 173)**: cómo elegir el primer factor. Ejemplo `8x³ + 27 = (2x)³ + 3³` → primer factor `2x + 3`.
- **P3 (línea 174)**: cómo obtener el número de Ruffini cuando el divisor NO es mónico. "Resolvé divisor = 0 SIEMPRE antes de tocar la tabla."
- **P4 (línea 175)**: la tabla de Ruffini **en prosa paso a paso**: "Colocás −3/2 a la izquierda, bajás el 8, multiplicás 8·(−3/2) = −12, sumás a 0 → −12, multiplicás −12·(−3/2) = 18, sumás a 0 → 18, multiplicás 18·(−3/2) = −27, sumás a 27 → 0. El cociente que sale de Ruffini es [8, −12, 18] con resto 0, es decir 8x² − 12x + 18. **Pero ese cociente está calculado respecto al divisor mónico (x + 3/2); como el divisor original era 2x + 3 = 2·(x + 3/2), hay que dividir el cociente por 2 para compensar**: (8x² − 12x + 18) / 2 = 4x² − 6x + 9. La factorización final es (2x + 3)(4x² − 6x + 9)." ~700 chars, una sola oración.
- **P5 (línea 176)**: el método de disminución de exponentes como alternativa.
- **P6 (línea 177)**: comparación Ruffini vs disminución.

### Worked example vigente (`example-factorizacion-3`, líneas 167-187 de `content/matematica/examples/unit-2.json`)

5 steps. El cálculo de Ruffini está en steps 3 y 4, también en prosa. El `pedagogicalNote` (línea 178) ya cubre el error frecuente del número equivocado en Ruffini y el dividir por 2 el cociente cuando el divisor original no es mónico.

### Feedback mapping vigente

`content/matematica/feedback/unit-2.json` ya tiene la entrada con `errorTag: "u2_ruffini_signo_a"` y `recoveryTarget: "example-factorizacion-3"` (verificado en `src/domain/__tests__/copy-strings-acceptance.test.ts:202-208`).

## Evidencia del renderer (CRÍTICO para el approach del usuario)

Para responder "qué pasa si meto la tabla ASCII como un string con `\n` dentro de un `bodyParagraph`", leí los componentes y la CSS:

1. **`TheoryCard.tsx:63-69`** — cada `bodyParagraph` se mapea a un `<div>` que contiene `<RichText text={p} />`. NO hay procesamiento previo de whitespace.
2. **`RichText.tsx:17-29`** — renderiza cada segmento de texto como `<span key={i}>{seg.value}</span>`. No hace split en `\n`, no convierte newlines a `<br>`, no envuelve en `<pre>`.
3. **`rich-text-parser.ts:29-67`** — `parseRichTextSegments` solo segmenta por delimitadores de math (`$...$`, `$$...$$`). No toca whitespace.
4. **`globals.css`** — no hay utility `whitespace-pre` ni `whitespace-pre-wrap` aplicado a `<span>` ni al container de `bodyParagraphs`. Las variables CSS definidas (líneas 60-69) son de tipografía, layout, color, motion — no hay nada de pre-formatting.
5. **Test de caracterización** `TheoryCard.test.tsx:117-144` ("renders one `<div>` per bodyParagraphs chunk") — confirma que cada chunk es un `<div>` independiente, sin tratamiento de whitespace interno.

**Conclusión**: un `bodyParagraph` que contenga `"-3/2 |   8     0      0     27\n     |       -12     18    -27\n     --------------------------\n         8   -12     18      0"` se va a renderizar como una línea de texto corrida donde los `\n` colapsan a un solo espacio (comportamiento default de HTML en `<span>`). **El draft del usuario NO funciona como está en el modelo vigente.**

`WorkedExampleCard.tsx:53` también usa `<RichText text={step.explanation} />`, así que el mismo problema aplica a las steps del worked example.

## Precedentes en el modelo y el contenido

- **Modelo** (`src/domain/models/theory.ts:24-41`): `ConceptBlock` tiene `body: string`, `bodyParagraphs?: readonly string[]`, e `intervalRepresentations?: readonly IntervalRepresentation[]`. **NO** hay un campo `code`, `pre`, `table`, ni nada similar.
- **Renderer** (`TheoryCard.tsx` + `RichText.tsx`): **NO** hay precedencia de bloques de código, monospace, ni tablas en ninguna ruta de render.
- **Búsqueda en `content/matematica/`**: ningún archivo JSON actual usa un bloque con newlines literales, un campo `code`, ni notación tabular. Todo es prosa con math inline/display.
- **El único precedente de "bloque visual especial"** es `intervalRepresentations` (la `NumberLineInterval` en la teoría de conjuntos). Es un campo tipado, un componente dedicado, y un add al modelo — un mini-feature, no un "truco de string".

## Affected areas

- `content/matematica/theory/unit-2.json` — `concept-fac-potencias-igual-grado.bodyParagraphs` (líneas 171-178). Cambio **principal**.
- `src/domain/__tests__/content-loaders.test.ts:541-557` — el `EXPANDED_U2_IDS` permite 5-6 párrafos. Si subimos el cap del concept, hay que actualizar este set o relajar la aserción.
- `src/domain/__tests__/copy-strings-acceptance.test.ts:211-238` — la aserción `>=5 && <=6` también queda tensionada si subimos.
- `content/matematica/examples/unit-2.json` — `example-factorizacion-3` (opcional, ver "Worked example touch" abajo).
- `openspec/changes/STATUS.json` — agregar entrada in-progress al abrir el change.

## Approaches

### Opción A — Refinamiento en prosa solamente (la más chica, no requiere modelo)

Renunciar al visual de la tabla. Refactorizar P4 en 2-3 párrafos más cortos:

- P4a (nuevo): tabla de coeficientes + bajada del primero + primera multiplicación (sin todo el cálculo). ~150 chars.
- P4b (nuevo, con el callout "resto es 0"): la finalización del cálculo + "Como el resto es 0, la división es exacta." ~150 chars.
- P4c (nuevo, el callout del factor mónico): "**OJO:** Ruffini divide por el factor mónico asociado `x + 3/2`, no por `2x + 3`. El cociente que sale es 8x² − 12x + 18 respecto de `x + 3/2`. Como el divisor original era `2x + 3 = 2·(x + 3/2)`, hay que dividir el cociente por 2 para compensar: 4x² − 6x + 9." ~280 chars.

- **Pros**: 0 cambios de modelo, parser o renderer. Cero riesgo. Forecast ~20-30 líneas de JSON + 5-10 líneas de tests.
- **Cons**: el visual de la tabla NO se entrega. La representación sigue siendo prosa, solo más estructurada y con el callout del factor mónico prominente.
- **Esfuerzo**: Bajo.

### Opción B — KaTeX block math con `\begin{array}` (recomendada)

Renderizar la tabla con KaTeX block math `$$...$$` usando `\begin{array}{c|cccc}` con `\hline`. Ejemplo del bloque propuesto:

```
$$
\begin{array}{c|cccc}
-3/2 & 8 & 0 & 0 & 27 \\
     &   & -12 & 18 & -27 \\
\hline
     & 8 & -12 & 18 & 0
\end{array}
$$
```

Esto entra como **un solo bodyParagraph** usando el delimitador `$$...$$` (que el parser ya entiende, ver `rich-text-parser.ts:45-49`). El renderer ya sabe cómo mostrar block math (`TheoryCard.test.tsx:276-296` lo verifica, y `katex-display` ya está en uso para el display math en otros concepts).

Estructura del refactor (P4 actual → 4 párrafos):

- **P4-α (nuevo)**: bloque KaTeX con la tabla + oración introductoria "Aplicamos Ruffini con −3/2:" antes del bloque.
- **P4-β (nuevo)**: "Como el resto es 0, la división es exacta." (callout explícito).
- **P4-γ (nuevo)**: "El cociente que sale de Ruffini es 8x² − 12x + 18, pero hay que aclarar algo importante: **Ruffini divide por el factor mónico asociado** `x + 3/2`, no por el divisor original `2x + 3`. Como `2x + 3 = 2·(x + 3/2)`, hay que dividir el cociente por 2: (8x² − 12x + 18) / 2 = 4x² − 6x + 9. La factorización es (2x + 3)(4x² − 6x + 9)." (callout dedicado del factor mónico).
- (P5 de disminución de exponentes y P6 de comparación se mantienen en su lugar actual.)

- **Pros**: 0 cambios de modelo/parser/renderer. Visual de tabla logrado (con tipografía math, no monospace manuscrito, pero alineado en columnas). El bloque KaTeX es responsive porque `katex-display` se renderiza en bloque con su propio layout. Forecast ~30-50 líneas de JSON + 5-10 líneas de tests.
- **Cons**: la tabla es "math" no "handwritten". Quien esperaba monospace tipográfico obtiene KaTeX (que es lo que usa el resto del material canónico). El usuario debe aprobar el trade-off.
- **Esfuerzo**: Bajo.

### Opción C — Bloque "manuscrito" en monospace (requiere modelo nuevo)

Agregar un campo opcional a `ConceptBlock` (y `WorkedExampleStep` para los worked examples que también lo usen), e.g. `codeBlocks?: readonly string[]` o `monospaceBlocks?: readonly string[]`. Renderizar con `<pre class="font-mono whitespace-pre">` o similar. El `bodyParagraphs` seguiría siendo prosa, pero con un nuevo sibling field.

- **Pros**: visual de monospace manuscrito logrado. Reutilizable para futuros casos (e.g. una tabla de divisibilidad, una tabla de signos, una tabla de verdad).
- **Cons**: **cambio de modelo, parser, renderer, tests de modelo, tests de parser, tests de TheoryCard, tests de WorkedExampleCard, copy-strings-acceptance**. Estimado ~150-250 líneas. **Fuera del scope de "refinamiento chico"**. Probablemente 2 PRs encadenados.
- **Esfuerzo**: Alto.

## Recommendation

**Opción B (KaTeX block math)**. Balancea los tres objetivos del usuario:

1. Visual de tabla: logrado con `array` KaTeX.
2. "Resto es 0" explícito: logrado con un párrafo dedicado.
3. Callout del factor mónico: logrado con un párrafo dedicado al final, antes de pasar a P5 (disminución).

Si el usuario rechaza KaTeX (porque quiere la estética monospace manuscrita), la Opción A es la degradación honesta: se entrega el callout y la estructura, se renuncia al visual de tabla, y se documenta el trade-off en el commit. La Opción C es un proyecto aparte, no un refinamiento.

**Asunción (modo auto)**: KaTeX block math es aceptable porque ya es la convención para el display math en el resto del material canónico (e.g. `concept-gauss-ejemplo` línea 228 usa `$$...$$`). Si el usuario disiente, el orchestrator puede pedir un re-scope a Opción A.

## Worked example touch

**Recomendación: no tocar `example-factorizacion-3`.** Justificación:

1. La versión actual del worked example (5 steps) ya hace un walk-through paso a paso del Ruffini. Agregar la tabla ASCII adentro de un step NO funcionaría por la misma razón del renderer (whitespace colapsado en `<span>`).
2. La duplicación (concept + worked example) está bien hoy: el concept es la lectura pasiva con la justificación del factor mónico; el worked example es la guía paso a paso. Reforzar la tabla en el worked example no agrega pedagogía nueva — solo es la misma info dos veces.
3. Si en el futuro se introduce el campo `monospaceBlocks` (Opción C), entonces sí se justificaría duplicar la tabla en el worked example. Hoy no.
4. **Opcional (low-cost)**: agregar al `pedagogicalNote` de `example-factorizacion-3` una referencia al concept: "Ver la tabla de Ruffini completa en el concept `concept-fac-potencias-igual-grado` para visualizar el arreglo de coeficientes." Una línea. Forecast +1 línea. Si el usuario prefiere cero acoplamiento entre archivos, se omite.

## Precedentes relevantes

- **`issue-36-theory-readability` (merge previo)**: introdujo `bodyParagraphs` + `TheoryCard` con render uno-a-uno. Este refinamiento es del mismo modelo, sin abrirlo.
- **`issue-42-powers-same-degree` (merge 3c36dca)**: dejó el concept en 6 bodyParagraphs y 3 worked examples. Este refinamiento NO deshace nada; agrega párrafos a la derecha de P4.
- **KaTeX `array` en otros concepts**: el display math ya está en uso (e.g. `concept-gauss-ejemplo` línea 228). `TheoryCard.test.tsx:276-296` verifica que `$$...$$` produce `katex-display`. No es un precedente directo de `array`, pero es un precedente del mecanismo.
- **Cero precedente de bloque monospace / pre / tabular en el modelo.** Si se quiere ese precedente, hay que crearlo con Opción C.

## Open questions

1. **¿KaTeX block math es aceptable para el visual de la tabla?** El usuario pidió "una representación visual" — no especificó si debe ser monospace manuscrita o si KaTeX-aligned-column alcanza. El orchestrator debe preguntar antes de lanzar `sdd-propose`, o bien el `sdd-propose` mismo debe explicitar el trade-off y dejar al usuario elegir.
2. **¿La Opción A (prosa estructurada) es una degradación aceptable si KaTeX no convence?** Si la respuesta a (1) es "no, quiero monospace", entonces este change debe re-scopearse a Opción C (modelo nuevo) o aceptar la Opción A con el callout del factor mónico como única mejora visible.
3. **¿Se actualiza el `pedagogicalNote` de `example-factorizacion-3` con la referencia al concept?** El usuario no lo pidió. Es una adición opcional. Si se omite, el alcance queda estrictamente en `concept-fac-potencias-igual-grado.bodyParagraphs`.
4. **¿El "OJO:" en el callout del factor mónico es consistente con la voz?** El AGENTS.md dice "Voz prohibida: 'Soy tu profe…'". "OJO" es coloquial y enfático. Una alternativa más neutra y consistente con la marca Ingenium es: "**Importante:**" o "**Atención:**" o "**Aclaración:**". El orchestrator debe elegir el énfasis (o pedirle al usuario que elija) durante `sdd-propose`.

## Risks

- **Forecast blow-up si se opta por Opción C** (~150-250 líneas de código). El "refinamiento chico" dejaría de ser chico. En ese caso, dividir en 2 PRs encadenados (PR1: refinement con Opción A/B; PR2: feature de `monospaceBlocks`).
- **Cap de bodyParagraphs tensionado**: `content-loaders.test.ts:553` y `copy-strings-acceptance.test.ts:217` están calibrados a 5-6 párrafos. Con la Opción B pasamos de 6 a ~9-10. Hay que actualizar el set `EXPANDED_U2_IDS` y la aserción. Es mecánico, pero hay que tocarlo.
- **KaTeX array visual**: en mobile (375px) el array de 5 columnas puede quedar apretado. El repo tiene el sprint de responsiveness (Nav mobile-safe a 375px, `redesign-aesthetic-sprint-v4` menciona "sin overflow horizontal en 375px"). Verificar con Playwright en mobile antes de mergear. **Mitigación**: el array `c|cccc` con 5 columnas ocupa ~250-300px en math font, debería caber en 375px. Si no, reducir a 4 columnas o usar `r|cccc` con ajuste.
- **Voice drift**: la palabra "OJO" (si se usa) es coloquial. El AGENTS.md tiene reglas de voz (no "profe digital", no "plan personalizado", no "te marco qué practicar"). El "OJO" no está explícitamente prohibido pero es borderline. **Mitigación**: usar "Importante" o "Atención" — más alineado con la marca.
- **Consistencia con el resto del concept**: P1, P3, P5 y P6 NO usan énfasis fuerte (bold, exclamaciones, mayúsculas). Si el callout del factor mónico usa "**Importante:**", el concept pasa a tener 1 párrafo con énfasis fuerte entre 5 que no lo tienen. **Mitigación**: elegir un énfasis proporcional (e.g. simplemente la frase sola, sin marcador, o con un "Ojo:" de baja prominencia).
- **Tooling**: `TheoryCard` no cambia, `RichText` no cambia, `parseRichTextSegments` no cambia. Cero riesgo de regresión de rendering.
- **GGA**: sigue bypaseado en Windows (Codex CLI). Si se sube el cap de bodyParagraphs, el GGA podría alertar sobre el cap (símbolo de alerta histórica: ver `issue-42` summary "GGA bypassed on Windows"). Re-validar en Linux antes del merge cross-PC.

## No proceder si…

- El usuario rechaza Opción B (KaTeX) y Opción A (prosa) y exige la estética monospace manuscrita. Eso requiere Opción C, que es un feature aparte, no un refinamiento. Re-scopear como `feat-theory-monospace-blocks` y arrancar un explore desde cero con más superficie de investigación.
- El usuario quiere que la tabla también aparezca en `example-factorizacion-3`. Por la misma razón del renderer, eso requiere el modelo nuevo. Mismo re-scope.
- El usuario quiere cambiar el orden o el contenido de P5 (disminución de exponentes) o P6 (comparación). Eso ya no es refinamiento de presentación — es reescritura pedagógica. Re-scopear.
- El usuario quiere aplicar el mismo refinamiento a otros concepts (e.g. `concept-ruffini-procedimiento` también podría beneficiarse de una tabla). Eso ya es alcance multi-concept. Re-scopear a `refine-ruffini-concepts-visual` o similar.

## Ready for proposal

**Yes**, con una decisión pendiente del orchestrator: validar que KaTeX block math es la representación visual aceptable para la tabla. Si lo es, el `sdd-propose` puede proceder con Opción B y forecast ~40-60 líneas (debajo del budget de 400). Si el orchestrator prefiere Opción A por simplicidad o porque el usuario quiere reservar el visual monospace para un feature aparte, el `sdd-propose` también puede proceder con Opción A y forecast ~20-30 líneas.
