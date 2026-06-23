# Proposal: Active Session Module

## Intent

Centralize active profile access before future persistence substitution. Today, direct reads of `pre-utn.profiles.v1` are dispersed across storage modules, so call sites can keep depending on the local profile shape instead of a small session boundary. This change creates one active-session API for the current `studentId` while preserving existing local behavior.

## Scope

### In Scope
- Add an active session boundary such as `src/lib/active-session.ts` exposing `getActiveProfileId()`.
- Route active-profile-id reads through that boundary, keeping profile storage as the only owner of `pre-utn.profiles.v1` parsing.
- Add/update tests proving behavior is unchanged and direct `localStorage.getItem("pre-utn.profiles.v1")` reads are contained.

### Out of Scope
- Supabase adapter, Auth, remote sync, RLS, or API routes.
- `trackId`/`subjectId` migration, multi-track, teacher dashboard, or `/docente`.
- I-19/I-20 skill-id work or broader persistence refactors.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `student-local-identity`: active profile ID lookup must go through a single active-session boundary instead of dispersed direct `pre-utn.profiles.v1` reads.

## Approach

- Create a tiny adapter boundary that delegates to the existing local profile storage behavior.
- Replace duplicate profile-key reads in progress/diagnostic storage with `getActiveProfileId()` where only the active ID is needed.
- Keep `loadProfiles()` / `recoverActiveProfile()` available for full-profile workflows.
- Reference ADR-008 (SDD + TDD) and ADR-004 (Supabase as future database): this is a preparation boundary, not the Supabase implementation.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/active-session.ts` | New | Single active profile ID API. |
| `src/lib/student-profile-storage.ts` | Modified | Remains profile-key owner and local adapter. |
| `src/lib/practice-progress.ts` | Modified | Stop direct active-profile key reads. |
| `src/lib/diagnostic-storage.ts` | Modified | Stop direct active-profile key reads. |
| `openspec/specs/student-local-identity/spec.md` | Modified | Tighten adapter-boundary requirement. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Accidentally changing no-profile blocking semantics | Med | Characterization tests before rewiring. |
| Over-expanding into Supabase design | Low | Keep API local and minimal. |

## Rollback Plan

Revert the change branch: remove `src/lib/active-session.ts`, restore previous imports/direct reads, and revert the student-local-identity delta. Persisted storage keys and shapes remain unchanged.

## Dependencies

- Existing `student-local-identity` profile storage behavior.
- `docs/sdd/13-adr-foundation.md` ADR-004 and ADR-008.

## Success Criteria

- [ ] No direct `localStorage.getItem("pre-utn.profiles.v1")` exists outside the active session/profile storage boundary.
- [ ] Existing behavior for active profile, missing profile, and corrupt storage is preserved.
- [ ] Strict TDD applies where storage/session behavior changes; `pnpm run test`, typecheck, and build remain green.
