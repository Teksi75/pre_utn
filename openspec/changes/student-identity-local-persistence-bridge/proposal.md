# Proposal: Student Identity Local Persistence Bridge

## Intent

Add minimal local student identity before Unit 3 so practice attempts stop being anonymous and future teacher insight can trace progress to a profile. This is **local identity + Supabase-ready persistence contract**, not Supabase persistence.

## Scope

### In Scope
- Pure `StudentProfile` domain model and functions for validation, normalization, stable ID creation, active selection, and `lastActiveAt` updates.
- localStorage adapters for profile state and per-student practice/diagnostic/study-plan progress using a Supabase-ready adapter boundary.
- One-shot migration from legacy global progress to `Alumno local`, preserving attempts.
- Home cockpit identification UI, active-student labels, and `Cambiar alumno` flow without deleting profiles.

### Out of Scope
- Supabase, Auth/RLS/API, passwords, email, account/admin language.
- Visible teacher access, `/docente` navigation, teacher panel, profile deletion.
- Unit 3 content or exercise work.

## Capabilities

### New Capabilities
- `student-local-identity`: local student profile lifecycle, active profile selection, and profile-aware local persistence.

### Modified Capabilities
- `guided-practice`: attempts must be associated with the active local student and must not be recorded anonymously.
- `diagnostic-shell`: diagnostic results and study plans must belong to the active local student.
- `teacher-digital-home`: Home must render progress and pedagogical recommendations for the active local student.

## Approach

Use domain-first TDD. Keep `src/domain/` pure. Implement central-map localStorage shape behind adapters, migrate legacy keys idempotently, then wire Home/Practice/Diagnostic to active profile. UX stays inside the study cockpit with pedagogical language: alumno, progreso, estudio, perfil local.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/student-profile/` | New | Pure profile model/functions. |
| `src/domain/progress/index.ts` | Modified | Add student association/backward compatibility helpers. |
| `src/lib/*storage*.ts` | Modified/New | Profile and per-student progress adapters + migration. |
| `src/app/`, `src/components/home/` | Modified/New | Identification card, active chip, switcher, active progress wiring. |
| `openspec/changes/STATUS.json` | Modified | Register in-progress change branch. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Legacy progress loss | Med | Idempotent migration tests before implementation. |
| Anonymous attempts continue | Med | Gate Practice/Diagnostic writes on active profile. |
| Supabase readiness overstated | Low | Document adapter contract only; no backend claims. |

## Rollback Plan

Revert this change and keep legacy `pre-utn.practice.v1`, `pre-utn.diagnostic.v1`, and `pre-utn.study-plan.v1` compatibility. Migration must preserve legacy data shape enough for manual recovery.

## Dependencies

- `docs/sdd/13-adr-foundation.md` ADR-004, ADR-007, ADR-008.
- Future verification: `pnpm run test`, `pnpm run typecheck`, `pnpm run build`.

## Success Criteria

- [ ] New student identifies in Home and can practice.
- [ ] Attempts, diagnostic, and Home progress use the active profile.
- [ ] Switching student changes visible progress without deleting data.
- [ ] Legacy progress migrates to `Alumno local` without lost attempts.
- [ ] UI avoids login/account/teacher language and remains Supabase-ready.
