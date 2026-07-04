# Auditoría de Unidad 3 — Pre UTN

Carpeta de destino de la auditoría read-only de la Unidad 3 (Matemática) de Pre UTN.

Pasada en modo exploratorio: el artefacto fuente se generó dentro del cambio SDD explore-only `auditar-unidad-3-pedagogia` y luego se promovió a esta carpeta para convivir con las auditorías formales de la unidad (la pasada no abrió rama propia y no se mergeó a `main`).

Entregables:

1. [`AUDITORIA_UNIDAD_3.md`](./AUDITORIA_UNIDAD_3.md) — informe principal (tabla de habilidades evaluables, cobertura de teoría, cobertura de práctica, cobertura visual de `mate-explorer`, brechas priorizadas y recomendaciones).

Reglas de la pasada:

- No se modificó código, specs ni contenido.
- Toda afirmación importante cita `archivo:línea` cuando fue posible verificarlo contra el repositorio o el material canónico.
- La pasada se hizo con disciplina de "verificar dos veces antes de declarar", pero el repositorio de la app complementaria `mate-explorer` no era accesible durante la misma; las afirmaciones sobre `mate-explorer` quedan marcadas con `❓` en el informe y no se tradujeron en recomendaciones que dependan de ese repo.