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
- Pasar GGA antes de cerrar tareas o commits.

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
