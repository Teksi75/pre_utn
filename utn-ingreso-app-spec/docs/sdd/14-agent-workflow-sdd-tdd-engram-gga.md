# 14 — Workflow para agentes: SDD, TDD, ENGRAM y GGA

> **Status:** Aprobado  
> **Depende de:** 00-conventions.md · 13-adr-foundation.md

---

## 1. Objetivo

Este documento define cómo deben trabajar Codex, OpenCode, Gentle-AI o cualquier agente sobre este proyecto.

---

## 2. Protocolo de trabajo por feature

```text
1. Leer 00-conventions.md
2. Leer spec de la feature
3. Leer archivos de dependencia
4. Escribir plan breve
5. Escribir tests primero
6. Implementar mínimo viable
7. Ejecutar pnpm run test
8. Ejecutar pnpm run typecheck
9. Ejecutar pnpm run build
10. Pasar checklist GGA
11. Registrar nota ENGRAM
```

---

## 3. Plantilla de tarea para agente

```md
# Agent Task

## Feature
<nombre>

## Specs obligatorias
- docs/...

## Restricciones
- usar pnpm
- no usar npm
- no tocar contenido oficial
- domain sin framework

## Objetivo
<qué construir>

## Tests requeridos
<lista>

## Criterios de aceptación
<lista>

## Comandos de verificación
pnpm run test
pnpm run typecheck
pnpm run build
```

---

## 4. Plantilla de nota ENGRAM

```md
# ENGRAM NOTE

Feature:
Spec:
Branch:
Files changed:
Tests added:
Commands run:
Decisions:
Debt created:
Next step:
```

---

## 5. Checklist GGA

Antes de cerrar:

- [ ] No se usó npm.
- [ ] No hay `package-lock.json`.
- [ ] No hay secretos.
- [ ] No hay `any` injustificado.
- [ ] No hay imports de framework en domain.
- [ ] Tests pasan.
- [ ] Build pasa.
- [ ] La feature respeta alumno + docente.
- [ ] La feature usa material oficial con trazabilidad e intención pedagógica; las repeticiones literales están justificadas.
- [ ] La deuda técnica queda registrada.

---

## 6. Criterios de aceptación

- [ ] Todo agente puede ejecutar una tarea leyendo este documento.
- [ ] El flujo fuerza specs antes que código.
- [ ] El flujo fuerza tests antes que implementación.
- [ ] El flujo deja memoria utilizable para futuros agentes.
