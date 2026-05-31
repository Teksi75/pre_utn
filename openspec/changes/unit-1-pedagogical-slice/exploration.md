# Exploration: unit-1-pedagogical-slice

> **Status:** Complete
> **Date:** 2026-05-31
> **Depends on:** pedagogical-model-audit, canonical-math-pedagogy-map, existing specs

---

## 1. Executive Summary

Unit 1 (Conjuntos numéricos y herramientas algebraicas básicas) es la base operativa para toda la app. El usuario quiere un slice vertical completo: teoría → ejemplo trabajado → práctica guiada → feedback → recuperación → repaso. Actualmente existen 5 ejercicios para 7 skills, sin teoría, sin ejemplos trabajados, sin feedback pedagógico, y sin persistencia. El slice debe ser escalable para que Unit 2+ reutilice el mismo patrón.

---

## 2. Current State — What Exists for Unit 1

### 2.1 Skills Definidas (7)

| Skill ID | Nombre | Prerrequisitos |
|----------|--------|----------------|
| `mat.u1.reales_operaciones` | Operaciones con reales | Ninguno |
| `mat.u1.potencias_raices` | Potencias y raíces | reales_operaciones |
| `mat.u1.racionalizacion` | Racionalización | potencias_raices |
| `mat.u1.intervalos` | Intervalos | Ninguno |
| `mat.u1.valor_absoluto` | Valor absoluto | Ninguno |
| `mat.u1.logaritmos` | Logaritmos | potencias_raices |
| `mat.u1.complejos` | Números complejos | reales_operaciones |

### 2.2 Ejercicios Existentes (5 de 7 skills)

| Ejercicio | Tipo | Dificultad | Error Tags |
|-----------|------|------------|------------|
| ex.u1.reales_operaciones.1 | numerical | 1 | u1_orden_operaciones |
| ex.u1.potencias_raices.1 | numerical | 2 | (ninguno) |
| ex.u1.racionalizacion.1 | symbolic | 3 | u1_signo_racionalizacion |
| ex.u1.intervalos.1 | multiple-choice | 2 | (ninguno) |
| ex.u1.valor_absoluto.1 | numerical | 2 | (ninguno) |

**Faltan ejercicios para**: logaritmos, complejos

### 2.3 Lo Que NO Existe

| Componente | Estado | Prioridad |
|------------|--------|-----------|
| Teoría / nodos de contenido | No existe | CRÍTICA |
| Ejemplos trabajados | No existe | ALTA |
| Práctica guiada (secuenciada) | No existe | ALTA |
| Feedback pedagógico (5 tipos) | No existe | ALTA |
| Recuperación / repaso espaciado | No existe | MEDIA |
| Persistencia de intentos | No existe | ALTA |
| Métricas por skill | No existe | MEDIA |
| Fuerza de error tagging | Solo 1 patrón (signo) | MEDIA |

---

## 3. Affected Areas

### 3.1 Domain Layer (Pure — No Framework Imports)

- `src/domain/models/skill.ts` — Necesita extensión para TheoryNode y WorkedExample
- `src/domain/models/exercise.ts` — Necesita soporte para ExerciseType del spec 07 (AnswerPayload)
- `src/domain/evaluator/` — Necesita evaluadores para tipos faltantes (interval, complex, rational)
- `src/domain/evaluator/error-tagging.ts` — Necesita más patrones de error
- `src/domain/catalog/index.ts` — Necesita expansión de catálogo
- `src/domain/diagnostic/` — Necesita persistencia y métricas

### 3.2 Content Layer

- `content/matematica/exercises.json` — Necesita expandirse a 15+ ejercicios para Unit 1
- Nuevo: `content/matematica/theory/` — Nodos de teoría por skill
- Nuevo: `content/matematica/examples/` — Ejemplos trabajados por skill

### 3.3 UI Layer

- `src/app/practice/page.tsx` — Necesita flujo secuenciado
- Nuevo: `src/components/theory/` — Componentes de teoría
- Nuevo: `src/components/examples/` — Componentes de ejemplos trabajados
- Nuevo: `src/components/feedback/` — Feedback pedagógico enriquecido

---

## 4. Scalable Pedagogical Model

### 4.1 Theory Node Model

```typescript
interface TheoryNode {
  readonly id: string; // "theory.u1.reales_operaciones"
  readonly skillId: SkillId;
  readonly unit: Unit;
  readonly title: string;
  readonly level: 'minimal' | 'normal' | 'extended' | 'remedial' | 'reference';
  readonly content: TheoryContent;
  readonly prerequisites: readonly string[]; // Theory node IDs
}

interface TheoryContent {
  readonly summary: string;
  readonly keyConcepts: readonly Concept[];
  readonly workedExamples: readonly WorkedExample[];
  readonly practicePrompts: readonly string[];
  readonly commonMistakes: readonly string[];
}

interface Concept {
  readonly name: string;
  readonly definition: string;
  readonly visual?: string; // LaTeX or description
  readonly tip?: string;
}
```

### 4.2 Worked Example Model

```typescript
interface WorkedExample {
  readonly id: string;
  readonly skillId: SkillId;
  readonly problem: string;
  readonly solution: SolutionStep[];
  readonly finalAnswer: string;
  readonly pedagogicalNote: string;
}

interface SolutionStep {
  readonly step: number;
  readonly description: string;
  readonly operation?: string;
  readonly result?: string;
  readonly commonError?: string;
}
```

### 4.3 Pedagogical Flow (Per Skill)

```text
teoría → ejemplo trabajado → práctica guiada → feedback → recuperación → repaso
   ↓           ↓                  ↓              ↓           ↓            ↓
TheoryNode  WorkedExample    Exercise[]    FeedbackMsg  ReviewSet   SpacedReview
```

### 4.4 Feedback Model (5 Types from Spec 04)

```typescript
interface PedagogicalFeedback {
  readonly type: 'corrective' | 'conceptual' | 'procedural' | 'metacognitive' | 'motivational';
  readonly message: string;
  readonly errorTag?: string;
  readonly hint?: string;
  readonly nextAction?: string;
}
```

### 4.5 Scalability Pattern

Unit 2+ reutiliza el mismo patrón:
1. Definir skills en `skill-catalog.ts`
2. Crear theory nodes en `content/matematica/theory/`
3. Crear worked examples en `content/matematica/examples/`
4. Agregar ejercicios a `exercises.json`
5. El motor de pedagogía es agnóstico a la unidad

---

## 5. Recommended Unit 1 Scope

### 5.1 MVP Slice (First Implementation)

**Teoría**: 2 skills completas (reales_operaciones, intervalos) como piloto
**Ejemplos trabajados**: 2 por skill piloto (4 total)
**Ejercicios**: Expandir a 12 (2 por skill, cubrir logaritmos y complejos)
**Feedback**: 3 tipos (correctivo, conceptual, procedimental)
**Persistencia**: localStorage para intentos y métricas
**Error tagging**: Agregar 3-4 patrones más para Unit 1

### 5.2 What "Unit 1 is Ready" Means

- [ ] Alumno puede ver teoría de cada skill de Unit 1
- [ ] Alumno puede ver ejemplo resuelto paso a paso
- [ ] Alumno puede practicar y recibir feedback pedagógico
- [ ] Sistema registra intentos y calcula métricas por skill
- [ ] Sistema recomienda recuperación para skills débiles
- [ ] Docente puede ver progreso y errores frecuentes de Unit 1
- [ ] Todos los tipos de ejercicio de Unit 1 tienen evaluador

---

## 6. SDD Plan by Stages

### Stage 1: Theory & Content Foundation (≤400 lines)
**Change**: `unit-1-theory-content`
- Theory node model + validation
- 2 theory nodes (pilot skills)
- 4 worked examples
- Tests for theory model
- **Effort**: Medium

### Stage 2: Exercise Expansion (≤400 lines)
**Change**: `unit-1-exercise-expansion`
- Add missing exercises (logaritmos, complejos)
- Expand to 12 exercises total
- Add interval and complex evaluators
- Tests for new evaluators
- **Effort**: Low-Medium

### Stage 3: Pedagogical Feedback (≤400 lines)
**Change**: `unit-1-feedback-engine`
- Feedback generator (5 types)
- Error pattern expansion (3-4 new patterns)
- UI component for feedback display
- Tests for feedback generation
- **Effort**: Medium

### Stage 4: Persistence & Metrics (≤400 lines)
**Change**: `unit-1-persistence-metrics`
- localStorage persistence layer
- SkillMetric computation
- UnitMetric computation
- Basic recommendation rules
- Tests for persistence and metrics
- **Effort**: Medium-High

### Stage 5: Guided Practice Flow (≤400 lines)
**Change**: `unit-1-guided-practice`
- Sequential practice flow (theory → example → practice)
- Prerequisite enforcement
- Progress tracking
- UI for guided flow
- **Effort**: Medium

---

## 7. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Exercise type divergence blocks evaluator work | High | Resolve in Stage 2: add interval/complex types |
| Theory content too large for single change | Medium | Split by skill, 2 skills per change |
| localStorage limits scalability | Low | Design for future Supabase migration |
| Feedback quality depends on error tagging | Medium | Invest in error patterns first |
| Unit 1 scope creep | High | Strict MVP: 2 pilot skills, then expand |

---

## 8. Out of Scope (Avoid Scope Explosion)

- **Física**: Explicitly out of scope per AGENTS.md
- **Simulacro de examen**: Unit 2+ feature
- **Teacher dashboard**: Separate change
- **Smart review / spaced repetition**: Unit 2+ feature
- **Photo exercises**: Requires Supabase Storage
- **Full recommendation engine**: Start with basic rules only
- **Real-time collaboration**: Not MVP
- **Mobile app**: Web only for now

---

## 9. Ready for Proposal

**Yes** — The exploration is sufficient to launch `sdd-propose`.

The orchestrator should:
1. Confirm Stage 1 (Theory & Content Foundation) as the first change
2. Define exact scope: which 2 pilot skills, how many theory nodes
3. Launch `sdd-propose` with this exploration as context

---

## SDD Result Envelope

**Status**: success
**Summary**: Unit 1 pedagogical slice requires 5 stages: theory content, exercise expansion, feedback engine, persistence/metrics, and guided practice. Current state has 5 exercises for 7 skills, no theory, no feedback, no persistence. Recommended approach: start with 2 pilot skills (reales_operaciones, intervalos) as vertical slice.
**Artifacts**: Engram `sdd/unit-1-pedagogical-slice/explore` | `openspec/changes/unit-1-pedagogical-slice/exploration.md`
**Next**: sdd-propose (define scope for Stage 1)
**Risks**: Exercise type divergence, theory content size, localStorage limits
**Skill Resolution**: paths-injected — 2 skills (cognitive-doc-design, _shared)
