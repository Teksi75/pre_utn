# Apply Progress — unit-2-pilot-activation

**Date**: 2026-06-11
**Mode**: Standard (Strict TDD not active — tests added post-implementation)

## Completed Tasks

All 13 tasks across 3 phases complete:

| Task | Description | Status |
|------|-------------|--------|
| T1.1 | Add 7 U2 entries to PILOT_SKILLS | ✅ |
| T1.2 | PILOT_SKILL_UNIT_MAP auto-generated | ✅ |
| T1.3 | pilot-skills.test.ts updated | ✅ |
| T2.1 | parseSkillUnit helper | ✅ |
| T2.2 | Dynamic unit number in description | ✅ |
| T2.3 | Multi-unit fallback with Set detection | ✅ |
| T2.4 | computeMasteryLevel signature relaxed | ✅ |
| T2.5 | Mixed U1+U2 fallback tests | ✅ |
| T3.1 | SkillRoadmap aria-label generic | ✅ |
| T3.2 | Home pilot badge updated | ✅ |
| T3.3 | Learn page multi-unit layout | ✅ |
| T3.4 | Learn landing description | ✅ |
| T3.5 | Test fixtures updated (non-pilot skill) | ✅ |
| V1 | Typecheck clean | ✅ |
| V2 | All tests pass | ✅ |
| V3 | New fallback tests pass | ✅ |
| V4 | Build compiles | ✅ |

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `src/domain/catalog/pilot-skills.ts` | Modified | +7 U2 entries with labels and unitKey |
| `src/domain/next-step/index.ts` | Modified | Multi-unit fallback + parseSkillUnit + dynamic descriptions |
| `src/domain/progress/index.ts` | Modified | computeMasteryLevel Pick signature |
| `src/components/home/SkillRoadmap.tsx` | Modified | Generic aria-label |
| `src/app/learn/matematica/page.tsx` | Modified | Multi-unit theory sections |
| `src/app/learn/page.tsx` | Modified | Description references both units |
| `src/app/page.tsx` | Modified | Pilot badge "Unidades 1 y 2" |
| `src/domain/__tests__/next-step.test.ts` | Modified | U2 tests + mixed-unit fallback tests |
| `src/domain/__tests__/pilot-skills.test.ts` | Modified | U2 catalog assertions |
| `src/domain/__tests__/accessibility.test.ts` | Modified | U2 accuracy entries |
| `src/app/practice/__tests__/start-skill.test.ts` | Modified | Non-pilot skill fixture → mat.u3 |
| `src/components/diagnostic/__tests__/practice-link.test.ts` | Modified | Non-pilot href fixture → mat.u3 |

## Deviations from Design

None — implementation matches the scope defined in proposal.

## Issues Found

None.
