# Proposal: Teacher Digital Home

## Intent

Current Home (`src/app/page.tsx`) reads as a hero/status/catalog/roadmap page — not a pedagogical decision tool. The "Profesor digital" dashboard replaces it with a view that surfaces what matters for teaching decisions: readiness, mastery gaps, and recommended next actions. No AI, no chat — pure deterministic domain data.

## Scope

### In Scope
- Pure domain view-model: `src/domain/home/` with `TeacherDashboard` types and `deriveTeacherDashboard()` function
- Unit tests for domain view-model (TDD: RED → GREEN → REFACTOR)
- Dumb UI components: `src/components/home/teacher-dashboard/` (cards, lists, badges)
- `HomeNextStepClient` integration: compose dashboard cards alongside existing next-step logic
- Remove `SkillRoadmap` from Home page render
- Fix broken links in existing practice/diagnostic paths
- All links point to verified existing routes (`/diagnostic`, `/practice`, `/learn/matematica`)

### Out of Scope
- Generative AI or chat features
- Backend / Supabase / API changes
- Dynamic route creation
- Global color or design system redesign
- Changes to practice or diagnostic flows (except broken-link fixes)
- Deleting `SkillRoadmap` component (keep file, remove from Home render)
- Teacher authentication or role-based routing

## Capabilities

### New Capabilities
- `teacher-digital-home`: Pedagogical decision dashboard — domain view-model, unit tests, UI cards, Home page composition

### Modified Capabilities
None — existing specs (guided-practice, diagnostic-shell, math-skill-model) are not changing requirements.

## Approach

**Approach 1 from exploration**: Replace Home content with dashboard component.

1. **Domain first (TDD)**: `src/domain/home/deriveTeacherDashboard.ts` — pure function consuming `PracticeProgress` + `PILOT_SKILLS` → emits `TeacherDashboard` (readiness %, mastery gaps, recommended next step, skill labels from catalog — never raw IDs)
2. **No-evidence default**: When `PracticeProgress` is empty, dashboard returns deterministic empty-state values (0% readiness, "Hacer diagnóstico" CTA, no mastery gaps)
3. **UI layer**: Thin presentational components consuming `TeacherDashboard` shape. No domain logic in components
4. **Integration**: `HomeNextStepClient` renders dashboard cards. Remove `SkillRoadmap` from composition
5. **Link safety**: All `href` values come from domain or verified constants — no hardcoded skill IDs in UI

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/page.tsx` | Modified | Replace hero/roadmap with dashboard composition |
| `src/domain/home/` | New | `deriveTeacherDashboard()`, `TeacherDashboard` types |
| `src/domain/home/__tests__/` | New | Unit tests for view-model |
| `src/components/home/teacher-dashboard/` | New | Presentational card components |
| `src/components/home/HomeNextStepClient.tsx` | Modified | Integrate dashboard cards, remove SkillRoadmap render |
| `src/components/home/SkillRoadmap.tsx` | Modified | Remove from Home render (file stays) |

## Assumptions

- "Profesor digital" is a metaphorical framing — no real teacher auth exists yet
- Dashboard uses same localStorage-based `PracticeProgress` as student view
- `PILOT_SKILLS` labels are the display source (never raw skill IDs like `mat.u1.conjuntos_numericos`)
- Deterministic behavior: no randomness, no async, no API calls in dashboard derivation

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Dashboard duplicates logic from `deriveHomeNextStep()` | Med | Domain functions share `PracticeProgress` input but produce distinct output shapes |
| Removing SkillRoadmap breaks visual expectations | Low | Keep component file; only remove from Home render |
| Broken links surface after refactor | Low | Verify all routes in exploration; domain returns only safe hrefs |

## Rollback Plan

1. Revert `src/app/page.tsx` to previous composition (SkillRoadmap + hero intact)
2. Delete `src/domain/home/` and `src/components/home/teacher-dashboard/`
3. Restore `SkillRoadmap` render in `HomeNextStepClient`
4. No data migration needed — all changes are UI/domain-layer

## Dependencies

- Existing `PracticeProgress` interface (`src/domain/progress/index.ts`)
- `PILOT_SKILLS` catalog (`src/domain/catalog/pilot-skills.ts`)
- `isSkillReady()` from `src/domain/catalog/readiness.ts`

## Success Criteria

- [ ] Home page shows dashboard cards, NOT hero/roadmap
- [ ] `SkillRoadmap` component exists but is NOT rendered on Home
- [ ] No raw skill IDs (e.g., `mat.u1.conjuntos_numericos`) visible in UI
- [ ] All links navigate to verified existing routes only
- [ ] Empty state (no diagnostic data) shows deterministic CTA, not errors
- [ ] Domain view-model has ≥90% unit test coverage
- [ ] `pnpm run test` passes
- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run build` passes
