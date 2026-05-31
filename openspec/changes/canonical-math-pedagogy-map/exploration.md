# Exploration: canonical-math-pedagogy-map

> **Status:** Complete
> **Date:** 2026-05-30
> **Depends on:** 05-math-content-map.md, 06-skill-map.md, 07-exercise-types.md

---

## 1. Inventario de material canónico

### Matemática (14 archivos)

| Archivo | Tipo | Contenido esperado |
|---|---|---|
| `UNIDAD1_matemática.pdf` | Guía de unidad | Conjuntos numéricos, reales, operaciones, potenciación, radicación, racionalización, intervalos, valor absoluto, logaritmos, complejos |
| `UNIDAD2_matemática.pdf` | Guía de unidad | Polinomios, términos semejantes, Ruffini, teorema del resto, factorización, Gauss, MCM/MCD, ecuaciones fraccionarias |
| `UNIDAD3_matemática.pdf` | Guía de unidad | Ecuaciones lineales/cuadráticas, inecuaciones, recta, sistemas, exponenciales, logarítmicas |
| `UNIDAD4_matemática.pdf` | Guía de unidad | Perímetro/área/volumen, proporciones, Thales, Pitágoras, razones trigonométricas, seno/coseno |
| `UNIDAD5_matemática.pdf` | Guía de unidad | Ángulos, radianes, circunferencia trigonométrica, identidades, ecuaciones trigonométricas, complejos en forma polar |
| `UNIDAD6matemática.pdf` | Guía de unidad | Funciones, dominio, imagen, ceros, crecimiento, inversas, composición, tramos, afín, cuadrática, exponencial, logarítmica, trigonométrica |
| `Examen_Matemática_TEMA 1 RESPUESTAS.pdf` | Examen + respuestas | Modelo de examen T1 — valida mapa de examen (05 §7) |
| `Examen_Matemática_TEMA 2 RESPUESTAS.pdf` | Examen + respuestas | Modelo de examen T2 — segunda variante del examen |
| `RESOLUCIÓN DE EJERCICIOS SEMINARIO UNIVERSITARIO MATEMÁTICA.pdf` | Resoluciones | Resoluciones de ejercicios del seminario — fuente de procedimientos y errores frecuentes |
| `Resolución_MATEMÁTICA_TEMA 2.pdf` | Resolución | Resolución detallada del examen T2 — fuente de procedimientos esperados |
| `Resultados_matemática de la guía unidad 1 .pdf` | Resultados | Resultados de la guía U1 — fuente de datos reales de dificultad |
| `Semana_0_Diagnostico_Matematica_UTN.docx` | Diagnóstico | Test diagnóstico inicial — fuente para la feature de diagnóstico |
| `Semana_0_Diagnostico_Matematica_UTN_resultados.docx` | Resultados diagnóstico | Resultados del test diagnóstico — baseline real de nivel de ingreso |
| `Cronograma_matemática.xlsx` | Cronograma | Calendario curricular — define ritmo y secuencia oficial |

### Física (11 archivos) — DEFERIDO a fase 2

| Archivo | Unidad |
|---|---|
| `1_1 CANTIDADES, MAGNITUDES, VECTORES U1.pdf` | U1 Vectores |
| `1_2 CINEMÁTICA U2.pdf` | U2 Cinemática |
| `2 VECTORES.pdf` | Vectores |
| `3 DINÁMICA.pdf` | Dinámica |
| `4 ESTÁTICA.pdf` | Estática |
| `5 TRABAJO-ENERGIA-POTENCIA.pdf` | Trabajo, Energía, Potencia |
| `EJERCICIOS COMPLEMENTARIOS - FÍSICA.pdf` | Ejercicios extra |
| `EXAMEN DE AD. FISICA TEMA 2.pdf` | Examen Física T2 |
| `EXAMEN DE FISICA AD. TEMP. T 1 24.pdf` | Examen Física T1 |
| `GUÍA DE PROBLEMAS A RESOLVER FISICA.pdf` | Guía de problemas |
| `RESPUESTAS_Física__TEMA_2.pdf` | Respuestas Física T2 |

### Directorio `content/`

- `content/matematica/.gitkeep` — **vacío**, sin ejercicios aún
- `content/fisica/.gitkeep` — **vacío**, sin ejercicios aún

---

## 2. Análisis cruzado: material canónico vs specs existentes

### 2.1 Cobertura de 05-math-content-map.md

| Spec 05: Unidad | Material canónico | Estado |
|---|---|---|
| U1 — Conjuntos/Álgebra | `UNIDAD1_matemática.pdf` | ✅ Cubierto |
| U2 — Polinomios | `UNIDAD2_matemática.pdf` | ✅ Cubierto |
| U3 — Ecuaciones/Sistemas | `UNIDAD3_matemática.pdf` | ✅ Cubierto |
| U4 — Geometría | `UNIDAD4_matemática.pdf` | ✅ Cubierto |
| U5 — Trigonometría | `UNIDAD5_matemática.pdf` | ✅ Cubierto |
| U6 — Funciones | `UNIDAD6matemática.pdf` | ✅ Cubierto |
| Mapa de examen (10 tipos) | 2 exámenes con respuestas | ⚠️ Parcial — solo 2 variantes |

### 2.2 Cobertura de 06-skill-map.md

- 37 skills de unidad definidas en TypeScript — **alineadas con las 6 unidades del material**
- 10 exam skills — **alineadas con el mapa de examen de 05**
- 17 dependencias de prerrequisito — **definidas pero no validadas contra material**
- **GAP**: No hay extracción de skills reales del material (las actuales son una proyección teórica)

### 2.3 Cobertura de 07-exercise-types.md

- 9 tipos de ejercicio definidos — **cobertura teórica completa**
- `Exercise` interface con `subject`, `unit`, `skillId`, `type`, `difficulty`
- **GAP CRÍTICO**: No existe catálogo de ejercicios extraídos del material. El spec dice "ejercicios originales, aunque inspirados en habilidades del material" pero no define la estrategia de transmutación.

### 2.4 Lo que el material提供 que los specs NO cubren

| Recurso del material | Uso potencial | Gap en specs |
|---|---|---|
| Resoluciones detalladas | Extraer procedimientos esperados, errores frecuentes | No hay spec de "procedimiento esperado" ni de "error taxonomía" |
| Diagnóstico Semana 0 | Instrumento de evaluación inicial | 08 menciona `start_diagnostic` pero no define el instrumento |
| Resultados reales (U1, diagnóstico) | Calibrar dificultad real de ejercicios | 07 define `difficulty: 1-5` pero sin calibración empírica |
| Cronograma | Secuencia temporal real de cursada | No se usa para planificar la curva de aprendizaje |
| 2 exámenes completos | Validar cobertura del mapa de examen | Solo 2 variantes → cobertura parcial |

---

## 3. Estrategia de extracción pedagógica

### 3.1 Principio de valor pedagógico (variar salvo repetición intencional)

El material canónico es fuente pedagógica válida. La estrategia recomendada es variar ejercicios/ejemplos cuando eso aporte práctica nueva, y repetirlos cuando la repetición tenga intención didáctica explícita:

```text
Material canónico (PDF/DOCX)
    ↓ Extracción de patrones
Tema + Tipo de ejercicio + Habilidad evaluada + Errores posibles
    ↓ Normalización
Registro normalizado (unidad, tema, skillId, exerciseType, difficulty, errorTags)
    ↓ Generación de ejercicios originales
Ejercicios nuevos que evalúan la MISMA habilidad con diferentes números/valores
```

### 3.2 Normalización propuesta

Cada ejercicio extraído/inspirado debe registrarse como:

```ts
interface PedagogicalPattern {
  unit: number;                    // 1-6
  topic: string;                   // "Ecuaciones fraccionarias"
  skillId: string;                 // "mat.u2.ecuaciones_fraccionarias"
  exerciseType: ExerciseType;      // "rational"
  difficulty: 1 | 2 | 3 | 4 | 5;  // Calibrado contra material real
  errorTags: string[];             // ["denominador_no_excluido", "signo_al_despejar"]
  evaluableEvidence: string;       // "Resuelve ecuación fraccionaria verificando exclusiones"
  sourceReference: string;         // "UNIDAD2_matemática.pdf, pág. X" (trazabilidad pedagógica)
  canonicalInspiration: string;    // Descripción del patrón, no el ejercicio literal
}
```

### 3.3 Errores frecuentes detectables del material

Del análisis de las resoluciones y diagnóstico:

| Unidad | Error frecuente probable | ErrorTag |
|---|---|---|
| U1 | Racionalizar con signo incorrecto | `racionalizacion_signo` |
| U1 | Logaritmo de número negativo | `log_dominio_invalido` |
| U2 | No excluir raíces que anulan denominador en fraccionarias | `fraccionaria_exclusion` |
| U2 | Ruffini con signo incorrecto al bajar | `ruffini_signo` |
| U3 | Inecuación: no invertir desigualdad al multiplicar por negativo | `inecuacion_inversion` |
| U3 | Recta: pendiente con signo invertido | `recta_signo_pendiente` |
| U5 | Reducción al primer cuadrante con signo incorrecto | `trigSigno_cuadrante` |
| U6 | Dominio: no considerar restricciones de raíz/log | `dominio_restriccion_olvidada` |
| U6 | Función por tramos: discontinuidad no marcada | `tramos_discontinuidad` |

---

## 4. Comparativa: gaps específicos entre material y specs

### Gap 1: Catálogo de ejercicios base
- **Estado actual**: Specs definen tipos y estructura, `content/` está vacío
- **Necesidad**: Mínimo ~30 ejercicios (5 por unidad) para tener un MVP funcional
- **Prioridad**: CRÍTICA — sin ejercicios no hay app

### Gap 2: Diagnóstico inicial
- **Estado actual**: Material tiene test Semana 0, spec 08 menciona `start_diagnostic`
- **Necesidad**: Definir qué evalúa el diagnóstico, cómo se puntua, qué revela
- **PriorIDAD**: ALTA — primer contacto del alumno con la app

### Gap 3: Taxonomía de errores
- **Estado actual**: `commonErrorTags` existe en Exercise pero no hay catálogo
- **Necesidad**: Tags normalizados por unidad/skill con descripción legible
- **Prioridad**: MEDIA — puede derivarse del material en paralelo

### Gap 4: Calibración de dificultad
- **Estado actual**: `difficulty: 1-5` sin referencia empírica
- **Necesidad**: Usar resultados reales (diagnóstico, guía U1) para calibrar
- **Prioridad**: MEDIA — puede mejorarse iterativamente

---

## 5. Candidatos a primera feature de dominio

### Opción A: SkillMap + ExerciseCatalog (recomendada)

**Qué es**: Modelos de dominio `Skill` y `Exercise` con sus evaluadores, más un catálogo inicial de ~30 ejercicios derivados del material.

**Por qué es la mejor**:
1. Es la **base** que todo lo demás necesita (evaluator, metrics, recommendations)
2. Es pura lógica de dominio — TDD-able inmediatamente
3. Los specs 05, 06, 07 ya definen los contratos
4. El scaffold ya existe (Next.js + Vitest)
5. Habilita el primer loop de usuario: elegir skill → hacer ejercicio → evaluar respuesta

**Esfuerzo**: Medio
**_DEPENDENCIAS**: Ninguna — el domain barrel está listo para recibir modelos

### Opción B: Diagnóstico inicial

**Qué es**: Instrumento que evalúa nivel del alumno al entrar y genera recomendación.

**Pros**: Primer contacto del alumno, alto valor pedagógico
**Contras**: NECESITA que existan ejercicios y skills primero (depende de Opción A)
**Esfuerzo**: Medio-Alto

### Opción C: Evaluador de ejercicios

**Qué es**: Motor que compara respuesta del alumno con respuesta correcta.

**Pros**: Componente crítico del loop
**Contras**: NECESITA el modelo Exercise definido primero (depende parcialmente de Opción A)
**Esfuerzo**: Bajo-Medio

### Opción D: Mapa de errores frecuentes

**Qué es**: Catálogo normalizado de errores por skill.

**Pros**: Diferenciador pedagógico, alimenta recomendaciones
**Contras**: Puede hacerse como parte de Opción A sin ser feature independiente
**Esfuerzo**: Bajo

---

## 6. Recomendación

### Primera feature: `math-domain-foundations`

Combinar en una sola change:
1. **Modelos de dominio**: `Skill`, `Exercise`, `SkillMetric` (tipos de 05, 06, 07)
2. **Catálogo inicial**: ~30 ejercicios (5 por unidad) extraídos/transmutados del material
3. **Evaluador básico**: Comparación de respuesta del alumno vs correcta
4. **Taxonomía de errores**: Tags comunes por unidad con descripción

**Razón**: Estos 4 componentes son inseparables para un MVP mínimo viable. Un evaluador sin ejercicios no sirve. Ejercicios sin modelo de skill no se pueden agrupar. Skills sin métricas no se pueden recomendar.

### Orden de implementación sugerido

```text
1. Modelos de dominio (Skill, Exercise) — types + validación
2. Catálogo de ejercicios (content/matematica/) — 30 ejercicios base
3. Evaluador (answer comparison) — TDD
4. Taxonomía de errores (errorTags) — derivada del material
```

---

## 7. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| PDFs no son legibles por el agente | No se puede extraer contenido automáticamente | Usar OCR manual o pedir al usuario que extraiga texto clave |
| Ejercicios insuficientes para MVP | App sin contenido útil | Empezar con 5 por unidad (30 total), iterar |
| Dificultad mal calibrada | Experiencia frustrante o trivial | Usar resultados reales del diagnóstico como baseline |
| Error taxonomy incompleta | Feedback genérico en vez de específico | Iterar: empezar con 2-3 errores por unidad, expandir |

---

## 8. Ready for Proposal

**Sí** — La exploración es suficiente para lanzar `sdd-propose`.

El orquestrador debe:
1. Confirmar que `math-domain-foundations` es la primera feature
2. Definir alcance exacto (modelos + catálogo + evaluador + errores)
3. Lanzar `sdd-propose` con esta exploración como contexto
