# Tasks — unit-2-pilot-activation

**Status**: All tasks complete. Single work unit (no chaining required).

## Phase 1: Catalog Registration

- [x] **T1.1** — Add 7 U2 entries to `PILOT_SKILLS` with correct `unitKey: "unit-2"` and labels
- [x] **T1.2** — `PILOT_SKILL_UNIT_MAP` auto-generated from `Object.fromEntries`
- [x] **T1.3** — Update `pilot-skills.test.ts`: 15 total, 8 U1, 7 U2, ordering assertion, unit-key map test

## Phase 2: Next-Step Domain Fix

- [x] **T2.1** — Add `parseSkillUnit` helper extracting unit number from `mat.u{N}.` pattern
- [x] **T2.2** — Dynamic unit number in `firstUnattemptedReadySkill` description
- [x] **T2.3** — Multi-unit fallback: detect distinct units via `Set`, produce generic "Seguir repasando" title when >1
- [x] **T2.4** — `computeMasteryLevel` signature relaxed to `Pick<PracticeProgress, ...>` at call site and definition
- [x] **T2.5** — Add `next-step.test.ts` tests: mixed U1+U2 fallback, single-unit preserves old title, U2 skill descriptions

## Phase 3: UI Connection

- [x] **T3.1** — `SkillRoadmap` aria-label: "Unidad 1" → "Camino de aprendizaje"
- [x] **T3.2** — `page.tsx` (home): pilot badge "Unidad 1 parcial" → "Unidades 1 y 2"
- [x] **T3.3** — `learn/matematica/page.tsx`: render U1 and U2 theory sections with headings
- [x] **T3.4** — `learn/page.tsx`: update description to reference both units
- [x] **T3.5** — Test fixture updates: `start-skill.test.ts`, `practice-link.test.ts`, `accessibility.test.ts`

## Verification

- [x] **V1** — `pnpm run typecheck` clean
- [x] **V2** — All existing tests pass (no regressions)
- [x] **V3** — New mixed-unit fallback tests pass
- [x] **V4** — Build compiles without errors
- [x] **V5 (GGA)** — Fixed 5 GGA blockers: chronological dedup in progress domain, timing filter in mastery, `transition-all` → explicit transitions + focus-visible in learn pages
