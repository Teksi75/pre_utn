# AGENTS.md — Estándares de trabajo para Pre UTN

Este repositorio construye una app de preparación para el ingreso a Ingeniería UTN Mendoza. La primera fase implementa Matemática; Física queda para una segunda etapa.

## Reglas obligatorias

- Trabajar con SDD: ninguna feature se implementa sin spec previa.
- Trabajar con TDD en dominio, evaluadores, métricas y recomendaciones.
- Usar `pnpm`; no usar `npm` ni `yarn`.
- Mantener TypeScript estricto y evitar `any` injustificado.
- Mantener `src/domain/` libre de React, Next.js, Supabase y efectos secundarios.
- Usar el material canónico como referencia pedagógica válida. Preferir ejercicios/ejemplos variados para aportar valor; repetir uno canónico solo cuando la repetición tenga intención didáctica explícita.
- Registrar decisiones, supuestos y deuda técnica relevante en ENGRAM.
- GGA corre automáticamente en pre-commit vía `.gga` + `AGENTS.md`. La instalación es por máquina: ver `docs/qa/gga-setup.md`. Para saltarse el gate en emergencias: `git commit --no-verify` (dejar comentario en el PR).

## Verificación esperada

Cuando el scaffold de la app exista, toda tarea debe verificar:

```bash
pnpm run test
pnpm run typecheck
pnpm run build
```

Hasta que el scaffold exista, declarar explícitamente qué verificaciones todavía no están disponibles.

## Criterio pedagógico

Toda feature debe responder al menos una de estas preguntas:

- ¿Ayuda al alumno a aprender, practicar, corregirse o madurar?
- ¿Ayuda al docente a interpretar, intervenir o planificar?

Si la respuesta a ambas es “no”, la feature no entra en el MVP.

## Marca y voz (Ingenium — Instituto Bárbara Tomba)

Decisión de marca del usuario (Pablo, profesor del Instituto),
surgida durante el sprint de rediseño 2026-06-13/14. **Cualquier
copy, microcopy o claim sobre la app debe respetarla.**

### Contexto de la app dentro de la oferta del Instituto

La app tiene **dos misiones**:

1. **Misión pedagógica (principal):** la enseñanza real ocurre en
   clase presencial con Pablo como profesor. La app es
   **material de apoyo** para que el alumno practique, refuerce y
   mida su progreso entre clases. La diferenciación pedagógica
   viene del Instituto, no de la app.
2. **Misión comercial (secundaria):** la app funciona como plus
   digital del Instituto frente a la competencia. Refuerza el
   valor de marca y la propuesta pedagógica del Instituto.

Consecuencia directa: la app **no es un instrumento de enseñanza
autónomo**. No necesita (ni debe pretender) simular un profesor
detrás. Cualquier claim que lo sugiera está mintiendo sobre la
naturaleza del producto y degrada la propuesta del Instituto
("¿para qué pagás clase si la app ya te enseña?").

### Reglas de voz

- **Ingenium es la marca del Instituto de Bárbara Tomba**
  (https://ingenium-web.vercel.app/). No es un "profe digital",
  no es un personaje, no es un LLM conversacional.
- **Voz aceptable:** la app es **material de apoyo** del alumno
  que ya está tomando clase con Pablo. La app puede orientar
  ("empezá por el diagnóstico", "seguí practicando", "elegí
  por dónde arrancar") sin atribuirse la voz del profesor.
- **Voz prohibida:** "Soy tu profe…", "te marco qué practicar",
  "primero miro tu punto de partida", "vamos a armar un plan a
  tu medida" (cuando no hay tal loop), o cualquier variante que
  personifique la app como tutor. También: claims de
  personalización ("plan personalizado para vos") que la app
  cumple de forma limitada (basado en errores taggeados) y que
  confunden al alumno sobre qué es la app y qué es la clase.
- **Lo que la app SÍ puede prometer honestamente:**
  - "Material de apoyo del Instituto Ingenium" — describe qué es.
  - "Empezá por el diagnóstico inicial" — acción concreta.
  - "Seguí donde dejaste" — orientación básica.
  - "El alumno va encaminado" / "Hay N habilidades que necesitan
    atención" — observado del estado, no promesa.

### Anti-patrones visuales asociados

- Avatares de "profe", emojis de birrete/capirotada, copy en
  segunda persona con pretensión de tutoría, CTAs que prometen
  "diagnóstico personalizado con IA".

### Tests de caracterización obsoletos

Cualquier test que claven copy de "profe digital" (ej:
`TeacherDigitalHero.test.ts` que exigía `hero.title === "Tu
profesor digital"`, o `copy-strings-acceptance.test.ts` con
`REQUIRED_DOMAIN_STRINGS = ["Tu profesor digital"]`) son
obsoletos desde la decisión de marca B3. Al refactorizar el
hero / el view-model / el copy, hay que actualizar tanto el
dominio como el test, y documentar el cambio en el commit
message (no es un cambio de copy "estético" — es una decisión
de producto sobre lo que la app ES y lo que NO ES).

### Criterio de decisión rápido

Si el alumno leyera el copy en voz alta y se sintiera engañado
porque la app no cumple lo que dice, el copy está mal. La promesa
implícita debe ser cumplible por la lógica real del producto,
que a su vez complementa (no reemplaza) la clase presencial.

## Diseño de ejercicios

No usar respuesta libre para expresiones matemáticas estructuradas. Es frágil para corregir, introduce ambigüedad sintáctica y castiga al alumno por formato en vez de evaluar comprensión matemática.

Está prohibido pedir al alumno que escriba en texto plano:

- raíces;
- fracciones con raíces;
- intervalos;
- conjuntos solución con unión o intersección;
- números complejos en forma `a+bi`;
- dos soluciones del tipo `x=-2` o `x=2`;
- expresiones logarítmicas completas.

Usar en su lugar, según corresponda:

- opciones múltiples renderizadas;
- input numérico simple;
- dos inputs numéricos separados;
- selector de intervalo;
- selector de parte real/parte imaginaria;
- chips matemáticos;
- ordenar pasos;
- detectar errores.

## Gestión de ramas SDD (multi-PC)

Este proyecto se desarrolla desde **múltiples máquinas**. Engram no es portable entre PCs, por lo que el estado de los cambios SDD debe vivir **en el repositorio**.

### Fuente de verdad: `openspec/changes/STATUS.json`

Este archivo es el **registro portable** del estado de todos los cambios SDD. Debe actualizarse cuando:

1. Un cambio se crea → agregar entrada con `status: "in-progress"` y `branch`
2. Un cambio se mergea → actualizar a `status: "done"`, `mergedTo: "main"`, `branch: null`
3. Un cambio se abandona → actualizar a `status: "abandoned"` con motivo

### Auditoría de ramas zombie

```bash
pnpm run audit:branches        # Solo reporte
pnpm run audit:branches --fix  # Reporte + eliminación interactiva
```

El script `scripts/audit-branches.sh` detecta:
- **Zombies**: ramas que existen pero no están en STATUS.json
- **Stale**: entradas en STATUS.json cuya rama ya no existe
- **Drift**: ramas con >20 commits de divergencia vs main

### Política de limpieza

Al completar un change SDD:

1. Merge a main (con `--no-ff` para preservar contexto)
2. Actualizar `STATUS.json`: `status: "done"`, `branch: null`
3. Eliminar la rama feature local y remota
4. Commit del STATUS.json actualizado

**Regla**: nunca dejar ramas feature sin registrar en STATUS.json. Si una rama existe, debe tener entrada correspondiente o ser eliminada.
