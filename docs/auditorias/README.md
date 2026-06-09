# Auditorías de Pre UTN

Esta carpeta agrupa las auditorías read-only del proyecto, una por unidad pedagógica.

Convenciones:

- Cada auditoría vive en una subcarpeta (`unidad-1/`, `unidad-2/`, etc.).
- Cada auditoría produce 5 entregables:
  1. `AUDITORIA_UNIDAD_N.md` — informe principal.
  2. `LECCIONES_APRENDIDAS_UNIDAD_N.md` — lecciones transversales.
  3. `BACKLOG_MEJORAS_UNIDAD_N+1.md` — backlog priorizado para la próxima unidad.
  4. `PLANTILLA_IMPLEMENTACION_UNIDADES.md` — checklist ejecutable (compartido, versionado por unidad si diverge).
  5. `MODELO_MEDICION_ERRORES.md` — modelo de telemetría pedagógica (compartido, versionado por unidad si diverge).
- Las auditorías son **read-only**: no modifican código ni specs. Las correcciones se hacen en cambios SDD aparte.
- Las auditorías citan `archivo:línea` para toda afirmación importante.
- Las métricas que no se pueden medir con datos del repo se declaran `no medido` y se explica por qué.

Auditorías disponibles:

- [`unidad-1/`](./unidad-1/) — primera pasada formal de la unidad piloto de Matemática.
