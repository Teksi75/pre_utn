# Design: Student Identity Local Persistence Bridge

## Technical Approach

Add local student identity as a pure domain model plus browser adapters. `src/domain/` keeps only types and pure functions; `src/lib/*storage*.ts` owns `localStorage`, migration, and blocked-write results. Existing call sites continue to use stable adapter names where possible, but all identity-bearing reads/writes flow through adapters so future Supabase/Auth/RLS work replaces implementations, not domain contracts.

## Architecture Decisions

| Topic | Choice | Alternatives considered | Rationale |
|------|--------|-------------------------|-----------|
| Domain boundary | Create `src/domain/student-profile/index.ts`; add `studentId?: string` to `PracticeAttempt` during migration. | Required `studentId` immediately. | Optional protects legacy tests and persisted attempts; adapters must add `studentId` for every new attempt, so new anonymous records remain blocked. |
| Storage shape | Central maps under existing keys: `{ students: Record<string,T>, activeStudentId: string|null }`; profiles under `pre-utn.profiles.v1`. | Per-student keys. | Preserves `pre-utn.practice.v1` compatibility and keeps storage topology hidden from call sites. |
| Blocking | Both UI gate and adapter-level no-op with explicit result. | UI-only gate. | UI should make invalid paths impossible, but adapters are the invariant boundary. |
| UI placement | Home gate/chrome lives in `HomeNextStepClient`; top-bar chip in `Nav`. | New routes or account flow. | Existing surfaces are client components already; no login/account/admin language is introduced. |

## Data Flow

```text
Home/Practice/Diagnostic ──→ useActiveStudent ──→ student-profile-storage
          │                         │
          └──→ progress/diagnostic adapters ──→ localStorage central maps
                                    │
                             pure domain reducers/view-models
```

Migration runs lazily on adapter load: if legacy global payloads exist and profiles do not, create one `Alumno local`, re-key practice/diagnostic/study-plan data under the same generated `studentId`, set active id, and persist. Re-running sees map/profile state and does nothing. Corrupt JSON returns empty/null and does not throw.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/student-profile/index.ts` | Create | `StudentProfile`, validation, normalization, id creation, active selection, `lastActiveAt` update. |
| `src/domain/progress/index.ts` | Modify | Add `studentId?: string`; pure reducers keep ignoring identity and operate on supplied slices. |
| `src/lib/student-profile-storage.ts` | Create | Profile adapter and legacy migration coordinator. |
| `src/lib/practice-progress.ts` | Modify | Central-map storage, active-student loading, blocked `addAttempt`, legacy normalization. |
| `src/lib/diagnostic-storage.ts` | Modify | Per-student diagnostic/study-plan maps and blocked saves. |
| `src/hooks/useActiveStudent.ts` | Create | Client hook for active profile, create, switch, refresh. |
| `src/components/StudentGate.tsx` | Create | Shared identification card/form. |
| `src/components/home/StudentSwitcher.tsx` | Create | `Cambiar alumno`: activate existing or create new; no delete. |
| `src/components/home/HomeNextStepClient.tsx` | Modify | Gate no-profile state, active display, per-student progress reload. |
| `src/components/Nav.tsx` | Modify | Top-bar chip: `Alumno activo: {displayName}`. |
| `src/app/practice/usePracticeFlow.ts`, `src/app/practice/page.tsx`, `src/app/diagnostic/page.tsx` | Modify | Gate actions and reload active-student data; no direct `localStorage`. |

## Interfaces / Contracts

```ts
type ProfileSaveResult = { ok: true; state: ProfilesState } | { ok: false; reason: "storage-unavailable" | "profile-not-found" };
type PersistenceResult<T> = { ok: true; value: T } | { ok: false; reason: "missing-active-profile" };

loadProfiles(): ProfilesState;
saveProfiles(state: ProfilesState): ProfileSaveResult;
recoverActiveProfile(): StudentProfile | null;
createProfileAndActivate(input: CreateProfileInput): ProfileSaveResult;
setActiveStudentId(id: string): ProfileSaveResult;

loadProgress(): PracticeProgress;
addAttempt(attempt: PracticeAttempt): PersistenceResult<PracticeProgress>;
saveDiagnosticResult(result: DiagnosticResult): PersistenceResult<void>;
saveStudyPlan(plan: StudyPlan): PersistenceResult<void>;
```

Storage keys stay `pre-utn.practice.v1`, `pre-utn.diagnostic.v1`, `pre-utn.study-plan.v1`, plus `pre-utn.profiles.v1`. UI copy must avoid login/account/admin/Supabase language; the Home no-profile card uses the spec’s exact copy, and active state shows `Estás estudiando como {displayName}` plus `Cambiar alumno`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Unit/domain | Profile validation, id opacity, selection, immutability; progress reducers ignore identity. | Vitest, pure TDD. |
| Adapter/migration | Legacy/global→map migration, idempotency, corrupt JSON, blocked writes, active-slice loads. | Vitest with existing localStorage mock pattern. |
| UI integration | Gate copy, active labels, switcher no-delete, no forbidden language, no direct `localStorage` call sites. | Existing source-inspection tests plus focused component/hook tests; verify with `pnpm run test`, `pnpm run typecheck`, `pnpm run build`. |

## Migration / Rollout

No backend migration. Browser migration is lazy, idempotent, and local-only. Legacy global data is preserved in-place only after a valid mapped payload exists. Future Supabase adapters can map `profiles`, `practice_attempts`, `diagnostic_results`, and `study_plans` tables behind the same APIs; `/docente` can consume already-attributed records. Do not couple domain or UI to Supabase ids, Auth sessions, RLS policies, teacher routes, or account terminology now.

## Review Boundary Forecast

Recommend two PRs: PR-1 domain/storage/migration TDD; PR-2 UI gate/switcher/wiring. 400-line budget risk: Medium if combined, Low when split.

## Open Questions

- [ ] None blocking.
