# Auditoría de Unidad 2 — Pre UTN

Carpeta de destino de la auditoría read-only de la Unidad 2 (Matemática) de Pre UTN, primera pasada formal en modo "alineación con material oficial".

Fecha de la pasada: 2026-07-06.
Rama de trabajo: `align-u2-practice-official-exercises` (creada desde `main@b451745` para el cambio SDD `align-u2-practice-official-exercises`).
Cambio SDD asociado: `openspec/changes/align-u2-practice-official-exercises/` (incluye `proposal.md`, `design.md`, `exploration.md`, `specs/`, `tasks.md`).

Entregables:

1. [`alineacion-02-ej-utn.md`](./alineacion-02-ej-utn.md) — informe principal de alineación con el PDF oficial `02_ej_utn.pdf` (UTN-FRM Seminario de Ingreso 2025): tabla de cobertura por ítem, brechas por skill, decisiones de tag y `canonicalTrace`, disciplina de tipo de respuesta, plan de implementación por PR.

Reglas de la pasada:

- No se modificó código, specs ni contenido: este entregable es la **puerta de entrada** de los PRs 3-7 (contenido y tests por familia de práctica) y del PR 8 (consolidación, verificación final y archivo de specs), que sí agregan contenido, tests y actualizan la trazabilidad canónica.
- Toda afirmación importante cita `archivo:línea` cuando fue posible verificar contra el repositorio o el PDF.
- La pasada usa disciplina de "verificar dos veces antes de declarar": el conteo de ejercicios se reprodujo desde el JSON crudo, y el mapeo de ítems del PDF se contrastó con `exploration.md`.
- Las métricas (31 ejercicios actuales, distribución por skill) son **medidas** sobre `content/matematica/exercises/unit-2.json`, no estimadas.
- Esta auditoría es read-only dentro de este PR; los PRs siguientes (`tasks.md` Phase 2 y 3) son los que ejecutan los cambios propuestos.
