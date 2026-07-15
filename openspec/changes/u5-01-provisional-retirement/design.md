# Design: U5-01 Provisional Retirement — FocusSelector Availability Correction

## Technical Approach

Keep the completed static retirement intact and correct only the practice selector's presentation of its intentional empty Unit 5. `FocusSelector` derives a unit's availability from the active skill count in its existing `SKILLS_BY_UNIT` map; it does not introduce a U5 flag, content, or persistence state. This complements the zero-skill/zero-threshold contracts in the U5-01 delta specs.

## Architecture Decisions

| Decision | Options / trade-off | Choice and rationale |
|---|---|---|
| Source of availability | Hard-coded U5 exception is simple but would drift when content changes. | `SKILLS_BY_UNIT[unit].length > 0`; the selector automatically re-enables a unit when active skills are later added. |
| Empty-unit UI | Hide Unit 5, or permit selection and render an empty list. | Keep it visible as `Unidad 5 — Próximamente`, disabled, and never render an empty skill list. Visibility communicates the curriculum without a dead end. |
| Disabled semantics | Styling alone, or native control semantics. | Native disabled `<option>` plus `aria-disabled="true"` and muted/cursor-not-allowed visual treatment. Native disablement prevents mouse and keyboard selection. |
| Invalid/stale selection | Start a theory flow with no skills, or silently clear it. | Return to the selector and display exactly: `Unidad 5 todavía no está disponible. Estamos preparando sus contenidos.` This covers a persisted/in-memory or direct unit selection without an empty list or practice transition. |

## Data Flow

```text
UNIT_*_SKILLS ──> SKILLS_BY_UNIT ──> active skill count ──> unit option state
                                                        ├─ available → skill list
                                                        └─ zero → disabled + Próximamente
direct/stale unit selection ───────────────────────────> unavailable fallback banner → selector
```

The availability calculation is render-derived, not copied into React state. If a future catalog supplies skills for Unit 5, its option becomes selectable on the next render and the normal existing skill-readiness/prerequisite behavior applies.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/components/practice/FocusSelector.tsx` | Modify | Derive unit availability, label/disable zero-skill options, guard stale selection, and suppress the empty list. |
| `src/components/practice/PracticeSelectPhase.tsx` | Modify | Thread the unavailable-unit fallback only if needed by the existing selector boundary. |
| `src/app/practice/usePracticeFlow.ts` | Modify | Reject a direct or retained unavailable unit before `handleSkillSelect`; do not persist, migrate, or mutate progress. |
| `src/app/practice/page.tsx` | Modify | Render the exact unavailable-unit fallback with the existing blocked-selection presentation. |
| `src/components/practice/__tests__/FocusSelector.test.ts` | Modify | Add RED/GREEN coverage for count-derived availability, native/ARIA disabled state, `Próximamente`, no selection, no empty list, and automatic re-enable. |
| `src/app/practice/__tests__/start-skill.test.ts` | Modify | Add RED/GREEN coverage for direct/stale unavailable-unit fallback and its exact Spanish message contract. |

## Interfaces / Contracts

```ts
type UnitAvailability = { readonly available: boolean; readonly activeSkillCount: number };
// available === activeSkillCount > 0
```

No domain model, catalog export, URL format, localStorage schema, Supabase interface, or SQL contract changes. Existing per-skill readiness remains separate from unit availability.

## Testing Strategy

| Layer | What to test | Approach |
|---|---|---|
| Component | Unit 5 remains visible, disabled, ARIA-described, visually unavailable, and labelled `Próximamente`; selecting it cannot invoke `onSkillSelect` or expose an empty list. | RED tests first, then Vitest component/source tests following the repository harness. |
| Flow | Direct or retained unavailable unit returns to selection with exactly `Unidad 5 todavía no está disponible. Estamos preparando sus contenidos.` | RED tests for the guard and banner contract; confirm no theory phase or empty exercise list. |
| Regression | A non-empty unit remains selectable; injecting/restoring U5 active skills enables it automatically. | Focused Vitest tests, then `pnpm run test`, `pnpm run typecheck`, and `pnpm run build`. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. The existing `?skill=` path is a UI input validation case, not a routing change.

## Retirement Constraints Preserved

The exact six-skill/five-exercise retirement remains exact-string-only. Do not restore provisional IDs, canonical U5 content, aliases, mappings, U3/U5-02 work, archived U5-00, SQL, migrations, sidecars, markers, write gates, adapters, remote schemas, stored-data transforms, or persistence behavior. Retain synthetic fixtures. This is limited to `FocusSelector` availability and its minimum direct/stale-selection fallback; it is not a general practice-flow redesign.

## Migration / Rollout

No migration required. There is no supported persisted unit-selection value today; any stale in-memory or future persisted/direct value follows the fallback without writing or transforming data.

## Open Questions

None.
