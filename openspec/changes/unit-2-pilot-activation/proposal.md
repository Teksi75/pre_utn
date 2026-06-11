# Proposal: Unit 2 Pilot Activation — Catalog & UI Connection

**Change**: `unit-2-pilot-activation`
**Status**: done

## Intent

Register all 7 Unit 2 skills (`polinomios_basico` through `ecuaciones_fraccionarias`) as pilot skills in the catalog, connect them to the home dashboard, guided-practice pipeline, learn page, and skill roadmap. Fix a multi-unit fallback bug in `deriveHomeNextStep` that produced a misleading "Unidad 1" title when both U1 and U2 were present.

The content, exercises, and evaluation logic already existed from the three completed `unit-2-*` slices; this change activates them for students.

## Scope

### In Scope
- Add 7 U2 entries to `PILOT_SKILLS` and `PILOT_SKILL_UNIT_MAP` in `pilot-skills.ts`
- Update `deriveHomeNextStep` to parse unit numbers dynamically and produce a generic fallback title for multi-unit pilot lists
- Update `SkillRoadmap` aria-label from "Unidad 1" to "Camino de aprendizaje"
- Update learn page (`/learn/matematica`) to render U1 and U2 theory sections
- Update learn landing page description and home pilot badge to reflect both units
- Update test fixtures: accessibility, practice start-skill, diagnostic practice-link, pilot-skills
- Relax `computeMasteryLevel` parameter from `PracticeProgress` to a minimal `Pick`
- Add regression tests for mixed U1+U2 fallback

### Out of Scope
- New exercises, content, or error tags (already created in prior U2 slices)
- Polynomial evaluator or U2 domain logic changes

## Capabilities

### Modified Capabilities
- `home-dashboard`: next-step derivation handles multi-unit pilot lists
- `skill-roadmap`: generic aria-label for multi-unit
- `guided-practice`: U2 skills accessible through start-skill resolution
- `pilot-catalog`: U2 skills registered alongside U1

## Approach

Catalog-only activation with isolated UI connection. No new domain logic. The `parseSkillUnit` regex extracts unit numbers from `mat.u{N}.` skill IDs, enabling dynamic descriptions and the multi-unit fallback detection via `Set` of distinct units.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/catalog/pilot-skills.ts` | Modified | +7 U2 entries |
| `src/domain/next-step/index.ts` | Modified | Multi-unit fallback + dynamic unit descriptions |
| `src/domain/progress/index.ts` | Modified | `computeMasteryLevel` signature relaxed |
| `src/components/home/SkillRoadmap.tsx` | Modified | Generic aria-label |
| `src/app/learn/matematica/page.tsx` | Modified | Multi-unit layout |
| `src/app/learn/page.tsx` | Modified | Description updated |
| `src/app/page.tsx` | Modified | Pilot badge updated |
| `src/domain/__tests__/next-step.test.ts` | Modified | Mixed-unit fallback tests |
| `src/domain/__tests__/pilot-skills.test.ts` | Modified | U2 catalog assertions |
| `src/domain/__tests__/accessibility.test.ts` | Modified | U2 accuracy entries |
| `src/app/practice/__tests__/start-skill.test.ts` | Modified | Non-pilot skill fixture |
| `src/components/diagnostic/__tests__/practice-link.test.ts` | Modified | Non-pilot href fixture |
