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

### Autonomía de la app vs autonomía del alumno

Precisión importante del usuario, capturada el 2026-06-14
durante el sprint closeout (B3):

- **La app del alumno es técnicamente autosuficiente** para
  hacer el recorrido completo (diagnóstico, práctica,
  feedback, progreso) sin depender de que nadie más la
  supervise en el momento.
- **El alumno NO está solo** desde un punto de vista
  institucional. El **panel docente futuro** (producto
  complementario, SDD propia, fuera del scope de esta app)
  es donde Pablo — u otro profesor del Instituto — va a
  poder ver si el alumno está realizando los ejercicios y
  cómo le va con su resolución. Cuando ese panel exista,
  vivirá en su propio repo/rama/SDD; no es parte de la app
  del alumno.

Consecuencia para la voz: la app del alumno **no debe
sugerir ni negar la presencia del profesor**. El alumno
puede estar haciendo el recorrido a las 3am solo, o puede
estar haciéndolo después de clase con la expectativa de
que Pablo lo mire. La app no lo sabe y no debe asumir
ninguno de los dos casos. El copy debe ser **neutro al
contexto de uso**.

### Reglas de voz

- **Ingenium es la marca del Instituto de Bárbara Tomba**
  (https://ingenium-web.vercel.app/). No es un "profe digital",
  no es un personaje, no es un LLM conversacional.
- **Single brand touchpoint on the home (B3 closeout latest
  revision).** The brand appears **once** in the layout, in
  the top-left brand mark of the `Nav` component, in the
  all-caps wordmark form (`INGENIUM`). The hero panel of
  the home page does NOT carry a brand heading of its own:
  it goes straight from the welcome subtitle to the
  primary CTA, so the brand is not repeated and the first
  paragraph of context the student reads is the imperative
  that points them at the next step.
  - Decision rationale: the previous "two-touchpoint
    pattern" (mixed-case logo in header + all-caps wordmark
    in hero) was reviewed and rejected. The all-caps
    wordmark in the header is the single reading the home
    needs; duplicating the brand in two places on the same
    screen was a leftover from when the home was being
    designed as a brand-fronted landing page.
  - If a future screen needs a different brand reading
    (e.g. a marketing landing page), that decision lives in
    that screen's own design and its own SDD, not in this
    one.
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
  - "Empezá por el diagnóstico inicial o seguí donde dejaste" —
    acción concreta para el alumno que aún no arrancó.
  - "Seguí donde dejaste o repasá algún tema que ya viste" —
    acción concreta para el alumno que ya empezó, nombrando
    las dos únicas cosas reales que puede hacer (continuar el
    paso previo o repasar algo ya visto).
  - "El alumno va encaminado" / "Hay N habilidades que necesitan
    atención" — observado del estado, no promesa.
  - **No re-estamos la marca en el hero.** La marca del
    Instituto ya está en el brand mark del header (top-left).
    Una frase descriptiva del tipo "Material de apoyo del
    Instituto [marca]" en el subtítulo del hero es
    redundante y roba espacio al primer párrafo de
    contexto que el alumno sí necesita leer. El subtítulo
    del hero es imperativo, no descriptivo.

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
